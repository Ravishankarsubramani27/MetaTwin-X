/**
 * DoctorDashboard.js
 * Multi-patient clinical view — pulls REAL patient records from the DB.
 * Current patient's live scores are always shown first and up-to-date.
 */
import React, { useState, useEffect, useCallback } from "react";
import { normalizeRisks, getAllPatients } from "../services/api";

function riskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}

function riskLabel(pct) {
  if (pct <= 20) return "Normal";
  if (pct <= 40) return "Moderate";
  if (pct <= 60) return "Elevated";
  if (pct <= 80) return "High";
  return "Critical";
}

function RiskPill({ value }) {
  const col = riskColor(value);
  return (
    <span style={{
      display: "inline-block", minWidth: 52, textAlign: "center",
      padding: "2px 8px", borderRadius: 12,
      background: `${col}18`, color: col,
      border: `1px solid ${col}44`,
      fontSize: 11, fontWeight: 700, fontFamily: "monospace",
    }}>{value.toFixed(0)}%</span>
  );
}

function formatDate(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("en-US",
      { month: "short", day: "numeric", year: "numeric" });
  } catch { return ts; }
}

export default function DoctorDashboard({ patientId, risk, formData }) {
  const [patients,       setPatients]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [selected,       setSelected]       = useState(null);
  const [sortBy,         setSortBy]         = useState("risk");
  const [filterCritical, setFilterCritical] = useState(false);
  const [lastRefresh,    setLastRefresh]    = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await getAllPatients();
      const dbPatients = (data.patients || []).map(p => {
        // Normalize risk scores (DB stores 0–1 fractions)
        const risks = normalizeRisks({
          heart:  p.heart_risk,
          kidney: p.kidney_risk,
          liver:  p.liver_risk,
        });
        return {
          ...p,
          risks,
          isCurrentUser: p.patient_id === patientId,
        };
      });

      // Inject / update the current patient with live scores (most recent prediction)
      const currentRisks = risk ? normalizeRisks(risk) : null;
      const currentIdx   = dbPatients.findIndex(p => p.patient_id === patientId);

      if (currentRisks) {
        const currentEntry = {
          patient_id:    patientId,
          name:          formData
            ? `${formData.sex === "male" ? "Mr" : "Ms"} Patient (You)`
            : "Current Patient",
          age:           formData?.age  || (currentIdx >= 0 ? dbPatients[currentIdx].age  : 0),
          sex:           formData?.sex  || (currentIdx >= 0 ? dbPatients[currentIdx].sex  : "—"),
          risks:         currentRisks,
          heart_risk:    risk.heart,
          kidney_risk:   risk.kidney,
          liver_risk:    risk.liver,
          last_visit:    new Date().toISOString(),
          record_count:  currentIdx >= 0 ? dbPatients[currentIdx].record_count : 1,
          biomarkers:    formData ? {
            bmi:               formData.bmi,
            systolic_bp:       formData.systolic_bp,
            fasting_glucose:   formData.fasting_glucose,
            serum_creatinine:  formData.serum_creatinine,
            alt_enzyme:        formData.alt_enzyme,
            total_cholesterol: formData.total_cholesterol,
          } : (currentIdx >= 0 ? dbPatients[currentIdx].biomarkers : {}),
          isCurrentUser: true,
        };
        if (currentIdx >= 0) dbPatients[currentIdx] = currentEntry;
        else dbPatients.unshift(currentEntry);
      }

      setPatients(dbPatients);
      setLastRefresh(new Date());
    } catch (e) {
      setError("Could not load patient data from server. " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  }, [patientId, risk, formData]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // Sort + filter
  const displayed = [...patients]
    .filter(p => !filterCritical ||
      Math.max(p.risks.heart, p.risks.kidney, p.risks.liver) > 60)
    .sort((a, b) => {
      if (sortBy === "risk") {
        const ma = Math.max(a.risks.heart, a.risks.kidney, a.risks.liver);
        const mb = Math.max(b.risks.heart, b.risks.kidney, b.risks.liver);
        return mb - ma;
      }
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "age")  return (b.age || 0) - (a.age || 0);
      if (sortBy === "date") return new Date(b.last_visit) - new Date(a.last_visit);
      return 0;
    });

  const critical  = patients.filter(p =>
    Math.max(p.risks.heart, p.risks.kidney, p.risks.liver) > 60);
  const sel = selected ? patients.find(p => p.patient_id === selected) : null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900,
                       color: "var(--text-primary)", margin: 0 }}>
            🏥 Doctor Dashboard
          </h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
            Real patient records from database — critical patients sorted to the top.
            {lastRefresh && (
              <span style={{ color: "#475569", marginLeft: 8 }}>
                Last refreshed: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button onClick={fetchPatients} disabled={loading}
          className="btn-neon" style={{ padding: "7px 14px", fontSize: 11 }}>
          {loading ? "⟳ Loading…" : "⟳ Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 16,
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      color: "#ef4444", fontSize: 12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && patients.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#475569" }}>
          <div style={{ width: 24, height: 24, border: "2px solid rgba(56,189,248,0.2)",
                        borderTop: "2px solid #38bdf8", borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 12px" }}/>
          Loading patient records from database…
        </div>
      )}

      {/* No patients yet */}
      {!loading && patients.length === 0 && !error && (
        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
                        marginBottom: 8 }}>No patient records yet</div>
          <div style={{ fontSize: 12, color: "#64748b", maxWidth: 400, margin: "0 auto" }}>
            Submit health data using the Health Input form to create your first patient record.
            Each prediction is automatically saved to the database.
          </div>
        </div>
      )}

      {patients.length > 0 && (
        <>
          {/* Critical alert banner */}
          {critical.length > 0 && (
            <div style={{
              padding: "10px 16px", borderRadius: 10, marginBottom: 16,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 16 }}>🚨</span>
              <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>
                {critical.length} patient{critical.length > 1 ? "s" : ""} with
                critical risk — {critical.map(p => p.name || p.patient_id).join(", ")}
              </span>
            </div>
          )}

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                        gap: 12, marginBottom: 18 }}>
            {[
              { label: "Total Patients", value: patients.length,   color: "#38bdf8" },
              { label: "Critical (>60%)",value: critical.length,   color: "#ef4444" },
              { label: "Elevated (40–60%)",
                value: patients.filter(p => {
                  const m = Math.max(p.risks.heart, p.risks.kidney, p.risks.liver);
                  return m > 40 && m <= 60;
                }).length, color: "#f97316" },
              { label: "Normal (≤40%)",
                value: patients.filter(p =>
                  Math.max(p.risks.heart, p.risks.kidney, p.risks.liver) <= 40
                ).length, color: "#10b981" },
            ].map(s => (
              <div key={s.label} className="glass-card"
                style={{ padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase",
                              letterSpacing: "0.08em", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: s.color,
                              fontFamily: "var(--font-mono)" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>

            {/* Patient table */}
            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Controls */}
              <div style={{ padding: "12px 16px",
                            borderBottom: "1px solid rgba(56,100,160,0.15)",
                            display: "flex", gap: 8, alignItems: "center",
                            flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#475569",
                               textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Sort:
                </span>
                {["risk","name","age","date"].map(s => (
                  <button key={s} onClick={() => setSortBy(s)} style={{
                    padding: "3px 9px", borderRadius: 6, cursor: "pointer", fontSize: 11,
                    border: sortBy === s
                      ? "1px solid rgba(56,189,248,0.5)" : "1px solid rgba(56,100,160,0.2)",
                    background: sortBy === s ? "rgba(56,189,248,0.1)" : "transparent",
                    color: sortBy === s ? "#38bdf8" : "#64748b",
                    fontWeight: sortBy === s ? 700 : 500,
                  }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
                <label style={{ display: "flex", alignItems: "center", gap: 5,
                                cursor: "pointer", marginLeft: "auto",
                                fontSize: 11, color: "#64748b" }}>
                  <input type="checkbox" checked={filterCritical}
                    onChange={e => setFilterCritical(e.target.checked)}
                    style={{ accentColor: "#ef4444" }}/>
                  Critical only
                </label>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(14,24,40,0.8)" }}>
                      {["Patient","Age","❤️ Heart","🫘 Kidney","🟤 Liver",
                        "Max Risk","Status","Last Visit"].map(h => (
                        <th key={h} style={{
                          padding: "9px 12px", textAlign: "left",
                          fontSize: 10, fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.07em",
                          color: "#64748b", whiteSpace: "nowrap",
                          borderBottom: "1px solid rgba(56,100,160,0.15)",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(p => {
                      const maxRisk = Math.max(
                        p.risks.heart, p.risks.kidney, p.risks.liver);
                      const isSel  = selected === p.patient_id;
                      return (
                        <tr key={p.patient_id}
                          onClick={() => setSelected(isSel ? null : p.patient_id)}
                          style={{
                            cursor: "pointer",
                            background: isSel
                              ? "rgba(56,189,248,0.07)"
                              : p.isCurrentUser
                              ? "rgba(167,139,250,0.05)" : "transparent",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => {
                            if (!isSel) e.currentTarget.style.background =
                              "rgba(56,189,248,0.04)";
                          }}
                          onMouseLeave={e => {
                            if (!isSel) e.currentTarget.style.background =
                              p.isCurrentUser ? "rgba(167,139,250,0.05)" : "transparent";
                          }}>
                          <td style={{ padding: "9px 12px",
                                       borderBottom: "1px solid rgba(56,100,160,0.08)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700,
                                          color: p.isCurrentUser ? "#a78bfa" : "#e2e8f0" }}>
                              {p.name || p.patient_id}
                              {p.isCurrentUser && (
                                <span style={{ fontSize: 8, color: "#a78bfa",
                                               marginLeft: 5,
                                               background: "rgba(167,139,250,0.15)",
                                               padding: "1px 5px", borderRadius: 4 }}>
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 9, color: "#475569",
                                          fontFamily: "monospace", marginTop: 1 }}>
                              {p.patient_id}
                              {p.record_count > 1 && (
                                <span style={{ color: "#38bdf8", marginLeft: 5 }}>
                                  {p.record_count} visits
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "9px 12px", fontSize: 11, color: "#94a3b8",
                                       borderBottom: "1px solid rgba(56,100,160,0.08)" }}>
                            {p.age ? `${p.age}` : "—"}
                            {p.sex && p.sex !== "—" && (
                              <span style={{ color: "#475569", marginLeft: 3 }}>
                                · {typeof p.sex === "string"
                                  ? p.sex.charAt(0).toUpperCase() : p.sex}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "9px 12px",
                                       borderBottom: "1px solid rgba(56,100,160,0.08)" }}>
                            <RiskPill value={p.risks.heart}/>
                          </td>
                          <td style={{ padding: "9px 12px",
                                       borderBottom: "1px solid rgba(56,100,160,0.08)" }}>
                            <RiskPill value={p.risks.kidney}/>
                          </td>
                          <td style={{ padding: "9px 12px",
                                       borderBottom: "1px solid rgba(56,100,160,0.08)" }}>
                            <RiskPill value={p.risks.liver}/>
                          </td>
                          <td style={{ padding: "9px 12px",
                                       borderBottom: "1px solid rgba(56,100,160,0.08)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <div style={{ width: 50, height: 4,
                                            background: "rgba(255,255,255,0.06)",
                                            borderRadius: 2 }}>
                                <div style={{ height: "100%",
                                              width: `${Math.min(maxRisk, 100)}%`,
                                              background: riskColor(maxRisk),
                                              borderRadius: 2 }}/>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 800,
                                             color: riskColor(maxRisk),
                                             fontFamily: "monospace" }}>
                                {maxRisk.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "9px 12px",
                                       borderBottom: "1px solid rgba(56,100,160,0.08)" }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              padding: "2px 7px", borderRadius: 8,
                              background: `${riskColor(maxRisk)}18`,
                              color: riskColor(maxRisk),
                              border: `1px solid ${riskColor(maxRisk)}33`,
                            }}>{riskLabel(maxRisk)}</span>
                          </td>
                          <td style={{ padding: "9px 12px", fontSize: 10,
                                       color: "#475569",
                                       borderBottom: "1px solid rgba(56,100,160,0.08)" }}>
                            {p.isCurrentUser
                              ? <span style={{ color: "#10b981" }}>Now</span>
                              : formatDate(p.last_visit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail panel */}
            <div>
              {sel ? (
                <div className="glass-card" style={{ padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                                alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800,
                                    color: sel.isCurrentUser ? "#a78bfa" : "var(--text-primary)" }}>
                        {sel.name || sel.patient_id}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                        {sel.patient_id}
                        {sel.age ? ` · ${sel.age} yrs` : ""}
                        {sel.sex && sel.sex !== "—" ? ` · ${sel.sex}` : ""}
                      </div>
                    </div>
                    <button onClick={() => setSelected(null)} style={{
                      background: "none", border: "none", color: "#64748b",
                      cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>

                  {/* Risk bars */}
                  {[["❤️ Heart",  sel.risks.heart,  "#ef4444"],
                    ["🫘 Kidney", sel.risks.kidney, "#38bdf8"],
                    ["🟤 Liver",  sel.risks.liver,  "#10b981"]
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ marginBottom: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between",
                                    marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{l}</span>
                        <span style={{ fontSize: 13, fontWeight: 900,
                                       color: riskColor(v),
                                       fontFamily: "monospace" }}>{v.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 5, background: "rgba(255,255,255,0.06)",
                                    borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${v}%`,
                                      background: `linear-gradient(90deg,${c},${riskColor(v)})`,
                                      borderRadius: 3,
                                      boxShadow: `0 0 5px ${riskColor(v)}55`,
                                      transition: "width 0.6s ease" }}/>
                      </div>
                    </div>
                  ))}

                  {/* Health score */}
                  <div style={{ marginTop: 14, padding: "10px",
                                background: "rgba(56,189,248,0.05)",
                                border: "1px solid rgba(56,189,248,0.15)",
                                borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 3 }}>
                      Health Score
                    </div>
                    {(() => {
                      const hs = Math.round(100 - (
                        0.4*sel.risks.heart + 0.3*sel.risks.kidney + 0.3*sel.risks.liver));
                      return (
                        <div style={{ fontSize: 26, fontWeight: 900,
                                      fontFamily: "var(--font-mono)",
                                      color: hs >= 70 ? "#10b981"
                                           : hs >= 40 ? "#f59e0b" : "#ef4444" }}>
                          {hs}<span style={{ fontSize:12, color:"#475569" }}>/100</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Biomarkers if available */}
                  {sel.biomarkers && Object.values(sel.biomarkers).some(v => v != null) && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#475569",
                                    textTransform: "uppercase", letterSpacing: "0.1em",
                                    marginBottom: 7 }}>Key Biomarkers</div>
                      {[
                        ["BMI",        sel.biomarkers.bmi,               "kg/m²"],
                        ["Sys BP",     sel.biomarkers.systolic_bp,        "mmHg"],
                        ["Glucose",    sel.biomarkers.fasting_glucose,    "mg/dL"],
                        ["Creatinine", sel.biomarkers.serum_creatinine,   "mg/dL"],
                        ["ALT",        sel.biomarkers.alt_enzyme,         "U/L"],
                        ["Cholesterol",sel.biomarkers.total_cholesterol,  "mg/dL"],
                      ].filter(([,v]) => v != null).map(([l, v, u]) => (
                        <div key={l} style={{ display: "flex",
                                              justifyContent: "space-between",
                                              padding: "4px 0",
                                              borderBottom: "1px solid rgba(56,100,160,0.06)" }}>
                          <span style={{ fontSize: 11, color: "#64748b" }}>{l}</span>
                          <span style={{ fontSize: 11, color: "#e2e8f0",
                                         fontFamily: "monospace", fontWeight: 600 }}>
                            {Number(v).toFixed(1)} {u}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clinical flags */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569",
                                  textTransform: "uppercase", letterSpacing: "0.1em",
                                  marginBottom: 7 }}>Clinical Flags</div>
                    {sel.risks.heart  > 60 && <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 3 }}>🚨 Cardiologist referral recommended</div>}
                    {sel.risks.kidney > 60 && <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 3 }}>🚨 Nephrology follow-up required</div>}
                    {sel.risks.liver  > 60 && <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 3 }}>🚨 Hepatology evaluation needed</div>}
                    {sel.risks.heart  > 40 && sel.risks.heart  <= 60 && <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 3 }}>⚠ Cardiac monitoring advised</div>}
                    {sel.risks.kidney > 40 && sel.risks.kidney <= 60 && <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 3 }}>⚠ Renal function monitoring</div>}
                    {sel.risks.heart <= 40 && sel.risks.kidney <= 40 && sel.risks.liver <= 40 && (
                      <div style={{ fontSize: 11, color: "#10b981" }}>✅ No immediate clinical concerns</div>
                    )}
                    <div style={{ fontSize: 9, color: "#475569", marginTop: 6 }}>
                      Last visit: {formatDate(sel.last_visit)}
                      {sel.record_count > 0 && ` · ${sel.record_count} total records`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: "32px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>👆</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Click a patient row to see their full risk breakdown and biomarkers
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
