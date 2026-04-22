"use client";

import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  MotionValue,
} from "framer-motion";
import { useRef, useState } from "react";
import { SmallCaps } from "./SmallCaps";
import { useIsMobile } from "@/lib/useIsMobile";

/**
 * ArchitectureScroll — Neuralink-style pinned reveal of the 9-layer
 * system architecture.
 *
 * A single, tall pinned section (1000vh) where a central PCB hero image
 * stays fixed on screen. As the user scrolls, one of nine overlay zones
 * on the PCB lights up in `--green-bright` (bracket corners + soft
 * glow) and a text panel on the left crossfades to reveal that layer's
 * name, summary, included components, and physical appearance.
 *
 * Section height breakdown:
 *   • 9 × 100vh drives the 9 discrete layer beats
 *   • 1 × 100vh run-out for HandoffGradient into ChromeExtensionSection
 *
 * One deliberate scroll gesture ≈ one layer advance, reinforced by
 * `.snap-beat` markers with `scroll-snap-type: y proximity` on <html>.
 *
 * Mobile (<768px) and `prefers-reduced-motion` users get a static
 * vertical stack via <ReducedMotionView />.
 *
 * PCB photograph reused from /public/anatomy/layer-4-main-pcb.png.
 * Zone coordinates are expressed in a 0–100 viewBox so the overlay
 * scales cleanly at any viewport size.
 */

// ─── Data ────────────────────────────────────────────────────────────────

type Zone = { x: number; y: number; w: number; h: number };

type ArchLayer = {
  n: number;
  slug: string;
  name: string;
  summary: string;
  includes: string[];
  appearance: string;
  /** Primary overlay rect on the PCB (viewBox units 0–100). */
  zone: Zone;
  /** Optional secondary rect — used by Grounding (split plane). */
  zoneB?: Zone;
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
    zone: { x: 2, y: 62, w: 26, h: 30 },
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
    zone: { x: 22, y: 22, w: 18, h: 40 },
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
    zone: { x: 26, y: 64, w: 24, h: 26 },
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
    zone: { x: 40, y: 20, w: 22, h: 55 },
  },
  {
    n: 5,
    slug: "memory",
    name: "Memory Layer",
    summary: "Stores physiological data for later analysis.",
    includes: ["SPI Flash memory", "Circular buffer"],
    appearance:
      "An integrated storage block directly connected to the processor.",
    zone: { x: 62, y: 30, w: 12, h: 28 },
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
    zone: { x: 74, y: 14, w: 24, h: 44 },
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
    zone: { x: 2, y: 10, w: 22, h: 42 },
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
    // Left plane (AGND)
    zone: { x: 2, y: 6, w: 46, h: 88 },
    // Right plane (DGND)
    zoneB: { x: 52, y: 6, w: 46, h: 88 },
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
    zone: { x: 0.5, y: 2, w: 99, h: 96 },
  },
];

const N = LAYERS.length;
// Section height: 9 beats for the card progression + 1 for the run-out.
const PIN_VH = (N + 1) * 100;
// Fraction of scroll during which the strip is animating; remaining
// (1 − SLIDE_END) drives the HandoffGradient run-out.
const SLIDE_END = N / (N + 1);

// ─── Top-level ──────────────────────────────────────────────────────────

export function ArchitectureScroll() {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  if (reduced || isMobile) {
    return <ReducedMotionView />;
  }
  return <DesktopArchitecture />;
}

// ─── Desktop pinned reveal ──────────────────────────────────────────────

