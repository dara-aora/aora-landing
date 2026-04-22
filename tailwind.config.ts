import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        "ink-raised": "var(--ink-raised)",
        paper: "var(--paper)",
        mute: "var(--mute)",
        rule: "var(--rule)",
        green: "var(--green)",
        "green-bright": "var(--green-bright)",
        "green-tint": "var(--green-tint)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.035em",
        caps: "0.1em",
      },
      maxWidth: {
        content: "1200px",
        section: "960px",
        prose: "720px",
      },
      transitionTimingFunction: {
        "out-smooth": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
