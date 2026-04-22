import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ProductStickyHero } from "@/components/ProductStickyHero";
import { ProductSpecStrip } from "@/components/ProductSpecStrip";
import { ProductBuyCard } from "@/components/ProductBuyCard";
import { ProductExplainer } from "@/components/ProductExplainer";
import { FinalCTA } from "@/components/FinalCTA";

export const metadata: Metadata = {
  title: "Aora Nano — The device",
  description:
    "Aora Nano is a behind-the-ear wearable with continuous ECG, PPG, and early neural-potential sensing. On-device processing. Low power. Always on. $199. Founder membership from $10/month.",
  openGraph: {
    title: "Aora Nano — The device",
    description:
      "A new instrument for brain state. Behind-the-ear, continuous, on-device.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aora Nano — The device",
    description:
      "A new instrument for brain state. Behind-the-ear, continuous, on-device.",
  },
};

/**
 * /product — dedicated product page.
 *
 * Opens with the cinematic StickyVideo hero that used to anchor the
 * landing page: a pinned, scroll-scrubbed video with three beats
 * layered over it — the tagline Hero, the 73% stat, and the three-
 * signal measures grid. Below the pinned zone: a short spec rail,
 * the single-price buy card, the three-step explainer, and the
 * shared FinalCTA that funnels to the assessment.
 */
export default function ProductPage() {
  return (
    <>
      <Nav />
      <main>
        <ProductStickyHero />
        <ProductSpecStrip />
        <ProductBuyCard />
        <ProductExplainer />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
