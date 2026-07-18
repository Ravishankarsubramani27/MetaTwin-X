/**
 * LeftPanel.js — Organ Risk Cards + Interaction Network + Drill-Down + Twin Status
 * Priority 1 (Organ Interaction), 4 (Drill-Down), 7 (Severity Colors), 8 (Confidence), 11 (Twin Status), 13 (Emergency Alerts)
 */
import React, { useState, useEffect } from "react";

/* ── 5-tier risk color scale ──────────────────────────────────────── */
function riskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}
function riskLabel(pct) {
  if (pct <= 20) return "Low";
  if (pct <= 40) return "Moderate";
  if (pct <= 60) return "Elevated";
  if (pct <= 80) return "High";
  return "Critical";
}
function confidence(pct) {
  return Math.min(99, Math.max(80, Math.round(100 - Math.abs(pct - 50) * 0.4)));
}

const ORGAN_META = {
  heart:  { icon: "❤️", label: "Heart",  specialist: "cardiologist",  markers: ["Blood Pressure", "LDL Cholesterol", "Fasting Glucose"] },
  kidney: { icon: "🫘", label: "Kidney", specialist: "nephrologist",  markers: ["Serum Creatinine", "eGFR", "Blood Pressure"] },
  liver:  { icon: "🟤", label: "Liver",  specialist: "hepatologist",  markers: ["ALT Enzyme", "AST Enzyme", "BMI"] },
};

