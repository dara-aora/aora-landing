import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATES = {
  relaxation:    { label:"RELAXED",    emoji:"🌊", color:"#00e8a0", bg:"#00140d" },
  concentration: { label:"FOCUSED",   emoji:"🎯", color:"#5b8fff", bg:"#000d1a" },
  stress:        { label:"STRESSED",  emoji:"⚡", color:"#ff6060", bg:"#1a0000" },
  connecting:    { label:"CONNECTING",emoji:"◯",  color:"#2a5a3a", bg:"#060c09" },
  calibrating:   { label:"CALIBRATING",emoji:"◌", color:"#ffa040", bg:"#0d0800" },
  warming_up:    { label:"WARMING UP",emoji:"◌",  color:"#5b8fff", bg:"#060c09" },
};

const CAL_SEQUENCE = [
  { key:"relaxation",    label:"RELAXED",  emoji:"🌊", color:"#00e8a0",
    instruction:"Close your eyes · breathe slowly · clear your mind completely",
    visual:"🌿", visualLabel:"Forest · Ocean · Peace",
    breatheIn:4, breatheOut:6 },
  { key:"concentration", label:"FOCUSED",  emoji:"🎯", color:"#5b8fff",
    instruction:"Eyes open · solve 300−7−7−7... keep going · stay locked in",
    visual:"🔢", visualLabel:"Numbers · Logic · Precision",
    breatheIn:4, breatheOut:4 },
  { key:"stress",        label:"STRESSED", emoji:"⚡", color:"#ff6060",
    instruction:"Feel a real deadline · heart racing · pressure building now",
    visual:"⏱", visualLabel:"Deadline · Urgency · Tension",
    breatheIn:2, breatheOut:2 },
];

// ── Web Audio — generative ambient per state ──────────────────────────────────
class AmbientAudio {
  constructor() { this.ctx = null; this.nodes = []; this.active = false; }

  start(state) {
    this.stop();
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.nodes = [];
      this.active = true;
      const configs = {
        relaxation:    { freqs:[110,165,220,330], type:"sine",   gain:0.04, lfoRate:0.08 },
        concentration: { freqs:[200,300,400],     type:"square", gain:0.02, lfoRate:0.4  },
        stress:        { freqs:[180,270,360,450], type:"sawtooth",gain:0.025,lfoRate:1.2 },
        calibrating:   { freqs:[220,440],         type:"sine",   gain:0.03, lfoRate:0.15 },
      };
      const cfg = configs[state] || configs.relaxation;
      cfg.freqs.forEach((freq, i) => {
        const osc  = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const lfo  = this.ctx.createOscillator();
        const lfoG = this.ctx.createGain();
        osc.type      = cfg.type;
        osc.frequency.value = freq + i * 2;
        lfo.frequency.value = cfg.lfoRate + i * 0.03;
        lfoG.gain.value     = freq * 0.01;
        gain.gain.value     = cfg.gain / cfg.freqs.length;
        lfo.connect(lfoG); lfoG.connect(osc.frequency);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); lfo.start();
        this.nodes.push(osc, lfo);
      });
    } catch(e) { console.warn("Audio unavailable:", e); }
  }

  stop() {
    this.nodes.forEach(n => { try { n.stop(); } catch(e){} });
    this.nodes = [];
    if (this.ctx) { try { this.ctx.close(); } catch(e){} this.ctx = null; }
    this.active = false;
  }

  setVolume(v) {
    if (!this.ctx) return;
    this.ctx.destination.channelInterpretation = "discrete";
  }
}

// ── Voice cue ─────────────────────────────────────────────────────────────────
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85; u.pitch = 0.9; u.volume = 0.8;
  window.speechSynthesis.speak(u);
}

