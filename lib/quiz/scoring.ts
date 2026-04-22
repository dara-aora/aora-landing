import type { QuestionId } from "./questions";

/**
 * Scoring logic for the 6-question Brain State assessment.
 *
 *   - Average all 6 scored questions on a 0–100 scale.
 *   - Q5 is reverse-keyed: use (100 - rawScore).
 *   - Sub-scores:
 *       Exhaustion        = avg(Q1, Q2)
 *       Stress load       = Q3
 *       Cognitive clarity = avg(Q4, Q6, 100 - Q5)
 *   - Archetype:
 *       0–24  → BASELINE_CLEAR
 *       25–49 → AMBIENT_LOAD
 *       50–74 → OVERCLOCKED
 *       75+   → BURNOUT_TERRITORY
 */

export type Answers = Record<QuestionId, number>;

export type ArchetypeKey =
  | "BASELINE_CLEAR"
  | "AMBIENT_LOAD"
  | "OVERCLOCKED"
  | "BURNOUT_TERRITORY";

export type SubScores = {
  exhaustion: number;
  stress: number;
  clarity: number;
};

export type ScoreResult = {
  score: number;
  archetype: ArchetypeKey;
  subScores: SubScores;
};

const avg = (nums: number[]): number =>
  Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);

export function scoreAnswers(answers: Answers): ScoreResult {
  const q5r = 100 - answers.q5; // reverse-keyed

  const scored = [
    answers.q1,
    answers.q2,
    answers.q3,
    answers.q4,
    q5r,
    answers.q6,
  ];

  const score = avg(scored);

  const subScores: SubScores = {
    exhaustion: avg([answers.q1, answers.q2]),
    stress: answers.q3,
    clarity: avg([answers.q4, answers.q6, q5r]),
  };

  return { score, archetype: archetypeFor(score), subScores };
}

export function archetypeFor(score: number): ArchetypeKey {
  if (score <= 24) return "BASELINE_CLEAR";
  if (score <= 49) return "AMBIENT_LOAD";
  if (score <= 74) return "OVERCLOCKED";
  return "BURNOUT_TERRITORY";
}
