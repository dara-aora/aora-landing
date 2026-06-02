"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SmallCaps } from "./SmallCaps";
import { track } from "@/lib/track";

const PREORDER_URL = "https://buy.stripe.com/aFa7sMd4sfu18mp9m48so0b";

/**
 * VideoHero — clean landing-page hero.
 *
 * Full-viewport with a photographic background and dark overlay.
 * Headline and copy on the left, product image on the right.
 */
export function VideoHero() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        height: "100svh",
        minHeight: 640,
      }}
      aria-labelledby="video-hero-heading"
    >
      {/* Full-bleed background image */}
      <img
        src="/hero-bg.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Dark overlay for text legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.75) 45%, rgba(10,10,10,0.55) 100%)",
        }}
      />

      <h2 id="video-hero-heading" className="sr-only">
        Aora — Quiet power for your mind
      </h2>

      {/* Main content row */}
      <div className="relative h-full w-full flex items-center px-6 md:px-10">
        <div className="mx-auto w-full max-w-content flex flex-col md:flex-row items-center md:items-center justify-between gap-8 md:gap-12">
          {/* Left: Copy block */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="md:w-[52%] lg:w-[48%] shrink-0"
          >
            <p
              className="font-mono text-[11px] md:text-xs tracking-[0.18em] uppercase mb-5 md:mb-6"
              style={{ color: "var(--green-bright)" }}
            >
              Neurotech for a calmer mind
            </p>

            <h1
              className="font-display font-light tracking-tightest leading-[0.98] text-[38px] sm:text-[52px] md:text-[64px] lg:text-[76px]"
              style={{ color: "var(--paper)" }}
            >
              Quiet power
              <br />
              for your mind.
            </h1>

            <p
              className="mt-5 md:mt-6 text-base md:text-lg leading-relaxed max-w-[480px]"
              style={{ color: "var(--mute)" }}
            >
              AORA Nano listens to your brain in real time, so you can
              understand more, stress less, and live with clarity.
            </p>

            <div className="mt-7 md:mt-8">
              <a
                href={PREORDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track("checkout_started", { location: "hero" })
                }
                className="inline-flex items-center gap-2 h-12 md:h-14 px-6 md:px-8 text-sm md:text-base font-medium transition-colors duration-150"
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
                Pre-order AORA Nano
                <span aria-hidden>→</span>
              </a>
            </div>
          </motion.div>


        </div>
      </div>

      {/* Bottom scroll hint */}
      <div
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 scroll-hint"
        aria-hidden
      >
        <SmallCaps>Scroll</SmallCaps>
        <div
          style={{
            width: 1,
            height: 32,
            backgroundColor: "var(--paper)",
            opacity: 0.5,
          }}
        />
      </div>

      {/* Bottom-right live marker */}
      <div className="absolute bottom-6 right-6 md:right-10 flex items-center gap-2">
        <span
          className="inline-block rounded-full live-dot"
          style={{
            width: 6,
            height: 6,
            backgroundColor: "var(--green-bright)",
            boxShadow: "0 0 8px var(--green-bright)",
          }}
        />
        <span
          className="font-mono text-[10px] tabular-nums"
          style={{ color: "var(--mute)", letterSpacing: "0.14em" }}
        >
          AORA · NANO
        </span>
      </div>
    </section>
  );
}