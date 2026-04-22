// ── DeviceDriver interface + tiny event emitter ─────────────────────────────

import type { DriverStatus, DriverId, ChannelSamples } from "../types";

type SamplesCb = (channels: ChannelSamples) => void;
type StatusCb = (s: DriverStatus) => void;
type BatteryCb = (pct: number) => void;

export abstract class DeviceDriver {
  abstract readonly driverId: DriverId;
  abstract readonly name: string;
  abstract readonly sampleRate: number;
  abstract readonly channelCount: number;
  abstract readonly channelLabels: string[];

  protected sampleCbs = new Set<SamplesCb>();
  protected statusCbs = new Set<StatusCb>();
  protected batteryCbs = new Set<BatteryCb>();
  protected _status: DriverStatus = "disconnected";

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  isConnected(): boolean { return this._status === "connected"; }
  getStatus(): DriverStatus { return this._status; }

  onSamples(cb: SamplesCb): () => void {
    this.sampleCbs.add(cb);
    return () => this.sampleCbs.delete(cb);
  }
  onStatus(cb: StatusCb): () => void {
    this.statusCbs.add(cb);
    // Fire current status immediately
    try { cb(this._status); } catch {}
    return () => this.statusCbs.delete(cb);
  }
  onBattery(cb: BatteryCb): () => void {
    this.batteryCbs.add(cb);
    return () => this.batteryCbs.delete(cb);
  }

  protected emitSamples(ch: ChannelSamples) {
    this.sampleCbs.forEach(cb => { try { cb(ch); } catch (e) { console.error(e); } });
  }
  protected setStatus(s: DriverStatus) {
    if (this._status === s) return;
    this._status = s;
    this.statusCbs.forEach(cb => { try { cb(s); } catch (e) { console.error(e); } });
  }
  protected emitBattery(pct: number) {
    this.batteryCbs.forEach(cb => { try { cb(pct); } catch (e) { console.error(e); } });
  }
}

// ── Web Bluetooth availability ──────────────────────────────────────────────
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && !!(navigator as any).bluetooth;
}
