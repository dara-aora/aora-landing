"use client";

import { motion, useReducedMotion } from "framer-motion";
import { track } from "@/lib/track";

const PREORDER_URL = "https://buy.stripe.com/aFa7sMd4sfu18mp9m48so0b";

/**
 * BrainCareSection — Section 3
 *
 * Big display text: "Take care of your brain"
 * CTA: "Join the first batch"
 * Subtext: "30 day money-back guarantee"
 */
export function BrainCareSection() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative w-full flex items-center justify-center px-6 md:px-10 py-28 md:py-40 snap-section"
      style={{ backgroundColor: "var(--ink)" }}
      aria-labelledby="brain-care-heading"
    >
      <div className="max-w-content w-full text-center">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            id="brain-care-heading"
            className="font-display font-light leading-[0.95] tracking-tightest text-[42px] sm:text-[64px] md:text-[88px] lg:text-[104px]"
            style={{ color: "var(--paper)" }}
          >
            Take care of your brain
          </h2>
        </motion.div>

        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="mt-10 md:mt-14 flex flex-col items-center gap-5"
        >
          <a
            href={PREORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("checkout_started", { location: "brain_care_section" })
            }
            className="inline-flex items-center gap-2 h-14 px-8 text-base font-medium transition-colors duration-150"
            style={{
              backgroundColor: "var(--green)",
              color: "var(--ink)",
              borderRadius: 4,
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
            Join the first batch
            <span aria-hidden>→</span>
          </a>

          <p
            className="text-xs md:text-sm tracking-wide"
            style={{ color: "var(--mute)" }}
          >
            30 day money-back guarantee
          </p>
        </motion.div>
      </div>
    </section>
  );
}