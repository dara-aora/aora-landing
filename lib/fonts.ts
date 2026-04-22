import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

export const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  // Fraunces is a variable font; next/font expects one of weight OR
  // variable-axis. We keep static weights for deterministic rendering.
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

export const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
});
