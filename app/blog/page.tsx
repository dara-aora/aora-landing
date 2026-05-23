import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BlogContent } from "@/components/BlogContent";
import { FadeUp } from "@/components/FadeUp";
import { SmallCaps } from "@/components/SmallCaps";

export const metadata: Metadata = {
  title: "Blog — Aora",
  description:
    "The protocol, the instruments, and the literature behind AORA Nano — a behind-the-ear wearable for continuous cardiac, PPG, and EEG-potential sensing.",
  openGraph: {
    title: "Blog — Aora",
    description:
      "The protocol, the instruments, and the literature behind AORA Nano.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Aora",
    description:
      "The protocol, the instruments, and the literature behind AORA Nano.",
  },
};

type TocEntry = {
  index: string;
  title: string;
  focus: string;
  href: string;
};

const TOC: TocEntry[] = [
  {
    index: "01",
    title: "Protocol",
    focus: "How rumination is actually induced in a clinical EEG study.",
    href: "#protocol",
  },
  {
    index: "02",
    title: "Hardware",
    focus: "What AORA Nano actually measures.",
    href: "#hardware",
  },
  {
    index: "03",
    title: "Literature",
    focus: "The research we're building on.",
    href: "#literature",
  },
  {
    index: "04",
    title: "Clinical instruments",
    focus: "Built on instruments your neurologist already uses.",
    href: "#clinical-instruments",
  },
];

type Reference = {
  n: number;
  body: string;
};

const REFERENCES: Reference[] = [
  {
    n: 1,
    body:
      "Copenhagen Burnout Inventory — Kristensen, T. S., Borritz, M., Villadsen, E., & Christensen, K. B. (2005). Work & Stress, 19(3), 192–207.",
  },
  {
    n: 2,
    body:
      "Perceived Stress Scale — Cohen, S., Kamarck, T., & Mermelstein, R. (1983). Journal of Health and Social Behavior, 24(4), 385–396.",
  },
  {
    n: 3,
    body:
      "Smartwatch-based cognitive assessment framework — Nature Medicine, 2025.",
  },
];

