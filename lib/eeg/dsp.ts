// ── DSP pipeline ported from eeg_server.py ───────────────────────────────────
// clean() → welch PSD → band power + SEF95

import { fftInPlace, nextPow2 } from "./fft";
import type { BandPowers } from "./types";

export const BANDS = {
  delta:    [1.0,  4.0],
  theta:    [4.0,  7.5],
  alpha:    [8.0, 13.0],
  beta:     [13.0, 30.0],
  highBeta: [20.0, 30.0], // stress sub-band
} as const;

// ── Biquad utilities ────────────────────────────────────────────────────────

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

// Direct-Form II Transposed biquad state
type BiquadState = { s1: number; s2: number };

function processBiquad(x: number, q: Biquad, s: BiquadState): number {
  const y = q.b0 * x + s.s1;
  s.s1 = q.b1 * x - q.a1 * y + s.s2;
  s.s2 = q.b2 * x - q.a2 * y;
  return y;
}

function runBiquadChain(signal: Float64Array, chain: Biquad[]): Float64Array {
  const out = new Float64Array(signal.length);
  const states: BiquadState[] = chain.map(() => ({ s1: 0, s2: 0 }));
  for (let i = 0; i < signal.length; i++) {
    let v = signal[i];
    for (let k = 0; k < chain.length; k++) {
      v = processBiquad(v, chain[k], states[k]);
    }
    out[i] = v;
  }
  return out;
}

// ── IIR notch filter (matches scipy.signal.iirnotch with Q=35) ──────────────
// Reference: scipy iirnotch formula
function designNotch(f0Hz: number, Q: number, fs: number): Biquad {
  const w0 = 2 * Math.PI * (f0Hz / fs);
  const bw = w0 / Q;
  const alpha = Math.tan(bw / 2);
  const b0 = 1 / (1 + alpha);
  const b1 = -2 * Math.cos(w0) / (1 + alpha);
  const b2 = 1 / (1 + alpha);
  const a1 = -2 * Math.cos(w0) / (1 + alpha);
  const a2 = (1 - alpha) / (1 + alpha);
  return { b0, b1, b2, a1, a2 };
}

// ── 4th-order Butterworth bandpass via cascaded biquads ─────────────────────
// Implements a standard bilinear-transform design; N=4 → 2 biquad sections.
function designButterBandpass(lowHz: number, highHz: number, fs: number): Biquad[] {
  // Pre-warp
  const nyq = fs * 0.5;
  const low = lowHz / nyq;
  const high = Math.min(highHz, nyq - 1) / nyq;
  const fLow = Math.tan(Math.PI * low / 2);
  const fHigh = Math.tan(Math.PI * high / 2);
  const bw = fHigh - fLow;
  const f0 = Math.sqrt(fLow * fHigh);

  // 4th-order Butterworth poles (N=2 per lowpass prototype → 2 bandpass biquads when transformed)
  // Simpler reliable approach: use two cascaded 2nd-order Butterworth bandpass sections
  // with slight Q variation to approximate the 4th-order response.
  const Q1 = f0 / bw * 1.306563; // pole pair 1
  const Q2 = f0 / bw * 0.541196; // pole pair 2

  const makeBP = (f0n: number, Q: number): Biquad => {
    const w0 = 2 * Math.atan(f0n); // back to digital
    const alpha = Math.sin(w0) / (2 * Q);
    const b0 = alpha;
    const b1 = 0;
    const b2 = -alpha;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha;
    return { b0: b0/a0, b1: b1/a0, b2: b2/a0, a1: a1/a0, a2: a2/a0 };
  };

  return [makeBP(f0, Q1), makeBP(f0, Q2)];
}

