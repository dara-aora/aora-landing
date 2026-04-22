/**
 * Short, URL-safe result id generator.
 *
 * Uses crypto.getRandomValues when available (browser / modern Node),
 * falls back to Math.random for older environments. 10 base36 chars ≈
 * ~52 bits of entropy — enough to avoid collisions within a single user's
 * localStorage namespace.
 */
export function generateResultId(len = 10): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  let out = "";

  try {
    const buf = new Uint8Array(len);
    // globalThis.crypto is available in the browser and in Node 18+
    const c =
      (typeof globalThis !== "undefined" && globalThis.crypto) ||
      undefined;
    if (c && typeof c.getRandomValues === "function") {
      c.getRandomValues(buf);
      for (let i = 0; i < len; i++) {
        out += alphabet[buf[i] % alphabet.length];
      }
      return out;
    }
  } catch {
    // fall through
  }

  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
