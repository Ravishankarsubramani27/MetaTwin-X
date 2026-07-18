/**
 * BottomSection.js — Interactive Lifestyle Simulation + Health Timeline + Health Index
 * Priority 2 (Timeline Simulation), 6 (Health Timeline), 14 (Interactive Simulation)
 */
import React, { useState, useCallback, useMemo } from "react";
import { simulateRisk } from "../services/api";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadialBarChart, RadialBar,
} from "recharts";

const ORGAN_COLORS = {
  heart:  { stroke: "#ef4444", fill: "rgba(239,68,68,0.12)"   },
  kidney: { stroke: "#38bdf8", fill: "rgba(56,189,248,0.12)"  },
  liver:  { stroke: "#10b981", fill: "rgba(16,185,129,0.12)"  },
};
const ADJ_STROKE = {
  heart:  "#f87171",
  kidney: "#7dd3fc",
  liver:  "#6ee7b7",
};

function riskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(6,11,20,0.95)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 8, padding: "10px 14px", backdropFilter: "blur(12px)" }}>
      <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>Month {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 11, color: p.color, fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {typeof p.value === "number" ? (p.value <= 1 ? (p.value * 100).toFixed(1) : p.value.toFixed(1)) : p.value}%
        </div>
      ))}
    </div>
  );
};

/* Live projection calculation without API */
function calcProjected(risk, exercise, smoking, bmi, sleep, sbpTarget) {
  const h = risk.heart   || 0;
  const k = risk.kidney  || 0;
  const l = risk.liver   || 0;
  const clamp = v => Math.min(98, Math.max(2, v));
  return {
    heart:  clamp(h * 100 * (1 - exercise * 0.004 + smoking * 0.008 - (9 - sleep) * 0.003 - (135 - sbpTarget) * 0.0015)),
    kidney: clamp(k * 100 * (1 - exercise * 0.003 + (bmi - 25) * 0.005)),
    liver:  clamp(l * 100 * (1 - exercise * 0.002 - (9 - sleep) * 0.002 + (bmi - 25) * 0.004)),
  };
}

/* Mock health timeline */
const MOCK_TIMELINE = [
  { month: "Jan", heart: 18, kidney: 22, liver: 20 },
  { month: "Feb", heart: 22, kidney: 24, liver: 21 },
  { month: "Mar", heart: 30, kidney: 25, liver: 25 },
  { month: "Apr", heart: 42, kidney: 28, liver: 32 },
  { month: "May", heart: 51, kidney: 31, liver: 38 },
];

