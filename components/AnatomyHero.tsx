"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  MotionValue,
} from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { SmallCaps } from "./SmallCaps";
import { useIsMobile } from "@/lib/useIsMobile";

/**
 * AnatomyHero — 9-layer system architecture reveal.
 *
 * A tall pinned section where the user scrolls VERTICALLY and a strip
 * of 9 layer cards slides HORIZONTALLY across the centered stage. One
 * deliberate scroll gesture ≈ one card advance; the active card is
 * always centered under a focal line, with adjacent cards visible and
 * muted to provide spatial context.
 *
 * Section height: (N + 1) × 100vh = 1000vh
 *   • First N × 100vh = 900vh drives the horizontal strip (0 → N-1).
 *   • Final 100vh is a quiet run-out during which the HandoffGradient
 *     fades `--ink` into `--ink-raised` of the Chrome Extension section.
 *
 * Snap rest-points (`.snap-beat`) are placed at the center of each
 * card's scroll band so proximity snap lands the user on a fully-
 * centered card when they stop scrolling. No mandatory snap anywhere —
 * fast flicks remain smooth.
 *
 * Mobile (<768px) and reduced-motion users get a static vertical list
 * fallback (`ReducedMotionHero`).
 */

// ─── Data ────────────────────────────────────────────────────────────────

type Region =
  | "skin"
  | "analog"
  | "filter"
  | "digital"
  | "memory"
  | "rf"
  | "power"
  | "ground"
  | "shell";

type ArchLayer = {
  n: number;
  slug: string;
  name: string;
  summary: string;
  includes: string[];
  appearance: string;
  region: Region;
};

const LAYERS: ReadonlyArray<ArchLayer> = [
  {
    n: 1,
    slug: "sensor",
    name: "Sensor Layer",
    summary: "Captures raw biological signals from the human body.",
    includes: [
      "ECG electrodes (heart signals)",
      "PPG sensors (blood flow, SpO₂, HR, HRV)",
      "Optical emitters (multispectral LEDs)",
    ],
    appearance:
      "An array of microsensors positioned on the skin-contact side, precisely aligned for stable signal acquisition.",
    region: "skin",
  },
  {
    n: 2,
    slug: "analog-front-end",
    name: "Analog Front-End",
    summary:
      "Converts extremely weak biosignals into measurable electrical data.",
    includes: [
      "Ultra-low-noise amplifiers",
      "Signal conditioning circuits",
      "Analog ECG/PPG processing",
    ],
    appearance:
      "An isolated circuit zone with a dedicated analog ground to minimize noise.",
    region: "analog",
  },
  {
    n: 3,
    slug: "signal-filtering",
    name: "Signal Filtering & Processing",
    summary:
      "Cleans the signal from motion artifacts, electrical interference, and external noise.",
    includes: [
      "Hardware filters",
      "Bias circuits (biasing, RLD, ECG stabilization)",
      "EMI isolation",
    ],
    appearance:
      "Symmetrical routing with carefully separated components to preserve signal integrity.",
    region: "filter",
  },
  {
    n: 4,
    slug: "processing",
    name: "Processing Layer",
    summary: "Converts analog signals into structured digital data.",
    includes: [
      "SoC (nRF54L15)",
      "On-device data processing (edge computing)",
      "Sensor data fusion logic",
    ],
    appearance:
      "A compact digital core optimized for performance and power efficiency.",
    region: "digital",
  },
  {
    n: 5,
    slug: "memory",
    name: "Memory Layer",
    summary: "Stores physiological data for later analysis.",
    includes: ["SPI Flash memory", "Circular buffer"],
    appearance:
      "An integrated storage block directly connected to the processor.",
    region: "memory",
  },
  {
    n: 6,
    slug: "wireless",
    name: "Wireless Communication",
    summary: "Transmits data in real time to external devices.",
    includes: [
      "Bluetooth Low Energy (BLE 5.4)",
      "2.4 GHz antenna",
      "RF matching circuit",
    ],
    appearance:
      "A dedicated RF zone with controlled impedance and antenna isolation.",
    region: "rf",
  },
  {
    n: 7,
    slug: "power",
    name: "Power Management",
    summary: "Provides stable and efficient power to all system components.",
    includes: [
      "Wireless charging",
      "DC-DC conversion",
      "Low-noise regulators",
    ],
    appearance:
      "Separated power lines with isolation between analog and digital circuits.",
    region: "power",
  },
  {
    n: 8,
    slug: "grounding",
    name: "Grounding & Noise Suppression",
    summary:
      "Prevents digital signals from interfering with sensitive analog components.",
    includes: [
      "Separate analog ground (AGND)",
      "Single-point connection to common ground",
      "Ferrite-based filtering",
    ],
    appearance:
      "Separated copper regions within the PCB with controlled return current paths.",
    region: "ground",
  },
  {
    n: 9,
    slug: "mechanical",
    name: "Mechanical & Form Factor",
    summary:
      "Transforms complex electronics into a comfortable wearable device.",
    includes: [
      "Behind-the-ear form factor",
      "Contact sensors",
      "Sealed enclosure",
    ],
    appearance:
      "A lightweight, unified structure designed for continuous wear.",
    region: "shell",
  },
];

