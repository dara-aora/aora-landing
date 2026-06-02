"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import {
  ScanLine,
  Waves,
  Filter,
  Cpu,
  Database,
  Wifi,
  BatteryCharging,
  Shield,
  Layers,
} from "lucide-react";
import { SmallCaps } from "./SmallCaps";
import { useIsMobile } from "@/lib/useIsMobile";

const LAYERS = [
  {
    number: "01",
    title: "Sensor Layer",
    description: "Reads raw biological signals from the body.",
    includes: ["ECG electrodes", "PPG sensors (SpO₂, HR, HRV)"],
    Icon: ScanLine,
  },
  {
    number: "02",
    title: "Analog Front-End",
    description: "Converts extremely weak biosignals into measurable data.",
    includes: ["Ultra-low-noise amplifiers", "Analog ECG/PPG processing"],
    Icon: Waves,
  },
  {
    number: "03",
    title: "Filtering & Signal Processing",
    description: "Cleans artifacts, interference, and external noise.",
    includes: ["Hardware filters", "EMI isolation"],
    Icon: Filter,
  },
  {
    number: "04",
    title: "Processing",
    description: "Converts analog signals into structured digital data.",
    includes: ["SoC (nRF54L15)", "On-device edge computing"],
    Icon: Cpu,
  },
  {
    number: "05",
    title: "Memory",
    description: "Stores physiological data for subsequent analysis.",
    includes: ["SPI Flash memory", "Ring buffer"],
    Icon: Database,
  },
  {
    number: "06",
    title: "Wireless Communication",
    description: "Transmits data in real time to external devices.",
    includes: ["BLE 5.4", "2.4 GHz antenna"],
    Icon: Wifi,
  },
  {
    number: "07",
    title: "Power Management",
    description: "Provides stable and efficient power to all components.",
    includes: ["Wireless charging", "Low-noise voltage regulators"],
    Icon: BatteryCharging,
  },
  {
    number: "08",
    title: "Grounding & Noise Suppression",
    description: "Prevents digital signals from interfering with analog.",
    includes: ["Separate AGND", "Ferrite filtering"],
    Icon: Shield,
  },
  {
    number: "09",
    title: "Mechanical Layer & Form Factor",
    description: "Transforms complex electronics into a wearable device.",
    includes: ["Behind-the-ear form factor", "Sealed enclosure"],
    Icon: Layers,
  },
];

export function HowItWorks() {
  const isMobile = useIsMobile();
  return isMobile ? <HowItWorksMobile /> : <HowItWorksDesktop />;
}

