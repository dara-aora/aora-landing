"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  MotionValue,
} from "framer-motion";
import { RefObject, useEffect, useRef } from "react";
import { SmallCaps } from "./SmallCaps";
import { useIsMobile } from "@/lib/useIsMobile";

/**
 * ProductHero — pinned, scroll-scrubbed product reveal.
 *
 * The device-on-ear footage is driven by a rAF loop inside a self-
 * contained scrub layer (same technique as StickyVideo.tsx). As the
 * user scrolls, the video seeks frame-by-frame through the placement,
 * while five text beats cross-fade in and out at fixed progress bands.
 *
 * This component re-implements the scrub (rather than reusing
 * StickyVideo) so the overlay copy can read the same MotionValue
 * that drives the scrub, keeping beats perfectly in lock-step with
 * the video timeline.
 */

// Tightened from 350vh. With 5 beats at ~50vh each the scrub stays
// readable without the section feeling like a black well the user has
// to drag themselves out of.
const PIN_VH = 250;

// Beat schedule: each tuple is [fadeInStart, solidStart, solidEnd, fadeOutEnd].
// Ranges are chained so fadeOutEnd[N] == fadeInStart[N+1] — no black
// gap between beats.
const BEATS = [
  {
    key: "intro",
    kicker: "Aora Nano",
    headline: "A new instrument for brain state.",
    range: [0.0, 0.06, 0.16, 0.22] as const,
  },
  {
    key: "invisible",
    kicker: "Form",
    headline: "Invisible, once it's on.",
    range: [0.22, 0.28, 0.38, 0.44] as const,
  },
  {
    key: "signals",
    kicker: "Signals",
    headline: "Continuous ECG, PPG, and early neural potentials.",
    range: [0.44, 0.5, 0.6, 0.66] as const,
  },
  {
    key: "onboard",
    kicker: "System",
    headline: "On-device. Low-power. Always on.",
    range: [0.66, 0.72, 0.82, 0.86] as const,
  },
  {
    key: "buy",
    kicker: "The device",
    headline: "The device. $200.",
    range: [0.86, 0.9, 1.0, 1.0] as const,
  },
] as const;

