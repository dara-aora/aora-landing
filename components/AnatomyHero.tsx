"use client";

import {
  motion,
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
 * AnatomyHero — System architecture reveal.
 *
 * Pinned scroll zone (~900vh). At each scroll beat, one of nine
 * functional layers of the AORA Nano system is surfaced. A blueprint-
 * style schematic is rendered in SVG at center — filled enclosure,
 * PCB region with subtle copper tint, authentic component footprints
 * (nRF54L15 QFN, SOIC flash, inverted-F antenna with matching network,
 * differentiated PPG / ECG / LED sensor icons), curved signal traces,
 * AGND/DGND split plane, and a corner reticle + dimension ticks.
 *
 * On each layer beat, the corresponding region is spotlighted (soft
 * radial bloom + thin locator ring + leader line to a mini-caption)
 * while every other component dims to ~25% — cinematic focus that
 * echoes a Neuralink-style technical reveal.
 *
 * The finale beat lights all nine regions simultaneously and draws a
 * thin green mesh between them to visualize "layers synchronize in
 * real time".
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
const PIN_VH = 900;

// Scroll choreography bands.
const INTRO_END = 0.06;
const FINALE_START = 0.9;
const REVEAL_SPAN = FINALE_START - INTRO_END;

// ─── Schematic geometry ──────────────────────────────────────────────────
// Authoritative viewBox for the schematic SVG. All region coordinates
// are measured against this 800×600 canvas. The React layer positions
// the spotlight using percentages derived from these values.

const VB_W = 800;
const VB_H = 600;

// Precision-aligned centers of each schematic region (in SVG units).
// The spotlight and finale mesh reference these. They must match the
// actual geometry drawn inside <PCBSchematic />.
const REGION_PX: Record<Region, { x: number; y: number; label: string }> = {
  shell:   { x: 400, y: 110, label: "Behind-the-ear shell" },
  power:   { x: 240, y: 210, label: "Power management rail" },
  rf:      { x: 600, y: 210, label: "RF / antenna zone" },
  filter:  { x: 320, y: 300, label: "Filter & bias network" },
  digital: { x: 400, y: 310, label: "Digital core · nRF54L15" },
  memory:  { x: 510, y: 300, label: "SPI flash · storage" },
  analog:  { x: 235, y: 360, label: "Analog front-end" },
  ground:  { x: 400, y: 405, label: "AGND · split plane" },
  skin:    { x: 400, y: 490, label: "Skin-contact sensors" },
};

// Convert REGION_PX → normalized fractions for use by HTML spotlight.
const REGION_POS: Record<Region, { cx: number; cy: number; label: string }> =
  Object.fromEntries(
    (Object.keys(REGION_PX) as Region[]).map((k) => {
      const { x, y, label } = REGION_PX[k];
      return [k, { cx: x / VB_W, cy: y / VB_H, label }];
    }),
  ) as Record<Region, { cx: number; cy: number; label: string }>;

// ─── Top-level component ─────────────────────────────────────────────────

export function AnatomyHero() {
  // Mobile: 900vh pinned zone is fatiguing on phones, and the layered
  // SVG callouts are sized for desktop. Render the static stacked
  // fallback (already authored as ReducedMotionHero) on phones.
  const isMobile = useIsMobile();
  if (isMobile) return <ReducedMotionHero />;
  return <AnatomyHeroDesktop />;
}

function AnatomyHeroDesktop() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const [active, setActive] = useState(-1); // -1 = intro, N = finale

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (p < INTRO_END) {
      if (active !== -1) setActive(-1);
      return;
    }
    if (p >= FINALE_START) {
      if (active !== N) setActive(N);
      return;
    }
    const idx = Math.max(
      0,
      Math.min(N - 1, Math.floor(((p - INTRO_END) / REVEAL_SPAN) * N)),
    );
    if (idx !== active) setActive(idx);
  });

  if (reduced) {
    return <ReducedMotionHero />;
  }

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${PIN_VH}vh`, backgroundColor: "var(--ink)" }}
      aria-label="Aora Nano system architecture"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <HeroTagline progress={scrollYProgress} />

        <LayerRail active={active} progress={scrollYProgress} />

        <DeviceStage active={active} progress={scrollYProgress} />

        <DetailPanel active={active} progress={scrollYProgress} />

        <ScrollHint progress={scrollYProgress} />
        <ProgressCounter active={active} />
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

// ─── Hero tagline — intro beat only ──────────────────────────────────────

function HeroTagline({ progress }: { progress: MotionValue<number> }) {
  // Fully fade out the moment we scroll past the intro beat. The per-
  // layer DetailPanel becomes the sole headline carrier from then on.
  const opacity = useTransform(
    progress,
    [0, 0.02, INTRO_END, INTRO_END + 0.015],
    [1, 1, 1, 0],
  );

  return (
    <motion.div
      className="absolute top-0 left-0 right-0 z-20 px-6 md:px-10 pt-16 md:pt-20 pointer-events-none"
      style={{ opacity }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <SmallCaps className="block mb-3 md:mb-4" tone="paper">
          System architecture
        </SmallCaps>
        <h1
          className="font-display font-light tracking-tightest leading-[1.06] text-[22px] sm:text-[28px] md:text-[34px] lg:text-[40px]"
          style={{ color: "var(--paper)" }}
        >
          Nine layers of engineering.
          <br />
          <span style={{ color: "var(--mute)" }}>
            One continuous read on the organ that runs you.
          </span>
        </h1>
      </div>
    </motion.div>
  );
}

// ─── Left label rail ─────────────────────────────────────────────────────

function LayerRail({
  active,
  progress,
}: {
  active: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(
    progress,
    [INTRO_END - 0.02, INTRO_END + 0.02, FINALE_START - 0.02, FINALE_START + 0.02],
    [0, 1, 1, 0],
  );

  return (
    <motion.aside
      className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-[30%] lg:w-[26%] xl:w-[24%] items-center px-8 lg:px-10 pointer-events-none"
      style={{ opacity }}
    >
      <ol className="flex flex-col gap-3 w-full">
        {LAYERS.map((L, i) => {
          const isActive = i === active;
          return (
            <li
              key={L.n}
              id={`arch-label-${L.n}`}
              className="transition-all duration-500 ease-out"
              style={{
                opacity: isActive ? 1 : 0.22,
                transform: isActive ? "translateX(0)" : "translateX(-4px)",
              }}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="font-mono text-[11px] tabular-nums transition-colors duration-500"
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
            </li>
          );
        })}
      </ol>
    </motion.aside>
  );
}

// ─── Device stage — blueprint backdrop + schematic + spotlight ───────────

function DeviceStage({
  active,
  progress,
}: {
  active: number;
  progress: MotionValue<number>;
}) {
  const stageOpacity = useTransform(
    progress,
    [INTRO_END - 0.02, INTRO_END + 0.03, FINALE_START - 0.02, FINALE_START + 0.05],
    [0, 1, 1, 1],
  );

  const activeLayer = active >= 0 && active < N ? LAYERS[active] : null;
  const activeRegion = activeLayer?.region ?? null;
  const isFinale = active === N;
  const pos = activeLayer ? REGION_POS[activeLayer.region] : null;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity: stageOpacity }}
      aria-hidden="true"
    >
      <div className="relative w-full max-w-[560px] md:max-w-[660px] h-[62vh] md:h-[70vh] mx-6 md:ml-[26%] lg:ml-[22%] md:mr-[32%] lg:mr-[28%]">
        {/* Blueprint backdrop: ambient glow, dot grid, corner reticle */}
        <BlueprintBackdrop />

        {/* Precision schematic */}
        <PCBSchematic activeRegion={activeRegion} isFinale={isFinale} />

        {/* Per-layer spotlight (hidden during finale & intro) */}
        {pos && !isFinale && (
          <RegionSpotlight
            pos={pos}
            layerKey={activeLayer!.slug}
            index={active}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── Blueprint backdrop (ambient glow + grid + reticle) ──────────────────

function BlueprintBackdrop() {
  return (
    <>
      {/* Ambient radial spotlight */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(143,174,90,0.08) 0%, rgba(20,20,20,0.25) 45%, rgba(10,10,10,0) 75%)",
        }}
      />

      {/* Dot grid (SVG pattern) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern
            id="arch-dot-grid"
            width={20}
            height={20}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={1} cy={1} r={0.7} fill="var(--paper)" opacity={0.08} />
          </pattern>
        </defs>
        <rect
          x={40}
          y={40}
          width={VB_W - 80}
          height={VB_H - 80}
          fill="url(#arch-dot-grid)"
        />

        {/* Corner reticle brackets (camera viewfinder / CAD callout) */}
        <g
          stroke="var(--paper)"
          strokeOpacity={0.22}
          strokeWidth={1}
          fill="none"
        >
          {/* TL */}
          <path d="M 40 64 L 40 40 L 64 40" />
          {/* TR */}
          <path d={`M ${VB_W - 64} 40 L ${VB_W - 40} 40 L ${VB_W - 40} 64`} />
          {/* BL */}
          <path d={`M 40 ${VB_H - 64} L 40 ${VB_H - 40} L 64 ${VB_H - 40}`} />
          {/* BR */}
          <path
            d={`M ${VB_W - 40} ${VB_H - 64} L ${VB_W - 40} ${
              VB_H - 40
            } L ${VB_W - 64} ${VB_H - 40}`}
          />
        </g>

        {/* Top-left coordinate label */}
        <text
          x={48}
          y={32}
          className="font-mono"
          fontSize={10}
          fill="var(--mute)"
          opacity={0.8}
        >
          AORA NANO · SYSTEM SCHEMATIC
        </text>
        <text
          x={VB_W - 48}
          y={32}
          textAnchor="end"
          className="font-mono"
          fontSize={10}
          fill="var(--mute)"
          opacity={0.8}
        >
          REV 0.1
        </text>

        {/* Dimension ticks (bottom) */}
        <g
          stroke="var(--paper)"
          strokeOpacity={0.3}
          strokeWidth={0.75}
          fill="none"
        >
          <line
            x1={180}
            y1={VB_H - 22}
            x2={VB_W - 180}
            y2={VB_H - 22}
          />
          <line x1={180} y1={VB_H - 28} x2={180} y2={VB_H - 16} />
          <line
            x1={VB_W - 180}
            y1={VB_H - 28}
            x2={VB_W - 180}
            y2={VB_H - 16}
          />
        </g>
        <text
          x={VB_W / 2}
          y={VB_H - 8}
          textAnchor="middle"
          className="font-mono"
          fontSize={10}
          fill="var(--mute)"
          opacity={0.85}
        >
          38.25 mm
        </text>

        {/* Dimension ticks (right) */}
        <g
          stroke="var(--paper)"
          strokeOpacity={0.3}
          strokeWidth={0.75}
          fill="none"
        >
          <line
            x1={VB_W - 22}
            y1={160}
            x2={VB_W - 22}
            y2={VB_H - 160}
          />
          <line
            x1={VB_W - 28}
            y1={160}
            x2={VB_W - 16}
            y2={160}
          />
          <line
            x1={VB_W - 28}
            y1={VB_H - 160}
            x2={VB_W - 16}
            y2={VB_H - 160}
          />
        </g>
        <text
          x={VB_W - 8}
          y={VB_H / 2}
          textAnchor="middle"
          className="font-mono"
          fontSize={10}
          fill="var(--mute)"
          opacity={0.85}
          transform={`rotate(90 ${VB_W - 8} ${VB_H / 2})`}
        >
          24.18 mm
        </text>
      </svg>
    </>
  );
}

// ─── Main schematic ──────────────────────────────────────────────────────

/**
 * Filled, layered precision schematic of the AORA Nano. Each logical
 * region is wrapped in a <g data-region="…"> with a React-controlled
 * opacity so non-active regions can dim during a layer beat.
 */
function PCBSchematic({
  activeRegion,
  isFinale,
}: {
  activeRegion: Region | null;
  isFinale: boolean;
}) {
  // Helper: opacity multiplier for a given region group.
  // - finale: all regions bright (1)
  // - no active layer (intro): everything at normal resting opacity (1)
  // - active layer: that region at 1, others at 0.25
  const regionOpacity = (r: Region): number => {
    if (isFinale) return 1;
    if (!activeRegion) return 1;
    return r === activeRegion ? 1 : 0.25;
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Enclosure gradient (dark, slight top-light) */}
        <linearGradient id="arch-enclosure" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0c0c0c" />
        </linearGradient>

        {/* PCB inner fill — extremely subtle warm copper tint */}
        <linearGradient id="arch-pcb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(180,140,90,0.10)" />
          <stop offset="100%" stopColor="rgba(180,140,90,0.04)" />
        </linearGradient>

        {/* Soft green glow for accents */}
        <filter
          id="arch-glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Rim-light on enclosure edge */}
        <filter
          id="arch-rim"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Enclosure shell (behind-the-ear kidney silhouette) ── */}
      <g
        data-region="shell"
        style={{
          opacity: regionOpacity("shell"),
          transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <path
          d="
            M 170 135
            C 170 90, 210 65, 280 60
            L 520 60
            C 595 60, 635 95, 640 155
            L 640 430
            C 640 495, 600 530, 525 540
            L 275 540
            C 200 530, 170 495, 170 430
            Z
          "
          fill="url(#arch-enclosure)"
          stroke="var(--paper)"
          strokeOpacity={0.35}
          strokeWidth={1}
          filter="url(#arch-rim)"
        />
        {/* Top highlight hairline */}
        <path
          d="M 200 82 C 250 70, 300 68, 500 68"
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.18}
          strokeWidth={0.8}
        />
        {/* Shell label */}
        <text
          x={400}
          y={100}
          textAnchor="middle"
          className="font-mono"
          fontSize={9}
          fill="var(--paper)"
          opacity={0.38}
          letterSpacing={2}
        >
          BEHIND-THE-EAR ENCLOSURE
        </text>
      </g>

      {/* ── PCB board region (inner) ── */}
      <g>
        <rect
          x={210}
          y={145}
          width={380}
          height={360}
          rx={14}
          fill="url(#arch-pcb)"
          stroke="var(--paper)"
          strokeOpacity={0.28}
          strokeWidth={1}
        />
        {/* Inner PCB hairline outline */}
        <rect
          x={220}
          y={155}
          width={360}
          height={340}
          rx={10}
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.12}
          strokeWidth={0.6}
          strokeDasharray="2 3"
        />
      </g>

      {/* ── Signal trace backbone (subtle, always visible) ── */}
      <g
        stroke="var(--paper)"
        strokeOpacity={0.14}
        strokeWidth={0.7}
        fill="none"
        strokeDasharray="3 3"
      >
        {/* Sensor → Analog */}
        <path d="M 350 470 C 310 440, 260 410, 235 380" />
        <path d="M 400 470 C 380 440, 320 410, 260 380" />
        <path d="M 450 470 C 420 440, 360 410, 290 380" />
        {/* Analog → Filter → Digital */}
        <path d="M 260 350 C 290 330, 310 320, 330 310" />
        <path d="M 340 300 L 380 310" />
        {/* Digital → Memory */}
        <path d="M 430 310 L 490 300" />
        {/* Digital → RF */}
        <path d="M 420 295 C 460 260, 530 230, 580 210" />
        {/* Power → Digital */}
        <path d="M 260 220 C 320 250, 360 280, 385 300" />
      </g>

      {/* ── AGND / DGND split plane ── */}
      <g
        data-region="ground"
        style={{
          opacity: regionOpacity("ground"),
          transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <line
          x1={220}
          y1={410}
          x2={580}
          y2={410}
          stroke="var(--paper)"
          strokeOpacity={0.32}
          strokeWidth={0.8}
          strokeDasharray="4 4"
        />
        <text
          x={230}
          y={402}
          className="font-mono"
          fontSize={8}
          fill="var(--paper)"
          opacity={0.5}
          letterSpacing={1.5}
        >
          DGND
        </text>
        <text
          x={570}
          y={426}
          textAnchor="end"
          className="font-mono"
          fontSize={8}
          fill="var(--paper)"
          opacity={0.5}
          letterSpacing={1.5}
        >
          AGND
        </text>
        {/* Single-point stitch */}
        <circle cx={400} cy={410} r={2.2} fill="var(--paper)" opacity={0.55} />
        <circle
          cx={400}
          cy={410}
          r={5}
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.35}
          strokeWidth={0.6}
        />
      </g>

      {/* ── Power management rail (top-left) ── */}
      <g
        data-region="power"
        style={{
          opacity: regionOpacity("power"),
          transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Buck/inductor block */}
        <rect
          x={225}
          y={180}
          width={70}
          height={60}
          rx={3}
          fill="#0f0f0f"
          stroke="var(--paper)"
          strokeOpacity={0.5}
          strokeWidth={0.9}
        />
        {/* Inductor coil symbol */}
        <path
          d="M 235 210 Q 242 200 249 210 Q 256 220 263 210 Q 270 200 277 210 Q 284 220 285 210"
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.6}
          strokeWidth={1}
        />
        {/* SMD caps */}
        <rect
          x={240}
          y={222}
          width={8}
          height={5}
          fill="var(--paper)"
          opacity={0.5}
        />
        <rect
          x={255}
          y={222}
          width={8}
          height={5}
          fill="var(--paper)"
          opacity={0.5}
        />
        <rect
          x={270}
          y={222}
          width={8}
          height={5}
          fill="var(--paper)"
          opacity={0.5}
        />
        <text
          x={260}
          y={173}
          textAnchor="middle"
          className="font-mono"
          fontSize={8}
          fill="var(--paper)"
          opacity={0.55}
          letterSpacing={1.2}
        >
          PMIC · DC-DC
        </text>
        {/* Wireless charging coil hint (small concentric circles) */}
        <circle
          cx={250}
          cy={255}
          r={10}
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.3}
          strokeWidth={0.6}
        />
        <circle
          cx={250}
          cy={255}
          r={6}
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.3}
          strokeWidth={0.6}
        />
        <circle
          cx={250}
          cy={255}
          r={2.5}
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.45}
          strokeWidth={0.6}
        />
      </g>

      {/* ── RF / antenna zone (top-right) ── */}
      <g
        data-region="rf"
        style={{
          opacity: regionOpacity("rf"),
          transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Inverted-F antenna trunk */}
        <path
          d="M 555 180 L 640 180 L 640 240"
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.65}
          strokeWidth={1.2}
        />
        {/* Feed */}
        <path
          d="M 580 180 L 580 210"
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.65}
          strokeWidth={1}
        />
        {/* Tuning stub */}
        <path
          d="M 600 180 L 600 195"
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.55}
          strokeWidth={0.9}
        />
        {/* Matching network: 2 caps + 1 inductor */}
        {/* Cap 1 */}
        <g stroke="var(--paper)" strokeOpacity={0.6} strokeWidth={0.9} fill="none">
          <line x1={545} y1={205} x2={545} y2={218} />
          <line x1={538} y1={218} x2={552} y2={218} />
          <line x1={538} y1={222} x2={552} y2={222} />
          <line x1={545} y1={222} x2={545} y2={235} />
        </g>
        {/* Inductor */}
        <path
          d="M 560 215 q 4 -6 8 0 q 4 -6 8 0 q 4 -6 8 0"
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.6}
          strokeWidth={0.9}
        />
        {/* Cap 2 */}
        <g stroke="var(--paper)" strokeOpacity={0.6} strokeWidth={0.9} fill="none">
          <line x1={605} y1={205} x2={605} y2={218} />
          <line x1={598} y1={218} x2={612} y2={218} />
          <line x1={598} y1={222} x2={612} y2={222} />
          <line x1={605} y1={222} x2={605} y2={235} />
        </g>
        <text
          x={580}
          y={168}
          textAnchor="middle"
          className="font-mono"
          fontSize={8}
          fill="var(--paper)"
          opacity={0.55}
          letterSpacing={1.2}
        >
          BLE 5.4 · 2.4 GHz
        </text>
        <text
          x={580}
          y={254}
          textAnchor="middle"
          className="font-mono"
          fontSize={7}
          fill="var(--paper)"
          opacity={0.42}
          letterSpacing={1}
        >
          π-MATCH
        </text>
      </g>

      {/* ── Analog front-end block (left) ── */}
      <g
        data-region="analog"
        style={{
          opacity: regionOpacity("analog"),
          transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <rect
          x={210}
          y={335}
          width={58}
          height={48}
          rx={2}
          fill="#0f0f0f"
          stroke="var(--paper)"
          strokeOpacity={0.55}
          strokeWidth={0.9}
        />
        {/* Pin-1 dot */}
        <circle cx={216} cy={341} r={1.3} fill="var(--paper)" opacity={0.7} />
        {/* QFN pins */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={`af-t-${i}`}
            x={222 + i * 10}
            y={332}
            width={6}
            height={2}
            fill="var(--paper)"
            opacity={0.55}
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={`af-b-${i}`}
            x={222 + i * 10}
            y={384}
            width={6}
            height={2}
            fill="var(--paper)"
            opacity={0.55}
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={`af-l-${i}`}
            x={207}
            y={342 + i * 10}
            width={2}
            height={6}
            fill="var(--paper)"
            opacity={0.55}
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={`af-r-${i}`}
            x={269}
            y={342 + i * 10}
            width={2}
            height={6}
            fill="var(--paper)"
            opacity={0.55}
          />
        ))}
        <text
          x={239}
          y={365}
          textAnchor="middle"
          className="font-mono"
          fontSize={7}
          fill="var(--paper)"
          opacity={0.65}
          letterSpacing={1}
        >
          AFE
        </text>
        <text
          x={239}
          y={400}
          textAnchor="middle"
          className="font-mono"
          fontSize={7}
          fill="var(--paper)"
          opacity={0.45}
          letterSpacing={1}
        >
          LOW-NOISE AMP
        </text>
      </g>

      {/* ── Filter & bias network (between AFE and SoC) ── */}
      <g
        data-region="filter"
        style={{
          opacity: regionOpacity("filter"),
          transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* RC filter pair */}
        <g stroke="var(--paper)" strokeOpacity={0.6} strokeWidth={0.85} fill="none">
          {/* Resistor 1 */}
          <path d="M 295 290 l 5 -4 l 5 8 l 5 -8 l 5 8 l 5 -8 l 5 4" />
          {/* Resistor 2 */}
          <path d="M 295 310 l 5 -4 l 5 8 l 5 -8 l 5 8 l 5 -8 l 5 4" />
        </g>
        {/* Cap between them */}
        <g stroke="var(--paper)" strokeOpacity={0.55} strokeWidth={0.85} fill="none">
          <line x1={325} y1={293} x2={325} y2={303} />
          <line x1={319} y1={303} x2={331} y2={303} />
          <line x1={319} y1={306} x2={331} y2={306} />
          <line x1={325} y1={306} x2={325} y2={316} />
        </g>
        {/* Ferrite bead */}
        <rect
          x={338}
          y={296}
          width={12}
          height={7}
          rx={1}
          fill="var(--paper)"
          opacity={0.45}
        />
        <text
          x={322}
          y={335}
          textAnchor="middle"
          className="font-mono"
          fontSize={7}
          fill="var(--paper)"
          opacity={0.5}
          letterSpacing={1}
        >
          FILTER · BIAS
        </text>
      </g>

      {/* ── Digital core — nRF54L15 QFN ── */}
      <g
        data-region="digital"
        style={{
          opacity: regionOpacity("digital"),
          transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Package body */}
        <rect
          x={365}
          y={275}
          width={70}
          height={70}
          rx={3}
          fill="#0a0a0a"
          stroke="var(--paper)"
          strokeOpacity={0.8}
          strokeWidth={1.1}
        />
        {/* Die hint (inner outline) */}
        <rect
          x={380}
          y={290}
          width={40}
          height={40}
          fill="none"
          stroke="var(--paper)"
          strokeOpacity={0.2}
          strokeWidth={0.6}
        />
        {/* Pin-1 indicator */}
        <circle cx={372} cy={282} r={1.8} fill="var(--paper)" opacity={0.85} />
        {/* QFN pins — 7 per side */}
        {Array.from({ length: 7 }, (_, i) => {
          const p = 374 + i * 8.5;
          return (
            <g key={`q-${i}`}>
              <rect x={p - 1.5} y={271} width={3} height={4} fill="var(--paper)" opacity={0.7} />
              <rect x={p - 1.5} y={345} width={3} height={4} fill="var(--paper)" opacity={0.7} />
              <rect
                x={361}
                y={281 + i * 8.5}
                width={4}
                height={3}
                fill="var(--paper)"
                opacity={0.7}
              />
              <rect
                x={435}
                y={281 + i * 8.5}
                width={4}
                height={3}
                fill="var(--paper)"
                opacity={0.7}
              />
            </g>
          );
        })}
        {/* Chip label */}
        <text
          x={400}
          y={315}
          textAnchor="middle"
          className="font-mono"
          fontSize={8.5}
          fill="var(--paper)"
          opacity={0.85}
          letterSpacing={1.2}
        >
          nRF54L15
        </text>
        <text
          x={400}
          y={328}
          textAnchor="middle"
          className="font-mono"
          fontSize={6.5}
          fill="var(--paper)"
          opacity={0.55}
          letterSpacing={1.5}
        >
          SoC · EDGE
        </text>
      </g>

      {/* ── Memory block — SOIC-8 ── */}
      <g
        data-region="memory"
        style={{
          opacity: regionOpacity("memory"),
          transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <rect
          x={480}
          y={285}
          width={60}
          height={32}
          rx={2}
          fill="#0f0f0f"
          stroke="var(--paper)"
          strokeOpacity={0.6}
          strokeWidth={0.9}
        />
        {/* Pin-1 dot */}
        <circle cx={486} cy={291} r={1.2} fill="var(--paper)" opacity={0.7} />
        {/* Pins top/bottom (SOIC-8) */}
        {[0, 1, 2, 3].map((i) => (
          <g key={`m-${i}`}>
            <rect
              x={487 + i * 13}
              y={281}
              width={4}
              height={4}
              fill="var(--paper)"
              opacity={0.55}
            />
            <rect
              x={487 + i * 13}
              y={317}
              width={4}
              height={4}
              fill="var(--paper)"
              opacity={0.55}
            />
          </g>
        ))}
        <text
          x={510}
          y={305}
          textAnchor="middle"
          className="font-mono"
          fontSize={7.5}
          fill="var(--paper)"
          opacity={0.7}
          letterSpacing={1.2}
        >
          SPI FLASH
        </text>
        <text
          x={510}
          y={337}
          textAnchor="middle"
          className="font-mono"
          fontSize={6.5}
          fill="var(--paper)"
          opacity={0.45}
          letterSpacing={1.4}
        >
          CIRCULAR BUFFER
        </text>
      </g>

      {/* ── Sensor row (skin-contact side, bottom) ── */}
      <g
        data-region="skin"
        style={{
          opacity: regionOpacity("skin"),
          transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* ECG pad (left square) */}
        <g>
          <rect
            x={275}
            y={470}
            width={28}
            height={28}
            rx={3}
            fill="none"
            stroke="var(--paper)"
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <rect
            x={282}
            y={477}
            width={14}
            height={14}
            fill="var(--paper)"
            opacity={0.35}
          />
          <text
            x={289}
            y={512}
            textAnchor="middle"
            className="font-mono"
            fontSize={7}
            fill="var(--paper)"
            opacity={0.6}
            letterSpacing={1.3}
          >
            ECG
          </text>
        </g>
        {/* PPG photodiode (concentric rings) */}
        <g>
          <circle
            cx={355}
            cy={484}
            r={14}
            fill="none"
            stroke="var(--paper)"
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <circle
            cx={355}
            cy={484}
            r={9}
            fill="none"
            stroke="var(--paper)"
            strokeOpacity={0.5}
            strokeWidth={0.8}
          />
          <circle cx={355} cy={484} r={3} fill="var(--paper)" opacity={0.7} />
          <text
            x={355}
            y={512}
            textAnchor="middle"
            className="font-mono"
            fontSize={7}
            fill="var(--paper)"
            opacity={0.6}
            letterSpacing={1.3}
          >
            PPG
          </text>
        </g>
        {/* LED emitter (diamond) */}
        <g>
          <path
            d="M 410 484 L 424 470 L 438 484 L 424 498 Z"
            fill="none"
            stroke="var(--paper)"
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <circle cx={424} cy={484} r={3} fill="var(--green-bright)" opacity={0.55} />
          <text
            x={424}
            y={512}
            textAnchor="middle"
            className="font-mono"
            fontSize={7}
            fill="var(--paper)"
            opacity={0.6}
            letterSpacing={1.3}
          >
            LED
          </text>
        </g>
        {/* Second PPG */}
        <g>
          <circle
            cx={465}
            cy={484}
            r={14}
            fill="none"
            stroke="var(--paper)"
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <circle
            cx={465}
            cy={484}
            r={9}
            fill="none"
            stroke="var(--paper)"
            strokeOpacity={0.5}
            strokeWidth={0.8}
          />
          <circle cx={465} cy={484} r={3} fill="var(--paper)" opacity={0.7} />
          <text
            x={465}
            y={512}
            textAnchor="middle"
            className="font-mono"
            fontSize={7}
            fill="var(--paper)"
            opacity={0.6}
            letterSpacing={1.3}
          >
            PPG
          </text>
        </g>
        {/* Second ECG pad */}
        <g>
          <rect
            x={500}
            y={470}
            width={28}
            height={28}
            rx={3}
            fill="none"
            stroke="var(--paper)"
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <rect
            x={507}
            y={477}
            width={14}
            height={14}
            fill="var(--paper)"
            opacity={0.35}
          />
          <text
            x={514}
            y={512}
            textAnchor="middle"
            className="font-mono"
            fontSize={7}
            fill="var(--paper)"
            opacity={0.6}
            letterSpacing={1.3}
          >
            ECG
          </text>
        </g>
      </g>

      {/* ── Finale mesh (thin green lines connecting all 9 regions) ── */}
      {isFinale && <FinaleMesh />}
    </svg>
  );
}

// ─── Finale: thin green mesh connecting all regions ──────────────────────

function FinaleMesh() {
  // Draw a mesh between every pair of region centers at low intensity,
  // plus a brighter dot at each region center. Feels like a signal graph.
  const regions = Object.keys(REGION_PX) as Region[];
  const lines: Array<{ a: Region; b: Region }> = [];
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      lines.push({ a: regions[i], b: regions[j] });
    }
  }

  return (
    <g style={{ pointerEvents: "none" }}>
      {/* Mesh lines — animate path draw in */}
      {lines.map(({ a, b }, i) => {
        const pa = REGION_PX[a];
        const pb = REGION_PX[b];
        return (
          <motion.line
            key={`mesh-${a}-${b}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke="var(--green-bright)"
            strokeWidth={0.6}
            strokeOpacity={0.2}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.1 + i * 0.012,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        );
      })}
      {/* Region dots */}
      {regions.map((r, i) => {
        const p = REGION_PX[r];
        return (
          <motion.g
            key={`dot-${r}`}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.2 + i * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={9}
              fill="var(--green-bright)"
              opacity={0.15}
              filter="url(#arch-glow)"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={3.2}
              fill="var(--green-bright)"
              opacity={0.95}
              filter="url(#arch-glow)"
            />
          </motion.g>
        );
      })}
    </g>
  );
}

