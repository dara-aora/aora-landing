import { Nav } from "@/components/Nav";
import { ArchitectureScroll } from "@/components/ArchitectureScroll";
import { ChromeExtensionSection } from "@/components/ChromeExtensionSection";
import { StatSection } from "@/components/StatSection";
import { SocialProofStrip } from "@/components/SocialProofStrip";
import { MeasuresSection } from "@/components/MeasuresSection";
import { ScienceTeaser } from "@/components/ScienceTeaser";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/*
          ArchitectureScroll is the opening act: a Neuralink-style pinned
          section (1000vh) with a large centered PCB photograph that stays
          fixed on screen. As the user scrolls, one of nine overlay zones
          on the PCB lights up in green (bracket corners + soft glow) and a
          text panel on the left crossfades to reveal that layer's name,
          summary, included components, and physical appearance. One scroll
          gesture ≈ one layer (Sensor → Analog → Filtering → Processing →
          Memory → Wireless → Power → Grounding → Mechanical), reinforced
          by proximity snap markers. Handoff gradient at the bottom fades
          into the ChromeExtensionSection that follows.
        */}
        <ArchitectureScroll />

        {/*
          ChromeExtensionSection introduces the companion software layer
          that surfaces real-time cognitive state in the browser and funnels
          to the Chrome Web Store listing.
        */}
        <ChromeExtensionSection />

        <StatSection />
        <SocialProofStrip />
        <MeasuresSection />
        <ScienceTeaser />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
