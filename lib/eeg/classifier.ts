// ── Calibration + Mahalanobis-like classifier (port of Calibration class) ────

import type { Scores, StateKey } from "./types";

export type Centroid = { mean: number[]; std: number[] };
export type Centroids = Record<StateKey, Centroid>;

export class Classifier {
  private data: Record<StateKey, number[][]> = {
    relaxation: [],
    concentration: [],
    stress: [],
  };
  private centroids: Centroids | null = null;

  addSample(state: StateKey, vec: Float64Array) {
    this.data[state].push(Array.from(vec));
  }

  finalize(): Centroids {
    const states: StateKey[] = ["relaxation", "concentration", "stress"];
    const out: Partial<Centroids> = {};
    for (const s of states) {
      const rows = this.data[s];
      if (rows.length === 0) {
        throw new Error(`No samples collected for state "${s}"`);
      }
      const dim = rows[0].length;
      const mean = new Array(dim).fill(0);
      for (const r of rows) for (let i = 0; i < dim; i++) mean[i] += r[i];
      for (let i = 0; i < dim; i++) mean[i] /= rows.length;
      const varr = new Array(dim).fill(0);
      for (const r of rows) {
        for (let i = 0; i < dim; i++) {
          const d = r[i] - mean[i];
          varr[i] += d * d;
        }
      }
      const std = varr.map(v => Math.sqrt(v / Math.max(1, rows.length)) + 1e-6);
      out[s] = { mean, std };
    }
    this.centroids = out as Centroids;
    return this.centroids;
  }

  loadCentroids(c: Centroids) {
    this.centroids = c;
  }

  get ready(): boolean {
    return this.centroids !== null;
  }

  classify(vec: Float64Array): Scores | null {
    if (!this.centroids) return null;
    const states: StateKey[] = ["relaxation", "concentration", "stress"];
    const d: number[] = [];
    for (const s of states) {
      const c = this.centroids[s];
      const dim = c.mean.length;
      let sumSq = 0;
      for (let i = 0; i < dim; i++) {
        const z = (vec[i] - c.mean[i]) / c.std[i];
        sumSq += z * z;
      }
      d.push(Math.sqrt(sumSq / dim));
    }
    const inv = d.map(v => Math.exp(-v * 1.5));
    const sum = inv.reduce((a, b) => a + b, 0) + 1e-9;
    return {
      relaxation:    inv[0] / sum,
      concentration: inv[1] / sum,
      stress:        inv[2] / sum,
    };
  }

  reset() {
    this.data = { relaxation: [], concentration: [], stress: [] };
  }
}

// ── Uncalibrated fallback scoring ───────────────────────────────────────────
// Derived from simple band ratios so visitors see something before cal finishes.
// This is ONLY used as a display placeholder before calibration; it's replaced
// by the real classifier output as soon as centroids exist.
export function unscaledScores(bp: { alpha: number; beta: number; theta: number; highBeta: number; delta: number }): Scores {
  const eps = 1e-9;
  const relax = bp.alpha / (bp.theta + bp.beta + eps);     // alpha dominance
  const focus = bp.theta / (bp.alpha + eps);               // theta/alpha
  const stress = bp.beta / (bp.alpha + eps);               // beta/alpha
  const raw = [relax, focus, stress];
  const max = Math.max(...raw, eps);
  const norm = raw.map(v => v / max);
  const sum = norm.reduce((a, b) => a + b, 0) + eps;
  return {
    relaxation:    norm[0] / sum,
    concentration: norm[1] / sum,
    stress:        norm[2] / sum,
  };
}
