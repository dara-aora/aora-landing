"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { SmallCaps } from "./SmallCaps";
import { useIsMobile } from "@/lib/useIsMobile";

/**
 * UpscaleScrollSection — Pinned PCB walkthrough.
 *
 * The section pins the AORA Nano PCB diagram (`/device-aora.png`, a
 * portrait labeled view with callouts stacked on the right) and, on
 * each scroll beat, pans vertically with a gentle zoom so the next
 * labeled zone of the PCB — from Top Housing down to Bottom Housing —
 * is centered in the viewport. A single teleprompter beat is visible
 * at any moment in the left copy rail, cross-fading as the active
 * index changes.
 *
 * Scroll length is sized tight (PIN_VH / BEATS.length per beat) and
 * there is no tail cross-fade, so the sticky unpins directly into the
 * ChromeExtensionSection below — no black gap between sections.
 */

const BEATS: Array<{ title: string; body: string }> = [
  {
    title: "Top Housing",
    body: "PC/ABS, metallic silver — contoured to the mastoid.",
  },
  {
    title: "RF Shield / Antenna Zone",
    body: "Plastic insert keeps the antenna window clean of metal.",
  },
  {
    title: "Main PCB",
    body: "4-layer HDI: RF, digital, power, and analog zones on one board.",
  },
  {
    title: "Battery",
    body: "Li-ion 3.7 V, ~15 mAh — all-day at continuous sample rate.",
  },
  {
    title: "Optical Module",
    body: "PPG: LED + photodiode for blood-flow sensing.",
  },
  {
    title: "Contact Pads",
    body: "TP1 / TP2 / TP3 — dry EEG electrodes against skin.",
  },
  {
    title: "RX Coil",
    body: "Wireless charging — sealed induction, no ports, no corrosion.",
  },
  {
    title: "Bottom Housing",
    body: "PC/ABS — skin-safe polymer enclosure.",
  },
];

/**
 * Focus points per beat, expressed as fractions of the portrait PCB
 * diagram (fx, fy ∈ [0,1]). The source PNG is a tall, labeled diagram:
 * the ear-curve PCB runs vertically down the center with callout
 * labels stacked on the right. We keep `fx` near the horizontal
 * center so both the PCB and its labels stay in frame, and pan
 * vertically via `fy` through the eight zones.
 */
const FOCUS: Array<{ fx: number; fy: number; zoom: number }> = [
  { fx: 0.5, fy: 0.12, zoom: 1.12 }, // Top Housing
  { fx: 0.5, fy: 0.22, zoom: 1.18 }, // RF Shield / Antenna Zone
  { fx: 0.5, fy: 0.35, zoom: 1.22 }, // Main PCB
  { fx: 0.5, fy: 0.48, zoom: 1.22 }, // Battery
  { fx: 0.5, fy: 0.6, zoom: 1.2 }, // Optical Module
  { fx: 0.5, fy: 0.72, zoom: 1.18 }, // Contact Pads
  { fx: 0.5, fy: 0.82, zoom: 1.15 }, // RX Coil
  { fx: 0.5, fy: 0.88, zoom: 1.1 }, // Bottom Housing
];

const PIN_VH = 200; // outer scroll length (desktop) — 25vh per beat × 8
const IMAGE_SRC = "/device-aora.png";

export function UpscaleScrollSection() {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  if (isMobile) {
    return <MobileSection reduced={!!reduced} />;
  }
  return <DesktopSection reduced={!!reduced} />;
}

// ─── Desktop: pinned, pan+zoom image, teleprompter ─────────────────────

