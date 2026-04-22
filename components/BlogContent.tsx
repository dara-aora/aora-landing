"use client";

import { FadeUp } from "./FadeUp";
import { SmallCaps } from "./SmallCaps";
import { track } from "@/lib/track";

/**
 * BlogContent — the long-form body of /blog.
 *
 * Four entries, each its own full-width section with alternating backgrounds,
 * a wider header band (max-w-[64rem]), a mono index + SmallCaps kicker, a
 * prominent <h2>, and an "↑ Top" anchor link back to the masthead. Between
 * entries 01 and 02 sits a pull-quote interlude.
 *
 * Section ids drive the TOC in app/blog/page.tsx:
 *   #protocol   #hardware   #literature   #clinical-instruments
 */

type Paper = {
  title: string;
  focus: string;
  source: string;
  href: string;
  trackId: string;
};

const PAPERS: Paper[] = [
  {
    title:
      "Your Brain on ChatGPT: Accumulation of Cognitive Debt when Using an AI Assistant for Essay Writing",
    focus:
      "Quantifies how AI-assisted writing erodes critical thinking and long-term retention.",
    source: "arXiv · 2025",
    href: "https://arxiv.org/pdf/2506.08872",
    trackId: "cognitive_debt",
  },
  {
    title:
      "One-Ear EEG Device with Biosignal Noise for Real-Time Gesture Recognition and Various Interactions",
    focus:
      "Demonstrates a single-ear EEG form factor capable of continuous, low-profile sensing.",
    source: "ACM Digital Library · 2025",
    href: "https://dl.acm.org/doi/10.1145/3706598.3714185",
    trackId: "one_ear_eeg",
  },
  {
    title:
      "Unlocking the Potential of EEG in Alzheimer's Disease Research: Current Status and Pathways to Precision Detection",
    focus:
      "Positions EEG as a biomarker for early neurodegeneration and personalized care.",
    source: "Brain Research Bulletin · 2025",
    href: "https://doi.org/10.1016/j.brainresbull.2025.111166",
    trackId: "eeg_alzheimers",
  },
];

const FURTHER_READING: { label: string; href: string }[] = [
  {
    label: "nature.com/articles/s41598-025-95647-x",
    href: "https://www.nature.com/articles/s41598-025-95647-x",
  },
  {
    label: "pubmed.ncbi.nlm.nih.gov/29593605",
    href: "https://pubmed.ncbi.nlm.nih.gov/29593605/",
  },
  {
    label: "joiv.org/index.php/joiv/article/view/2045",
    href: "https://joiv.org/index.php/joiv/article/view/2045",
  },
];

type Spec = {
  label: string;
  subtitle: string;
  detail: string;
};

const HARDWARE_SPECS: Spec[] = [
  {
    label: "Cardiac",
    subtitle: "Single-lead ECG · IEC 60601-2-47",
    detail:
      "Dry electrodes on the mastoid bone capture clinical-grade ECG for 24/7 detection of atrial fibrillation, premature ventricular contractions, and other arrhythmias — no patches, no cables.",
  },
  {
    label: "PPG & pulse oximetry",
    subtitle: "MAX86176 · SFH7016 / SFH2701",
    detail:
      "The behind-the-ear site is one of the best locations on the body for optical sensing: stable skin contact, minimal motion artifacts, excellent perfusion. Delivers HR, SpO2, and HRV continuously.",
  },
  {
    label: "EEG potential",
    subtitle: ">1 GΩ input impedance · 0.6 µVRMS noise floor",
    detail:
      "Not a full clinical EEG, but sufficient to read basic cerebral biopotentials — attention level, drowsiness, stress signatures. The beginning of a consumer-grade neural interface.",
  },
  {
    label: "Connectivity & power",
    subtitle: "nRF54L15 · BLE 5.4 · 256 Mbit flash · wireless charging",
    detail:
      "Real-time streaming to a phone, days of offline buffer on the W25Q256, and LTC4126-10 wireless charging. Fully sealed — shower, rain, sport. No exposed connectors.",
  },
];

// ─── Per-entry header band ──────────────────────────────────────────────
type EntryHeadProps = {
  index: string;
  kicker: string;
  title: string;
};

function EntryHead({ index, kicker, title }: EntryHeadProps) {
  return (
    <>
      <FadeUp>
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-5">
            <span
              className="font-mono text-sm tracking-wider"
              style={{ color: "var(--green)" }}
            >
              {index}
            </span>
            <SmallCaps>{kicker}</SmallCaps>
          </div>
          <a
            href="#blog-heading"
            className="small-caps transition-colors duration-150"
            style={{ color: "var(--mute)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "var(--green-bright)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--mute)")
            }
          >
            ↑ Top
          </a>
        </div>
      </FadeUp>

      <FadeUp delay={0.08}>
        <h2
          className="mt-8 font-display font-light leading-[1.05] tracking-tightest text-[36px] sm:text-[44px] md:text-[52px]"
          style={{ color: "var(--paper)" }}
        >
          {title}
        </h2>
      </FadeUp>
    </>
  );
}

