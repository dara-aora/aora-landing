// ── Cooley–Tukey radix-2 FFT (real input) ────────────────────────────────────
// Pure TS, no deps. Used for Welch PSD in dsp.ts.

/**
 * In-place radix-2 FFT. Length must be a power of two.
 * re/im are Float64Array of equal length N.
 */
export function fftInPlace(re: Float64Array, im: Float64Array): void {
  const N = re.length;
  if ((N & (N - 1)) !== 0) {
    throw new Error("fftInPlace requires power-of-two length, got " + N);
  }
  // Bit-reversal permutation
  let j = 0;
  for (let i = 1; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let tmp = re[i]; re[i] = re[j]; re[j] = tmp;
      tmp = im[i];     im[i] = im[j]; im[j] = tmp;
    }
  }
  // Cooley–Tukey
  for (let len = 2; len <= N; len <<= 1) {
    const half = len >> 1;
    const theta = -2 * Math.PI / len;
    const wReUnit = Math.cos(theta);
    const wImUnit = Math.sin(theta);
    for (let i = 0; i < N; i += len) {
      let wRe = 1, wIm = 0;
      for (let k = 0; k < half; k++) {
        const aRe = re[i + k], aIm = im[i + k];
        const bRe = re[i + k + half], bIm = im[i + k + half];
        const tRe = bRe * wRe - bIm * wIm;
        const tIm = bRe * wIm + bIm * wRe;
        re[i + k] = aRe + tRe;
        im[i + k] = aIm + tIm;
        re[i + k + half] = aRe - tRe;
        im[i + k + half] = aIm - tIm;
        // w *= wUnit
        const nwRe = wRe * wReUnit - wIm * wImUnit;
        const nwIm = wRe * wImUnit + wIm * wReUnit;
        wRe = nwRe; wIm = nwIm;
      }
    }
  }
}

/** Next power-of-two ≥ n */
export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}
