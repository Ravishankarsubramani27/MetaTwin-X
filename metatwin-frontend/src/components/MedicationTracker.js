/**
 * MedicationTracker.js
 * Log medications, see expected organ risk impact, and flag interactions.
 */
import React, { useState } from "react";

const MEDICATIONS = [
  { name:"Metformin",      class:"Antidiabetic",     heart:-3, kidney: 1, liver:-1, note:"Monitor renal function. Hold if eGFR <30." },
  { name:"Lisinopril",     class:"ACE Inhibitor",    heart:-8, kidney:-5, liver: 0, note:"Watch for hyperkalemia. Reduces cardiorenal risk." },
  { name:"Atorvastatin",   class:"Statin",           heart:-7, kidney: 0, liver: 2, note:"Monitor liver enzymes (ALT). Excellent cardiac benefit." },
  { name:"Amlodipine",     class:"CCB",              heart:-5, kidney:-2, liver: 0, note:"Safe in CKD. First-line for hypertension." },
  { name:"Losartan",       class:"ARB",              heart:-6, kidney:-4, liver: 0, note:"ARB — preferred over ACE in diabetic nephropathy." },
  { name:"Aspirin",        class:"Antiplatelet",     heart:-4, kidney: 0, liver: 1, note:"Low-dose cardioprotective. Caution with NSAIDs." },
  { name:"Furosemide",     class:"Loop Diuretic",    heart:-3, kidney: 3, liver: 0, note:"Monitor electrolytes and creatinine." },
  { name:"Spironolactone", class:"K-sparing Diuretic",heart:-4, kidney: 4, liver: 2, note:"Risk of hyperkalemia with ACE/ARB combo." },
  { name:"Insulin",        class:"Antidiabetic",     heart:-2, kidney: 0, liver:-1, note:"Adjust dose per renal function." },
  { name:"Omeprazole",     class:"PPI",              heart: 0, kidney: 1, liver: 1, note:"Long-term use may impair Mg absorption." },
  { name:"Warfarin",       class:"Anticoagulant",    heart:-2, kidney: 0, liver: 3, note:"Narrow therapeutic index. Regular INR monitoring required." },
  { name:"Ibuprofen",      class:"NSAID",            heart: 3, kidney: 6, liver: 2, note:"⚠ Avoid in CKD, heart failure, and elderly." },
];

const INTERACTION_PAIRS = [
  { drugs:["Lisinopril","Spironolactone"], severity:"High",   msg:"Hyperkalemia risk — monitor K⁺ closely." },
  { drugs:["Lisinopril","Losartan"],       severity:"High",   msg:"Dual RAAS blockade not recommended — increased AKI risk." },
  { drugs:["Warfarin","Aspirin"],          severity:"High",   msg:"Major bleeding risk — avoid combination unless directed." },
  { drugs:["Ibuprofen","Lisinopril"],      severity:"High",   msg:"NSAIDs blunt ACE inhibitor efficacy and worsen renal function." },
  { drugs:["Metformin","Furosemide"],      severity:"Medium", msg:"Diuretic-induced dehydration may increase lactic acidosis risk." },
  { drugs:["Atorvastatin","Warfarin"],     severity:"Medium", msg:"Statin may potentiate warfarin — monitor INR." },
  { drugs:["Spironolactone","Losartan"],   severity:"Medium", msg:"Combined K-sparing effect — hyperkalemia risk." },
];

function riskDelta(val) {
  if (val === 0) return null;
  const col = val < 0 ? "#10b981" : "#ef4444";
  const arrow = val < 0 ? "↓" : "↑";
  return <span style={{ color: col, fontWeight: 700, fontSize: 11 }}>{arrow}{Math.abs(val)}%</span>;
}

function detectInteractions(selected) {
  const names = selected.map(m => m.name);
  return INTERACTION_PAIRS.filter(p => p.drugs.every(d => names.includes(d)));
}

