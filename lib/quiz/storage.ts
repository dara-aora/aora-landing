import type { Answers, ScoreResult } from "./scoring";

/**
 * Namespaced localStorage wrapper with try/catch for quota / privacy-mode
 * errors. v1 has no backend — all results live client-side.
 */

const PROGRESS_KEY = "aora.quiz_progress";
const RESULTS_KEY = "aora.quiz_results";

export type QuizProgress = {
  answers: Partial<Answers>;
  segment?: string;
  updatedAt: number;
};

export type StoredResult = {
  id: string;
  score: number;
  archetype: ScoreResult["archetype"];
  subScores: ScoreResult["subScores"];
  segment?: string;
  createdAt: number;
};

// ─── progress ──────────────────────────────────────────────────────────

export function loadProgress(): QuizProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuizProgress;
  } catch {
    return null;
  }
}

export function saveProgress(progress: QuizProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // quota / privacy mode — silently ignore
  }
}

export function clearProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* noop */
  }
}

// ─── results ───────────────────────────────────────────────────────────

type ResultsDict = Record<string, StoredResult>;

function readResults(): ResultsDict {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(RESULTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ResultsDict;
  } catch {
    return {};
  }
}

function writeResults(dict: ResultsDict): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESULTS_KEY, JSON.stringify(dict));
  } catch {
    /* noop */
  }
}

export function saveResult(result: StoredResult): void {
  const dict = readResults();
  dict[result.id] = result;
  writeResults(dict);
}

export function loadResult(id: string): StoredResult | null {
  const dict = readResults();
  return dict[id] ?? null;
}
