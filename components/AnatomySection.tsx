"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  MotionValue,
} from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { SmallCaps } from "./SmallCaps";
import { FadeUp } from "./FadeUp";
import { useIsMobile } from "@/lib/useIsMobile";

/**
 * Anatomy of Aora — Neuralink-style scroll-pinned exploded view.
 *
 * The section pins for ~700vh. As the user scrolls, each of the seven
 * internal layers slides from an assembled center position into its slot
 * in the exploded diagram. The matching annotation on the left brightens
 * and an animated leader line connects the text to the layer.
 *
 * Assets: the single reference JPEG lives at /anatomy/source.jpg. Each
 * layer sprite is a CSS background-position crop of that JPEG. Because
 * the source's background and our page ink are the same (#0a0a0a), the
 * black surround of each crop vanishes into the page — no alpha channel
 * required.
 */

// ─── Source image geometry ───────────────────────────────────────────────
// Reference JPEG is 1280×853. The exploded stack occupies roughly the
// horizontal band x ∈ [300, 850]. The 7 layers are stacked vertically
// across y ∈ [30, 830]. These rectangles are tunable; they define which
// slice of source.jpg represents each layer.
const SOURCE_W = 1280;
const SOURCE_H = 853;

type Crop = { x: number; y: number; w: number; h: number };

const LAYERS: ReadonlyArray<{
  n: number;
  name: string;
  spec: string;
  crop: Crop;
}> = [
  {
    n: 1,
    name: "Top Cover",
    spec: "Clear PC (0.8 mm)",
    crop: { x: 290, y: 30, w: 560, h: 130 },
  },
  {
    n: 2,
    name: "Wireless Charging Coil",
    spec: "Inductive Coil (0.6 mm)",
    crop: { x: 290, y: 150, w: 560, h: 110 },
  },
  {
    n: 3,
    name: "Battery",
    spec: "Li-Polymer 3.7 V · 2.0–2.5 mm",
    crop: { x: 290, y: 240, w: 560, h: 130 },
  },
  {
    n: 4,
    name: "Main PCB",
    spec: "FR-4, 4 Layer, 0.8 mm\nnRF54L15 + Analog Front-End",
    crop: { x: 290, y: 335, w: 560, h: 160 },
  },
  {
    n: 5,
    name: "Internal Frame",
    spec: "PC (0.8 mm)",
    crop: { x: 290, y: 485, w: 560, h: 115 },
  },
  {
    n: 6,
    name: "Sensor Layer",
    spec: "ECG Electrodes\nPPG Optical Sensors",
    crop: { x: 290, y: 575, w: 560, h: 140 },
  },
  {
    n: 7,
    name: "Bottom Cover",
    spec: "PC (0.8 mm)",
    crop: { x: 290, y: 700, w: 560, h: 135 },
  },
];

const N = LAYERS.length;
const PIN_VH = 700;

// Final exploded offsets (in percentage of stage height) for each layer,
// relative to a vertical center. Layer 4 (PCB) sits closest to center.
const EXPLODED_Y_PCT: number[] = [-42, -28, -14, 0, 14, 28, 42];

// Assembled state: all layers collapse to the center (y=0) and shrink.
// We blend between ASSEMBLED and EXPLODED across each layer's own band.

// ─── Main component ──────────────────────────────────────────────────────

