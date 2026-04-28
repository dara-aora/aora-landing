"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SmallCaps } from "./SmallCaps";

const VIDEO_SRC = "/video/aora-howitworks.mp4";

const LAYERS = [
  {
    number: "01",
    title: "Sensor Layer",
    description: "Reads raw biological signals from the body.",
    includes: [
      "ECG electrodes",
      "PPG sensors (blood flow, SpO\u2082, HR, HRV)",
      "Multispectral LEDs",
    ],
  },
  {
    number: "02",
    title: "Analog Front-End",
    description:
      "Converts extremely weak biosignals into measurable electrical data.",
    includes: [
      "Ultra-low-noise amplifiers",
      "Signal conditioning circuits",
      "Analog ECG/PPG processing",
    ],
  },
  {
    number: "03",
    title: "Filtering & Signal Processing",
    description:
      "Cleans the signal of motion artifacts, electrical interference, and external noise.",
    includes: [
      "Hardware filters",
      "Bias circuits (RLD, ECG stabilization)",
      "EMI isolation",
    ],
  },
  {
    number: "04",
    title: "Processing",
    description: "Converts analog signals into structured digital data.",
    includes: [
      "SoC (nRF54L15)",
      "On-device edge computing",
      "Sensor fusion logic",
    ],
  },
  {
    number: "05",
    title: "Memory",
    description: "Stores physiological data for subsequent analysis.",
    includes: ["SPI Flash memory", "Ring buffer"],
  },
  {
    number: "06",
    title: "Wireless Communication",
    description: "Transmits data in real time to external devices.",
    includes: [
      "Bluetooth Low Energy (BLE 5.4)",
      "2.4 GHz antenna",
      "RF matching circuit",
    ],
  },
  {
    number: "07",
    title: "Power Management",
    description:
      "Provides stable and efficient power to all system components.",
    includes: [
      "Wireless charging",
      "DC-DC conversion",
      "Low-noise voltage regulators",
    ],
  },
  {
    number: "08",
    title: "Grounding & Noise Suppression",
    description:
      "Prevents digital signals from interfering with the sensitive analog section.",
    includes: [
      "Separate analog ground (AGND)",
      "Single-point ground connection",
      "Ferrite filtering",
    ],
  },
  {
    number: "09",
    title: "Mechanical Layer & Form Factor",
    description:
      "Transforms complex electronics into a comfortable wearable device.",
    includes: ["Behind-the-ear form factor", "Contact sensors", "Sealed enclosure"],
  },
];

const TOTAL_LAYERS = LAYERS.length;
const INTRO_END = 0.1;
const LAYER_SPAN = (1 - INTRO_END) / TOTAL_LAYERS;
const CROSSFADE = 0.015;
const LOOP_COUNT = 2;
const TOTAL_LABEL = String(TOTAL_LAYERS).padStart(2, "0");

function getActiveLayer(progress: number): number {
  if (progress < INTRO_END) return -1;
  const adjusted = (progress - INTRO_END) / (1 - INTRO_END);
  const raw = adjusted * TOTAL_LAYERS;
  return Math.min(Math.floor(raw), TOTAL_LAYERS - 1);
}