export default function BlogPage() {
  return (
    <>
      <Nav />
      <main className="min-h-[100dvh]">
        {/* ═══════════════════ Block 1 · Hero masthead ═══════════════════ */}
        <section
          className="relative px-6 md:px-10 pt-36 md:pt-48 pb-24 md:pb-32 min-h-[70svh] flex flex-col justify-end overflow-hidden"
          style={{ backgroundColor: "var(--ink)" }}
          aria-labelledby="blog-heading"
        >
          {/* Subtle ambient wash — reuses existing tokens, no new CSS */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 20% 0%, rgba(110,139,61,0.08) 0%, rgba(10,10,10,0) 55%), linear-gradient(to bottom, rgba(20,20,20,0.6) 0%, rgba(10,10,10,0) 30%)",
            }}
          />

          <div className="relative mx-auto w-full" style={{ maxWidth: "72rem" }}>
            {/* Breadcrumb */}
            <a
              href="/"
              className="small-caps inline-flex items-center gap-2 transition-colors duration-150"
              style={{ color: "var(--mute)" }}
            >
              <span aria-hidden>←</span>
              <span>Aora</span>
            </a>

            {/* Eyebrow */}
            <div className="mt-10 md:mt-14">
              <SmallCaps>Blog · April 2026</SmallCaps>
            </div>

            {/* H1 — rendered without FadeUp so it's visible on first paint */}
            <h1
              id="blog-heading"
              className="mt-6 font-display font-light leading-[0.98] tracking-tightest text-[40px] sm:text-[56px] md:text-[80px] lg:text-[104px]"
              style={{ color: "var(--paper)" }}
            >
              The instruments,
              <br />
              the protocol,
              <br />
              the literature.
            </h1>

            {/* Deck / standfirst */}
            <p
              className="mt-10 md:mt-14 font-display font-light text-xl md:text-2xl leading-[1.45]"
              style={{ color: "var(--paper)", maxWidth: "44rem" }}
            >
              Aora sits at the intersection of three things: the clinical
              protocols used to study rumination and negative affect, a piece of
              invisible behind-the-ear hardware that can run those measurements
              outside a lab, and a fast-moving research field showing that EEG
              in a wearable form factor is now viable. What follows is how those
              pieces fit together.
            </p>

            {/* Meta row */}
            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
              <SmallCaps>Reading time · 8 min</SmallCaps>
              <span aria-hidden style={{ color: "var(--mute)" }}>
                ·
              </span>
              <SmallCaps>4 entries</SmallCaps>
              <span aria-hidden style={{ color: "var(--mute)" }}>
                ·
              </span>
              <SmallCaps>Updated Apr 2026</SmallCaps>
            </div>
          </div>

          {/* Bottom hairline */}
          <div
            aria-hidden
            className="relative mt-20 md:mt-28 mx-auto w-full"
            style={{
              maxWidth: "72rem",
              height: 1,
              backgroundColor: "var(--rule)",
            }}
          />
        </section>

        {/* ═══════════════════ Block 2 · Table of contents ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--ink-raised)" }}
          aria-labelledby="toc-heading"
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <div id="toc-heading">
                <SmallCaps>Contents</SmallCaps>
              </div>
            </FadeUp>

            <FadeUp delay={0.08}>
              <ol
                className="mt-8 flex flex-col"
                style={{ borderTop: "1px solid var(--rule)" }}
              >
                {TOC.map((row) => (
                  <li
                    key={row.href}
                    style={{ borderBottom: "1px solid var(--rule)" }}
                  >
                    <a
                      href={row.href}
                      className="group flex items-baseline gap-5 md:gap-8 py-6 md:py-7 transition-colors duration-150"
                    >
                      <span
                        className="font-mono text-sm tracking-wider shrink-0"
                        style={{ color: "var(--green)" }}
                      >
                        {row.index}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="small-caps"
                          style={{ color: "var(--mute)" }}
                        >
                          {row.title}
                        </div>
                        <div
                          className="mt-2 font-display font-light text-lg md:text-xl leading-[1.4]"
                          style={{ color: "var(--paper)" }}
                        >
                          {row.focus}
                        </div>
                      </div>
                      <span
                        aria-hidden
                        className="font-display text-lg transition-transform duration-150 group-hover:translate-x-1"
                        style={{ color: "var(--green)" }}
                      >
                        →
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ Block 3+4 · Entries (incl. pull-quote) ═══════════════════ */}
        <BlogContent />

        {/* ═══════════════════ Block 5 · End-of-article CTA row ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-24 md:py-32"
          style={{ backgroundColor: "var(--ink-raised)" }}
          aria-labelledby="cta-heading"
        >
          <div
            className="mx-auto grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-12 md:gap-20"
            style={{ maxWidth: "64rem" }}
          >
            {/* LEFT — Assessment CTA */}
            <div>
              <FadeUp>
                <SmallCaps>Assessment</SmallCaps>
              </FadeUp>
              <FadeUp delay={0.08}>
                <h3
                  id="cta-heading"
                  className="mt-6 font-display font-light leading-[1.08] tracking-tightest text-[30px] sm:text-[36px] md:text-[40px]"
                  style={{ color: "var(--paper)" }}
                >
                  Measure the organ you haven&apos;t measured yet.
                </h3>
              </FadeUp>
              <FadeUp delay={0.15}>
                <div className="mt-10">
                  <a
                    href="/quiz"
                    className="inline-flex items-center gap-2 font-display text-lg transition-colors duration-150"
                    style={{ color: "var(--paper)" }}
                  >
                    <span
                      style={{
                        borderBottom: "1px solid var(--green)",
                        paddingBottom: 2,
                      }}
                    >
                      Take the Assessment
                    </span>
                    <span aria-hidden>→</span>
                  </a>
                </div>
              </FadeUp>
            </div>

            {/* RIGHT — More from Aora */}
            <div
              className="md:border-l md:pl-12"
              style={{ borderColor: "var(--rule)" }}
            >
              <FadeUp delay={0.1}>
                <SmallCaps>More from Aora</SmallCaps>
              </FadeUp>
              <FadeUp delay={0.18}>
                <ul className="mt-6 flex flex-col gap-4">
                  {[
                    { label: "Home", href: "/" },
                    { label: "Product", href: "/product" },
                    { label: "FAQ", href: "/faq" },
                  ].map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="small-caps inline-flex items-center gap-2 transition-colors duration-150"
                        style={{ color: "var(--paper)" }}
                      >
                        <span>{l.label}</span>
                        <span aria-hidden style={{ color: "var(--green)" }}>
                          →
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ═══════════════════ Block 6 · References ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--ink)" }}
          aria-labelledby="references-heading"
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <div id="references-heading">
                <SmallCaps>References</SmallCaps>
              </div>
            </FadeUp>

            <FadeUp delay={0.08}>
              <ol
                className="mt-8 flex flex-col"
                style={{ borderTop: "1px solid var(--rule)" }}
              >
                {REFERENCES.map((ref) => (
                  <li
                    key={ref.n}
                    className="py-6 md:py-7 flex items-start gap-5 md:gap-8"
                    style={{ borderBottom: "1px solid var(--rule)" }}
                  >
                    <span
                      className="font-mono text-sm tracking-wider pt-1 shrink-0"
                      style={{ color: "var(--green)" }}
                    >
                      [{ref.n}]
                    </span>
                    <p
                      className="font-display font-light text-base md:text-[17px] leading-[1.55]"
                      style={{ color: "var(--mute)" }}
                    >
                      {ref.body}
                    </p>
                  </li>
                ))}
              </ol>
            </FadeUp>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
