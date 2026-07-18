/**
 * SleepRecovery.js
 * Sleep debt, recovery index, and projected organ risk improvement with more sleep.
 */
import React, { useState } from "react";

function riskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}

const SLEEP_STAGES = [
  { label: "Awake",   pct: 5,  color: "#ef4444" },
  { label: "Light",   pct: 50, color: "#38bdf8" },
  { label: "Deep",    pct: 20, color: "#a78bfa" },
  { label: "REM",     pct: 25, color: "#10b981" },
];

function calcRecovery(hoursSlept, quality) {
  const qMult = quality === "poor" ? 0.5 : quality === "fair" ? 0.75 : 1.0;
  return Math.min(100, Math.round((hoursSlept / 8) * 100 * qMult));
}

function projectedDelta(hours, organ) {
  // Each hour below 7 increases risk; above 7 decreases it
  const deficit = 7 - hours;
  const factors = { heart: 0.015, kidney: 0.010, liver: 0.008 };
  return +(deficit * factors[organ] * 100).toFixed(1);
}

const TIPS = [
  { hours: [0,5],  tips: ["Sleep deprivation severely impairs cardiac rhythm regulation.", "eGFR drops measurably with <5h sleep.", "Avoid screen exposure — melatonin suppression worsens recovery."] },
  { hours: [5,7],  tips: ["Cardiovascular recovery is incomplete below 7h.", "Aim for consistent sleep/wake time to stabilise cortisol.", "Avoid caffeine after 2 PM."] },
  { hours: [7,8],  tips: ["You're in the optimal range.", "Maintain consistent schedule even on weekends.", "A short 20-min nap can boost HRV without disrupting night sleep."] },
  { hours: [8,12], tips: ["Excellent sleep duration.", "Focus on quality — ensure dark, cool room.", "Monitor for apnea if you still feel tired."] },
];

function getTips(hours) {
  return TIPS.find(t => hours >= t.hours[0] && hours < t.hours[1])?.tips || [];
}

