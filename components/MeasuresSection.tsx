"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LiveDot } from "./LiveDot";
import { SmallCaps } from "./SmallCaps";

/**
 * Section 3 — "What Aora measures". Third and final screen inside the
 * sticky-video zone. Positioned at top: 200vh.
 */
const columns = [
  {
    label: "Cognitive Load",
    body: "A real-time read of how hard your brain is working right now. Built from validated self-report and passive sensing.",
  },
  {
    label: "Neural Recovery",
    body: "How well your brain is recovering between deep-work sessions. The signal your HRV can't see.",
  },
  {
    label: "Burnout Risk",
    body: "An early-warning trajectory built from the Copenhagen Burnout Inventory and continuous wearable data.",
  },
];

export function MeasuresSection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative w-full flex items-center justify-center px-6 md:px-10 py-28 md:py-40 snap-section"
      style={{ backgroundColor: "var(--ink-raised)" }}
      aria-labelledby="measures-heading"
    >
      <div className="max-w-content w-full">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 md:mb-24"
        >
          <SmallCaps tone="paper">Three signals</SmallCaps>
          <h2
            id="measures-heading"
            className="mt-4 font-display font-light leading-[1.02] tracking-tightest text-[36px] sm:text-5xl md:text-[56px]"
            style={{ color: "var(--paper)" }}
          >
            What Aora measures.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12"
        >
          {columns.map((c, i) => (
            <motion.div
              key={c.label}
              variants={{
                hidden: reduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1],
                  },
                },
              }}
              className="pt-6"
              style={{ borderTop: "1px solid var(--rule)" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <LiveDot size={6} />
                <span
                  className="font-mono text-xs tracking-wider"
                  style={{ color: "var(--mute)" }}
                >
                  0{i + 1}
                </span>
              </div>

              <h3
                className="font-display font-light text-2xl md:text-[28px] leading-tight mb-4"
                style={{ color: "var(--paper)" }}
              >
                {c.label}
              </h3>

              <p
                className="text-base md:text-[17px] leading-relaxed"
                style={{ color: "var(--mute)" }}
              >
                {c.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