export default function BottomSection({ risk, formData }) {
  const baseRisk = useMemo(() => ({
    heart:  risk.heart  <= 1 ? risk.heart  * 100 : risk.heart,
    kidney: risk.kidney <= 1 ? risk.kidney * 100 : risk.kidney,
    liver:  risk.liver  <= 1 ? risk.liver  * 100 : risk.liver,
  }), [risk.heart, risk.kidney, risk.liver]); // eslint-disable-line react-hooks/exhaustive-deps

  const [simResult,  setSimResult]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [rightTab,   setRightTab]   = useState("projection");

  // Lifestyle sliders
  const [exercise,   setExercise]   = useState(0);
  const [smoking,    setSmoking]    = useState(0);
  const [bmi,        setBmi]        = useState(formData?.bmi || 25);
  const [sleep,      setSleep]      = useState(7);
  const [sbpTarget,  setSbpTarget]  = useState(125);
  const [medAdh,     setMedAdh]     = useState("high");

  // Live projected risks (instant, no API)
  const projected = calcProjected(
    { heart: baseRisk.heart / 100, kidney: baseRisk.kidney / 100, liver: baseRisk.liver / 100 },
    exercise, smoking, bmi, sleep, sbpTarget
  );

  const runSim = async () => {
    setLoading(true);
    try {
      const medB = medAdh === "high" ? 0.05 : medAdh === "moderate" ? 0.02 : 0;
      const payload = {
        heart:  Math.max(projected.heart  / 100 - medB, 0.05),
        kidney: Math.max(projected.kidney / 100 - medB * 0.8, 0.05),
        liver:  Math.max(projected.liver  / 100 - medB * 0.6, 0.05),
      };
      const res = await simulateRisk(payload);
      setSimResult(res);
      setRightTab("projection");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Build chart data — original + adjusted trajectories
  const buildChartData = useCallback(() => {
    if (!simResult) return [];
    return (simResult.months || []).map((m, i) => ({
      month: m,
      heart:          simResult.heart_trajectory?.[i]  || 0,
      kidney:         simResult.kidney_trajectory?.[i] || 0,
      liver:          simResult.liver_trajectory?.[i]  || 0,
      heart_adj:  Math.max((simResult.heart_trajectory?.[i]  || 0) * (projected.heart  / (baseRisk.heart  || 1)), 0.02),
      kidney_adj: Math.max((simResult.kidney_trajectory?.[i] || 0) * (projected.kidney / (baseRisk.kidney || 1)), 0.02),
      liver_adj:  Math.max((simResult.liver_trajectory?.[i]  || 0) * (projected.liver  / (baseRisk.liver  || 1)), 0.02),
    }));
  }, [simResult, projected, baseRisk]);

  const chartData = buildChartData();

  const healthScore = Math.round(100 - (0.4 * baseRisk.heart + 0.3 * baseRisk.kidney + 0.3 * baseRisk.liver + 0.1 * baseRisk.heart * baseRisk.kidney / 100));
  const gaugeData = [{ name: "Health", value: healthScore, fill: healthScore >= 70 ? "#10b981" : healthScore >= 40 ? "#f59e0b" : "#ef4444" }];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>

      {/* ── LEFT: Interactive Lifestyle Simulation ── */}
      <div className="glass-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              12-Month Interactive Simulation
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
              Adjust lifestyle parameters — risks update instantly. Run full simulation for trajectories.
            </div>
          </div>
          <button className="btn-neon-solid" onClick={runSim} disabled={loading} style={{ flexShrink: 0 }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, border: "2px solid rgba(56,189,248,0.3)", borderTop: "2px solid #38bdf8", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Simulating…
              </span>
            ) : "▶ Run Full Simulation"}
          </button>
        </div>

        {/* Sliders */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          {[
            { label: `Exercise: ${exercise} min/day`, value: exercise, min: 0, max: 60, step: 5, color: "#38bdf8", set: setExercise },
            { label: `Smoking: ${smoking} cigs/day`,  value: smoking,  min: 0, max: 20, step: 1, color: "#ef4444", set: setSmoking },
            { label: `BMI: ${bmi.toFixed(1)}`,        value: bmi,      min: 18, max: 35, step: 0.5, color: "#f59e0b", set: setBmi },
            { label: `Sleep: ${sleep}h/night`,        value: sleep,    min: 4, max: 9,  step: 0.5, color: "#a78bfa", set: setSleep },
            { label: `Sys BP Target: ${sbpTarget} mmHg`, value: sbpTarget, min: 100, max: 160, step: 5, color: "#10b981", set: setSbpTarget },
          ].map(p => (
            <div key={p.label}>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 5, fontWeight: 500 }}>{p.label}</div>
              <input type="range" min={p.min} max={p.max} step={p.step} value={p.value}
                onChange={e => p.set(+e.target.value)}
                style={{ width: "100%", accentColor: p.color, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-dim)", marginTop: 2 }}>
                <span>{p.min}</span><span>{p.max}</span>
              </div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 5, fontWeight: 500 }}>Medication Adherence</div>
            <select value={medAdh} onChange={e => setMedAdh(e.target.value)} style={{ width: "100%", background: "rgba(14,24,40,0.8)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 8, color: "var(--text-primary)", fontFamily: "var(--font)", fontSize: 12, padding: "7px 10px", cursor: "pointer", outline: "none" }}>
              <option value="low">Low (&lt;50%)</option>
              <option value="moderate">Moderate (50–80%)</option>
              <option value="high">High (&gt;80%)</option>
            </select>
          </div>
        </div>

        {/* Before vs After preview */}
        <div style={{ background: "rgba(14,24,40,0.5)", border: "1px solid rgba(56,100,160,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Before → After Preview (Instant)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[["❤️ Heart", baseRisk.heart, projected.heart], ["🫘 Kidney", baseRisk.kidney, projected.kidney], ["🟤 Liver", baseRisk.liver, projected.liver]].map(([lbl, before, after]) => {
              const delta = after - before;
              const improved = delta < -0.5;
              const worsened = delta > 0.5;
              return (
                <div key={lbl} style={{ textAlign: "center", background: improved ? "rgba(16,185,129,0.06)" : worsened ? "rgba(239,68,68,0.06)" : "rgba(56,100,160,0.06)", border: `1px solid ${improved ? "rgba(16,185,129,0.2)" : worsened ? "rgba(239,68,68,0.2)" : "rgba(56,100,160,0.15)"}`, borderRadius: 8, padding: "8px" }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{lbl}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: riskColor(before), fontFamily: "monospace" }}>{before.toFixed(0)}%</span>
                    <span style={{ fontSize: 10, color: "#475569" }}>→</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: riskColor(after), fontFamily: "monospace" }}>{after.toFixed(0)}%</span>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: improved ? "#10b981" : worsened ? "#ef4444" : "#64748b", marginTop: 3 }}>
                    {delta < 0 ? `↓ ${Math.abs(delta).toFixed(1)}%` : delta > 0 ? `↑ +${delta.toFixed(1)}%` : "→ No change"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trajectory chart */}
        {chartData.length > 0 ? (
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  {Object.entries(ORGAN_COLORS).map(([k, c]) => (
                    <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.stroke} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={c.stroke} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,100,160,0.1)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 1]} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: "#64748b" }} />
                {Object.entries(ORGAN_COLORS).map(([k, c]) => (
                  <Area key={k} type="monotone" dataKey={k}
                    stroke={c.stroke} strokeWidth={2} fill={`url(#grad-${k})`}
                    dot={false} activeDot={{ r: 4, fill: c.stroke }}
                    name={k.charAt(0).toUpperCase() + k.slice(1)} />
                ))}
                {["heart", "kidney", "liver"].map(k => (
                  <Area key={`${k}_adj`} type="monotone" dataKey={`${k}_adj`}
                    stroke={ADJ_STROKE[k]} strokeWidth={1.5} strokeDasharray="4 3"
                    fill="none" dot={false}
                    name={`${k.charAt(0).toUpperCase() + k.slice(1)} (adjusted)`} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(56,189,248,0.15)", borderRadius: 8, color: "var(--text-dim)", fontSize: 13, flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 22 }}>📊</span>
            Adjust sliders then click ▶ Run Full Simulation
          </div>
        )}
      </div>

      {/* ── RIGHT: Health Index / Timeline / Projection tabs ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="tab-bar">
          <button className={`tab-item${rightTab === "projection" ? " active" : ""}`} onClick={() => setRightTab("projection")}>📈 Index</button>
          <button className={`tab-item${rightTab === "timeline"   ? " active" : ""}`} onClick={() => setRightTab("timeline")}>🗓 Timeline</button>
        </div>

        {/* Health Index gauge */}
        {rightTab === "projection" && (
          <>
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Health Index</div>
              <div style={{ height: 175 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="55%" outerRadius="80%" data={gaugeData} startAngle={225} endAngle={-45}>
                    <RadialBar background={{ fill: "rgba(255,255,255,0.04)" }} dataKey="value" cornerRadius={6} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "monospace", fontSize: 32, fontWeight: 900, fill: healthScore >= 70 ? "#10b981" : healthScore >= 40 ? "#f59e0b" : "#ef4444" }}>
                      {healthScore}
                    </text>
                    <text x="50%" y="62%" textAnchor="middle" style={{ fontSize: 11, fill: "#475569", fontFamily: "var(--font)" }}>
                      out of 100
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign: "center", marginTop: -8 }}>
                <span style={{
                  background: healthScore >= 70 ? "rgba(16,185,129,0.12)" : healthScore >= 40 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                  color: healthScore >= 70 ? "#10b981" : healthScore >= 40 ? "#f59e0b" : "#ef4444",
                  border: `1px solid ${healthScore >= 70 ? "rgba(16,185,129,0.3)" : healthScore >= 40 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`,
                  borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700,
                }}>
                  {healthScore >= 70 ? "Good Health" : healthScore >= 40 ? "Needs Attention" : "Critical"}
                </span>
              </div>
            </div>

            {/* Key biomarkers */}
            {formData && (
              <div className="glass-card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Key Biomarkers</div>
                {[
                  { label: "Blood Pressure", val: `${formData.systolic_bp || "—"}/${formData.diastolic_bp || "—"}`, unit: "mmHg", ok: formData.systolic_bp < 130 },
                  { label: "Fasting Glucose", val: formData.fasting_glucose || "—", unit: "mg/dL", ok: formData.fasting_glucose < 100 },
                  { label: "Creatinine", val: formData.serum_creatinine || "—", unit: "mg/dL", ok: formData.serum_creatinine <= 1.2 },
                  { label: "ALT", val: formData.alt_enzyme || "—", unit: "U/L", ok: formData.alt_enzyme <= 40 },
                  { label: "BMI", val: formData.bmi || "—", unit: "kg/m²", ok: formData.bmi >= 18.5 && formData.bmi < 25 },
                ].map(({ label, val, unit, ok }) => (
                  <div key={label} className="data-row">
                    <span className="label">{label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ color: ok ? "#10b981" : "#f59e0b", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{val}</span>
                      <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{unit}</span>
                      <span style={{ fontSize: 10, color: ok ? "#10b981" : "#f59e0b" }}>{ok ? "✓" : "!"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Health Timeline */}
        {rightTab === "timeline" && (
          <div className="glass-card" style={{ padding: "16px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Health Timeline
            </div>
            <div style={{ position: "relative", paddingLeft: 20 }}>
              <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 1, background: "rgba(56,189,248,0.18)" }} />
              {MOCK_TIMELINE.map((point, i) => (
                <div key={i} style={{ position: "relative", marginBottom: 12 }}>
                  <div style={{ position: "absolute", left: -13, top: 8, width: 8, height: 8, borderRadius: "50%", background: riskColor(point.heart), boxShadow: `0 0 5px ${riskColor(point.heart)}` }} />
                  <div style={{ background: "rgba(14,24,40,0.6)", border: "1px solid rgba(56,100,160,0.15)", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 5 }}>{point.month} 2025</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 8, color: "#64748b" }}>❤️ Heart</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: riskColor(point.heart), fontFamily: "monospace" }}>{point.heart}%</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 8, color: "#64748b" }}>🫘 Kidney</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: riskColor(point.kidney), fontFamily: "monospace" }}>{point.kidney}%</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 8, color: "#64748b" }}>🟤 Liver</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: riskColor(point.liver), fontFamily: "monospace" }}>{point.liver}%</div>
                      </div>
                      {i > 0 && (
                        <div style={{ marginLeft: "auto", textAlign: "center" }}>
                          <div style={{ fontSize: 8, color: "#64748b" }}>Heart Δ</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: point.heart > MOCK_TIMELINE[i - 1].heart ? "#ef4444" : "#10b981", fontFamily: "monospace" }}>
                            {point.heart > MOCK_TIMELINE[i - 1].heart ? "↑" : "↓"}{Math.abs(point.heart - MOCK_TIMELINE[i - 1].heart)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Current */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: -13, top: 8, width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 8px #38bdf8", animation: "pulse-heart 1.5s infinite" }} />
                <div style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#38bdf8", marginBottom: 5 }}>Jun — Current</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[["❤️", baseRisk.heart], ["🫘", baseRisk.kidney], ["🟤", baseRisk.liver]].map(([ico, val]) => (
                      <div key={ico} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 8, color: "#64748b" }}>{ico}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: riskColor(val), fontFamily: "monospace" }}>{val.toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
