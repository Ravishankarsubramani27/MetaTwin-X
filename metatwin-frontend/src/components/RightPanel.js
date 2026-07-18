/**
 * RightPanel.js — Live Vitals + ECG + WebSocket IoT + Recommendations + History
 */
import React, { useState, useEffect, useRef } from "react";
import { normalizeRisks, getPatientHistory } from "../services/api";
import ECGWaveform from "./ECGWaveform";

const WS_URL = "ws://127.0.0.1:8000/ws/vitals";

function simulateLiveData(base = {}, exerciseMin = 0, sleepHours = 7) {
  const rand = (v, d) => +(v + (Math.random() - 0.5) * d * 2).toFixed(1);
  const exBonus = exerciseMin * 0.3;
  const slBonus = (sleepHours - 6) * 1.5;
  return {
    heart_rate: rand(Math.max(55, (base.heart_rate || 72) - exerciseMin * 0.1), 3),
    spo2:       rand(base.spo2 || 97.8, 0.3),
    systolic:   rand(Math.max(105, (base.systolic || 122) - exerciseMin * 0.15), 3),
    diastolic:  rand(Math.max(65, (base.diastolic || 79) - exerciseMin * 0.08), 2),
    hrv:        rand(Math.min(90, (base.hrv || 42) + exBonus + slBonus * 0.5), 2),
    stress:     rand(Math.max(5, (base.stress || 28) - exBonus * 0.8 - slBonus * 0.6), 3),
    steps:      Math.round(rand((base.steps || 6800) + exerciseMin * 80, 100)),
  };
}

const LIVE_METRICS = [
  { key: "heart_rate", label: "Heart Rate",  unit: "bpm",  warn: [60, 100], icon: "❤️" },
  { key: "spo2",       label: "SpO₂",        unit: "%",    warn: [95, 100], icon: "💧" },
  { key: "systolic",   label: "Sys BP",       unit: "mmHg", warn: [90, 130], icon: "🩸" },
  { key: "diastolic",  label: "Dia BP",       unit: "mmHg", warn: [60, 85],  icon: "🩸" },
  { key: "hrv",        label: "HRV",          unit: "ms",   warn: [30, 100], icon: "〰" },
  { key: "stress",     label: "Stress",       unit: "/100", warn: [0, 50],   icon: "⚡" },
  { key: "steps",      label: "Steps Today",  unit: "",     warn: [5000, 99999], icon: "👣" },
];

const REC_COLORS = {
  clinical_consultation: { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)",   tag: "CLINICAL",  tagC: "#ef4444",  impact: "High" },
  physical_activity:     { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.3)", tag: "EXERCISE",  tagC: "#a78bfa",  impact: "High" },
  dietary_modification:  { bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.3)",  tag: "DIETARY",   tagC: "#38bdf8",  impact: "Medium" },
  lifestyle_habit:       { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.3)",  tag: "LIFESTYLE", tagC: "#10b981",  impact: "Medium" },
};

/* Mock patient history visits — replaced by real DB data when patientId is available */
const HISTORY_VISITS_FALLBACK = [
  { label: "Jan",  heart: 0.45, kidney: 0.30, liver: 0.35 },
  { label: "Mar",  heart: 0.55, kidney: 0.32, liver: 0.40 },
  { label: "May",  heart: 0.68, kidney: 0.35, liver: 0.45 },
];

function riskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}

function metricStatus(key, val) {
  const m = LIVE_METRICS.find(x => x.key === key);
  if (!m) return "normal";
  if (val < m.warn[0]) return "low";
  if (val > m.warn[1]) return "high";
  return "normal";
}
function statusColor(s) {
  return s === "normal" ? "#10b981" : s === "low" ? "#38bdf8" : "#ef4444";
}

