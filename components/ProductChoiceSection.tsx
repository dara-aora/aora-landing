"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * ProductChoiceSection — dual product showcase
 *
 * Shows Nano (measurement) and Ultra (intervention) side-by-side.
 * Nano is buyable, Ultra is investigational.
 */
export function ProductChoiceSection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative w-full px-6 md:px-10 py-24 md:py-32"
      style={{ backgroundColor: "var(--paper)" }}
      aria-labelledby="product-choice-heading"
    >
      <div className="mx-auto w-full" style={{ maxWidth: "72rem" }}>
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="small-caps" style={{ color: "var(--mute)" }}>
            Two products
          </span>
          <h2
            id="product-choice-heading"
            className="mt-6 font-display font-light leading-[1.05] tracking-tightest text-[36px] sm:text-[48px] md:text-[64px]"
            style={{ color: "var(--ink)" }}
          >
            Measure. Intervene.
          </h2>
        </motion.div>

        <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Nano card */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="p-8 md:p-10"
            style={{
              backgroundColor: "var(--ink)",
              borderRadius: 4,
            }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3
                className="font-display font-light text-3xl md:text-4xl tracking-tight"
                style={{ color: "var(--paper)" }}
              >
                Aora Nano
              </h3>
              <span
                className="small-caps"
                style={{ color: "var(--green)" }}
              >
                Pre-order
              </span>
            </div>

            <p
              className="mt-6 font-display text-[17px] leading-[1.6]"
              style={{ color: "var(--mute)" }}
            >
              Measurement instrument. Behind-the-ear wearable with continuous
              ECG, PPG, and neural potentials. On-device processing.
            </p>

            <div className="mt-8">
              <div
                className="font-display text-5xl font-light tracking-tight"
                style={{ color: "var(--paper)" }}
              >
                $199
              </div>
              <span className="small-caps" style={{ color: "var(--mute)" }}>
                Ships July 2026
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-4">
              <a
                href="/product"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 text-sm font-medium transition-colors duration-150"
                style={{
                  backgroundColor: "var(--green)",
                  color: "var(--ink)",
                  borderRadius: 3,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "var(--green-bright)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "var(--green)")
                }
              >
                Learn more
                <span aria-hidden>→</span>
              </a>
            </div>
          </motion.div>

          {/* Ultra card */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="p-8 md:p-10"
            style={{
              backgroundColor: "var(--paper-warm)",
              border: "1px solid var(--rule)",
              borderRadius: 4,
            }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3
                className="font-display font-light text-3xl md:text-4xl tracking-tight"
                style={{ color: "var(--ink)" }}
              >
                Aora Ultra
              </h3>
              <span
                className="small-caps"
                style={{ color: "var(--green)" }}
              >
                Research
              </span>
            </div>

            <p
              className="mt-6 font-display text-[17px] leading-[1.6]"
              style={{ color: "var(--ink)" }}
            >
              Investigational intervention. EEG-gated focused ultrasound to the
              left amygdala. Treatment-class research program for PTSD.
            </p>

            <div className="mt-8">
              <div
                className="font-display text-[17px] font-light leading-[1.5]"
                style={{ color: "var(--mute)" }}
              >
                In development
              </div>
              <span className="small-caps" style={{ color: "var(--mute)" }}>
                No price · Not yet available
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-4">
              <a
                href="/ultra"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 text-sm font-medium transition-colors duration-150"
                style={{
                  backgroundColor: "var(--ink)",
                  color: "var(--paper)",
                  borderRadius: 3,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "rgba(10,10,10,0.85)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "var(--ink)";
                }}
              >
                Learn more
                <span aria-hidden>→</span>
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
          className="mt-12 text-center"
        >
          <p
            className="font-display text-[15px] leading-[1.6]"
            style={{ color: "var(--mute)" }}
          >
            Nano measures. Ultra is the investigational treatment-class program.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