export function AnatomySection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    // 7 equal bands → active index.
    const idx = Math.max(0, Math.min(N - 1, Math.floor(p * N)));
    if (idx !== active) setActive(idx);
  });

  if (reduced) {
    return <ReducedMotionFallback />;
  }

  if (isMobile) {
    return <AnatomyMobile />;
  }

  return (
    <section
      id="anatomy"
      ref={sectionRef}
      className="relative"
      style={{ height: `${PIN_VH}vh`, backgroundColor: "var(--ink)" }}
      aria-labelledby="anatomy-heading"
    >
      {/* Sticky stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Kicker / heading at top */}
        <div className="absolute top-8 md:top-12 left-0 right-0 z-30 px-6 md:px-10 pointer-events-none">
          <FadeUp>
            <SmallCaps>Anatomy</SmallCaps>
          </FadeUp>
          <FadeUp delay={0.08}>
            <h2
              id="anatomy-heading"
              className="mt-3 font-display font-light leading-[1.02] tracking-tightest text-[28px] sm:text-4xl md:text-[44px] max-w-xl"
              style={{ color: "var(--paper)" }}
            >
              Seven layers. One continuous signal.
            </h2>
          </FadeUp>
        </div>

        <div className="relative h-full w-full flex flex-col md:flex-row">
          <AnnotationColumn active={active} />
          <StageColumn
            progress={scrollYProgress}
            active={active}
          />
        </div>

        {/* End-of-section outline caption */}
        <OutlineCaption progress={scrollYProgress} />
      </div>

      {/* Screen-reader accessible full content */}
      <ol className="sr-only">
        {LAYERS.map((L) => (
          <li key={L.n}>
            {L.n}. {L.name} — {L.spec.replace(/\n/g, " ")}
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─── Annotation column (left) ────────────────────────────────────────────

function AnnotationColumn({ active }: { active: number }) {
  return (
    <aside
      className="relative z-20 w-full md:w-[40%] lg:w-[38%] shrink-0 flex items-center px-6 md:px-10 lg:px-14 pt-40 md:pt-0"
      aria-hidden="true"
    >
      <ol className="flex flex-col gap-5 md:gap-7 w-full">
        {LAYERS.map((L, i) => {
          const isActive = i === active;
          return (
            <li
              key={L.n}
              id={`anatomy-label-${L.n}`}
              className="transition-[opacity,transform] duration-500 ease-out"
              style={{
                opacity: isActive ? 1 : 0.28,
                transform: isActive ? "translateX(0)" : "translateX(-4px)",
              }}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="font-mono text-xs tabular-nums"
                  style={{
                    color: isActive ? "var(--green-bright)" : "var(--mute)",
                  }}
                >
                  {String(L.n).padStart(2, "0")}
                </span>
                <SmallCaps tone={isActive ? "paper" : "mute"}>
                  {L.name}
                </SmallCaps>
              </div>
              <p
                className="mt-1 font-display font-light text-[15px] md:text-base leading-snug whitespace-pre-line"
                style={{ color: isActive ? "var(--paper)" : "var(--mute)" }}
              >
                {L.spec}
              </p>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

// ─── Stage column (right) ────────────────────────────────────────────────

function StageColumn({
  progress,
  active,
}: {
  progress: MotionValue<number>;
  active: number;
}) {
  return (
    <div
      className="relative z-10 flex-1 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      {/* Inner stage: fixed aspect box that hosts the absolute layer sprites */}
      <div
        className="relative w-full max-w-[640px] aspect-[560/820] mx-4 md:mx-8"
        style={{ perspective: 1200 }}
      >
        {LAYERS.map((L, i) => (
          <LayerSprite
            key={L.n}
            index={i}
            crop={L.crop}
            progress={progress}
            isActive={i === active}
          />
        ))}

        {/* Leader line overlay */}
        <LeaderLine active={active} />
      </div>
    </div>
  );
}

// ─── Single layer sprite ─────────────────────────────────────────────────

function LayerSprite({
  index,
  crop,
  progress,
  isActive,
}: {
  index: number;
  crop: Crop;
  progress: MotionValue<number>;
  isActive: boolean;
}) {
  const bandStart = index / N;
  const bandEnd = (index + 1) / N;

  // y: assembled (0%) → exploded final slot, completes within its own band.
  const y = useTransform(
    progress,
    [bandStart, bandEnd],
    ["0%", `${EXPLODED_Y_PCT[index]}%`],
    { clamp: true },
  );

  // opacity: invisible slightly before band, 1 at band start, 0.55 after,
  // then overridden to 1 by isActive.
  const baseOpacity = useTransform(
    progress,
    [
      Math.max(0, bandStart - 0.05),
      bandStart,
      bandEnd,
      1,
    ],
    [0, 1, 0.55, 0.55],
  );

  // subtle scale focus during band
  const scale = useTransform(
    progress,
    [bandStart, (bandStart + bandEnd) / 2, bandEnd],
    [0.985, 1.02, 1.0],
  );

  return (
    <motion.div
      data-layer={index + 1}
      id={`anatomy-layer-${index + 1}`}
      className="absolute left-1/2 top-1/2"
      style={{
        // All layer crops share crop.w = 560 so sprite width = 100% of stage.
        width: "100%",
        aspectRatio: `${crop.w} / ${crop.h}`,
        x: "-50%",
        y,
        scale,
        opacity: isActive ? 1 : baseOpacity,
        backgroundImage: "url(/anatomy/source.jpg)",
        backgroundRepeat: "no-repeat",
        // background-size scales so that SOURCE_W maps to the sprite width.
        // Sprite width = crop.w at natural source px. We want to show exactly
        // `crop.w × crop.h` px region, so we size the bg to SOURCE proportions
        // and offset by the crop origin.
        backgroundSize: `${(SOURCE_W / crop.w) * 100}% auto`,
        backgroundPosition: `-${(crop.x / (SOURCE_W - crop.w)) * 100}% -${(crop.y / (SOURCE_H - crop.h)) * 100}%`,
        willChange: "transform, opacity",
        filter: isActive ? "none" : "saturate(0.85)",
        transition: "filter 400ms ease",
      }}
    />
  );
}

// ─── Leader line (SVG, animated) ─────────────────────────────────────────

function LeaderLine({ active }: { active: number }) {
  // We draw a leader from the active annotation (in the left column) to
  // the left edge of the active layer sprite. Positions are measured at
  // runtime from DOM rects. The SVG itself is stage-column-local; the
  // start point (in stage-local coords) comes from bounding-rect math.
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [line, setLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  useEffect(() => {
    const compute = () => {
      const svg = svgRef.current;
      if (!svg) return;
      const stage = svg.parentElement; // the aspect-box wrapper
      if (!stage) return;

      const label = document.getElementById(`anatomy-label-${active + 1}`);
      const layer = document.getElementById(`anatomy-layer-${active + 1}`);
      if (!label || !layer) return;

      const stageRect = stage.getBoundingClientRect();
      const labelRect = label.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();

      // Endpoint: left edge of the layer sprite, vertical center.
      const x2 = layerRect.left - stageRect.left;
      const y2 = layerRect.top + layerRect.height / 2 - stageRect.top;

      // Start: right edge of the label (just past the text).
      const x1 = labelRect.right - stageRect.left + 16;
      const y1 = labelRect.top + labelRect.height / 2 - stageRect.top;

      setLine({ x1, y1, x2, y2 });
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(document.body);
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [active]);

  // Build a gently-stepped path: start → horizontal → short vertical →
  // horizontal → end. Mirrors the reference image's orthogonal leaders.
  const d = useMemo(() => {
    if (!line) return "";
    const midX = line.x1 + Math.max(24, (line.x2 - line.x1) * 0.55);
    return `M ${line.x1} ${line.y1} L ${midX} ${line.y1} L ${midX} ${line.y2} L ${line.x2} ${line.y2}`;
  }, [line]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    >
      {line && (
        <motion.path
          key={active} // remount on change so pathLength animates fresh
          d={d}
          fill="none"
          stroke="var(--mute)"
          strokeWidth={1}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      {line && (
        <motion.circle
          key={`dot-${active}`}
          cx={line.x2}
          cy={line.y2}
          r={2.5}
          fill="var(--green-bright)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.25 }}
        />
      )}
    </svg>
  );
}

// ─── Outline caption (bottom-right at scroll end) ────────────────────────

function OutlineCaption({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.9, 1], [0, 1]);
  const y = useTransform(progress, [0.9, 1], [8, 0]);

  return (
    <motion.div
      className="absolute bottom-6 md:bottom-10 right-6 md:right-10 z-20 text-right pointer-events-none"
      style={{ opacity, y }}
      aria-hidden="true"
    >
      <SmallCaps>Exact outline</SmallCaps>
      <div
        className="mt-1 font-mono text-[11px] tabular-nums"
        style={{ color: "var(--mute)" }}
      >
        from gerber edge_cuts
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        <svg
          width="90"
          height="58"
          viewBox="0 0 90 58"
          fill="none"
          stroke="var(--paper)"
          strokeWidth={1}
          aria-hidden="true"
        >
          {/* Kidney-bean silhouette, approximate */}
          <path d="M10 28 C 10 10, 30 6, 45 14 C 55 19, 60 20, 72 14 C 84 10, 86 24, 80 34 C 76 44, 60 50, 48 44 C 38 40, 30 46, 20 44 C 8 42, 10 36, 10 28 Z" />
          <circle cx="20" cy="20" r="1.5" />
          <circle cx="72" cy="18" r="1.5" />
          <circle cx="30" cy="38" r="1.5" />
          <circle cx="62" cy="40" r="1.5" />
        </svg>
        <div
          className="font-mono text-[11px] tabular-nums leading-tight"
          style={{ color: "var(--paper)" }}
        >
          24.18 mm
          <br />
          38.25 mm
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mobile stacked variant ──────────────────────────────────────────────
//
// Below the `md` breakpoint the 700vh pinned scroll zone is replaced by a
// simple vertical stack. Each row shows the layer number, name, and spec
// alongside a static sprite crop of source.jpg. No LeaderLine (which
// measures DOM rects and cannot resolve meaningfully in a stacked layout).

function AnatomyMobile() {
  return (
    <section
      id="anatomy"
      className="relative px-6 py-20"
      style={{ backgroundColor: "var(--ink)" }}
      aria-labelledby="anatomy-heading-mobile"
    >
      <div className="max-w-[560px] mx-auto">
        <FadeUp>
          <SmallCaps>Anatomy</SmallCaps>
        </FadeUp>
        <FadeUp delay={0.08}>
          <h2
            id="anatomy-heading-mobile"
            className="mt-3 font-display font-light leading-[1.02] tracking-tightest text-[30px] sm:text-[40px]"
            style={{ color: "var(--paper)" }}
          >
            Seven layers. One continuous signal.
          </h2>
        </FadeUp>

        <ol className="mt-12 flex flex-col gap-10">
          {LAYERS.map((L) => (
            <li key={L.n} className="flex flex-col gap-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-mono text-xs tabular-nums"
                    style={{ color: "var(--green-bright)" }}
                  >
                    {String(L.n).padStart(2, "0")}
                  </span>
                  <SmallCaps tone="paper">{L.name}</SmallCaps>
                </div>
                <p
                  className="mt-1 font-display font-light text-[15px] leading-snug whitespace-pre-line"
                  style={{ color: "var(--paper)" }}
                >
                  {L.spec}
                </p>
              </div>

              {/* Static crop of the source image */}
              <div
                className="w-full"
                style={{
                  aspectRatio: `${L.crop.w} / ${L.crop.h}`,
                  backgroundImage: "url(/anatomy/source.jpg)",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${(SOURCE_W / L.crop.w) * 100}% auto`,
                  backgroundPosition: `-${(L.crop.x / (SOURCE_W - L.crop.w)) * 100}% -${(L.crop.y / (SOURCE_H - L.crop.h)) * 100}%`,
                }}
                aria-hidden="true"
              />
            </li>
          ))}
        </ol>
      </div>

      {/* Screen-reader accessible full content */}
      <ol className="sr-only">
        {LAYERS.map((L) => (
          <li key={L.n}>
            {L.n}. {L.name} — {L.spec.replace(/\n/g, " ")}
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─── Reduced-motion fallback ─────────────────────────────────────────────

function ReducedMotionFallback() {
  return (
    <section
      id="anatomy"
      className="relative px-6 md:px-10 py-24"
      style={{ backgroundColor: "var(--ink)" }}
      aria-labelledby="anatomy-heading-rm"
    >
      <div className="max-w-4xl mx-auto">
        <SmallCaps>Anatomy</SmallCaps>
        <h2
          id="anatomy-heading-rm"
          className="mt-3 font-display font-light leading-[1.02] tracking-tightest text-[28px] sm:text-4xl md:text-[44px]"
          style={{ color: "var(--paper)" }}
        >
          Seven layers. One continuous signal.
        </h2>

        <ol className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {LAYERS.map((L) => (
            <li key={L.n}>
              <div className="flex items-baseline gap-3">
                <span
                  className="font-mono text-xs tabular-nums"
                  style={{ color: "var(--green-bright)" }}
                >
                  {String(L.n).padStart(2, "0")}
                </span>
                <SmallCaps tone="paper">{L.name}</SmallCaps>
              </div>
              <p
                className="mt-1 font-display font-light text-base leading-snug whitespace-pre-line"
                style={{ color: "var(--mute)" }}
              >
                {L.spec}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
