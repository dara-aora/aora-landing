"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

/**
 * QuizScreen — wraps a single quiz step in a 150ms fade transition, keyed
 * on a caller-supplied screenKey so AnimatePresence can cross-fade between
 * questions. Under prefers-reduced-motion, the swap is instant.
 */
export function QuizScreen({
  screenKey,
  children,
}: {
  screenKey: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screenKey}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: reduced ? 0 : 0.15, ease: "easeOut" }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