export default function RightPanel({ recs, twinState, watch, patientId, risk }) {
  const [tab, setTab] = useState("live");
  const [exerciseMin, setExerciseMin] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [liveData, setLiveData] = useState(simulateLiveData(watch, 0, 7));
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [historyVisits, setHistoryVisits] = useState(HISTORY_VISITS_FALLBACK);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const tickRef = useRef(null);
  const wsRef   = useRef(null);

  // ── WebSocket: try to connect to backend IoT stream ──────────────
  useEffect(() => {
    let ws;
    let retryTimer;
    function connect() {
      try {
        ws = new WebSocket(WS_URL);
        ws.onopen  = () => { setWsConnected(true); wsRef.current = ws; };
        ws.onclose = () => {
          setWsConnected(false);
          retryTimer = setTimeout(connect, 5000); // retry after 5 s
        };
        ws.onerror = () => ws.close();
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            // Merge WS data with current simulated data
            setLiveData(prev => ({ ...prev, ...data }));
          } catch {}
        };
      } catch {}
    }
    connect();
    return () => {
      clearTimeout(retryTimer);
      if (ws) ws.close();
    };
  }, []);

  // Fetch real patient history when patientId is available or tab opens
  useEffect(() => {
    if (!patientId) return;
    setHistoryLoading(true);
    getPatientHistory(patientId, 10)
      .then(data => {
        const records = Array.isArray(data) ? data : (data?.history || data?.records || []);
        if (records.length > 0) {
          const mapped = records.map(rec => {
            const scores = rec.scores || rec.adjusted_scores || {};
            const ts = rec.timestamp || rec.created_at || rec.date;
            const date = ts ? new Date(ts) : null;
            const label = date
              ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : `Visit ${rec.id || ""}`;
            return {
              label,
              heart:  Number(scores.heart  || 0),
              kidney: Number(scores.kidney || 0),
              liver:  Number(scores.liver  || 0),
            };
          });
          setHistoryVisits(mapped);
        }
      })
      .catch(() => { /* silently fall back to mock data */ })
      .finally(() => setHistoryLoading(false));
  }, [patientId]);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setLiveData(d => simulateLiveData(d, exerciseMin, sleepHours));
    }, 2200);
    return () => clearInterval(tickRef.current);
  }, [exerciseMin, sleepHours]);

  const items = recs?.items || [];
  const currentRisks = normalizeRisks(risk);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-item${tab === "live" ? " active" : ""}`} onClick={() => setTab("live")}>📡 Live</button>
        <button className={`tab-item${tab === "recs" ? " active" : ""}`} onClick={() => setTab("recs")}>💊 Protocols</button>
        <button className={`tab-item${tab === "history" ? " active" : ""}`} onClick={() => setTab("history")}>📅 History</button>
      </div>

      {/* ── LIVE DATA ── */}
      {tab === "live" && (
        <div className="glass-card" style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Vitals</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span className="status-dot live" />
              <span style={{ fontSize: 10, color: wsConnected ? "#10b981" : "#f59e0b" }}>
                {wsConnected ? "IoT Live" : "Simulated"}
              </span>
            </div>
          </div>

          {/* ECG Waveform */}
          <div style={{
            background: "rgba(0,0,0,0.3)", borderRadius: 8,
            border: "1px solid rgba(16,185,129,0.15)",
            padding: "8px 10px", marginBottom: 12, overflow: "hidden",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#10b981", textTransform: "uppercase",
                          letterSpacing: "0.1em", marginBottom: 6, display: "flex",
                          justifyContent: "space-between", alignItems: "center" }}>
              <span>ECG</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#e2e8f0" }}>
                {liveData.heart_rate} <span style={{ fontSize: 9, color: "#64748b" }}>bpm</span>
              </span>
            </div>
            <ECGWaveform heartRate={liveData.heart_rate} color="#10b981" width={248} height={52} />
          </div>

          {/* Lifestyle sliders */}
          <div style={{ background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Lifestyle Adjustments
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>
                <span>Exercise</span><span style={{ color: "#38bdf8", fontWeight: 700 }}>{exerciseMin} min/day</span>
              </div>
              <input type="range" min={0} max={60} step={5} value={exerciseMin}
                onChange={e => setExerciseMin(+e.target.value)}
                style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>
                <span>Sleep</span><span style={{ color: "#a78bfa", fontWeight: 700 }}>{sleepHours}h/night</span>
              </div>
              <input type="range" min={4} max={9} step={0.5} value={sleepHours}
                onChange={e => setSleepHours(+e.target.value)}
                style={{ width: "100%", accentColor: "#a78bfa", cursor: "pointer" }} />
            </div>
          </div>

          {LIVE_METRICS.map(({ key, label, unit, icon }) => {
            const val = liveData[key];
            const st = metricStatus(key, val);
            const col = statusColor(st);
            return (
              <div key={key} className="data-row">
                <div className="label" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11 }}>{icon}</span>{label}
                </div>
                <div className="value" style={{ color: col }}>
                  {typeof val === "number" && !Number.isInteger(val) ? val.toFixed(1) : val}
                  {unit && <span style={{ fontSize: 9, color: "var(--text-dim)", marginLeft: 2 }}>{unit}</span>}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 6 }}>Activity Progress (steps / 10k goal)</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${Math.min(liveData.steps / 100, 100)}%`,
                background: "linear-gradient(90deg,#38bdf8,#06b6d4)",
                boxShadow: "0 0 6px #38bdf8",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-dim)", marginTop: 3 }}>
              <span>{liveData.steps.toLocaleString()} steps</span>
              <span>{(100 - Math.min(liveData.steps / 100, 100)).toFixed(0)}% to go</span>
            </div>
          </div>
        </div>
      )}

      {/* ── PROTOCOLS / RECOMMENDATIONS ── */}
      {tab === "recs" && (
        <div className="glass-card" style={{ padding: "16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Clinical Protocols</div>
          {items.length === 0 && (
            <div style={{ color: "var(--text-dim)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
              Run analysis to generate recommendations
            </div>
          )}
          {items.slice(0, 6).map((rec, i) => {
            const cfg = REC_COLORS[rec.category] || { bg: "rgba(56,189,248,0.06)", border: "rgba(56,189,248,0.2)", tag: "GENERAL", tagC: "#38bdf8", impact: "Low" };
            const organRisk = currentRisks[rec.organ] || 0;
            const projected = Math.max(5, organRisk * (1 - rec.priority * 0.3));
            return (
              <div key={i} style={{
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                borderRadius: 8, padding: "10px 12px", marginBottom: 8,
                animation: "fadeIn 0.3s ease",
                animationDelay: `${i * 0.05}s`, animationFillMode: "both",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: `${cfg.tagC}18`, color: cfg.tagC, letterSpacing: "0.08em" }}>{cfg.tag}</span>
                  <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{rec.organ}</span>
                  <span style={{ marginLeft: "auto", fontSize: 9, color: cfg.impact === "High" ? "#ef4444" : cfg.impact === "Medium" ? "#f59e0b" : "#10b981" }}>▲ {cfg.impact}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 6 }}>
                  {rec.text}
                </div>
                {/* Expected improvement */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 6 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Expected:</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: riskColor(organRisk), fontFamily: "monospace" }}>{organRisk.toFixed(0)}%</span>
                  <span style={{ fontSize: 9, color: "#64748b" }}>→</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", fontFamily: "monospace" }}>{projected.toFixed(0)}%</span>
                  <span style={{ fontSize: 9, color: "#10b981", marginLeft: "auto" }}>-{(organRisk - projected).toFixed(0)}%</span>
                </div>
                <div style={{ marginTop: 6, height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1 }}>
                  <div style={{ height: "100%", borderRadius: 1, width: `${Math.round(rec.priority * 100)}%`, background: cfg.tagC, boxShadow: `0 0 4px ${cfg.tagC}` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PATIENT HISTORY ── */}
      {tab === "history" && (
        <div className="glass-card" style={{ padding: "16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Patient Visit History</div>

          {historyLoading && (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#38bdf8", fontSize: 12 }}>
              <span style={{ width: 14, height: 14, border: "2px solid rgba(56,189,248,0.2)", borderTop: "2px solid #38bdf8", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite", marginRight: 8 }}/>
              Loading history…
            </div>
          )}

          {/* Timeline */}
          {!historyLoading && (
          <div style={{ position: "relative", paddingLeft: 24, marginBottom: 14 }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 1, background: "rgba(56,189,248,0.2)" }} />

            {historyVisits.map((visit, i) => {
              const h = visit.heart * 100;
              const k = visit.kidney * 100;
              const l = visit.liver * 100;
              const isSelected = selectedVisit === i;
              return (
                <div key={i} onClick={() => setSelectedVisit(isSelected ? null : i)}
                  style={{ position: "relative", marginBottom: 10, cursor: "pointer" }}>
                  {/* Dot */}
                  <div style={{ position: "absolute", left: -20, top: 10, width: 10, height: 10, borderRadius: "50%", background: riskColor(h), boxShadow: `0 0 6px ${riskColor(h)}`, border: "2px solid #020810" }} />
                  <div style={{
                    background: isSelected ? "rgba(56,189,248,0.08)" : "rgba(14,24,40,0.6)",
                    border: `1px solid ${isSelected ? "rgba(56,189,248,0.3)" : "rgba(56,100,160,0.15)"}`,
                    borderRadius: 8, padding: "8px 12px", transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isSelected ? 8 : 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{visit.label} 2025</span>
                      <span style={{ fontSize: 9, color: "#64748b" }}>
                        {isSelected ? "▲ collapse" : "▼ expand"}
                      </span>
                    </div>
                    {isSelected && (
                      <div style={{ animation: "fadeIn 0.2s ease" }}>
                        {[["❤️ Heart", h, currentRisks.heart], ["🫘 Kidney", k, currentRisks.kidney], ["🟤 Liver", l, currentRisks.liver]].map(([lbl, val, cur]) => {
                          const delta = val - cur;
                          return (
                            <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 60 }}>{lbl}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: riskColor(val), fontFamily: "monospace" }}>{val.toFixed(0)}%</span>
                              <span style={{ fontSize: 9, color: delta > 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                                {delta > 0 ? `↓ -${Math.abs(delta).toFixed(0)}%` : `↑ +${Math.abs(delta).toFixed(0)}%`}
                                <span style={{ fontSize: 8, color: "#64748b", marginLeft: 3 }}>vs now</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Current */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: -20, top: 10, width: 10, height: 10, borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 8px #38bdf8", border: "2px solid #020810", animation: "pulse-heart 1.5s infinite" }} />
              <div style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", marginBottom: 4 }}>Now — Current Visit</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["❤️", currentRisks.heart], ["🫘", currentRisks.kidney], ["🟤", currentRisks.liver]].map(([ico, val]) => (
                    <div key={ico} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9 }}>{ico}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: riskColor(val), fontFamily: "monospace" }}>{val.toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Twin status card */}
      {twinState && (
        <div className="glass-card" style={{ padding: "14px", borderTopColor: "#a78bfa", borderTopWidth: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Twin Status</div>
          <div className="data-row"><span className="label">Updates</span><span className="value" style={{ color: "#a78bfa" }}>{twinState.update_count || 1}</span></div>
          <div className="data-row"><span className="label">Calibrated</span><span className="value" style={{ color: "#10b981" }}>Yes</span></div>
          {twinState.last_updated && (
            <div className="data-row">
              <span className="label">Last sync</span>
              <span className="value" style={{ fontSize: 10, color: "var(--text-dim)" }}>{new Date(twinState.last_updated).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