export default function MedicationTracker({ risk }) {
  const [selected, setSelected] = useState([]);
  const [search,   setSearch]   = useState("");
  const [showAdd,  setShowAdd]  = useState(false);

  const toggle = (med) => {
    setSelected(s => s.find(m => m.name === med.name)
      ? s.filter(m => m.name !== med.name)
      : [...s, med]);
  };

  const filtered = MEDICATIONS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.class.toLowerCase().includes(search.toLowerCase())
  );

  const interactions = detectInteractions(selected);

  // Net delta from all selected meds
  const netDelta = selected.reduce((acc, m) => ({
    heart:  acc.heart  + m.heart,
    kidney: acc.kidney + m.kidney,
    liver:  acc.liver  + m.liver,
  }), { heart: 0, kidney: 0, liver: 0 });

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
          💊 Medication Tracker
        </h2>
        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
          Log your medications to see expected organ risk impact and interaction warnings.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>

        {/* ── Left: Med library ── */}
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search medications…"
              className="neo-input" style={{ flex: 1 }}
            />
            <button onClick={() => setShowAdd(v => !v)} className="btn-neon"
              style={{ padding: "8px 14px", fontSize: 12, flexShrink: 0 }}>
              {showAdd ? "✕ Close" : "+ Add Custom"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {filtered.map(med => {
              const isOn = !!selected.find(m => m.name === med.name);
              return (
                <div key={med.name} onClick={() => toggle(med)}
                  style={{
                    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    background: isOn ? "rgba(56,189,248,0.08)" : "rgba(14,24,40,0.6)",
                    border: `1px solid ${isOn ? "rgba(56,189,248,0.4)" : "rgba(56,100,160,0.15)"}`,
                    transition: "all 0.15s",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isOn ? "#38bdf8" : "var(--text-primary)" }}>
                        {isOn ? "✓ " : ""}{med.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{med.class}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 9, color: "#94a3b8" }}>❤️ {riskDelta(med.heart) || "—"}</span>
                    <span style={{ fontSize: 9, color: "#94a3b8" }}>🫘 {riskDelta(med.kidney) || "—"}</span>
                    <span style={{ fontSize: 9, color: "#94a3b8" }}>🟤 {riskDelta(med.liver) || "—"}</span>
                  </div>
                  <div style={{ fontSize: 9, color: "#475569", marginTop: 4, lineHeight: 1.4 }}>{med.note}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Summary + Interactions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Active meds */}
          <div className="glass-card" style={{ padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase",
                          letterSpacing: "0.1em", marginBottom: 12 }}>
              Active Medications ({selected.length})
            </div>
            {selected.length === 0 ? (
              <div style={{ color: "#475569", fontSize: 12, textAlign: "center", padding: "16px 0" }}>
                Click medications to add them
              </div>
            ) : (
              selected.map(m => (
                <div key={m.name} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 8px", marginBottom: 4, borderRadius: 7,
                  background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)",
                }}>
                  <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{m.name}</span>
                  <button onClick={() => toggle(m)} style={{
                    background: "none", border: "none", color: "#ef4444",
                    cursor: "pointer", fontSize: 13, padding: "0 4px",
                  }}>✕</button>
                </div>
              ))
            )}
          </div>

          {/* Net risk impact */}
          {selected.length > 0 && (
            <div className="glass-card" style={{ padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase",
                            letterSpacing: "0.1em", marginBottom: 12 }}>
                Net Risk Impact
              </div>
              {[["❤️ Heart", netDelta.heart, "#ef4444"], ["🫘 Kidney", netDelta.kidney, "#38bdf8"], ["🟤 Liver", netDelta.liver, "#10b981"]].map(([label, delta, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between",
                                          alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 80, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${Math.min(Math.abs(delta) * 5, 100)}%`,
                        background: delta < 0 ? "#10b981" : "#ef4444",
                      }}/>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "monospace",
                                   color: delta < 0 ? "#10b981" : delta > 0 ? "#ef4444" : "#64748b",
                                   minWidth: 40, textAlign: "right" }}>
                      {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta}%`}
                    </span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 10, color: "#475569", lineHeight: 1.5,
                            padding: "8px", background: "rgba(56,189,248,0.04)",
                            border: "1px solid rgba(56,189,248,0.1)", borderRadius: 6 }}>
                Estimated combined effect on organ risks.
                Actual results depend on dosage, adherence, and individual response.
              </div>
            </div>
          )}

          {/* Interactions */}
          {interactions.length > 0 && (
            <div className="glass-card" style={{ padding: "16px",
              borderColor: "rgba(239,68,68,0.4)", borderWidth: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase",
                            letterSpacing: "0.1em", marginBottom: 12 }}>
                ⚠ Drug Interactions ({interactions.length})
              </div>
              {interactions.map((ix, i) => (
                <div key={i} style={{
                  padding: "10px 12px", borderRadius: 8, marginBottom: 8,
                  background: ix.severity === "High" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                  border: `1px solid ${ix.severity === "High" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                      background: ix.severity === "High" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                      color: ix.severity === "High" ? "#ef4444" : "#f59e0b",
                    }}>{ix.severity.toUpperCase()}</span>
                    <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>
                      {ix.drugs.join(" + ")}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{ix.msg}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
