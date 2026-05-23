"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/FadeUp";
import { SmallCaps } from "@/components/SmallCaps";
import { ResultSubScoreBar } from "@/components/ResultSubScoreBar";

import { loadResult, clearProgress, type StoredResult } from "@/lib/quiz/storage";
import { ARCHETYPES } from "@/lib/quiz/archetypes";
import { track } from "@/lib/track";

const STRIPE_CHECKOUT_URL =
  "https://buy.stripe.com/bJe6oI9Sgfu1cCF1TC8so09";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/aora-cognitive-performanc/kpgpmdgnhdmfmapjknbkfponemlgcabl?authuser=2&hl=en-GB&pli=1";

export default function QuizResultPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loaded, setLoaded] = useState(false);
  const [result, setResult] = useState<StoredResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoaded(true);
      return;
    }
    const r = loadResult(id);
    setResult(r);
    setLoaded(true);
    if (r) {
      track("result_viewed", { archetype: r.archetype, score: r.score });
    }
  }, [id]);

  if (!loaded) {
    // Minimal placeholder to avoid a layout flash on hydration.
    return (
      <>
        <Nav />
        <main
          className="min-h-[100dvh] w-full"
          style={{ backgroundColor: "var(--ink)" }}
        />
        <Footer />
      </>
    );
  }

  if (!result) {
    return <ExpiredResult />;
  }

  const copy = ARCHETYPES[result.archetype];

  return (
    <>
      <Nav />

      <main>
        {/* ═══════════════════ Hero / headline ═══════════════════ */}
        <section
          className="relative px-6 md:px-10 pt-36 md:pt-48 pb-20 md:pb-28 overflow-hidden"
          style={{ backgroundColor: "var(--ink)" }}
          aria-labelledby="result-heading"
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 20% 0%, rgba(110,139,61,0.1) 0%, rgba(10,10,10,0) 55%), linear-gradient(to bottom, rgba(20,20,20,0.5) 0%, rgba(10,10,10,0) 30%)",
            }}
          />

          <div
            className="relative mx-auto w-full"
            style={{ maxWidth: "72rem" }}
          >
            <SmallCaps>Your brain state is</SmallCaps>

            <h1
              id="result-heading"
              className="mt-6 font-display font-light leading-[0.98] tracking-tightest text-[40px] sm:text-[64px] md:text-[96px] lg:text-[128px] break-words hyphens-auto"
              style={{
                color: "var(--paper)",
                overflowWrap: "anywhere",
              }}
            >
              {copy.nameUpper}
            </h1>

            <div className="mt-8 flex items-baseline gap-3">
              <span
                className="font-mono text-sm md:text-base tracking-wider"
                style={{ color: "var(--green)" }}
              >
                SCORE
              </span>
              <span
                className="font-mono text-3xl md:text-4xl tabular-nums"
                style={{ color: "var(--paper)" }}
              >
                {result.score}
              </span>
              <span
                className="font-mono text-xl md:text-2xl tabular-nums"
                style={{ color: "var(--mute)" }}
              >
                / 100
              </span>
            </div>

            <p
              className="mt-10 font-display font-light text-xl md:text-[22px] leading-[1.5]"
              style={{ color: "var(--paper)", maxWidth: "44rem" }}
            >
              {copy.description}
            </p>
          </div>
        </section>

        {/* ═══════════════════ Sub-scores ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--ink-raised)" }}
          aria-labelledby="subscores-heading"
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <div id="subscores-heading">
                <SmallCaps>The three subscales</SmallCaps>
              </div>
            </FadeUp>
            <FadeUp delay={0.08}>
              <h2
                className="mt-4 font-display font-light leading-[1.1] tracking-tightest text-[28px] sm:text-[34px] md:text-[40px]"
                style={{ color: "var(--paper)" }}
              >
                Where the score comes from.
              </h2>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
                <ResultSubScoreBar
                  label="Exhaustion"
                  value={result.subScores.exhaustion}
                  caption="Burnout & exhaustion signal."
                />
                <ResultSubScoreBar
                  label="Stress load"
                  value={result.subScores.stress}
                  caption="Perceived stress under recent demand."
                />
                <ResultSubScoreBar
                  label="Cognitive clarity"
                  value={result.subScores.clarity}
                  caption="Focus + rested-waking composite."
                />
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ What this means ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--ink)" }}
          aria-labelledby="wtm-heading"
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <div id="wtm-heading">
                <SmallCaps>What this means</SmallCaps>
              </div>
            </FadeUp>
            <FadeUp delay={0.08}>
              <ol
                className="mt-8 flex flex-col"
                style={{ borderTop: "1px solid var(--rule)" }}
              >
                {copy.whatThisMeans.map((line, i) => (
                  <li
                    key={i}
                    className="py-6 md:py-7 flex items-start gap-5 md:gap-8"
                    style={{ borderBottom: "1px solid var(--rule)" }}
                  >
                    <span
                      className="font-mono text-sm tracking-wider pt-1 shrink-0"
                      style={{ color: "var(--green)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p
                      className="font-display font-light text-lg md:text-xl leading-[1.45]"
                      style={{ color: "var(--paper)" }}
                    >
                      {line}
                    </p>
                  </li>
                ))}
              </ol>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ What Aora would track ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--ink-raised)" }}
          aria-labelledby="track-heading"
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <div id="track-heading">
                <SmallCaps>What Aora would track for you</SmallCaps>
              </div>
            </FadeUp>
            <FadeUp delay={0.08}>
              <ol
                className="mt-8 flex flex-col"
                style={{ borderTop: "1px solid var(--rule)" }}
              >
                {copy.whatAoraTracks.map((line, i) => (
                  <li
                    key={i}
                    className="py-6 md:py-7 flex items-start gap-5 md:gap-8"
                    style={{ borderBottom: "1px solid var(--rule)" }}
                  >
                    <span
                      className="font-mono text-sm tracking-wider pt-1 shrink-0"
                      style={{ color: "var(--green)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p
                      className="font-display font-light text-lg md:text-xl leading-[1.45]"
                      style={{ color: "var(--paper)" }}
                    >
                      {line}
                    </p>
                  </li>
                ))}
              </ol>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ Dual CTA — Stripe + Chrome ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-24 md:py-32"
          style={{ backgroundColor: "var(--ink)" }}
          aria-labelledby="cta-heading"
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <SmallCaps>What's next</SmallCaps>
            </FadeUp>
            <FadeUp delay={0.08}>
              <h2
                id="cta-heading"
                className="mt-6 font-display font-light leading-[1.08] tracking-tightest text-[32px] sm:text-[40px] md:text-[48px]"
                style={{ color: "var(--paper)" }}
              >
                Measure it, then start fixing it.
              </h2>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="mt-12 flex flex-col sm:flex-row gap-4 sm:gap-5">
                {/* Primary — Stripe */}
                <a
                  href={STRIPE_CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track("checkout_started", {
                      location: "quiz_result",
                      archetype: result.archetype,
                      score: result.score,
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 h-14 px-7 text-base font-medium transition-colors duration-150"
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
                  Preorder AORA Nano
                  <span aria-hidden>→</span>
                </a>

                {/* Secondary — Chrome */}
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track("cta_clicked", {
                      location: "quiz_result_chrome",
                      archetype: result.archetype,
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 h-14 px-7 text-base font-medium transition-colors duration-150"
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--paper)",
                    border: "1px solid var(--rule)",
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor =
                      "var(--green)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor =
                      "var(--rule)")
                  }
                >
                  Add the Chrome extension
                  <span aria-hidden style={{ color: "var(--green)" }}>
                    ↗
                  </span>
                </a>
              </div>
            </FadeUp>

            <FadeUp delay={0.22}>
              <div className="mt-10">
                <SmallCaps>
                  Preorder · Ships July 2026 · Extension free today
                </SmallCaps>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ Share + Retake ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-16 md:py-20"
          style={{ backgroundColor: "var(--ink-raised)" }}
        >
          <div
            className="mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8"
            style={{ maxWidth: "64rem" }}
          >
            <div className="flex items-center gap-4">
              <SmallCaps>Share your result</SmallCaps>
              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  const url = window.location.href;
                  navigator.clipboard?.writeText(url).then(
                    () => {
                      setCopied(true);
                      track("cta_clicked", {
                        location: "quiz_result_share",
                        archetype: result.archetype,
                      });
                      setTimeout(() => setCopied(false), 1800);
                    },
                    () => {
                      /* no clipboard permission — no-op */
                    },
                  );
                }}
                className="inline-flex items-center gap-2 font-mono text-xs tracking-wider h-9 px-3 transition-colors duration-150"
                style={{
                  color: copied ? "var(--green-bright)" : "var(--paper)",
                  border: "1px solid var(--rule)",
                  borderRadius: 4,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    "var(--green)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    "var(--rule)")
                }
              >
                {copied ? "LINK COPIED" : "COPY LINK"}
              </button>
            </div>

            <a
              href="/quiz"
              onClick={() => clearProgress()}
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
              Retake the assessment →
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

/* ─── Expired / unknown id fallback ──────────────────────────────────── */

function ExpiredResult() {
  return (
    <>
      <Nav />
      <main
        className="min-h-[100dvh] w-full px-6 md:px-10 pt-36 md:pt-48 pb-24 md:pb-32"
        style={{ backgroundColor: "var(--ink)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "48rem" }}>
          <SmallCaps>Result not found</SmallCaps>

          <h1
            className="mt-6 font-display font-light leading-[1.05] tracking-tightest text-[40px] sm:text-[52px] md:text-[64px]"
            style={{ color: "var(--paper)" }}
          >
            This result link has expired,
            <br />
            or was opened on a new device.
          </h1>

          <p
            className="mt-10 font-display font-light text-xl md:text-[22px] leading-[1.5]"
            style={{ color: "var(--mute)" }}
          >
            Results live on the device that took the assessment. Take the
            one-minute Brain State assessment to generate a fresh one.
          </p>

          <div className="mt-12">
            <a
              href="/quiz"
              onClick={() => clearProgress()}
              className="inline-flex items-center gap-2 h-14 px-7 text-base font-medium transition-colors duration-150"
              style={{
                backgroundColor: "var(--green)",
                color: "var(--ink)",
                borderRadius: 4,
              }}
            >
              Retake the assessment
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
