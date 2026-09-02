import { Nav } from "@/components/Nav";
import { VideoHero } from "@/components/VideoHero";
import { ProductChoiceSection } from "@/components/ProductChoiceSection";
import { ProductHighlights } from "@/components/ProductHighlights";
import { BrainCareSection } from "@/components/BrainCareSection";
import { MeasuresSection } from "@/components/MeasuresSection";
import { HowItWorks } from "@/components/HowItWorks";
import { OfferSection } from "@/components/OfferSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <VideoHero />

        <ProductChoiceSection />

        <ProductHighlights />

        <BrainCareSection />

        <MeasuresSection />

        <HowItWorks />

        <OfferSection />
      </main>
      <Footer />
    </>
  );
}
