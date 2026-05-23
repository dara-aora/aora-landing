"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type StateKey = "relaxation" | "concentration" | "stress";
type Scores = { relaxation: number; concentration: number; stress: number };
type Tick = { ts: number; state: string; scores: Scores };
type Session = {
  id: string;
  participantNum: number;
  startTime: number;
  endTime: number;
  ticks: Tick[];
  isDemo: boolean;
  disconnected?: boolean;
};
type Phase =
  | "connecting"
  | "calibrating"
  | "idle"
  | "recording"
  | "done";

type StateCfg = { label: string; emoji: string; color: string; bg: string };

// ── Constants (ported from eeg-monitor) ───────────────────────────────────────
const STATES: Record<string, StateCfg> = {
  relaxation:    { label: "RELAXED",     emoji: "🌊", color: "#00e8a0", bg: "#00140d" },
  concentration: { label: "FOCUSED",     emoji: "🎯", color: "#5b8fff", bg: "#000d1a" },
  stress:        { label: "STRESSED",    emoji: "⚡", color: "#ff6060", bg: "#1a0000" },
  connecting:    { label: "CONNECTING",  emoji: "◯",  color: "#2a5a3a", bg: "#060c09" },
  calibrating:   { label: "CALIBRATING", emoji: "◌",  color: "#ffa040", bg: "#0d0800" },
  idle:          { label: "READY",       emoji: "●",  color: "#00e8a0", bg: "#060c09" },
};

const CAL_SEQUENCE = [
  {
    key: "relaxation", label: "RELAXED", emoji: "🌊", color: "#00e8a0",
    instruction: "Close your eyes · breathe slowly · clear your mind completely",
    visual: "🌿", visualLabel: "Forest · Ocean · Peace",
    breatheIn: 4, breatheOut: 6,
  },
  {
    key: "concentration", label: "FOCUSED", emoji: "🎯", color: "#5b8fff",
    instruction: "Eyes open · solve 300−7−7−7... keep going · stay locked in",
    visual: "🔢", visualLabel: "Numbers · Logic · Precision",
    breatheIn: 4, breatheOut: 4,
  },
  {
    key: "stress", label: "STRESSED", emoji: "⚡", color: "#ff6060",
    instruction: "Feel a real deadline · heart racing · pressure building now",
    visual: "⏱", visualLabel: "Deadline · Urgency · Tension",
    breatheIn: 2, breatheOut: 2,
  },
];

const STORAGE_KEY = "aora-launch-sessions";
const STORAGE_VERSION = 1;

// ── Audio / speech ────────────────────────────────────────────────────────────
class AmbientAudio {
  ctx: AudioContext | null = null;
  nodes: (OscillatorNode)[] = [];
  active = false;

  start(state: string) {
    this.stop();
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      this.ctx = new AC();
      this.nodes = [];
      this.active = true;
      const configs: Record<string, { freqs: number[]; type: OscillatorType; gain: number; lfoRate: number }> = {
        relaxation:    { freqs: [110, 165, 220, 330], type: "sine",     gain: 0.04,  lfoRate: 0.08 },
        concentration: { freqs: [200, 300, 400],      type: "square",   gain: 0.02,  lfoRate: 0.4  },
        stress:        { freqs: [180, 270, 360, 450], type: "sawtooth", gain: 0.025, lfoRate: 1.2  },
        calibrating:   { freqs: [220, 440],           type: "sine",     gain: 0.03,  lfoRate: 0.15 },
      };
      const cfg = configs[state] || configs.relaxation;
      cfg.freqs.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoG = this.ctx.createGain();
        osc.type = cfg.type;
        osc.frequency.value = freq + i * 2;
        lfo.frequency.value = cfg.lfoRate + i * 0.03;
        lfoG.gain.value = freq * 0.01;
        gain.gain.value = cfg.gain / cfg.freqs.length;
        lfo.connect(lfoG); lfoG.connect(osc.frequency);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); lfo.start();
        this.nodes.push(osc, lfo);
      });
    } catch (e) { console.warn("Audio unavailable:", e); }
  }

  stop() {
    this.nodes.forEach((n) => { try { n.stop(); } catch {} });
    this.nodes = [];
    if (this.ctx) { try { this.ctx.close(); } catch {} this.ctx = null; }
    this.active = false;
  }
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85; u.pitch = 0.9; u.volume = 0.8;
  window.speechSynthesis.speak(u);
}

