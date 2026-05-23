"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { QuizScreen } from "@/components/QuizScreen";
import { QuizAnswerButton } from "@/components/QuizAnswerButton";
import { QuizProgressBar } from "@/components/QuizProgressBar";
import { SmallCaps } from "@/components/SmallCaps";

import {
  QUESTIONS,
  SCALE_A,
  SCALE_B,
  SEGMENT_OPTIONS,
  TOTAL_STEPS,
  type Question,
  type QuestionId,
  type ScaleOption,
} from "@/lib/quiz/questions";
import { scoreAnswers, type Answers } from "@/lib/quiz/scoring";
import {
  loadProgress,
  saveProgress,
  clearProgress,
  saveResult,
  type QuizProgress,
} from "@/lib/quiz/storage";
import { generateResultId } from "@/lib/quiz/id";
import { track } from "@/lib/track";

/* ─── State machine ──────────────────────────────────────────────────── */

type Step =
  | { kind: "intro" }
  | { kind: "question"; index: number } // 0..5 (Q1..Q6)
  | { kind: "segment" } // Q7 (not scored)
  | { kind: "submitting" }
  | { kind: "done"; resultId: string };

type State = {
  step: Step;
  answers: Partial<Answers>;
  segment?: string;
};

type Action =
  | { type: "HYDRATE"; progress: QuizProgress }
  | { type: "BEGIN" }
  | { type: "ANSWER"; qid: QuestionId; value: number }
  | { type: "SET_SEGMENT"; segment: string }
  | { type: "SUBMITTING" }
  | { type: "DONE"; resultId: string }
  | { type: "BACK" };

const initialState: State = {
  step: { kind: "intro" },
  answers: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE": {
      // Resume at the next unanswered question if any, else at intro.
      const answers = action.progress.answers ?? {};
      const answeredCount = QUESTIONS.filter((q) => answers[q.id] !== undefined)
        .length;

      if (answeredCount === 0) {
        return { ...state, answers };
      }
      if (answeredCount >= QUESTIONS.length) {
        return {
          ...state,
          answers,
          segment: action.progress.segment,
          step: { kind: "segment" },
        };
      }

      // Resume at the first unanswered question.
      const firstUnansweredIndex = QUESTIONS.findIndex(
        (q) => answers[q.id] === undefined,
      );

      return {
        ...state,
        answers,
        segment: action.progress.segment,
        step: { kind: "question", index: firstUnansweredIndex },
      };
    }

    case "BEGIN":
      return { ...state, step: { kind: "question", index: 0 } };

    case "ANSWER": {
      const nextAnswers: Partial<Answers> = {
        ...state.answers,
        [action.qid]: action.value,
      };

      const answeredIndex = QUESTIONS.findIndex((q) => q.id === action.qid);

      // After the last scored question → segment
      if (answeredIndex === QUESTIONS.length - 1) {
        return {
          ...state,
          answers: nextAnswers,
          step: { kind: "segment" },
        };
      }

      // Otherwise advance to the next question.
      return {
        ...state,
        answers: nextAnswers,
        step: { kind: "question", index: answeredIndex + 1 },
      };
    }

    case "SET_SEGMENT":
      return { ...state, segment: action.segment, step: { kind: "submitting" } };

    case "SUBMITTING":
      return { ...state, step: { kind: "submitting" } };

    case "DONE":
      return { ...state, step: { kind: "done", resultId: action.resultId } };

    case "BACK": {
      if (state.step.kind === "question") {
        if (state.step.index === 0) return state;
        return {
          ...state,
          step: { kind: "question", index: state.step.index - 1 },
        };
      }
      if (state.step.kind === "segment") {
        return {
          ...state,
          step: { kind: "question", index: QUESTIONS.length - 1 },
        };
      }
      return state;
    }

    default:
      return state;
  }
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function scaleFor(q: Question): ScaleOption[] {
  return q.scale === "A" ? SCALE_A : SCALE_B;
}

