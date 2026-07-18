import React from "react";

const ORGANS = [
  { key: "heart",  label: "Heart",  icon: "❤️", accent: "#ef4444", light: "#fef2f2" },
  { key: "kidney", label: "Kidney", icon: "🫘", accent: "#3b82f6", light: "#eff6ff" },
  { key: "liver",  label: "Liver",  icon: "🟤", accent: "#10b981", light: "#f0fdf4" },
];

function getRiskLevel(score) {
  if (score < 40)  return { label: "Low",      color: "#15803d", bg: "#dcfce7" };
  if (score < 70)  return { label: "Moderate", color: "#a16207", bg: "#fef9c3" };
  return             { label: "High",     color: "#dc2626", bg: "#fee2e2" };
}

/** Trend arrow derived from twinState organ trend value */
function TrendBadge({ trend }) {
  if (trend == null) return null;
  const up   = trend > 0.01;
  const down = trend < -0.01;
  if (!up && !down) {
    return (
      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600,
                     background: "#f1f5f9", borderRadius: 20,
                     padding: "2px 9px", marginTop: 6, display: "inline-block" }}>
        → Stable
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, marginTop: 6, display: "inline-block",
      borderRadius: 20, padding: "2px 9px",
      background: up ? "#fee2e2" : "#dcfce7",
      color:      up ? "#dc2626" : "#15803d",
    }}>
      {up ? `↑ +${(trend * 100).toFixed(1)}%` : `↓ ${(trend * 100).toFixed(1)}%`}
    </span>
  );
}

function ArcGauge({ value, color, size = 110 }) {
  const r      = 44;
  const cx     = size / 2;
  const cy     = size / 2;
  const circ   = 2 * Math.PI * r;
  const filled = (value / 100) * circ * 0.75;
  const offset = circ * 0.125;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-135deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9"
              strokeWidth="8" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
              strokeDashoffset={-offset} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
              strokeWidth="8"
              strokeDasharray={`${filled} ${circ - filled}`}
              strokeDashoffset={-offset} strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.8s ease" }} />
    </svg>
  );
}

/** Compute eGFR (CKD-EPI simplified) from creatinine, age, sex */
export function computeEGFR(creatinine, age, sex) {
  if (!creatinine || !age) return null;
  const isFemale = sex === "female";
  const kappa    = isFemale ? 0.7 : 0.9;
  const alpha    = isFemale ? -0.241 : -0.302;
  const sexMult  = isFemale ? 1.012 : 1.0;
  const scrKappa = creatinine / kappa;
  const term     = scrKappa < 1
    ? Math.pow(scrKappa, alpha)
    : Math.pow(scrKappa, -1.200);
  return Math.round(142 * term * Math.pow(0.9938, age) * sexMult);
}

export default function RiskCards({ risk, twinState }) {
  const maxRisk = Math.max(risk.heart, risk.kidney, risk.liver);
  const healthScore = Math.round((1 - maxRisk / 100) * 100);

  // Extract trends from twinState if available
  const trends = twinState?.organ_states || {};

  // eGFR from biomarkers stored in twinState
  const egfr = twinState?.latest_biomarkers
    ? computeEGFR(
        twinState.latest_biomarkers.serum_creatinine,
        twinState.latest_biomarkers.age,
        twinState.latest_biomarkers.sex
      )
    : null;

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Health score banner */}
      <div style={{
        background: "linear-gradient(135deg,#0f172a,#1e3a8a)",
        borderRadius: 14, padding: "18px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, boxShadow: "0 4px 16px rgba(15,23,42,0.2)"
      }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11,
                        fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.1em", marginBottom: 4 }}>
            Overall Health Score
          </div>
          <div style={{ color: healthScore >= 70 ? "#34d399" : healthScore >= 40 ? "#fbbf24" : "#f87171",
                        fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
            {healthScore}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>out of 100</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%",
                         background: "#10b981", display: "inline-block",
                         animation: "blink 1.5s infinite" }} />
          <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>Live Analysis</span>
        </div>
      </div>

      {/* Organ cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {ORGANS.map(({ key, label, icon, accent, light }) => {
          const score = Math.round((risk[key] || 0) * 100) / 100;
          const pct   = Math.round(score * 10) / 10;
          const risk_info = getRiskLevel(pct);
          // trend: positive = worsening, negative = improving
          const trendVal  = trends[key]?.trend ?? null;
          return (
            <div key={key} style={{
              background: "#ffffff",
              border: `1px solid #e2e8f0`,
              borderTop: `3px solid ${accent}`,
              borderRadius: 12, padding: "20px 16px",
              textAlign: "center",
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              transition: "box-shadow 0.2s",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.1em",
                            marginBottom: 12 }}>{label} Risk</div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <div style={{ position: "relative", width: 110, height: 110 }}>
                  <ArcGauge value={pct} color={accent} />
                  <div style={{ position: "absolute", top: "50%", left: "50%",
                                transform: "translate(-50%,-44%)",
                                color: accent, fontSize: 22, fontWeight: 900 }}>
                    {pct.toFixed(1)}%
                  </div>
                </div>
              </div>
              <span style={{
                background: risk_info.bg, color: risk_info.color,
                borderRadius: 20, padding: "3px 12px",
                fontSize: 11, fontWeight: 700, textTransform: "uppercase"
              }}>{risk_info.label}</span>
              <div><TrendBadge trend={trendVal} /></div>
              {/* eGFR badge for kidney */}
              {key === "kidney" && egfr !== null && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
                  eGFR:&nbsp;
                  <span style={{
                    fontWeight: 700,
                    color: egfr >= 90 ? "#15803d" : egfr >= 60 ? "#a16207"
                         : egfr >= 30 ? "#ea580c" : "#dc2626",
                  }}>{egfr}</span>
                  &nbsp;mL/min/1.73m²
                  <div style={{
                    fontSize: 10, fontWeight: 600, marginTop: 2,
                    color: egfr >= 90 ? "#15803d" : egfr >= 60 ? "#a16207"
                         : egfr >= 30 ? "#ea580c" : "#dc2626",
                  }}>
                    {egfr >= 90 ? "G1 — Normal" : egfr >= 60 ? "G2 — Mildly ↓"
                   : egfr >= 45 ? "G3a — Mild-Moderate ↓" : egfr >= 30 ? "G3b — Moderate ↓"
                   : egfr >= 15 ? "G4 — Severe ↓" : "G5 — Kidney Failure"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
