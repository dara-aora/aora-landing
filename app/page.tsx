import { Nav } from "@/components/Nav";
import { VideoHero } from "@/components/VideoHero";
import { ChromeExtensionSection } from "@/components/ChromeExtensionSection";

import { MeasuresSection } from "@/components/MeasuresSection";
import { HowItWorks } from "@/components/HowItWorks";
import { ScienceTeaser } from "@/components/ScienceTeaser";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/*
          VideoHero opens the page with `aora-hero.mp4` scroll-scrubbed
          behind a pinned copy layer. A tagline card cross-fades into
          the eight anatomy "notes" one at a time as the user scrolls,
          then unpins directly into the Chrome extension section below.
        */}
        <VideoHero />

        
        <MeasuresSection />

        {/*
          HowItWorks: scroll-scrubbed video with 9 crossfading architecture
          layers. Positioned after MeasuresSection so the user first sees
          what AORA measures, then how the device achieves it.
        */}
        <HowItWorks />

        <ScienceTeaser />

        {/*
          FinalCTA: "Measure the one thing you can't afford to lose."
          Preorder call-to-action for AORA Nano.
        */}
        <FinalCTA />

        {/*
          ChromeExtensionSection introduces the standalone software layer
          that surfaces real-time cognitive state in the browser — no
          hardware commitment required — and funnels to the Chrome Web
          Store listing.
        */}
        <ChromeExtensionSection />
      </main>
      <Footer />
    </>
  );
}
