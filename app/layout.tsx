import type { Metadata, Viewport } from "next";
import { display, sans, mono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aoramind.com"),
  title: "Aora - Power Up Your Mind.",
  description:
    "Aora measures cognitive load, recovery, and burnout risk. The first wearable built for the organ that runs everything.",
  openGraph: {
    title: "Aora - Power Up Your Mind.",
    description:
      "Measure the one thing you can't afford to lose. Take the 2-minute Brain State assessment.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aora - Power Up Your Mind.",
    description: "Measure the one thing you can't afford to lose.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