// ── clean(): detrend + notch + bandpass ─────────────────────────────────────
export function clean(input: Float32Array, fs: number, notchHz: 50 | 60 = 50): Float64Array {
  const n = input.length;
  const x = new Float64Array(n);

  // Remove DC + linear trend (simple polyfit degree 1)
  let sumT = 0, sumTT = 0, sumX = 0, sumTX = 0;
  for (let i = 0; i < n; i++) {
    sumT += i;
    sumTT += i * i;
    sumX += input[i];
    sumTX += i * input[i];
  }
  const denom = n * sumTT - sumT * sumT;
  const slope = denom !== 0 ? (n * sumTX - sumT * sumX) / denom : 0;
  const intercept = (sumX - slope * sumT) / n;
  for (let i = 0; i < n; i++) x[i] = input[i] - (slope * i + intercept);

  // Notch
  if (notchHz / (fs * 0.5) < 1) {
    const notch = designNotch(notchHz, 35, fs);
    const notchState: BiquadState = { s1: 0, s2: 0 };
    for (let i = 0; i < n; i++) x[i] = processBiquad(x[i], notch, notchState);
  }

  // Bandpass 1–40Hz
  const chain = designButterBandpass(1.0, 40.0, fs);
  return runBiquadChain(x, chain);
}

// ── Welch PSD ───────────────────────────────────────────────────────────────
/**
 * Welch PSD with Hann window, 50% overlap.
 * Returns { freqs, psd } where psd is one-sided, scaled to V²/Hz.
 */
export function welch(
  signal: Float64Array,
  fs: number,
  nperseg?: number
): { freqs: Float64Array; psd: Float64Array } {
  const N = signal.length;
  const seg = Math.min(N, nperseg ?? Math.floor(fs * 2));
  const nfft = nextPow2(seg);
  const nOverlap = Math.floor(seg / 2);
  const step = seg - nOverlap;

  // Hann window
  const win = new Float64Array(seg);
  let winSumSq = 0;
  for (let i = 0; i < seg; i++) {
    win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (seg - 1)));
    winSumSq += win[i] * win[i];
  }
  const scale = 1 / (fs * winSumSq);

  const nSegs = Math.max(1, Math.floor((N - seg) / step) + 1);
  const halfN = (nfft >> 1) + 1;
  const psd = new Float64Array(halfN);

  const re = new Float64Array(nfft);
  const im = new Float64Array(nfft);

  for (let s = 0; s < nSegs; s++) {
    const off = s * step;
    // Detrend linear within segment (matches scipy welch detrend='linear')
    let sumT = 0, sumTT = 0, sumX = 0, sumTX = 0;
    for (let i = 0; i < seg; i++) {
      const v = signal[off + i];
      sumT += i;
      sumTT += i * i;
      sumX += v;
      sumTX += i * v;
    }
    const denom = seg * sumTT - sumT * sumT;
    const slope = denom !== 0 ? (seg * sumTX - sumT * sumX) / denom : 0;
    const intercept = (sumX - slope * sumT) / seg;

    // Fill buffers
    re.fill(0);
    im.fill(0);
    for (let i = 0; i < seg; i++) {
      re[i] = (signal[off + i] - (slope * i + intercept)) * win[i];
    }
    fftInPlace(re, im);
    for (let k = 0; k < halfN; k++) {
      const mag2 = re[k] * re[k] + im[k] * im[k];
      // One-sided: double interior bins
      const factor = (k === 0 || k === halfN - 1) ? 1 : 2;
      psd[k] += mag2 * scale * factor;
    }
  }
  for (let k = 0; k < halfN; k++) psd[k] /= nSegs;

  const freqs = new Float64Array(halfN);
  for (let k = 0; k < halfN; k++) freqs[k] = (k * fs) / nfft;
  return { freqs, psd };
}

// ── Trapezoidal band integration ────────────────────────────────────────────
function trapzBand(freqs: Float64Array, psd: Float64Array, lo: number, hi: number): number {
  let acc = 0;
  for (let i = 0; i < freqs.length - 1; i++) {
    if (freqs[i + 1] < lo || freqs[i] > hi) continue;
    const f0 = Math.max(freqs[i], lo);
    const f1 = Math.min(freqs[i + 1], hi);
    if (f1 <= f0) continue;
    // Linear interp psd at edges
    const t0 = (f0 - freqs[i]) / (freqs[i + 1] - freqs[i]);
    const t1 = (f1 - freqs[i]) / (freqs[i + 1] - freqs[i]);
    const p0 = psd[i] + (psd[i + 1] - psd[i]) * t0;
    const p1 = psd[i] + (psd[i + 1] - psd[i]) * t1;
    acc += ((p0 + p1) * 0.5) * (f1 - f0);
  }
  return acc;
}

