"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { SmallCaps } from "./SmallCaps";

/**
 * VideoHero — Single-viewport hero, scroll-scrubbed through the
 * second half of the clip (75 % → 100 %).
 *
 * `aora-hero.mp4` is paused. A rAF loop (gated by `seeked`, same
 * pattern as `StickyVideo.tsx`) maps the user's scroll position
 * across this 100svh section to `video.currentTime`, starting at
 * 75 % of the clip and scrubbing to 100 %. Scrolling down advances
 * playback; scrolling back up rewinds. When the user stops
 * scrolling the video freezes on its current frame. There is no
 * autoplay, no loop, and no replay.
 *
 * A dark overlay sits on top of the video for legibility.
 *
 * Source MP4 should be encoded all-intra for smooth frame-accurate
 * scrubbing; otherwise seeks between keyframes can stutter.
 */

const VIDEO_SRC = "/video/aora-hero.mp4";
const POSTER_SRC = "/video/aora-poster.jpg";

const START_PROGRESS = 0.75;
const MAX_PROGRESS = 1.0;

export function VideoHero() {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Scroll progress across the hero section itself: 0 when the
  // section's top is at the top of the viewport, 1 when the
  // section's bottom reaches the top of the viewport (i.e. the
  // user has fully scrolled past the hero).
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // ── rAF-driven scrubber with seek locking ──
  // The video is paused. Each frame we ease `currentTime` toward
  // the scroll-derived target. Never issue a seek while the
  // previous one is still decoding (gated by `seeked`).
  useEffect(() => {
    if (reduced) return;
    const v = videoRef.current;
    if (!v) return;

    let rafId = 0;
    let seeking = false;
    let lastTarget = -1;

    // Ensure the element is paused even if the browser autoplayed
    // on load (some engines start playback off the poster frame).
    v.pause();

    const onSeeked = () => {
      seeking = false;
    };
    v.addEventListener("seeked", onSeeked);

    const onLoaded = () => {
      v.currentTime = v.duration * START_PROGRESS;
    };
    if (v.readyState >= 1) onLoaded();
    else v.addEventListener("loadedmetadata", onLoaded, { once: true });

    const tick = () => {
      const duration = v.duration;
      if (duration && Number.isFinite(duration)) {
        const p = scrollYProgress.get();
        const range = MAX_PROGRESS - START_PROGRESS;
        const target = Math.max(
          START_PROGRESS * duration,
          Math.min(duration * MAX_PROGRESS, START_PROGRESS * duration + p * duration * range),
        );
        if (!seeking) {
          const current = v.currentTime;
          const delta = target - current;
          if (Math.abs(delta) > 1 / 60) {
            // Ease by ~25% per frame — smooths wheel jitter and
            // keeps the browser able to actually decode frames.
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
      v.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [reduced, scrollYProgress]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{
        height: "100svh",
        minHeight: 560,
        backgroundColor: "var(--ink)",
      }}
      aria-labelledby="video-hero-heading"
    >
      <h2 id="video-hero-heading" className="sr-only">
        Aora — power up your mind
      </h2>

      {/* Video layer — paused; scrubbed by scroll. */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        poster={POSTER_SRC}
        aria-hidden="true"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

{/* Dark overlay — uniform tint for second-half footage. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: "rgba(10,10,10,0.55)" }}
      />

      {/* Legibility vignette — keeps copy readable without ever
           darkening the whole video. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0) 35%, rgba(10,10,10,0) 60%, rgba(10,10,10,0.7) 92%, rgba(10,10,10,0.9) 100%)",
        }}
      />

      {/* Copy layer */}
      <div className="relative h-full w-full flex flex-col justify-start pt-[58vh] px-6 md:px-10">
        <div className="mx-auto w-full max-w-content">
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="max-w-[640px]"
          >
            <h1
              className="font-display font-light tracking-tightest leading-[1.06] text-[30px] sm:text-[38px] md:text-[48px] lg:text-[56px]"
              style={{ color: "var(--paper)" }}
            >
              POWER UP YOUR MIND
            </h1>
            <div className="mt-5 md:mt-6 max-w-[560px]">
              <SmallCaps className="block" tone="paper">
                Mental fatigue is your biggest liability
              </SmallCaps>
              <a
                href="https://buy.stripe.com/aFa7sMd4sfu18mp9m48so0b"
                className="inline-flex items-center gap-2 h-11 md:h-12 px-5 md:px-6 mt-4 text-sm md:text-base font-medium transition-colors duration-150"
                style={{
                  backgroundColor: "var(--green)",
                  color: "var(--ink)",
                  borderRadius: 4,
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Order Aora Now
                <span aria-hidden>→</span>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
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

        {/* Corner marker */}
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
      </div>
    </section>
  );
}