function currentProgressStep(step: Step): number {
  if (step.kind === "intro") return 0;
  if (step.kind === "question") return step.index + 1; // 1..6
  if (step.kind === "segment") return QUESTIONS.length + 1; // 7
  if (step.kind === "submitting" || step.kind === "done") return TOTAL_STEPS;
  return 0;
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function QuizPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const submittedRef = useRef(false);

  // Hydrate progress on mount.
  useEffect(() => {
    const progress = loadProgress();
    if (progress) dispatch({ type: "HYDRATE", progress });
    setHydrated(true);
  }, []);

  // Persist progress whenever state changes.
  useEffect(() => {
    if (!hydrated) return;
    if (
      state.step.kind === "submitting" ||
      state.step.kind === "done" ||
      state.step.kind === "intro"
    ) {
      return;
    }
    saveProgress({
      answers: state.answers,
      segment: state.segment,
      updatedAt: Date.now(),
    });
  }, [state, hydrated]);

  // Fire analytics when leaving the intro.
  const beganRef = useRef(false);
  useEffect(() => {
    if (
      !beganRef.current &&
      state.step.kind !== "intro" &&
      state.step.kind !== "done"
    ) {
      beganRef.current = true;
      track("quiz_started");
    }
  }, [state.step.kind]);

  // Handle submission when we enter the "submitting" step.
  useEffect(() => {
    if (state.step.kind !== "submitting") return;
    if (submittedRef.current) return;
    submittedRef.current = true;

    const answers = state.answers as Answers;
    const scored = scoreAnswers(answers);
    const id = generateResultId();

    saveResult({
      id,
      score: scored.score,
      archetype: scored.archetype,
      subScores: scored.subScores,
      segment: state.segment,
      createdAt: Date.now(),
    });

    track("quiz_completed", {
      archetype: scored.archetype,
      score: scored.score,
    });

    // Minimum visible delay so the transition reads as intentional.
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 200
      : 700;

    const t = setTimeout(() => {
      clearProgress();
      router.replace(`/quiz/result/${id}`);
    }, delay);

    return () => clearTimeout(t);
  }, [state.step.kind, state.answers, state.segment, router]);

  const progressStep = currentProgressStep(state.step);

  return (
    <>
      {/* Progress bar visible during questions / segment */}
      {state.step.kind !== "intro" && state.step.kind !== "done" ? (
        <QuizProgressBar current={progressStep} total={TOTAL_STEPS} />
      ) : null}

      <main
        className="min-h-[100dvh] w-full px-6 md:px-10 py-20 md:py-28 flex items-start justify-center"
        style={{ backgroundColor: "var(--ink)" }}
      >
        <div className="w-full" style={{ maxWidth: 640 }}>
          {/* Header row — logo + exit */}
          <div className="flex items-center justify-between mb-16 md:mb-24">
            <a
              href="/"
              className="flex items-center gap-2 font-display text-lg tracking-tight"
              aria-label="Aora home"
            >
              <Image
                src="/icon128.png"
                alt=""
                width={28}
                height={28}
                className="h-6 w-6 md:h-7 md:w-7"
              />
              <span style={{ color: "var(--paper)" }}>AORA</span>
            </a>

            <a
              href="/"
              className="small-caps transition-colors duration-150"
              style={{ color: "var(--mute)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "var(--green-bright)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--mute)")
              }
            >
              Exit ↗
            </a>
          </div>

          {/* Step body */}
          {state.step.kind === "intro" ? (
            <IntroScreen onBegin={() => dispatch({ type: "BEGIN" })} />
          ) : state.step.kind === "question" ? (
            (() => {
              const qIndex = state.step.index;
              const q = QUESTIONS[qIndex];
              return (
                <QuestionStep
                  question={q}
                  total={QUESTIONS.length}
                  selectedValue={state.answers[q.id]}
                  canGoBack={qIndex > 0}
                  onAnswer={(value) => {
                    track("quiz_question_answered", {
                      index: qIndex + 1,
                      qid: q.id,
                    });
                    dispatch({ type: "ANSWER", qid: q.id, value });
                  }}
                  onBack={() => dispatch({ type: "BACK" })}
                />
              );
            })()
          ) : state.step.kind === "segment" ? (
            <SegmentStep
              selected={state.segment}
              onSelect={(segment) => {
                track("quiz_question_answered", {
                  index: QUESTIONS.length + 1,
                  qid: "segment",
                });
                dispatch({ type: "SET_SEGMENT", segment });
              }}
              onBack={() => dispatch({ type: "BACK" })}
            />
          ) : state.step.kind === "submitting" ? (
            <SubmittingScreen />
          ) : null}
        </div>
      </main>
    </>
  );
}

/* ─── Sub-screens ────────────────────────────────────────────────────── */

function IntroScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <QuizScreen screenKey="intro">
      <div>
        <SmallCaps>Brain State Assessment</SmallCaps>

        <h1
          className="mt-8 font-display font-light leading-[1.02] tracking-tightest text-[44px] sm:text-[56px] md:text-[64px]"
          style={{ color: "var(--paper)" }}
        >
          A 1-minute
          <br />
          Brain State assessment.
        </h1>

        <p
          className="mt-10 font-display font-light text-xl md:text-[22px] leading-[1.5]"
          style={{ color: "var(--paper)" }}
        >
          Adapted from instruments used at Stanford and Mass General. Seven
          questions. No sign-up to start.
        </p>

        <div className="mt-14">
          <button
            type="button"
            onClick={onBegin}
            className="inline-flex items-center gap-2 h-14 px-7 text-base font-medium transition-colors duration-150"
            style={{
              backgroundColor: "var(--green)",
              color: "var(--ink)",
              borderRadius: 4,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor =
                "var(--green-bright)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor =
                "var(--green)")
            }
          >
            Begin
            <span aria-hidden>→</span>
          </button>
        </div>

        <div className="mt-10">
          <SmallCaps>
            No sign-up · Results in 1 minute · Backed by peer-reviewed
            instruments
          </SmallCaps>
        </div>
      </div>
    </QuizScreen>
  );
}

