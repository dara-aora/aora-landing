"use client";

import { motion, useReducedMotion } from "framer-motion";
import { track } from "@/lib/track";

const PREORDER_URL = "https://buy.stripe.com/aFa7sMd4sfu18mp9m48so0b";

/**
 * OfferSection — Section 6
 *
 * Rich product offer card moved from /product to the landing page.
 * Layout inspired by the reference image:
 *   - Left: product image placeholder
 *   - Center: product info, price, BUY NOW, trust badges
 *   - Right: money-back guarantee badge placeholder
 */
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
          {/* Three-column layout on desktop */}
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">
            {/* Left: Product image */}
            <div className="w-full lg:w-[28%] shrink-0">
              <div
                className="relative overflow-hidden flex items-center justify-center"
                style={{
                  aspectRatio: "3 / 4",
                  backgroundColor: "var(--ink-raised)",
                  border: "1px solid var(--rule)",
                  borderRadius: 4,
                }}
              >
                <img
                  src="/device-aora.png"
                  alt="Aora Nano"
                  className="h-full w-full object-cover"
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

            {/* Right: Money-back guarantee seal */}
            <div className="w-full lg:w-[22%] shrink-0 flex flex-col items-center lg:items-end">
              <GuaranteeBadge />
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

/**
 * GuaranteeBadge — ornate circular seal in gold/bronze tones.
 *
 * SVG-based so it stays crisp at any size. No external image required.
 */
function GuaranteeBadge() {
  const size = 170;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.46;
  const rInner = size * 0.38;

  // Generate 12 star points around the outer ring
  const stars = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 360) / 12 - 90;
    const rad = (angle * Math.PI) / 180;
    const x = cx + rOuter * Math.cos(rad);
    const y = cy + rOuter * Math.sin(rad);
    return { x, y, key: i };
  });

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label="100 percent money back guarantee 30 day guarantee"
        className="absolute inset-0"
      >
        <defs>
          {/* Gold radial gradient for the badge face */}
          <radialGradient
            id="badge-gold"
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.18} />
            <stop offset="70%" stopColor="#A6884D" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#8A6F3A" stopOpacity={0} />
          </radialGradient>

          {/* Inner ring gradient */}
          <linearGradient
            id="badge-ring"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#C9A96E" />
            <stop offset="50%" stopColor="#A6884D" />
            <stop offset="100%" stopColor="#8A6F3A" />
          </linearGradient>
        </defs>

        {/* Outer glow */}
        <circle
          cx={cx}
          cy={cy}
          r={rOuter + 4}
          fill="url(#badge-gold)"
          opacity={0.4}
        />

        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={rOuter}
          fill="none"
          stroke="url(#badge-ring)"
          strokeWidth={1.5}
          opacity={0.85}
        />

        {/* Dashed middle ring */}
        <circle
          cx={cx}
          cy={cy}
          r={(rOuter + rInner) / 2}
          fill="none"
          stroke="#C9A96E"
          strokeWidth={0.6}
          strokeDasharray="3 3"
          opacity={0.5}
        />

        {/* Inner ring */}
        <circle
          cx={cx}
          cy={cy}
          r={rInner}
          fill="none"
          stroke="url(#badge-ring)"
          strokeWidth={1}
          opacity={0.7}
        />

        {/* Star decorations around outer ring */}
        {stars.map(({ x, y, key }) => (
          <g key={key} transform={`translate(${x}, ${y})`}>
            <polygon
              points="0,-4 1,-1 4,0 1,1 0,4 -1,1 -4,0 -1,-1"
              fill="#C9A96E"
              opacity={0.75}
            />
          </g>
        ))}

        {/* Curved text path: top arc — MONEY BACK */}
        <path
          id="arc-top"
          d={`M ${cx - 55} ${cy - 18} A 55 55 0 0 1 ${cx + 55} ${cy - 18}`}
          fill="none"
        />
        <text
          fontSize={9}
          letterSpacing={2}
          fontWeight={500}
          fill="#C9A96E"
        >
          <textPath href="#arc-top" startOffset="50%" textAnchor="middle">
            MONEY BACK
          </textPath>
        </text>

        {/* Curved text path: bottom arc — GUARANTEE */}
        <path
          id="arc-bottom"
          d={`M ${cx - 55} ${cy + 32} A 55 55 0 0 0 ${cx + 55} ${cy + 32}`}
          fill="none"
        />
        <text
          fontSize={8.5}
          letterSpacing={1.5}
          fontWeight={500}
          fill="#C9A96E"
        >
          <textPath href="#arc-bottom" startOffset="50%" textAnchor="middle">
            GUARANTEE
          </textPath>
        </text>

        {/* Center "100%" */}
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          fontSize={36}
          fontWeight={300}
          fill="#C9A96E"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          100%
        </text>

        {/* Small bottom line — UP TO 1 YEAR */}
        <text
          x={cx}
          y={cy + 44}
          textAnchor="middle"
          fontSize={7}
          letterSpacing={1.5}
          fill="#A6884D"
        >
          30 DAY GUARANTEE
        </text>
      </svg>
    </div>
  );
}
