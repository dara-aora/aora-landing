// ── Muse 2 / Muse S Web Bluetooth driver ─────────────────────────────────────
// References:
//   - muse-js: https://github.com/urish/muse-js (MIT)
//   - Muse LSL protocol docs
// Supports Muse 2 and Muse S (both 4-channel EEG @ 256Hz).

import { DeviceDriver } from "./base";
import type { ChannelSamples } from "../types";

// Minimal Web Bluetooth type shims (avoids requiring dom lib types)
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
  startNotifications: () => Promise<BTGATTChar>;
  addEventListener: (t: string, fn: (evt: { target: BTGATTChar }) => void) => void;
};

// ── Muse UUIDs ──────────────────────────────────────────────────────────────
const MUSE_SERVICE = "0000fe8d-0000-1000-8000-00805f9b34fb";
const CONTROL_CHAR = "273e0001-4c4d-454d-96be-f03bac821358";
// EEG channels: TP9, AF7, AF8, TP10, AUX
const EEG_CHARS = [
  "273e0003-4c4d-454d-96be-f03bac821358", // TP9
  "273e0004-4c4d-454d-96be-f03bac821358", // AF7
  "273e0005-4c4d-454d-96be-f03bac821358", // AF8
  "273e0006-4c4d-454d-96be-f03bac821358", // TP10
];
const TELEMETRY_CHAR = "273e000b-4c4d-454d-96be-f03bac821358";

// Conversion: raw 12-bit → µV
// Scale factor per muse-js: (1.0 / 4095.0 * 2 * 1000 * 1.5) ≈ 0.48828125 per step
// The formula used widely: (v - 0x800) * 0.48828125
const MUSE_SCALE = 0.48828125;

export class MuseDriver extends DeviceDriver {
  readonly driverId = "muse" as const;
  readonly name = "Aora Beta";
  readonly sampleRate = 256;
  readonly channelCount = 4;
  readonly channelLabels = ["TP9", "AF7", "AF8", "TP10"];

  private device: BTDevice | null = null;
  private server: BTGATTServer | null = null;
  private controlChar: BTGATTChar | null = null;

  // Per-packet packet-id tracking
  private lastPacketId: (number | null)[] = [null, null, null, null];
  // Per-channel packet buffer (12 samples per BLE packet)
  // We emit 4 parallel Float32Arrays of length 12 every time all 4 channels
  // have received the same packet id.
  private pendingSamples: (Float32Array | null)[] = [null, null, null, null];
  private pendingId: number | null = null;

  async connect(): Promise<void> {
    const bt = (navigator as any).bluetooth;
    if (!bt) throw new Error("Web Bluetooth not available in this browser");
    this.setStatus("connecting");

    try {
      this.device = await bt.requestDevice({
        filters: [{ services: [MUSE_SERVICE] }, { namePrefix: "Muse" }],
        optionalServices: [MUSE_SERVICE],
      });
      if (!this.device?.gatt) throw new Error("No GATT on device");
      this.device.addEventListener("gattserverdisconnected", () => {
        this.setStatus("lost");
      });

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(MUSE_SERVICE);

      // Control characteristic
      this.controlChar = await service.getCharacteristic(CONTROL_CHAR);

      // Subscribe to 4 EEG channels
      for (let ch = 0; ch < EEG_CHARS.length; ch++) {
        const c = await service.getCharacteristic(EEG_CHARS[ch]);
        await c.startNotifications();
        c.addEventListener("characteristicvaluechanged", (evt: any) => {
          this.onEegPacket(ch, evt.target.value as DataView);
        });
      }

      // Telemetry (battery)
      try {
        const tele = await service.getCharacteristic(TELEMETRY_CHAR);
        await tele.startNotifications();
        tele.addEventListener("characteristicvaluechanged", (evt: any) => {
          this.onTelemetry(evt.target.value as DataView);
        });
      } catch {
        // Optional: some firmwares may not expose it
      }

      // Send commands: halt, select preset p50 (EEG only), start
      await this.sendCmd("h");
      await this.sendCmd("p50");
      await this.sendCmd("s");    // ask for status (ignored response)
      await this.sendCmd("d");    // start streaming

      this.setStatus("connected");
    } catch (e) {
      this.setStatus("disconnected");
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.controlChar) await this.sendCmd("h");
    } catch {}
    try {
      this.server?.disconnect();
    } catch {}
    this.server = null;
    this.device = null;
    this.controlChar = null;
    this.lastPacketId = [null, null, null, null];
    this.pendingSamples = [null, null, null, null];
    this.pendingId = null;
    this.setStatus("disconnected");
  }

  private async sendCmd(cmd: string): Promise<void> {
    if (!this.controlChar) return;
    const bytes = new Uint8Array(cmd.length + 2);
    bytes[0] = cmd.length + 1;
    for (let i = 0; i < cmd.length; i++) bytes[i + 1] = cmd.charCodeAt(i);
    bytes[cmd.length + 1] = 0x0a; // newline
    await this.controlChar.writeValue(bytes);
  }

  // ── Packet decode ────────────────────────────────────────────────────────
  // Format (20 bytes): uint16 be packetIndex, then 12 samples × 12 bits packed.
  private onEegPacket(channel: number, dv: DataView) {
    if (dv.byteLength < 20) return;
    const id = dv.getUint16(0, false);
    const samples = new Float32Array(12);
    // 12 samples × 12 bits = 144 bits = 18 bytes, starting at byte 2
    // Bit-unpacking MSB-first
    let bitOffset = 0;
    for (let s = 0; s < 12; s++) {
      // Read 12 bits starting at bitOffset (relative to byte 2)
      const byteIdx = 2 + (bitOffset >> 3);
      const bitIdx = bitOffset & 7;
      // Collect up to 3 bytes
      const b0 = dv.getUint8(byteIdx);
      const b1 = byteIdx + 1 < dv.byteLength ? dv.getUint8(byteIdx + 1) : 0;
      const b2 = byteIdx + 2 < dv.byteLength ? dv.getUint8(byteIdx + 2) : 0;
      const combined = (b0 << 16) | (b1 << 8) | b2;
      const shift = 24 - 12 - bitIdx;
      const val = (combined >> shift) & 0xfff;
      samples[s] = (val - 0x800) * MUSE_SCALE;
      bitOffset += 12;
    }

    this.lastPacketId[channel] = id;

    // Start a new pending frame if needed
    if (this.pendingId === null || id !== this.pendingId) {
      // Flush any previous partial (dropped packet)
      this.flushPending();
      this.pendingId = id;
    }
    this.pendingSamples[channel] = samples;

    // If all 4 channels have data for the current id, emit
    if (this.pendingSamples.every(s => s !== null)) {
      const out = this.pendingSamples.map(s => s as Float32Array);
      this.pendingSamples = [null, null, null, null];
      this.pendingId = null;
      this.emitSamples(out);
    }
  }

  private flushPending() {
    this.pendingSamples = [null, null, null, null];
    this.pendingId = null;
  }

  private onTelemetry(dv: DataView) {
    if (dv.byteLength < 6) return;
    // byte 0: seq, bytes 2-3: battery percent * 512 (muse-js)
    const batt = dv.getUint16(2, false) / 512;
    this.emitBattery(Math.max(0, Math.min(100, batt)));
  }
}