// ── Breathing pacer ───────────────────────────────────────────────────────────
function BreathPacer({ inSec, outSec, color, active }) {
  const [phase, setPhase] = useState("inhale");
  const [progress, setProgress] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return;
    let start = null;
    let currentPhase = "inhale";
    const duration = () => currentPhase === "inhale" ? inSec * 1000 : outSec * 1000;

    const tick = (ts) => {
      if (!start) start = ts;
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
    return () => cancelAnimationFrame(ref.current);
  }, [active, inSec, outSec]);

  const size = 56 + progress * (phase === "inhale" ? 24 : -24) * (active ? 1 : 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{
        width:size, height:size, borderRadius:"50%",
        background:`${color}20`, border:`1.5px solid ${color}50`,
        transition:"width 0.1s linear, height 0.1s linear",
        boxShadow:`0 0 ${12 + progress*16}px ${color}40`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{ width:size*0.35, height:size*0.35, borderRadius:"50%",
          background:color, opacity:0.6 }}/>
      </div>
      <div style={{ fontSize:8, color, letterSpacing:2, opacity:0.7 }}>
        {phase === "inhale" ? `INHALE ${inSec}s` : `EXHALE ${outSec}s`}
      </div>
    </div>
  );
}

// ── Arc gauge ─────────────────────────────────────────────────────────────────
function Arc({ value, color }) {
  const R=88, cx=120, cy=120;
  const start=Math.PI*0.75, total=Math.PI*1.5;
  const fill=start+total*Math.min(Math.max(value,0),1);
  const pt=a=>({x:cx+R*Math.cos(a),y:cy+R*Math.sin(a)});
  const s=pt(start),e=pt(fill),te=pt(start+total);
  const large=fill-start>Math.PI?1:0;
  const fp=value<0.01?null:`M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  const tip=pt(fill);
  return (
    <svg width={240} height={210} style={{overflow:"visible"}}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d={`M ${s.x} ${s.y} A ${R} ${R} 0 1 1 ${te.x} ${te.y}`}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round"/>
      {fp && <path d={fp} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" filter="url(#glow)"/>}
      {value>0.01 && <>
        <circle cx={tip.x} cy={tip.y} r={11} fill={color} opacity={0.18}/>
        <circle cx={tip.x} cy={tip.y} r={4.5} fill={color} filter="url(#glow)"/>
      </>}
    </svg>
  );
}

function ScoreBar({ label, value, color, active }) {
  return (
    <div style={{marginBottom:11}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:9,letterSpacing:2,color:active?color:"#2a5a3a",
          fontWeight:active?"bold":"normal",transition:"color 0.4s"}}>{label}</span>
        <span style={{fontSize:9,color:active?color:"#1a3a20"}}>{Math.round((value??0)*100)}%</span>
      </div>
      <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2}}>
        <div style={{height:"100%",width:`${(value??0)*100}%`,background:active?color:"#1a3a20",
          borderRadius:2,transition:"width 0.6s cubic-bezier(0.4,0,0.2,1),background 0.4s",
          boxShadow:active?`0 0 6px ${color}80`:"none"}}/>
      </div>
    </div>
  );
}

function Spark({ history, color }) {
  if (history.length < 2) return null;
  const W=280,H=28;
  const max=Math.max(...history,0.01);
  const norm=v=>H-(v/max)*(H-4)-2;
  const pts=history.map((v,i)=>`${(i/(history.length-1))*W},${norm(v)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={color} stopOpacity="0.04"/>
        <stop offset="100%" stopColor={color} stopOpacity="0.65"/>
      </linearGradient></defs>
      <polyline points={pts} fill="none" stroke="url(#sg)" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx={W} cy={norm(history[history.length-1])} r="2.5" fill={color}/>
    </svg>
  );
}