// ─── Region spotlight (HTML overlay, positioned by % of stage) ───────────

function RegionSpotlight({
  pos,
  layerKey,
  index,
}: {
  pos: { cx: number; cy: number; label: string };
  layerKey: string;
  index: number;
}) {
  const leftPct = pos.cx * 100;
  const topPct = pos.cy * 100;

  return (
    <motion.div
      key={layerKey}
      className="absolute pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: "translate(-50%, -50%)",
        willChange: "transform, opacity",
      }}
    >
      <div className="relative" style={{ width: 200, height: 200 }}>
        {/* Soft feathered bloom (big) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(143,174,90,0.38) 0%, rgba(143,174,90,0.10) 40%, rgba(143,174,90,0) 70%)",
          }}
        />
        {/* Pulsing locator ring */}
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 70,
            height: 70,
            x: "-50%",
            y: "-50%",
            border: "1px solid var(--green-bright)",
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.9, 0, 0.9] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
        />
        {/* Crisp locator ring (static) */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 44,
            height: 44,
            transform: "translate(-50%, -50%)",
            border: "1px solid rgba(143,174,90,0.75)",
          }}
        />
        {/* Center dot */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 7,
            height: 7,
            transform: "translate(-50%, -50%)",
            backgroundColor: "var(--green-bright)",
            boxShadow:
              "0 0 14px var(--green-bright), 0 0 28px rgba(143,174,90,0.55)",
          }}
        />
      </div>

      {/* Leader line + mini-caption (right of the spotlight) */}
      <motion.div
        className="absolute whitespace-nowrap"
        style={{
          left: 100,
          top: 0,
          transform: "translate(0, -50%)",
        }}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3">
          {/* Leader line */}
          <svg width={64} height={1} style={{ overflow: "visible" }}>
            <motion.line
              x1={0}
              y1={0.5}
              x2={64}
              y2={0.5}
              stroke="var(--green-bright)"
              strokeWidth={1}
              strokeOpacity={0.75}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div
            className="font-mono text-[10px] tabular-nums"
            style={{ color: "var(--green-bright)", letterSpacing: "0.12em" }}
          >
            {String(index + 1).padStart(2, "0")} · {pos.label.toUpperCase()}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Right-side detail panel ─────────────────────────────────────────────