// ─── Entry wrapper ──────────────────────────────────────────────────────
type EntryProps = {
  id: string;
  bg: "ink" | "ink-raised";
  children: React.ReactNode;
};

function Entry({ id, bg, children }: EntryProps) {
  return (
    <section
      id={id}
      className="px-6 md:px-10 py-28 md:py-36 scroll-mt-24"
      style={{
        backgroundColor: bg === "ink" ? "var(--ink)" : "var(--ink-raised)",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "64rem" }}>
        {children}
      </div>
    </section>
  );
}

export function BlogContent() {
  return (
    <>
      {/* ───────────────── Entry 1 · Rumination protocol ───────────────── */}
      <Entry id="protocol" bg="ink">
        <EntryHead
          index="01"
          kicker="Protocol"
          title="How rumination is actually induced in a clinical EEG study."
        />

        <div className="mt-12 max-w-prose">
          <FadeUp delay={0.15}>
            <p
              className="font-display font-light text-xl md:text-[22px] leading-[1.55]"
              style={{ color: "var(--paper)" }}
            >
              Every session opens with a calibration baseline — one to three
              minutes of resting EEG, always. From there, negative mood is
              induced through a deliberately layered sequence: a brief
              autobiographical recall of a sad event, prompts surfacing
              unresolved personal goals, and then the rumination-elicitation
              task itself.
            </p>
          </FadeUp>

          <FadeUp delay={0.22}>
            <p
              className="mt-6 font-display font-light text-xl md:text-[22px] leading-[1.55]"
              style={{ color: "var(--paper)" }}
            >
              Participants generate four events from their own life — one sad,
              one frustrating, one failure, one hurtful — and rate each on a
              nine-point scale. A mean above five is the standard threshold for
              successful induction. Follow-up prompts then push the participant
              into metacognition: <em>what your feelings mean</em>,{" "}
              <em>why you reacted the way you did</em>. The session typically
              closes with Velten-style negative self-statements.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <p
              className="mt-6 font-display font-light text-xl md:text-[22px] leading-[1.55]"
              style={{ color: "var(--mute)" }}
            >
              This is the ground truth Aora&apos;s cognitive assessments are
              calibrated against. If our signal can&apos;t track what this
              protocol reliably produces, nothing else we build on top of it
              matters.
            </p>
          </FadeUp>

          <FadeUp delay={0.38}>
            <div className="mt-8">
              <SmallCaps>
                Standardized across clinical rumination-induction research
              </SmallCaps>
            </div>
          </FadeUp>
        </div>
      </Entry>

      {/* ───────────────── Pull-quote interlude ───────────────── */}
      <section
        className="px-6 md:px-10 py-32 md:py-48"
        style={{ backgroundColor: "var(--ink-raised)" }}
        aria-label="Pull quote"
      >
        <FadeUp>
          <blockquote
            className="mx-auto text-center"
            style={{ maxWidth: "48rem" }}
          >
            <p
              className="font-display font-light italic leading-[1.25] tracking-tight text-[30px] sm:text-[36px] md:text-[44px]"
              style={{ color: "var(--paper)" }}
            >
              &ldquo;If our signal can&apos;t track what this protocol reliably
              produces, nothing else we build on top of it matters.&rdquo;
            </p>
            <footer className="mt-10">
              <SmallCaps>— Aora method notes</SmallCaps>
            </footer>
          </blockquote>
        </FadeUp>
      </section>

      {/* ───────────────── Entry 2 · Hardware ───────────────── */}
      <Entry id="hardware" bg="ink">
        <EntryHead
          index="02"
          kicker="Hardware"
          title="What AORA Nano actually measures."
        />

        <div className="mt-12 max-w-prose">
          <FadeUp delay={0.15}>
            <p
              className="font-display font-light text-xl md:text-[22px] leading-[1.55]"
              style={{ color: "var(--paper)" }}
            >
              AORA Nano is a behind-the-ear wearable that continuously
              and invisibly monitors your cognitive state — a Holter-class
              cardiac monitor, a pulse oximeter, and a basic neural interface
              compressed into a sleek ear hook you forget you&apos;re wearing.
            </p>
          </FadeUp>
        </div>

        <div className="mt-14">
          <FadeUp delay={0.2}>
            <div className="mb-5">
              <SmallCaps>Behind-the-ear stack · 4 layers</SmallCaps>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-2"
              style={{ borderTop: "1px solid var(--rule)" }}
            >
              {HARDWARE_SPECS.map((spec, idx) => (
                <div
                  key={spec.label}
                  className="p-8 md:p-10"
                  style={{
                    borderBottom: "1px solid var(--rule)",
                    borderRight:
                      idx % 2 === 0 ? "1px solid var(--rule)" : undefined,
                  }}
                >
                  <SmallCaps>{spec.label}</SmallCaps>
                  <div
                    className="mt-3 font-mono text-xs tracking-wider"
                    style={{ color: "var(--green)" }}
                  >
                    {spec.subtitle}
                  </div>
                  <p
                    className="mt-5 font-display font-light text-lg md:text-[19px] leading-[1.5]"
                    style={{ color: "var(--paper)" }}
                  >
                    {spec.detail}
                  </p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>

        <div className="mt-14 max-w-prose">
          <FadeUp delay={0.28}>
            <p
              className="font-display font-light text-xl md:text-[22px] leading-[1.55]"
              style={{ color: "var(--mute)" }}
            >
              The use cases fall out of the sensor stack: an AFib patient
              wearing Nano instead of a Holter, an athlete tracking HRV through
              training without a chest strap, a long-haul pilot or truck driver
              being warned before they fall asleep, an elderly person monitored
              continuously without ever feeling like a patient.
            </p>
          </FadeUp>
        </div>
      </Entry>

      {/* ───────────────── Entry 3 · Literature ───────────────── */}
      <Entry id="literature" bg="ink-raised">
        <EntryHead
          index="03"
          kicker="Literature"
          title="The research we're building on."
        />

        <div className="mt-12 max-w-prose">
          <FadeUp delay={0.15}>
            <p
              className="font-display font-light text-xl md:text-[22px] leading-[1.55]"
              style={{ color: "var(--mute)" }}
            >
              Three threads shape Aora&apos;s roadmap: the cognitive cost of
              outsourcing thinking to AI, the viability of single-ear EEG, and
              the maturing case for EEG as a neurodegeneration biomarker.
            </p>
          </FadeUp>
        </div>

        <div className="mt-12">
          <FadeUp delay={0.2}>
            <ul
              className="flex flex-col"
              style={{ borderTop: "1px solid var(--rule)" }}
            >
              {PAPERS.map((paper, idx) => (
                <li
                  key={paper.href}
                  style={{ borderBottom: "1px solid var(--rule)" }}
                >
                  <a
                    href={paper.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      track("external_link_clicked", {
                        location: "blog",
                        paper: paper.trackId,
                      })
                    }
                    className="group block p-8 md:p-10 transition-colors duration-150"
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "var(--green-tint)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent")
                    }
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-start gap-5 md:gap-7 flex-1">
                        <span
                          className="font-mono text-sm tracking-wider pt-1 shrink-0"
                          style={{ color: "var(--green)" }}
                          aria-hidden
                        >
                          [{idx + 1}]
                        </span>
                        <div className="flex-1">
                          <SmallCaps>{paper.source}</SmallCaps>
                          <h4
                            className="mt-3 font-display font-light leading-[1.15] tracking-tight text-xl md:text-2xl"
                            style={{ color: "var(--paper)" }}
                          >
                            {paper.title}
                          </h4>
                          <p
                            className="mt-4 font-display font-light text-base md:text-[17px] leading-[1.5]"
                            style={{ color: "var(--mute)" }}
                          >
                            {paper.focus}
                          </p>
                        </div>
                      </div>
                      <span
                        aria-hidden
                        className="font-display text-xl transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        style={{ color: "var(--green)" }}
                      >
                        ↗
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="mt-10">
              <SmallCaps>Further reading</SmallCaps>
              <ul className="mt-4 flex flex-col gap-2">
                {FURTHER_READING.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        track("external_link_clicked", {
                          location: "blog_further_reading",
                          href: item.href,
                        })
                      }
                      className="font-mono text-xs tracking-wider transition-colors duration-150"
                      style={{ color: "var(--mute)" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--green-bright)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color =
                          "var(--mute)")
                      }
                    >
                      {item.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        </div>
      </Entry>

      {/* ───────────────── Entry 4 · Clinical instruments ───────────────── */}
      <Entry id="clinical-instruments" bg="ink">
        <EntryHead
          index="04"
          kicker="Clinical instruments"
          title="Built on instruments your neurologist already uses."
        />

        <div className="mt-12 max-w-prose">
          <FadeUp delay={0.15}>
            <p
              className="font-display font-light text-xl md:text-[22px] leading-[1.55]"
              style={{ color: "var(--paper)" }}
            >
              Aora&apos;s self-report assessments are adapted from the{" "}
              <span style={{ borderBottom: "1px solid var(--rule)" }}>
                Copenhagen Burnout Inventory
                <sup
                  className="font-mono text-xs align-super"
                  style={{ color: "var(--green)" }}
                >
                  1
                </sup>
              </span>
              , the{" "}
              <span style={{ borderBottom: "1px solid var(--rule)" }}>
                Perceived Stress Scale
                <sup
                  className="font-mono text-xs align-super"
                  style={{ color: "var(--green)" }}
                >
                  2
                </sup>
              </span>
              , and peer-reviewed cognitive-load research — the same tools used
              in studies at Stanford and Mass General.
            </p>
          </FadeUp>

          <FadeUp delay={0.22}>
            <p
              className="mt-6 font-display font-light text-xl md:text-[22px] leading-[1.55]"
              style={{ color: "var(--mute)" }}
            >
              Layered on top, the wearable combines HRV, sleep architecture, and
              Apple Health signals against the Nature Medicine (2025) framework
              for smartwatch-based cognitive assessment
              <sup
                className="font-mono text-xs align-super"
                style={{ color: "var(--green)" }}
              >
                3
              </sup>
              .
            </p>
          </FadeUp>
        </div>
      </Entry>
    </>
  );
}