// ── Calibration screen ────────────────────────────────────────────────────────
function CalScreen({ calPhase, calProgress, calDone, calSamples, audioEnabled, setAudioEnabled }) {
  const current = CAL_SEQUENCE.find(s => s.key === calPhase?.state);
  const completed = Object.keys(calDone).length;

  return (
    <div style={{padding:"0 24px",flex:1,display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:9,color:"#2a5a3a",letterSpacing:3}}>
          CALIBRATION · {completed}/3
        </div>
        <button onClick={()=>setAudioEnabled(a=>!a)} style={{
          fontSize:8,padding:"3px 8px",borderRadius:4,cursor:"pointer",
          background:audioEnabled?"rgba(0,232,160,0.1)":"rgba(255,255,255,0.03)",
          border:audioEnabled?"1px solid rgba(0,232,160,0.3)":"1px solid #0d2018",
          color:audioEnabled?"#00e8a0":"#1e4a2a",letterSpacing:1,
        }}>{audioEnabled ? "🔊 AUDIO ON" : "🔇 AUDIO OFF"}</button>
      </div>

      {/* Active state card */}
      {current && (
        <div style={{
          borderRadius:16, padding:20,
          background:`${current.color}08`,
          border:`1px solid ${current.color}30`,
          display:"flex",flexDirection:"column",gap:14,
        }}>
          {/* Visual + emoji */}
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:4}}>{current.visual}</div>
            <div style={{fontSize:9,color:current.color,letterSpacing:2,opacity:0.7}}>
              {current.visualLabel}
            </div>
          </div>

          {/* Instruction */}
          <div style={{fontSize:10,color:"#4a8a60",lineHeight:1.8,textAlign:"center",
            padding:"0 8px"}}>
            {current.instruction}
          </div>

          {/* Breath pacer */}
          <div style={{display:"flex",justifyContent:"center"}}>
            <BreathPacer
              inSec={current.breatheIn} outSec={current.breatheOut}
              color={current.color} active={calProgress > 0 && calProgress < 1}
            />
          </div>

          {/* Progress */}
          <div>
            <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,marginBottom:6}}>
              <div style={{height:"100%",width:`${(calProgress||0)*100}%`,
                background:current.color,borderRadius:2,transition:"width 0.5s linear",
                boxShadow:`0 0 8px ${current.color}`}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",
              fontSize:9,color:"#2a5a3a"}}>
              <span>{calSamples} samples</span>
              <span>{Math.round((calProgress||0)*40)}s / 40s</span>
            </div>
          </div>
        </div>
      )}

      {/* Countdown / next state prep */}
      {calPhase?.countdown > 0 && !calProgress && (
        <div style={{textAlign:"center",padding:"12px 0"}}>
          <div style={{fontSize:28,fontWeight:800,color:"#ffa040",fontFamily:"'Syne',sans-serif"}}>
            {calPhase.countdown}
          </div>
          <div style={{fontSize:9,color:"#3a5a30",letterSpacing:2,marginTop:4}}>
            GET READY · {calPhase.label}
          </div>
        </div>
      )}

      {/* State checklist */}
      <div style={{display:"flex",gap:8}}>
        {CAL_SEQUENCE.map(s => {
          const done   = calDone[s.key];
          const active = calPhase?.state === s.key;
          return (
            <div key={s.key} style={{flex:1,padding:"10px 8px",borderRadius:10,
              textAlign:"center",
              background: done ? `${s.color}10` : active ? `${s.color}06` : "rgba(0,0,0,0.2)",
              border:`1px solid ${done?s.color+"30":active?s.color+"20":"#0a1a10"}`,
              transition:"all 0.4s"}}>
              <div style={{fontSize:18,marginBottom:4}}>{s.emoji}</div>
              <div style={{fontSize:8,letterSpacing:1,
                color:done?s.color:active?s.color+"99":"#1a3a20"}}>
                {done ? "✓ DONE" : active ? "● REC" : "NEXT"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── History / Overview tab ────────────────────────────────────────────────────
function HistoryTab({ sessions, onExport }) {
  const [range, setRange] = useState("session");

  const now   = Date.now();
  const cutoff = range === "session" ? sessions[sessions.length-1]?.startTime || now
    : range === "7d" ? now - 7*86400000
    : 0;

  const filtered = sessions.filter(s =>
    range === "session" ? s === sessions[sessions.length-1] : s.startTime >= cutoff
  );

  // Aggregate state durations
  const totals = { relaxation:0, concentration:0, stress:0 };
  let totalTicks = 0;
  filtered.forEach(s => {
    s.ticks.forEach(t => {
      totals[t.state] = (totals[t.state]||0) + 1;
      totalTicks++;
    });
  });

  const pct = s => totalTicks > 0 ? Math.round((totals[s]||0)/totalTicks*100) : 0;
  const dominant = totalTicks > 0
    ? Object.entries(totals).sort((a,b)=>b[1]-a[1])[0][0]
    : null;

  // Timeline for current session
  const latest = sessions[sessions.length-1];
  const timelineTicks = latest?.ticks.slice(-120) || [];

  const stateColor = s => STATES[s]?.color || "#2a5a3a";

  return (
    <div style={{padding:"0 24px",flex:1,overflowY:"auto"}}>
      {/* Range selector */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["session","SESSION"],["7d","7 DAYS"],["all","ALL TIME"]].map(([k,l]) => (
          <button key={k} onClick={()=>setRange(k)} style={{
            flex:1,padding:"8px 0",borderRadius:8,cursor:"pointer",fontSize:8,
            letterSpacing:2,
            background:range===k?"rgba(0,232,160,0.1)":"rgba(255,255,255,0.02)",
            border:range===k?"1px solid rgba(0,232,160,0.3)":"1px solid #0d2018",
            color:range===k?"#00e8a0":"#1e4a2a",
          }}>{l}</button>
        ))}
      </div>

      {totalTicks === 0 ? (
        <div style={{textAlign:"center",padding:"40px 0",color:"#1a3a20",fontSize:10,
          letterSpacing:2}}>NO DATA YET</div>
      ) : (
        <>
          {/* Dominant state */}
          {dominant && (
            <div style={{
              padding:"16px 18px",borderRadius:14,marginBottom:16,
              background:`${stateColor(dominant)}10`,
              border:`1px solid ${stateColor(dominant)}30`,
              display:"flex",alignItems:"center",gap:14,
            }}>
              <div style={{fontSize:32}}>{STATES[dominant].emoji}</div>
              <div>
                <div style={{fontSize:9,color:"#2a5a3a",letterSpacing:2,marginBottom:4}}>
                  DOMINANT STATE
                </div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,
                  color:stateColor(dominant),letterSpacing:2}}>
                  {STATES[dominant].label}
                </div>
                <div style={{fontSize:9,color:"#2a5a3a",marginTop:2}}>
                  {pct(dominant)}% of time · {Math.round((totals[dominant]||0)*0.5/60)}min
                </div>
              </div>
            </div>
          )}

          {/* State bars */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,color:"#1a3a20",letterSpacing:2,marginBottom:12}}>
              STATE BREAKDOWN
            </div>
            {Object.entries(STATES).filter(([k])=>['relaxation','concentration','stress'].includes(k))
              .map(([k,v]) => (
              <div key={k} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:9,letterSpacing:2,color:v.color}}>{v.label}</span>
                  <span style={{fontSize:9,color:"#2a5a3a"}}>
                    {pct(k)}% · {Math.round((totals[k]||0)*0.5/60)}m {Math.round((totals[k]||0)*0.5%60)}s
                  </span>
                </div>
                <div style={{height:6,background:"rgba(255,255,255,0.04)",borderRadius:3}}>
                  <div style={{height:"100%",width:`${pct(k)}%`,background:v.color,
                    borderRadius:3,transition:"width 0.6s ease",
                    boxShadow:`0 0 6px ${v.color}60`}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Session timeline */}
          {timelineTicks.length > 2 && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,color:"#1a3a20",letterSpacing:2,marginBottom:10}}>
                SESSION TIMELINE
              </div>
              <div style={{display:"flex",height:24,borderRadius:6,overflow:"hidden",gap:1}}>
                {timelineTicks.map((t,i) => (
                  <div key={i} style={{
                    flex:1,background:stateColor(t.state),opacity:0.7,
                    transition:"background 0.3s",
                  }}/>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",
                fontSize:8,color:"#1a3a20",marginTop:4}}>
                <span>START</span><span>NOW</span>
              </div>
            </div>
          )}

          {/* Sessions list */}
          {sessions.length > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,color:"#1a3a20",letterSpacing:2,marginBottom:10}}>
                SESSIONS ({sessions.length})
              </div>
              {sessions.slice().reverse().slice(0,5).map((s,i) => {
                const dur = s.ticks.length * 0.5;
                const dom = Object.entries(
                  s.ticks.reduce((acc,t)=>{acc[t.state]=(acc[t.state]||0)+1;return acc},{})
                ).sort((a,b)=>b[1]-a[1])[0];
                return (
                  <div key={i} style={{
                    padding:"10px 12px",borderRadius:10,marginBottom:8,
                    background:"rgba(255,255,255,0.02)",border:"1px solid #0d2018",
                    display:"flex",justifyContent:"space-between",alignItems:"center",
                  }}>
                    <div>
                      <div style={{fontSize:9,color:"#2a5a3a",marginBottom:2}}>
                        {new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString()}
                      </div>
                      <div style={{fontSize:8,color:"#1a3a20"}}>
                        {Math.floor(dur/60)}m {Math.round(dur%60)}s · {s.ticks.length} readings
                      </div>
                    </div>
                    {dom && (
                      <div style={{fontSize:11,color:stateColor(dom[0])}}>
                        {STATES[dom[0]]?.emoji}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Export */}
      <button onClick={onExport} style={{
        width:"100%",padding:"13px 0",borderRadius:12,cursor:"pointer",
        background:"rgba(0,232,160,0.06)",border:"1px solid rgba(0,232,160,0.2)",
        color:"#00e8a0",fontSize:10,letterSpacing:2,marginBottom:8,
      }}>
        ↓ DOWNLOAD CSV
      </button>
    </div>
  );
}

// ── Mock data ─────────────────────────────────────────────────────────────────
let _mt=0;
function mockData() {
  _mt+=0.5;
  const cycle=Math.floor((_mt/20)%3);
  const n=(Math.random()-0.5)*0.08;
  const sets=[
    {relaxation:0.62+n,concentration:0.28+n,stress:0.18+n},
    {relaxation:0.20+n,concentration:0.65+n,stress:0.24+n},
    {relaxation:0.15+n,concentration:0.30+n,stress:0.72+n},
  ];
  const scores={};
  for(const [k,v] of Object.entries(sets[cycle]))
    scores[k]=Math.max(0,Math.min(1,v));
  const state=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
  return {state,scores,calibrated:true};
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(sessions) {
  const rows = ["timestamp,session,state,relaxation,concentration,stress"];
  sessions.forEach((s, si) => {
    s.ticks.forEach(t => {
      rows.push([
        new Date(t.ts).toISOString(), si+1, t.state,
        t.scores.relaxation?.toFixed(3),
        t.scores.concentration?.toFixed(3),
        t.scores.stress?.toFixed(3),
      ].join(","));
    });
  });
  const blob = new Blob([rows.join("\n")], { type:"text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `neural-os-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]             = useState("live");   // live | history
  const [phase, setPhase]         = useState("connecting");
  const [state, setState]         = useState("connecting");
  const [scores, setScores]       = useState({relaxation:0,concentration:0,stress:0});
  const [history, setHistory]     = useState([]);
  const [wsConnected, setWsConn]  = useState(false);
  const [useMock, setUseMock]     = useState(false);
  const [calibrated, setCalib]    = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [calPhase, setCalPhase]   = useState(null);
  const [calProgress, setCalProg] = useState(0);
  const [calSamples, setCalSamples] = useState(0);
  const [calDone, setCalDone]     = useState({});
  // Session tracking
  const [sessions, setSessions]   = useState([]);
  const currentSession            = useRef({ startTime: Date.now(), ticks: [] });
  const intervalRef               = useRef(null);
  const wsRef                     = useRef(null);
  const audioRef                  = useRef(new AmbientAudio());
  const lastState                 = useRef(null);
  const prevPhase                 = useRef(null);

  // ── Audio + voice cues on state change ───────────────────────────────────
  useEffect(() => {
    if (!audioEnabled) { audioRef.current.stop(); return; }
    if (phase === "calibrating" && calPhase?.state) {
      audioRef.current.start("calibrating");
    }
    if (phase === "live" && state !== lastState.current &&
        ["relaxation","concentration","stress"].includes(state)) {
      audioRef.current.start(state);
      if (state !== lastState.current) {
        const labels = {
          relaxation:"Relaxed", concentration:"Focused", stress:"Stressed"
        };
        speak(labels[state] || state);
      }
      lastState.current = state;
    }
  }, [state, phase, calPhase, audioEnabled]);

  // ── Record ticks to session ───────────────────────────────────────────────
  const recordTick = useCallback((s, sc) => {
    const tick = { ts: Date.now(), state: s, scores: sc };
    currentSession.current.ticks.push(tick);
  }, []);

  // ── End session + save ────────────────────────────────────────────────────
  const endSession = useCallback(() => {
    if (currentSession.current.ticks.length > 0) {
      setSessions(prev => [...prev, { ...currentSession.current }]);
      currentSession.current = { startTime: Date.now(), ticks: [] };
    }
  }, []);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let ws, reconnectTimer;
    const connect = () => {
      ws = new WebSocket("ws://localhost:8765");
      wsRef.current = ws;
      ws.onopen = () => { setWsConn(true); setUseMock(false); };
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.type === "status") {
          setPhase(msg.phase);
          if (msg.phase === "calibrating") { setState("calibrating"); setCalDone({}); }
          if (msg.phase === "live" && prevPhase.current === "calibrating") endSession();
          prevPhase.current = msg.phase;
        }
        if (msg.type === "cal_phase")    { setCalPhase(msg); setCalProg(0); setCalSamples(0);
          if(audioEnabled) speak(msg.label); }
        if (msg.type === "cal_progress") { setCalProg(msg.progress); setCalSamples(msg.samples); }
        if (msg.type === "cal_done")     { setCalDone(p=>({...p,[msg.state]:true})); }
        if (msg.type === "cal_complete") { setCalib(true); setPhase("live"); setCalPhase(null);
          if(audioEnabled) speak("Calibration complete. Starting live detection."); }
        if (msg.type === "data") {
          setPhase("live"); setState(msg.state); setScores(msg.scores);
          setCalib(msg.calibrated ?? false);
          setHistory(prev=>[...prev.slice(-80), msg.scores[msg.state]]);
          recordTick(msg.state, msg.scores);
        }
      };
      ws.onerror = () => setWsConn(false);
      ws.onclose = () => {
        setWsConn(false); setPhase("connecting");
        reconnectTimer = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => { clearTimeout(reconnectTimer); clearInterval(intervalRef.current); ws?.close(); };
  }, []);

  // ── Mock mode ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!useMock) { clearInterval(intervalRef.current); return; }
    setPhase("live"); setCalib(true);
    intervalRef.current = setInterval(() => {
      const d = mockData();
      setState(d.state); setScores(d.scores);
      setHistory(prev=>[...prev.slice(-80), d.scores[d.state]]);
      recordTick(d.state, d.scores);
    }, 500);
    return () => clearInterval(intervalRef.current);
  }, [useMock]);

  const isCalibrating = phase === "calibrating";
  const isLive        = phase === "live" && !isCalibrating;
  const cfg           = STATES[state] || STATES.connecting;
  const dominant      = scores[state] ?? 0;

  return (
    <div style={{minHeight:"100vh",background:cfg.bg||"#060c09",
      display:"flex",justifyContent:"center",transition:"background 1.2s ease"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes ripple{0%{transform:scale(1);opacity:0.5}100%{transform:scale(1.8);opacity:0}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#060c09}
        ::-webkit-scrollbar-thumb{background:#1a3a20;border-radius:2px}
      `}</style>

      <div style={{width:"100%",maxWidth:390,minHeight:"100vh",
        display:"flex",flexDirection:"column",fontFamily:"'DM Mono',monospace",
        background:"transparent"}}>

        {/* ── Header ── */}
        <div style={{padding:"52px 24px 0",display:"flex",
          justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:11,letterSpacing:3,color:"#1e4a2a"}}>NEURAL·OS</div>
            <div style={{fontSize:9,letterSpacing:2,marginTop:2,
              color:wsConnected?"#1e6a3a":useMock?"#5a4a20":"#1a2a18"}}>
              {wsConnected?(calibrated?"GANGLION · LIVE":"GANGLION · CALIBRATING")
                :useMock?"SIMULATED DATA":"WAITING FOR SERVER..."}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setUseMock(m=>!m)} style={{
              fontSize:8,letterSpacing:1,padding:"3px 8px",borderRadius:4,cursor:"pointer",
              background:useMock?"rgba(255,160,64,0.12)":"rgba(255,255,255,0.03)",
              border:useMock?"1px solid rgba(255,160,64,0.35)":"1px solid #0d2018",
              color:useMock?"#ffa040":"#1e4a2a",
            }}>{useMock?"DEMO ON":"DEMO"}</button>
            <div style={{width:7,height:7,borderRadius:"50%",
              background:wsConnected?cfg.color:useMock?"#ffa040":"#1a2a20",
              boxShadow:wsConnected?`0 0 8px ${cfg.color}70`:"none",
              animation:(wsConnected||useMock)?"pulse 2.5s infinite":"none",
              transition:"background 0.6s"}}/>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{display:"flex",gap:4,padding:"16px 24px 0"}}>
          {[["live","MONITOR"],["history","OVERVIEW"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              flex:1,padding:"9px 0",borderRadius:8,cursor:"pointer",
              fontSize:9,letterSpacing:2,transition:"all 0.3s",
              background:tab===k?`${cfg.color}12`:"rgba(255,255,255,0.02)",
              border:tab===k?`1px solid ${cfg.color}35`:"1px solid #0d2018",
              color:tab===k?cfg.color:"#1e4a2a",
            }}>{l}</button>
          ))}
        </div>

        {/* ── LIVE TAB ── */}
        {tab === "live" && (
          <>
            {isCalibrating ? (
              <div style={{padding:"20px 0 0",flex:1,display:"flex",
                flexDirection:"column",animation:"fadein 0.4s ease"}}>
                <CalScreen calPhase={calPhase} calProgress={calProgress}
                  calDone={calDone} calSamples={calSamples}
                  audioEnabled={audioEnabled} setAudioEnabled={setAudioEnabled}/>
              </div>
            ) : (
              <>
                {/* Arc */}
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",
                  padding:"16px 24px 0",animation:"fadein 0.5s ease"}}>
                  <div style={{position:"relative",width:240,height:210}}>
                    <div style={{position:"absolute",top:"50%",left:"50%",
                      transform:"translate(-50%,-50%)",
                      width:160,height:160,borderRadius:"50%",
                      background:`${cfg.color}${isLive?"16":"06"}`,
                      filter:"blur(30px)",transition:"background 1s",pointerEvents:"none"}}/>
                    <Arc value={dominant} color={cfg.color}/>
                    <div style={{position:"absolute",top:"44%",left:"50%",
                      transform:"translate(-50%,-50%)",textAlign:"center"}}>
                      {isLive && <div style={{position:"absolute",top:"50%",left:"50%",
                        transform:"translate(-50%,-50%)",width:56,height:56,
                        borderRadius:"50%",border:`1px solid ${cfg.color}40`,
                        animation:"ripple 2.4s ease-out infinite"}}/>}
                      <div style={{fontSize:36,lineHeight:1,marginBottom:7}}>{cfg.emoji}</div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,
                        color:cfg.color,letterSpacing:-0.5,
                        textShadow:`0 0 20px ${cfg.color}50`,transition:"color 0.5s"}}>
                        {isLive?`${Math.round(dominant*100)}%`:"—"}
                      </div>
                    </div>
                  </div>

                  <div style={{marginTop:2,padding:"8px 20px",borderRadius:24,
                    background:`${cfg.color}10`,border:`1px solid ${cfg.color}28`,
                    transition:"all 0.5s"}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,
                      letterSpacing:3,color:cfg.color,textShadow:`0 0 10px ${cfg.color}50`}}>
                      {cfg.label}
                    </div>
                  </div>

                  {!calibrated && isLive && (
                    <div style={{fontSize:8,color:"#3a5a30",marginTop:6,padding:"4px 12px",
                      borderRadius:8,background:"rgba(255,160,64,0.06)",
                      border:"1px solid rgba(255,160,64,0.15)"}}>
                      ⚠ UNCALIBRATED · accuracy limited
                    </div>
                  )}
                </div>

                {/* Score bars */}
                <div style={{padding:"20px 24px 0"}}>
                  <div style={{fontSize:9,color:"#1a3a20",letterSpacing:2,marginBottom:12}}>
                    STATE SCORES {calibrated?"· CALIBRATED":"· ESTIMATED"}
                  </div>
                  <ScoreBar label="RELAXATION" value={scores.relaxation}
                    color={STATES.relaxation.color} active={state==="relaxation"}/>
                  <ScoreBar label="CONCENTRATION" value={scores.concentration}
                    color={STATES.concentration.color} active={state==="concentration"}/>
                  <ScoreBar label="STRESS" value={scores.stress}
                    color={STATES.stress.color} active={state==="stress"}/>
                </div>

                {/* Sparkline */}
                {history.length > 4 && (
                  <div style={{padding:"16px 24px 0"}}>
                    <div style={{display:"flex",justifyContent:"space-between",
                      fontSize:9,color:"#1a3a20",letterSpacing:2,marginBottom:8}}>
                      <span>HISTORY</span>
                      <span style={{color:cfg.color}}>{Math.round(dominant*100)}%</span>
                    </div>
                    <Spark history={history} color={cfg.color}/>
                  </div>
                )}

                {/* Audio toggle in live */}
                <div style={{padding:"14px 24px 0",display:"flex",justifyContent:"center"}}>
                  <button onClick={()=>{
                    setAudioEnabled(a=>{
                      if(a) audioRef.current.stop();
                      else  audioRef.current.start(state);
                      return !a;
                    });
                  }} style={{
                    fontSize:8,padding:"5px 14px",borderRadius:6,cursor:"pointer",
                    background:audioEnabled?"rgba(0,232,160,0.08)":"rgba(255,255,255,0.02)",
                    border:audioEnabled?"1px solid rgba(0,232,160,0.25)":"1px solid #0d2018",
                    color:audioEnabled?"#00e8a0":"#1e4a2a",letterSpacing:2,
                  }}>{audioEnabled?"🔊 AMBIENT ON":"🔇 AMBIENT OFF"}</button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div style={{padding:"20px 0 0",flex:1,display:"flex",
            flexDirection:"column",animation:"fadein 0.4s ease"}}>
            <HistoryTab
              sessions={[...sessions,
                currentSession.current.ticks.length > 0 ? currentSession.current : null
              ].filter(Boolean)}
              onExport={()=>exportCSV([...sessions,
                currentSession.current.ticks.length>0?currentSession.current:null
              ].filter(Boolean))}
            />
          </div>
        )}

        <div style={{flex:1}}/>

        {/* ── Bottom ── */}
        <div style={{padding:"16px 24px 32px",textAlign:"center"}}>
          {!wsConnected && !useMock ? (
            <div style={{padding:"14px 18px",borderRadius:12,
              background:"rgba(255,255,255,0.02)",border:"1px solid #0d2018"}}>
              <div style={{fontSize:10,color:"#2a5a3a",letterSpacing:2,
                marginBottom:8,animation:"pulse 1.5s infinite"}}>● WAITING FOR SERVER</div>
              <div style={{fontSize:9,color:"#1a3a20",letterSpacing:1,lineHeight:2}}>
                <span style={{color:"#3a7a50"}}>python eeg_server.py</span>
              </div>
              <div style={{fontSize:8,color:"#1a2a20",marginTop:6}}>Retrying every 2s...</div>
            </div>
          ) : isCalibrating ? (
            <div style={{fontSize:9,color:"#2a5a3a",letterSpacing:1,lineHeight:1.8}}>
              Sit still · follow the guide · ~2 min total
            </div>
          ) : (
            <div style={{fontSize:9,color:"#1a3a20",letterSpacing:1}}>
              {wsConnected?"GANGLION LIVE · 2CH TEMPORAL":"DEMO MODE"}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}