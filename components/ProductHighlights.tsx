"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ImagePlaceholder } from "./ImagePlaceholder";

const panels = [
  {
    number: "01",
    headline: "Engineered for you.",
    body: "Featherlight, made to disappear and feel like a second skin.",
    image: "/1.webp",
    imageLabel: "Device on surface",
  },
  {
    number: "02",
    headline: "Wear it. Forget it.",
    body: "Designed to sit comfortably behind your ear, all day.",
    image: "/2.webp",
    imageLabel: "Worn behind the ear",
  },
  {
    number: "03",
    headline: "Know your mind",
    body: "Real-time insights so you can perform, recover, and thrive.",
    image: "/3.webp",
    imageLabel: "App interface preview",
  },
];

function Panel({
  panel,
  index,
  reduced,
  progress,
}: {
  panel: (typeof panels)[0];
  index: number;
  reduced: boolean;
  progress: MotionValue<number>;
}) {
  /* Subtle parallax: image drifts gently as section scrolls through */
  const y = useTransform(progress, [0, 1], ["-5%", "5%"]);

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.1,
      }}
      className="relative overflow-hidden min-h-[60svh] md:min-h-[100svh]"
      style={{
        borderBottom:
          index < panels.length - 1 ? "1px solid var(--rule)" : undefined,
        borderRight:
          index < panels.length - 1 ? "1px solid var(--rule)" : undefined,
      }}
    >
      {/* Parallax background image — oversized so edges never show */}
      <motion.div
        className="absolute -inset-[12%] z-0"
        style={{ y, willChange: "transform" }}
      >
        <ImagePlaceholder
          src={panel.image}
          alt={panel.imageLabel}
          label={panel.imageLabel}
          objectFit="cover"
          className="w-full h-full"
        />
      </motion.div>

      {/* Dark gradient overlay for text legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.45) 0%, rgba(10,10,10,0.25) 30%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.92) 100%)",
        }}
      />

      {/* Additional dark tint so photos match the site's ink palette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-10"
        style={{ backgroundColor: "rgba(0,0,0,0.20)" }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6 md:p-8 lg:p-10 z-20">
        {/* Top: number */}
        <span
          className="font-mono text-xs tracking-[0.18em]"
          style={{ color: "var(--mute)" }}
        >
          {panel.number}
        </span>

        {/* Bottom: headline + body */}
        <div>
          <h2
            className="font-display font-light leading-[1.05] tracking-tightest text-[28px] sm:text-[32px] md:text-[28px] lg:text-[36px]"
            style={{ color: "var(--paper)" }}
          >
            {panel.headline}
          </h2>
          <p
            className="mt-3 text-base md:text-[17px] leading-relaxed max-w-[320px]"
            style={{ color: "var(--mute)" }}
          >
            {panel.body}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * ProductHighlights — Section 2 (above BrainCareSection)
 *
 * Three full-height image panels side by side.
 * Each panel shares a single section-level scroll progress so their
 * parallax backgrounds stay perfectly in sync and only one scroll
 * listener is registered.
 */
export function ProductHighlights() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      className="relative w-full snap-section"
      style={{ backgroundColor: "var(--ink)" }}
      aria-label="Product highlights"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 h-full min-h-[100svh] md:min-h-0">
        {panels.map((panel, i) => (
          <Panel
            key={panel.number}
            panel={panel}
            index={i}
            reduced={reduced ?? false}
            progress={scrollYProgress}
          />
        ))}
      </div>
    </section>
  );
}
