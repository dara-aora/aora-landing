"use client";

import { FadeUp } from "./FadeUp";
import { SmallCaps } from "./SmallCaps";
import { LiveDot } from "./LiveDot";
import { track } from "@/lib/track";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/aora-cognitive-performanc/kpgpmdgnhdmfmapjknbkfponemlgcabl?authuser=2&hl=en-GB&pli=1";

/**
 * ChromeExtensionSection — Standalone software beat.
 *
 * Positioned after the FinalCTA preorder section.
 * Introduces the AORA Chrome extension as a standalone product (no
 * hardware commitment required) that runs in the browser today, and
 * optionally pairs with the AORA Nano device for continuous biosignal
 * tracking. Funnels to the Chrome Web Store listing.
 *
 * Layout: two-column on md+ (copy left, extension mock right), stacks on
 * mobile. Uses --ink-raised for rhythmic contrast with the ink-background
 * AnatomyHero and StatSection on either side.
 */
export function ChromeExtensionSection() {
  return (
    <section
      className="relative w-full px-6 md:px-10 py-28 md:py-40 overflow-hidden snap-section"
      style={{ backgroundColor: "var(--ink-raised)" }}
      aria-labelledby="chrome-ext-heading"
    >
      {/* Ambient green glow behind the mock — echoes AnatomyHero backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 78% 50%, rgba(143,174,90,0.08) 0%, rgba(143,174,90,0.02) 45%, rgba(10,10,10,0) 75%)",
        }}
      />

      <div className="relative max-w-content mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
          {/* ── Left: copy ── */}
          <div className="md:col-span-6">
            <FadeUp>
              <SmallCaps>AORA · Chrome extension</SmallCaps>
            </FadeUp>

            <FadeUp delay={0.08}>
              <h2
                id="chrome-ext-heading"
                className="mt-6 font-display font-light leading-[1.02] tracking-tightest text-[30px] sm:text-[40px] md:text-[56px]"
                style={{ color: "var(--paper)" }}
              >
                Your cognitive state,
                <br />
                <span style={{ color: "var(--mute)" }}>
                  wherever you work.
                </span>
              </h2>
            </FadeUp>

            <FadeUp delay={0.12}>
              <p
                className="mt-4 font-mono text-[11px] md:text-xs tracking-[0.18em] uppercase"
                style={{ color: "var(--green-bright)" }}
              >
                No hardware required. Start with the software.
              </p>
            </FadeUp>

            <FadeUp delay={0.15}>
              <p
                className="mt-10 font-display font-light text-xl md:text-[22px] leading-[1.55]"
                style={{ color: "var(--paper)" }}
              >
                The AORA Chrome extension brings Cognitive Load, Neural
                Recovery, and Burnout Risk into every tab &mdash; running
                entirely in your browser. It&apos;s the software version of
                AORA, ready to use today.
              </p>
            </FadeUp>

            <FadeUp delay={0.22}>
              <p
                className="mt-6 font-display font-light text-lg md:text-[19px] leading-[1.55]"
                style={{ color: "var(--mute)" }}
              >
                A quiet nudge when you&apos;re about to start deep work in a
                recovery window. A green light when you&apos;re primed. Pair
                with the AORA Nano for continuous biosignal tracking &mdash;
                or use it on its own. No page content leaves your device.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="mt-12 md:mt-14 flex flex-col items-start gap-6">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Add the AORA Chrome extension from the Chrome Web Store"
                  onClick={() =>
                    track("cta_clicked", { location: "chrome_extension" })
                  }
                  className="inline-flex items-center gap-2 h-14 px-6 text-base font-medium transition-colors duration-150"
                  style={{
                    backgroundColor: "var(--green)",
                    color: "var(--ink)",
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "var(--green-bright)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "var(--green)")
                  }
                >
                  Add to Chrome
                  <span aria-hidden>→</span>
                </a>
                <SmallCaps>
                  Free · Standalone · Pairs with AORA Nano · Chrome 120+
                </SmallCaps>
              </div>
            </FadeUp>
          </div>

          {/* ── Right: browser + extension popover mock ── */}
          <div className="md:col-span-6">
            <FadeUp delay={0.18}>
              <BrowserMock />
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Browser chrome mock with docked extension popover ──────────────────

function BrowserMock() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full mx-auto"
      style={{ maxWidth: 560 }}
    >
      {/* Browser window */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          backgroundColor: "var(--ink)",
          border: "1px solid var(--rule)",
          boxShadow:
            "0 40px 80px -30px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02)",
        }}
      >
        {/* Top chrome bar */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: "var(--rule)",
                }}
              />
            ))}
          </div>
          {/* Omnibox */}
          <div
            className="flex-1 flex items-center gap-2 h-7 px-3 rounded-full"
            style={{
              backgroundColor: "var(--ink-raised)",
              border: "1px solid var(--rule)",
            }}
          >
            <span
              className="font-mono text-[10px] tabular-nums"
              style={{ color: "var(--mute)", letterSpacing: "0.04em" }}
            >
              aora.app/dashboard
            </span>
          </div>
          {/* Extension icon slot */}
          <div
            className="flex items-center justify-center rounded"
            style={{
              width: 22,
              height: 22,
              border: "1px solid var(--green)",
              backgroundColor: "rgba(143,174,90,0.08)",
            }}
          >
            <span
              className="inline-block rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: "var(--green-bright)",
                boxShadow: "0 0 8px var(--green-bright)",
              }}
            />
          </div>
        </div>

        {/* Page body (faux content lines) */}
        <div className="relative px-6 py-8" style={{ minHeight: 280 }}>
          <div className="space-y-3 opacity-40">
            <div
              className="h-3 rounded"
              style={{
                width: "55%",
                backgroundColor: "var(--rule)",
              }}
            />
            <div
              className="h-2 rounded"
              style={{ width: "92%", backgroundColor: "var(--rule)" }}
            />
            <div
              className="h-2 rounded"
              style={{ width: "78%", backgroundColor: "var(--rule)" }}
            />
            <div
              className="h-2 rounded"
              style={{ width: "88%", backgroundColor: "var(--rule)" }}
            />
            <div className="pt-4" />
            <div
              className="h-2 rounded"
              style={{ width: "62%", backgroundColor: "var(--rule)" }}
            />
            <div
              className="h-2 rounded"
              style={{ width: "80%", backgroundColor: "var(--rule)" }}
            />
            <div
              className="h-2 rounded"
              style={{ width: "48%", backgroundColor: "var(--rule)" }}
            />
          </div>

          {/* Extension popover docked from the toolbar corner */}
          <ExtensionPopover />
        </div>
      </div>

      {/* Caption under the mock */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span
          className="font-mono text-[10px] tabular-nums"
          style={{ color: "var(--mute)", letterSpacing: "0.14em" }}
        >
          AORA · CHROME EXTENSION · LIVE PREVIEW
        </span>
      </div>
    </div>
  );
}

