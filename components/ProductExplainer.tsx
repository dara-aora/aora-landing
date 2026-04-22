"use client";

import { FadeUp } from "./FadeUp";
import { SmallCaps } from "./SmallCaps";

/**
 * "How it works" — three text-only beats. No icons. Serif display
 * type on the step headline; mute-tone body beneath. Matches the
 * build spec's instruction to feel like Apple product pages circa 2008.
 */

const STEPS = [
  {
    n: 1,
    title: "Put it on.",
    body:
      "You won't feel it. The device sits behind the ear and starts sensing on contact — no pairing dance, no calibration.",
  },
  {
    n: 2,
    title: "It measures continuously.",
    body:
      "ECG, PPG, and early neural-potential signals, processed on-device. Data streams to the companion app over BLE 5.4.",
  },
  {
    n: 3,
    title: "You get a read on the organ that runs you.",
    body:
      "Cognitive load, recovery, and burnout trajectory — live in the browser extension and in the app. Always on. Always yours.",
  },
] as const;

export function ProductExplainer() {
  return (
    <section
      className="relative px-6 md:px-10 py-28 md:py-40 snap-section"
      style={{ backgroundColor: "var(--ink)" }}
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-section">
        <FadeUp>
          <SmallCaps className="block mb-4">How it works</SmallCaps>
          <h2
            id="how-it-works-heading"
            className="font-display font-light leading-[1.02] tracking-tightest text-[36px] md:text-[56px] mb-16 md:mb-24"
            style={{ color: "var(--paper)" }}
          >
            Three steps.{" "}
            <span style={{ color: "var(--mute)" }}>No learning curve.</span>
          </h2>
        </FadeUp>

        <ol className="space-y-14 md:space-y-20">
          {STEPS.map((s, i) => (
            <FadeUp key={s.n} delay={i * 0.05} as="div">
              <li
                className="grid grid-cols-[auto_1fr] gap-6 md:gap-10"
                style={{
                  borderTop: "1px solid var(--rule)",
                  paddingTop: 28,
                }}
              >
                <span
                  className="font-mono text-[11px] tabular-nums pt-1"
                  style={{
                    color: "var(--green-bright)",
                    letterSpacing: "0.14em",
                  }}
                >
                  {String(s.n).padStart(2, "0")}
                </span>
                <div>
                  <h3
                    className="font-display font-light leading-[1.1] tracking-tightest text-[26px] md:text-[34px] mb-4"
                    style={{ color: "var(--paper)" }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="font-display font-light text-[16px] md:text-[18px] leading-snug max-w-prose"
                    style={{ color: "var(--mute)" }}
                  >
                    {s.body}
                  </p>
                </div>
              </li>
            </FadeUp>
          ))}
        </ol>
      </div>
    </section>
  );
}
