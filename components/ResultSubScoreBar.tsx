"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Single 0–100 horizontal bar used on the quiz result page to render a
 * sub-score (exhaustion / stress / cognitive clarity).
 */
export function ResultSubScoreBar({
  label,
  value,
  caption,
}: {
  label: string;
  value: number; // 0..100
  caption?: string;
}) {
  const reduced = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span
          className="small-caps"
          style={{ color: "var(--mute)" }}
        >
          {label}
        </span>
        <span
          className="font-mono text-sm tabular-nums"
          style={{ color: "var(--green-bright)" }}
        >
          {pct} / 100
        </span>
      </div>
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: 4,
          backgroundColor: "var(--rule)",
          borderRadius: 2,
        }}
      >
        <motion.div
          initial={{ width: reduced ? `${pct}%` : 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 left-0 h-full"
          style={{
            backgroundColor: "var(--green)",
            boxShadow: "0 0 8px rgba(143,174,90,0.5)",
            borderRadius: 2,
          }}
        />
      </div>
      {caption ? (
        <p
          className="mt-3 font-display font-light text-sm md:text-[15px] leading-[1.45]"
          style={{ color: "var(--mute)" }}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
