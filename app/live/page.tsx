"use client";

import { useEffect, useRef, useState } from "react";
import { useEEG } from "@/lib/eeg/useEEG";
import type { StateKey, Scores } from "@/lib/eeg/types";
import { DesktopOnlyGate } from "@/components/DesktopOnlyGate";

/* ─────────────────────────────────────────────────────────────────────────────
 * AORA · Neural Monitor · Live
 *
 * Same dashboard visuals as /presentation, but data comes from a real
 * Muse or OpenBCI Ganglion headset over Web Bluetooth + a Web Worker-based
 * DSP/classifier pipeline. Gated behind a pairing step and one-time
 * per-device calibration.
 * ────────────────────────────────────────────────────────────────────────── */

// ── Palette (matches /presentation) ────────────────────────────────────────
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
  relax: "#8fae5a",
  focus: "#c9a24a",
  stress: "#c96a4a",
};

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

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ═════════════════════════════════════════════════════════════════════════
// Shared visual components (same shape as /presentation)
// ═════════════════════════════════════════════════════════════════════════

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
        <filter id="live-arc-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="live-arc-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
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
      <path d={`M ${s.x} ${s.y} A ${R} ${R} 0 1 1 ${te.x} ${te.y}`}
        fill="none" stroke={C.rule} strokeWidth="10" strokeLinecap="round" />
      {fp && (
        <path d={fp} fill="none" stroke="url(#live-arc-grad)" strokeWidth="10"
          strokeLinecap="round" filter="url(#live-arc-glow)" />
      )}
      {value > 0.01 && (
        <>
          <circle cx={tip.x} cy={tip.y} r={10} fill={color} opacity={0.15} />
          <circle cx={tip.x} cy={tip.y} r={4} fill={color} filter="url(#live-arc-glow)" />
        </>
      )}
    </svg>
  );
}

// Raw EEG canvas — reads from ring buffer fed by the device driver
function RawEEGCanvas({
  readBuffer,
  channelIdx,
  color,
  label,
  sampleRate,
}: {
  readBuffer: (channelIdx: number, out: Float32Array) => number;
  channelIdx: number;
  color: string;
  label: string;
  sampleRate: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchRef = useRef<Float32Array>(new Float32Array(1500));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    const draw = () => {
      const scratch = scratchRef.current;
      const n = readBuffer(channelIdx, scratch);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      ctx.fillStyle = C.inkDeep;
      ctx.fillRect(0, 0, w, h);

      // Gridlines
      ctx.strokeStyle = C.ruleSoft;
      ctx.lineWidth = 1;
      for (let gy = 0; gy < 4; gy++) {
        const y = (h / 4) * gy + h / 8;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(110,139,61,0.10)";
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (n > 1) {
        // Find adaptive scale from recent peak-to-peak
        let maxAbs = 1;
        for (let i = 0; i < n; i++) {
          const v = Math.abs(scratch[i]);
          if (v > maxAbs) maxAbs = v;
        }
        const scale = (h * 0.38) / (maxAbs + 1e-6);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const step = w / (n - 1);
        for (let i = 0; i < n; i++) {
          const x = i * step;
          const y = h / 2 - scratch[i] * scale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [readBuffer, channelIdx, color]);

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
      }}>{sampleRate} Hz</div>
    </div>
  );
}

function StackedProbability({ history }: { history: { t: number; r: number; f: number; s: number }[] }) {
  const W = 800, H = 160;
  if (history.length < 2) {
    return <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" />;
  }
  const xs = (i: number) => (i / (history.length - 1)) * W;
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
  const polyStress = `${stressPts.join(" ")} ${baselinePts.slice().reverse().join(" ")}`;
  const polyFocus  = `${focusPts.join(" ")} ${stressPts.slice().reverse().join(" ")}`;
  const polyRelax  = `${relaxPts.join(" ")} ${focusPts.slice().reverse().join(" ")}`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="live-g-relax" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.relax} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.relax} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="live-g-focus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.focus} stopOpacity="0.7" />
          <stop offset="100%" stopColor={C.focus} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="live-g-stress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.stress} stopOpacity="0.75" />
          <stop offset="100%" stopColor={C.stress} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((p) => (
        <line key={p} x1={0} x2={W} y1={H * p} y2={H * p} stroke={C.ruleSoft} strokeDasharray="2 6" />
      ))}
      <polygon points={polyStress} fill="url(#live-g-stress)" />
      <polygon points={polyFocus}  fill="url(#live-g-focus)" />
      <polygon points={polyRelax}  fill="url(#live-g-relax)" />
      <polyline points={stressPts.join(" ")} fill="none" stroke={C.stress} strokeWidth={1.2} opacity={0.8} />
      <polyline points={focusPts.join(" ")}  fill="none" stroke={C.focus}  strokeWidth={1.2} opacity={0.8} />
      <polyline points={relaxPts.join(" ")}  fill="none" stroke={C.relax}  strokeWidth={1.2} opacity={0.85} />
    </svg>
  );
}

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

