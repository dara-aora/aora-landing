"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DesktopOnlyGate } from "@/components/DesktopOnlyGate";

/* ─────────────────────────────────────────────────────────────────────────────
 * AORA · Neural Monitor · Presentation
 *
 * A scripted, visually convincing real-time EEG dashboard. Designed around the
 * site's editorial palette (ink / paper / olive-green) rather than neon cyber.
 * All signals, scores, band-powers, HRV, and events are procedurally generated
 * from a deterministic keyframed scenario so each run tells the same story.
 * ────────────────────────────────────────────────────────────────────────── */

// ── Palette (matches globals.css) ──────────────────────────────────────────
const C = {
  ink: "#0a0a0a",
  inkRaised: "#141414",
  inkDeep: "#070707",
  paper: "#f4f2ec",
  paperDim: "#bfbdb3",
  mute: "#8a8a8a",
  muteDark: "#5a5a57",
  rule: "#1f1f1f",
  ruleSoft: "#161616",
  green: "#6e8b3d",
  greenBright: "#8fae5a",
  greenDim: "rgba(110,139,61,0.18)",
  // Derived state colors harmonized with the olive accent
  relax: "#8fae5a",       // same as green-bright
  focus: "#c9a24a",       // warm muted amber (harmonizes with olive)
  stress: "#c96a4a",      // muted terracotta (desaturated red)
};

type StateKey = "relaxation" | "concentration" | "stress";
type Scores = { relaxation: number; concentration: number; stress: number };

type Event = {
  t: number;
  kind: "info" | "change" | "warn";
  label: string;
};

// ── Scenario keyframes (seconds) ───────────────────────────────────────────
const KEY: Array<{ t: number; r: number; f: number; s: number }> = [
  { t: 0,   r: 0.60, f: 0.25, s: 0.15 },
  { t: 10,  r: 0.55, f: 0.30, s: 0.20 },
  { t: 18,  r: 0.40, f: 0.35, s: 0.35 },
  { t: 28,  r: 0.20, f: 0.35, s: 0.70 },
  { t: 45,  r: 0.10, f: 0.30, s: 0.82 },
  { t: 65,  r: 0.12, f: 0.28, s: 0.78 },
  { t: 78,  r: 0.22, f: 0.50, s: 0.55 },
  { t: 88,  r: 0.15, f: 0.35, s: 0.72 },
  { t: 98,  r: 0.18, f: 0.32, s: 0.68 },
  { t: 100, r: 0.60, f: 0.25, s: 0.15 }, // wraps to baseline
];
const SCENE_DURATION = 100;

const EVENT_SCRIPT: Event[] = [
  { t: 0.0,  kind: "info",   label: "Session initialized" },
  { t: 2.5,  kind: "info",   label: "Signal lock · CH1 · CH2" },
  { t: 10.0, kind: "change", label: "State → Relaxed" },
  { t: 19.0, kind: "warn",   label: "Beta rise detected" },
  { t: 22.0, kind: "change", label: "State → Mixed" },
  { t: 28.5, kind: "warn",   label: "High cognitive load" },
  { t: 31.0, kind: "change", label: "State → Stressed" },
  { t: 41.0, kind: "warn",   label: "Beta surge · 22.4 Hz" },
  { t: 54.0, kind: "warn",   label: "HRV decline · SDNN 28 ms" },
  { t: 68.0, kind: "warn",   label: "Sustained stress · 40 s" },
  { t: 78.5, kind: "info",   label: "Regulation attempt detected" },
  { t: 86.0, kind: "warn",   label: "Stress returning" },
  { t: 93.0, kind: "warn",   label: "Spectral edge elevated" },
];

