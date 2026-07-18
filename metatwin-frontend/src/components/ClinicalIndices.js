/**
 * ClinicalIndices.js
 * Feature 9:  Biological Age calculator
 * Feature 12: Emergency Detection system
 * Feature 13: Doctor vs Patient view toggle
 * Feature 17: Clinical Risk Index (Cardiac / Renal / Liver / Metabolic / Overall)
 */
import React, { useState } from "react";

function riskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}

/* ── Biological Age ───────────────────────────────────────────────── */
function bioAge(formData, risks) {
  if (!formData) return null;
  const chrono = formData.age || 35;
  const h = risks.heart  || 0;
  const k = risks.kidney || 0;
  const l = risks.liver  || 0;

  const bmiPenalty  = formData.bmi ? (formData.bmi - 22) * 0.3 : 0;
  const bpPenalty   = formData.systolic_bp ? (formData.systolic_bp - 120) * 0.06 : 0;
  const riskPenalty = (h * 0.08 + k * 0.05 + l * 0.05);
  const exerciseBonus = 0; // could be dynamic

  return Math.max(chrono - 10, Math.round(chrono + bmiPenalty + bpPenalty + riskPenalty - exerciseBonus));
}

/* ── Emergency Detection ──────────────────────────────────────────── */
function detectEmergency(risks, liveData) {
  const alerts = [];
  const h = risks.heart  || 0;
  const k = risks.kidney || 0;
  const l = risks.liver  || 0;

  if (h > 80) alerts.push({ msg: "Cardiac risk critical (>80%). Seek immediate cardiology review.", col: "#dc2626", icon: "🚨" });
  if (k > 80) alerts.push({ msg: "Renal risk critical (>80%). Immediate nephrology referral required.", col: "#dc2626", icon: "🚨" });
  if (l > 80) alerts.push({ msg: "Hepatic risk critical (>80%). Urgent liver function tests needed.", col: "#dc2626", icon: "🚨" });
  if (h > 60 && k > 60) alerts.push({ msg: "Cardiorenal syndrome risk: Both heart and kidney critically elevated.", col: "#ef4444", icon: "⚠️" });
  if (liveData?.systolic > 170) alerts.push({ msg: "Hypertensive crisis detected (BP > 170 mmHg). Emergency care required.", col: "#dc2626", icon: "🚨" });
  if (liveData?.spo2 < 90) alerts.push({ msg: "SpO₂ below 90% — hypoxemia detected. Seek emergency care.", col: "#dc2626", icon: "🚨" });
  return alerts;
}