function QuestionStep({
  question,
  total,
  selectedValue,
  canGoBack,
  onAnswer,
  onBack,
}: {
  question: Question;
  total: number;
  selectedValue?: number;
  canGoBack: boolean;
  onAnswer: (value: number) => void;
  onBack: () => void;
}) {
  const options = useMemo(() => scaleFor(question), [question]);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);

  // Autofocus the first option when the question changes.
  useEffect(() => {
    firstButtonRef.current?.focus();
  }, [question.id]);

  // Keyboard: digits 1..5 select, ← goes back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "5") {
        const idx = parseInt(e.key, 10) - 1;
        const opt = options[idx];
        if (opt) {
          e.preventDefault();
          onAnswer(opt.value);
        }
        return;
      }
      if (e.key === "ArrowLeft" && canGoBack) {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, onAnswer, onBack, canGoBack]);

  return (
    <QuizScreen screenKey={question.id}>
      <div>
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-xs tracking-wider"
            style={{ color: "var(--green)" }}
          >
            Q{question.number} / {total}
          </span>
        </div>

        <h2
          className="mt-6 md:mt-8 font-display font-light leading-[1.08] tracking-tightest text-[32px] sm:text-[40px] md:text-[48px]"
          style={{ color: "var(--paper)" }}
        >
          {question.prompt}
        </h2>

        <fieldset className="mt-10 md:mt-12 space-y-3">
          <legend className="sr-only">{question.prompt}</legend>
          {options.map((opt, i) => (
            <QuizAnswerButton
              key={opt.label}
              ref={i === 0 ? firstButtonRef : undefined}
              label={opt.label}
              shortcut={String(i + 1)}
              selected={selectedValue === opt.value}
              onClick={() => onAnswer(opt.value)}
            />
          ))}
        </fieldset>

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="small-caps transition-colors duration-150"
            style={{
              color: canGoBack ? "var(--mute)" : "var(--rule)",
              cursor: canGoBack ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (canGoBack)
                (e.currentTarget as HTMLElement).style.color =
                  "var(--green-bright)";
            }}
            onMouseLeave={(e) => {
              if (canGoBack)
                (e.currentTarget as HTMLElement).style.color = "var(--mute)";
            }}
          >
            ← Back
          </button>
          <span className="hidden md:inline">
            <SmallCaps>Press 1–5 to answer</SmallCaps>
          </span>
        </div>
      </div>
    </QuizScreen>
  );
}

function SegmentStep({
  selected,
  onSelect,
  onBack,
}: {
  selected?: string;
  onSelect: (segment: string) => void;
  onBack: () => void;
}) {
  const firstRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  return (
    <QuizScreen screenKey="segment">
      <div>
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-xs tracking-wider"
            style={{ color: "var(--green)" }}
          >
            Q{QUESTIONS.length + 1} / {QUESTIONS.length + 1}
          </span>
        </div>

        <h2
          className="mt-6 md:mt-8 font-display font-light leading-[1.08] tracking-tightest text-[32px] sm:text-[40px] md:text-[48px]"
          style={{ color: "var(--paper)" }}
        >
          Which best describes your work?
        </h2>

        <fieldset className="mt-10 md:mt-12 space-y-3">
          <legend className="sr-only">Which best describes your work?</legend>
          {SEGMENT_OPTIONS.map((opt, i) => (
            <QuizAnswerButton
              key={opt}
              ref={i === 0 ? firstRef : undefined}
              label={opt}
              selected={selected === opt}
              onClick={() => onSelect(opt)}
            />
          ))}
        </fieldset>

        <div className="mt-10">
          <button
            type="button"
            onClick={onBack}
            className="small-caps transition-colors duration-150"
            style={{ color: "var(--mute)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "var(--green-bright)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--mute)")
            }
          >
            ← Back
          </button>
        </div>
      </div>
    </QuizScreen>
  );
}

function SubmittingScreen() {
  return (
    <QuizScreen screenKey="submitting">
      <div className="flex items-center gap-3">
        <span
          className="live-dot inline-block rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: "var(--green-bright)",
            boxShadow: "0 0 10px var(--green-bright)",
          }}
          aria-hidden
        />
        <span
          className="font-display font-light text-xl md:text-2xl"
          style={{ color: "var(--paper)" }}
        >
          Calculating your Brain State…
        </span>
      </div>
    </QuizScreen>
  );
}
