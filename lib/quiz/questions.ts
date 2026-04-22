/**
 * Quiz questions.
 *
 * Trimmed 6-question set covering all three sub-scales
 * (exhaustion · stress · clarity). Q5 uses Scale B and is reverse-keyed
 * (applied in scoring). Q7 is segmentation only, not scored.
 */

export type ScaleOption = {
  label: string;
  value: number; // 0..100 (internal only; not displayed to taker)
};

export const SCALE_A: ScaleOption[] = [
  { label: "Never / almost never", value: 0 },
  { label: "Seldom", value: 25 },
  { label: "Sometimes", value: 50 },
  { label: "Often", value: 75 },
  { label: "Always", value: 100 },
];

export const SCALE_B: ScaleOption[] = [
  { label: "Very poor", value: 100 },
  { label: "Poor", value: 75 },
  { label: "Neutral", value: 50 },
  { label: "Good", value: 25 },
  { label: "Very good", value: 0 },
];

export const SEGMENT_OPTIONS: string[] = [
  "Founder / operator",
  "Creator / artist",
  "Athlete / performer",
  "Investor / finance",
  "Engineer / scientist",
  "Knowledge worker (other)",
  "Between things right now",
];

export type QuestionId = "q1" | "q2" | "q3" | "q4" | "q5" | "q6";

export type Question = {
  id: QuestionId;
  number: number; // 1..6 (display)
  prompt: string;
  scale: "A" | "B";
};

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    number: 1,
    prompt: "How often do you feel tired?",
    scale: "A",
  },
  {
    id: "q2",
    number: 2,
    prompt: "How often are you emotionally exhausted?",
    scale: "A",
  },
  {
    id: "q3",
    number: 3,
    prompt:
      "In the last month, how often have you felt nervous or stressed?",
    scale: "A",
  },
  {
    id: "q4",
    number: 4,
    prompt: "How often do you lose focus mid-task and have to restart?",
    scale: "A",
  },
  {
    id: "q5",
    number: 5,
    prompt: "How often do you wake feeling rested?",
    scale: "B",
  },
  {
    id: "q6",
    number: 6,
    prompt: "How would you rate your ability to concentrate for deep work?",
    scale: "B",
  },
];

export const TOTAL_SCORED = QUESTIONS.length; // 6
export const TOTAL_STEPS = TOTAL_SCORED + 1; // +1 for segmentation
