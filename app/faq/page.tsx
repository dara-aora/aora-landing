import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/FadeUp";
import { SmallCaps } from "@/components/SmallCaps";

export const metadata: Metadata = {
  title: "FAQ — Aora",
  description:
    "Answers about AORA Nano — what it measures, when it ships, battery life, privacy, returns, and more.",
  openGraph: {
    title: "FAQ — Aora",
    description:
      "Answers about AORA Nano — what it measures, when it ships, battery life, privacy, returns, and more.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — Aora",
    description:
      "Answers about AORA Nano — what it measures, when it ships, battery life, privacy, returns, and more.",
  },
};

type QA = {
  index: string;
  category: string;
  question: string;
  answer: React.ReactNode;
};

const FAQS: QA[] = [
  {
    index: "01",
    category: "Product",
    question: "What does AORA Nano measure?",
    answer: (
      <>
        Continuous ECG, PPG (optical blood-volume pulse), and early neural
        potentials from a behind-the-ear placement. All signal processing runs
        on-device.
      </>
    ),
  },
  {
    index: "02",
    category: "Shipping",
    question: "When does it ship?",
    answer: (
      <>
        Pre-orders ship July 2026. The first 100 units go out in May 2026; the
        remaining pre-orders ship in the July batch.
      </>
    ),
  },
  {
    index: "03",
    category: "Hardware",
    question: "How long does the battery last?",
    answer: (
      <>
        Multi-day battery life under continuous sensing, recharged via a small
        contact dock. Exact figures will be published closer to ship.
      </>
    ),
  },
  {
    index: "04",
    category: "Regulatory",
    question: "Is this a medical device?",
    answer: (
      <>
        No. AORA Nano is a wellness and self-measurement instrument. It is not
        intended to diagnose, treat, cure, or prevent any disease. See the{" "}
        <a
          href="/terms"
          style={{
            color: "var(--paper)",
            borderBottom: "1px solid var(--green)",
            paddingBottom: 1,
          }}
        >
          Terms
        </a>{" "}
        for full disclosure.
      </>
    ),
  },
  {
    index: "05",
    category: "Privacy",
    question: "Where does my data live?",
    answer: (
      <>
        On-device first. Derivatives sync to your account only when you choose.
        We never sell data. See the{" "}
        <a
          href="/privacy"
          style={{
            color: "var(--paper)",
            borderBottom: "1px solid var(--green)",
            paddingBottom: 1,
          }}
        >
          Privacy policy
        </a>
        .
      </>
    ),
  },
  {
    index: "06",
    category: "Ecosystem",
    question: "Do I need the Chrome extension to use Nano?",
    answer: (
      <>
        No. The extension is a free companion that surfaces signals in your
        browser. Nano works standalone.
      </>
    ),
  },
  {
    index: "07",
    category: "Policy",
    question: "What is the return policy?",
    answer: (
      <>
        Thirty days, no questions asked. Email{" "}
        <a
          href="mailto:dev@aoramind.com"
          style={{
            color: "var(--paper)",
            borderBottom: "1px solid var(--green)",
            paddingBottom: 1,
          }}
        >
          dev@aoramind.com
        </a>{" "}
        to start a return.
      </>
    ),
  },
  {
    index: "08",
    category: "Comparison",
    question: "How is this different from a smartwatch or Oura ring?",
    answer: (
      <>
        Placement. Behind-the-ear geometry gives cleaner access to cranial
        vasculature and neural-adjacent signal — things a wrist or finger
        cannot see.
      </>
    ),
  },
  {
    index: "09",
    category: "Pricing",
    question: "How does pricing work?",
    answer: (
      <>
        The device is $199, one-time. Membership is $10/month for the first
        100 founders — locked for life — and $20/month after. Your membership
        keeps the data model improving and the Chrome extension synced.
      </>
    ),
  },
  {
    index: "10",
    category: "Company",
    question: "Who is behind Aora?",
    answer: (
      <>
        Aora, Inc. — a small team building measurement instruments for signals
        that have historically required a clinic. Reach us at{" "}
        <a
          href="mailto:dev@aoramind.com"
          style={{
            color: "var(--paper)",
            borderBottom: "1px solid var(--green)",
            paddingBottom: 1,
          }}
        >
          dev@aoramind.com
        </a>
        .
      </>
    ),
  },
];