function Panel({ children, title, subtitle, style }: {
  children: React.ReactNode; title?: string; subtitle?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: C.inkRaised, border: `1px solid ${C.rule}`, borderRadius: 6,
      padding: 20, display: "flex", flexDirection: "column", minHeight: 0, ...style,
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
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

function BigNumber({ value, unit, color }: { value: string; unit?: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{
        fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 400,
        letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums",
        color: color || C.paper, lineHeight: 1,
      }}>{value}</span>
      {unit && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: C.mute, letterSpacing: "0.08em" }}>
          {unit}
        </span>
      )}
    </div>
  );
}

function StatItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
      <span style={{
        fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.2em",
        textTransform: "uppercase", color: C.muteDark, fontWeight: 500,
      }}>{label}</span>
      <span style={{
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: 13, color: C.paper, fontVariantNumeric: "tabular-nums",
        letterSpacing: mono ? "0.04em" : 0,
      }}>{value}</span>
    </div>
  );
}

function StateRow({ label, value, color, active }: { label: string; value: number; color: string; active: boolean }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{
          fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.1em",
          textTransform: "uppercase", color: active ? color : C.mute,
          fontWeight: active ? 500 : 400, transition: "color 0.4s",
        }}>{label}</span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11,
          color: active ? color : C.paperDim, fontVariantNumeric: "tabular-nums",
          transition: "color 0.4s",
        }}>{Math.round(value * 100)}%</span>
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

function BandRow({ name, range, value, color, highlight }: {
  name: string; range: string; value: number; color: string; highlight?: boolean;
}) {
  // Normalize band power for display (µV² range is hardware-dependent)
  const v = Math.min(1, value / 50); // rough visualization scale
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            fontFamily: "var(--font-sans)", fontSize: 12,
            color: highlight ? color : C.paper, letterSpacing: "0.02em",
            fontWeight: highlight ? 500 : 400, transition: "color 0.4s",
          }}>{name}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: C.muteDark, letterSpacing: "0.05em" }}>
            {range}
          </span>
        </div>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: highlight ? color : C.paperDim, fontVariantNumeric: "tabular-nums",
          transition: "color 0.4s",
        }}>{value.toFixed(2)}</span>
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

function ChannelRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: C.paper, letterSpacing: "0.02em" }}>{label}</span>
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
        }}>{ok ? "Nominal" : "Flicker"}</span>
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
// Main page
// ═════════════════════════════════════════════════════════════════════════
export default function LivePage() {
  return (
    <DesktopOnlyGate
      title="Open on desktop"
      body="The Aora live monitor pairs with a Muse or OpenBCI headset and is designed for a larger screen. Please open this page on a desktop or laptop browser."
    >
      <LivePageInner />
    </DesktopOnlyGate>
  );
}

