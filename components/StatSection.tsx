"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SmallCaps } from "./SmallCaps";
import { LiveDot } from "./LiveDot";

/**
 * Section — "73%". Standalone section on ink background, below the
 * anatomy hero.
 */
export function StatSection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative w-full flex items-center justify-center px-6 md:px-10 py-28 md:py-40 snap-section"
      style={{ backgroundColor: "var(--ink)" }}
      aria-labelledby="stat-heading"
    >
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40 }}
        whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-section w-full text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-6 md:mb-8">
          <LiveDot />
          <SmallCaps tone="paper">Aora assessment data, n = 2,417</SmallCaps>
        </div>

        <div
          id="stat-heading"
          className="font-mono font-normal leading-[0.9] tracking-tight text-[88px] sm:text-[140px] md:text-[200px] lg:text-[260px]"
          style={{ color: "var(--paper)" }}
        >
          73<span style={{ color: "var(--green)" }}>%</span>
        </div>

        <p
          className="mt-6 md:mt-8 font-display font-light text-2xl md:text-3xl lg:text-[34px] leading-tight max-w-prose mx-auto"
          style={{ color: "var(--paper)" }}
        >
          of high-performers score in the{" "}
          <em className="not-italic" style={{ color: "var(--green)" }}>
            overclocked
          </em>{" "}
          range on their first test.
        </p>

        <p
          className="mt-6 text-lg md:text-xl"
          style={{ color: "var(--mute)" }}
        >
          Most never knew.
        </p>
      </motion.div>
    </section>
  );
}