export default function FAQPage() {
  return (
    <>
      <Nav />
      <main className="min-h-[100dvh]">
        {/* ═══════════════════ Hero masthead ═══════════════════ */}
        <section
          className="relative px-6 md:px-10 pt-36 md:pt-48 pb-24 md:pb-32 min-h-[70svh] flex flex-col justify-end overflow-hidden"
          style={{ backgroundColor: "var(--ink)" }}
          aria-labelledby="faq-heading"
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 20% 0%, rgba(110,139,61,0.08) 0%, rgba(10,10,10,0) 55%), linear-gradient(to bottom, rgba(20,20,20,0.6) 0%, rgba(10,10,10,0) 30%)",
            }}
          />

          <div className="relative mx-auto w-full" style={{ maxWidth: "72rem" }}>
            <a
              href="/"
              className="small-caps inline-flex items-center gap-2 transition-colors duration-150"
              style={{ color: "var(--mute)" }}
            >
              <span aria-hidden>←</span>
              <span>Aora</span>
            </a>

            <div className="mt-10 md:mt-14">
              <SmallCaps>Frequently asked · April 2026</SmallCaps>
            </div>

            <h1
              id="faq-heading"
              className="mt-6 font-display font-light leading-[0.98] tracking-tightest text-[40px] sm:text-[56px] md:text-[80px] lg:text-[104px]"
              style={{ color: "var(--paper)" }}
            >
              Questions,
              <br />
              answered.
            </h1>

            <p
              className="mt-10 md:mt-14 font-display font-light text-xl md:text-2xl leading-[1.45]"
              style={{ color: "var(--paper)", maxWidth: "44rem" }}
            >
              What AORA Nano measures, when it ships, how we handle your data,
              and everything else you would reasonably ask before putting a
              sensor behind your ear.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
              <SmallCaps>{FAQS.length} questions</SmallCaps>
              <span aria-hidden style={{ color: "var(--mute)" }}>
                ·
              </span>
              <SmallCaps>Updated Apr 2026</SmallCaps>
            </div>
          </div>

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

        {/* ═══════════════════ FAQ list ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--ink-raised)" }}
          aria-labelledby="faq-list-heading"
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <div id="faq-list-heading">
                <SmallCaps>All questions</SmallCaps>
              </div>
            </FadeUp>

            <FadeUp delay={0.08}>
              <ol
                className="mt-8 flex flex-col"
                style={{ borderTop: "1px solid var(--rule)" }}
              >
                {FAQS.map((qa) => (
                  <li
                    key={qa.index}
                    className="py-8 md:py-10 flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8"
                    style={{ borderBottom: "1px solid var(--rule)" }}
                  >
                    <span
                      className="font-mono text-sm tracking-wider shrink-0 md:pt-2"
                      style={{ color: "var(--green)" }}
                    >
                      {qa.index}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="small-caps"
                        style={{ color: "var(--mute)" }}
                      >
                        {qa.category}
                      </div>
                      <h2
                        className="mt-2 font-display font-light leading-[1.15] tracking-tightest text-[24px] sm:text-[28px] md:text-[32px]"
                        style={{ color: "var(--paper)" }}
                      >
                        {qa.question}
                      </h2>
                      <p
                        className="mt-4 font-display font-light text-base md:text-[17px] leading-[1.55]"
                        style={{ color: "var(--mute)", maxWidth: "44rem" }}
                      >
                        {qa.answer}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ End-of-page CTA ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-24 md:py-32"
          style={{ backgroundColor: "var(--ink)" }}
          aria-labelledby="faq-cta-heading"
        >
          <div
            className="mx-auto grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-12 md:gap-20"
            style={{ maxWidth: "64rem" }}
          >
            <div>
              <FadeUp>
                <SmallCaps>Still curious</SmallCaps>
              </FadeUp>
              <FadeUp delay={0.08}>
                <h3
                  id="faq-cta-heading"
                  className="mt-6 font-display font-light leading-[1.08] tracking-tightest text-[30px] sm:text-[36px] md:text-[40px]"
                  style={{ color: "var(--paper)" }}
                >
                  Take the assessment, or ask us directly.
                </h3>
              </FadeUp>
              <FadeUp delay={0.15}>
                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
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
                  <a
                    href="mailto:dev@aoramind.com"
                    className="inline-flex items-center gap-2 font-display text-lg transition-colors duration-150"
                    style={{ color: "var(--paper)" }}
                  >
                    <span
                      style={{
                        borderBottom: "1px solid var(--green)",
                        paddingBottom: 2,
                      }}
                    >
                      Email us
                    </span>
                    <span aria-hidden>→</span>
                  </a>
                </div>
              </FadeUp>
            </div>

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
                    { label: "Blog", href: "/blog" },
                    { label: "Privacy", href: "/privacy" },
                    { label: "Terms", href: "/terms" },
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
      </main>
      <Footer />
    </>
  );
}
