"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/lib/useIsMobile";

/**
 * Cinematic pinned, scroll-scrubbed video — Neuralink style.
 *
 * The <video> is paused. A rAF loop samples scroll progress and
 * advances `video.currentTime` toward the target. We never issue a
 * new seek while the previous one is still decoding (gated by the
 * `seeked` event) — this is what keeps scrubbing smooth instead of
 * stuttering.
 *
 * The source MP4 is encoded all-intra (every frame a keyframe) so
 * every seek is frame-accurate with no GOP decode lag.
 */

type Props = {
  children?: ReactNode;
  /** pinning zone in viewport heights */
  pinVh?: number;
};

export function StickyVideo({ children, pinVh = 300 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();

  const [ready, setReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.0, 1.35]);
  const videoOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.85, 1],
    [1.0, 0.95, 0.35, 0.0],
  );
  const overlayOpacity = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.15, 0.45, 0.9],
  );

  // ----- video readiness -----
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const markReady = () => {
      if (v.duration && Number.isFinite(v.duration)) {
        v.pause();
        setReady(true);
      }
    };

    if (v.readyState >= 2 && v.duration) {
      markReady();
    } else {
      v.addEventListener("loadedmetadata", markReady);
      v.addEventListener("loadeddata", markReady);
      v.addEventListener("canplay", markReady);
    }

    return () => {
      v.removeEventListener("loadedmetadata", markReady);
      v.removeEventListener("loadeddata", markReady);
      v.removeEventListener("canplay", markReady);
    };
  }, []);

  // ----- mobile: play as simple autoplay loop, no scroll scrubbing -----
  useEffect(() => {
    if (!isMobile) return;
    const v = videoRef.current;
    if (!v) return;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    const attempt = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    if (v.readyState >= 2) attempt();
    else v.addEventListener("loadeddata", attempt, { once: true });
    return () => {
      v.removeEventListener("loadeddata", attempt);
      v.pause();
      v.loop = false;
    };
  }, [isMobile]);

  // ----- rAF-driven scrubber with seek locking -----
  useEffect(() => {
    if (reduced || !ready || isMobile) return;
    const v = videoRef.current;
    if (!v) return;

    let rafId = 0;
    let seeking = false;
    let lastTarget = -1;

    const onSeeked = () => {
      seeking = false;
    };
    v.addEventListener("seeked", onSeeked);

    const tick = () => {
      const duration = v.duration;
      if (duration && Number.isFinite(duration)) {
        const p = scrollYProgress.get();
        const target = Math.max(
          0,
          Math.min(duration - 1 / 60, p * duration),
        );

        // Ease currentTime toward target by ~25% per frame. This smooths
        // any scroll jitter and lets the browser actually decode frames
        // rather than chasing every wheel tick.
        if (!seeking) {
          const current = v.currentTime;
          const delta = target - current;
          if (Math.abs(delta) > 1 / 60) {
            const eased = current + delta * 0.25;
            // Only issue a new seek if we've actually moved from the
            // last requested target (avoids redundant calls).
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
    };
  }, [ready, reduced, isMobile, scrollYProgress]);

  // Mobile: render a non-pinned viewport-height video + content on top.
  // Scroll scrubbing is unreliable on iOS Safari, so we autoplay a silent
  // loop behind the Hero content.
  if (isMobile) {
    return (
      <div ref={ref} className="relative min-h-[100svh]">
        <div
          className="absolute inset-0 overflow-hidden"
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
            {/* Mobile-optimized variant first — browsers pick the
                first <source> whose media query matches. If the
                file isn't generated, the next source is used. */}
            <source
              src="/video/aora-hero.mobile.mp4"
              type="video/mp4"
              media="(max-width: 768px)"
            />
            <source src="/video/aora-hero.mp4" type="video/mp4" />
          </video>
          <div className="video-vignette absolute inset-0 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: "var(--ink)", opacity: 0.35 }}
          />
        </div>
        <div className="relative pointer-events-none">{children}</div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      style={{ height: `${pinVh}vh` }}
    >
      {/* Pinned video layer */}
      <div
        className="sticky top-0 h-[100svh] w-full overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          className="absolute inset-0"
          style={{
            scale: reduced ? 1 : scale,
            opacity: reduced ? 0.6 : videoOpacity,
            transformOrigin: "50% 50%",
            willChange: "transform, opacity",
          }}
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

        {/* Static radial vignette for text legibility */}
        <div className="video-vignette absolute inset-0 pointer-events-none" />

        {/* Scroll-reactive ink overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: "var(--ink)",
            opacity: reduced ? 0.5 : overlayOpacity,
          }}
        />
      </div>

      {/* Overlay content */}
      <div className="absolute inset-0 pointer-events-none">{children}</div>
    </div>
  );
}
