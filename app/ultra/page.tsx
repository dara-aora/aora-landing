import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FadeUp } from "@/components/FadeUp";
import { SmallCaps } from "@/components/SmallCaps";

export const metadata: Metadata = {
  title: "Aora Ultra — Investigational LIFU for PTSD",
  description:
    "Aora Ultra is an investigational focused ultrasound program targeting the trauma circuit. EEG-gated left amygdala LIFU. In development. Not yet available.",
  openGraph: {
    title: "Aora Ultra — Investigational LIFU for PTSD",
    description:
      "Low-intensity focused ultrasound to the left amygdala. A research program, not a proven treatment.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aora Ultra — Investigational LIFU for PTSD",
    description:
      "Low-intensity focused ultrasound to the left amygdala. A research program, not a proven treatment.",
  },
};

export default function UltraPage() {
  return (
    <>
      <Nav />
      <main className="min-h-[100dvh]">
        {/* ═══════════════════ Hero ═══════════════════ */}
        <section
          className="relative px-6 md:px-10 pt-36 md:pt-48 pb-32 md:pb-40 min-h-[85svh] flex flex-col justify-end overflow-hidden"
          style={{ backgroundColor: "var(--ink)" }}
          aria-labelledby="ultra-heading"
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(110,139,61,0.06) 0%, rgba(10,10,10,0) 60%)",
            }}
          />

          <div className="relative mx-auto w-full" style={{ maxWidth: "72rem" }}>
            <FadeUp>
              <SmallCaps>Aora Ultra · In development</SmallCaps>
            </FadeUp>

            <FadeUp delay={0.08}>
              <h1
                id="ultra-heading"
                className="mt-8 font-display font-light leading-[0.96] tracking-tightest text-[44px] sm:text-[64px] md:text-[88px] lg:text-[112px]"
                style={{ color: "var(--paper)", maxWidth: "56rem" }}
              >
                A weekly biological dose for PTSD.
              </h1>
            </FadeUp>

            <FadeUp delay={0.15}>
              <p
                className="mt-10 md:mt-12 font-display font-light text-xl md:text-2xl leading-[1.5]"
                style={{ color: "var(--mute)", maxWidth: "44rem" }}
              >
                Focused ultrasound to the amygdala, with a readout that it
                landed. A new class of non-drug intervention for trauma, under
                development.
              </p>
            </FadeUp>

            <FadeUp delay={0.22}>
              <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
                <span
                  className="small-caps"
                  style={{ color: "var(--green)" }}
                >
                  Investigational
                </span>
                <span aria-hidden style={{ color: "var(--rule)" }}>
                  ·
                </span>
                <SmallCaps>No price · No ship date</SmallCaps>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ What it is ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--paper)" }}
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <span className="small-caps" style={{ color: "var(--mute)" }}>
                The program
              </span>
            </FadeUp>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
              <FadeUp delay={0.08}>
                <h2
                  className="font-display font-light leading-[1.12] tracking-tightest text-[28px] md:text-[36px]"
                  style={{ color: "var(--ink)" }}
                >
                  What Aora Ultra is
                </h2>
                <div
                  className="mt-6 font-display font-light text-[17px] leading-[1.6] space-y-4"
                  style={{ color: "var(--ink)" }}
                >
                  <p>
                    An investigational program combining low-intensity focused
                    ultrasound (LIFU) with EEG gating to target the trauma circuit.
                  </p>
                  <p>
                    The first target: left amygdala. A weekly session, approximately
                    10 minutes. A protocol designed to deliver a repeatable
                    biological dose with session-level readout.
                  </p>
                  <p>
                    This is not therapy. Not a drug. Not gene editing. It is a
                    focused ultrasound dose to a specific brain region implicated in
                    PTSD, with the ambition of measuring whether it landed.
                  </p>
                </div>
              </FadeUp>

              <FadeUp delay={0.15}>
                <h2
                  className="font-display font-light leading-[1.12] tracking-tightest text-[28px] md:text-[36px]"
                  style={{ color: "var(--ink)" }}
                >
                  What it is not
                </h2>
                <div
                  className="mt-6 font-display font-light text-[17px] leading-[1.6] space-y-4"
                  style={{ color: "var(--ink)" }}
                >
                  <p>
                    We are not claiming a proven treatment. Aora Ultra is in
                    development. It has not been cleared by the FDA. It is not
                    currently treating patients.
                  </p>
                  <p>
                    This is research-stage work. The ambition is clinical, the
                    current status is investigational.
                  </p>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ═══════════════════ Mechanism ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--ink)" }}
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <SmallCaps>The mechanism</SmallCaps>
            </FadeUp>

            <FadeUp delay={0.08}>
              <h2
                className="mt-8 font-display font-light leading-[1.08] tracking-tightest text-[36px] md:text-[48px]"
                style={{ color: "var(--paper)" }}
              >
                Left amygdala LIFU,
                <br />
                EEG-gated.
              </h2>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div
                className="mt-10 font-display font-light text-[17px] md:text-[18px] leading-[1.65] space-y-6"
                style={{ color: "var(--mute)", maxWidth: "44rem" }}
              >
                <p>
                  Low-intensity focused ultrasound targets the left amygdala — a
                  region in the fear network implicated in trauma processing and
                  PTSD symptomatology.
                </p>
                <p>
                  The literature target used internally: MNI −30, 4, −18, derived
                  from the Chou 2024 cluster analysis (Brain Stimulation). Related
                  circuit nodes include the basolateral amygdala (BLA) complex and
                  subgenual anterior cingulate cortex (sgACC).
                </p>
                <p>
                  EEG is used as an arousal gate and session-quality signal — not
                  amygdala source localization. The session runs when the gate
                  confirms readiness. Duration: approximately 10 minutes.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.22}>
              <div
                className="mt-12 p-6 md:p-8"
                style={{
                  backgroundColor: "rgba(77,107,47,0.08)",
                  border: "1px solid rgba(77,107,47,0.2)",
                  borderRadius: 4,
                }}
              >
                <span
                  className="small-caps"
                  style={{ color: "var(--green)" }}
                >
                  Target engagement literature
                </span>
                <ul
                  className="mt-4 font-display text-[15px] leading-[1.7] space-y-2"
                  style={{ color: "var(--mute)" }}
                >
                  <li>
                    Fonzo et al. (2025). <em>Molecular Psychiatry</em>.
                    NCT05228964. Target-engagement study — not an Aora efficacy
                    trial.
                  </li>
                  <li>
                    Chou et al. (2024). <em>Brain Stimulation</em>. Left amygdala
                    cluster analysis.
                  </li>
                  <li>
                    Meijer et al. (2026). <em>Science Advances</em>. Circuit
                    modulation.
                  </li>
                </ul>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ Protocol ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--paper)" }}
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <span className="small-caps" style={{ color: "var(--mute)" }}>
                The protocol
              </span>
            </FadeUp>

            <FadeUp delay={0.08}>
              <h2
                className="mt-8 font-display font-light leading-[1.08] tracking-tightest text-[36px] md:text-[48px]"
                style={{ color: "var(--ink)" }}
              >
                EEG gate → lock target → session.
              </h2>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div
                className="mt-10 font-display font-light text-[17px] md:text-[18px] leading-[1.65] space-y-6"
                style={{ color: "var(--ink)", maxWidth: "44rem" }}
              >
                <p>
                  A session begins with EEG monitoring. When arousal and
                  signal-quality thresholds are met, the target lock is confirmed,
                  and the ultrasound protocol initiates.
                </p>
                <p>
                  The Gen 2 form factor: a temporal headband with transducer arrays
                  positioned over the temples. Not the Nano ear-hook. Different
                  product, different placement.
                </p>
                <p>
                  Session duration: approximately 10 minutes. The readout confirms
                  gate status and session completion. Protocol designed for weekly
                  repetition.
                </p>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ Nano vs Ultra ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--ink)" }}
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <SmallCaps>Nano vs Ultra</SmallCaps>
            </FadeUp>

            <FadeUp delay={0.08}>
              <h2
                className="mt-8 font-display font-light leading-[1.08] tracking-tightest text-[36px] md:text-[48px]"
                style={{ color: "var(--paper)" }}
              >
                Measurement vs intervention.
              </h2>
            </FadeUp>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <FadeUp delay={0.15}>
                <div
                  className="p-6 md:p-8"
                  style={{
                    backgroundColor: "var(--ink-raised)",
                    border: "1px solid var(--rule)",
                    borderRadius: 4,
                  }}
                >
                  <h3
                    className="font-display font-light text-2xl md:text-3xl tracking-tight"
                    style={{ color: "var(--paper)" }}
                  >
                    Aora Nano
                  </h3>
                  <p
                    className="mt-4 font-display text-[15px] leading-[1.6]"
                    style={{ color: "var(--mute)" }}
                  >
                    Measurement instrument. Behind-the-ear wearable with
                    continuous ECG, PPG, and neural potentials. On-device
                    processing. $199, shipping July 2026.
                  </p>
                  <a
                    href="/product"
                    className="mt-6 inline-flex items-center gap-2 font-display text-base transition-colors duration-150"
                    style={{ color: "var(--paper)" }}
                  >
                    <span
                      style={{
                        borderBottom: "1px solid var(--green)",
                        paddingBottom: 2,
                      }}
                    >
                      See Nano
                    </span>
                    <span aria-hidden>→</span>
                  </a>
                </div>
              </FadeUp>

              <FadeUp delay={0.22}>
                <div
                  className="p-6 md:p-8"
                  style={{
                    backgroundColor: "rgba(77,107,47,0.08)",
                    border: "1px solid rgba(77,107,47,0.2)",
                    borderRadius: 4,
                  }}
                >
                  <h3
                    className="font-display font-light text-2xl md:text-3xl tracking-tight"
                    style={{ color: "var(--paper)" }}
                  >
                    Aora Ultra
                  </h3>
                  <p
                    className="mt-4 font-display text-[15px] leading-[1.6]"
                    style={{ color: "var(--mute)" }}
                  >
                    Investigational intervention. EEG-gated focused ultrasound to
                    the left amygdala. Treatment-class research program for PTSD.
                    In development. Not yet available.
                  </p>
                  <span
                    className="mt-6 inline-block font-display text-base"
                    style={{ color: "var(--green)" }}
                  >
                    Research program
                  </span>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ═══════════════════ Status ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ backgroundColor: "var(--paper)" }}
        >
          <div className="mx-auto" style={{ maxWidth: "64rem" }}>
            <FadeUp>
              <span className="small-caps" style={{ color: "var(--mute)" }}>
                Current status
              </span>
            </FadeUp>

            <FadeUp delay={0.08}>
              <h2
                className="mt-8 font-display font-light leading-[1.08] tracking-tightest text-[36px] md:text-[48px]"
                style={{ color: "var(--ink)" }}
              >
                In development.
              </h2>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div
                className="mt-10 font-display font-light text-[17px] md:text-[18px] leading-[1.65] space-y-6"
                style={{ color: "var(--ink)", maxWidth: "44rem" }}
              >
                <p>
                  Aora Ultra is an active research program. It is not cleared for
                  clinical use. It does not currently treat patients.
                </p>
                <p>
                  Aora, Inc. is building the indication, protocol, and
                  session-control software. The ultrasound hardware is partner-based
                  — we are not a transducer company.
                </p>
                <p>
                  Lab work is conducted at Circuit Launch, Mountain View, CA.
                  Company headquarters: San Francisco.
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.22}>
              <div
                className="mt-12 p-6 md:p-8"
                style={{
                  backgroundColor: "var(--ink)",
                  borderRadius: 4,
                }}
              >
                <span
                  className="small-caps"
                  style={{ color: "var(--green)" }}
                >
                  Company contact
                </span>
                <p
                  className="mt-4 font-display text-[15px] leading-[1.6]"
                  style={{ color: "var(--mute)" }}
                >
                  Aora, Inc. Founder: Ok Dara. For inquiries, research
                  collaboration, or to express interest in future access, email{" "}
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
                </p>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════ CTA ═══════════════════ */}
        <section
          className="px-6 md:px-10 py-24 md:py-32"
          style={{ backgroundColor: "var(--ink)" }}
        >
          <div
            className="mx-auto text-center"
            style={{ maxWidth: "48rem" }}
          >
            <FadeUp>
              <h2
                className="font-display font-light leading-[1.08] tracking-tightest text-[32px] md:text-[44px]"
                style={{ color: "var(--paper)" }}
              >
                Interested in following the research?
              </h2>
            </FadeUp>

            <FadeUp delay={0.08}>
              <p
                className="mt-6 font-display text-[17px] leading-[1.6]"
                style={{ color: "var(--mute)" }}
              >
                Reach out to{" "}
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
                to express interest in future access or research collaboration.
              </p>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="mt-10 flex flex-wrap justify-center gap-6">
                <a
                  href="/product"
                  className="small-caps px-6 py-3.5 transition-colors duration-150"
                  style={{
                    color: "var(--ink)",
                    backgroundColor: "var(--green)",
                    borderRadius: 3,
                  }}
                >
                  See Aora Nano
                </a>
              </div>
            </FadeUp>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
