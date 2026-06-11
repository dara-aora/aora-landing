"use client";

import { motion, useReducedMotion } from "framer-motion";
import { track } from "@/lib/track";

const PREORDER_URL = "https://buy.stripe.com/aFa7sMd4sfu18mp9m48so0b";

export function OfferSection() {
  const reduced = useReducedMotion();

  const handleBuyNow = () => {
    track("checkout_started", { location: "offer_section" });
    window.open(PREORDER_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      className="relative w-full px-6 md:px-10 py-28 md:py-40 snap-section"
      style={{ backgroundColor: "var(--ink)" }}
      aria-labelledby="offer-heading"
    >
      <div className="max-w-content mx-auto">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">
            {/* Left: Product image */}
            <div className="w-full lg:w-[28%] shrink-0">
              <div
                className="relative overflow-hidden"
                style={{
                  border: "1px solid var(--rule)",
                  borderRadius: 4,
                }}
              >
                <img
                  src="/image2.png"
                  alt="Aora Nano"
                  className="w-full"
                  draggable={false}
                />
              </div>
            </div>

            {/* Center: Product details */}
            <div className="flex-1 min-w-0">
              <span
                className="font-mono text-xs tracking-wider uppercase block mb-3"
                style={{ color: "var(--green-bright)" }}
              >
                AORA Nano
              </span>

              <h2
                id="offer-heading"
                className="font-display font-light leading-[1.02] tracking-tightest text-[32px] sm:text-4xl md:text-[48px]"
                style={{ color: "var(--paper)" }}
              >
                AORA Nano
              </h2>

              <p
                className="mt-3 font-display font-light text-base md:text-lg leading-snug"
                style={{ color: "var(--mute)" }}
              >
                The world&apos;s most advanced neurofeedback wearable.
              </p>

              <div className="mt-8">
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-display font-light leading-none tracking-tightest text-[40px] md:text-[56px]"
                      style={{ color: "var(--paper)" }}
                    >
                      $199.00
                    </span>
                    <span
                      className="font-display font-light text-base md:text-lg"
                      style={{ color: "var(--mute)" }}
                    >
                      USD
                    </span>
                  </div>
                  <img
                    src="/guarantee-badge.png"
                    alt="30-day money-back guarantee"
                    className="w-12 md:w-14 ml-1"
                    draggable={false}
                  />
                </div>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--mute)" }}
                >
                  4 interest-free payments of $49.75
                </p>
              </div>

              {/* BUY NOW button */}
              <div className="mt-8">
                <button
                  onClick={handleBuyNow}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-10 text-base font-medium transition-colors duration-150"
                  style={{
                    backgroundColor: "var(--green)",
                    color: "var(--ink)",
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "var(--green-bright)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "var(--green)")
                  }
                >
                  BUY NOW
                  <span aria-hidden>→</span>
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <TrustBadge label="30-Day Trial" />
                <TrustBadge label="Free Returns" />
                <TrustBadge label="Secure Checkout" />
              </div>

              {/* Bottom guarantee text */}
              <p
                className="mt-8 text-xs md:text-sm leading-relaxed max-w-lg"
                style={{ color: "var(--mute)" }}
              >
                We stand behind AORA Nano. If you&apos;re not completely
                satisfied, return it within 30 days for a full refund.
                No questions asked.
              </p>
            </div>

            
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block rounded-full"
        style={{
          width: 6,
          height: 6,
          backgroundColor: "var(--green-bright)",
        }}
      />
      <span
        className="text-xs tracking-wide"
        style={{ color: "var(--mute)" }}
      >
        {label}
      </span>
    </div>
  );
}