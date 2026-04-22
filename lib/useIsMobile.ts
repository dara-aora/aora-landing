"use client";

import { useEffect, useState } from "react";

/**
 * useIsMobile — reactive media query hook for the mobile breakpoint.
 *
 * Matches Tailwind's default `md` breakpoint (768px): returns true when
 * the viewport is narrower than 768px. SSR-safe: returns `false` on the
 * server and during the first client paint, then updates after mount
 * to avoid hydration mismatches. Components that need to render a
 * distinct mobile layout should treat the first paint as desktop and
 * swap on mount.
 */
export function useIsMobile(maxWidthPx: number = 767): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    // Safari < 14 uses addListener; modern browsers use addEventListener
    if (mql.addEventListener) {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    } else {
      const legacy = mql as MediaQueryList & {
        addListener: (cb: (e: MediaQueryListEvent) => void) => void;
        removeListener: (cb: (e: MediaQueryListEvent) => void) => void;
      };
      legacy.addListener(update);
      return () => legacy.removeListener(update);
    }
  }, [maxWidthPx]);

  return isMobile;
}
