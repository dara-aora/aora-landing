"use client";

import { FadeUp } from "./FadeUp";
import { SmallCaps } from "./SmallCaps";
import { track } from "@/lib/track";

const PREORDER_URL = "https://buy.stripe.com/bJe6oI9Sgfu1cCF1TC8so09";

/**
 * Single-product buy card. No tiers — one device, one price.
 * Mirrors the "subtle green hairline border" treatment called for
 * in the build spec (aora-website-build-spec.md §5.4).
 */
export function ProductBuyCard() {
  return (
    <section
      className="relative px-6 md:px-10 py-24 md:py-36 snap-section flex items-center"
      style={{ backgroundColor: "var(--ink)" }}
      aria-labelledby="buy-heading"
    >
      <div className="mx-auto max-w-section w-full">
        <FadeUp>
          <div
            className="relative mx-auto p-8 md:p-14"
            style={{
              maxWidth: 560,
              border: "1px solid var(--green)",
              borderRadius: 4,
              backgroundColor: "transparent",
            }}
          >
            <div className="flex items-baseline justify-between mb-8 md:mb-10">
              <SmallCaps tone="paper">Aora Nano</SmallCaps>
              <SmallCaps>Pre-order</SmallCaps>
            </div>

            <h2
              id="buy-heading"
              className="font-display font-light leading-[0.95] tracking-tightest text-[56px] sm:text-[72px] md:text-[104px]"
              style={{ color: "var(--paper)" }}
            >
              $200
            </h2>

            <p
              className="mt-6 font-display font-light text-[17px] md:text-[19px] leading-snug"
              style={{ color: "var(--paper)" }}
            >
              One device. One-time purchase.
              <br />
              <span style={{ color: "var(--mute)" }}>
                Software updates included.
              </span>
            </p>

            <div className="mt-10 md:mt-12 flex flex-col items-start gap-5">
              <a
                href={PREORDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track("checkout_started", { location: "product_buy_card" })
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
                Pre-order
                <span aria-hidden>→</span>
              </a>

              <SmallCaps>
                Ships July 2026 · 30-day return · No data sold
              </SmallCaps>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
