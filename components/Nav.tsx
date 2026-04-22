"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { track } from "@/lib/track";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(10,10,10,0.85)" : "transparent",
        backdropFilter: scrolled ? "saturate(120%) blur(8px)" : undefined,
        WebkitBackdropFilter: scrolled ? "saturate(120%) blur(8px)" : undefined,
        borderBottom: scrolled ? "1px solid var(--rule)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto max-w-content px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2 font-display text-xl md:text-2xl tracking-tight"
          aria-label="Aora home"
        >
          <Image
            src="/icon128.png"
            alt=""
            width={32}
            height={32}
            priority
            className="h-7 w-7 md:h-8 md:w-8"
          />
          <span style={{ color: "var(--paper)" }}>AORA</span>
        </a>

        <nav className="flex items-center gap-4 sm:gap-6 md:gap-10">
          <a
            href="/blog"
            className="small-caps hover:text-paper transition-colors duration-150"
            style={{ color: "var(--mute)" }}
          >
            Blog
          </a>
          <a
            href="/product"
            className="small-caps hover:text-paper transition-colors duration-150 hidden sm:inline"
            style={{ color: "var(--mute)" }}
          >
            Product
          </a>
          <a
            href="/quiz"
            onClick={() => track("cta_clicked", { location: "nav" })}
            className="small-caps px-3 py-2 md:px-4 md:py-2.5 transition-colors duration-150 whitespace-nowrap"
            style={{
              color: "var(--ink)",
              backgroundColor: "var(--green)",
              borderRadius: 3,
            }}
          >
            <span className="sm:hidden">Assessment</span>
            <span className="hidden sm:inline">Take the Assessment</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