// ── Math helpers ───────────────────────────────────────────────────────────
function smoothstep(a: number, b: number, t: number) {
  const x = Math.min(Math.max((t - a) / (b - a), 0), 1);
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Deterministic seeded RNG (mulberry32)
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tiny cheap hash-based noise so values wobble organically without state
function noise1(t: number, seed: number) {
  const x = Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

// ── Scenario evaluation ────────────────────────────────────────────────────
function getScores(sceneT: number): Scores {
  // Find surrounding keyframes
  let k0 = KEY[0], k1 = KEY[KEY.length - 1];
  for (let i = 0; i < KEY.length - 1; i++) {
    if (sceneT >= KEY[i].t && sceneT <= KEY[i + 1].t) {
      k0 = KEY[i]; k1 = KEY[i + 1];
      break;
    }
  }
  const u = smoothstep(k0.t, k1.t, sceneT);
  let r = lerp(k0.r, k1.r, u);
  let f = lerp(k0.f, k1.f, u);
  let s = lerp(k0.s, k1.s, u);

  // Organic jitter — tiny, deterministic
  r += noise1(sceneT * 0.6, 11) * 0.012;
  f += noise1(sceneT * 0.55, 22) * 0.012;
  s += noise1(sceneT * 0.65, 33) * 0.015;

  // Clamp + normalize-ish (don't force sum to 1 — feels more real)
  r = Math.max(0, Math.min(1, r));
  f = Math.max(0, Math.min(1, f));
  s = Math.max(0, Math.min(1, s));
  return { relaxation: r, concentration: f, stress: s };
}

function getDominant(sc: Scores): StateKey {
  const entries = Object.entries(sc) as [StateKey, number][];
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

function getBandPowers(sc: Scores) {
  // Delta/Theta mostly stable; Alpha dominates when relaxed; Beta/HighBeta surge with stress
  const base = 0.10;
  const delta = base + 0.05 * sc.relaxation + 0.02;
  const theta = base + 0.10 * (sc.relaxation * 0.6 + sc.concentration * 0.4);
  const alpha = 0.15 + 0.55 * sc.relaxation - 0.1 * sc.stress;
  const beta  = 0.15 + 0.55 * sc.stress + 0.20 * sc.concentration - 0.1 * sc.relaxation;
  const highBeta = 0.08 + 0.50 * sc.stress - 0.1 * sc.relaxation;
  return {
    delta: Math.max(0.02, delta),
    theta: Math.max(0.02, theta),
    alpha: Math.max(0.02, alpha),
    beta:  Math.max(0.02, beta),
    highBeta: Math.max(0.02, highBeta),
  };
}

function getHRV(sc: Scores, t: number) {
  // Resting ~58, climbs under stress up to ~92
  const bpm = 58 + sc.stress * 34 - sc.relaxation * 6 + noise1(t * 0.4, 7) * 1.5;
  // SDNN drops under stress (healthy ~60ms, stressed ~22ms)
  const sdnn = 60 - sc.stress * 38 + noise1(t * 0.3, 9) * 1.2;
  // Coherence drops under stress
  const coh = 0.82 - sc.stress * 0.48 + noise1(t * 0.25, 13) * 0.02;
  return {
    bpm: Math.max(48, Math.min(110, bpm)),
    sdnn: Math.max(18, Math.min(80, sdnn)),
    coh: Math.max(0.15, Math.min(0.98, coh)),
  };
}

function getSpectralEdge(sc: Scores, t: number) {
  // 18Hz baseline, climbs to ~28Hz under cognitive load
  return 18 + sc.stress * 10 + sc.concentration * 3 + noise1(t * 0.5, 17) * 0.3;
}

// ── Event log (build on the fly based on elapsed time) ─────────────────────
function eventsUpTo(sceneT: number, loopCount: number): Event[] {
  const out: Event[] = [];
  // Current loop events
  for (const e of EVENT_SCRIPT) {
    if (e.t <= sceneT) out.push(e);
  }
  // If we've looped, we don't rewrite — the parent keeps a persistent log.
  return out;
}

// ── Format helpers ─────────────────────────────────────────────────────────
function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const STATE_LABEL: Record<StateKey, string> = {
  relaxation: "Relaxed",
  concentration: "Focused",
  stress: "Stressed",
};
const STATE_COLOR: Record<StateKey, string> = {
  relaxation: C.relax,
  concentration: C.focus,
  stress: C.stress,
};

// ═════════════════════════════════════════════════════════════════════════
// Components
// ═════════════════════════════════════════════════════════════════════════

// ── Arc gauge ──────────────────────────────────────────────────────────────
function ArcGauge({ value, color, size = 320 }: { value: number; color: string; size?: number }) {
  const W = size;
  const H = size * 0.82;
  const cx = W / 2;
  const cy = H * 0.62;
  const R = W * 0.36;
  const start = Math.PI * 0.75;
  const total = Math.PI * 1.5;
  const fillAngle = start + total * Math.min(Math.max(value, 0), 1);
  const pt = (a: number) => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  const s = pt(start);
  const e = pt(fillAngle);
  const te = pt(start + total);
  const large = fillAngle - start > Math.PI ? 1 : 0;
  const fp = value < 0.005 ? null : `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  const tip = pt(fillAngle);

  return (
    <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <filter id="arc-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* Tick marks */}
      {Array.from({ length: 30 }).map((_, i) => {
        const a = start + (total * i) / 29;
        const r1 = R + 10;
        const r2 = R + (i % 5 === 0 ? 18 : 14);
        const x1 = cx + r1 * Math.cos(a);
        const y1 = cy + r1 * Math.sin(a);
        const x2 = cx + r2 * Math.cos(a);
        const y2 = cy + r2 * Math.sin(a);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={C.rule} strokeWidth={i % 5 === 0 ? 1 : 0.5} strokeLinecap="round" />
        );
      })}
      {/* Track */}
      <path d={`M ${s.x} ${s.y} A ${R} ${R} 0 1 1 ${te.x} ${te.y}`}
        fill="none" stroke={C.rule} strokeWidth="10" strokeLinecap="round" />
      {/* Fill */}
      {fp && (
        <path d={fp} fill="none" stroke="url(#arc-grad)" strokeWidth="10"
          strokeLinecap="round" filter="url(#arc-glow)" />
      )}
      {/* Tip dot */}
      {value > 0.01 && (
        <>
          <circle cx={tip.x} cy={tip.y} r={10} fill={color} opacity={0.15} />
          <circle cx={tip.x} cy={tip.y} r={4} fill={color} filter="url(#arc-glow)" />
        </>
      )}
    </svg>
  );
}

// ── Raw EEG scrolling canvas ───────────────────────────────────────────────
function RawEEGCanvas({
  scoresRef,
  sceneTimeRef,
  color,
  label,
  channelSeed,
}: {
  scoresRef: React.MutableRefObject<Scores>;
  sceneTimeRef: React.MutableRefObject<number>;
  color: string;
  label: string;
  channelSeed: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef({ a: Math.random() * 1000, b: Math.random() * 1000, c: Math.random() * 1000 });
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BUFFER = 1200;
    const SR = 200; // simulated samples per second
    // Initialize buffer
    if (bufRef.current.length === 0) {
      bufRef.current = new Array(BUFFER).fill(0);
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      const samplesToAdd = Math.max(1, Math.round(SR * dt));
      const sc = scoresRef.current;
      const t0 = sceneTimeRef.current;

      const alphaAmp = 0.35 + sc.relaxation * 0.8 - sc.stress * 0.15;
      const betaAmp  = 0.15 + sc.stress * 0.9 + sc.concentration * 0.25;
      const hbAmp    = 0.08 + sc.stress * 0.7;
      const noiseAmp = 0.08 + sc.stress * 0.18;

      const ph = phaseRef.current;
      const inc = (2 * Math.PI) / SR;
      for (let i = 0; i < samplesToAdd; i++) {
        ph.a += inc * 10;  // ~10Hz alpha
        ph.b += inc * 20;  // ~20Hz beta
        ph.c += inc * 24;  // ~24Hz high-beta
        let v =
          Math.sin(ph.a) * alphaAmp +
          Math.sin(ph.b) * betaAmp +
          Math.sin(ph.c) * hbAmp +
          (Math.random() - 0.5) * 2 * noiseAmp;
        // Occasional stress-driven muscle artifact
        if (sc.stress > 0.6 && Math.random() < 0.0015) {
          v += (Math.random() - 0.5) * 2.5;
        }
        // Channel-dependent amplitude shift so CH1 and CH2 look different
        v *= 1 + channelSeed * 0.15;
        bufRef.current.push(v);
        if (bufRef.current.length > BUFFER) bufRef.current.shift();
      }

      // Render
      const rect = canvas.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      // Background
      ctx.fillStyle = C.inkDeep;
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = C.ruleSoft;
      ctx.lineWidth = 1;
      for (let gy = 0; gy < 4; gy++) {
        const y = (h / 4) * gy + h / 8;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center reference
      ctx.strokeStyle = "rgba(110,139,61,0.10)";
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Waveform
      const buf = bufRef.current;
      const N = buf.length;
      const step = w / (N - 1);
      const scale = h * 0.32;
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = i * step;
        const y = h / 2 - buf[i] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [scoresRef, sceneTimeRef, color, channelSeed]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", borderRadius: 4 }} />
      <div style={{
        position: "absolute", top: 8, left: 10, fontFamily: "var(--font-mono)",
        fontSize: 9, letterSpacing: "0.15em", color: C.muteDark, textTransform: "uppercase",
      }}>{label}</div>
      <div style={{
        position: "absolute", top: 8, right: 10, fontFamily: "var(--font-mono)",
        fontSize: 9, letterSpacing: "0.1em", color: C.muteDark,
      }}>200 Hz</div>
    </div>
  );
}

// ── Stacked probability area chart ─────────────────────────────────────────
function StackedProbability({ history }: { history: { t: number; r: number; f: number; s: number }[] }) {
  const W = 800, H = 160;
  if (history.length < 2) {
    return <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" />;
  }
  const xs = (i: number) => (i / (history.length - 1)) * W;
  // Stacked: bottom stress, middle focus, top relaxation (arbitrary — colors carry meaning)
  const stressPts: string[] = [];
  const focusPts: string[] = [];
  const relaxPts: string[] = [];
  const baselinePts: string[] = [];
  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    const total = Math.max(0.001, h.r + h.f + h.s);
    const sPct = h.s / total;
    const fPct = h.f / total;
    const rPct = h.r / total;
    const x = xs(i);
    const y0 = H;
    const y1 = H - sPct * H;
    const y2 = y1 - fPct * H;
    const y3 = y2 - rPct * H;
    stressPts.push(`${x},${y1}`);
    focusPts.push(`${x},${y2}`);
    relaxPts.push(`${x},${y3}`);
    baselinePts.push(`${x},${y0}`);
  }
  // Build polygon paths (closed)
  const polyStress = `${stressPts.join(" ")} ${baselinePts.slice().reverse().join(" ")}`;
  const polyFocus  = `${focusPts.join(" ")} ${stressPts.slice().reverse().join(" ")}`;
  const polyRelax  = `${relaxPts.join(" ")} ${focusPts.slice().reverse().join(" ")}`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="g-relax" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.relax} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.relax} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="g-focus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.focus} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.focus} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="g-stress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.stress} stopOpacity="0.75" />
          <stop offset="100%" stopColor={C.stress} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Horizontal grid */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line key={p} x1={0} x2={W} y1={H * p} y2={H * p} stroke={C.ruleSoft} strokeDasharray="2 6" />
      ))}
      <polygon points={polyStress} fill="url(#g-stress)" />
      <polygon points={polyFocus}  fill="url(#g-focus)" />
      <polygon points={polyRelax}  fill="url(#g-relax)" />
      {/* top boundary strokes */}
      <polyline points={stressPts.join(" ")} fill="none" stroke={C.stress} strokeWidth={1.2} opacity={0.8} />
      <polyline points={focusPts.join(" ")}  fill="none" stroke={C.focus}  strokeWidth={1.2} opacity={0.8} />
      <polyline points={relaxPts.join(" ")}  fill="none" stroke={C.relax}  strokeWidth={1.2} opacity={0.85} />
    </svg>
  );
}

// ── Mini sparkline ─────────────────────────────────────────────────────────
function Spark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <svg width="100%" height={36} />;
  const W = 200, H = 36;
  const max = Math.max(...data, 0.01);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 0.001);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`).join(" ");
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" opacity={0.9} />
      <circle cx={W} cy={H - ((data[data.length - 1] - min) / range) * (H - 4) - 2} r={2.2} fill={color} />
    </svg>
  );
}

// ── Simple "panel" wrapper ─────────────────────────────────────────────────
function Panel({
  children,
  title,
  subtitle,
  style,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: C.inkRaised,
      border: `1px solid ${C.rule}`,
      borderRadius: 6,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      ...style,
    }}>
      {(title || subtitle) && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.ruleSoft}`,
        }}>
          {title && (
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em",
              textTransform: "uppercase", color: C.mute, fontWeight: 500,
            }}>{title}</div>
          )}
          {subtitle && (
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: C.muteDark,
              letterSpacing: "0.08em",
            }}>{subtitle}</div>
          )}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

// ── Numeric display (tabular, Fraunces serif for a "news" look) ───────────
function BigNumber({ value, unit, color }: { value: string; unit?: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{
        fontFamily: "var(--font-display)",
        fontSize: 44,
        fontWeight: 400,
        letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
        color: color || C.paper,
        lineHeight: 1,
      }}>
        {value}
      </span>
      {unit && (
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, color: C.mute,
          letterSpacing: "0.08em",
        }}>{unit}</span>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Main page
// ═════════════════════════════════════════════════════════════════════════
export default function PresentationPage() {
  return (
    <DesktopOnlyGate
      title="Open on desktop"
      body="The Aora neural monitor demo is designed for a larger screen. Please open this page on a desktop or laptop browser."
    >
      <PresentationPageInner />
    </DesktopOnlyGate>
  );
}

function PresentationPageInner() {
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);    // real monotonic elapsed
  const [sceneT, setSceneT] = useState(0);      // scene time (loops)
  const [loopCount, setLoopCount] = useState(0);
  const [scores, setScores] = useState<Scores>({ relaxation: 0.60, concentration: 0.25, stress: 0.15 });
  const [bands, setBands] = useState({ delta: 0.12, theta: 0.18, alpha: 0.55, beta: 0.22, highBeta: 0.12 });
  const [hrv, setHRV] = useState({ bpm: 58, sdnn: 60, coh: 0.82 });
  const [sef, setSEF] = useState(18);
  const [history, setHistory] = useState<{ t: number; r: number; f: number; s: number }[]>([]);
  const [alphaBetaHist, setAlphaBetaHist] = useState<number[]>([]);
  const [thetaAlphaHist, setThetaAlphaHist] = useState<number[]>([]);
  const [events, setEvents] = useState<{ id: string; t: number; elapsedAt: number; kind: Event["kind"]; label: string }[]>([]);
  const [stateHolding, setStateHolding] = useState(0);
  const [currentState, setCurrentState] = useState<StateKey>("relaxation");
  const [ch1Quality, setCh1Quality] = useState(true);
  const [ch2Quality, setCh2Quality] = useState(true);
  const [confidence, setConfidence] = useState(0.88);

  // Refs for canvas access
  const scoresRef = useRef<Scores>(scores);
  const sceneTRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastStateRef = useRef<StateKey>("relaxation");
  const lastStateChangeRef = useRef<number>(0);
  const lastLoopRef = useRef<number>(0);
  const seenEventsRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);

  useEffect(() => { scoresRef.current = scores; }, [scores]);

  // Start the scene
  const handleStart = useCallback(() => {
    startTimeRef.current = performance.now();
    lastLoopRef.current = 0;
    seenEventsRef.current = new Set();
    setEvents([]);
    setHistory([]);
    setAlphaBetaHist([]);
    setThetaAlphaHist([]);
    setLoopCount(0);
    setStarted(true);
  }, []);

  const handleRestart = useCallback(() => {
    startTimeRef.current = performance.now();
    lastLoopRef.current = 0;
    seenEventsRef.current = new Set();
    setEvents([]);
    setHistory([]);
    setAlphaBetaHist([]);
    setThetaAlphaHist([]);
    setLoopCount(0);
  }, []);

  // Main animation loop
  useEffect(() => {
    if (!started) return;

    let lastHistoryPush = 0;
    let lastUiTick = 0;
    let lastQualityCheck = 0;

    const tick = (now: number) => {
      const elapsedSec = (now - startTimeRef.current) / 1000;
      const loop = Math.floor(elapsedSec / SCENE_DURATION);
      const localT = elapsedSec % SCENE_DURATION;
      sceneTRef.current = localT;

      // Compute scores + derived
      const sc = getScores(localT);
      scoresRef.current = sc;

      if (loop !== lastLoopRef.current) {
        lastLoopRef.current = loop;
        setLoopCount(loop);
        // Clear scripted event dedupe so events fire again each loop
        seenEventsRef.current = new Set();
      }

      // UI updates at ~15Hz to limit React churn
      if (now - lastUiTick > 66) {
        lastUiTick = now;
        setScores(sc);
        setBands(getBandPowers(sc));
        setHRV(getHRV(sc, elapsedSec));
        setSEF(getSpectralEdge(sc, elapsedSec));
        setElapsed(elapsedSec);
        setSceneT(localT);

        // Dominant state + holding time
        const dom = getDominant(sc);
        if (dom !== lastStateRef.current) {
          lastStateRef.current = dom;
          lastStateChangeRef.current = elapsedSec;
          setCurrentState(dom);
        }
        setStateHolding(elapsedSec - lastStateChangeRef.current);

        // Confidence wobbles around dominant score
        const domScore = sc[dom];
        const sorted = Object.values(sc).sort((a, b) => b - a);
        const margin = sorted[0] - sorted[1];
        setConfidence(Math.max(0.35, Math.min(0.98, 0.55 + margin * 1.4 + noise1(elapsedSec * 0.3, 41) * 0.02)));
      }

      // History push at 10Hz
      if (now - lastHistoryPush > 100) {
        lastHistoryPush = now;
        setHistory((prev) => {
          const next = [...prev, { t: elapsedSec, r: sc.relaxation, f: sc.concentration, s: sc.stress }];
          if (next.length > 600) next.shift(); // ~60s @ 10Hz
          return next;
        });
        setAlphaBetaHist((prev) => {
          const bp = getBandPowers(sc);
          const v = bp.alpha / (bp.beta + 0.001);
          const next = [...prev, v];
          if (next.length > 80) next.shift();
          return next;
        });
        setThetaAlphaHist((prev) => {
          const bp = getBandPowers(sc);
          const v = bp.theta / (bp.alpha + 0.001);
          const next = [...prev, v];
          if (next.length > 80) next.shift();
          return next;
        });
      }

      // Events: fire any scripted events whose time we've crossed this loop
      for (const e of EVENT_SCRIPT) {
        const key = `${loop}-${e.t}`;
        if (e.t <= localT && !seenEventsRef.current.has(key)) {
          seenEventsRef.current.add(key);
          setEvents((prev) => {
            const next = [...prev, {
              id: `${key}-${Math.random().toString(36).slice(2, 8)}`,
              t: e.t,
              elapsedAt: elapsedSec,
              kind: e.kind,
              label: e.label,
            }];
            if (next.length > 40) next.shift();
            return next;
          });
        }
      }

      // Occasional impedance flicker on one channel
      if (now - lastQualityCheck > 800) {
        lastQualityCheck = now;
        if (Math.random() < 0.06) {
          if (Math.random() < 0.5) {
            setCh1Quality(false);
            setTimeout(() => setCh1Quality(true), 400);
          } else {
            setCh2Quality(false);
            setTimeout(() => setCh2Quality(true), 400);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [started]);

  const domColor = STATE_COLOR[currentState];
  const domLabel = STATE_LABEL[currentState];

  // ── Landing overlay ─────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: C.ink,
      color: C.paper,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient grain / grid background */}
      <div aria-hidden style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: `
          linear-gradient(${C.ruleSoft} 1px, transparent 1px),
          linear-gradient(90deg, ${C.ruleSoft} 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
        opacity: 0.35,
        maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
      }} />

      {/* ── Dashboard ── */}
      <Dashboard
        started={started}
        elapsed={elapsed}
        sceneT={sceneT}
        loopCount={loopCount}
        scores={scores}
        bands={bands}
        hrv={hrv}
        sef={sef}
        history={history}
        alphaBetaHist={alphaBetaHist}
        thetaAlphaHist={thetaAlphaHist}
        events={events}
        stateHolding={stateHolding}
        currentState={currentState}
        domColor={domColor}
        domLabel={domLabel}
        ch1Quality={ch1Quality}
        ch2Quality={ch2Quality}
        confidence={confidence}
        scoresRef={scoresRef}
        sceneTRef={sceneTRef}
        onRestart={handleRestart}
      />

      {/* ── Landing overlay ── */}
      {!started && <LandingOverlay onStart={handleStart} />}

      {/* Global CSS for this page */}
      <style jsx global>{`
        @keyframes aora-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.88); }
        }
        @keyframes aora-ripple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes aora-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes aora-slidein {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes aora-overlay-out {
          from { opacity: 1; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
          to { opacity: 0; backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }
        }
        .aora-event-row {
          animation: aora-slidein 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .aora-start-btn:hover {
          background: ${C.greenBright} !important;
          transform: translateY(-1px);
        }
        .aora-start-btn {
          transition: background 0.3s, transform 0.2s;
        }
      `}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Dashboard layout