function DesktopArchitecture() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (p <= 0) {
      if (active !== 0) setActive(0);
      return;
    }
    // Remap 0..SLIDE_END → 0..1 across 9 layers, then clamp into N bands.
    const q = p >= SLIDE_END ? 1 : p / SLIDE_END;
    // Divide the progression into N equal bands. Using floor (not round)
    // plus a 2% hysteresis band around each boundary prevents the
    // active layer from flickering when the browser's proximity snap
    // settles the user right on a band edge.
    const raw = Math.floor(q * N);
    const idx = Math.max(0, Math.min(N - 1, raw));
    if (idx === active) return;

    // Hysteresis: only advance once we're meaningfully past the band
    // boundary in the direction of travel. This kills the 1-frame
    // stutter previously visible at snap rest-points.
    const boundary = idx > active ? idx / N : (idx + 1) / N;
    const delta = Math.abs(q - boundary);
    if (delta < 0.012) return;

    setActive(idx);
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

        <div className="relative h-full w-full grid grid-cols-[38%_1fr]">
          <TextPanelStack active={active} />
          <PCBStage active={active} />
        </div>

        <TickRail active={active} />
        <HandoffGradient progress={scrollYProgress} />
      </div>

      {/*
        Historically this section carried 9 `.snap-beat` markers so
        proximity snap would softly nudge the user to the nearest
        card at rest. In practice — on macOS trackpads and Chrome on
        Windows alike — the markers fought Framer's scroll transforms:
        the browser would yank `scrollTop` to a marker right after the
        user released the wheel, `scrollYProgress` would jump, and the
        active highlight would visibly teleport between cards.
        Removing the markers makes this section glitch-free. The
        `scroll-snap-type: y proximity` on <html> still lets the
        section-level `.snap-section` markers (on flanking sections)
        work normally.
      */}

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

// ─── Top bar (label + "03 / 09" counter) ─────────────────────────────────

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
      <div className="hairline mx-6 md:mx-10 mt-5" style={{ opacity: 0.5 }} />
    </div>
  );
}

// ─── Text panel stack (left column, crossfade + y-slide) ────────────────

