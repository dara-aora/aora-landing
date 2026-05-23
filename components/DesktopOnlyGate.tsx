"use client";

import { ReactNode, useEffect, useState } from "react";
import { SmallCaps } from "./SmallCaps";

/**
 * DesktopOnlyGate
 *
 * Wraps a page (typically a hardcoded desktop dashboard) and renders a
 * polite "Open on desktop" notice on viewports below the breakpoint
 * (default: 1024px = Tailwind `lg`). Avoids horizontal overflow on
 * mobile when the underlying layout uses fixed minmax grid columns
 * that exceed the viewport width.
 *
 * SSR-safe: renders the desktop content during SSR so search engines
 * see real markup; on first client paint we re-evaluate the viewport
 * and switch to the notice if needed.
 */
export function DesktopOnlyGate({
  children,
  minWidth = 1024,
  title = "Open on desktop",
  body = "This view is designed for a larger screen. Please open Aora on a desktop or laptop browser.",
}: {
  children: ReactNode;
  minWidth?: number;
  title?: string;
  body?: string;
}) {
  const [isNarrow, setIsNarrow] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const mql = window.matchMedia(`(max-width: ${minWidth - 1}px)`);
    const update = () => setIsNarrow(mql.matches);
    update();
    if (mql.addEventListener) {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    } else {
      // Safari < 14
      mql.addListener(update);
      return () => mql.removeListener(update);
    }
  }, [minWidth]);

  if (hydrated && isNarrow) {
    return (
      <main
        className="min-h-[100dvh] w-full flex items-center justify-center px-6 py-16"
        style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}
      >
        <div
          className="w-full max-w-prose text-center"
          style={{ maxWidth: 480 }}
        >
          <SmallCaps tone="paper">Aora · Live</SmallCaps>
          <h1
            className="mt-6 font-display font-light leading-[1.05] tracking-tightest text-[34px] sm:text-[44px]"
            style={{ color: "var(--paper)" }}
          >
            {title}
          </h1>
          <div
            className="mt-8 mb-8 mx-auto"
            style={{
              width: 48,
              height: 1,
              backgroundColor: "var(--rule)",
            }}
          />
          <p
            className="text-base sm:text-[17px] leading-relaxed"
            style={{ color: "var(--mute)" }}
          >
            {body}
          </p>

          <div className="mt-12 flex flex-col items-center gap-3">
            <a
              href="/"
              className="small-caps px-4 py-2.5 transition-colors duration-150"
              style={{
                color: "var(--ink)",
                backgroundColor: "var(--green)",
                borderRadius: 3,
              }}
            >
              Back to Aora
            </a>
            <a
              href="/quiz"
              className="small-caps mt-2"
              style={{ color: "var(--mute)" }}
            >
              Take the assessment instead →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