export function ProductHero() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  if (isMobile) {
    return <ProductHeroMobile />;
  }

  // Video layer transforms (mirrors StickyVideo feel).
  const scale = useTransform(scrollYProgress, [0, 1], [1.0, 1.18]);
  // Keep the video readable all the way through — never drop below
  // 0.8 opacity. The ink overlay handles contrast for the copy.
  const videoOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.92, 1],
    [0.9, 1, 1, 0.8],
  );
  // Cap the ink overlay so the device footage is still visible even
  // during the buy beat. Previously climbed to 0.55 which looked like
  // a black screen with text floating on it.
  const overlayInk = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.15, 0.25, 0.35],
  );

  // Scroll hint opacity — gone after a hair of scroll.
  const hintOpacity = useTransform(scrollYProgress, [0, 0.02, 0.05], [1, 1, 0]);

  // rAF scrubber with seek-locking — identical technique to StickyVideo.
  useScrubber(videoRef, scrollYProgress, reduced ?? false);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${PIN_VH}vh`, backgroundColor: "var(--ink)" }}
      aria-label="Aora Nano — device overview"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Poster fallback — always rendered behind the <video> so
            the user never sees a black rectangle while the mp4 is
            still buffering. Once the video has a decoded frame it
            naturally covers this layer. */}
        <div className="absolute inset-0" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/video/aora-poster.jpg"
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>

        {/* Video layer */}
        <motion.div
          className="absolute inset-0"
          style={{
            scale: reduced ? 1 : scale,
            opacity: reduced ? 0.55 : videoOpacity,
            transformOrigin: "50% 50%",
            willChange: "transform, opacity",
          }}
          aria-hidden="true"
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            poster="/video/aora-poster.jpg"
          >
            <source src="/video/aora-hero.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* Radial vignette (legibility) */}
        <div className="video-vignette absolute inset-0 pointer-events-none" />

        {/* Ink overlay scales with scroll */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: "var(--ink)",
            opacity: reduced ? 0.45 : overlayInk,
          }}
        />

        {/* Beat copy */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {BEATS.map((b, i) => (
            <Beat
              key={b.key}
              progress={scrollYProgress}
              range={b.range}
              kicker={b.kicker}
              headline={b.headline}
              isLast={i === BEATS.length - 1}
              reduced={reduced ?? false}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20 pointer-events-none"
          style={{ opacity: reduced ? 0 : hintOpacity }}
          aria-hidden="true"
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
        </motion.div>

        {/* Progress counter (top-right, mono) */}
        <Counter progress={scrollYProgress} reduced={reduced ?? false} />
      </div>

      {/* SR content (always present regardless of scroll) */}
      <div className="sr-only">
        <h1>Aora Nano</h1>
        <p>
          A behind-the-ear wearable with continuous ECG, PPG, and early neural
          potential sensing. On-device processing. Low power. Always on. $200.
        </p>
      </div>
    </section>
  );
}

// ─── Internal helpers ────────────────────────────────────────────────────

function Beat({
  progress,
  range,
  kicker,
  headline,
  isLast,
  reduced,
}: {
  progress: MotionValue<number>;
  range: readonly [number, number, number, number];
  kicker: string;
  headline: string;
  isLast: boolean;
  reduced: boolean;
}) {
  const [inStart, inPeak, outPeak, outEnd] = range;

  const opacity = useTransform(
    progress,
    [inStart, inPeak, outPeak, outEnd],
    [0, 1, 1, isLast ? 1 : 0],
  );

  const y = useTransform(
    progress,
    [inStart, inPeak, outPeak, outEnd],
    [14, 0, 0, isLast ? 0 : -10],
  );

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-10 text-center"
      style={{
        opacity: reduced ? 1 : opacity,
        y: reduced ? 0 : y,
        willChange: "opacity, transform",
      }}
    >
      <div className="mx-auto w-full" style={{ maxWidth: 720 }}>
        <SmallCaps className="block mb-6 md:mb-8" tone="paper">
          {kicker}
        </SmallCaps>
        <h2
          className="font-display font-light tracking-tightest leading-[1.05] text-[30px] sm:text-[40px] md:text-[56px] lg:text-[68px]"
          style={{ color: "var(--paper)" }}
        >
          {headline}
        </h2>

        {isLast && (
          <div className="mt-10 md:mt-14 flex flex-col items-center gap-4 pointer-events-auto">
            <a
              href="https://buy.stripe.com/bJe6oI9Sgfu1cCF1TC8so09"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // Inline import avoids pulling track into every Beat render.
                import("@/lib/track").then(({ track }) =>
                  track("cta_clicked", { location: "product_hero_buy" }),
                );
              }}
              className="inline-flex items-center gap-2 h-12 md:h-14 px-6 text-base font-medium transition-colors duration-150"
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
              Pre-order
              <span aria-hidden>→</span>
            </a>
            <SmallCaps>
              Ships July 2026 · 30-day return · No data sold
            </SmallCaps>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Counter({
  progress,
  reduced,
}: {
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const pct = useTransform(progress, (p) => `${Math.round(p * 100)}`);
  return (
    <motion.div
      className="absolute top-20 right-6 md:right-10 z-20 pointer-events-none"
      style={{ opacity: reduced ? 0.4 : 0.75 }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 1,
            height: 18,
            backgroundColor: "var(--green-bright)",
            opacity: 0.7,
          }}
        />
        <motion.span
          className="font-mono text-[11px] tabular-nums"
          style={{ color: "var(--green-bright)", letterSpacing: "0.14em" }}
        >
          {pct}
        </motion.span>
        <span
          className="font-mono text-[11px] tabular-nums"
          style={{ color: "var(--mute)", letterSpacing: "0.14em" }}
        >
          / 100
        </span>
      </div>
    </motion.div>
  );
}

// ─── Mobile variant ──────────────────────────────────────────────────────
//
// Scroll-scrubbed video is unreliable on iOS Safari (rate-limited
// currentTime seeks, cellular bandwidth). Below md, we render a short
// looping background clip + a simple stacked beat list. The buy CTA
// remains interactive at the bottom.

function ProductHeroMobile() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const play = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    if (v.readyState >= 2) play();
    else v.addEventListener("loadeddata", play, { once: true });
    return () => {
      v.removeEventListener("loadeddata", play);
    };
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "var(--ink)" }}
      aria-label="Aora Nano — device overview"
    >
      {/* Looping background video — quiet ambient layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
          disablePictureInPicture
          poster="/video/aora-poster.jpg"
        >
          <source src="/video/aora-hero.mp4" type="video/mp4" />
        </video>
        <div className="video-vignette absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "var(--ink)", opacity: 0.55 }}
        />
      </div>

      {/* Stacked beats */}
      <div className="relative z-10 px-6 py-24 flex flex-col gap-20">
        {BEATS.map((b, i) => (
          <div
            key={b.key}
            className="text-center mx-auto w-full"
            style={{ maxWidth: 520 }}
          >
            <SmallCaps className="block mb-4" tone="paper">
              {b.kicker}
            </SmallCaps>
            <h2
              className="font-display font-light tracking-tightest leading-[1.05] text-[28px] sm:text-[36px]"
              style={{ color: "var(--paper)" }}
            >
              {b.headline}
            </h2>

            {i === BEATS.length - 1 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <a
                  href="https://buy.stripe.com/bJe6oI9Sgfu1cCF1TC8so09"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    import("@/lib/track").then(({ track }) =>
                      track("cta_clicked", {
                        location: "product_hero_buy_mobile",
                      }),
                    );
                  }}
                  className="inline-flex items-center gap-2 h-12 px-6 text-base font-medium transition-colors duration-150"
                  style={{
                    backgroundColor: "var(--green)",
                    color: "var(--ink)",
                    borderRadius: 4,
                  }}
                >
                  Pre-order
                  <span aria-hidden>→</span>
                </a>
                <SmallCaps>
                  Ships July 2026 · 30-day return · No data sold
                </SmallCaps>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SR content */}
      <div className="sr-only">
        <h1>Aora Nano</h1>
        <p>
          A behind-the-ear wearable with continuous ECG, PPG, and early neural
          potential sensing. On-device processing. Low power. Always on. $200.
        </p>
      </div>
    </section>
  );
}

/**
 * rAF-driven video scrubber with seek-locking.
 * Keeps scrubbing buttery even when the user flings the scroll wheel.
 */
function useScrubber(
  videoRef: RefObject<HTMLVideoElement | null>,
  progress: MotionValue<number>,
  reduced: boolean,
) {
  useEffect(() => {
    if (reduced) return;
    const v = videoRef.current;
    if (!v) return;

    let ready = false;
    let rafId = 0;
    let seeking = false;
    let lastTarget = -1;

    const markReady = () => {
      if (v.duration && Number.isFinite(v.duration)) {
        v.pause();
        ready = true;
      }
    };

    if (v.readyState >= 2 && v.duration) {
      markReady();
    } else {
      v.addEventListener("loadedmetadata", markReady);
      v.addEventListener("loadeddata", markReady);
      v.addEventListener("canplay", markReady);
    }

    const onSeeked = () => {
      seeking = false;
    };
    v.addEventListener("seeked", onSeeked);

    const tick = () => {
      if (ready && v.duration && Number.isFinite(v.duration)) {
        const p = progress.get();
        const target = Math.max(
          0,
          Math.min(v.duration - 1 / 60, p * v.duration),
        );
        if (!seeking) {
          const current = v.currentTime;
          const delta = target - current;
          if (Math.abs(delta) > 1 / 60) {
            const eased = current + delta * 0.25;
            if (Math.abs(eased - lastTarget) > 1 / 120) {
              seeking = true;
              lastTarget = eased;
              v.currentTime = eased;
            }
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("loadedmetadata", markReady);
      v.removeEventListener("loadeddata", markReady);
      v.removeEventListener("canplay", markReady);
    };
  }, [videoRef, progress, reduced]);
}