// ─── Popover inside the browser ─────────────────────────────────────────

function ExtensionPopover() {
  return (
    <div
      className="absolute w-[220px] sm:w-[248px] right-3 sm:right-4"
      style={{
        top: -12,
        maxWidth: "calc(100% - 1.5rem)",
      }}
    >
      {/* Connector notch */}
      <div
        className="absolute"
        style={{
          top: -6,
          right: 12,
          width: 10,
          height: 10,
          backgroundColor: "var(--ink-raised)",
          borderTop: "1px solid var(--rule)",
          borderLeft: "1px solid var(--rule)",
          transform: "rotate(45deg)",
          zIndex: 1,
        }}
      />

      <div
        className="relative rounded-md p-4"
        style={{
          backgroundColor: "var(--ink-raised)",
          border: "1px solid var(--rule)",
          boxShadow: "0 20px 40px -20px rgba(0,0,0,0.6)",
          zIndex: 2,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 mb-3"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <div className="flex items-center gap-2">
            <LiveDot size={6} />
            <span
              className="font-mono text-[10px] tabular-nums"
              style={{ color: "var(--paper)", letterSpacing: "0.14em" }}
            >
              AORA · LIVE
            </span>
          </div>
          <span
            className="font-mono text-[9px] tabular-nums"
            style={{ color: "var(--mute)" }}
          >
            v1.2
          </span>
        </div>

        {/* Meters */}
        <div className="space-y-3.5">
          <Meter label="Cognitive Load" value={68} valueLabel="68" />
          <Meter label="Neural Recovery" value={42} valueLabel="42" />
          <Meter label="Burnout Risk" value={18} valueLabel="Low" />
        </div>

        {/* Footer */}
        <div
          className="mt-4 pt-3 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--rule)" }}
        >
          <span
            className="font-mono text-[9px] tabular-nums"
            style={{ color: "var(--mute)", letterSpacing: "0.12em" }}
          >
            SYNCED 0.3s AGO
          </span>
          <span
            className="font-mono text-[9px] tabular-nums"
            style={{ color: "var(--green-bright)", letterSpacing: "0.12em" }}
          >
            STANDALONE · NANO READY
          </span>
        </div>
      </div>
    </div>
  );
}

function Meter({
  label,
  value,
  valueLabel,
}: {
  label: string;
  value: number; // 0–100
  valueLabel: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span
          className="font-mono text-[10px]"
          style={{
            color: "var(--paper)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span
          className="font-mono text-[10px] tabular-nums"
          style={{ color: "var(--green-bright)" }}
        >
          {valueLabel}
        </span>
      </div>
      <div
        className="relative h-[3px] w-full rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--rule)" }}
      >
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--green)",
            boxShadow: "0 0 8px rgba(143,174,90,0.6)",
          }}
        />
      </div>
    </div>
  );
}
