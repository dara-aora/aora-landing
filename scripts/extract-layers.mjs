/**
 * extract-layers.mjs
 *
 * One-time asset extraction for the AnatomyHero.
 *
 * Reads public/anatomy/source.jpg (1280 × 853) and produces seven
 * transparent PNGs — one per internal component — by:
 *
 *   1. extracting a generous bounding box around each layer,
 *   2. generating a feathered alpha mask (vertical core + horizontal
 *      edge fades) that erases the black surround and the baked-in
 *      leader-line stubs,
 *   3. joining the mask as the alpha channel on the cropped RGB.
 *
 * Also emits public/anatomy/manifest.json describing each output.
 *
 * Run:  node scripts/extract-layers.mjs
 * Or:   npm run extract-layers
 *
 * Tune LAYERS[].* if visual bleed is visible after the first run.
 */

import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "public", "anatomy", "source.jpg");
const OUT_DIR = path.join(ROOT, "public", "anatomy");

// ─── Source geometry ─────────────────────────────────────────────────────
// Source image is 1280 × 853. The exploded stack spans roughly x∈[300, 900]
// and y∈[30, 830]. Crops are tuned to pass through the darkest mid-gap
// between adjacent layers.

const SRC_W = 1280;
const SRC_H = 853;

/**
 * Each layer:
 *   slug        — filename slug
 *   name        — display name (for manifest)
 *   x,y,w,h     — crop rectangle in source pixels
 *   coreTop     — y (within crop) where mask is fully opaque (top of core)
 *   coreBottom  — y (within crop) where mask is still fully opaque (bottom)
 *   featherTop  — falloff pixels above coreTop
 *   featherBot  — falloff pixels below coreBottom
 *   leftFade    — pixels from left edge to fade to 0 alpha (erases leader stubs)
 *   rightFade   — pixels from right edge to fade to 0 alpha
 */
const LAYERS = [
  {
    n: 1, slug: "top-cover", name: "Top Cover",
    x: 310, y: 40,  w: 520, h: 130,
    coreTop: 20, coreBottom: 100,
    featherTop: 20, featherBot: 30,
    leftFade: 80,  rightFade: 70,
  },
  {
    n: 2, slug: "coil", name: "Wireless Charging Coil",
    x: 310, y: 170, w: 520, h: 100,
    coreTop: 10, coreBottom: 80,
    featherTop: 10, featherBot: 20,
    leftFade: 80,  rightFade: 70,
  },
  {
    n: 3, slug: "battery", name: "Battery",
    x: 310, y: 255, w: 520, h: 120,
    coreTop: 10, coreBottom: 95,
    featherTop: 10, featherBot: 25,
    leftFade: 80,  rightFade: 70,
  },
  {
    n: 4, slug: "main-pcb", name: "Main PCB",
    x: 310, y: 355, w: 520, h: 135,
    coreTop: 15, coreBottom: 110,
    featherTop: 15, featherBot: 25,
    leftFade: 80,  rightFade: 70,
  },
  {
    n: 5, slug: "internal-frame", name: "Internal Frame",
    x: 310, y: 498, w: 520, h: 100,
    coreTop: 10, coreBottom: 78,
    featherTop: 10, featherBot: 22,
    leftFade: 80,  rightFade: 70,
  },
  {
    n: 6, slug: "sensor-layer", name: "Sensor Layer",
    x: 310, y: 595, w: 520, h: 115,
    coreTop: 10, coreBottom: 93,
    featherTop: 10, featherBot: 22,
    leftFade: 80,  rightFade: 70,
  },
  {
    n: 7, slug: "bottom-cover", name: "Bottom Cover",
    x: 310, y: 720, w: 520, h: 115,
    coreTop: 10, coreBottom: 92,
    featherTop: 10, featherBot: 23,
    leftFade: 80,  rightFade: 70,
  },
];

// ─── Mask generation ─────────────────────────────────────────────────────

/**
 * Build a grayscale alpha mask of size w × h.
 * Core region [coreTop, coreBottom] = 255; linear falloff to 0 above and
 * below. Horizontal edge fades multiply the result so leader-stub zones
 * disappear.
 *
 * Returns a Buffer of raw single-channel pixel data of length w*h.
 */
function buildMask(w, h, coreTop, coreBottom, featherTop, featherBot, leftFade, rightFade) {
  const buf = Buffer.alloc(w * h);
  for (let y = 0; y < h; y++) {
    // vertical factor
    let vy;
    if (y < coreTop - featherTop) {
      vy = 0;
    } else if (y < coreTop) {
      vy = (y - (coreTop - featherTop)) / featherTop; // 0 → 1
    } else if (y <= coreBottom) {
      vy = 1;
    } else if (y < coreBottom + featherBot) {
      vy = 1 - (y - coreBottom) / featherBot; // 1 → 0
    } else {
      vy = 0;
    }

    for (let x = 0; x < w; x++) {
      // horizontal factor
      let hx = 1;
      if (x < leftFade) {
        hx = x / leftFade;
      } else if (x > w - rightFade) {
        hx = (w - x) / rightFade;
      }

      // Combined alpha. Use smoothstep-ish easing on both axes for nicer
      // falloffs (cubic).
      const raw = Math.max(0, Math.min(1, vy * hx));
      const eased = raw * raw * (3 - 2 * raw);
      buf[y * w + x] = Math.round(eased * 255);
    }
  }
  return buf;
}

// ─── Pipeline ────────────────────────────────────────────────────────────

async function run() {
  await mkdir(OUT_DIR, { recursive: true });

  const manifest = {
    source: "source.jpg",
    sourceSize: { w: SRC_W, h: SRC_H },
    layers: [],
  };

  for (const L of LAYERS) {
    const outPath = path.join(OUT_DIR, `layer-${L.n}-${L.slug}.png`);

    // Extract the crop as raw RGB.
    const crop = await sharp(SRC)
      .extract({ left: L.x, top: L.y, width: L.w, height: L.h })
      .removeAlpha()
      .toColorspace("srgb")
      .raw()
      .toBuffer();

    // Build alpha mask (single-channel, same w×h).
    const alpha = buildMask(
      L.w, L.h,
      L.coreTop, L.coreBottom,
      L.featherTop, L.featherBot,
      L.leftFade, L.rightFade,
    );

    // Interleave RGB + A into RGBA raw buffer, then encode as PNG.
    const rgba = Buffer.alloc(L.w * L.h * 4);
    for (let i = 0; i < L.w * L.h; i++) {
      rgba[i * 4 + 0] = crop[i * 3 + 0];
      rgba[i * 4 + 1] = crop[i * 3 + 1];
      rgba[i * 4 + 2] = crop[i * 3 + 2];
      rgba[i * 4 + 3] = alpha[i];
    }

    await sharp(rgba, {
      raw: { width: L.w, height: L.h, channels: 4 },
    })
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    manifest.layers.push({
      n: L.n,
      slug: L.slug,
      name: L.name,
      file: `layer-${L.n}-${L.slug}.png`,
      size: { w: L.w, h: L.h },
      source: { x: L.x, y: L.y, w: L.w, h: L.h },
      core: { top: L.coreTop, bottom: L.coreBottom },
    });

    console.log(`✓ layer-${L.n}-${L.slug}.png  (${L.w}×${L.h})`);
  }

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );
  console.log(`✓ manifest.json`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
