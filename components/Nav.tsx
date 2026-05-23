"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { track } from "@/lib/track";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while drawer is open + close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close drawer when viewport widens to ≥ md so we don't leave a
  // stale-open state when rotating into desktop.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mql.matches) setOpen(false);
    };
    onChange();
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    } else {
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, []);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
        style={{
          backgroundColor: scrolled || open ? "rgba(10,10,10,0.85)" : "transparent",
          backdropFilter: scrolled || open ? "saturate(120%) blur(8px)" : undefined,
          WebkitBackdropFilter: scrolled || open ? "saturate(120%) blur(8px)" : undefined,
          borderBottom:
            scrolled || open ? "1px solid var(--rule)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto max-w-content px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 font-display text-xl md:text-2xl tracking-tight"
            aria-label="Aora home"
            onClick={() => setOpen(false)}
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

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 md:gap-10">
            <a
              href="/blog"
              className="small-caps hover:text-paper transition-colors duration-150"
              style={{ color: "var(--mute)" }}
            >
              Blog
            </a>
            <a
              href="/product"
              className="small-caps hover:text-paper transition-colors duration-150"
              style={{ color: "var(--mute)" }}
            >
              Product
            </a>
            <a
              href="/quiz"
              onClick={() => track("cta_clicked", { location: "nav" })}
              className="small-caps px-4 py-2.5 transition-colors duration-150 whitespace-nowrap"
              style={{
                color: "var(--ink)",
                backgroundColor: "var(--green)",
                borderRadius: 3,
              }}
            >
              Take the Assessment
            </a>
          </nav>

          {/* Mobile: CTA + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <a
              href="/quiz"
              onClick={() => track("cta_clicked", { location: "nav_mobile" })}
              className="small-caps px-3 py-2 transition-colors duration-150 whitespace-nowrap"
              style={{
                color: "var(--ink)",
                backgroundColor: "var(--green)",
                borderRadius: 3,
              }}
            >
              Assessment
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav-drawer"
              className="relative -mr-1 inline-flex h-10 w-10 items-center justify-center"
              style={{ color: "var(--paper)" }}
            >
              {/* Top bar */}
              <span
                aria-hidden
                className="absolute block transition-transform duration-200 ease-out"
                style={{
                  width: 22,
                  height: 1.5,
                  backgroundColor: "var(--paper)",
                  transform: open
                    ? "translateY(0) rotate(45deg)"
                    : "translateY(-5px) rotate(0)",
                }}
              />
              {/* Bottom bar */}
              <span
                aria-hidden
                className="absolute block transition-transform duration-200 ease-out"
                style={{
                  width: 22,
                  height: 1.5,
                  backgroundColor: "var(--paper)",
                  transform: open
                    ? "translateY(0) rotate(-45deg)"
                    : "translateY(5px) rotate(0)",
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-nav-drawer"
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Overlay */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(10,10,10,0.55)" }}
          tabIndex={open ? 0 : -1}
        />

        {/* Panel */}
        <div
          className={`absolute top-0 right-0 h-[100dvh] w-[min(86vw,360px)] flex flex-col transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            backgroundColor: "var(--ink)",
            borderLeft: "1px solid var(--rule)",
            paddingTop: "max(5rem, env(safe-area-inset-top))",
            paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
          }}
        >
          <nav className="flex-1 flex flex-col gap-1 px-6 overflow-y-auto">
            <DrawerLink href="/" onClick={() => setOpen(false)}>
              Home
            </DrawerLink>
            <DrawerLink href="/product" onClick={() => setOpen(false)}>
              Product
            </DrawerLink>
            <DrawerLink href="/blog" onClick={() => setOpen(false)}>
              Blog
            </DrawerLink>
            <DrawerLink href="/faq" onClick={() => setOpen(false)}>
              FAQ
            </DrawerLink>
            <DrawerLink href="/privacy" onClick={() => setOpen(false)}>
              Privacy
            </DrawerLink>
            <DrawerLink href="/terms" onClick={() => setOpen(false)}>
              Terms
            </DrawerLink>
          </nav>

          <div
            className="px-6 pt-6 mt-2"
            style={{ borderTop: "1px solid var(--rule)" }}
          >
            <a
              href="/quiz"
              onClick={() => {
                track("cta_clicked", { location: "nav_drawer" });
                setOpen(false);
              }}
              className="block w-full text-center small-caps py-3 transition-colors duration-150"
              style={{
                color: "var(--ink)",
                backgroundColor: "var(--green)",
                borderRadius: 3,
              }}
            >
              Take the Assessment
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function DrawerLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="font-display text-2xl tracking-tight py-3 transition-colors duration-150"
      style={{ color: "var(--paper)" }}
    >
      {children}
    </a>
  );
}
