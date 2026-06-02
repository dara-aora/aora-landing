import { Nav } from "@/components/Nav";
import { VideoHero } from "@/components/VideoHero";
import { ProductHighlights } from "@/components/ProductHighlights";
import { BrainCareSection } from "@/components/BrainCareSection";
import { MeasuresSection } from "@/components/MeasuresSection";
import { HowItWorks } from "@/components/HowItWorks";
import { OfferSection } from "@/components/OfferSection";
import { ScienceTeaser } from "@/components/ScienceTeaser";
import { FinalCTA } from "@/components/FinalCTA";
import { ChromeExtensionSection } from "@/components/ChromeExtensionSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <VideoHero />

        <ProductHighlights />

        <BrainCareSection />

        <MeasuresSection />

        <HowItWorks />

        <OfferSection />

        <ScienceTeaser />

        <FinalCTA />

        <ChromeExtensionSection />
      </main>
      <Footer />
    </>
  );
}