// ── Breath pacer ──────────────────────────────────────────────────────────────
function BreathPacer({ inSec, outSec, color, active }: { inSec: number; outSec: number; color: string; active: boolean }) {
  const [phase, setPhase] = useState<"inhale" | "exhale">("inhale");
  const [progress, setProgress] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let currentPhase: "inhale" | "exhale" = "inhale";
    const duration = () => (currentPhase === "inhale" ? inSec * 1000 : outSec * 1000);

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const d = duration();
      const p = Math.min(elapsed / d, 1);
      setProgress(p);
      setPhase(currentPhase);
      if (p >= 1) {
        currentPhase = currentPhase === "inhale" ? "exhale" : "inhale";
        start = ts;
      }
      ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current !== null) cancelAnimationFrame(ref.current); };
  }, [active, inSec, outSec]);

  const size = 56 + progress * (phase === "inhale" ? 24 : -24) * (active ? 1 : 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `${color}20`, border: `1.5px solid ${color}50`,
        transition: "width 0.1s linear, height 0.1s linear",
        boxShadow: `0 0 ${12 + progress * 16}px ${color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: size * 0.35, height: size * 0.35, borderRadius: "50%",
          background: color, opacity: 0.6,
        }} />
      </div>
      <div style={{ fontSize: 8, color, letterSpacing: 2, opacity: 0.7 }}>
        {phase === "inhale" ? `INHALE ${inSec}s` : `EXHALE ${outSec}s`}
      </div>
    </div>
  );
}

// ── Arc ───────────────────────────────────────────────────────────────────────
function Arc({ value, color }: { value: number; color: string }) {
  const R = 88, cx = 120, cy = 120;
  const start = Math.PI * 0.75, total = Math.PI * 1.5;
  const fill = start + total * Math.min(Math.max(value, 0), 1);
  const pt = (a: number) => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  const s = pt(start), e = pt(fill), te = pt(start + total);
  const large = fill - start > Math.PI ? 1 : 0;
  const fp = value < 0.01 ? null : `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  const tip = pt(fill);
  return (
    <svg width={240} height={210} style={{ overflow: "visible" }}>
      <defs>
        <filter id="glow-rtm">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={`M ${s.x} ${s.y} A ${R} ${R} 0 1 1 ${te.x} ${te.y}`}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
      {fp && <path d={fp} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" filter="url(#glow-rtm)" />}
      {value > 0.01 && (
        <>
          <circle cx={tip.x} cy={tip.y} r={11} fill={color} opacity={0.18} />
          <circle cx={tip.x} cy={tip.y} r={4.5} fill={color} filter="url(#glow-rtm)" />
        </>
      )}
    </svg>
  );
}

function ScoreBar({ label, value, color, active }: { label: string; value: number; color: string; active: boolean }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 9, letterSpacing: 2, color: active ? color : "#2a5a3a", fontWeight: active ? "bold" : "normal", transition: "color 0.4s" }}>{label}</span>
        <span style={{ fontSize: 9, color: active ? color : "#1a3a20" }}>{Math.round((value ?? 0) * 100)}%</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
        <div style={{
          height: "100%", width: `${(value ?? 0) * 100}%`,
          background: active ? color : "#1a3a20", borderRadius: 2,
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1),background 0.4s",
          boxShadow: active ? `0 0 6px ${color}80` : "none",
        }} />
      </div>
    </div>
  );
}

