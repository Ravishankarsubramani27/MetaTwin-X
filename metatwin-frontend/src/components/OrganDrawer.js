/**
 * OrganDrawer.js
 * Full-detail analytics drawer that slides in from the right when an organ is clicked.
 * Shows: Risk, Trend, Contributing Factors, Recommendations, Future Projection,
 *        Historical Values, Health Score Contribution.
 */
import React, { useEffect } from "react";
import { getRiskColor, getRiskLabel } from "../hooks/useRiskColor";
import { ORGAN_META } from "../config/constants";
import { normalizeRisks } from "../services/api";

const CONTRIBUTING = {
  heart:  [
    { factor: "Systolic Blood Pressure", weight: 0.28, direction: "↑" },
    { factor: "LDL Cholesterol",         weight: 0.21, direction: "↑" },
    { factor: "Fasting Glucose",         weight: 0.16, direction: "↑" },
    { factor: "BMI",                     weight: 0.13, direction: "↑" },
    { factor: "HDL Cholesterol",         weight: 0.12, direction: "↓ protective" },
    { factor: "Daily Step Count",        weight: 0.10, direction: "↓ protective" },
  ],
  kidney: [
    { factor: "Serum Creatinine",        weight: 0.32, direction: "↑" },
    { factor: "Systolic Blood Pressure", weight: 0.22, direction: "↑" },
    { factor: "Fasting Glucose",         weight: 0.19, direction: "↑" },
    { factor: "BMI",                     weight: 0.14, direction: "↑" },
    { factor: "Age",                     weight: 0.13, direction: "↑" },
  ],
  liver: [
    { factor: "ALT Enzyme",             weight: 0.30, direction: "↑" },
    { factor: "AST Enzyme",             weight: 0.24, direction: "↑" },
    { factor: "BMI",                    weight: 0.20, direction: "↑" },
    { factor: "Fasting Glucose",        weight: 0.16, direction: "↑" },
    { factor: "Diet Quality Score",     weight: 0.10, direction: "↓ protective" },
  ],
};

const CLINICAL_ADVICE = {
  heart: {
    low:      "Cardiovascular profile is within normal limits. Continue regular aerobic exercise and a heart-healthy diet. Annual lipid panel recommended.",
    moderate: "Moderate cardiovascular risk detected. Blood pressure and cholesterol management is advised. Consult a cardiologist within 3 months.",
    high:     "High cardiovascular risk. Immediate cardiology referral recommended. ECG, stress test, and lipid-lowering therapy should be considered.",
    critical: "Critical cardiovascular risk. Urgent medical evaluation required. Consider hospitalisation and immediate pharmacological intervention.",
  },
  kidney: {
    low:      "Renal function appears normal. Stay hydrated. Avoid nephrotoxic medications (NSAIDs). Annual creatinine/eGFR check recommended.",
    moderate: "Moderate renal risk. Monitor eGFR and urine ACR every 3 months. Control blood pressure and blood glucose strictly.",
    high:     "High renal risk. Nephrology referral required. CKD management protocol should be initiated. Restrict protein intake to 0.8 g/kg/day.",
    critical: "Critical renal risk. Possible renal failure. Immediate nephrologist consultation and potential dialysis preparation.",
  },
  liver: {
    low:      "Hepatic markers are within normal range. Maintain alcohol abstinence and a low-fat diet. Annual LFT recommended.",
    moderate: "Elevated hepatic risk. Reduce alcohol consumption completely. Adopt Mediterranean diet. Hepatology review within 6 weeks.",
    high:     "High hepatic risk. Hepatology evaluation urgent. Request abdominal ultrasound, viral hepatitis serology, and LFT panel.",
    critical: "Critical hepatic risk. Possible hepatic failure or cirrhosis. Immediate hospitalisation and hepatology consult required.",
  },
};

function getRiskTier(pct) {
  if (pct <= 20) return "low";
  if (pct <= 60) return "moderate";
  if (pct <= 80) return "high";
  return "critical";
}

