"use client";

import { FadeUp } from "./FadeUp";
import { SmallCaps } from "./SmallCaps";
import { track } from "@/lib/track";

/**
 * Blog teaser on the home page.
 *
 * The full Blog lives at /blog. This is the compact preview that sits
 * between MeasuresSection and FinalCTA on the landing page: eyebrow,
 * headline, one-paragraph lede, three short row previews, and a single
 * "Read the blog →" link to the dedicated route.
 *
 * The component filename and export name are preserved to minimize
 * churn in app/page.tsx.
 */

type Preview = {
  index: string;
  title: string;
  focus: string;
};

const PREVIEWS: Preview[] = [
  {
    index: "01",
    title: "Protocol",
    focus: "How rumination is actually induced in a clinical EEG study.",
  },
  {
    index: "02",
    title: "Hardware",
    focus: "What AORA Nano actually measures, behind the ear.",
  },
  {
    index: "03",
    title: "Literature",
    focus: "The EEG-wearable research we're building on.",
  },
];

export function ScienceTeaser() {
  return (
    <section
      id="blog-teaser"
      className="relative px-6 md:px-10 py-32 md:py-44 snap-section"
      style={{ backgroundColor: "var(--ink-raised)" }}
      aria-labelledby="blog-teaser-heading"
    >
      <div className="max-w-prose mx-auto">
        <FadeUp>
          <SmallCaps>Blog</SmallCaps>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h2
            id="blog-teaser-heading"
            className="mt-6 font-display font-light leading-[1.02] tracking-tightest text-[30px] sm:text-[40px] md:text-[56px]"
            style={{ color: "var(--paper)" }}
          >
            The instruments, the protocol, the literature.
          </h2>
        </FadeUp>

        <FadeUp delay={0.15}>
          <p
            className="mt-10 font-display font-light text-xl md:text-[22px] leading-[1.55]"
            style={{ color: "var(--paper)" }}
          >
            Three threads sit underneath AORA: the clinical protocols used to
            induce and measure rumination, the behind-the-ear hardware stack
            that makes those measurements portable, and a fast-moving body of
            research pointing at EEG-in-a-wearable as the next interface.
          </p>
        </FadeUp>
      </div>

      <div className="mt-16 mx-auto" style={{ maxWidth: "48rem" }}>
        <FadeUp delay={0.22}>
          <ul
            className="flex flex-col"
            style={{ borderTop: "1px solid var(--rule)" }}
          >
            {PREVIEWS.map((row) => (
              <li
                key={row.index}
                className="py-6 md:py-7 flex items-baseline gap-6 md:gap-8"
                style={{ borderBottom: "1px solid var(--rule)" }}
              >
                <span
                  className="font-mono text-xs tracking-wider shrink-0"
                  style={{ color: "var(--green)" }}
                >
                  {row.index}
                </span>
                <div className="flex-1">
                  <SmallCaps>{row.title}</SmallCaps>
                  <p
                    className="mt-2 font-display font-light text-lg md:text-xl leading-[1.4]"
                    style={{ color: "var(--paper)" }}
                  >
                    {row.focus}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>

      <div className="max-w-prose mx-auto">
        <FadeUp delay={0.3}>
          <div className="mt-14">
            <a
              href="/blog"
              onClick={() => track("cta_clicked", { location: "blog_teaser" })}
              className="inline-flex items-center gap-2 font-display text-lg transition-colors duration-150"
              style={{ color: "var(--paper)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "var(--green-bright)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--paper)")
              }
            >
              <span
                style={{
                  borderBottom: "1px solid var(--green)",
                  paddingBottom: 2,
                }}
              >
                Read the blog
              </span>
              <span aria-hidden>→</span>
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