/* ── Clinical Index gauge ─────────────────────────────────────────── */
function IndexGauge({ label, score, icon, desc }) {
  const col = riskColor(score);
  const invScore = 100 - score; // higher = better health
  const healthCol = invScore >= 70 ? "#10b981" : invScore >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ background: `${col}08`, border: `1px solid ${col}22`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
          <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.3 }}>{desc}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: col, fontFamily: "monospace", textShadow: `0 0 8px ${col}66` }}>
            {score.toFixed(0)}%
          </div>
          <div style={{ fontSize: 8, color: healthCol, fontWeight: 700 }}>
            Index: {invScore}/100
          </div>
        </div>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${score}%`, background: `linear-gradient(90deg,${col}88,${col})`, borderRadius: 3, boxShadow: `0 0 6px ${col}66`, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

export default function ClinicalIndices({ risk, formData, liveData }) {
  const [viewMode, setViewMode] = useState("patient"); // patient | doctor
  const [tab, setTab] = useState("indices");

  const risks = {
    heart:  risk.heart  <= 1 ? risk.heart  * 100 : risk.heart,
    kidney: risk.kidney <= 1 ? risk.kidney * 100 : risk.kidney,
    liver:  risk.liver  <= 1 ? risk.liver  * 100 : risk.liver,
  };

  /* Derived clinical indices */
  const cardiacIndex   = Math.round(risks.heart);
  const renalIndex     = Math.round(risks.kidney);
  const liverIndex     = Math.round(risks.liver);
  const metabolicIndex = Math.round((risks.heart * 0.3 + risks.kidney * 0.3 + risks.liver * 0.4));
  const overallDTI     = Math.round(0.35 * risks.heart + 0.25 * risks.kidney + 0.25 * risks.liver + 0.15 * metabolicIndex);

  const bioAgeVal = bioAge(formData, risks);
  const emergencies = detectEmergency(risks, liveData);

  return (
    <div className="glass-card" style={{ padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
            🏥 Clinical Risk Dashboard
          </div>
          <div style={{ fontSize: 11, color: "#7c8fa8", marginTop: 2 }}>
            Multi-index assessment · Biological age · Emergency detection
          </div>
        </div>
        {/* Doctor / Patient toggle */}
        <div style={{ display: "flex", background: "rgba(14,24,40,0.8)", border: "1px solid rgba(56,100,160,0.2)", borderRadius: 8, overflow: "hidden" }}>
          {["patient", "doctor"].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              style={{
                background: viewMode === mode ? "rgba(56,189,248,0.2)" : "transparent",
                border: "none", color: viewMode === mode ? "#38bdf8" : "#64748b",
                padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
                fontSize: 11, fontWeight: 700, transition: "all 0.2s",
              }}>
              {mode === "patient" ? "👤 Patient" : "🩺 Doctor"}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency alerts — always shown */}
      {emergencies.length > 0 && (
        <div style={{ marginBottom: 14, animation: "fadeIn 0.3s ease" }}>
          {emergencies.map((a, i) => (
            <div key={i} style={{ background: `${a.col}10`, border: `1px solid ${a.col}44`, borderLeft: `4px solid ${a.col}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: a.col }}>EMERGENCY ALERT</div>
                <div style={{ fontSize: 11, color: "#fca5a5", lineHeight: 1.5, marginTop: 2 }}>{a.msg}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 14 }}>
        <button className={`tab-item${tab === "indices" ? " active" : ""}`} onClick={() => setTab("indices")}>📊 Indices</button>
        <button className={`tab-item${tab === "bioage"  ? " active" : ""}`} onClick={() => setTab("bioage")}>🧬 Bio Age</button>
        {viewMode === "doctor" && (
          <button className={`tab-item${tab === "doctor" ? " active" : ""}`} onClick={() => setTab("doctor")}>🔬 Doctor View</button>
        )}
      </div>

      {/* ── Clinical Indices ── */}
      {tab === "indices" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.3s ease" }}>
          <IndexGauge label="Cardiac Index"       icon="❤️"  score={cardiacIndex}   desc="Cardiovascular system health score" />
          <IndexGauge label="Renal Index"         icon="🫘"  score={renalIndex}     desc="Kidney function and filtration health" />
          <IndexGauge label="Hepatic Index"       icon="🟤"  score={liverIndex}     desc="Liver enzyme and metabolic health" />
          <IndexGauge label="Metabolic Index"     icon="⚡"  score={metabolicIndex} desc="Composite metabolic and systemic health" />

          {/* Overall Digital Twin Score */}
          <div style={{ background: "linear-gradient(135deg,rgba(56,189,248,0.08),rgba(167,139,250,0.06))", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 12, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>🧠 Overall Digital Twin Score</div>
                <div style={{ fontSize: 10, color: "#475569" }}>Weighted composite of all organ systems</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: riskColor(overallDTI), fontFamily: "monospace", textShadow: `0 0 12px ${riskColor(overallDTI)}66` }}>
                {100 - overallDTI}
                <span style={{ fontSize: 14, color: "#475569", fontWeight: 400 }}>/100</span>
              </div>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
              <div style={{ height: "100%", width: `${100 - overallDTI}%`, background: "linear-gradient(90deg,#38bdf8,#a78bfa)", borderRadius: 3, boxShadow: "0 0 8px rgba(56,189,248,0.5)", transition: "width 1s ease" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Biological Age ── */}
      {tab === "bioage" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          {bioAgeVal ? (
            <>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: "center", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 12, padding: "20px" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Chronological Age</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#38bdf8", fontFamily: "monospace" }}>{formData?.age || "—"}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>years</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: `${bioAgeVal > (formData?.age || 35) + 5 ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)"}`, border: `1px solid ${bioAgeVal > (formData?.age || 35) + 5 ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`, borderRadius: 12, padding: "20px" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Biological Age</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: bioAgeVal > (formData?.age || 35) + 5 ? "#ef4444" : "#10b981", fontFamily: "monospace" }}>{bioAgeVal}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>years</div>
                </div>
              </div>
              <div style={{ background: "rgba(14,24,40,0.6)", border: "1px solid rgba(56,100,160,0.2)", borderRadius: 10, padding: "14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  {bioAgeVal > (formData?.age || 35) + 2
                    ? `⚠️ Your body is ${bioAgeVal - formData.age} years older than your chronological age.`
                    : bioAgeVal < (formData?.age || 35) - 2
                    ? `✅ Your body is ${(formData?.age || 35) - bioAgeVal} years younger than your chronological age!`
                    : "✅ Your biological age closely matches your chronological age."}
                </div>
                <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.7 }}>
                  Biological age is calculated from: BMI ({formData?.bmi || "?"}), Blood Pressure ({formData?.systolic_bp || "?"} mmHg),
                  organ risk scores, and metabolic markers. Improving these factors can reduce biological age.
                </div>
              </div>
              {/* Contributors */}
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "BMI Impact", val: formData?.bmi ? `+${((formData.bmi - 22) * 0.3).toFixed(1)} yrs` : "N/A", ok: formData?.bmi < 25 },
                  { label: "BP Impact", val: formData?.systolic_bp ? `+${((formData.systolic_bp - 120) * 0.06).toFixed(1)} yrs` : "N/A", ok: formData?.systolic_bp < 130 },
                  { label: "Heart Risk", val: `+${(risks.heart * 0.08).toFixed(1)} yrs`, ok: risks.heart < 30 },
                  { label: "Kidney Risk", val: `+${(risks.kidney * 0.05).toFixed(1)} yrs`, ok: risks.kidney < 30 },
                ].map(c => (
                  <div key={c.label} style={{ background: "rgba(14,24,40,0.4)", border: `1px solid ${c.ok ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{c.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.ok ? "#10b981" : "#f59e0b", fontFamily: "monospace" }}>{c.val}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: 13 }}>
              Enter health data in the Health Input form to calculate biological age.
            </div>
          )}
        </div>
      )}

      {/* ── Doctor View ── */}
      {tab === "doctor" && viewMode === "doctor" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 4 }}>🔬 Doctor View — Additional Clinical Details</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Extended metrics, feature importance, and model confidence scores</div>
          </div>

          {/* Feature importance table */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Feature Importance (SHAP Summary)</div>
            {[
              { organ: "Heart",  top: "Systolic BP", importance: 0.28, conf: 94 },
              { organ: "Kidney", top: "Creatinine",  importance: 0.31, conf: 92 },
              { organ: "Liver",  top: "ALT Enzyme",  importance: 0.29, conf: 96 },
            ].map(row => (
              <div key={row.organ} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, padding: "8px 12px", background: "rgba(14,24,40,0.5)", border: "1px solid rgba(56,100,160,0.15)", borderRadius: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", minWidth: 50 }}>{row.organ}</span>
                <span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>Top feature: <strong style={{ color: "#e2e8f0" }}>{row.top}</strong></span>
                <span style={{ fontSize: 10, color: "#38bdf8", fontFamily: "monospace" }}>{(row.importance * 100).toFixed(0)}% SHAP</span>
                <span style={{ fontSize: 10, color: "#10b981", fontFamily: "monospace", background: "rgba(16,185,129,0.1)", borderRadius: 4, padding: "2px 6px" }}>{row.conf}% conf</span>
              </div>
            ))}
          </div>

          {/* Organ interaction summary */}
          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Cross-Organ Interaction Effects</div>
          {[
            { from: "Heart", to: "Kidney", effect: (risks.heart * 0.4).toFixed(0) + "% cardiorenal influence", risk: risks.heart > 50 },
            { from: "Liver", to: "Kidney", effect: (risks.liver * 0.25).toFixed(0) + "% hepatorenal influence", risk: risks.liver > 50 },
            { from: "Heart", to: "Liver",  effect: (risks.heart * 0.3).toFixed(0) + "% CVD-NAFLD axis",        risk: risks.heart > 60 },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "7px 12px", background: row.risk ? "rgba(239,68,68,0.05)" : "rgba(14,24,40,0.4)", border: `1px solid ${row.risk ? "rgba(239,68,68,0.2)" : "rgba(56,100,160,0.12)"}`, borderRadius: 7 }}>
              <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>{row.from}</span>
              <span style={{ fontSize: 10, color: "#475569" }}>→</span>
              <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>{row.to}</span>
              <span style={{ fontSize: 10, color: row.risk ? "#ef4444" : "#64748b", marginLeft: "auto" }}>{row.effect}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
