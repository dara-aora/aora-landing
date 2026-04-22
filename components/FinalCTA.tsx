"use client";

import { FadeUp } from "./FadeUp";
import { SmallCaps } from "./SmallCaps";
import { track } from "@/lib/track";

const STRIPE_CHECKOUT_URL =
  "https://buy.stripe.com/bJe6oI9Sgfu1cCF1TC8so09";

export function FinalCTA() {
  return (
    <section
      className="relative px-6 md:px-10 py-36 md:py-52 snap-section flex items-center"
      style={{ backgroundColor: "var(--ink)" }}
      aria-labelledby="final-cta-heading"
    >
      <div className="max-w-prose mx-auto text-center w-full">
        <FadeUp>
          <h2
            id="final-cta-heading"
            className="font-display font-light leading-[0.98] tracking-tightest text-[36px] sm:text-[48px] md:text-[64px] lg:text-[84px]"
            style={{ color: "var(--paper)" }}
          >
            Measure the one thing you can&apos;t afford to lose.
          </h2>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="mt-12 md:mt-16 flex flex-col items-center gap-6">
            <a
              href={STRIPE_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track("checkout_started", { location: "final_cta" })
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
              Preorder AORA Nano
              <span aria-hidden>→</span>
            </a>
            <SmallCaps>
              Preorder · Ships July 2026 · Extension free today
            </SmallCaps>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