function LivePageInner() {
  const eeg = useEEG();
  const [selectedDriver, setSelectedDriver] = useState<"muse" | "ganglion">("muse");
  const [showSettings, setShowSettings] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const [uptime, setUptime] = useState(0);
  const [history, setHistory] = useState<{ t: number; r: number; f: number; s: number }[]>([]);
  const [alphaBetaHist, setAlphaBetaHist] = useState<number[]>([]);
  const [thetaAlphaHist, setThetaAlphaHist] = useState<number[]>([]);
  const [lastStateChange, setLastStateChange] = useState(0);
  const lastStateRef = useRef<StateKey>("relaxation");

  // Start uptime timer when we enter live or calibration
  useEffect(() => {
    const isActive = eeg.liveState === "live" || eeg.liveState === "calibrating" || eeg.liveState === "needsCalibration" || eeg.liveState === "finalizing";
    if (isActive && startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    } else if (!isActive) {
      startTimeRef.current = null;
      setUptime(0);
    }
  }, [eeg.liveState]);

  useEffect(() => {
    if (startTimeRef.current === null) return;
    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        setUptime((performance.now() - startTimeRef.current) / 1000);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [eeg.liveState]);

  // Track state change for "holding" timer
  useEffect(() => {
    if (eeg.dominant !== lastStateRef.current) {
      lastStateRef.current = eeg.dominant;
      setLastStateChange(performance.now());
    }
  }, [eeg.dominant]);
  const stateHolding = startTimeRef.current !== null
    ? (performance.now() - Math.max(startTimeRef.current, lastStateChange)) / 1000
    : 0;

  // Push history + ratios every ~500ms when in live mode
  useEffect(() => {
    if (eeg.liveState !== "live") return;
    const t = setInterval(() => {
      const sc = eeg.scores;
      setHistory(prev => {
        const next = [...prev, { t: performance.now() / 1000, r: sc.relaxation, f: sc.concentration, s: sc.stress }];
        if (next.length > 600) next.shift();
        return next;
      });
      const ab = eeg.bands.alpha / (eeg.bands.beta + 0.001);
      const ta = eeg.bands.theta / (eeg.bands.alpha + 0.001);
      setAlphaBetaHist(prev => { const n = [...prev, ab]; if (n.length > 80) n.shift(); return n; });
      setThetaAlphaHist(prev => { const n = [...prev, ta]; if (n.length > 80) n.shift(); return n; });
    }, 500);
    return () => clearInterval(t);
  }, [eeg.liveState, eeg.scores, eeg.bands]);

  const domColor = STATE_COLOR[eeg.dominant];
  const domLabel = STATE_LABEL[eeg.dominant];
  const scores = eeg.scores;

  // ── HRV approximation (derived from scores, since no real heart sensor) ──
  // We keep the panel but explicitly label it "Derived" so it's clear it's a
  // model output from neural metrics, not a direct measurement.
  const bpm = 60 + scores.stress * 28 - scores.relaxation * 4;
  const sdnn = 58 - scores.stress * 32;
  const coh = 0.82 - scores.stress * 0.45;

  return (
    <div style={{ minHeight: "100vh", background: C.ink, color: C.paper, position: "relative", overflow: "hidden" }}>
      {/* Ambient grid */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(${C.ruleSoft} 1px, transparent 1px),
          linear-gradient(90deg, ${C.ruleSoft} 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px", opacity: 0.35,
        maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
      }} />

      {/* Dashboard */}
      <div style={{ position: "relative", maxWidth: 1440, margin: "0 auto", padding: "28px 32px 40px", zIndex: 1 }}>
        {/* Top bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingBottom: 20, marginBottom: 24, borderBottom: `1px solid ${C.rule}`,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, letterSpacing: "-0.02em", color: C.paper }}>
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
            {eeg.deviceName && <StatItem label="Device" value={eeg.deviceName} />}
            {eeg.battery !== null && <StatItem label="Battery" value={`${Math.round(eeg.battery)}%`} />}
            <StatItem label="SR" value={`${eeg.sampleRate} Hz`} />
            <StatItem label="CH" value={`${eeg.channelCount}`} />
            <StatItem label="Uptime" value={fmtTime(uptime)} mono />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                background: eeg.liveState === "live" ? C.greenBright : eeg.liveState === "signalLost" ? C.stress : C.muteDark,
                boxShadow: eeg.liveState === "live" ? `0 0 8px ${C.greenBright}99` : "none",
                animation: eeg.liveState === "live" ? "aora-pulse 1.6s ease-in-out infinite" : "none",
              }} />
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: eeg.liveState === "live" ? C.greenBright : eeg.liveState === "signalLost" ? C.stress : C.mute,
                fontWeight: 500,
              }}>
                {eeg.liveState === "live" ? "Streaming"
                  : eeg.liveState === "signalLost" ? "Signal lost"
                  : eeg.liveState === "calibrating" ? "Calibrating"
                  : eeg.liveState === "finalizing" ? "Finalizing"
                  : eeg.liveState === "needsCalibration" ? "Awaiting cal"
                  : eeg.liveState === "connecting" ? "Pairing"
                  : "Offline"}
              </span>
            </div>
            {eeg.liveState !== "disconnected" && (
              <>
                <button
                  onClick={() => setShowSettings(true)}
                  title="Settings"
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 14,
                    padding: "6px 10px", borderRadius: 4,
                    background: "transparent", border: `1px solid ${C.rule}`, color: C.mute,
                    cursor: "pointer",
                  }}
                >⚙</button>
                <button
                  onClick={() => eeg.disconnect()}
                  style={{
                    fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.2em",
                    textTransform: "uppercase", padding: "6px 12px", borderRadius: 4,
                    background: "transparent", border: `1px solid ${C.rule}`, color: C.mute,
                    cursor: "pointer",
                  }}
                >Disconnect</button>
              </>
            )}
          </div>
        </div>

        {/* Signal-lost banner */}
        {eeg.liveState === "signalLost" && (
          <div style={{
            background: "rgba(201,106,74,0.08)", border: `1px solid ${C.stress}55`,
            padding: "12px 18px", borderRadius: 6, marginBottom: 20,
            fontFamily: "var(--font-sans)", fontSize: 13, color: C.stress,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>Signal lost. The headset disconnected unexpectedly.</span>
            <button
              onClick={() => eeg.disconnect()}
              style={{
                fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.2em",
                textTransform: "uppercase", padding: "6px 14px", borderRadius: 4,
                background: C.stress, color: C.ink, border: "none", cursor: "pointer",
              }}
            >Reset</button>
          </div>
        )}

        {/* Row 1: Arc + Dominant + BandPower */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 1.2fr) minmax(280px, 1fr) minmax(280px, 1.2fr)",
          gap: 20, marginBottom: 20,
        }}>
          <Panel title="Dominant Probability" subtitle={`${Math.round((scores[eeg.dominant] ?? 0) * 100)}%`}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: `radial-gradient(circle at 50% 55%, ${domColor}22 0%, transparent 60%)`,
                  filter: "blur(12px)", pointerEvents: "none",
                }} />
                <ArcGauge value={scores[eeg.dominant]} color={domColor} size={300} />
                <div style={{ position: "absolute", top: "52%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: 54, fontWeight: 400,
                    letterSpacing: "-0.03em", color: domColor, lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                    textShadow: `0 0 24px ${domColor}55`, transition: "color 0.8s ease",
                  }}>{Math.round((scores[eeg.dominant] ?? 0) * 100)}</div>
                  <div style={{
                    fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.25em",
                    textTransform: "uppercase", color: C.mute, marginTop: 6,
                  }}>Probability</div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Current State" subtitle={`Confidence ${Math.round(eeg.confidence * 100)}%`}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 400,
                  letterSpacing: "-0.02em", color: domColor, lineHeight: 1.05,
                  transition: "color 0.8s",
                }}>{domLabel}</div>
                <div style={{
                  fontFamily: "var(--font-sans)", fontSize: 12, color: C.mute, marginTop: 8, letterSpacing: "0.02em",
                }}>
                  holding for{" "}
                  <span style={{ color: C.paper, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                    {fmtTime(stateHolding)}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {(["relaxation", "concentration", "stress"] as StateKey[]).map((k) => (
                  <StateRow key={k} label={STATE_LABEL[k]} value={scores[k]} color={STATE_COLOR[k]} active={k === eeg.dominant} />
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Band Power" subtitle="µV² · relative">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
              <BandRow name="Delta"     range="1 – 4 Hz"   value={eeg.bands.delta}    color={C.mute} />
              <BandRow name="Theta"     range="4 – 8 Hz"   value={eeg.bands.theta}    color={C.paperDim} />
              <BandRow name="Alpha"     range="8 – 13 Hz"  value={eeg.bands.alpha}    color={C.relax}  highlight={eeg.dominant === "relaxation"} />
              <BandRow name="Beta"      range="13 – 30 Hz" value={eeg.bands.beta}     color={C.stress} highlight={eeg.dominant === "stress"} />
              <BandRow name="High-Beta" range="20 – 30 Hz" value={eeg.bands.highBeta} color={C.stress} />
            </div>
          </Panel>
        </div>

        {/* Row 2: Probability timeline */}
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

        {/* Row 3: Raw EEG + Events summary */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(480px, 1.65fr) minmax(300px, 1fr)",
          gap: 20, marginBottom: 20,
        }}>
          <Panel title="Raw EEG" subtitle={`${eeg.channelCount} channels · bandpass 1–40 Hz`}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minHeight: 260 }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <RawEEGCanvas
                  readBuffer={eeg.readRawBuffer}
                  channelIdx={0}
                  color={C.greenBright}
                  label={`CH1 · ${eeg.channelLabels[0] ?? "—"}`}
                  sampleRate={eeg.sampleRate}
                />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <RawEEGCanvas
                  readBuffer={eeg.readRawBuffer}
                  channelIdx={1}
                  color={C.paperDim}
                  label={`CH2 · ${eeg.channelLabels[1] ?? "—"}`}
                  sampleRate={eeg.sampleRate}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Session" subtitle={eeg.liveState}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, fontFamily: "var(--font-sans)", fontSize: 12, color: C.paperDim, lineHeight: 1.6 }}>
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.mute, marginBottom: 6 }}>
                  Calibration
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: eeg.liveState === "live" ? C.greenBright : C.focus }}>
                  {eeg.liveState === "live" ? "Personalized centroids loaded" : "Required before live scoring"}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.mute, marginBottom: 6 }}>
                  Notch Filter
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: C.paper }}>
                  {eeg.notchFreq} Hz mains
                </div>
              </div>
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={eeg.recalibrate}
                  disabled={eeg.liveState !== "live"}
                  style={{
                    padding: "10px 14px", borderRadius: 4,
                    background: "transparent", border: `1px solid ${C.rule}`,
                    color: eeg.liveState === "live" ? C.paper : C.muteDark,
                    fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.2em",
                    textTransform: "uppercase", cursor: eeg.liveState === "live" ? "pointer" : "not-allowed",
                  }}
                >Recalibrate</button>
              </div>
            </div>
          </Panel>
        </div>

        {/* Row 4: Derived HRV, ratios, signal */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 20,
        }}>
          <Panel title="Heart-rate Variability" subtitle="derived from neural">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14 }}>
              <div>
                <BigNumber value={Math.round(bpm).toString()} unit="bpm" color={bpm > 80 ? C.stress : C.paper} />
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 10, color: C.mute, letterSpacing: "0.1em",
                  marginTop: 4, textTransform: "uppercase",
                }}>
                  estimate · {bpm > 80 ? "elevated" : "resting"}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, color: C.paperDim }}>
                <span>SDNN {sdnn.toFixed(0)} ms</span>
                <span>Coh {coh.toFixed(2)}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Alpha / Beta" subtitle="relaxation index">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <BigNumber value={(eeg.bands.alpha / (eeg.bands.beta + 0.001)).toFixed(2)} color={C.relax} />
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
              <BigNumber value={(eeg.bands.theta / (eeg.bands.alpha + 0.001)).toFixed(2)} color={C.focus} />
              <div style={{ margin: "10px 0" }}>
                <Spark data={thetaAlphaHist} color={C.focus} />
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: C.mute, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                elevated under concentration
              </div>
            </div>
          </Panel>

          <Panel title="Signal Integrity" subtitle={`SEF₉₅ ${eeg.sef95.toFixed(1)} Hz`}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, justifyContent: "space-between" }}>
              {eeg.channelLabels.slice(0, 4).map((lbl, i) => (
                <ChannelRow key={i} label={`CH${i+1} · ${lbl}`} ok={eeg.signalQuality[i] ?? true} />
              ))}
              <div>
                <div style={{ height: 4, background: C.rule, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: `${Math.min(100, ((eeg.sef95 - 15) / 15) * 100)}%`,
                    height: "100%", background: eeg.sef95 > 24 ? C.stress : C.greenBright,
                    transition: "width 0.4s, background 0.4s",
                  }} />
                </div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 10, color: eeg.sef95 > 24 ? C.stress : C.mute,
                  marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  {eeg.sef95 > 24 ? "elevated · cognitive load" : "nominal"}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── Overlays ── */}
      {eeg.liveState === "disconnected" && (
        <PairOverlay
          supported={eeg.supported}
          selected={selectedDriver}
          setSelected={setSelectedDriver}
          notchFreq={eeg.notchFreq}
          onConnect={() => eeg.connect(selectedDriver)}
          error={eeg.errorMsg}
        />
      )}

      {eeg.liveState === "connecting" && (
        <StatusOverlay title="Pairing…" subtitle="Choose your headset in the browser dialog. Keep it nearby." />
      )}

      {eeg.liveState === "needsCalibration" && (
        <NeedsCalibrationOverlay onStart={eeg.startCalibration} />
      )}

      {eeg.liveState === "calibrating" && eeg.calPhase && (
        <CalibrationOverlay
          calPhase={eeg.calPhase}
          calDone={eeg.calDone}
          onCancel={eeg.cancelCalibration}
        />
      )}

      {eeg.liveState === "finalizing" && (
        <StatusOverlay title="Finalizing…" subtitle="Computing personalized baselines." />
      )}

      {showSettings && (
        <SettingsOverlay
          notchFreq={eeg.notchFreq}
          changeNotch={(f) => { eeg.changeNotch(f); setShowSettings(false); }}
          onRecalibrate={() => { eeg.recalibrate(); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}

      <style jsx global>{`
        @keyframes aora-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.88); }
        }
        @keyframes aora-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
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
// Overlays
// ═════════════════════════════════════════════════════════════════════════
function OverlayShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(10,10,10,0.75)",
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        maxWidth: 560, width: "100%", padding: "40px 44px",
        background: "rgba(20,20,20,0.85)", border: `1px solid ${C.rule}`,
        borderRadius: 8, textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        animation: "aora-fadein 0.35s ease",
      }}>
        {children}
      </div>
    </div>
  );
}

function PairOverlay({
  supported, selected, setSelected, notchFreq, onConnect, error,
}: {
  supported: boolean;
  selected: "muse" | "ganglion";
  setSelected: (s: "muse" | "ganglion") => void;
  notchFreq: 50 | 60;
  onConnect: () => void;
  error: string | null;
}) {
  return (
    <OverlayShell>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.3em",
        textTransform: "uppercase", color: C.mute, marginBottom: 14, fontWeight: 500,
      }}>
        Aora · Neural Monitor
      </div>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 300,
        letterSpacing: "-0.025em", lineHeight: 1.15, color: C.paper, marginBottom: 14,
      }}>
        Connect your headset
      </div>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 14, color: C.paperDim,
        lineHeight: 1.55, maxWidth: 420, margin: "0 auto 24px",
      }}>
        Pairs over Bluetooth with Aora Beta or Aora Nano.
        A one-time calibration follows the first connection.
      </div>

      {/* Driver radio */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {[
          { id: "muse" as const, name: "Aora Beta", note: "4 channels · 256 Hz" },
          { id: "ganglion" as const, name: "Aora Nano", note: "4 channels · 200 Hz" },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            style={{
              textAlign: "left", padding: "14px 18px", borderRadius: 4,
              background: selected === opt.id ? "rgba(110,139,61,0.12)" : "transparent",
              border: `1px solid ${selected === opt.id ? C.green : C.rule}`,
              color: C.paper, cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: "var(--font-sans)", fontSize: 13,
              transition: "background 0.2s, border 0.2s",
            }}
          >
            <div>
              <div style={{ fontSize: 14, marginBottom: 2 }}>{opt.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: C.mute, letterSpacing: "0.08em" }}>
                {opt.note}
              </div>
            </div>
            <span style={{
              display: "inline-block", width: 14, height: 14, borderRadius: "50%",
              border: `1px solid ${selected === opt.id ? C.greenBright : C.mute}`,
              background: selected === opt.id ? C.greenBright : "transparent",
              transition: "background 0.2s, border 0.2s",
            }} />
          </button>
        ))}
      </div>

      {/* Mains freq */}
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em",
        color: C.mute, marginBottom: 24, textTransform: "uppercase",
      }}>
        Mains frequency: {notchFreq} Hz (auto)
      </div>

      {error && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 11, color: C.stress,
          marginBottom: 16, padding: "10px 14px", border: `1px solid ${C.stress}55`,
          borderRadius: 4, background: "rgba(201,106,74,0.08)",
        }}>
          {error}
        </div>
      )}

      <button
        className="aora-start-btn"
        onClick={onConnect}
        disabled={!supported}
        style={{
          fontFamily: "var(--font-sans)", fontSize: 12,
          letterSpacing: "0.25em", textTransform: "uppercase",
          fontWeight: 500, padding: "16px 40px",
          background: supported ? C.green : C.rule,
          color: supported ? C.ink : C.muteDark,
          border: "none", borderRadius: 4,
          cursor: supported ? "pointer" : "not-allowed",
          boxShadow: supported ? `0 0 24px ${C.green}55` : "none",
        }}
      >
        ▶  Pair Device
      </button>

      {!supported && (
        <div style={{
          marginTop: 20, fontFamily: "var(--font-sans)", fontSize: 12, color: C.stress, lineHeight: 1.6,
        }}>
          Web Bluetooth isn't available in this browser.
          Open this page in <strong>Chrome</strong>, <strong>Edge</strong>, or <strong>Brave</strong> on desktop or Android.
          iOS and Safari are not supported.
        </div>
      )}

      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em",
        color: C.muteDark, marginTop: 20, textTransform: "uppercase",
      }}>
        Requires Bluetooth · Chrome / Edge / Brave
      </div>
    </OverlayShell>
  );
}

function StatusOverlay({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <OverlayShell>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 300,
        letterSpacing: "-0.025em", color: C.paper, marginBottom: 10,
      }}>{title}</div>
      {subtitle && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: C.paperDim, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        margin: "24px auto 0",
        border: `2px solid ${C.green}`,
        borderTopColor: "transparent",
        animation: "aora-pulse 1.5s ease-in-out infinite",
      }} />
    </OverlayShell>
  );
}

function NeedsCalibrationOverlay({ onStart }: { onStart: () => void }) {
  return (
    <OverlayShell>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.3em",
        textTransform: "uppercase", color: C.mute, marginBottom: 14, fontWeight: 500,
      }}>One-time calibration</div>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 300,
        letterSpacing: "-0.025em", lineHeight: 1.15, color: C.paper, marginBottom: 14,
      }}>
        Teach the system your<br />
        <span style={{ fontStyle: "italic", color: C.greenBright }}>baseline</span>.
      </div>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 14, color: C.paperDim,
        lineHeight: 1.55, maxWidth: 440, margin: "0 auto 24px",
      }}>
        Three 40-second rounds: relaxed, focused, stressed. Follow the prompts.
        The result is saved to this device so you won't be asked again.
      </div>
      <button
        className="aora-start-btn"
        onClick={onStart}
        style={{
          fontFamily: "var(--font-sans)", fontSize: 12,
          letterSpacing: "0.25em", textTransform: "uppercase",
          fontWeight: 500, padding: "16px 40px",
          background: C.green, color: C.ink,
          border: "none", borderRadius: 4,
          cursor: "pointer", boxShadow: `0 0 24px ${C.green}55`,
        }}
      >▶  Start Calibration</button>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em",
        color: C.muteDark, marginTop: 20, textTransform: "uppercase",
      }}>~ 2 minutes total</div>
    </OverlayShell>
  );
}

function CalibrationOverlay({
  calPhase, calDone, onCancel,
}: {
  calPhase: { state: StateKey; label: string; instruction: string; countdown?: number; progress: number; samples: number };
  calDone: Record<StateKey, boolean>;
  onCancel: () => void;
}) {
  const color = STATE_COLOR[calPhase.state];
  const seq: Array<{ key: StateKey; emoji: string }> = [
    { key: "relaxation", emoji: "🌿" },
    { key: "concentration", emoji: "🎯" },
    { key: "stress", emoji: "⏱" },
  ];
  return (
    <OverlayShell>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.3em",
        textTransform: "uppercase", color: C.mute, marginBottom: 20, fontWeight: 500,
      }}>
        Calibration · {Object.values(calDone).filter(Boolean).length} / 3
      </div>

      {/* Checklist */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {seq.map(s => {
          const done = calDone[s.key];
          const active = calPhase.state === s.key;
          const c = STATE_COLOR[s.key];
          return (
            <div key={s.key} style={{
              flex: 1, padding: "12px 8px", borderRadius: 6, textAlign: "center",
              background: done ? `${c}14` : active ? `${c}08` : "transparent",
              border: `1px solid ${done ? c + "55" : active ? c + "33" : C.rule}`,
              transition: "all 0.3s",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
              <div style={{
                fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: done ? c : active ? c : C.muteDark,
              }}>
                {done ? "Done" : active ? "Recording" : "Pending"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current instruction */}
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 300,
        letterSpacing: "-0.02em", color, marginBottom: 10,
      }}>
        {calPhase.label}
      </div>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 13, color: C.paperDim,
        lineHeight: 1.55, maxWidth: 420, margin: "0 auto 24px", minHeight: 46,
      }}>
        {calPhase.instruction}
      </div>

      {/* Countdown or progress */}
      {calPhase.countdown !== undefined && calPhase.countdown > 0 ? (
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 400, color: C.focus,
          fontVariantNumeric: "tabular-nums",
        }}>
          {calPhase.countdown}
        </div>
      ) : (
        <>
          <div style={{ height: 4, background: C.rule, borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
            <div style={{
              height: "100%", width: `${calPhase.progress * 100}%`, background: color,
              transition: "width 0.4s linear", boxShadow: `0 0 8px ${color}88`,
            }} />
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontFamily: "var(--font-mono)", fontSize: 10, color: C.mute, letterSpacing: "0.1em",
          }}>
            <span>{calPhase.samples} samples</span>
            <span>{Math.round(calPhase.progress * 40)}s / 40s</span>
          </div>
        </>
      )}

      <button
        onClick={onCancel}
        style={{
          marginTop: 28, padding: "10px 20px", borderRadius: 4,
          background: "transparent", border: `1px solid ${C.rule}`, color: C.mute,
          fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.2em",
          textTransform: "uppercase", cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </OverlayShell>
  );
}

function SettingsOverlay({
  notchFreq, changeNotch, onRecalibrate, onClose,
}: {
  notchFreq: 50 | 60;
  changeNotch: (f: 50 | 60) => void;
  onRecalibrate: () => void;
  onClose: () => void;
}) {
  return (
    <OverlayShell>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 10, letterSpacing: "0.3em",
        textTransform: "uppercase", color: C.mute, marginBottom: 16, fontWeight: 500,
      }}>Settings</div>

      <div style={{ textAlign: "left", marginBottom: 24 }}>
        <div style={{
          fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.mute, marginBottom: 8,
        }}>Mains frequency</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[50, 60].map(f => (
            <button
              key={f}
              onClick={() => changeNotch(f as 50 | 60)}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 4,
                background: notchFreq === f ? C.green : "transparent",
                border: `1px solid ${notchFreq === f ? C.green : C.rule}`,
                color: notchFreq === f ? C.ink : C.paper,
                fontFamily: "var(--font-sans)", fontSize: 12, letterSpacing: "0.15em",
                textTransform: "uppercase", cursor: "pointer",
              }}
            >{f} Hz</button>
          ))}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: C.muteDark, marginTop: 8, letterSpacing: "0.08em" }}>
          Changing this clears the saved calibration and returns to calibration.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onRecalibrate}
          style={{
            flex: 1, padding: "12px 0", borderRadius: 4,
            background: "transparent", border: `1px solid ${C.rule}`, color: C.paper,
            fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.2em",
            textTransform: "uppercase", cursor: "pointer",
          }}
        >Recalibrate</button>
        <button
          onClick={onClose}
          style={{
            flex: 1, padding: "12px 0", borderRadius: 4,
            background: C.green, color: C.ink, border: "none",
            fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.2em",
            textTransform: "uppercase", cursor: "pointer",
          }}
        >Close</button>
      </div>
    </OverlayShell>
  );
}