const WEEK_DATA = [7.2, 6.5, 8.0, 5.5, 7.8, 6.0, 7.5];
const WEEK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function SleepRecovery({ risk }) {
  const [hoursSlept, setHoursSlept] = useState(7);
  const [quality,    setQuality]    = useState("good");
  const [bedtime,    setBedtime]    = useState("23:00");
  const [wakeTime,   setWakeTime]   = useState("06:30");

  const recovery = calcRecovery(hoursSlept, quality);
  const recCol   = recovery >= 75 ? "#10b981" : recovery >= 50 ? "#f59e0b" : "#ef4444";

  const baseRisks = {
    heart:  risk?.heart  <= 1 ? (risk.heart  || 0)*100 : (risk?.heart  || 0),
    kidney: risk?.kidney <= 1 ? (risk.kidney || 0)*100 : (risk?.kidney || 0),
    liver:  risk?.liver  <= 1 ? (risk.liver  || 0)*100 : (risk?.liver  || 0),
  };

  const sleepDebt = Math.max(0, (7 - hoursSlept) * 7).toFixed(1);
  const avgWeek   = (WEEK_DATA.reduce((a,b)=>a+b,0)/7).toFixed(1);

  const tips = getTips(hoursSlept);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
          😴 Sleep & Recovery
        </h2>
        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
          Log your sleep to see recovery score and projected organ risk improvements.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* ── Left ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Sleep input */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)",
                          marginBottom: 16 }}>Tonight's Sleep</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
                                textTransform: "uppercase", letterSpacing: "0.08em",
                                display: "block", marginBottom: 4 }}>Bedtime</label>
                <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)}
                  className="neo-input"/>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
                                textTransform: "uppercase", letterSpacing: "0.08em",
                                display: "block", marginBottom: 4 }}>Wake Time</label>
                <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                  className="neo-input"/>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11,
                            color: "#94a3b8", marginBottom: 6 }}>
                <span>Hours slept</span>
                <span style={{ color: hoursSlept >= 7 ? "#10b981" : "#f59e0b",
                               fontWeight: 800, fontFamily: "monospace", fontSize: 15 }}>
                  {hoursSlept}h
                </span>
              </div>
              <input type="range" min={3} max={10} step={0.5} value={hoursSlept}
                onChange={e => setHoursSlept(+e.target.value)}
                style={{ width: "100%", accentColor: hoursSlept >= 7 ? "#10b981" : "#f59e0b" }}/>
              <div style={{ display: "flex", justifyContent: "space-between",
                            fontSize: 9, color: "#475569", marginTop: 2 }}>
                <span>3h</span><span>7h (optimal)</span><span>10h</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Sleep Quality</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["poor","fair","good"].map(q => (
                  <button key={q} onClick={() => setQuality(q)} style={{
                    flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer",
                    border: quality === q ? `1px solid ${q==="good"?"#10b981":q==="fair"?"#f59e0b":"#ef4444"}`
                                        : "1px solid rgba(56,100,160,0.2)",
                    background: quality === q
                      ? (q==="good"?"rgba(16,185,129,0.1)":q==="fair"?"rgba(245,158,11,0.1)":"rgba(239,68,68,0.1)")
                      : "rgba(14,24,40,0.6)",
                    color: quality === q
                      ? (q==="good"?"#10b981":q==="fair"?"#f59e0b":"#ef4444") : "#64748b",
                    fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                  }}>{q}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly bar chart */}
          <div className="glass-card" style={{ padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569",
                          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              7-Day Sleep Pattern (avg {avgWeek}h)
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
              {WEEK_DATA.map((h, i) => {
                const col = h >= 7 ? "#10b981" : h >= 6 ? "#f59e0b" : "#ef4444";
                const heightPct = (h / 10) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column",
                                        alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 9, color: col, fontFamily: "monospace",
                                   fontWeight: 700 }}>{h}</span>
                    <div style={{ width: "100%", borderRadius: "3px 3px 0 0",
                                  height: `${heightPct}%`, background: col,
                                  boxShadow: `0 0 4px ${col}44` }}/>
                    <span style={{ fontSize: 9, color: "#475569" }}>{WEEK_DAYS[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Recovery score */}
          <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569",
                          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Recovery Score
            </div>
            <div style={{ position: "relative", width: 120, height: 120,
                          margin: "0 auto 12px" }}>
              <svg viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)"
                  strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke={recCol}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${recovery * 3.14} 314`}
                  style={{ filter: `drop-shadow(0 0 6px ${recCol})` }}/>
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex",
                            flexDirection: "column", alignItems: "center",
                            justifyContent: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: recCol,
                               fontFamily: "var(--font-mono)" }}>{recovery}</div>
                <div style={{ fontSize: 9, color: "#475569" }}>/ 100</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#64748b" }}>Sleep Debt</div>
                <div style={{ fontSize: 14, fontWeight: 800,
                               color: +sleepDebt > 0 ? "#f59e0b" : "#10b981",
                               fontFamily: "monospace" }}>{sleepDebt}h</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#64748b" }}>Weekly avg</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#38bdf8",
                               fontFamily: "monospace" }}>{avgWeek}h</div>
              </div>
            </div>
          </div>

          {/* Sleep stage donut */}
          <div className="glass-card" style={{ padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569",
                          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Typical Sleep Architecture
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <svg viewBox="0 0 80 80" width="80" height="80">
                {(() => {
                  let offset = 0;
                  return SLEEP_STAGES.map(s => {
                    const dash = s.pct * 0.879; // circumference = 87.96 for r=14
                    const el = <circle key={s.label} cx="40" cy="40" r="14"
                      fill="none" stroke={s.color} strokeWidth="26"
                      strokeDasharray={`${dash} 100`} strokeDashoffset={-offset}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "40px 40px" }}/>;
                    offset += dash;
                    return el;
                  });
                })()}
                <text x="40" y="44" textAnchor="middle"
                  style={{ fontSize: 8, fill: "#94a3b8", fontFamily: "var(--font)" }}>
                  stages
                </text>
              </svg>
              <div>
                {SLEEP_STAGES.map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center",
                                              gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2,
                                  background: s.color }}/>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.color,
                                   marginLeft: "auto", fontFamily: "monospace" }}>
                      {s.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Organ risk projection */}
          <div className="glass-card" style={{ padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569",
                          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Sleep → Risk Projection
            </div>
            {[["❤️ Heart","heart"],["🫘 Kidney","kidney"],["🟤 Liver","liver"]].map(([l,k]) => {
              const delta = projectedDelta(hoursSlept, k);
              const after = Math.min(99, Math.max(1, baseRisks[k] + delta));
              const improved = delta < 0;
              return (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                                alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{l}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700,
                                     color: riskColor(baseRisks[k]),
                                     fontFamily: "monospace" }}>
                        {baseRisks[k].toFixed(0)}%
                      </span>
                      <span style={{ fontSize: 10, color: "#475569" }}>→</span>
                      <span style={{ fontSize: 12, fontWeight: 700,
                                     color: riskColor(after), fontFamily: "monospace" }}>
                        {after.toFixed(0)}%
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700,
                                     color: improved ? "#10b981" : "#ef4444" }}>
                        {delta < 0 ? `↓${Math.abs(delta)}` : delta > 0 ? `↑+${delta}` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="glass-card" style={{ padding: "14px",
              borderColor: "rgba(167,139,250,0.3)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa",
                            marginBottom: 8 }}>💡 Sleep Recommendations</div>
              {tips.map((tip, i) => (
                <div key={i} style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6,
                                      marginBottom: 4, paddingLeft: 10,
                                      borderLeft: "2px solid rgba(167,139,250,0.3)" }}>
                  {tip}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
