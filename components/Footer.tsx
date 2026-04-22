import Image from "next/image";
import { SmallCaps } from "./SmallCaps";

export function Footer() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: "var(--rule)", backgroundColor: "var(--ink)" }}
    >
      <div className="mx-auto max-w-content px-6 md:px-10 py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div>
            <a
              href="/"
              className="flex items-center gap-3 font-display text-3xl tracking-tight"
              aria-label="Aora home"
            >
              <Image
                src="/icon128.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <span style={{ color: "var(--paper)" }}>AORA</span>
            </a>
            <p
              className="mt-6 max-w-xs font-display text-lg leading-snug"
              style={{ color: "var(--mute)" }}
            >
              Power up your brain
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {[
              { label: "Blog", href: "/blog" },
              { label: "FAQ", href: "/faq" },
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="small-caps hover:text-paper transition-colors"
                style={{ color: "var(--mute)" }}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div
          className="mt-16 pt-6 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{ borderColor: "var(--rule)" }}
        >
          <SmallCaps>© {new Date().getFullYear()} Aora, Inc.</SmallCaps>
          <SmallCaps>Not a medical device · Data never sold</SmallCaps>
        </div>
      </div>
    </footer>
  );
}
