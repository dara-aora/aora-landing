"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Brain, Activity, Zap } from "lucide-react";
import { SmallCaps } from "./SmallCaps";

const measures = [
  {
    number: "01",
    label: "Cognitive Load",
    body: "Understand how mentally demanding life really is, so you can protect your focus.",
    Icon: Brain,
  },
  {
    number: "02",
    label: "Neural Recovery",
    body: "Track how well your brain recharges, adapts, and prepares for what's next.",
    Icon: Activity,
  },
  {
    number: "03",
    label: "Burnout Risk",
    body: "Detect early signs of overload before they impact your well-being.",
    Icon: Zap,
  },
];

/**
 * MeasuresSection — Section 4 (redesigned with icons)
 *
 * Three-signal overview with lucide icons. Dark background.
 */
export function MeasuresSection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative w-full flex items-center justify-center px-6 md:px-10 py-28 md:py-40 snap-section"
      style={{ backgroundColor: "var(--ink)" }}
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
          {measures.map((c) => {
            const Icon = c.Icon;
            return (
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
                className="text-center"
              >
                <span
                  className="font-mono text-xs tracking-wider block mb-8"
                  style={{ color: "var(--mute)" }}
                >
                  {c.number}
                </span>

                <div
                  className="mx-auto mb-8 flex items-center justify-center"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: "1px solid var(--rule)",
                  }}
                >
                  <Icon
                    size={28}
                    strokeWidth={1.2}
                    style={{ color: "var(--paper)" }}
                  />
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
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}