// ═════════════════════════════════════════════════════════════════════════
function Dashboard(props: {
  started: boolean;
  elapsed: number;
  sceneT: number;
  loopCount: number;
  scores: Scores;
  bands: { delta: number; theta: number; alpha: number; beta: number; highBeta: number };
  hrv: { bpm: number; sdnn: number; coh: number };
  sef: number;
  history: { t: number; r: number; f: number; s: number }[];
  alphaBetaHist: number[];
  thetaAlphaHist: number[];
  events: { id: string; t: number; elapsedAt: number; kind: Event["kind"]; label: string }[];
  stateHolding: number;
  currentState: StateKey;
  domColor: string;
  domLabel: string;
  ch1Quality: boolean;
  ch2Quality: boolean;
  confidence: number;
  scoresRef: React.MutableRefObject<Scores>;
  sceneTRef: React.MutableRefObject<number>;
  onRestart: () => void;
}) {
  const {
    started, elapsed, scores, bands, hrv, sef, history,
    alphaBetaHist, thetaAlphaHist, events, stateHolding,
    currentState, domColor, domLabel, ch1Quality, ch2Quality, confidence,
    scoresRef, sceneTRef, onRestart,
  } = props;

  const domScore = scores[currentState];

  return (
    <div style={{
      position: "relative",
      maxWidth: 1440,
      margin: "0 auto",
      padding: "28px 32px 40px",
      zIndex: 1,
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingBottom: 20, marginBottom: 24, borderBottom: `1px solid ${C.rule}`,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400,
            letterSpacing: "-0.02em", color: C.paper,
          }}>
            Aora
          </div>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.18em",
            textTransform: "uppercase", color: C.mute, fontWeight: 500,
          }}>
            Neural Monitor · Live
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <StatItem label="SR" value="200 Hz" />
          <StatItem label="CH" value="2 / 2" />
          <StatItem label="Uptime" value={fmtTime(elapsed)} mono />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              display: "inline-block", width: 7, height: 7, borderRadius: "50%",
              background: C.greenBright,
              boxShadow: `0 0 8px ${C.greenBright}99`,
              animation: "aora-pulse 1.6s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em",
              textTransform: "uppercase", color: C.greenBright, fontWeight: 500,
            }}>Streaming</span>
          </div>
        </div>
      </div>

      {/* ── Row 1: Arc + Dominant + BandPower ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(320px, 1.2fr) minmax(280px, 1fr) minmax(280px, 1.2fr)",
        gap: 20, marginBottom: 20,
      }}>
        {/* Arc */}
        <Panel title="Dominant Probability" subtitle={`${Math.round(domScore * 100)}%`}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "relative" }}>
              {/* Soft radial glow behind */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: `radial-gradient(circle at 50% 55%, ${domColor}22 0%, transparent 60%)`,
                filter: "blur(12px)", pointerEvents: "none",
              }} />
              <ArcGauge value={domScore} color={domColor} size={300} />
              <div style={{
                position: "absolute", top: "52%", left: "50%",
                transform: "translate(-50%, -50%)", textAlign: "center",
              }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 54, fontWeight: 400,
                  letterSpacing: "-0.03em", color: domColor, lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  textShadow: `0 0 24px ${domColor}55`,
                  transition: "color 0.8s ease",
                }}>
                  {Math.round(domScore * 100)}
                </div>
                <div style={{
                  fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.25em",
                  textTransform: "uppercase", color: C.mute, marginTop: 6,
                }}>
                  Probability
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Dominant state card */}
        <Panel title="Current State" subtitle={`Confidence ${Math.round(confidence * 100)}%`}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 400,
                letterSpacing: "-0.02em", color: domColor, lineHeight: 1.05,
                transition: "color 0.8s",
              }}>
                {domLabel}
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: C.mute, marginTop: 8, letterSpacing: "0.02em" }}>
                holding for <span style={{ color: C.paper, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{fmtTime(stateHolding)}</span>
              </div>
            </div>

            {/* Score rows */}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {(["relaxation", "concentration", "stress"] as StateKey[]).map((k) => (
                <StateRow key={k} label={STATE_LABEL[k]} value={scores[k]} color={STATE_COLOR[k]} active={k === currentState} />
              ))}
            </div>
          </div>
        </Panel>

        {/* Band power */}
        <Panel title="Band Power" subtitle="µV² · relative">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
            <BandRow name="Delta"     range="1 – 4 Hz"   value={bands.delta}    color={C.mute} />
            <BandRow name="Theta"     range="4 – 8 Hz"   value={bands.theta}    color={C.paperDim} />
            <BandRow name="Alpha"     range="8 – 13 Hz"  value={bands.alpha}    color={C.relax} highlight={currentState === "relaxation"} />
            <BandRow name="Beta"      range="13 – 30 Hz" value={bands.beta}     color={C.stress} highlight={currentState === "stress"} />
            <BandRow name="High-Beta" range="20 – 30 Hz" value={bands.highBeta} color={C.stress} />
          </div>
        </Panel>
      </div>

      {/* ── Row 2: State probability timeline ── */}
      <div style={{ marginBottom: 20 }}>
        <Panel title="State Probability" subtitle="last 60 s">
          <div style={{ flex: 1, minHeight: 180 }}>
            <StackedProbability history={history} />
            <div style={{
              display: "flex", gap: 24, marginTop: 10,
              fontFamily: "var(--font-mono)", fontSize: 10, color: C.mute,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              <LegendSwatch color={C.relax}  label="Relaxed" />
              <LegendSwatch color={C.focus}  label="Focused" />
              <LegendSwatch color={C.stress} label="Stressed" />
              <div style={{ flex: 1 }} />
              <span>— 60 s</span>
              <span>now</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Row 3: Raw EEG + Events ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(480px, 1.65fr) minmax(300px, 1fr)",
        gap: 20, marginBottom: 20,
      }}>
        <Panel title="Raw EEG" subtitle="2 channels · bandpass 1–40 Hz">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minHeight: 260 }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <RawEEGCanvas
                scoresRef={scoresRef}
                sceneTimeRef={sceneTRef}
                color={C.greenBright}
                label="CH1 · T8"
                channelSeed={0}
              />
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <RawEEGCanvas
                scoresRef={scoresRef}
                sceneTimeRef={sceneTRef}
                color={C.paperDim}
                label="CH2 · Mastoid"
                channelSeed={1}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Events" subtitle={`${events.length}`}>
          <div style={{
            flex: 1, overflowY: "auto", minHeight: 260, maxHeight: 300,
            display: "flex", flexDirection: "column", gap: 0,
          }}>
            {events.length === 0 && (
              <div style={{ fontSize: 11, color: C.muteDark, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                awaiting signal…
              </div>
            )}
            {events.slice().reverse().map((e) => (
              <div key={e.id} className="aora-event-row" style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 0",
                borderBottom: `1px solid ${C.ruleSoft}`,
                borderLeft: `2px solid ${eventColor(e.kind)}`,
                paddingLeft: 10,
              }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 10, color: C.mute,
                  letterSpacing: "0.05em", minWidth: 44, fontVariantNumeric: "tabular-nums",
                }}>
                  {fmtTime(e.elapsedAt)}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 9, color: eventColor(e.kind),
                  letterSpacing: "0.18em", textTransform: "uppercase", minWidth: 48,
                }}>
                  {e.kind === "warn" ? "Alert" : e.kind === "change" ? "State" : "Info"}
                </span>
                <span style={{
                  fontFamily: "var(--font-sans)", fontSize: 12, color: C.paper,
                  letterSpacing: "0.01em",
                }}>
                  {e.label}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Row 4: HRV, metrics, sparklines, signal quality ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 20,
      }}>
        <Panel title="Heart-rate Variability" subtitle="derived">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14 }}>
            <div>
              <BigNumber value={Math.round(hrv.bpm).toString()} unit="bpm" color={hrv.bpm > 80 ? C.stress : C.paper} />
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: C.mute, letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase" }}>
                heart rate {hrv.bpm > 80 ? "· elevated" : "· resting"}
              </div>
            </div>
            <MetricRow label="SDNN" value={`${hrv.sdnn.toFixed(0)} ms`} hint={hrv.sdnn < 30 ? "low" : "healthy"} flag={hrv.sdnn < 30} />
            <MetricRow label="Coherence" value={hrv.coh.toFixed(2)} hint={hrv.coh < 0.45 ? "poor" : "good"} flag={hrv.coh < 0.45} />
          </div>
        </Panel>

        <Panel title="Alpha / Beta" subtitle="ratio · relaxation index">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <BigNumber value={(bands.alpha / (bands.beta + 0.001)).toFixed(2)} color={C.relax} />
            <div style={{ margin: "10px 0" }}>
              <Spark data={alphaBetaHist} color={C.relax} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: C.mute, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              higher = more relaxed
            </div>
          </div>
        </Panel>

        <Panel title="Theta / Alpha" subtitle="focus index">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <BigNumber value={(bands.theta / (bands.alpha + 0.001)).toFixed(2)} color={C.focus} />
            <div style={{ margin: "10px 0" }}>
              <Spark data={thetaAlphaHist} color={C.focus} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: C.mute, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              elevated under concentration
            </div>
          </div>
        </Panel>

        <Panel title="Signal Integrity" subtitle={`SEF₉₅ ${sef.toFixed(1)} Hz`}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, justifyContent: "space-between" }}>
            <ChannelRow label="CH1 · T8" ok={ch1Quality} />
            <ChannelRow label="CH2 · Mastoid" ok={ch2Quality} />
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: C.mute, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                Spectral Edge
              </div>
              <div style={{ height: 4, background: C.rule, borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(100, ((sef - 15) / 15) * 100)}%`,
                  height: "100%",
                  background: sef > 24 ? C.stress : C.greenBright,
                  transition: "width 0.4s, background 0.4s",
                }} />
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: sef > 24 ? C.stress : C.mute, marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {sef > 24 ? "elevated · cognitive load" : "nominal"}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Bottom: subtle controls ── */}
      {started && (
        <div style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 10,
          display: "flex", gap: 10,
        }}>
          <button onClick={onRestart} style={{
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "10px 16px", borderRadius: 4,
            background: C.inkRaised, border: `1px solid ${C.rule}`, color: C.mute,
            cursor: "pointer", transition: "color 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = C.paper;
            e.currentTarget.style.borderColor = C.mute;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = C.mute;
            e.currentTarget.style.borderColor = C.rule;
          }}>
            ↻ Restart
          </button>
        </div>
      )}
    </div>
  );
}

function eventColor(kind: Event["kind"]) {
  if (kind === "warn") return C.stress;
  if (kind === "change") return C.focus;
  return C.greenBright;
}

// ── Top bar stat ───────────────────────────────────────────────────────────
function StatItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
      <span style={{
        fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.2em",
        textTransform: "uppercase", color: C.muteDark, fontWeight: 500,
      }}>{label}</span>
      <span style={{
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: 13, color: C.paper, fontVariantNumeric: "tabular-nums", letterSpacing: mono ? "0.04em" : 0,
      }}>{value}</span>
    </div>
  );
}

// ── State row (inside Current State panel) ─────────────────────────────────
function StateRow({ label, value, color, active }: { label: string; value: number; color: string; active: boolean }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{
          fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.1em",
          textTransform: "uppercase", color: active ? color : C.mute,
          fontWeight: active ? 500 : 400, transition: "color 0.4s",
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11,
          color: active ? color : C.paperDim, fontVariantNumeric: "tabular-nums",
          transition: "color 0.4s",
        }}>
          {Math.round(value * 100)}%
        </span>
      </div>
      <div style={{ height: 3, background: C.rule, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${value * 100}%`, background: color,
          transition: "width 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: active ? `0 0 6px ${color}88` : "none",
        }} />
      </div>
    </div>
  );
}