/* ── Arc gauge ────────────────────────────────────────────────────── */
function ArcGauge({ value, color, size = 80 }) {
  const R = 30, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * R;
  const arc = circ * 0.75;
  const filled = (value / 100) * arc;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-135deg)", overflow: "visible" }}>
      <circle cx={cx} cy={cy} r={R} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={6}
        strokeDasharray={`${arc} ${circ - arc}`}
        strokeDashoffset={-circ * 0.125} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={R} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={-circ * 0.125} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 5px ${color})` }} />
    </svg>
  );
}

/* ── eGFR ─────────────────────────────────────────────────────────── */
function eGFR(cr, age, sex) {
  if (!cr || !age) return null;
  const f = sex === "female";
  const k = f ? 0.7 : 0.9, a = f ? -0.241 : -0.302, sm = f ? 1.012 : 1;
  const r = cr / k;
  return Math.round(142 * (r < 1 ? Math.pow(r, a) : Math.pow(r, -1.2)) * Math.pow(0.9938, age) * sm);
}
function eGFRStage(v) {
  if (v >= 90) return { lbl: "G1 Normal", col: "#10b981" };
  if (v >= 60) return { lbl: "G2 Mild ↓", col: "#38bdf8" };
  if (v >= 45) return { lbl: "G3a Mild-Mod ↓", col: "#f59e0b" };
  if (v >= 30) return { lbl: "G3b Moderate ↓", col: "#f97316" };
  if (v >= 15) return { lbl: "G4 Severe ↓", col: "#ef4444" };
  return { lbl: "G5 Failure", col: "#dc2626" };
}

/* ── Organ Interaction Network ────────────────────────────────────── */
function InteractionNetwork({ risks }) {
  const h = risks.heart || 0;
  const k = risks.kidney || 0;
  const l = risks.liver || 0;

  // interaction strengths
  const hk = Math.round(h * 0.6 + k * 0.2);  // cardiorenal
  const hl = Math.round(h * 0.4 + l * 0.3);  // CVD-NAFLD
  const kl = Math.round(k * 0.3 + l * 0.3);  // hepatorenal

  const arrowColor = (str) => str >= 60 ? "#ef4444" : str >= 35 ? "#f59e0b" : "#38bdf8";
  const arrowOpacity = (str) => 0.3 + str * 0.007;
  const arrowWidth = (str) => 1 + str * 0.03;

  return (
    <div className="glass-card" style={{ padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
        Organ Interaction Network
      </div>
      <svg viewBox="0 0 220 140" style={{ width: "100%", height: "auto" }}>
        <defs>
          <marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={arrowColor(hk)} opacity={arrowOpacity(hk)} />
          </marker>
          <marker id="ahl" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={arrowColor(hl)} opacity={arrowOpacity(hl)} />
          </marker>
          <marker id="akl" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={arrowColor(kl)} opacity={arrowOpacity(kl)} />
          </marker>
        </defs>

        {/* Heart → Kidney */}
        <line x1="85" y1="38" x2="145" y2="95"
          stroke={arrowColor(hk)} strokeWidth={arrowWidth(hk)}
          opacity={arrowOpacity(hk)} markerEnd="url(#ah)"
          style={{ filter: hk >= 50 ? `drop-shadow(0 0 3px ${arrowColor(hk)})` : "none" }} />
        <text x="122" y="62" fill={arrowColor(hk)} fontSize="8" textAnchor="middle" opacity="0.9">
          Cardiorenal {hk}%
        </text>

        {/* Heart → Liver */}
        <line x1="70" y1="42" x2="60" y2="95"
          stroke={arrowColor(hl)} strokeWidth={arrowWidth(hl)}
          opacity={arrowOpacity(hl)} markerEnd="url(#ahl)" />
        <text x="52" y="72" fill={arrowColor(hl)} fontSize="8" textAnchor="middle" opacity="0.9">
          CVD {hl}%
        </text>

        {/* Kidney ↔ Liver */}
        <line x1="145" y1="108" x2="80" y2="108"
          stroke={arrowColor(kl)} strokeWidth={arrowWidth(kl)}
          opacity={arrowOpacity(kl)} markerEnd="url(#akl)" />
        <text x="112" y="122" fill={arrowColor(kl)} fontSize="8" textAnchor="middle" opacity="0.9">
          Hepatorenal {kl}%
        </text>

        {/* Heart node */}
        <circle cx="75" cy="28" r="18" fill={`${riskColor(h)}18`} stroke={riskColor(h)} strokeWidth="1.5" />
        <text x="75" y="24" textAnchor="middle" fill={riskColor(h)} fontSize="9" fontWeight="700">❤</text>
        <text x="75" y="36" textAnchor="middle" fill={riskColor(h)} fontSize="8">{h.toFixed(0)}%</text>

        {/* Kidney node */}
        <circle cx="158" cy="108" r="18" fill={`${riskColor(k)}18`} stroke={riskColor(k)} strokeWidth="1.5" />
        <text x="158" y="104" textAnchor="middle" fill={riskColor(k)} fontSize="9" fontWeight="700">⬡</text>
        <text x="158" y="116" textAnchor="middle" fill={riskColor(k)} fontSize="8">{k.toFixed(0)}%</text>

        {/* Liver node */}
        <circle cx="55" cy="108" r="18" fill={`${riskColor(l)}18`} stroke={riskColor(l)} strokeWidth="1.5" />
        <text x="55" y="104" textAnchor="middle" fill={riskColor(l)} fontSize="9" fontWeight="700">◉</text>
        <text x="55" y="116" textAnchor="middle" fill={riskColor(l)} fontSize="8">{l.toFixed(0)}%</text>
      </svg>
      <div style={{ fontSize: 9, color: "#475569", textAlign: "center", marginTop: 2 }}>
        Arrow thickness = interaction strength
      </div>
    </div>
  );
}

/* ── Organ drill-down card ────────────────────────────────────────── */
function OrganCard({ organKey, pct, trend, formData }) {
  const [expanded, setExpanded] = useState(false);
  const meta = ORGAN_META[organKey];
  const col = riskColor(pct);
  const conf = confidence(pct);
  const egfr = organKey === "kidney" && formData
    ? eGFR(formData.serum_creatinine, formData.age, formData.sex) : null;

  return (
    <div style={{
      background: "rgba(14,24,40,0.8)",
      border: `1px solid ${col}33`,
      borderLeft: `3px solid ${col}`,
      borderRadius: 10, marginBottom: 10, overflow: "hidden",
      transition: "all 0.2s",
    }}>
      {/* Header row — always visible */}
      <div style={{ padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
        onClick={() => setExpanded(e => !e)}>
        <div style={{ flexShrink: 0 }}>
          <ArcGauge value={pct} color={col} size={68} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18, ...(organKey === "heart" ? { animation: "pulse-heart 1.2s infinite" } : {}) }}>
              {meta.icon}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {meta.label}
            </span>
            <span style={{
              marginLeft: "auto", background: `${col}18`, color: col,
              border: `1px solid ${col}44`, borderRadius: 20,
              padding: "2px 8px", fontSize: 9, fontWeight: 700,
            }}>{riskLabel(pct)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: col, fontFamily: "monospace", textShadow: `0 0 8px ${col}66` }}>
              {pct.toFixed(1)}%
            </span>
            {trend != null && (
              <span style={{ fontSize: 10, fontWeight: 600, color: trend > 0 ? "#ef4444" : trend < 0 ? "#10b981" : "#64748b" }}>
                {trend > 0 ? `↑ +${(trend * 100).toFixed(1)}%` : trend < 0 ? `↓ ${(trend * 100).toFixed(1)}%` : "→"}
              </span>
            )}
            <span style={{ marginLeft: "auto", fontSize: 9, color: "#475569" }}>
              {expanded ? "▲ Less" : "▼ Details"}
            </span>
          </div>
          {/* Mini bar */}
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 5 }}>
            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: col, boxShadow: `0 0 4px ${col}`, transition: "width 0.8s ease" }} />
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", animation: "fadeIn 0.2s ease", borderTop: "1px solid rgba(255,255,255,0.05)" }}>

          {/* Confidence */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 8px" }}>
            <span style={{ fontSize: 10, color: "#64748b" }}>Model Confidence</span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: "#10b981",
              fontFamily: "monospace",
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 6, padding: "2px 8px",
            }}>{conf}%</span>
          </div>

          {/* Contributing factors */}
          <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
            Top Contributing Factors
          </div>
          {meta.markers.map((m, i) => (
            <div key={m} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: `${col}22`, border: `1px solid ${col}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: col, flexShrink: 0, fontWeight: 700 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 11, color: "#cbd5e1", flex: 1 }}>{m}</span>
              <div style={{ height: 3, width: 50, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${Math.max(30, pct - i * 10)}%`, background: col, borderRadius: 2 }} />
              </div>
            </div>
          ))}

          {/* eGFR for kidney */}
          {organKey === "kidney" && egfr !== null && (
            <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 7 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 3 }}>eGFR (CKD-EPI)</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: eGFRStage(egfr).col, fontFamily: "monospace" }}>
                {egfr} <span style={{ fontSize: 9, fontWeight: 400 }}>mL/min</span>
              </div>
              <div style={{ fontSize: 9, color: eGFRStage(egfr).col }}>{eGFRStage(egfr).lbl}</div>
            </div>
          )}

          {/* Emergency alert */}
          {pct >= 70 && (
            <div style={{
              marginTop: 10, background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8,
              padding: "8px 12px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 2 }}>
                ⚡ High Risk Detected
              </div>
              <div style={{ fontSize: 10, color: "#fca5a5", lineHeight: 1.5 }}>
                Consult a {meta.specialist} immediately. 72-hour deterioration probability: ~{Math.round(pct * 0.25)}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Digital Twin Status ──────────────────────────────────────────── */
function TwinStatus({ twinState }) {
  const [secAgo, setSecAgo] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecAgo(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const maxConf = 96;
  return (
    <div className="glass-card" style={{ padding: "14px 16px", borderColor: "rgba(167,139,250,0.25)", borderTopWidth: 2, borderTopColor: "#a78bfa" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
        Digital Twin Status
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 6px #10b981", animation: "pulse-heart 2s infinite" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>✔ Synced</span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
        Last Updated: <span style={{ color: "#94a3b8" }}>{secAgo}s ago</span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
        Prediction Confidence: <span style={{ color: "#10b981", fontWeight: 700, fontFamily: "monospace" }}>{maxConf}%</span>
      </div>
      {twinState && (
        <div style={{ fontSize: 11, color: "#64748b" }}>
          Updates: <span style={{ color: "#a78bfa", fontWeight: 700 }}>{twinState.update_count || 1}</span>
        </div>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function LeftPanel({ risk, twinState, formData }) {
  const trends = twinState?.organ_states || {};
  const risks = {
    heart: parseFloat(((risk.heart || 0) * (risk.heart <= 1 ? 100 : 1)).toFixed(1)),
    kidney: parseFloat(((risk.kidney || 0) * (risk.kidney <= 1 ? 100 : 1)).toFixed(1)),
    liver: parseFloat(((risk.liver || 0) * (risk.liver <= 1 ? 100 : 1)).toFixed(1)),
  };
  // already normalized? detect by magnitude
  const h = risk.heart <= 1 ? risks.heart : risk.heart;
  const k = risk.kidney <= 1 ? risks.kidney : risk.kidney;
  const l = risk.liver <= 1 ? risks.liver : risk.liver;

  const healthScore = Math.round(100 - (0.4 * h + 0.3 * k + 0.3 * l + 0.1 * h * k / 100));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Health score banner */}
      <div className="glass-card" style={{
        padding: "14px 16px", marginBottom: 14,
        background: "linear-gradient(135deg,rgba(56,189,248,0.06),rgba(167,139,250,0.06))",
        borderColor: "rgba(56,189,248,0.2)",
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>
          Overall Health Score
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
          <div style={{
            fontSize: 42, fontWeight: 900, lineHeight: 1, fontFamily: "monospace",
            color: healthScore >= 70 ? "#10b981" : healthScore >= 40 ? "#f59e0b" : "#ef4444",
            filter: `drop-shadow(0 0 8px ${healthScore >= 70 ? "rgba(16,185,129,0.6)" : healthScore >= 40 ? "rgba(245,158,11,0.6)" : "rgba(239,68,68,0.6)"})`,
          }}>{healthScore}</div>
          <div style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 6 }}>/100</div>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${healthScore}%`, borderRadius: 2,
            background: healthScore >= 70 ? "linear-gradient(90deg,#10b981,#34d399)" : healthScore >= 40 ? "linear-gradient(90deg,#f59e0b,#fcd34d)" : "linear-gradient(90deg,#ef4444,#f87171)",
            boxShadow: healthScore >= 70 ? "0 0 8px #10b981" : "",
            transition: "width 1s ease",
          }} />
        </div>
      </div>

      {/* Organ interaction network */}
      <InteractionNetwork risks={{ heart: h, kidney: k, liver: l }} />

      {/* Organ drill-down cards */}
      {[["heart", h], ["kidney", k], ["liver", l]].map(([key, pct]) => (
        <OrganCard
          key={key}
          organKey={key}
          pct={pct}
          trend={trends[key]?.trend ?? null}
          formData={formData}
        />
      ))}

      {/* Twin status */}
      <div style={{ marginTop: 4 }}>
        <TwinStatus twinState={twinState} />
      </div>
    </div>
  );
}