// ── psdBands() + SEF95 (matches psd_bands in eeg_server.py) ─────────────────
export function psdBands(signal: Float64Array, fs: number): BandPowers & { sef95: number } {
  const { freqs, psd } = welch(signal, fs);
  const eps = 1e-9;
  const delta    = Math.max(trapzBand(freqs, psd, BANDS.delta[0],    BANDS.delta[1]), eps);
  const theta    = Math.max(trapzBand(freqs, psd, BANDS.theta[0],    BANDS.theta[1]), eps);
  const alpha    = Math.max(trapzBand(freqs, psd, BANDS.alpha[0],    BANDS.alpha[1]), eps);
  const beta     = Math.max(trapzBand(freqs, psd, BANDS.beta[0],     BANDS.beta[1]),  eps);
  const highBeta = Math.max(trapzBand(freqs, psd, BANDS.highBeta[0], BANDS.highBeta[1]), eps);

  // SEF95: first frequency where cumulative PSD reaches 95% of total
  let total = 0;
  for (let i = 0; i < freqs.length - 1; i++) {
    total += (psd[i] + psd[i + 1]) * 0.5 * (freqs[i + 1] - freqs[i]);
  }
  total = Math.max(total, eps);
  let cum = 0;
  let sef95 = freqs[freqs.length - 1];
  for (let i = 0; i < freqs.length - 1; i++) {
    cum += (psd[i] + psd[i + 1]) * 0.5 * (freqs[i + 1] - freqs[i]);
    if (cum / total >= 0.95) { sef95 = freqs[i + 1]; break; }
  }

  return { delta, theta, alpha, beta, highBeta, sef95 };
}

// ── Feature vector (matches feature_vec in eeg_server.py) ──────────────────
export function featureVec(
  ch2: BandPowers & { sef95: number },
  ch1: BandPowers & { sef95: number },
  diff: BandPowers & { sef95: number }
): Float64Array {
  const eps = 1e-9;
  const _feats = (p: BandPowers & { sef95: number }): number[] => {
    const a = Math.max(p.alpha, eps);
    const t = Math.max(p.theta, eps);
    const b = Math.max(p.beta, eps);
    const hb = Math.max(p.highBeta, eps);
    const d = Math.max(p.delta, eps);
    const total = a + t + b + d + eps;
    return [
      a / total,
      t / total,
      b / total,
      hb / total,
      b / a,
      t / a,
      a / (t + b + eps),
      Math.log1p(b / a),
      p.sef95,
    ];
  };
  const f2 = _feats(ch2);
  const f1 = _feats(ch1);
  const fd = _feats(diff);
  const aAsym = (ch2.alpha - ch1.alpha) / (ch2.alpha + ch1.alpha + eps);
  const bAsym = (ch2.beta - ch1.beta) / (ch2.beta + ch1.beta + eps);
  const out = new Float64Array(f2.length + f1.length + fd.length + 2);
  let idx = 0;
  for (const v of f2) out[idx++] = v;
  for (const v of f1) out[idx++] = v;
  for (const v of fd) out[idx++] = v;
  out[idx++] = aAsym;
  out[idx++] = bAsym;
  return out;
}

// ── Differential signal (ch2 - ch1) ─────────────────────────────────────────
export function differential(ch2: Float64Array, ch1: Float64Array): Float64Array {
  const n = Math.min(ch1.length, ch2.length);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = ch2[i] - ch1[i];
  return out;
}

// ── RMS per channel (signal quality proxy) ──────────────────────────────────
export function rms(signal: Float32Array): number {
  let sumSq = 0;
  for (let i = 0; i < signal.length; i++) sumSq += signal[i] * signal[i];
  return Math.sqrt(sumSq / Math.max(1, signal.length));
}
