// ── OpenBCI Ganglion Web Bluetooth driver ────────────────────────────────────
// Reference: BrainFlow ganglion_ble.cpp + OpenBCI Ganglion SDK docs
// Packet format (20 bytes):
//   byte 0: packet ID (0 = uncompressed; 1..100 = 19-bit compressed; 101..200 = 18-bit compressed)
//   remaining 19 bytes: payload
// For packet ID 0: 4 channels × 24-bit signed, MSB first (12 bytes), remainder ignored (timestamps etc)
// For IDs 1..100: two frames of 4 channels × 19-bit signed delta compressed, relative to last uncompressed
// For IDs 101..200: two frames of 4 channels × 18-bit signed delta compressed
// Scale factor: 1.2 / (8388607 * 1.5) volts per count = ~9.5367e-8 V = 0.95367 µV per count

import { DeviceDriver } from "./base";

type BTDevice = {
  name?: string;
  gatt?: BTGATTServer;
  addEventListener: (t: string, fn: () => void) => void;
};
type BTGATTServer = {
  connected: boolean;
  connect: () => Promise<BTGATTServer>;
  disconnect: () => void;
  getPrimaryService: (uuid: string) => Promise<BTGATTService>;
};
type BTGATTService = {
  getCharacteristic: (uuid: string) => Promise<BTGATTChar>;
};
type BTGATTChar = {
  value?: DataView;
  writeValue: (data: BufferSource) => Promise<void>;
  writeValueWithoutResponse?: (data: BufferSource) => Promise<void>;
  startNotifications: () => Promise<BTGATTChar>;
  addEventListener: (t: string, fn: (evt: { target: BTGATTChar }) => void) => void;
};

const GANGLION_SERVICE = "0000fe84-0000-1000-8000-00805f9b34fb";
const SEND_CHAR    = "2d30c082-f39f-4ce6-923f-3484ea480596";
const RECEIVE_CHAR = "2d30c083-f39f-4ce6-923f-3484ea480596";

// Scale factor (volts per count) → multiply by 1e6 for µV
const SCALE_UV = (1.2 / (8388607 * 1.5)) * 1e6;

export class GanglionDriver extends DeviceDriver {
  readonly driverId = "ganglion" as const;
  readonly name = "Aora Nano";
  readonly sampleRate = 200;
  readonly channelCount = 4;
  readonly channelLabels = ["CH1", "CH2", "CH3", "CH4"];

  private device: BTDevice | null = null;
  private server: BTGATTServer | null = null;
  private sendChar: BTGATTChar | null = null;

  // Last uncompressed sample per channel (in µV)
  private lastSample: Float32Array = new Float32Array(4);
  private haveReference = false;