function DesktopSection({ reduced }: { reduced: boolean }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });

  // Drive camera (fx, fy, zoom) from scroll progress. We interpolate
  // between FOCUS entries using scrollYProgress mapped across N-1
  // segments, then smooth with a spring so pans feel filmic.
  const n = BEATS.length;
  const fxStops = useMemo(() => FOCUS.map((f) => f.fx), []);
  const fyStops = useMemo(() => FOCUS.map((f) => f.fy), []);
  const zoomStops = useMemo(() => FOCUS.map((f) => f.zoom), []);
  const progressStops = useMemo(
    () => FOCUS.map((_, i) => i / (n - 1)),
    [n],
  );

  const fxRaw = useTransform(scrollYProgress, progressStops, fxStops);
  const fyRaw = useTransform(scrollYProgress, progressStops, fyStops);
  const zoomRaw = useTransform(scrollYProgress, progressStops, zoomStops);

  const springOpts = { stiffness: 80, damping: 22, mass: 0.6 };
  const fx = useSpring(fxRaw, springOpts);
  const fy = useSpring(fyRaw, springOpts);
  const zoom = useSpring(zoomRaw, springOpts);

  // Translate the image layer so the focus point stays centered as we
  // zoom in. The image is sized to the viewport (object-cover, left);
  // scaling expands around its center, so we offset by
  // (0.5 - focus) * 100% of the (zoom-scaled) image dimension.
  const translateX = useTransform([fx, zoom], ([f, z]) => {
    const fxv = f as number;
    const zv = z as number;
    // percent of the image width that the center must shift by
    return `${(0.5 - fxv) * 100 * zv}%`;
  });
  const translateY = useTransform([fy, zoom], ([f, z]) => {
    const fyv = f as number;
    const zv = z as number;
    return `${(0.5 - fyv) * 100 * zv}%`;
  });
  const scaleStr = useTransform(zoom, (z) => `${z}`);

  // Active beat index (teleprompter index — discrete).
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.max(0, Math.min(n - 1, Math.floor(p * n)));
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  });

  const activeBeat = BEATS[activeIndex];

  return (
    <section
      ref={outerRef}
      className="relative w-full snap-section"
      style={{
        height: `${PIN_VH}vh`,
        backgroundColor: "var(--ink)",
      }}
      aria-labelledby="upscale-scroll-heading"
    >
      <h2 id="upscale-scroll-heading" className="sr-only">
        AORA Nano — inside the device
      </h2>

      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ── Pan + zoom image layer (full labeled PCB diagram) ── */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            x: reduced ? undefined : translateX,
            y: reduced ? undefined : translateY,
            scale: reduced ? undefined : scaleStr,
            willChange: "transform",
          }}
        >
          {/* The source PNG is a portrait labeled diagram — PCB
              centered, callout labels stacked on the right. Use
              `contain` so every label stays legible as we pan/zoom. */}
          <img
            src={IMAGE_SRC}
            alt=""
            className="h-full w-full select-none"
            style={{
              objectFit: "contain",
              objectPosition: "center center",
            }}
            draggable={false}
          />
        </motion.div>



        {/* Left-edge darken — narrow gradient just behind the copy
            rail so the teleprompter stays legible without obscuring
            the labeled diagram to its right. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(10,10,10,0.78) 0%, rgba(10,10,10,0.35) 28%, rgba(10,10,10,0.0) 48%)",
          }}
        />

        {/* ── Copy layer ── */}
        <div className="relative h-full w-full">
          <div className="mx-auto h-full max-w-content px-6 md:px-10 flex flex-col justify-center">
            <div className="max-w-[520px]">
              <SmallCaps>AORA · Nano · Anatomy</SmallCaps>
              <h3
                className="mt-5 font-display font-light leading-[1.04] tracking-tightest text-[28px] lg:text-[36px] xl:text-[44px]"
                style={{ color: "var(--paper)" }}
              >
                Eight zones,
                <br />
                <span style={{ color: "var(--mute)" }}>
                  one continuous signal.
                </span>
              </h3>

              {/* Teleprompter slot — only the active beat is ever visible */}
              <div
                className="mt-12 lg:mt-14 relative"
                style={{ minHeight: 180 }}
                aria-live="polite"
                aria-atomic="true"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeIndex}
                    initial={
                      reduced ? { opacity: 0 } : { opacity: 0, y: 14 }
                    }
                    animate={
                      reduced ? { opacity: 1 } : { opacity: 1, y: 0 }
                    }
                    exit={
                      reduced ? { opacity: 0 } : { opacity: 0, y: -14 }
                    }
                    transition={{
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative pl-5"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1 bottom-1"
                      style={{
                        width: 2,
                        backgroundColor: "var(--green)",
                        boxShadow: "0 0 10px rgba(143,174,90,0.55)",
                      }}
                    />
                    <div className="flex items-baseline gap-3">
                      <span
                        className="font-mono text-[10px] tabular-nums"
                        style={{
                          color: "var(--green-bright)",
                          letterSpacing: "0.14em",
                        }}
                      >
                        {String(activeIndex + 1).padStart(2, "0")} /{" "}
                        {String(BEATS.length).padStart(2, "0")}
                      </span>
                      <span
                        className="font-display font-light text-[22px] lg:text-[26px] xl:text-[30px] leading-tight"
                        style={{ color: "var(--paper)" }}
                      >
                        {activeBeat.title}
                      </span>
                    </div>
                    <p
                      className="mt-3 font-display font-light text-[16px] lg:text-[18px] xl:text-[20px] leading-[1.5] max-w-[440px]"
                      style={{ color: "var(--paper)" }}
                    >
                      {activeBeat.body}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Scroll progress pips */}
              <div
                className="mt-14 flex items-center gap-1.5"
                aria-hidden="true"
              >
                {BEATS.map((_, i) => (
                  <span
                    key={i}
                    className="transition-all duration-300"
                    style={{
                      height: 2,
                      width: i === activeIndex ? 28 : 14,
                      backgroundColor:
                        i <= activeIndex
                          ? "var(--green)"
                          : "var(--rule)",
                      opacity: i <= activeIndex ? 1 : 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Corner marker */}
          <div className="absolute bottom-6 right-8 flex items-center gap-2">
            <span
              className="inline-block rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: "var(--green-bright)",
                boxShadow: "0 0 8px var(--green-bright)",
              }}
            />
            <span
              className="font-mono text-[10px] tabular-nums"
              style={{
                color: "var(--mute)",
                letterSpacing: "0.14em",
              }}
            >
              AORA · NANO · PCB LAYOUT
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Mobile: sticky static PCB image + scrolling teleprompter ──────────

function MobileSection({ reduced }: { reduced: boolean }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const n = BEATS.length;
    const idx = Math.max(0, Math.min(n - 1, Math.floor(p * n)));
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  });

  const activeBeat = BEATS[activeIndex];

  return (
    <section
      ref={outerRef}
      className="relative w-full snap-section"
      style={{
        // 8 beats × ~70svh each keeps pacing readable on mobile
        height: `${BEATS.length * 70}svh`,
        backgroundColor: "var(--ink)",
      }}
      aria-labelledby="upscale-scroll-heading-mobile"
    >
      <h2 id="upscale-scroll-heading-mobile" className="sr-only">
        AORA Nano — inside the device
      </h2>

      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Static PCB image — full portrait diagram, labels intact. */}
        <img
          src={IMAGE_SRC}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full select-none"
          style={{
            objectFit: "contain",
            objectPosition: "center top",
          }}
          draggable={false}
        />

        {/* Legibility wash — strongest at the bottom where copy sits,
            softened at the top so the labeled diagram reads clearly. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.15) 35%, rgba(10,10,10,0.85) 85%, rgba(10,10,10,0.95) 100%)",
          }}
        />

        <div className="relative h-full w-full flex flex-col justify-end px-6 pb-20">
          <SmallCaps>AORA · Nano · Anatomy</SmallCaps>
          <h3
            className="mt-3 font-display font-light leading-[1.04] tracking-tightest text-[28px] sm:text-[34px]"
            style={{ color: "var(--paper)" }}
          >
            Eight zones,
            <br />
            <span style={{ color: "var(--mute)" }}>
              one continuous signal.
            </span>
          </h3>

          <div
            className="mt-8 relative"
            style={{ minHeight: 160 }}
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeIndex}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative pl-5"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1 bottom-1"
                  style={{
                    width: 2,
                    backgroundColor: "var(--green)",
                    boxShadow: "0 0 10px rgba(143,174,90,0.55)",
                  }}
                />
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-mono text-[10px] tabular-nums"
                    style={{
                      color: "var(--green-bright)",
                      letterSpacing: "0.14em",
                    }}
                  >
                    {String(activeIndex + 1).padStart(2, "0")} /{" "}
                    {String(BEATS.length).padStart(2, "0")}
                  </span>
                  <span
                    className="font-display font-light text-[20px] leading-tight"
                    style={{ color: "var(--paper)" }}
                  >
                    {activeBeat.title}
                  </span>
                </div>
                <p
                  className="mt-2 font-display font-light text-[16px] leading-[1.55]"
                  style={{ color: "var(--paper)" }}
                >
                  {activeBeat.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="mt-8 flex items-center gap-1.5"
            aria-hidden="true"
          >
            {BEATS.map((_, i) => (
              <span
                key={i}
                className="transition-all duration-300"
                style={{
                  height: 2,
                  width: i === activeIndex ? 24 : 12,
                  backgroundColor:
                    i <= activeIndex ? "var(--green)" : "var(--rule)",
                  opacity: i <= activeIndex ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
