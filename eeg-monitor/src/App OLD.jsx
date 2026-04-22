import { useState, useEffect, useRef } from "react";

// ── Arc gauge ──────────────────────────────────────────────────────────────
function StressArc({ norm }) {
  const R = 90, cx = 120, cy = 130;
  const startAngle = Math.PI * 0.75;
  const endAngle   = Math.PI * 2.25;
  const fillAngle  = startAngle + (endAngle - startAngle) * Math.min(Math.max(norm, 0), 1);

  const arc = a => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  const s = arc(startAngle), e = arc(fillAngle), tip = arc(fillAngle);
  const trackEnd = arc(endAngle);
  const large = fillAngle - startAngle > Math.PI ? 1 : 0;

  const color = norm < 0.4
    ? "#00e8a0"
    : norm < 0.7
    ? `rgb(${Math.round(norm * 2 * 255)},${Math.round(232 - norm * 200)},${Math.round(160 - norm * 160)})`
    : `rgb(255,${Math.round(Math.max(40, 164 - (norm - 0.7) * 400))},60)`;

  const trackPath = `M ${s.x} ${s.y} A ${R} ${R} 0 1 1 ${trackEnd.x} ${trackEnd.y}`;
  const fillPath  = norm < 0.01 ? "" :
    `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;

  return (
    <svg width={240} height={200} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#00e8a0" />
          <stop offset="50%"  stopColor="#ffa040" />
          <stop offset="100%" stopColor="#ff4a4a" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
      {fillPath && (
        <path d={fillPath} fill="none" stroke="url(#arcGrad)" strokeWidth="10" strokeLinecap="round" filter="url(#glow)" />
      )}
      {norm > 0.01 && (
        <>
          <circle cx={tip.x} cy={tip.y} r={10} fill={color} opacity={0.2} />
          <circle cx={tip.x} cy={tip.y} r={5}  fill={color} filter="url(#glow)" />
        </>
      )}
    </svg>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────
function Spark({ history, color }) {
  if (history.length < 2) return null;
  const W = 200, H = 32;
  const max = Math.max(...history, 0.01), min = Math.min(...history, 0);
  const ny = v => H - ((v - min) / (max - min + 0.001)) * (H - 4) - 2;
  const pts = history.map((v, i) => `${(i / (history.length - 1)) * W},${ny(v)}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke="url(#sg)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={W} cy={ny(history[history.length - 1])} r="2.5" fill={color} />
    </svg>
  );
}

// ── Band bar (relative power visualisation) ────────────────────────────────
function BandBar({ label, value, max, color }) {
  const pct = Math.min((value / (max + 0.001)) * 100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 8, color: "#2a5a3a", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color,
                      borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ fontSize: 8, color, marginTop: 2 }}>{(value * 100).toFixed(1)}%</div>
    </div>
  );
}

// ── Signal quality dot ─────────────────────────────────────────────────────
function QualityDot({ coherence, artifactPct }) {
  const good = coherence > 0.5 && artifactPct < 30;
  const fair = coherence > 0.3 || artifactPct < 50;
  const c    = good ? "#00e8a0" : fair ? "#ffa040" : "#ff4a4a";
  const lbl  = good ? "GOOD" : fair ? "FAIR" : "POOR";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: c,
                    boxShadow: `0 0 6px ${c}` }} />
      <span style={{ fontSize: 8, color: c, letterSpacing: 1 }}>{lbl}</span>
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────
const WS_URL  = "ws://localhost:8765";
const CAL_SECS = 30;

