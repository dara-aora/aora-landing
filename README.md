# Aora — Landing Page

A scroll-driven, cinematic landing page for **Aora** — an Apple Watch
companion for brain health. Neuralink-style staging, built from the
`aora-website-build-spec.md` in this repo.

Single page at `/`. Sticky video pins through the first three scroll
beats (hero, the 73% stat, three-signal breakdown). Then: coverage
strip, science teaser, final CTA.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion.

---

## Quickstart

```bash
npm install
npm run dev
```

Then visit http://localhost:3000.

The page will run without the hero video — you'll see the vignette and
poster fallback only. To get the full effect, follow the video setup
below.

---

## Hero video setup

`Upscale.mp4` at the repo root is the source. It's too large to ship
(~44 MB). Compress it into three web-ready files inside `public/video/`:

```bash
# MP4 (H.264) — universal fallback, target <4 MB
ffmpeg -i Upscale.mp4 \
  -vcodec libx264 -crf 28 -preset slow -an \
  -movflags +faststart -vf "scale=1920:-2" \
  public/video/aora-hero.mp4

# WebM (VP9) — preferred, smaller, target <3 MB
ffmpeg -i Upscale.mp4 \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -an \
  -vf "scale=1920:-2" \
  public/video/aora-hero.webm

# Poster frame (first frame of the video)
ffmpeg -i Upscale.mp4 -vframes 1 -q:v 2 \
  public/video/aora-poster.jpg
```

If `ffmpeg` is not installed: `brew install ffmpeg`.

Don't commit `Upscale.mp4` or the compressed outputs if you care about
repo size — add them to `.gitignore` as needed.

---

## Design tokens

Defined as CSS variables in `app/globals.css` and surfaced to Tailwind
via `tailwind.config.ts`:

| Token              | Value                         | Use                          |
| ------------------ | ----------------------------- | ---------------------------- |
| `--ink`            | `#0A0A0A`                     | Primary background           |
| `--ink-raised`     | `#141414`                     | Secondary / card sections    |
| `--paper`          | `#F4F2EC`                     | Body text (warm, not stark)  |
| `--mute`           | `#8A8A8A`                     | Captions, small caps         |
| `--rule`           | `#1F1F1F`                     | Hairline dividers            |
| `--green`          | `#6E8B3D`                     | CTA, live-dot, logo accent   |
| `--green-bright`   | `#8FAE5A`                     | Hover state                  |
| `--green-tint`     | `rgba(110,139,61,0.08)`       | Score highlights             |

Green is used **only** for CTAs, the live-pulse dot, the logo accent,
and occasional underlines. No gradients, no glass, no drop shadows.

---

## Fonts

Loaded via `next/font/google` in `lib/fonts.ts`:

- **Fraunces** — display serif (headlines)
- **Inter** — body sans
- **JetBrains Mono** — numerics

---

## File map

```
app/
  layout.tsx            root layout + fonts + metadata
  page.tsx              composes the home sections
  globals.css           tokens + base styles + keyframes

components/
  Nav.tsx               top nav, transparent → ink on scroll
  Hero.tsx              section 1 — headline + CTA
  StickyVideo.tsx       pinned cinematic video (spans sections 1-3)
  StatSection.tsx       section 2 — the 73% stat
  MeasuresSection.tsx   section 3 — Cognitive Load / Recovery / Burnout Risk
  SocialProofStrip.tsx  section 4 — coverage wordmarks
  ScienceTeaser.tsx     section 5 — essay-voice science teaser
  FinalCTA.tsx          section 6 — repeat CTA
  Footer.tsx            minimal footer
  FadeUp.tsx            reusable scroll-reveal wrapper
  LiveDot.tsx           the 1Hz green pulse (signature flourish)
  SmallCaps.tsx         typographic primitive

lib/
  fonts.ts              next/font exports
  motion.ts             shared motion variants
  track.ts              analytics stub (swap for PostHog later)

public/
  video/                hero video assets (see setup above)
```

---

## What's stubbed (intentional)

- `/quiz` route — CTAs link to it; route not built yet.
- PostHog / analytics — `lib/track.ts` is a console.debug stub.
- Real coverage logos — using wordmarks in `SocialProofStrip.tsx`.
- `/science` — teaser links to `#science-full`, no page yet.
- Footer links — all `#` for now.

---

## Accessibility

- All interactive elements keyboard-reachable with visible focus rings
  in `--green-bright`.
- `prefers-reduced-motion` respected globally (no parallax, no scale,
  no autoplay-ish motion).
- Color contrast meets WCAG AA:
  - `--paper` on `--ink` = 18.5 : 1
  - `--green` on `--ink` = 5.1 : 1

---

## Build

```bash
npm run build
npm run start
```

Lighthouse target: 95+ on all four metrics. JS budget for the home
route: < 100 KB.
