"use client";

import { useEffect, useRef, createContext, useContext, ReactNode } from "react";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

/**
 * SmoothScrollProvider — Lenis wrapper with Framer Motion compatibility.
 *
 * Lenis intercepts wheel events and animates scroll position with inertia.
 * Because Framer Motion's useScroll reads window.scrollY (which Lenis drives),
 * all scroll-linked transforms (scrub, parallax, pinned sections) pick up
 * the smoothed values automatically — no manual bridging required.
 *
 * - Disabled entirely on touch-primary devices (mobile native scroll is
 *   already smooth and Lenis can conflict with rubber-banding).
 * - Disabled when prefers-reduced-motion is active.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touchMq = window.matchMedia("(pointer: coarse)");
    if (reducedMq.matches || touchMq.matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}