function DetailPanel({
  active,
  progress,
}: {
  active: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(
    progress,
    [INTRO_END - 0.02, INTRO_END + 0.03, FINALE_START - 0.02, FINALE_START + 0.02],
    [0, 1, 1, 0],
  );

  const L = active >= 0 && active < N ? LAYERS[active] : null;

  return (
    <motion.aside
      className="hidden md:block absolute right-0 top-0 bottom-0 z-20 w-[34%] lg:w-[32%] xl:w-[30%] px-6 lg:px-10 pointer-events-none"
      style={{ opacity }}
    >
      <div className="h-full flex items-center">
        <div className="w-full">
          {L ? (
            <motion.div
              key={L.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-baseline gap-3 mb-3">
                <span
                  className="font-mono text-xs tabular-nums"
                  style={{ color: "var(--green-bright)" }}
                >
                  {String(L.n).padStart(2, "0")} / {String(N).padStart(2, "0")}
                </span>
                <SmallCaps tone="paper">Layer</SmallCaps>
              </div>

              <h2
                className="font-display font-light leading-[1.1] tracking-tightest text-[26px] lg:text-[32px] mb-5"
                style={{ color: "var(--paper)" }}
              >
                {L.name}
              </h2>

              <p
                className="font-display font-light text-[15px] lg:text-[17px] leading-snug mb-8"
                style={{ color: "var(--paper)" }}
              >
                {L.summary}
              </p>

              <div className="mb-7">
                <SmallCaps className="block mb-2">Includes</SmallCaps>
                <ul className="space-y-1.5">
                  {L.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 font-mono text-[12px] leading-snug tabular-nums"
                      style={{ color: "var(--paper)" }}
                    >
                      <span
                        className="mt-1.5 inline-block flex-shrink-0"
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

              <div>
                <SmallCaps className="block mb-2">What it looks like</SmallCaps>
                <p
                  className="font-display font-light text-[13px] lg:text-[14px] leading-snug"
                  style={{ color: "var(--mute)" }}
                >
                  {L.appearance}
                </p>
              </div>
            </motion.div>
          ) : null}

          {/* Finale copy slot — shows during the FINALE beat, in the
              same right-column position the per-layer panel owned. */}
          {active === N && <FinaleCopy />}
        </div>
      </div>
    </motion.aside>
  );
}

function FinaleCopy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <SmallCaps className="block mb-3" tone="paper">
        Core principle
      </SmallCaps>
      <h2
        className="font-display font-light leading-[1.08] tracking-tightest text-[28px] lg:text-[36px] mb-5"
        style={{ color: "var(--paper)" }}
      >
        Nine layers.{" "}
        <span style={{ color: "var(--mute)" }}>One coherent signal.</span>
      </h2>
      <p
        className="font-display font-light text-[14px] lg:text-[16px] leading-snug"
        style={{ color: "var(--paper)" }}
      >
        AORA Nano is built on a multilayer architecture where each layer
        operates independently but synchronizes in real time — ensuring
        continuous and accurate monitoring of the body&apos;s condition.
      </p>
    </motion.div>
  );
}

// ─── Scroll hint ─────────────────────────────────────────────────────────

function ScrollHint({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.02, 0.05], [1, 1, 0]);
  return (
    <motion.div
      className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 scroll-hint z-30 pointer-events-none"
      style={{ opacity }}
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
  );
}

// ─── Progress counter (bottom-right) ─────────────────────────────────────

function ProgressCounter({ active }: { active: number }) {
  const show = active >= 0 && active < N;
  return (
    <div
      className="hidden md:flex absolute bottom-10 right-10 z-30 items-baseline gap-2 pointer-events-none transition-opacity duration-300"
      style={{ opacity: show ? 1 : 0 }}
      aria-hidden="true"
    >
      <span
        className="font-mono text-xs tabular-nums"
        style={{ color: "var(--green-bright)" }}
      >
        {show ? String(active + 1).padStart(2, "0") : "00"}
      </span>
      <span
        className="font-mono text-xs tabular-nums"
        style={{ color: "var(--mute)" }}
      >
        / {String(N).padStart(2, "0")}
      </span>
    </div>
  );
}

// ─── Reduced-motion fallback ─────────────────────────────────────────────

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
