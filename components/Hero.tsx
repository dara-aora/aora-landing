"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SmallCaps } from "./SmallCaps";

/**
 * Hero = Section 1. Tagline-only. Video visible behind.
 * CTA lives in the Nav (persistent) and in FinalCTA.
 */
export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section
      className="absolute top-0 left-0 right-0 h-[100svh] min-h-[560px] flex flex-col items-center justify-center px-6 md:px-10 pointer-events-auto"
      aria-labelledby="hero-heading"
    >
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="mx-auto w-full text-center"
        style={{ maxWidth: 620 }}
      >
        <SmallCaps className="block mb-10 md:mb-14" tone="paper">
          A new instrument for brain state
        </SmallCaps>

        <h1
          id="hero-heading"
          className="font-display font-light tracking-tightest leading-[1.08] text-[28px] sm:text-[36px] md:text-[44px] lg:text-[52px]"
          style={{ color: "var(--paper)" }}
        >
          You track your sleep.
          <br />
          You track your steps.
          <br />
          You&apos;ve never tracked the{" "}
          <span
            style={{
              borderBottom: "1.5px solid var(--green)",
              paddingBottom: 2,
            }}
          >
            organ
          </span>{" "}
          that runs both.
        </h1>
      </motion.div>

      {/* Scroll hint */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 scroll-hint"
        style={{
          bottom: "max(1.5rem, env(safe-area-inset-bottom))",
        }}
        aria-hidden
      >
        <SmallCaps>Scroll</SmallCaps>
        <div
          style={{
            width: 1,
            height: 40,
            backgroundColor: "var(--paper)",
            opacity: 0.5,
          }}
        />
      </div>
    </section>
  );
}
