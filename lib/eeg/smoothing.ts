// ── EWMA + median buffer, mirrors eeg_server.py ──────────────────────────────

export class EWMA {
  private v: number | null = null;
  constructor(private alpha = 0.2) {}
  update(x: number): number {
    this.v = this.v === null ? x : this.alpha * x + (1 - this.alpha) * this.v;
    return this.v;
  }
  reset() { this.v = null; }
  value(): number { return this.v ?? 0; }
}

export class MedianBuf {
  private buf: number[] = [];
  constructor(private size = 7) {}
  update(x: number): number {
    this.buf.push(x);
    if (this.buf.length > this.size) this.buf.shift();
    const sorted = [...this.buf].sort((a, b) => a - b);
    const n = sorted.length;
    return n % 2 === 1 ? sorted[(n - 1) >> 1] : (sorted[n >> 1] + sorted[(n >> 1) - 1]) * 0.5;
  }
  reset() { this.buf = []; }
}