const N = LAYERS.length;

// 1000vh total: 900vh drives the 9 cards horizontally, 100vh run-out
// for the handoff gradient into the Chrome Extension section.
const PIN_VH = (N + 1) * 100;

// Fraction of scroll during which the horizontal strip is animating.
// The run-out consumes the remaining (1 − SLIDE_END) of scroll.
const SLIDE_END = N / (N + 1); // 9 / 10 = 0.9

// ─── Top level ───────────────────────────────────────────────────────────

export function AnatomyHero() {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  if (reduced || isMobile) {
    return <ReducedMotionHero />;
  }
  return <HorizontalAnatomy />;
}

function HorizontalAnatomy() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const firstCardRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Measure real card pitch (width + gap) and viewport center offset
  // so translateX keeps the active card perfectly centered regardless
  // of viewport size.
  const [pitch, setPitch] = useState(384);
  const [centerOffset, setCenterOffset] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const el = firstCardRef.current;
      if (!el || typeof window === "undefined") return;
      const { width } = el.getBoundingClientRect();
      const gap = 24; // must match the flex gap below
      setPitch(width + gap);
      setCenterOffset(window.innerWidth / 2 - width / 2);
    };
    measure();
    // Re-measure on resize.
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Remap scrollYProgress 0..SLIDE_END → 0..1 across the 9 cards;
  // after SLIDE_END the strip is parked on card N-1 while the run-out
  // plays.
  const remap = (p: number) => {
    if (p <= 0) return 0;
    if (p >= SLIDE_END) return 1;
    return p / SLIDE_END;
  };

  const stripX = useTransform(scrollYProgress, (p) => {
    const q = remap(p);
    return centerOffset - q * (N - 1) * pitch;
  });

  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const q = remap(p);
    const idx = Math.max(0, Math.min(N - 1, Math.round(q * (N - 1))));
    if (idx !== active) setActive(idx);
  });

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${PIN_VH}vh`, backgroundColor: "var(--ink)" }}
      aria-label="Aora Nano system architecture"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <TopBar active={active} />
        <CardStrip x={stripX} active={active} firstCardRef={firstCardRef} />
        <TickRail active={active} />
        <HandoffGradient progress={scrollYProgress} />
      </div>

      {/* Proximity snap rest-points — one per card, spaced through the
          first SLIDE_END of the section so each one corresponds to a
          fully-centered card at rest. Plus one at the very end for the
          handoff. */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        {LAYERS.map((L, i) => {
          const top = (i / (N - 1)) * SLIDE_END * 100;
          return (
            <div
              key={L.n}
              className="snap-beat absolute left-0"
              style={{ top: `${top}%` }}
            />
          );
        })}
        <div
          className="snap-beat absolute left-0"
          style={{ top: "100%" }}
        />
      </div>

      {/* Screen-reader accessible full content */}
      <ol className="sr-only">
        {LAYERS.map((L) => (
          <li key={L.n}>
            {L.n}. {L.name} — {L.summary} Includes: {L.includes.join(", ")}.{" "}
            {L.appearance}
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─── Top bar ─────────────────────────────────────────────────────────────

function TopBar({ active }: { active: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex items-baseline justify-between px-6 md:px-10 pt-20 md:pt-24">
        <SmallCaps tone="paper">System architecture</SmallCaps>
        <div className="flex items-baseline gap-2">
          <span
            className="font-mono text-xs tabular-nums transition-colors duration-300"
            style={{ color: "var(--green-bright)" }}
          >
            {String(active + 1).padStart(2, "0")}
          </span>
          <span
            className="font-mono text-xs tabular-nums"
            style={{ color: "var(--mute)" }}
          >
            / {String(N).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div
        className="hairline mx-6 md:mx-10 mt-5"
        style={{ opacity: 0.5 }}
      />
    </div>
  );
}

// ─── Card strip ──────────────────────────────────────────────────────────

function CardStrip({
  x,
  active,
  firstCardRef,
}: {
  x: MotionValue<number>;
  active: number;
  firstCardRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="absolute inset-0 flex items-center pointer-events-none">
      <motion.div
        className="flex items-stretch gap-6 will-change-transform"
        style={{ x }}
      >
        {LAYERS.map((L, i) => (
          <LayerCard
            key={L.n}
            layer={L}
            distance={Math.abs(i - active)}
            innerRef={i === 0 ? firstCardRef : undefined}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Single layer card ───────────────────────────────────────────────────

function LayerCard({
  layer,
  distance,
  innerRef,
}: {
  layer: ArchLayer;
  distance: number;
  innerRef?: React.MutableRefObject<HTMLDivElement | null>;
}) {
  // Discrete visual tiers by distance from active card.
  const d = Math.min(distance, 3);
  const scale = [1, 0.95, 0.9, 0.85][d];
  const opacity = [1, 0.55, 0.28, 0.12][d];
  const isActive = d === 0;

  return (
    <div
      ref={innerRef}
      className="flex-shrink-0 transition-all duration-[600ms] ease-out-smooth"
      style={{
        width: "clamp(320px, 28vw, 400px)",
        transform: `scale(${scale})`,
        opacity,
      }}
      aria-hidden={!isActive}
    >
      <div
        className="relative flex flex-col p-8"
        style={{
          backgroundColor: "var(--ink-raised)",
          border: "1px solid rgba(244,242,236,0.08)",
          borderRadius: 2,
          minHeight: 480,
          boxShadow: isActive
            ? "0 40px 120px rgba(143,174,90,0.06), 0 0 0 1px rgba(143,174,90,0.18)"
            : "none",
          transition:
            "box-shadow 600ms cubic-bezier(0.22,1,0.36,1), border-color 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Layer number / label */}
        <div className="flex items-baseline gap-3 mb-6">
          <span
            className="font-mono text-[11px] tabular-nums"
            style={{ color: "var(--green-bright)" }}
          >
            {String(layer.n).padStart(2, "0")} / {String(N).padStart(2, "0")}
          </span>
          <SmallCaps tone="paper">Layer</SmallCaps>
        </div>

        {/* Glyph */}
        <div className="flex justify-center mb-6">
          <LayerGlyph region={layer.region} active={isActive} />
        </div>

        {/* Name */}
        <h2
          className="font-display font-light leading-[1.1] tracking-tightest text-[22px] lg:text-[26px] mb-4"
          style={{ color: "var(--paper)" }}
        >
          {layer.name}
        </h2>

        {/* Summary */}
        <p
          className="font-display font-light text-[14px] lg:text-[15px] leading-snug mb-6"
          style={{ color: "var(--paper)" }}
        >
          {layer.summary}
        </p>

        {/* Includes */}
        <div className="mt-auto">
          <SmallCaps className="block mb-2">Includes</SmallCaps>
          <ul className="space-y-1.5">
            {layer.includes.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 font-mono text-[11px] leading-snug tabular-nums"
                style={{ color: "var(--paper)" }}
              >
                <span
                  className="mt-[6px] inline-block flex-shrink-0"
                  style={{
                    width: 4,
                    height: 4,
                    backgroundColor: "var(--green-bright)",
                    borderRadius: 1,
                  }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Tick rail ───────────────────────────────────────────────────────────

function TickRail({ active }: { active: number }) {
  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ bottom: 72 }}
    >
      <div className="relative mx-auto" style={{ width: 360 }}>
        {/* Baseline hairline */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
          style={{
            height: 1,
            backgroundColor: "rgba(244,242,236,0.12)",
          }}
        />
        {/* Dots */}
        <div className="relative flex items-center justify-between">
          {LAYERS.map((L, i) => {
            const isActive = i === active;
            return (
              <div
                key={L.n}
                className="transition-all duration-300 ease-out-smooth"
                style={{
                  width: isActive ? 8 : 4,
                  height: isActive ? 8 : 4,
                  borderRadius: "50%",
                  backgroundColor: isActive
                    ? "var(--green-bright)"
                    : "rgba(244,242,236,0.25)",
                  boxShadow: isActive
                    ? "0 0 12px rgba(143,174,90,0.45)"
                    : "none",
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Hand-off gradient ──────────────────────────────────────────────────

function HandoffGradient({ progress }: { progress: MotionValue<number> }) {
  // Fades the bottom edge from --ink to --ink-raised (color of the
  // ChromeExtensionSection) during the run-out. Starts right before
  // the strip is parked on the last card; full by section end.
  const opacity = useTransform(
    progress,
    [SLIDE_END - 0.02, SLIDE_END + 0.02, 1],
    [0, 0.6, 1],
  );
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
      aria-hidden="true"
      style={{
        opacity,
        height: "28vh",
        background:
          "linear-gradient(to bottom, rgba(10,10,10,0) 0%, var(--ink-raised) 100%)",
      }}
    />
  );
}

// ─── Layer glyphs ────────────────────────────────────────────────────────

/**
 * Each region has a bespoke 120×120 SVG glyph — an abstract engineering
 * mark rather than a photoreal schematic. Paper strokes at rest, with
 * the signature element lifting to `--green-bright` when active.
 */
function LayerGlyph({
  region,
  active,
}: {
  region: Region;
  active: boolean;
}) {
  const stroke = "var(--paper)";
  const accent = active ? "var(--green-bright)" : "var(--paper)";
  const baseOpacity = active ? 1 : 0.5;

  const common = {
    width: 120,
    height: 120,
    viewBox: "0 0 120 120",
    fill: "none" as const,
    stroke,
    strokeWidth: 1,
    style: {
      opacity: baseOpacity,
      transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
    },
  };

  switch (region) {
    case "skin":
      // 3 concentric dashed arcs radiating from a solid source dot.
      return (
        <svg {...common}>
          <circle cx={60} cy={60} r={4} fill={accent} stroke="none" />
          <circle cx={60} cy={60} r={18} strokeDasharray="2 4" />
          <circle cx={60} cy={60} r={32} strokeDasharray="2 6" />
          <circle cx={60} cy={60} r={46} strokeDasharray="2 8" opacity={0.6} />
        </svg>
      );
    case "analog":
      // Sine wave passing through two triangular amplifiers.
      return (
        <svg {...common}>
          <path
            d="M 8 60 Q 20 40, 32 60 T 56 60"
            strokeWidth={1.2}
            stroke={accent}
          />
          <path d="M 56 46 L 78 60 L 56 74 Z" strokeWidth={1} />
          <path
            d="M 78 60 L 88 60"
            strokeWidth={1}
          />
          <path d="M 88 46 L 110 60 L 88 74 Z" strokeWidth={1} />
          <circle cx={67} cy={60} r={1.5} fill={stroke} stroke="none" />
          <circle cx={99} cy={60} r={1.5} fill={stroke} stroke="none" />
        </svg>
      );
    case "filter":
      // Band-pass: a high-pass curve and low-pass curve overlapped.
      return (
        <svg {...common}>
          {/* Axis */}
          <line x1={16} y1={92} x2={104} y2={92} strokeWidth={0.75} />
          <line x1={16} y1={92} x2={16} y2={28} strokeWidth={0.75} />
          {/* Low-pass */}
          <path
            d="M 16 40 L 50 40 Q 60 40, 65 55 L 80 92"
            strokeWidth={1}
          />
          {/* High-pass */}
          <path
            d="M 40 92 L 55 55 Q 60 40, 70 40 L 104 40"
            strokeWidth={1}
            stroke={accent}
          />
          <circle cx={60} cy={48} r={1.8} fill={accent} stroke="none" />
        </svg>
      );
    case "digital":
      // QFN IC outline with 4 pin rows + dashed clock lines.
      return (
        <svg {...common}>
          <rect
            x={34}
            y={34}
            width={52}
            height={52}
            rx={2}
            strokeWidth={1}
          />
          {/* Corner pin-1 dot */}
          <circle cx={40} cy={40} r={2} fill={accent} stroke="none" />
          {/* Top pins */}
          {[44, 52, 60, 68, 76].map((x) => (
            <line
              key={`t${x}`}
              x1={x}
              y1={34}
              x2={x}
              y2={26}
              strokeWidth={0.8}
            />
          ))}
          {/* Bottom pins */}
          {[44, 52, 60, 68, 76].map((x) => (
            <line
              key={`b${x}`}
              x1={x}
              y1={86}
              x2={x}
              y2={94}
              strokeWidth={0.8}
            />
          ))}
          {/* Left pins */}
          {[44, 52, 60, 68, 76].map((y) => (
            <line
              key={`l${y}`}
              x1={34}
              y1={y}
              x2={26}
              y2={y}
              strokeWidth={0.8}
            />
          ))}
          {/* Right pins */}
          {[44, 52, 60, 68, 76].map((y) => (
            <line
              key={`r${y}`}
              x1={86}
              y1={y}
              x2={94}
              y2={y}
              strokeWidth={0.8}
            />
          ))}
          {/* Clock trace */}
          <path
            d="M 94 60 L 104 60 L 104 48 L 112 48"
            strokeWidth={0.8}
            strokeDasharray="2 2"
            stroke={accent}
          />
        </svg>
      );
    case "memory":
      // Stacked data-block rectangles with a shift arrow.
      return (
        <svg {...common}>
          {[30, 48, 66, 84].map((y, i) => (
            <rect
              key={y}
              x={26}
              y={y}
              width={56}
              height={10}
              rx={1}
              strokeWidth={1}
              stroke={i === 1 ? accent : stroke}
            />
          ))}
          {/* Shift arrow */}
          <path
            d="M 90 56 L 102 56 M 98 52 L 102 56 L 98 60"
            strokeWidth={1}
            stroke={accent}
          />
          {/* Internal grid marks */}
          {[30, 48, 66, 84].map((y) =>
            [40, 54, 68].map((x) => (
              <line
                key={`${x}-${y}`}
                x1={x}
                y1={y}
                x2={x}
                y2={y + 10}
                strokeWidth={0.4}
                opacity={0.5}
              />
            )),
          )}
        </svg>
      );
    case "rf":
      // Inverted-F antenna stub with broadcasting arcs.
      return (
        <svg {...common}>
          {/* Ground line */}
          <line x1={16} y1={92} x2={104} y2={92} strokeWidth={1} />
          {/* Inverted-F stub */}
          <path
            d="M 36 92 L 36 54 L 68 54 M 48 54 L 48 70"
            strokeWidth={1.2}
            stroke={accent}
          />
          {/* Feed line */}
          <line x1={48} y1={70} x2={48} y2={92} strokeWidth={0.8} />
          {/* Broadcasting arcs */}
          <path
            d="M 70 54 Q 82 44, 94 54"
            strokeWidth={1}
            opacity={0.9}
          />
          <path
            d="M 68 54 Q 86 36, 104 54"
            strokeWidth={1}
            opacity={0.6}
          />
          <path
            d="M 66 54 Q 90 28, 114 54"
            strokeWidth={1}
            opacity={0.35}
          />
        </svg>
      );
    case "power":
      // Battery cell + DC/DC converter symbol.
      return (
        <svg {...common}>
          {/* Battery */}
          <rect
            x={14}
            y={46}
            width={32}
            height={28}
            strokeWidth={1}
          />
          <rect
            x={46}
            y={54}
            width={4}
            height={12}
            strokeWidth={1}
            fill={stroke}
          />
          {/* Fill bars */}
          <line x1={20} y1={52} x2={20} y2={68} strokeWidth={2} stroke={accent} />
          <line x1={26} y1={52} x2={26} y2={68} strokeWidth={2} stroke={accent} />
          <line x1={32} y1={52} x2={32} y2={68} strokeWidth={2} stroke={accent} opacity={0.6} />
          <line x1={38} y1={52} x2={38} y2={68} strokeWidth={2} stroke={accent} opacity={0.3} />
          {/* Wire */}
          <path d="M 50 60 L 62 60" strokeWidth={0.8} />
          {/* DC/DC converter box */}
          <rect
            x={62}
            y={46}
            width={44}
            height={28}
            strokeWidth={1}
          />
          <text
            x={84}
            y={64}
            textAnchor="middle"
            className="font-mono"
            fontSize={8}
            fill={stroke}
            stroke="none"
            opacity={0.9}
          >
            DC/DC
          </text>
        </svg>
      );
    case "ground":
      // AGND/DGND split plane with single-point bridge.
      return (
        <svg {...common}>
          {/* Left plane (AGND) — hatched */}
          <rect x={14} y={34} width={44} height={52} strokeWidth={0.8} />
          {[38, 46, 54, 62, 70, 78].map((y) => (
            <line
              key={`l${y}`}
              x1={16}
              y1={y}
              x2={56}
              y2={y}
              strokeWidth={0.5}
              opacity={0.5}
            />
          ))}
          {/* Right plane (DGND) — hatched opposite */}
          <rect x={62} y={34} width={44} height={52} strokeWidth={0.8} />
          {[18, 26, 34, 42, 50, 58].map((x) => (
            <line
              key={`r${x}`}
              x1={64 + (x - 18) * 0.7}
              y1={36}
              x2={64 + (x - 18) * 0.7}
              y2={84}
              strokeWidth={0.5}
              opacity={0.5}
            />
          ))}
          {/* Single-point bridge */}
          <path d="M 58 60 L 62 60" strokeWidth={1.5} stroke={accent} />
          <circle cx={60} cy={60} r={2.5} fill={accent} stroke="none" />
          {/* Ground symbol */}
          <path
            d="M 60 92 L 60 98 M 52 94 L 68 94 M 55 97 L 65 97 M 58 100 L 62 100"
            strokeWidth={1}
          />
        </svg>
      );
    case "shell":
      // Behind-the-ear silhouette.
      return (
        <svg {...common}>
          <path
            d="
              M 36 34
              C 36 24, 46 20, 60 20
              C 80 20, 92 28, 92 44
              L 92 78
              C 92 90, 84 96, 70 96
              L 56 96
              C 44 96, 36 90, 36 80
              Z
            "
            strokeWidth={1}
            stroke={accent}
          />
          {/* Ear curve */}
          <path
            d="M 48 48 C 54 40, 66 40, 72 48 C 76 54, 76 62, 72 68"
            strokeWidth={0.9}
            opacity={0.8}
          />
          {/* Contact sensor dots */}
          <circle cx={56} cy={74} r={2} fill={accent} stroke="none" />
          <circle cx={72} cy={74} r={2} fill={accent} stroke="none" />
        </svg>
      );
  }
}

// ─── Reduced-motion / mobile fallback ────────────────────────────────────

function ReducedMotionHero() {
  return (
    <section
      className="relative px-6 md:px-10 py-20"
      style={{ backgroundColor: "var(--ink)" }}
      aria-label="Aora Nano system architecture"
    >
      <div className="max-w-content mx-auto">
        <div className="text-center mb-14">
          <SmallCaps className="block mb-6" tone="paper">
            System architecture
          </SmallCaps>
          <h1
            className="font-display font-light tracking-tightest leading-[1.08] text-[28px] sm:text-[36px] md:text-[44px]"
            style={{ color: "var(--paper)" }}
          >
            Nine layers of engineering. One continuous read on the organ that
            runs you.
          </h1>
        </div>

        <ol className="flex flex-col gap-10 max-w-3xl mx-auto">
          {LAYERS.map((L) => (
            <li
              key={L.n}
              className="grid grid-cols-1 sm:grid-cols-[90px_1fr] gap-5"
            >
              <div>
                <span
                  className="font-mono text-xs tabular-nums"
                  style={{ color: "var(--green-bright)" }}
                >
                  {String(L.n).padStart(2, "0")}
                </span>
              </div>
              <div>
                <SmallCaps tone="paper" className="block mb-2">
                  {L.name}
                </SmallCaps>
                <p
                  className="font-display font-light text-[15px] leading-snug mb-4"
                  style={{ color: "var(--paper)" }}
                >
                  {L.summary}
                </p>

                <div className="mb-3">
                  <SmallCaps className="block mb-1">Includes</SmallCaps>
                  <ul className="space-y-1">
                    {L.includes.map((item) => (
                      <li
                        key={item}
                        className="font-mono text-[12px] leading-snug"
                        style={{ color: "var(--paper)" }}
                      >
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <SmallCaps className="block mb-1">What it looks like</SmallCaps>
                  <p
                    className="font-display font-light text-[13px] leading-snug"
                    style={{ color: "var(--mute)" }}
                  >
                    {L.appearance}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 max-w-2xl mx-auto text-center">
          <SmallCaps className="block mb-3" tone="paper">
            Core principle
          </SmallCaps>
          <p
            className="font-display font-light text-[15px] md:text-[17px] leading-snug"
            style={{ color: "var(--paper)" }}
          >
            AORA Nano is built on a multilayer architecture where each layer
            operates independently but synchronizes in real time — ensuring
            continuous and accurate monitoring of the body&apos;s condition.
          </p>
        </div>
      </div>
    </section>
  );
}