function generateProjection(currentPct) {
  const base = currentPct / 100;
  return [
    { label: "Now",     risk: currentPct },
    { label: "1 Month", risk: Math.min(99, Math.round((base + base * 0.04) * 100 * 10) / 10) },
    { label: "3 Months",risk: Math.min(99, Math.round((base + base * 0.10) * 100 * 10) / 10) },
    { label: "6 Months",risk: Math.min(99, Math.round((base + base * 0.18) * 100 * 10) / 10) },
    { label: "12 Months",risk: Math.min(99, Math.round((base + base * 0.30) * 100 * 10) / 10) },
  ];
}

export default function OrganDrawer({ organ, risk, formData, onClose }) {
  const risks  = normalizeRisks(risk);
  const pct    = risks[organ] || 0;
  const meta   = ORGAN_META[organ];
  const color  = getRiskColor(pct);
  const label  = getRiskLabel(pct);
  const tier   = getRiskTier(pct);
  const advice = CLINICAL_ADVICE[organ]?.[tier] || "";
  const factors = CONTRIBUTING[organ] || [];
  const projection = generateProjection(pct);

  // Health score contribution
  const weights = { heart: 40, kidney: 30, liver: 30 };
  const contribution = (pct * weights[organ]) / 100;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!organ || !risk) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label={`${meta?.label} Analytics`}>

        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          background: `linear-gradient(135deg, ${color}14, rgba(6,11,20,0.8))`,
          borderBottom: `1px solid ${color}33`,
          position: "sticky", top: 0, zIndex: 10,
          backdropFilter: "blur(20px)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>
                Organ Analytics
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{meta?.icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#e2e8f0" }}>
                    {meta?.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {meta?.specialist} · Risk Assessment
                  </div>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8", borderRadius: 8, width: 32, height: 32,
              cursor: "pointer", fontSize: 16, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* Risk display */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 44, fontWeight: 900, lineHeight: 1,
                color, fontFamily: "var(--font-mono)",
                textShadow: `0 0 20px ${color}88`,
              }}>{pct.toFixed(1)}<span style={{ fontSize: 20 }}>%</span></div>
              <div style={{
                marginTop: 4, fontSize: 11, fontWeight: 700,
                color, background: `${color}18`,
                border: `1px solid ${color}44`,
                borderRadius: 20, padding: "2px 10px", display: "inline-block",
              }}>{label}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, background: "rgba(255,255,255,0.06)",
                            borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                  borderRadius: 4, transition: "width 0.8s ease",
                  boxShadow: `0 0 8px ${color}66`,
                }}/>
              </div>
              <div style={{ fontSize: 10, color: "#64748b" }}>
                Health Score Impact: <span style={{ color, fontWeight: 700 }}>
                  −{contribution.toFixed(1)} pts
                </span> ({weights[organ]}% weighting)
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px" }}>

          {/* Clinical Advice */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569",
                          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Clinical Assessment
            </div>
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: `${color}0d`,
              border: `1px solid ${color}33`,
              borderLeft: `3px solid ${color}`,
              fontSize: 12, color: "#cbd5e1", lineHeight: 1.7,
            }}>
              {advice}
            </div>
          </div>

          {/* Contributing Factors */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569",
                          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Top Contributing Factors
            </div>
            {factors.map((f, i) => (
              <div key={f.factor} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                              alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: `${color}22`, border: `1px solid ${color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color, fontWeight: 800, flexShrink: 0,
                    }}>{i + 1}</div>
                    <span style={{ fontSize: 12, color: "#e2e8f0" }}>{f.factor}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: f.direction.includes("protective") ? "#10b981" : color }}>
                      {f.direction}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color,
                                   fontFamily: "var(--font-mono)" }}>
                      {(f.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                  <div style={{
                    height: "100%", width: `${f.weight * 100}%`,
                    background: f.direction.includes("protective") ? "#10b981" : color,
                    borderRadius: 2,
                    boxShadow: `0 0 4px ${f.direction.includes("protective") ? "#10b981" : color}`,
                  }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Risk Projection Timeline */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569",
                          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Risk Projection (No Intervention)
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              {projection.map((p, i) => {
                const barH = Math.max(8, (p.risk / 100) * 80);
                const col  = getRiskColor(p.risk);
                return (
                  <div key={p.label} style={{ flex: 1, display: "flex",
                                              flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 9, color: col, fontFamily: "var(--font-mono)",
                                   fontWeight: 700 }}>{p.risk.toFixed(0)}%</span>
                    <div style={{
                      width: "100%", height: barH, borderRadius: "4px 4px 0 0",
                      background: i === 0 ? color : `${col}88`,
                      boxShadow: i === 0 ? `0 0 8px ${color}66` : "none",
                      transition: "height 0.6s ease",
                    }}/>
                    <span style={{ fontSize: 8, color: "#475569", textAlign: "center",
                                   lineHeight: 1.2 }}>{p.label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "#475569", lineHeight: 1.5 }}>
              ⚠ Projection assumes no lifestyle changes or medical intervention.
            </div>
          </div>

          {/* Biomarker values if available */}
          {formData && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569",
                            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Current Biomarker Values
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {getBiomarkersForOrgan(organ, formData).map(({ label: bl, value, unit, ok }) => (
                  <div key={bl} style={{
                    padding: "8px 10px", borderRadius: 8,
                    background: ok ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                    border: `1px solid ${ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{bl}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700,
                                     color: ok ? "#10b981" : "#ef4444",
                                     fontFamily: "var(--font-mono)" }}>
                        {value}
                      </span>
                      <span style={{ fontSize: 9, color: "#475569" }}>{unit}</span>
                      <span style={{ fontSize: 10 }}>{ok ? "✓" : "!"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referral recommendation */}
          {pct > 60 && (
            <div style={{
              padding: "14px 16px", borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.35)",
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>
                🚨 Specialist Referral Recommended
              </div>
              <div style={{ fontSize: 11, color: "#fca5a5", lineHeight: 1.6 }}>
                Risk level warrants immediate consultation with a{" "}
                <strong>{meta?.specialist}</strong>.
                Please schedule an appointment within {pct > 80 ? "48 hours" : "2 weeks"}.
              </div>
            </div>
          )}

          {/* Close button */}
          <button onClick={onClose} className="btn-neon"
            style={{ width: "100%", padding: "11px", fontSize: 13 }}>
            Close Panel
          </button>
        </div>
      </div>
    </>
  );
}

function getBiomarkersForOrgan(organ, fd) {
  if (!fd) return [];
  const maps = {
    heart: [
      { label: "Sys BP",     value: fd.systolic_bp,       unit: "mmHg",  ok: fd.systolic_bp < 130 },
      { label: "LDL",        value: fd.ldl_cholesterol,   unit: "mg/dL", ok: fd.ldl_cholesterol < 100 },
      { label: "HDL",        value: fd.hdl_cholesterol,   unit: "mg/dL", ok: fd.hdl_cholesterol > 60 },
      { label: "Glucose",    value: fd.fasting_glucose,   unit: "mg/dL", ok: fd.fasting_glucose < 100 },
    ],
    kidney: [
      { label: "Creatinine", value: fd.serum_creatinine,  unit: "mg/dL", ok: fd.serum_creatinine <= 1.2 },
      { label: "Sys BP",     value: fd.systolic_bp,       unit: "mmHg",  ok: fd.systolic_bp < 130 },
      { label: "Glucose",    value: fd.fasting_glucose,   unit: "mg/dL", ok: fd.fasting_glucose < 100 },
    ],
    liver: [
      { label: "ALT",        value: fd.alt_enzyme,        unit: "U/L",   ok: fd.alt_enzyme <= 40 },
      { label: "AST",        value: fd.ast_enzyme,        unit: "U/L",   ok: fd.ast_enzyme <= 40 },
      { label: "BMI",        value: fd.bmi,               unit: "kg/m²", ok: fd.bmi < 25 },
    ],
  };
  return (maps[organ] || []).filter(b => b.value != null);
}
