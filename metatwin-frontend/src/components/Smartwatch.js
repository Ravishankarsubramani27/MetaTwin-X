/**
 * Smartwatch / Wearable Integration Panel
 * Dark futuristic theme — matches MetaTwin-X dashboard
 * Feeds: heart_rate_resting, heart_rate_max, hrv_ms,
 *        spo2_pct, active_calories, stress_score
 */
import React, { useState, useEffect } from "react";

function statusColor(val, good, warn, invert=false) {
  if (invert) {
    return val >= good ? "#10b981" : val >= warn ? "#f59e0b" : "#ef4444";
  }
  return val <= good ? "#10b981" : val <= warn ? "#f59e0b" : "#ef4444";
}

function MetricSlider({ label, icon, min, max, step=1, value, unit,
                         good, warn, invert=false, onChange }) {
  const col = statusColor(value, good, warn, invert);
  const pct = ((value - min) / (max - min)) * 100;
  const statusLabel = invert
    ? (value >= good ? "Optimal" : value >= warn ? "Low" : "Critical")
    : (value <= good ? "Optimal" : value <= warn ? "Borderline" : "Elevated");

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:6 }}>
        <label style={{ fontSize:11, fontWeight:600, color:"var(--text-secondary)",
                        display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:13 }}>{icon}</span>
          {label}
        </label>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:13, fontWeight:800, color:col,
                         fontFamily:"var(--font-mono)",
                         textShadow:`0 0 6px ${col}66` }}>
            {typeof value === "number" && !Number.isInteger(value)
              ? value.toFixed(1) : value}
            {unit && <span style={{ fontSize:10, fontWeight:400,
                                    color:"var(--text-dim)" }}> {unit}</span>}
          </span>
          <span style={{
            background:`${col}15`, color:col,
            border:`1px solid ${col}40`,
            borderRadius:20, padding:"1px 7px",
            fontSize:9, fontWeight:700,
          }}>{statusLabel}</span>
        </div>
      </div>
      {/* Track */}
      <div style={{ position:"relative", height:6,
                    background:"rgba(255,255,255,0.06)",
                    borderRadius:3, overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${pct}%`,
          background:`linear-gradient(90deg,${col}88,${col})`,
          borderRadius:3,
          boxShadow:`0 0 6px ${col}`,
          transition:"width 0.3s ease",
        }}/>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))}
        style={{
          position:"absolute", opacity:0, width:"100%",
          height:20, top:-8, left:0, cursor:"pointer", margin:0,
        }}/>
      <div style={{ position:"relative", marginTop:2 }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e=>onChange(Number(e.target.value))}
          style={{
            width:"100%", height:6,
            appearance:"none", background:"transparent",
            cursor:"pointer", margin:0, padding:0,
            accentColor:col,
          }}/>
        <div style={{ display:"flex", justifyContent:"space-between",
                      fontSize:9, color:"var(--text-dim)", marginTop:1 }}>
          <span>{min}</span><span>{max}</span>
        </div>
      </div>
    </div>
  );
}

function CompositeBar({ label, value, color }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between",
                    marginBottom:4, alignItems:"center" }}>
        <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{label}</span>
        <span style={{ fontSize:11, fontWeight:700, color,
                       fontFamily:"var(--font-mono)" }}>
          {(parseFloat(value)*100).toFixed(0)}%
        </span>
      </div>
      <div style={{ height:4, background:"rgba(255,255,255,0.06)",
                    borderRadius:2, overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${Math.min(parseFloat(value)*100,100)}%`,
          background:color, boxShadow:`0 0 4px ${color}`,
          borderRadius:2, transition:"width 0.4s",
        }}/>
      </div>
    </div>
  );
}