export default function App() {
  const [phase,        setPhase]        = useState("idle");
  const [stressNorm,   setStressNorm]   = useState(0);
  const [history,      setHistory]      = useState([]);
  const [relaxedVal,   setRelaxedVal]   = useState(null);
  const [stressedVal,  setStressedVal]  = useState(null);
  const [calProgress,  setCalProgress]  = useState(0);
  const [connected,    setConnected]    = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [coherence,    setCoherence]    = useState(0);
  const [artifactPct,  setArtifactPct]  = useState(0);
  const [bands,        setBands]        = useState(null);   // {rel_theta, rel_alpha, rel_beta, ta_ratio}
  const [calEpochs,    setCalEpochs]    = useState({ relaxed: null, stressed: null });

  const wsRef         = useRef(null);
  const calStartRef   = useRef(null);
  const calTimerRef   = useRef(null);

  // ── WebSocket ────────────────────────────────────────────────────────────
  useEffect(() => {
    let ws, reconnect;

    const connect = () => {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen  = () => setConnected(true);
      ws.onerror = () => ws.close();
      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        reconnect = setTimeout(connect, 2000);
      };

      ws.onmessage = ({ data }) => {
        let msg;
        try { msg = JSON.parse(data); } catch { return; }

        switch (msg.type) {

          case "status":
            if (msg.phase === "cal_relaxed" || msg.phase === "cal_stressed") {
              setPhase(msg.phase === "cal_relaxed" ? "relaxed_cal" : "stressed_cal");
              setCalProgress(0);
              calStartRef.current = Date.now();
              clearInterval(calTimerRef.current);
              calTimerRef.current = setInterval(() => {
                const elapsed = (Date.now() - calStartRef.current) / 1000;
                setCalProgress(Math.min(elapsed / CAL_SECS, 1));
              }, 200);
            } else if (msg.phase === "live") {
              clearInterval(calTimerRef.current);
              setCalProgress(1);
              setPhase("live");
            }
            break;

          case "calibration":
            setCalEpochs(prev => ({
              ...prev,
              [msg.state]: msg.n_epochs,
            }));
            if (msg.state === "relaxed")  setRelaxedVal(msg.ta_mean);
            if (msg.state === "stressed") setStressedVal(msg.ta_mean);
            break;

          case "threshold":
            setRelaxedVal(msg.relaxed);
            setStressedVal(msg.stressed);
            break;

          case "data": {
            const { index, status, coherence: coh, artifact_pct, bands: b } = msg;
            setStressNorm(index);
            if (status !== "artifact") setServerStatus(status);
            setCoherence(coh ?? 0);
            setArtifactPct(artifact_pct ?? 0);
            if (b) setBands(b);
            if (status !== "artifact") {
              setHistory(prev => [...prev.slice(-80), index]);
            }
            break;
          }
        }
      };
    };

    connect();
    return () => {
      clearTimeout(reconnect);
      clearInterval(calTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  // ── Derived display values ────────────────────────────────────────────────
  const status = phase === "live" && serverStatus
    ? serverStatus
    : phase === "relaxed_cal"  ? "cal_relaxed"
    : phase === "stressed_cal" ? "cal_stressed"
    : "idle";

  const statusMeta = {
    normal:       { label: "CALM",     sub: "You're in a good place",       color: "#00e8a0", emoji: "🧠" },
    high:         { label: "HIGH",     sub: "Elevated cognitive load",       color: "#ffa040", emoji: "🔥" },
    overload:     { label: "OVERLOAD", sub: "Take a breath",                 color: "#ff4a4a", emoji: "⚠️" },
    cal_relaxed:  { label: "RELAX",    sub: "Capturing relaxed baseline…",   color: "#5588ff", emoji: "😌" },
    cal_stressed: { label: "STRESS",   sub: "Capturing stressed baseline…",  color: "#ffa040", emoji: "😤" },
    idle:         { label: "READY",    sub: "Waiting for server…",           color: "#3a6a50", emoji: "◯"  },
  };

  const { label, sub, color, emoji } = statusMeta[status] ?? statusMeta.idle;
  const pct    = Math.round(stressNorm * 100);
  const hasBaselines = relaxedVal !== null && stressedVal !== null;

  return (
    <div style={{ minHeight: "100vh", background: "#070d0a",
                  display: "flex", justifyContent: "center", alignItems: "flex-start",
                  padding: "0 0 40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(1.6);opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ width: "100%", maxWidth: 390, minHeight: "100vh", background: "#070d0a",
                    display: "flex", flexDirection: "column", fontFamily: "'DM Mono', monospace" }}>

        {/* ── Header ── */}
        <div style={{ padding: "52px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#1e4a2a", marginBottom: 2 }}>NEURAL·OS</div>
            <div style={{ fontSize: 9, color: "#1a3a20", letterSpacing: 2 }}>GANGLION · 2CH EAR EEG</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: connected
                ? (phase === "live" ? "#00e8a0" : phase.includes("cal") ? "#ffa040" : "#5588ff")
                : "#1e4a2a",
              boxShadow: connected && phase === "live" ? "0 0 8px #00e8a060" : "none",
              animation:  connected && phase === "live" ? "pulse 2s infinite" : "none",
            }} />
            {phase === "live" && (
              <QualityDot coherence={coherence} artifactPct={artifactPct} />
            )}
          </div>
        </div>

        {/* ── Arc gauge ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                      padding: "24px 28px 0", animation: "fadeUp 0.6s ease" }}>
          <div style={{ position: "relative", width: 240, height: 200 }}>
            <StressArc norm={stressNorm} />
            <div style={{ position: "absolute", top: "50%", left: "50%",
                          transform: "translate(-50%, -42%)", textAlign: "center" }}>
              {phase === "live" && (
                <div style={{ position: "absolute", top: "50%", left: "50%",
                              transform: "translate(-50%,-50%)", width: 60, height: 60,
                              borderRadius: "50%", border: `1px solid ${color}`,
                              animation: "ripple 2s ease-out infinite" }} />
              )}
              <div style={{ fontSize: 34, lineHeight: 1, marginBottom: 6 }}>{emoji}</div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: hasBaselines ? 38 : 18,
                fontWeight: 800, color, lineHeight: 1,
                textShadow: `0 0 24px ${color}50`,
                letterSpacing: hasBaselines ? -1 : 2,
                transition: "all 0.4s ease",
              }}>
                {hasBaselines ? `${pct}%` : label}
              </div>
              {hasBaselines && (
                <div style={{ fontSize: 10, color: "#3a6a50", letterSpacing: 2, marginTop: 4 }}>STRESS</div>
              )}
            </div>
          </div>

          {/* Status pill */}
          <div style={{ marginTop: 8, padding: "6px 18px", borderRadius: 20,
                        background: `${color}12`, border: `1px solid ${color}30`,
                        display: "flex", alignItems: "center", gap: 8 }}>
            {phase.includes("cal") && (
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color,
                            animation: "pulse 0.8s infinite" }} />
            )}
            <span style={{ fontSize: 10, color, letterSpacing: 2 }}>{sub}</span>
          </div>

          {/* Calibration progress bar */}
          {phase.includes("cal") && (
            <div style={{ width: "100%", marginTop: 16, padding: "0 4px" }}>
              <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1 }}>
                <div style={{ height: "100%", width: `${calProgress * 100}%`, background: color,
                              borderRadius: 1, transition: "width 0.5s linear",
                              boxShadow: `0 0 6px ${color}` }} />
              </div>
              <div style={{ fontSize: 9, color: "#2a5a3a", marginTop: 6, textAlign: "right" }}>
                {Math.round(calProgress * CAL_SECS)}s / {CAL_SECS}s
              </div>
            </div>
          )}
        </div>

        {/* ── Sparkline ── */}
        {history.length > 4 && (
          <div style={{ padding: "20px 28px 0", animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: "#1e4a2a", letterSpacing: 2 }}>HISTORY</span>
              <span style={{ fontSize: 9, color: "#2a5a3a" }}>
                {bands ? `θ/α ${bands.ta_ratio?.toFixed(3)}` : ""}
              </span>
            </div>
            <Spark history={history} color={color} />
          </div>
        )}

        {/* ── Band breakdown ── */}
        {phase === "live" && bands && (
          <div style={{ padding: "16px 28px 0", animation: "fadeUp 0.4s ease" }}>
            <div style={{ fontSize: 9, color: "#1e4a2a", letterSpacing: 2, marginBottom: 8 }}>
              BAND POWER
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <BandBar label="θ THETA"  value={bands.rel_theta ?? 0} max={0.5} color="#5588ff" />
              <BandBar label="α ALPHA"  value={bands.rel_alpha ?? 0} max={0.5} color="#00e8a0" />
              <BandBar label="β BETA"   value={bands.rel_beta  ?? 0} max={0.5} color="#ffa040" />
            </div>
            {/* Signal quality row */}
            <div style={{ display: "flex", justifyContent: "space-between",
                          marginTop: 10, fontSize: 8, color: "#1e4a2a" }}>
              <span>COH {(coherence * 100).toFixed(0)}%</span>
              <span>ART {artifactPct.toFixed(0)}% rejected</span>
            </div>
          </div>
        )}

        {/* ── Baselines ── */}
        {hasBaselines && (
          <div style={{ padding: "16px 28px 0", display: "flex", gap: 10 }}>
            {[
              { icon: "😌", lbl: "RELAXED",   val: relaxedVal,
                sub2: calEpochs.relaxed  ? `${calEpochs.relaxed}ep`  : "", color: "#00e8a0" },
              { icon: "😤", lbl: "STRESSED",  val: stressedVal,
                sub2: calEpochs.stressed ? `${calEpochs.stressed}ep` : "", color: "#ffa040" },
            ].map(({ icon, lbl, val, sub2, color: c }) => (
              <div key={lbl} style={{ flex: 1, background: "rgba(255,255,255,0.02)",
                                      border: "1px solid #0d2018", borderRadius: 10,
                                      padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 10, color: c, fontWeight: "bold" }}>
                  {val.toFixed(3)}
                </div>
                <div style={{ fontSize: 8, color: "#1e4a2a", letterSpacing: 1, marginTop: 2 }}>{lbl}</div>
                {sub2 && <div style={{ fontSize: 7, color: "#1a3a20", marginTop: 1 }}>{sub2}</div>}
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* ── Controls ── */}
        <div style={{ padding: "28px 28px 0" }}>
          {!connected && (
            <div style={{ textAlign: "center", padding: "14px 0" }}>
              <div style={{ fontSize: 11, color: "#1e4a2a", letterSpacing: 2,
                            animation: "pulse 1.5s infinite" }}>
                Connecting to server…
              </div>
            </div>
          )}
          {phase === "relaxed_cal" && (
            <div style={{ textAlign: "center", padding: "14px 0" }}>
              <div style={{ fontSize: 11, color: "#5588ff", letterSpacing: 2,
                            animation: "pulse 1.2s infinite" }}>
                Close eyes · breathe slowly
              </div>
            </div>
          )}
          {phase === "stressed_cal" && (
            <div style={{ textAlign: "center", padding: "14px 0" }}>
              <div style={{ fontSize: 11, color: "#ffa040", letterSpacing: 2,
                            animation: "pulse 0.8s infinite" }}>
                Mental math · 847 × 19
              </div>
            </div>
          )}
          {phase === "live" && connected && (
            <div style={{ textAlign: "center", fontSize: 9, color: "#1e4a2a",
                          letterSpacing: 2, padding: "10px 0" }}>
              LIVE · θ/α INDEX · EMG-CLEANED
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
