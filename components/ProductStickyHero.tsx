"use client";

import { motion, useReducedMotion } from "framer-motion";
import { StickyVideo } from "./StickyVideo";
import { Hero } from "./Hero";
import { SmallCaps } from "./SmallCaps";
import { LiveDot } from "./LiveDot";
import { useIsMobile } from "@/lib/useIsMobile";

/**
 * ProductStickyHero — cinematic StickyVideo hero for /product.
 *
 * Re-homes the original landing-page opening act onto the product
 * page: a pinned, scroll-scrubbed video with three beats layered
 * over it — the tagline Hero, the 73% stat, and the three-signal
 * measures grid. The children are absolutely positioned at 0/100vh/
 * 200vh of the pin zone so they synchronize with the video scrub.
 *
 * On mobile the pin zone collapses (StickyVideo branches to a single
 * 100svh autoplay loop), so the absolute positioning would push the
 * second and third beats off-screen. Below md we render the three
 * beats as normal flow sections instead.
 */
export function ProductStickyHero() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileProductHero /> : <DesktopProductHero />;
}

function DesktopProductHero() {
  return (
    <StickyVideo pinVh={200}>
      <Hero />
      <StickyStatBeat />
    </StickyVideo>
  );
}

// ─── Mobile: stacked normal-flow layout (no absolute positioning) ────────

function MobileProductHero() {
  return (
    <>
      {/* Hero with looping ambient video behind it */}
      <StickyVideo pinVh={200}>
        <Hero />
      </StickyVideo>

      {/* Stat stacked normally */}
      <StatSectionMobile />
    </>
  );
}

function StatSectionMobile() {
  const reduced = useReducedMotion();
  return (
    <section
      className="relative min-h-[100svh] flex items-center justify-center px-6 py-24"
      style={{ backgroundColor: "var(--ink)" }}
      aria-labelledby="product-stat-heading-mobile"
    >
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
        whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-section w-full text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <LiveDot />
          <SmallCaps tone="paper">Aora assessment data, n = 2,417</SmallCaps>
        </div>

        <div
          id="product-stat-heading-mobile"
          className="font-mono font-normal leading-[0.9] tracking-tight text-[88px] sm:text-[140px]"
          style={{ color: "var(--paper)" }}
        >
          73<span style={{ color: "var(--green)" }}>%</span>
        </div>

        <p
          className="mt-6 font-display font-light text-2xl leading-tight max-w-prose mx-auto"
          style={{ color: "var(--paper)" }}
        >
          of high-performers score in the{" "}
          <em className="not-italic" style={{ color: "var(--green)" }}>
            overclocked
          </em>{" "}
          range on their first test.
        </p>

        <p className="mt-6 text-lg" style={{ color: "var(--mute)" }}>
          Most never knew.
        </p>
      </motion.div>
    </section>
  );
}

// ─── 73% stat beat (absolute within StickyVideo) ─────────────────────────

function StickyStatBeat() {
  const reduced = useReducedMotion();
  return (
    <section
      className="absolute left-0 right-0 h-screen flex items-center justify-center px-6 md:px-10 pointer-events-auto"
      style={{ top: "100vh" }}
      aria-labelledby="product-stat-heading"
    >
      {/* Localized radial darkener — keeps stat legible over bright video */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.35) 55%, rgba(10,10,10,0) 85%)",
        }}
      />

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
          id="product-stat-heading"
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