export default function Smartwatch({ onChange }) {
  const [hr,     setHr]     = useState(68);
  const [hrMax,  setHrMax]  = useState(150);
  const [hrv,    setHrv]    = useState(42);
  const [spo2,   setSpo2]   = useState(98.0);
  const [cal,    setCal]    = useState(300);
  const [stress, setStress] = useState(30);
  const [connected, setConnected] = useState(true);

  // Notify parent whenever any value changes
  const notify = (updates) => {
    const data = {
      heart_rate_resting: hr, heart_rate_max: hrMax,
      hrv_ms: hrv, spo2_pct: spo2,
      active_calories: cal, stress_score: stress,
      ...updates,
    };
    onChange?.(data);
  };

  // Initial notification on mount
  useEffect(() => { notify({}); }, []); // eslint-disable-line

  const wrap = (setter, key) => v => { setter(v); notify({ [key]: v }); };

  // Composite computed features
  const cardiacStress = Math.min((hr / 100) * (1 - hrv / 200), 1).toFixed(2);
  const oxyEff        = Math.min((spo2 / 100) * (1 - stress / 200), 1).toFixed(2);
  const actScore      = Math.min((Math.max(cal - 100, 0) / 700 + Math.max(10000 - 5000, 0) / 10000) / 2, 1).toFixed(2);

  return (
    <div className="glass-card" style={{
      padding:"20px 24px", marginTop:18,
      background:"linear-gradient(135deg,rgba(56,189,248,0.04),rgba(167,139,250,0.03))",
      borderColor:"rgba(56,189,248,0.2)",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
        <div style={{
          width:44, height:44,
          background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(167,139,250,0.2))",
          border:"1px solid rgba(56,189,248,0.3)",
          borderRadius:13, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:22,
          boxShadow:"0 0 16px rgba(56,189,248,0.15)",
          animation:"pulse-glow 3s ease-in-out infinite",
        }}>⌚</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)" }}>
            Smartwatch Integration
          </div>
          <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:2 }}>
            Fitbit · Apple Watch · Garmin compatible
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={()=>setConnected(c=>!c)} style={{
            background: connected ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${connected?"rgba(16,185,129,0.35)":"rgba(239,68,68,0.35)"}`,
            borderRadius:8, padding:"5px 12px",
            fontSize:11, fontWeight:700, cursor:"pointer",
            color: connected ? "#10b981" : "#ef4444",
            display:"flex", alignItems:"center", gap:5,
          }}>
            <span style={{
              width:6, height:6, borderRadius:"50%",
              background: connected ? "#10b981" : "#ef4444",
              display:"inline-block",
              animation: connected ? "blink 1.5s infinite" : undefined,
            }}/>
            {connected ? "Live Sync" : "Disconnected"}
          </button>
        </div>
      </div>

      {/* 3-column grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:28 }}>

        {/* ── Column 1: Heart Rate ── */}
        <div>
          <div className="section-label">❤️ Heart Rate</div>
          <MetricSlider label="Resting HR" icon="💓" min={40} max={120} step={1}
            value={hr} unit="bpm" good={70} warn={85}
            onChange={wrap(setHr,"heart_rate_resting")}/>
          <MetricSlider label="Max HR" icon="⚡" min={100} max={200} step={1}
            value={hrMax} unit="bpm" good={160} warn={175}
            onChange={wrap(setHrMax,"heart_rate_max")}/>
          <MetricSlider label="HRV (RMSSD)" icon="〰" min={5} max={150} step={1}
            value={hrv} unit="ms" good={50} warn={25} invert={true}
            onChange={wrap(setHrv,"hrv_ms")}/>
        </div>

        {/* ── Column 2: Oxygen & Activity ── */}
        <div>
          <div className="section-label">💧 Oxygen & Activity</div>
          <MetricSlider label="SpO₂ (Blood O₂)" icon="🫁" min={85} max={100} step={0.5}
            value={spo2} unit="%" good={97} warn={95} invert={true}
            onChange={wrap(setSpo2,"spo2_pct")}/>
          <MetricSlider label="Active Calories" icon="🔥" min={0} max={2000} step={10}
            value={cal} unit="kcal" good={400} warn={200} invert={true}
            onChange={wrap(setCal,"active_calories")}/>

          {/* Real-time display boxes */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
            {[
              { label:"Heart Rate", value:hr, unit:"bpm", color:"#ef4444" },
              { label:"SpO₂",       value:spo2, unit:"%", color:"#38bdf8" },
            ].map(({ label, value, unit:u, color }) => (
              <div key={label} style={{
                background:`${color}08`,
                border:`1px solid ${color}25`,
                borderRadius:8, padding:"10px",
                textAlign:"center",
              }}>
                <div style={{ fontSize:9, color:"var(--text-dim)", fontWeight:700,
                              textTransform:"uppercase", letterSpacing:"0.08em",
                              marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:20, fontWeight:900, color,
                              fontFamily:"var(--font-mono)",
                              textShadow:`0 0 8px ${color}66` }}>
                  {typeof value==="number"&&!Number.isInteger(value)
                    ?value.toFixed(1):value}
                </div>
                <div style={{ fontSize:9, color:"var(--text-dim)" }}>{u}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Column 3: Stress + Composite ── */}
        <div>
          <div className="section-label">🧘 Stress & AI Features</div>
          <MetricSlider label="Stress Score" icon="😰" min={0} max={100} step={1}
            value={stress} unit="/100" good={30} warn={60}
            onChange={wrap(setStress,"stress_score")}/>

          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:10, color:"var(--text-dim)", fontWeight:700,
                          textTransform:"uppercase", letterSpacing:"0.1em",
                          marginBottom:10 }}>
              🤖 Computed AI Features
            </div>
            <CompositeBar label="Cardiac Stress Index"
              value={cardiacStress}
              color={cardiacStress < 0.4 ? "#10b981" : cardiacStress < 0.6 ? "#f59e0b" : "#ef4444"}/>
            <CompositeBar label="Oxygen Efficiency"
              value={oxyEff}
              color={oxyEff > 0.7 ? "#10b981" : oxyEff > 0.5 ? "#f59e0b" : "#ef4444"}/>
            <CompositeBar label="Activity Score"
              value={actScore}
              color={actScore > 0.5 ? "#10b981" : actScore > 0.3 ? "#f59e0b" : "#ef4444"}/>
          </div>

          {/* Stress level tag */}
          <div style={{ marginTop:14 }}>
            <span className={`badge ${stress<=30?"badge-green":stress<=60?"badge-amber":"badge-red"}`}
              style={{ fontSize:10 }}>
              {stress<=30?"😌 Low Stress":stress<=60?"😐 Moderate Stress":"😰 High Stress"}
            </span>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.2)",
        borderRadius:8, padding:"10px 14px", marginTop:18,
        fontSize:11, color:"#38bdf8", lineHeight:1.6,
      }}>
        ℹ️ Wearable data combines with clinical biomarkers to compute{" "}
        <strong>Cardiac Stress Index</strong>, <strong>Oxygen Efficiency</strong> &{" "}
        <strong>Activity Score</strong> — fed directly into the ML prediction pipeline.
      </div>
    </div>
  );
}