function LayerCard({
  layer,
  index,
  scrollYProgress,
}: {
  layer: (typeof LAYERS)[number];
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const layerStart = INTRO_END + index * LAYER_SPAN;
  const layerEnd = layerStart + LAYER_SPAN;

  const opacity = useTransform(
    scrollYProgress,
    [layerStart, layerStart + CROSSFADE, layerEnd - CROSSFADE, layerEnd],
    [0, 1, 1, 0],
  );

  const y = useTransform(
    scrollYProgress,
    [layerStart, layerStart + CROSSFADE, layerEnd - CROSSFADE, layerEnd],
    [60, 0, 0, -60],
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center px-6 md:px-10"
      style={{ opacity, y }}
    >
      <div className="max-w-[560px]">
        <span
          className="font-mono text-xs md:text-sm tracking-[0.18em]"
          style={{ color: "var(--green-bright)" }}
        >
          {layer.number}
          <span style={{ color: "var(--mute)" }}>{` / ${TOTAL_LABEL}`}</span>
        </span>
        <h3
          className="mt-2 font-display font-light text-2xl sm:text-3xl md:text-[40px] leading-[1.1] tracking-tightest"
          style={{ color: "var(--paper)" }}
        >
          {layer.title}
        </h3>
        <p
          className="mt-4 font-display font-light text-lg md:text-xl leading-[1.55]"
          style={{ color: "var(--paper)" }}
        >
          {layer.description}
        </p>
        <ul className="mt-5 space-y-2">
          {layer.includes.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-base md:text-[17px] leading-[1.5]"
              style={{ color: "var(--mute)" }}
            >
              <span
                className="mt-1.5 inline-block rounded-full shrink-0"
                style={{
                  width: 5,
                  height: 5,
                  backgroundColor: "var(--green-bright)",
                }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeLayer, setActiveLayer] = useState(-1);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Entry-phase darkening: section is held fully dark while it slides
  // into the viewport from below, then the veil lifts over the last
  // 60% of the entry, finishing fully transparent at the exact moment
  // the sticky stage locks in at the top of the viewport.
  const { scrollYProgress: entryProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });

  const darkenOpacity = useTransform(
    entryProgress,
    [0, 0.4, 1],
    [1, 1, 0],
  );

  const introOpacity = useTransform(
    scrollYProgress,
    [0, INTRO_END * 0.7, INTRO_END],
    [1, 1, 0],
  );

  const layerOpacity = useTransform(
    scrollYProgress,
    [INTRO_END - 0.02, INTRO_END],
    [0, 1],
  );

  useEffect(() => {
    if (reduced) return;
    const v = videoRef.current;
    if (!v) return;

    let rafId = 0;
    let seeking = false;

    v.pause();

    const onSeeked = () => {
      seeking = false;
    };
    v.addEventListener("seeked", onSeeked);

    const onLoaded = () => {
      v.currentTime = 0;
    };
    if (v.readyState >= 1) onLoaded();
    else v.addEventListener("loadedmetadata", onLoaded, { once: true });

    const tick = () => {
      const duration = v.duration;
      if (duration && Number.isFinite(duration)) {
        const p = scrollYProgress.get();
        // Loop the scrub through the clip LOOP_COUNT times across
        // the full section so the video appears to play continuously
        // in the background rather than freezing on its last frame.
        const looped = ((p * LOOP_COUNT) % 1 + 1) % 1;
        const target = Math.max(0, Math.min(duration, looped * duration));
        if (!seeking) {
          const current = v.currentTime;
          const delta = target - current;
          // Detect a loop wrap: if the eased target would scrub
          // backward across most of the clip, snap directly to the
          // new position instead of crawling backward through every
          // frame.
          if (delta < -duration / 2 || delta > duration / 2) {
            seeking = true;
            v.currentTime = target;
          } else if (Math.abs(delta) > 1 / 60) {
            const eased = current + delta * 0.25;
            seeking = true;
            v.currentTime = eased;
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

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      setActiveLayer(getActiveLayer(v));
    });
    return unsubscribe;
  }, [scrollYProgress]);

  if (reduced) {
    return <HowItWorksReduced />;
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: "500vh", backgroundColor: "var(--ink)" }}
      aria-labelledby="hiw-heading"
    >
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: "100svh", minHeight: 560 }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>

        {/* Flat dark overlay — mirrors VideoHero's 55% tint so the
            background video never blasts the user with brightness. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: "rgba(10,10,10,0.55)" }}
        />

        {/* Top/bottom legibility vignette — also mirrors VideoHero. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0) 35%, rgba(10,10,10,0) 60%, rgba(10,10,10,0.7) 92%, rgba(10,10,10,0.9) 100%)",
          }}
        />

        <div
          className="relative h-full w-full flex flex-col justify-center px-6 md:px-10"
          style={{ paddingTop: 80 }}
        >
          <div className="mx-auto w-full max-w-content">
            <motion.div style={{ opacity: introOpacity }}>
              <SmallCaps tone="paper">System Architecture</SmallCaps>
              <h2
                id="hiw-heading"
                className="mt-4 font-display font-light leading-[1.02] tracking-tightest text-[36px] sm:text-5xl md:text-[56px]"
                style={{ color: "var(--paper)" }}
              >
                How it works.
              </h2>
              <p
                className="mt-6 font-display font-light text-lg md:text-xl leading-[1.55] max-w-prose"
                style={{ color: "var(--mute)" }}
              >
                Nine independent layers, synchronized in real time — each
                purpose-built to capture, process, and deliver cognitive state
                without compromise.
              </p>
            </motion.div>

            <motion.div
              style={{ opacity: layerOpacity }}
              className="relative h-[60vh]"
            >
              {LAYERS.map((layer, i) => (
                <LayerCard
                  key={layer.number}
                  layer={layer}
                  index={i}
                  scrollYProgress={scrollYProgress}
                />
              ))}

              <div className="absolute bottom-0 left-0 flex items-center gap-2">
                {LAYERS.map((layer, i) => (
                  <div
                    key={layer.number}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: activeLayer === i ? 20 : 6,
                      height: 6,
                      backgroundColor:
                        activeLayer === i
                          ? "var(--green-bright)"
                          : activeLayer > i
                            ? "var(--green)"
                            : "var(--rule)",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Entry darkener — sits above all sticky-stage content. Held
            fully opaque until the section is 40% into its entry, then
            fades to clear by the moment sticky locks in. */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: "var(--ink)",
            opacity: darkenOpacity,
            zIndex: 30,
          }}
        />
      </div>
    </section>
  );
}