function Spark({ history, color }: { history: number[]; color: string }) {
  if (history.length < 2) return null;
  const W = 280, H = 28;
  const max = Math.max(...history, 0.01);
  const norm = (v: number) => H - (v / max) * (H - 4) - 2;
  const pts = history.map((v, i) => `${(i / (history.length - 1)) * W},${norm(v)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="sg-rtm" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.04" />
          <stop offset="100%" stopColor={color} stopOpacity="0.65" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke="url(#sg-rtm)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={W} cy={norm(history[history.length - 1])} r="2.5" fill={color} />
    </svg>
  );
}

// ── Calibration screen ────────────────────────────────────────────────────────
function CalScreen({
  calPhase, calProgress, calDone, calSamples, audioEnabled, setAudioEnabled,
}: {
  calPhase: any; calProgress: number; calDone: Record<string, boolean>;
  calSamples: number; audioEnabled: boolean; setAudioEnabled: (fn: (a: boolean) => boolean) => void;
}) {
  const current = CAL_SEQUENCE.find((s) => s.key === calPhase?.state);
  const completed = Object.keys(calDone).length;

  return (
    <div style={{ padding: "0 24px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, color: "#2a5a3a", letterSpacing: 3 }}>
          CALIBRATION · {completed}/3
        </div>
        <button onClick={() => setAudioEnabled((a) => !a)} style={{
          fontSize: 8, padding: "3px 8px", borderRadius: 4, cursor: "pointer",
          background: audioEnabled ? "rgba(0,232,160,0.1)" : "rgba(255,255,255,0.03)",
          border: audioEnabled ? "1px solid rgba(0,232,160,0.3)" : "1px solid #0d2018",
          color: audioEnabled ? "#00e8a0" : "#1e4a2a", letterSpacing: 1,
        }}>{audioEnabled ? "🔊 AUDIO ON" : "🔇 AUDIO OFF"}</button>
      </div>

      {current && (
        <div style={{
          borderRadius: 16, padding: 20,
          background: `${current.color}08`,
          border: `1px solid ${current.color}30`,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 4 }}>{current.visual}</div>
            <div style={{ fontSize: 9, color: current.color, letterSpacing: 2, opacity: 0.7 }}>
              {current.visualLabel}
            </div>
          </div>

          <div style={{ fontSize: 10, color: "#4a8a60", lineHeight: 1.8, textAlign: "center", padding: "0 8px" }}>
            {current.instruction}
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <BreathPacer inSec={current.breatheIn} outSec={current.breatheOut} color={current.color} active={calProgress > 0 && calProgress < 1} />
          </div>

          <div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginBottom: 6 }}>
              <div style={{
                height: "100%", width: `${(calProgress || 0) * 100}%`,
                background: current.color, borderRadius: 2, transition: "width 0.5s linear",
                boxShadow: `0 0 8px ${current.color}`,
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#2a5a3a" }}>
              <span>{calSamples} samples</span>
              <span>{Math.round((calProgress || 0) * 40)}s / 40s</span>
            </div>
          </div>
        </div>
      )}

      {calPhase?.countdown > 0 && !calProgress && (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#ffa040", fontFamily: "'Syne',sans-serif" }}>
            {calPhase.countdown}
          </div>
          <div style={{ fontSize: 9, color: "#3a5a30", letterSpacing: 2, marginTop: 4 }}>
            GET READY · {calPhase.label}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {CAL_SEQUENCE.map((s) => {
          const done = calDone[s.key];
          const active = calPhase?.state === s.key;
          return (
            <div key={s.key} style={{
              flex: 1, padding: "10px 8px", borderRadius: 10, textAlign: "center",
              background: done ? `${s.color}10` : active ? `${s.color}06` : "rgba(0,0,0,0.2)",
              border: `1px solid ${done ? s.color + "30" : active ? s.color + "20" : "#0a1a10"}`,
              transition: "all 0.4s",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.emoji}</div>
              <div style={{ fontSize: 8, letterSpacing: 1, color: done ? s.color : active ? s.color + "99" : "#1a3a20" }}>
                {done ? "✓ DONE" : active ? "● REC" : "NEXT"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Session helpers ───────────────────────────────────────────────────────────
function sessionSummary(s: Session) {
  const totals: Record<string, number> = { relaxation: 0, concentration: 0, stress: 0 };
  s.ticks.forEach((t) => { totals[t.state] = (totals[t.state] || 0) + 1; });
  const totalTicks = s.ticks.length || 1;
  const pct = (k: string) => Math.round(((totals[k] || 0) / totalTicks) * 100);
  const dominant = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const durationSec = Math.max(0, (s.endTime - s.startTime) / 1000);
  return {
    totals,
    totalTicks: s.ticks.length,
    pct,
    dominant,
    durationSec,
  };
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
}

// ── Mock data generator ───────────────────────────────────────────────────────
let _mt = 0;
function mockData(): { state: string; scores: Scores; calibrated: boolean } {
  _mt += 0.5;
  const cycle = Math.floor((_mt / 20) % 3);
  const n = (Math.random() - 0.5) * 0.08;
  const sets = [
    { relaxation: 0.62 + n, concentration: 0.28 + n, stress: 0.18 + n },
    { relaxation: 0.20 + n, concentration: 0.65 + n, stress: 0.24 + n },
    { relaxation: 0.15 + n, concentration: 0.30 + n, stress: 0.72 + n },
  ];
  const raw = sets[cycle];
  const scores: Scores = {
    relaxation: Math.max(0, Math.min(1, raw.relaxation)),
    concentration: Math.max(0, Math.min(1, raw.concentration)),
    stress: Math.max(0, Math.min(1, raw.stress)),
  };
  const entries = Object.entries(scores) as [StateKey, number][];
  const state = entries.sort((a, b) => b[1] - a[1])[0][0];
  return { state, scores, calibrated: true };
}

// ── CSV export ────────────────────────────────────────────────────────────────
function downloadCSV(filename: string, rows: string[]) {
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function exportAllCSV(sessions: Session[]) {
  const rows = [
    "participant,timestamp_iso,seconds_from_start,state,relaxation,concentration,stress,is_demo",
  ];
  sessions.forEach((s) => {
    s.ticks.forEach((t) => {
      const secFromStart = ((t.ts - s.startTime) / 1000).toFixed(3);
      rows.push([
        s.participantNum,
        new Date(t.ts).toISOString(),
        secFromStart,
        t.state,
        (t.scores.relaxation ?? 0).toFixed(3),
        (t.scores.concentration ?? 0).toFixed(3),
        (t.scores.stress ?? 0).toFixed(3),
        s.isDemo ? "true" : "false",
      ].join(","));
    });
  });
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(`aora-launch-all-${date}.csv`, rows);
}

function exportSummaryCSV(sessions: Session[]) {
  const rows = [
    "participant,start_iso,duration_sec,readings,dominant_state,pct_relaxation,pct_concentration,pct_stress,is_demo",
  ];
  sessions.forEach((s) => {
    const sm = sessionSummary(s);
    rows.push([
      s.participantNum,
      new Date(s.startTime).toISOString(),
      sm.durationSec.toFixed(1),
      sm.totalTicks,
      sm.dominant ?? "",
      sm.pct("relaxation"),
      sm.pct("concentration"),
      sm.pct("stress"),
      s.isDemo ? "true" : "false",
    ].join(","));
  });
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(`aora-launch-summary-${date}.csv`, rows);
}

// ── Storage ───────────────────────────────────────────────────────────────────
function loadStorage(): { lastParticipantNum: number; sessions: Session[] } {
  if (typeof window === "undefined") return { lastParticipantNum: 0, sessions: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastParticipantNum: 0, sessions: [] };
    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION) return { lastParticipantNum: 0, sessions: [] };
    return {
      lastParticipantNum: parsed.lastParticipantNum || 0,
      sessions: parsed.sessions || [],
    };
  } catch {
    return { lastParticipantNum: 0, sessions: [] };
  }
}

function saveStorage(lastParticipantNum: number, sessions: Session[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      lastParticipantNum,
      sessions,
    }));
  } catch (e) {
    console.warn("Storage save failed:", e);
  }
}

// ── Sessions modal ────────────────────────────────────────────────────────────
function SessionsModal({ sessions, onClose, onDeleteAll }: {
  sessions: Session[]; onClose: () => void; onDeleteAll: () => void;
}) {
  const stateColor = (s: string | null) => (s && STATES[s]?.color) || "#2a5a3a";
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center",
      padding: 16, animation: "fadein 0.2s ease",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 460, maxHeight: "90vh", overflow: "auto",
        background: "#060c09", border: "1px solid #0d2018", borderRadius: 14,
        padding: 20, fontFamily: "'DM Mono',monospace",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#00e8a0" }}>
            ALL SESSIONS · {sessions.length}
          </div>
          <button onClick={onClose} style={{
            fontSize: 10, padding: "4px 10px", borderRadius: 4, cursor: "pointer",
            background: "rgba(255,255,255,0.04)", border: "1px solid #0d2018", color: "#4a8a60",
          }}>CLOSE</button>
        </div>

        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#1a3a20", fontSize: 10, letterSpacing: 2 }}>
            NO SESSIONS YET
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.slice().reverse().map((s) => {
              const sm = sessionSummary(s);
              return (
                <div key={s.id} style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)", border: "1px solid #0d2018",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#00e8a0", letterSpacing: 2, fontWeight: "bold" }}>
                        #{s.participantNum} {s.isDemo && <span style={{ color: "#ffa040", fontSize: 8 }}> · DEMO</span>}
                      </div>
                      <div style={{ fontSize: 8, color: "#2a5a3a", marginTop: 2 }}>
                        {new Date(s.startTime).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, color: stateColor(sm.dominant) }}>
                        {sm.dominant ? STATES[sm.dominant]?.emoji : "—"}
                      </div>
                      <div style={{ fontSize: 8, color: "#2a5a3a" }}>
                        {fmtDuration(sm.durationSec)}
                      </div>
                    </div>
                  </div>
                  {/* Mini breakdown */}
                  <div style={{ display: "flex", gap: 4, height: 4, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ flex: sm.pct("relaxation"), background: STATES.relaxation.color, opacity: 0.8 }} />
                    <div style={{ flex: sm.pct("concentration"), background: STATES.concentration.color, opacity: 0.8 }} />
                    <div style={{ flex: sm.pct("stress"), background: STATES.stress.color, opacity: 0.8 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 8, color: "#2a5a3a" }}>
                    <span style={{ color: STATES.relaxation.color }}>R {sm.pct("relaxation")}%</span>
                    <span style={{ color: STATES.concentration.color }}>F {sm.pct("concentration")}%</span>
                    <span style={{ color: STATES.stress.color }}>S {sm.pct("stress")}%</span>
                    <span>{sm.totalTicks} reads</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sessions.length > 0 && (
          <button onClick={onDeleteAll} style={{
            marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 10, cursor: "pointer",
            background: "rgba(255,96,96,0.08)", border: "1px solid rgba(255,96,96,0.25)",
            color: "#ff6060", fontSize: 9, letterSpacing: 2,
          }}>⚠ DELETE ALL SESSIONS</button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RealtimeMonitoringPage() {
  const [phase, setPhase] = useState<Phase>("connecting");
  const [state, setState] = useState<string>("connecting");
  const [scores, setScores] = useState<Scores>({ relaxation: 0, concentration: 0, stress: 0 });
  const [history, setHistory] = useState<number[]>([]);
  const [wsConnected, setWsConn] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [calibrated, setCalib] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const [calPhase, setCalPhase] = useState<any>(null);
  const [calProgress, setCalProg] = useState(0);
  const [calSamples, setCalSamples] = useState(0);
  const [calDone, setCalDone] = useState<Record<string, boolean>>({});

  const [sessions, setSessions] = useState<Session[]>([]);
  const [lastParticipantNum, setLastParticipantNum] = useState(0);
  const [currentParticipantNum, setCurrentParticipantNum] = useState<number | null>(null);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [justSaved, setJustSaved] = useState<Session | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const currentTicks = useRef<Tick[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const mockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AmbientAudio | null>(null);
  const phaseRef = useRef<Phase>("connecting");

  // Keep phaseRef in sync so WS handlers read current phase
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Load storage on mount
  useEffect(() => {
    const { lastParticipantNum: n, sessions: sess } = loadStorage();
    setLastParticipantNum(n);
    setSessions(sess);
    audioRef.current = new AmbientAudio();
  }, []);

  // Persist on change
  useEffect(() => {
    saveStorage(lastParticipantNum, sessions);
  }, [lastParticipantNum, sessions]);

  // Elapsed timer when recording
  useEffect(() => {
    if (phase !== "recording" || recordingStart === null) {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSec(0);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - recordingStart) / 1000));
    }, 250);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, recordingStart]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Audio on state change during recording
  useEffect(() => {
    if (!audioRef.current) return;
    if (!audioEnabled) { audioRef.current.stop(); return; }
    if (phase === "calibrating") {
      audioRef.current.start("calibrating");
    } else if (phase === "recording" && ["relaxation", "concentration", "stress"].includes(state)) {
      audioRef.current.start(state);
    } else {
      audioRef.current.stop();
    }
  }, [state, phase, audioEnabled]);

  // Record ticks when recording
  const recordTick = useCallback((s: string, sc: Scores) => {
    if (phaseRef.current !== "recording") return;
    currentTicks.current.push({ ts: Date.now(), state: s, scores: sc });
  }, []);

  // WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        ws = new WebSocket("ws://localhost:8765");
      } catch {
        reconnectTimer = setTimeout(connect, 2000);
        return;
      }
      wsRef.current = ws;
      ws.onopen = () => {
        setWsConn(true);
        setUseMock(false);
      };
      ws.onmessage = (evt) => {
        let msg: any;
        try { msg = JSON.parse(evt.data); } catch { return; }

        if (msg.type === "status") {
          if (msg.phase === "calibrating") {
            setPhase("calibrating");
            setState("calibrating");
            setCalDone({});
            setCalib(false);
          } else if (msg.phase === "live") {
            // Server says live; go to idle (ready) unless we're actively recording
            if (phaseRef.current !== "recording") {
              setPhase("idle");
            }
          }
        }
        if (msg.type === "cal_phase") {
          setCalPhase(msg);
          setCalProg(0);
          setCalSamples(0);
          if (audioEnabled) speak(msg.label);
        }
        if (msg.type === "cal_progress") {
          setCalProg(msg.progress);
          setCalSamples(msg.samples);
        }
        if (msg.type === "cal_done") {
          setCalDone((p) => ({ ...p, [msg.state]: true }));
        }
        if (msg.type === "cal_complete") {
          setCalib(true);
          setCalPhase(null);
          if (phaseRef.current !== "recording") setPhase("idle");
          if (audioEnabled) speak("Calibration complete. Ready for participants.");
        }
        if (msg.type === "data") {
          setState(msg.state);
          setScores(msg.scores);
          setCalib(msg.calibrated ?? false);
          setHistory((prev) => [...prev.slice(-80), msg.scores[msg.state] ?? 0]);
          recordTick(msg.state, msg.scores);
          // Auto-transition to idle if we receive live data but are still in "connecting"
          if (phaseRef.current === "connecting") setPhase("idle");
        }
      };
      ws.onerror = () => setWsConn(false);
      ws.onclose = () => {
        setWsConn(false);
        if (phaseRef.current !== "recording") setPhase("connecting");
        reconnectTimer = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [recordTick, audioEnabled]);

  // Mock mode
  useEffect(() => {
    if (!useMock) {
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
      return;
    }
    setCalib(true);
    if (phase === "connecting" || phase === "calibrating") setPhase("idle");
    mockIntervalRef.current = setInterval(() => {
      const d = mockData();
      setState(d.state);
      setScores(d.scores);
      setHistory((prev) => [...prev.slice(-80), d.scores[d.state as StateKey] ?? 0]);
      recordTick(d.state, d.scores);
    }, 500);
    return () => { if (mockIntervalRef.current) clearInterval(mockIntervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useMock]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const startRecording = () => {
    if (!calibrated && !useMock) {
      setToast("Calibration required first");
      return;
    }
    const nextNum = lastParticipantNum + 1;
    setCurrentParticipantNum(nextNum);
    currentTicks.current = [];
    setRecordingStart(Date.now());
    setHistory([]);
    setPhase("recording");
  };

  const stopAndSave = () => {
    const ticks = currentTicks.current;
    if (ticks.length < 2) {
      setToast("Recording too short — not saved");
      setPhase("idle");
      setCurrentParticipantNum(null);
      setRecordingStart(null);
      currentTicks.current = [];
      return;
    }
    const session: Session = {
      id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      participantNum: currentParticipantNum!,
      startTime: recordingStart!,
      endTime: Date.now(),
      ticks,
      isDemo: useMock,
    };
    setSessions((prev) => [...prev, session]);
    setLastParticipantNum(currentParticipantNum!);
    setJustSaved(session);
    setPhase("done");
    setRecordingStart(null);
    currentTicks.current = [];
  };

  const recordNext = () => {
    setJustSaved(null);
    setCurrentParticipantNum(null);
    startRecording();
  };

  const backToIdle = () => {
    setJustSaved(null);
    setCurrentParticipantNum(null);
    setPhase("idle");
  };

  const requestRecalibration = () => {
    if (useMock) {
      setToast("Recalibration requires live server");
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "recalibrate" }));
      setCalib(false);
      setCalDone({});
      setPhase("calibrating");
      setToast("Recalibration requested");
    } else {
      setToast("Not connected to server");
    }
  };

  const deleteAll = () => {
    if (!confirm("Delete all recorded sessions? This cannot be undone.")) return;
    setSessions([]);
    setLastParticipantNum(0);
    setShowSessions(false);
  };

  // ── Rendering ─────────────────────────────────────────────────────────────
  const cfg = STATES[state] || STATES.connecting;
  const dominant = scores[state as StateKey] ?? 0;
  const realSessions = sessions.filter((s) => !s.isDemo);

  // Bg color by phase
  const bg = phase === "recording" || phase === "done"
    ? (cfg.bg || "#060c09")
    : phase === "calibrating" ? "#0d0800"
    : "#060c09";

  return (
    <div style={{
      minHeight: "100dvh", background: bg,
      display: "flex", justifyContent: "center", transition: "background 1.2s ease",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        @keyframes pulse-rtm { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
        @keyframes ripple-rtm { 0% { transform: scale(1); opacity: 0.5 } 100% { transform: scale(1.8); opacity: 0 } }
        @keyframes fadein { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        .rtm-scroll::-webkit-scrollbar { width: 3px }
        .rtm-scroll::-webkit-scrollbar-track { background: #060c09 }
        .rtm-scroll::-webkit-scrollbar-thumb { background: #1a3a20; border-radius: 2px }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 460, minHeight: "100dvh",
        display: "flex", flexDirection: "column",
        fontFamily: "'DM Mono',monospace", background: "transparent",
      }}>
        {/* Header */}
        <div style={{ padding: "36px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#1e4a2a" }}>AORA · LAUNCH EVENT</div>
            <div style={{
              fontSize: 9, letterSpacing: 2, marginTop: 2,
              color: wsConnected ? "#1e6a3a" : useMock ? "#5a4a20" : "#1a2a18",
            }}>
              {wsConnected
                ? calibrated ? "GANGLION · READY" : "GANGLION · CALIBRATING"
                : useMock ? "SIMULATED DATA" : "WAITING FOR SERVER..."}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setUseMock((m) => !m)} style={{
              fontSize: 8, letterSpacing: 1, padding: "3px 8px", borderRadius: 4, cursor: "pointer",
              background: useMock ? "rgba(255,160,64,0.12)" : "rgba(255,255,255,0.03)",
              border: useMock ? "1px solid rgba(255,160,64,0.35)" : "1px solid #0d2018",
              color: useMock ? "#ffa040" : "#1e4a2a",
            }}>{useMock ? "DEMO ON" : "DEMO"}</button>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: wsConnected ? cfg.color : useMock ? "#ffa040" : "#1a2a20",
              boxShadow: wsConnected ? `0 0 8px ${cfg.color}70` : "none",
              animation: (wsConnected || useMock) ? "pulse-rtm 2.5s infinite" : "none",
              transition: "background 0.6s",
            }} />
          </div>
        </div>

        {/* ── IDLE screen ── */}
        {phase === "idle" && (
          <div style={{ padding: "32px 24px 0", flex: 1, display: "flex", flexDirection: "column", animation: "fadein 0.4s ease" }}>
            <div style={{
              padding: "20px 18px", borderRadius: 14,
              background: calibrated || useMock ? "rgba(0,232,160,0.05)" : "rgba(255,160,64,0.06)",
              border: calibrated || useMock ? "1px solid rgba(0,232,160,0.25)" : "1px solid rgba(255,160,64,0.25)",
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#2a5a3a" }}>STATUS</div>
                  <div style={{
                    fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: 2,
                    color: calibrated || useMock ? "#00e8a0" : "#ffa040", marginTop: 2,
                  }}>
                    {calibrated || useMock ? "READY TO RECORD" : "NEEDS CALIBRATION"}
                  </div>
                </div>
                <div style={{ fontSize: 32 }}>{calibrated || useMock ? "✓" : "◌"}</div>
              </div>
              <div style={{ fontSize: 9, color: "#4a8a60", lineHeight: 1.7 }}>
                {calibrated ? "Calibration complete. Fit headset, ensure good contact, then start." : useMock ? "Demo mode — simulated data for testing the flow." : "Waiting for calibration to finish (~2 min on first connect)."}
              </div>
            </div>

            {/* Live preview (small) */}
            {(calibrated || useMock) && (
              <div style={{
                padding: "12px 16px", borderRadius: 12, marginBottom: 16,
                background: "rgba(255,255,255,0.02)", border: "1px solid #0d2018",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 9, letterSpacing: 2, color: "#2a5a3a" }}>LIVE PREVIEW</span>
                  <span style={{ fontSize: 9, color: cfg.color, letterSpacing: 2 }}>{cfg.emoji} {cfg.label}</span>
                </div>
                <ScoreBar label="RELAXATION" value={scores.relaxation} color={STATES.relaxation.color} active={state === "relaxation"} />
                <ScoreBar label="CONCENTRATION" value={scores.concentration} color={STATES.concentration.color} active={state === "concentration"} />
                <ScoreBar label="STRESS" value={scores.stress} color={STATES.stress.color} active={state === "stress"} />
              </div>
            )}

            <button onClick={startRecording} disabled={!calibrated && !useMock} style={{
              width: "100%", padding: "18px 0", borderRadius: 14, cursor: (calibrated || useMock) ? "pointer" : "not-allowed",
              background: (calibrated || useMock) ? "rgba(0,232,160,0.12)" : "rgba(255,255,255,0.02)",
              border: (calibrated || useMock) ? "1px solid rgba(0,232,160,0.45)" : "1px solid #0d2018",
              color: (calibrated || useMock) ? "#00e8a0" : "#1e4a2a",
              fontSize: 13, letterSpacing: 3, fontFamily: "'Syne',sans-serif", fontWeight: 800,
              boxShadow: (calibrated || useMock) ? "0 0 20px rgba(0,232,160,0.15)" : "none",
              marginBottom: 12,
            }}>
              ▶  START NEW RECORDING
            </button>

            <div style={{ fontSize: 9, color: "#2a5a3a", textAlign: "center", letterSpacing: 2, marginBottom: 16 }}>
              NEXT: PARTICIPANT #{lastParticipantNum + 1}
            </div>

            {/* Secondary actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => setShowSessions(true)} style={{
                padding: "10px 0", borderRadius: 10, cursor: "pointer",
                background: "rgba(255,255,255,0.02)", border: "1px solid #0d2018",
                color: "#4a8a60", fontSize: 9, letterSpacing: 2,
              }}>
                VIEW SESSIONS ({sessions.length})
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => exportAllCSV(sessions)} disabled={sessions.length === 0} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, cursor: sessions.length ? "pointer" : "not-allowed",
                  background: "rgba(0,232,160,0.04)", border: "1px solid rgba(0,232,160,0.15)",
                  color: sessions.length ? "#00e8a0" : "#1e4a2a", fontSize: 8, letterSpacing: 2, opacity: sessions.length ? 1 : 0.4,
                }}>↓ ALL CSV</button>
                <button onClick={() => exportSummaryCSV(sessions)} disabled={sessions.length === 0} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, cursor: sessions.length ? "pointer" : "not-allowed",
                  background: "rgba(0,232,160,0.04)", border: "1px solid rgba(0,232,160,0.15)",
                  color: sessions.length ? "#00e8a0" : "#1e4a2a", fontSize: 8, letterSpacing: 2, opacity: sessions.length ? 1 : 0.4,
                }}>↓ SUMMARY CSV</button>
              </div>
              <button onClick={requestRecalibration} style={{
                padding: "10px 0", borderRadius: 10, cursor: "pointer",
                background: "rgba(255,160,64,0.04)", border: "1px solid rgba(255,160,64,0.15)",
                color: "#ffa040", fontSize: 8, letterSpacing: 2,
              }}>
                ⟳ RE-CALIBRATE
              </button>
            </div>

            <div style={{ flex: 1 }} />
          </div>
        )}

        {/* ── CALIBRATION screen ── */}
        {phase === "calibrating" && (
          <div style={{ padding: "20px 0 0", flex: 1, display: "flex", flexDirection: "column", animation: "fadein 0.4s ease" }}>
            <CalScreen calPhase={calPhase} calProgress={calProgress} calDone={calDone} calSamples={calSamples} audioEnabled={audioEnabled} setAudioEnabled={setAudioEnabled} />
          </div>
        )}

        {/* ── CONNECTING screen ── */}
        {phase === "connecting" && !useMock && (
          <div style={{ padding: "60px 24px 0", flex: 1, textAlign: "center", animation: "fadein 0.4s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse-rtm 1.8s infinite" }}>◯</div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#2a5a3a", marginBottom: 8 }}>WAITING FOR SERVER</div>
            <div style={{ fontSize: 9, color: "#1a3a20", letterSpacing: 1, lineHeight: 1.8 }}>
              Start the EEG server:<br />
              <code style={{ color: "#3a7a50", fontSize: 10 }}>python eeg_server.py</code>
            </div>
            <div style={{ fontSize: 8, color: "#1a2a20", marginTop: 16 }}>Retrying every 2s...</div>
          </div>
        )}

        {/* ── RECORDING screen ── */}
        {phase === "recording" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "fadein 0.4s ease" }}>
            {/* Participant + timer */}
            <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: "#2a5a3a" }}>NOW RECORDING</div>
                <div style={{
                  fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: 2,
                  color: "#ff6060", marginTop: 2,
                }}>
                  PARTICIPANT #{currentParticipantNum}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: "#2a5a3a" }}>⏱ ELAPSED</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#00e8a0" }}>
                  {String(Math.floor(elapsedSec / 60)).padStart(2, "0")}:{String(elapsedSec % 60).padStart(2, "0")}
                </div>
              </div>
            </div>

            {/* Arc */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 24px 0" }}>
              <div style={{ position: "relative", width: 240, height: 210 }}>
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)", width: 160, height: 160, borderRadius: "50%",
                  background: `${cfg.color}16`, filter: "blur(30px)",
                  transition: "background 1s", pointerEvents: "none",
                }} />
                <Arc value={dominant} color={cfg.color} />
                <div style={{
                  position: "absolute", top: "44%", left: "50%",
                  transform: "translate(-50%,-50%)", textAlign: "center",
                }}>
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)", width: 56, height: 56,
                    borderRadius: "50%", border: `1px solid ${cfg.color}40`,
                    animation: "ripple-rtm 2.4s ease-out infinite",
                  }} />
                  <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 7 }}>{cfg.emoji}</div>
                  <div style={{
                    fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800,
                    color: cfg.color, letterSpacing: -0.5,
                    textShadow: `0 0 20px ${cfg.color}50`, transition: "color 0.5s",
                  }}>
                    {`${Math.round(dominant * 100)}%`}
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: 2, padding: "8px 20px", borderRadius: 24,
                background: `${cfg.color}10`, border: `1px solid ${cfg.color}28`, transition: "all 0.5s",
              }}>
                <div style={{
                  fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800,
                  letterSpacing: 3, color: cfg.color, textShadow: `0 0 10px ${cfg.color}50`,
                }}>
                  {cfg.label}
                </div>
              </div>
            </div>

            {/* Score bars */}
            <div style={{ padding: "20px 24px 0" }}>
              <div style={{ fontSize: 9, color: "#1a3a20", letterSpacing: 2, marginBottom: 12 }}>
                STATE SCORES {calibrated ? "· CALIBRATED" : "· ESTIMATED"}
              </div>
              <ScoreBar label="RELAXATION" value={scores.relaxation} color={STATES.relaxation.color} active={state === "relaxation"} />
              <ScoreBar label="CONCENTRATION" value={scores.concentration} color={STATES.concentration.color} active={state === "concentration"} />
              <ScoreBar label="STRESS" value={scores.stress} color={STATES.stress.color} active={state === "stress"} />
            </div>

            {/* Sparkline */}
            {history.length > 4 && (
              <div style={{ padding: "16px 24px 0" }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 9, color: "#1a3a20", letterSpacing: 2, marginBottom: 8,
                }}>
                  <span>HISTORY</span>
                  <span style={{ color: cfg.color }}>{Math.round(dominant * 100)}%</span>
                </div>
                <Spark history={history} color={cfg.color} />
              </div>
            )}

            <div style={{ flex: 1 }} />

            {/* Stop button */}
            <div style={{ padding: "16px 24px max(24px, env(safe-area-inset-bottom))" }}>
              <button onClick={stopAndSave} style={{
                width: "100%", padding: "16px 0", borderRadius: 14, cursor: "pointer",
                background: "rgba(255,96,96,0.12)", border: "1px solid rgba(255,96,96,0.45)",
                color: "#ff6060", fontSize: 12, letterSpacing: 3,
                fontFamily: "'Syne',sans-serif", fontWeight: 800,
                boxShadow: "0 0 16px rgba(255,96,96,0.15)",
              }}>
                ■  STOP & SAVE
              </button>
              <div style={{ textAlign: "center", fontSize: 8, color: "#2a5a3a", marginTop: 8, letterSpacing: 2 }}>
                {currentTicks.current.length} READINGS CAPTURED
              </div>
            </div>
          </div>
        )}

        {/* ── DONE screen ── */}
        {phase === "done" && justSaved && (() => {
          const sm = sessionSummary(justSaved);
          const domCfg = (sm.dominant && STATES[sm.dominant]) || STATES.idle;
          return (
            <div style={{ padding: "32px 24px 0", flex: 1, display: "flex", flexDirection: "column", animation: "fadein 0.5s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#00e8a0" }}>SAVED</div>
                <div style={{
                  fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800,
                  color: "#00e8a0", letterSpacing: 2, marginTop: 6,
                }}>
                  PARTICIPANT #{justSaved.participantNum}
                </div>
              </div>

              <div style={{
                padding: "18px 18px", borderRadius: 14, marginBottom: 14,
                background: `${domCfg.color}10`, border: `1px solid ${domCfg.color}30`,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{ fontSize: 40 }}>{domCfg.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: "#2a5a3a", letterSpacing: 2, marginBottom: 4 }}>DOMINANT STATE</div>
                  <div style={{
                    fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800,
                    color: domCfg.color, letterSpacing: 2,
                  }}>
                    {domCfg.label}
                  </div>
                  <div style={{ fontSize: 9, color: "#2a5a3a", marginTop: 2 }}>
                    {sm.dominant ? sm.pct(sm.dominant) : 0}% of the time
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: "#1a3a20", letterSpacing: 2, marginBottom: 10 }}>
                  BREAKDOWN · {fmtDuration(sm.durationSec)} · {sm.totalTicks} READINGS
                </div>
                <ScoreBar label="RELAXATION" value={sm.pct("relaxation") / 100} color={STATES.relaxation.color} active={sm.dominant === "relaxation"} />
                <ScoreBar label="CONCENTRATION" value={sm.pct("concentration") / 100} color={STATES.concentration.color} active={sm.dominant === "concentration"} />
                <ScoreBar label="STRESS" value={sm.pct("stress") / 100} color={STATES.stress.color} active={sm.dominant === "stress"} />
              </div>

              {/* Mini timeline */}
              {justSaved.ticks.length > 3 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 9, color: "#1a3a20", letterSpacing: 2, marginBottom: 8 }}>TIMELINE</div>
                  <div style={{ display: "flex", height: 20, borderRadius: 6, overflow: "hidden", gap: 1 }}>
                    {justSaved.ticks.map((t, i) => (
                      <div key={i} style={{
                        flex: 1, background: STATES[t.state]?.color || "#2a5a3a", opacity: 0.7,
                      }} />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ flex: 1 }} />

              <div style={{ padding: "0 0 24px" }}>
                <button onClick={recordNext} disabled={!calibrated && !useMock} style={{
                  width: "100%", padding: "16px 0", borderRadius: 14, cursor: "pointer",
                  background: "rgba(0,232,160,0.12)", border: "1px solid rgba(0,232,160,0.45)",
                  color: "#00e8a0", fontSize: 12, letterSpacing: 3,
                  fontFamily: "'Syne',sans-serif", fontWeight: 800,
                  boxShadow: "0 0 16px rgba(0,232,160,0.15)", marginBottom: 10,
                }}>
                  ▶  RECORD NEXT PERSON
                </button>
                <button onClick={backToIdle} style={{
                  width: "100%", padding: "10px 0", borderRadius: 10, cursor: "pointer",
                  background: "rgba(255,255,255,0.02)", border: "1px solid #0d2018",
                  color: "#4a8a60", fontSize: 9, letterSpacing: 2,
                }}>
                  BACK TO IDLE
                </button>
              </div>
            </div>
          );
        })()}

        {/* Bottom spacer */}
        {phase !== "done" && phase !== "recording" && phase !== "idle" && <div style={{ flex: 1 }} />}

        {/* Bottom footer (not shown during done/idle/recording) */}
        {phase === "calibrating" && (
          <div style={{ padding: "16px 24px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#2a5a3a", letterSpacing: 1, lineHeight: 1.8 }}>
              Sit still · follow the guide · ~2 min total
            </div>
          </div>
        )}
      </div>

      {/* Sessions modal */}
      {showSessions && (
        <SessionsModal sessions={sessions} onClose={() => setShowSessions(false)} onDeleteAll={deleteAll} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          padding: "10px 18px", borderRadius: 10, zIndex: 200,
          background: "rgba(0,0,0,0.9)", border: "1px solid #1a3a20",
          color: "#00e8a0", fontSize: 10, letterSpacing: 2,
          fontFamily: "'DM Mono',monospace", animation: "fadein 0.2s ease",
        }}>
          {toast}
        </div>
      )}

      {/* Suppress unused var warning for realSessions (reserved for future use) */}
      <div style={{ display: "none" }}>{realSessions.length}</div>
    </div>
  );
}