  async connect(): Promise<void> {
    const bt = (navigator as any).bluetooth;
    if (!bt) throw new Error("Web Bluetooth not available in this browser");
    this.setStatus("connecting");

    try {
      this.device = await bt.requestDevice({
        filters: [
          { services: [GANGLION_SERVICE] },
          { namePrefix: "Ganglion" },
        ],
        optionalServices: [GANGLION_SERVICE],
      });
      if (!this.device?.gatt) throw new Error("No GATT on device");
      this.device.addEventListener("gattserverdisconnected", () => {
        this.setStatus("lost");
      });

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(GANGLION_SERVICE);

      this.sendChar = await service.getCharacteristic(SEND_CHAR);
      const rxChar = await service.getCharacteristic(RECEIVE_CHAR);
      await rxChar.startNotifications();
      rxChar.addEventListener("characteristicvaluechanged", (evt: any) => {
        this.onPacket(evt.target.value as DataView);
      });

      // Start streaming
      await this.sendCmd("b");
      this.setStatus("connected");
    } catch (e) {
      this.setStatus("disconnected");
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.sendChar) await this.sendCmd("s");
    } catch {}
    try {
      this.server?.disconnect();
    } catch {}
    this.server = null;
    this.device = null;
    this.sendChar = null;
    this.haveReference = false;
    this.setStatus("disconnected");
  }

  private async sendCmd(cmd: string): Promise<void> {
    if (!this.sendChar) return;
    const bytes = new Uint8Array(cmd.length);
    for (let i = 0; i < cmd.length; i++) bytes[i] = cmd.charCodeAt(i);
    if (this.sendChar.writeValueWithoutResponse) {
      await this.sendChar.writeValueWithoutResponse(bytes);
    } else {
      await this.sendChar.writeValue(bytes);
    }
  }

  // ── Bit extractor (MSB-first) ────────────────────────────────────────────
  private extractBits(src: Uint8Array, offsetBytes: number, bitStart: number, nBits: number): number {
    // Extract `nBits` bits starting at the given bit position.
    let result = 0;
    for (let i = 0; i < nBits; i++) {
      const bitIdx = bitStart + i;
      const byte = src[offsetBytes + (bitIdx >> 3)];
      const bit = (byte >> (7 - (bitIdx & 7))) & 1;
      result = (result << 1) | bit;
    }
    return result;
  }

  // Sign-extend `nBits`-wide integer
  private signExtend(val: number, nBits: number): number {
    const sign = 1 << (nBits - 1);
    return (val & sign) ? val - (1 << nBits) : val;
  }

  // ── Packet handler ───────────────────────────────────────────────────────
  private onPacket(dv: DataView) {
    if (dv.byteLength < 1) return;
    const id = dv.getUint8(0);
    const payload = new Uint8Array(dv.buffer, dv.byteOffset + 1, dv.byteLength - 1);

    if (id === 0) {
      // Uncompressed: 4 × 24-bit signed, MSB first
      if (payload.length < 12) return;
      const s = new Float32Array(4);
      for (let ch = 0; ch < 4; ch++) {
        const b0 = payload[ch * 3];
        const b1 = payload[ch * 3 + 1];
        const b2 = payload[ch * 3 + 2];
        let v = (b0 << 16) | (b1 << 8) | b2;
        // Sign-extend 24-bit
        if (v & 0x800000) v |= 0xff000000;
        // v is int32 now
        s[ch] = (v | 0) * SCALE_UV;
      }
      for (let ch = 0; ch < 4; ch++) this.lastSample[ch] = s[ch];
      this.haveReference = true;
      // Emit single-sample frame
      this.emitPerChannelFrame(s);
      return;
    }

    if (!this.haveReference) {
      // Can't decode deltas until we get a reference packet
      return;
    }

    // Compressed: 19-bit (IDs 1..100) or 18-bit (IDs 101..200)
    const bitsPerSample = id <= 100 ? 19 : 18;
    // Two frames of 4 samples each per packet → 8 deltas total
    // 19-bit × 8 = 152 bits = 19 bytes (fits payload)
    // 18-bit × 8 = 144 bits = 18 bytes
    const totalBits = bitsPerSample * 8;
    if (payload.length * 8 < totalBits) return;

    const deltas = new Int32Array(8);
    for (let i = 0; i < 8; i++) {
      const raw = this.extractBits(payload, 0, i * bitsPerSample, bitsPerSample);
      deltas[i] = this.signExtend(raw, bitsPerSample);
    }

    // Reconstruct 2 frames
    const frame1 = new Float32Array(4);
    const frame2 = new Float32Array(4);
    for (let ch = 0; ch < 4; ch++) {
      // First frame relative to lastSample
      const v1 = this.lastSample[ch] + deltas[ch] * SCALE_UV;
      frame1[ch] = v1;
      this.lastSample[ch] = v1;
    }
    for (let ch = 0; ch < 4; ch++) {
      const v2 = this.lastSample[ch] + deltas[ch + 4] * SCALE_UV;
      frame2[ch] = v2;
      this.lastSample[ch] = v2;
    }

    // Emit frame1 then frame2 as two 1-sample-per-channel updates
    this.emitPerChannelFrame(frame1);
    this.emitPerChannelFrame(frame2);
  }

  // Turn a 4-element snapshot into the ChannelSamples shape (one sample per channel)
  private emitPerChannelFrame(snapshot: Float32Array) {
    const ch: Float32Array[] = new Array(4);
    for (let i = 0; i < 4; i++) {
      const a = new Float32Array(1);
      a[0] = snapshot[i];
      ch[i] = a;
    }
    this.emitSamples(ch);
  }
}