function TextPanelStack({ active }: { active: number }) {
  return (
    <div className="relative z-20 flex items-center px-6 md:px-10 lg:px-14">
      <div className="relative w-full max-w-[480px]" style={{ minHeight: 420 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <TextPanel layer={LAYERS[active]} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TextPanel({ layer }: { layer: ArchLayer }) {
  return (
    <div className="flex flex-col">
      {/* Layer number + LAYER tag */}
      <div className="flex items-baseline gap-3 mb-5">
        <span
          className="font-mono text-[11px] tabular-nums"
          style={{ color: "var(--green-bright)" }}
        >
          {String(layer.n).padStart(2, "0")} / {String(N).padStart(2, "0")}
        </span>
        <SmallCaps tone="paper">Layer</SmallCaps>
      </div>

      {/* Name */}
      <h2
        className="font-display font-light leading-[1.05] tracking-tightest text-[30px] lg:text-[36px] mb-5"
        style={{ color: "var(--paper)" }}
      >
        {layer.name}
      </h2>

      {/* Summary */}
      <p
        className="font-display font-light text-[16px] lg:text-[17px] leading-snug mb-8"
        style={{ color: "var(--paper)" }}
      >
        {layer.summary}
      </p>

      {/* Includes */}
      <div className="mb-6">
        <SmallCaps className="block mb-2">Includes</SmallCaps>
        <ul className="space-y-1.5">
          {layer.includes.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 font-mono text-[12px] leading-snug tabular-nums"
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

      {/* Appearance */}
      <div>
        <SmallCaps className="block mb-2">Appearance</SmallCaps>
        <p
          className="font-display font-light text-[13px] lg:text-[14px] leading-snug"
          style={{ color: "var(--mute)" }}
        >
          {layer.appearance}
        </p>
      </div>
    </div>
  );
}

// ─── PCB stage (right column) ────────────────────────────────────────────

/**
 * PCBStage — the square SVG board.
 *
 * DO NOT, under any circumstance, let this regress to a raster image.
 * The 9 zone rectangles in LAYERS[].zone were authored in a 0-100
 * square coord space. The only rules you need to keep:
 *
 *   • Container MUST be `aspect-square`. Not 520/135, not 16/9.
 *   • SVG MUST omit `preserveAspectRatio="none"` — default meet is
 *     required so zones don't stretch horizontally.
 *   • The board is authored inline as SVG, not loaded as a photo.
 *
 * Every previous regression of this component hit one of those three
 * traps. The comment is here so the next editor reads it first.
 */

// Short silkscreen labels painted on each zone (uppercase mono).
// Index aligned to LAYERS[i].
const ZONE_LABELS = [
  "SENSOR",
  "AFE",
  "FILTER",
  "MCU",
  "MEM",
  "RF",
  "PWR",
  "GND",
  "SHELL",
] as const;

// Trace polylines connecting related zones. Each is an array of
// viewBox (0-100) [x, y] points. Paints as a thin silkscreen trace.
const TRACES: ReadonlyArray<ReadonlyArray<[number, number]>> = [
  // Sensor → AFE → Filter → MCU (signal chain)
  [[15, 77], [24, 77], [24, 42], [31, 42]],
  [[31, 77], [40, 77], [40, 47]],
  // MCU → Memory
  [[62, 47], [68, 47]],
  // MCU → RF
  [[62, 36], [86, 36]],
  // Power → MCU (power rail)
  [[13, 31], [40, 31]],
  // Ground spine across the board
  [[5, 95], [95, 95]],
  [[5, 4], [95, 4]],
];

// Static decorative via positions (purely cosmetic — sell the PCB feel).
const VIAS: ReadonlyArray<[number, number]> = [
  [8, 8], [92, 8], [8, 92], [92, 92],
  [50, 2], [50, 98], [2, 50], [98, 50],
  [25, 15], [75, 15], [25, 85], [75, 85],
];

function PCBStage({ active }: { active: number }) {
  return (
    <div
      className="relative z-10 flex items-center justify-center overflow-hidden px-6 md:px-10"
      aria-hidden="true"
    >
      {/* Soft radial vignette behind the board */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(143,174,90,0.05) 0%, rgba(10,10,10,0) 60%)",
        }}
      />

      <div className="relative w-full max-w-[420px] md:max-w-[520px] lg:max-w-[620px] aspect-square">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          // No `preserveAspectRatio="none"` — let it meet, aspect-square
          // ensures zones render true to authored coords.
        >
          <defs>
            <filter id="arch-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern
              id="pcb-silk"
              x="0"
              y="0"
              width="2"
              height="2"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="0.1" fill="var(--paper)" opacity="0.18" />
            </pattern>
          </defs>

          <BoardSubstrate />
          <ZoneOutlines active={active} />
          <MCUChip />
          <ZoneLabels active={active} />

          {/* Active highlight */}
          <AnimatePresence mode="wait">
            <motion.g
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <ActiveZone zone={LAYERS[active].zone} />
              {LAYERS[active].zoneB && (
                <>
                  <ActiveZone zone={LAYERS[active].zoneB!} />
                  {/* Single-point bridge between the two planes (Grounding) */}
                  <line
                    x1={LAYERS[active].zone.x + LAYERS[active].zone.w}
                    y1={50}
                    x2={LAYERS[active].zoneB!.x}
                    y2={50}
                    stroke="var(--green-bright)"
                    strokeWidth={0.5}
                    vectorEffect="non-scaling-stroke"
                    filter="url(#arch-glow)"
                  />
                  <circle
                    cx={50}
                    cy={50}
                    r={0.8}
                    fill="var(--green-bright)"
                    filter="url(#arch-glow)"
                  />
                </>
              )}
            </motion.g>
          </AnimatePresence>
        </svg>
      </div>
    </div>
  );
}

// ─── Static board chrome ────────────────────────────────────────────────

/**
 * BoardSubstrate — the static board backdrop: outer outline, silkscreen
 * grid fill, inter-zone copper traces, decorative vias. Rendered once
 * beneath everything else. Pure SVG, no state.
 */
function BoardSubstrate() {
  return (
    <g>
      {/* Silkscreen grid fill (very low opacity) */}
      <rect
        x={0.5}
        y={0.5}
        width={99}
        height={99}
        rx={2.5}
        ry={2.5}
        fill="url(#pcb-silk)"
        opacity={0.25}
      />

      {/* Outer board outline */}
      <rect
        x={0.5}
        y={0.5}
        width={99}
        height={99}
        rx={2.5}
        ry={2.5}
        fill="none"
        stroke="var(--paper)"
        strokeWidth={0.4}
        opacity={0.18}
        vectorEffect="non-scaling-stroke"
      />

      {/* Copper traces between related zones */}
      {TRACES.map((pts, i) => (
        <polyline
          key={`tr-${i}`}
          points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="var(--paper)"
          strokeWidth={0.3}
          opacity={0.12}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* Decorative vias (pads) */}
      {VIAS.map(([x, y], i) => (
        <circle
          key={`via-${i}`}
          cx={x}
          cy={y}
          r={0.4}
          fill="var(--paper)"
          opacity={0.15}
        />
      ))}
    </g>
  );
}

/**
 * ZoneOutlines — the 9 dashed zone rectangles with a faint filled
 * background, plus 2–3 small decorative component footprints inside
 * each (pads). The one matching `active` is hidden here because the
 * ActiveZone overlay takes over.
 */
function ZoneOutlines({ active }: { active: number }) {
  return (
    <g>
      {LAYERS.map((L, i) => {
        if (i === active) return null;
        return (
          <g key={`zo-${L.n}`}>
            {/* Faint fill so each zone reads as a component block */}
            <rect
              x={L.zone.x}
              y={L.zone.y}
              width={L.zone.w}
              height={L.zone.h}
              fill="var(--paper)"
              fillOpacity={0.025}
            />
            {/* Dashed outline */}
            <InactiveZone zone={L.zone} hidden={false} />
            {/* Two footprint pads per zone (cosmetic) */}
            <circle
              cx={L.zone.x + L.zone.w * 0.25}
              cy={L.zone.y + L.zone.h * 0.5}
              r={0.35}
              fill="var(--paper)"
              opacity={0.22}
            />
            <circle
              cx={L.zone.x + L.zone.w * 0.75}
              cy={L.zone.y + L.zone.h * 0.5}
              r={0.35}
              fill="var(--paper)"
              opacity={0.22}
            />
          </g>
        );
      })}
      {/* Secondary zones (Grounding) */}
      {LAYERS.map((L, i) =>
        L.zoneB && i !== active ? (
          <g key={`zb-${L.n}`}>
            <rect
              x={L.zoneB.x}
              y={L.zoneB.y}
              width={L.zoneB.w}
              height={L.zoneB.h}
              fill="var(--paper)"
              fillOpacity={0.02}
            />
            <InactiveZone zone={L.zoneB} hidden={false} />
          </g>
        ) : null,
      )}
    </g>
  );
}

/**
 * ZoneLabels — small silkscreen-style "01 SENSOR" labels anchored
 * to the top-left inside each zone. Active layer's label is paper-
 * bright; others stay dim.
 */
function ZoneLabels({ active }: { active: number }) {
  return (
    <g>
      {LAYERS.map((L, i) => {
        const isActive = i === active;
        const pad = 1.2;
        return (
          <g
            key={`zl-${L.n}`}
            style={{
              opacity: isActive ? 0.95 : 0.35,
              transition: "opacity 320ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <text
              x={L.zone.x + pad}
              y={L.zone.y + pad + 1.6}
              fontFamily="var(--font-mono), ui-monospace, monospace"
              fontSize={1.6}
              fill={isActive ? "var(--green-bright)" : "var(--paper)"}
              letterSpacing={0.05}
            >
              {String(L.n).padStart(2, "0")}
            </text>
            <text
              x={L.zone.x + pad + 4}
              y={L.zone.y + pad + 1.6}
              fontFamily="var(--font-mono), ui-monospace, monospace"
              fontSize={1.6}
              fill="var(--paper)"
              letterSpacing={0.12}
            >
              {ZONE_LABELS[i]}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * MCUChip — extra silkscreen detail for zone 4 (Processing).
 * A centered chip outline with pin segments along each edge and a
 * silk-label "nRF54L15". Static; independent of active state.
 */
function MCUChip() {
  const z = LAYERS[3].zone; // Processing
  // Chip is ~55% of the zone, centered.
  const cw = z.w * 0.55;
  const ch = z.h * 0.35;
  const cx = z.x + z.w / 2 - cw / 2;
  const cy = z.y + z.h / 2 - ch / 2;

  // Pins: 6 per side.
  const pins: Array<[number, number, number, number]> = [];
  const pinCount = 6;
  const pinLen = 0.7;
  for (let i = 0; i < pinCount; i++) {
    const t = (i + 0.5) / pinCount;
    const px = cx + cw * t;
    const py = cy + ch * t;
    // top pin
    pins.push([px, cy, px, cy - pinLen]);
    // bottom pin
    pins.push([px, cy + ch, px, cy + ch + pinLen]);
    // left pin
    pins.push([cx, py, cx - pinLen, py]);
    // right pin
    pins.push([cx + cw, py, cx + cw + pinLen, py]);
  }

  return (
    <g opacity={0.55}>
      {/* Chip body */}
      <rect
        x={cx}
        y={cy}
        width={cw}
        height={ch}
        rx={0.3}
        ry={0.3}
        fill="var(--ink)"
        stroke="var(--paper)"
        strokeWidth={0.25}
        strokeOpacity={0.45}
        vectorEffect="non-scaling-stroke"
      />
      {/* Dot indicator (pin 1 marker) */}
      <circle
        cx={cx + 0.8}
        cy={cy + 0.8}
        r={0.25}
        fill="var(--paper)"
        opacity={0.6}
      />
      {/* Pins */}
      {pins.map(([x1, y1, x2, y2], i) => (
        <line
          key={`pin-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="var(--paper)"
          strokeWidth={0.2}
          opacity={0.35}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {/* Silk label */}
      <text
        x={cx + cw / 2}
        y={cy + ch / 2 + 0.5}
        textAnchor="middle"
        fontFamily="var(--font-mono), ui-monospace, monospace"
        fontSize={1.3}
        fill="var(--paper)"
        opacity={0.55}
        letterSpacing={0.08}
      >
        nRF54L15
      </text>
    </g>
  );
}

// Inactive zone — thin dashed paper-colored rect, low opacity.
function InactiveZone({ zone, hidden }: { zone: Zone; hidden: boolean }) {
  return (
    <rect
      x={zone.x}
      y={zone.y}
      width={zone.w}
      height={zone.h}
      fill="none"
      stroke="var(--paper)"
      strokeWidth={0.25}
      strokeDasharray="0.8 0.8"
      vectorEffect="non-scaling-stroke"
      style={{
        opacity: hidden ? 0 : 0.18,
        transition: "opacity 300ms cubic-bezier(0.22,1,0.36,1)",
      }}
    />
  );
}

// Active zone — solid green rect + 4 L-shaped bracket corners + pulse dot.
function ActiveZone({ zone }: { zone: Zone }) {
  const { x, y, w, h } = zone;
  // Bracket corner length: ~12% of the smaller zone side, clamped.
  const cl = Math.max(2, Math.min(w, h) * 0.12);

  return (
    <g>
      {/* Main rect — solid green, soft glow */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke="var(--green-bright)"
        strokeWidth={0.35}
        vectorEffect="non-scaling-stroke"
        filter="url(#arch-glow)"
      />

      {/* Bracket corners (thicker) — TL, TR, BL, BR */}
      {/* Top-left */}
      <polyline
        points={`${x},${y + cl} ${x},${y} ${x + cl},${y}`}
        fill="none"
        stroke="var(--green-bright)"
        strokeWidth={0.7}
        vectorEffect="non-scaling-stroke"
        filter="url(#arch-glow)"
      />
      {/* Top-right */}
      <polyline
        points={`${x + w - cl},${y} ${x + w},${y} ${x + w},${y + cl}`}
        fill="none"
        stroke="var(--green-bright)"
        strokeWidth={0.7}
        vectorEffect="non-scaling-stroke"
        filter="url(#arch-glow)"
      />
      {/* Bottom-left */}
      <polyline
        points={`${x},${y + h - cl} ${x},${y + h} ${x + cl},${y + h}`}
        fill="none"
        stroke="var(--green-bright)"
        strokeWidth={0.7}
        vectorEffect="non-scaling-stroke"
        filter="url(#arch-glow)"
      />
      {/* Bottom-right */}
      <polyline
        points={`${x + w - cl},${y + h} ${x + w},${y + h} ${x + w},${y + h - cl}`}
        fill="none"
        stroke="var(--green-bright)"
        strokeWidth={0.7}
        vectorEffect="non-scaling-stroke"
        filter="url(#arch-glow)"
      />

      {/* Pulse dot (center of zone) */}
      <motion.circle
        cx={x + w / 2}
        cy={y + h / 2}
        r={0.6}
        fill="var(--green-bright)"
        filter="url(#arch-glow)"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </g>
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
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
          style={{ height: 1, backgroundColor: "rgba(244,242,236,0.12)" }}
        />
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

// ─── Handoff gradient — fades --ink into --ink-raised on run-out ─────────

function HandoffGradient({ progress }: { progress: MotionValue<number> }) {
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

// ─── Reduced-motion / mobile fallback ────────────────────────────────────

/**
 * MiniBoard — a compact square SVG board used in the
 * ReducedMotionView list. Same board chrome as PCBStage, scaled down,
 * with a single layer's zone highlighted.
 */
function MiniBoard({ layer }: { layer: ArchLayer }) {
  return (
    <div className="relative w-full max-w-[240px] aspect-square mt-2">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
      >
        <defs>
          <filter
            id={`mini-glow-${layer.n}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern
            id={`mini-silk-${layer.n}`}
            x="0"
            y="0"
            width="2"
            height="2"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.1" fill="var(--paper)" opacity="0.18" />
          </pattern>
        </defs>

        {/* Grid fill + outline */}
        <rect
          x={0.5}
          y={0.5}
          width={99}
          height={99}
          rx={2.5}
          ry={2.5}
          fill={`url(#mini-silk-${layer.n})`}
          opacity={0.25}
        />
        <rect
          x={0.5}
          y={0.5}
          width={99}
          height={99}
          rx={2.5}
          ry={2.5}
          fill="none"
          stroke="var(--paper)"
          strokeWidth={0.4}
          opacity={0.18}
          vectorEffect="non-scaling-stroke"
        />

        {/* All 9 zone outlines (faint) */}
        {LAYERS.map((L) => (
          <g key={`mini-${L.n}`}>
            <rect
              x={L.zone.x}
              y={L.zone.y}
              width={L.zone.w}
              height={L.zone.h}
              fill="var(--paper)"
              fillOpacity={0.025}
            />
            <rect
              x={L.zone.x}
              y={L.zone.y}
              width={L.zone.w}
              height={L.zone.h}
              fill="none"
              stroke="var(--paper)"
              strokeWidth={0.25}
              strokeDasharray="0.8 0.8"
              opacity={0.18}
              vectorEffect="non-scaling-stroke"
            />
            {L.zoneB && (
              <rect
                x={L.zoneB.x}
                y={L.zoneB.y}
                width={L.zoneB.w}
                height={L.zoneB.h}
                fill="none"
                stroke="var(--paper)"
                strokeWidth={0.25}
                strokeDasharray="0.8 0.8"
                opacity={0.18}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        ))}

        {/* Highlighted zone */}
        <rect
          x={layer.zone.x}
          y={layer.zone.y}
          width={layer.zone.w}
          height={layer.zone.h}
          fill="none"
          stroke="var(--green-bright)"
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
          filter={`url(#mini-glow-${layer.n})`}
        />
        {layer.zoneB && (
          <rect
            x={layer.zoneB.x}
            y={layer.zoneB.y}
            width={layer.zoneB.w}
            height={layer.zoneB.h}
            fill="none"
            stroke="var(--green-bright)"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
            filter={`url(#mini-glow-${layer.n})`}
          />
        )}
      </svg>
    </div>
  );
}

function ReducedMotionView() {
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

        <ol className="flex flex-col gap-12 max-w-3xl mx-auto">
          {LAYERS.map((L) => (
            <li key={L.n} className="flex flex-col gap-4">
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
                className="font-display font-light text-[17px] leading-snug"
                style={{ color: "var(--paper)" }}
              >
                {L.summary}
              </p>

              {/* Mini SVG board thumbnail with this layer's zone lit */}
              <MiniBoard layer={L} />

              <div>
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
                <SmallCaps className="block mb-1">Appearance</SmallCaps>
                <p
                  className="font-display font-light text-[13px] leading-snug"
                  style={{ color: "var(--mute)" }}
                >
                  {L.appearance}
                </p>
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