function HowItWorksDesktop() {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative w-full px-6 md:px-10 py-28 md:py-40 snap-section"
      style={{ backgroundColor: "var(--ink-raised)" }}
      aria-labelledby="hiw-heading"
    >
      <div className="max-w-content mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:w-[35%] lg:sticky lg:top-24"
          >
            <SmallCaps tone="paper">System Architecture</SmallCaps>
            <h2
              id="hiw-heading"
              className="mt-4 font-display font-light leading-[1.02] tracking-tightest text-[36px] sm:text-5xl md:text-[56px]"
              style={{ color: "var(--paper)" }}
            >
              How it works.
            </h2>
            <p
              className="mt-6 font-display font-light text-lg md:text-xl leading-[1.55]"
              style={{ color: "var(--mute)" }}
            >
              Nine independent layers, synchronized in real time. Each
              purpose-built to capture, process, and deliver cognitive state
              without compromise.
            </p>

            <div
              className="mt-10 relative overflow-hidden"
              style={{
                aspectRatio: "4 / 3",
                backgroundColor: "var(--ink)",
                border: "1px solid var(--rule)",
                borderRadius: 2,
              }}
            >
              <div className="flex items-center justify-center h-full w-full p-4 md:p-6">
                <img
                  src="/device-aora.png"
                  alt="Aora Nano device"
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            </div>
          </motion.div>

          <div className="lg:w-[65%]">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {LAYERS.map((layer) => (
                <GridCard key={layer.number} layer={layer} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GridCard({
  layer,
}: {
  layer: (typeof LAYERS)[number];
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = layer.Icon;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-default"
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ rotateY: hovered ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front face */}
        <div
          style={{
            backfaceVisibility: "hidden",
            backgroundColor: "var(--ink)",
            border: "1px solid var(--rule)",
            borderRadius: 4,
          }}
          className="flex flex-col items-center justify-center p-6 text-center min-h-[220px]"
        >
          <Icon
            size={24}
            strokeWidth={1.2}
            style={{ color: "var(--green-bright)", marginBottom: 12 }}
          />
          <span
            className="font-mono text-[10px] tracking-wider block mb-2"
            style={{ color: "var(--mute)" }}
          >
            {layer.number}
          </span>
          <h3
            className="font-display font-light text-base md:text-lg leading-tight"
            style={{ color: "var(--paper)" }}
          >
            {layer.title}
          </h3>
        </div>

        {/* Back face */}
        <div
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backgroundColor: "var(--ink)",
            border: "1px solid var(--rule)",
            borderRadius: 4,
          }}
          className="absolute inset-0 flex flex-col justify-center p-5"
        >
          <span
            className="font-mono text-[10px] tracking-wider block mb-2"
            style={{ color: "var(--green-bright)" }}
          >
            {layer.number}
          </span>
          <h3
            className="font-display font-light text-base leading-tight mb-2"
            style={{ color: "var(--paper)" }}
          >
            {layer.title}
          </h3>
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: "var(--mute)" }}
          >
            {layer.description}
          </p>
          <ul className="space-y-1.5">
            {layer.includes.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs leading-snug"
                style={{ color: "var(--mute)" }}
              >
                <span
                  className="mt-1 inline-block rounded-full shrink-0"
                  style={{
                    width: 4,
                    height: 4,
                    backgroundColor: "var(--green-bright)",
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HowItWorksMobile() {
  const reduced = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="relative w-full px-6 py-28 snap-section"
      style={{ backgroundColor: "var(--ink-raised)" }}
      aria-labelledby="hiw-heading-mobile"
    >
      <div className="max-w-content mx-auto">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <SmallCaps tone="paper">System Architecture</SmallCaps>
          <h2
            id="hiw-heading-mobile"
            className="mt-4 font-display font-light leading-[1.02] tracking-tightest text-[36px] sm:text-5xl"
            style={{ color: "var(--paper)" }}
          >
            How it works.
          </h2>
          <p
            className="mt-6 font-display font-light text-lg leading-[1.55]"
            style={{ color: "var(--mute)" }}
          >
            Nine independent layers, synchronized in real time.
          </p>
        </motion.div>

        <div
          className="mt-10 mb-12 relative overflow-hidden"
          style={{
            aspectRatio: "4 / 3",
            backgroundColor: "var(--ink)",
            border: "1px solid var(--rule)",
            borderRadius: 2,
          }}
        >
          <div className="flex items-center justify-center h-full w-full p-4 md:p-6">
            <img
              src="/device-aora.png"
              alt="Aora Nano device"
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LAYERS.map((layer, i) => {
            const Icon = layer.Icon;
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={layer.number}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="cursor-pointer"
                style={{
                  backgroundColor: "var(--ink)",
                  border: "1px solid var(--rule)",
                  borderRadius: 4,
                  padding: "20px",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon
                    size={20}
                    strokeWidth={1.2}
                    style={{ color: "var(--green-bright)" }}
                  />
                  <span
                    className="font-mono text-[10px] tracking-wider"
                    style={{ color: "var(--mute)" }}
                  >
                    {layer.number}
                  </span>
                </div>
                <h3
                  className="font-display font-light text-base leading-tight mb-2"
                  style={{ color: "var(--paper)" }}
                >
                  {layer.title}
                </h3>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    <p
                      className="text-sm leading-relaxed mb-2"
                      style={{ color: "var(--mute)" }}
                    >
                      {layer.description}
                    </p>
                    <ul className="space-y-1">
                      {layer.includes.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs leading-snug"
                          style={{ color: "var(--mute)" }}
                        >
                          <span
                            className="mt-1 inline-block rounded-full shrink-0"
                            style={{
                              width: 4,
                              height: 4,
                              backgroundColor: "var(--green-bright)",
                            }}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}