// ── Band row ───────────────────────────────────────────────────────────────
function BandRow({ name, range, value, color, highlight }: {
  name: string; range: string; value: number; color: string; highlight?: boolean;
}) {
  const v = Math.min(1, value);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            fontFamily: "var(--font-sans)", fontSize: 12,
            color: highlight ? color : C.paper, letterSpacing: "0.02em",
            fontWeight: highlight ? 500 : 400, transition: "color 0.4s",
          }}>
            {name}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 9, color: C.muteDark, letterSpacing: "0.05em",
          }}>
            {range}
          </span>
        </div>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10, color: highlight ? color : C.paperDim,
          fontVariantNumeric: "tabular-nums", transition: "color 0.4s",
        }}>
          {v.toFixed(2)}
        </span>
      </div>
      <div style={{ height: 4, background: C.rule, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${v * 100}%`, background: color,
          transition: "width 0.4s cubic-bezier(0.22, 1, 0.36, 1), background 0.4s",
          boxShadow: highlight ? `0 0 8px ${color}88` : "none",
        }} />
      </div>
    </div>
  );
}

// ── Metric row (HRV panel) ─────────────────────────────────────────────────
function MetricRow({ label, value, hint, flag }: { label: string; value: string; hint: string; flag: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: C.mute, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 13, color: flag ? C.stress : C.paper,
          fontVariantNumeric: "tabular-nums", transition: "color 0.4s",
        }}>
          {value}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: flag ? C.stress : C.greenBright,
          letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.4s",
        }}>
          {hint}
        </span>
      </div>
    </div>
  );
}

// ── Channel row (signal quality panel) ─────────────────────────────────────
function ChannelRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: C.paper, letterSpacing: "0.02em" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          display: "inline-block", width: 7, height: 7, borderRadius: "50%",
          background: ok ? C.greenBright : C.focus,
          boxShadow: ok ? `0 0 6px ${C.greenBright}99` : `0 0 6px ${C.focus}99`,
          transition: "background 0.3s, box-shadow 0.3s",
        }} />
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em",
          textTransform: "uppercase", color: ok ? C.greenBright : C.focus, transition: "color 0.3s",
        }}>
          {ok ? "Nominal" : "Flicker"}
        </span>
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-block", width: 10, height: 2, background: color, borderRadius: 1 }} />
      <span>{label}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Landing overlay (blurred dashboard behind, START button in front)
// ═════════════════════════════════════════════════════════════════════════
function LandingOverlay({ onStart }: { onStart: () => void }) {
  const [leaving, setLeaving] = useState(false);

  const handleClick = () => {
    setLeaving(true);
    setTimeout(onStart, 500);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(10,10,10,0.55)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: leaving ? "aora-overlay-out 0.5s ease forwards" : "none",
      pointerEvents: leaving ? "none" : "auto",
    }}>
      <div style={{
        maxWidth: 540, padding: "48px 56px",
        background: "rgba(20,20,20,0.75)",
        border: `1px solid ${C.rule}`,
        borderRadius: 8,
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.3em",
          textTransform: "uppercase", color: C.mute, marginBottom: 14, fontWeight: 500,
        }}>
          Aora · Neural Monitor
        </div>

        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 40, fontWeight: 300,
          letterSpacing: "-0.025em",
          lineHeight: 1.1, color: C.paper,
          marginBottom: 16,
        }}>
          See what the brain<br />
          <span style={{ fontStyle: "italic", color: C.greenBright }}>actually does</span> under pressure.
        </div>

        <div style={{
          fontFamily: "var(--font-sans)", fontSize: 14, color: C.paperDim,
          lineHeight: 1.55, maxWidth: 400, margin: "0 auto 32px",
        }}>
          Real-time EEG · HRV · band power · state probability.
          A live view into cognitive load as it unfolds.
        </div>

        <button
          className="aora-start-btn"
          onClick={handleClick}
          style={{
            fontFamily: "var(--font-sans)", fontSize: 12,
            letterSpacing: "0.25em", textTransform: "uppercase",
            fontWeight: 500,
            padding: "16px 40px",
            background: C.green,
            color: C.ink,
            border: "none", borderRadius: 4,
            cursor: "pointer",
            boxShadow: `0 0 24px ${C.green}55`,
          }}
        >
          ▶  Start Session
        </button>
      </div>
    </div>
  );
}
