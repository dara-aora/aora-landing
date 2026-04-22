import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/FadeUp";
import { SmallCaps } from "@/components/SmallCaps";

export const metadata: Metadata = {
  title: "Terms — Aora",
  description:
    "Terms of service for Aora, Inc. — covering pre-orders, acceptable use, the medical-device disclaimer, warranty, and liability.",
  openGraph: {
    title: "Terms — Aora",
    description:
      "Terms of service for Aora, Inc. — covering pre-orders, acceptable use, the medical-device disclaimer, warranty, and liability.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms — Aora",
    description:
      "Terms of service for Aora, Inc. — covering pre-orders, acceptable use, the medical-device disclaimer, warranty, and liability.",
  },
};

type Section = {
  index: string;
  title: string;
  body: React.ReactNode;
};

const EMAIL_LINK = (
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
);

const SECTIONS: Section[] = [
  {
    index: "01",
    title: "Acceptance",
    body: (
      <>
        By using aora.health, the AORA Nano device, or the Aora Chrome
        extension (together, the &ldquo;Service&rdquo;), you agree to these
        Terms. If you do not agree, do not use the Service.
      </>
    ),
  },
  {
    index: "02",
    title: "Eligibility",
    body: (
      <>
        You must be at least eighteen years old to use the Service. By using
        it, you represent that you meet this requirement.
      </>
    ),
  },
  {
    index: "03",
    title: "Pre-orders and shipping",
    body: (
      <>
        Ship dates are estimates, not guarantees. The first one hundred AORA
        Nano units are slated to ship May 2026; remaining pre-orders ship
        July 2026. You may cancel a pre-order at any time before your unit
        ships for a full refund by emailing {EMAIL_LINK}.
      </>
    ),
  },
  {
    index: "04",
    title: "Not medical advice",
    body: (
      <>
        AORA Nano is a wellness and self-measurement instrument, not a
        medical device. Its outputs are not medical advice and must not be
        used to diagnose, treat, cure, or prevent any disease. Consult a
        qualified clinician for medical decisions.
      </>
    ),
  },
  {
    index: "05",
    title: "License",
    body: (
      <>
        Subject to these Terms, Aora, Inc. grants you a limited,
        non-exclusive, non-transferable, revocable license to use the Aora
        software and Chrome extension with an AORA Nano device you own. The
        license terminates when you stop using the Service or violate these
        Terms.
      </>
    ),
  },
  {
    index: "06",
    title: "Acceptable use",
    body: (
      <>
        You agree not to reverse engineer the hardware or software except as
        permitted by law, resell access to the Service, use the Service to
        harm others, infringe rights, violate law, or circumvent security
        measures.
      </>
    ),
  },
  {
    index: "07",
    title: "Intellectual property",
    body: (
      <>
        Aora, Inc. retains all rights to the software, firmware, brand, and
        instrument design. You retain rights to the biometric data your body
        generates; nothing in these Terms transfers ownership of your data to
        us.
      </>
    ),
  },
  {
    index: "08",
    title: "Warranty",
    body: (
      <>
        AORA Nano carries a one-year limited hardware warranty against
        manufacturing defects from the date of delivery. Beyond that, the
        Service is provided on an &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; basis to the maximum extent permitted by law.
      </>
    ),
  },
  {
    index: "09",
    title: "Limitation of liability",
    body: (
      <>
        To the maximum extent permitted by law, Aora, Inc. is not liable for
        indirect, incidental, special, consequential, or punitive damages.
        Our total aggregate liability is capped at the amount you paid for
        the device in the twelve months preceding the event giving rise to
        the claim.
      </>
    ),
  },
  {
    index: "10",
    title: "Termination",
    body: (
      <>
        You may stop using the Service at any time. We may suspend or
        terminate accounts that violate these Terms, with notice where
        reasonable.
      </>
    ),
  },
  {
    index: "11",
    title: "Governing law",
    body: (
      <>
        These Terms are governed by the laws of the State of California, USA,
        without regard to conflict-of-laws principles. Disputes shall be
        resolved in the state or federal courts located in San Francisco,
        California.
      </>
    ),
  },
  {
    index: "12",
    title: "Changes",
    body: (
      <>
        We may update these Terms. We will post updates here with a new
        effective date and, for material changes, notify account holders in
        advance.
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen">
        {/* ═══════════════════ Hero masthead ═══════════════════ */}
        <section
          className="relative px-6 md:px-10 pt-36 md:pt-48 pb-24 md:pb-32 min-h-[70vh] flex flex-col justify-end overflow-hidden"
          style={{ backgroundColor: "var(--ink)" }}
          aria-labelledby="terms-heading"
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
              <SmallCaps>Terms · Effective April 2026</SmallCaps>
            </div>

            <h1
              id="terms-heading"
              className="mt-6 font-display font-light leading-[0.98] tracking-tightest text-[40px] sm:text-[56px] md:text-[80px] lg:text-[104px]"
              style={{ color: "var(--paper)" }}
            >
              The
              <br />
              agreement.
            </h1>

            <p
              className="mt-10 md:mt-14 font-display font-light text-xl md:text-2xl leading-[1.45]"
              style={{ color: "var(--paper)", maxWidth: "44rem" }}
            >
              The terms that govern your use of aora.health, AORA Nano, and
              the Aora Chrome extension. Plainly written, short as we can
              make it.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
              <SmallCaps>Aora, Inc.</SmallCaps>
              <span aria-hidden style={{ color: "var(--mute)" }}>
                ·
              </span>
              <SmallCaps>Effective Apr 2026</SmallCaps>
              <span aria-hidden style={{ color: "var(--mute)" }}>
                ·
              </span>
              <SmallCaps>Not a medical device</SmallCaps>
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

        {/* ═══════════════════ Terms body ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--ink-raised)" }}
          aria-labelledby="terms-body-heading"
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <div id="terms-body-heading">
                <SmallCaps>Sections</SmallCaps>
              </div>
            </FadeUp>

            <FadeUp delay={0.08}>
              <ol
                className="mt-8 flex flex-col"
                style={{ borderTop: "1px solid var(--rule)" }}
              >
                {SECTIONS.map((s) => (
                  <li
                    key={s.index}
                    className="py-8 md:py-10 flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8"
                    style={{ borderBottom: "1px solid var(--rule)" }}
                  >
                    <span
                      className="font-mono text-sm tracking-wider shrink-0 md:pt-2"
                      style={{ color: "var(--green)" }}
                    >
                      {s.index}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h2
                        className="font-display font-light leading-[1.15] tracking-tightest text-[24px] sm:text-[28px] md:text-[32px]"
                        style={{ color: "var(--paper)" }}
                      >
                        {s.title}
                      </h2>
                      <p
                        className="mt-4 font-display font-light text-base md:text-[17px] leading-[1.55]"
                        style={{ color: "var(--mute)", maxWidth: "44rem" }}
                      >
                        {s.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ Contact / Footer CTA ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-24 md:py-32"
          style={{ backgroundColor: "var(--ink)" }}
          aria-labelledby="terms-contact-heading"
        >
          <div
            className="mx-auto grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-12 md:gap-20"
            style={{ maxWidth: "64rem" }}
          >
            <div>
              <FadeUp>
                <SmallCaps>Contact</SmallCaps>
              </FadeUp>
              <FadeUp delay={0.08}>
                <h3
                  id="terms-contact-heading"
                  className="mt-6 font-display font-light leading-[1.08] tracking-tightest text-[30px] sm:text-[36px] md:text-[40px]"
                  style={{ color: "var(--paper)" }}
                >
                  Questions about these terms? Write to us.
                </h3>
              </FadeUp>
              <FadeUp delay={0.15}>
                <div className="mt-10">
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
                      dev@aoramind.com
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
                    { label: "FAQ", href: "/faq" },
                    { label: "Privacy", href: "/privacy" },
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