function HowItWorksReduced() {
  return (
    <section
      className="relative w-full px-6 md:px-10 py-28 md:py-40"
      style={{ backgroundColor: "var(--ink)" }}
      aria-labelledby="hiw-heading"
    >
      <div className="max-w-content mx-auto">
        <SmallCaps tone="paper">System Architecture</SmallCaps>
        <h2
          id="hiw-heading"
          className="mt-4 font-display font-light leading-[1.02] tracking-tightest text-[36px] sm:text-5xl md:text-[56px]"
          style={{ color: "var(--paper)" }}
        >
          How it works.
        </h2>
        <p
          className="mt-6 font-display font-light text-lg md:text-xl leading-[1.55] max-w-prose"
          style={{ color: "var(--mute)" }}
        >
          Nine independent layers, synchronized in real time — each
          purpose-built to capture, process, and deliver cognitive state without
          compromise.
        </p>
        <div className="mt-16 space-y-12">
          {LAYERS.map((layer) => (
            <div key={layer.number}>
              <span
                className="font-mono text-xs md:text-sm tracking-[0.18em]"
                style={{ color: "var(--green-bright)" }}
              >
                {layer.number}
              </span>
              <h3
                className="mt-2 font-display font-light text-2xl md:text-[32px] leading-[1.1] tracking-tightest"
                style={{ color: "var(--paper)" }}
              >
                {layer.title}
              </h3>
              <p
                className="mt-3 font-display font-light text-lg md:text-xl leading-[1.55]"
                style={{ color: "var(--paper)" }}
              >
                {layer.description}
              </p>
              <ul className="mt-4 space-y-2">
                {layer.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-base md:text-[17px] leading-[1.5]"
                    style={{ color: "var(--mute)" }}
                  >
                    <span
                      className="mt-1.5 inline-block rounded-full shrink-0"
                      style={{
                        width: 5,
                        height: 5,
                        backgroundColor: "var(--green-bright)",
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}