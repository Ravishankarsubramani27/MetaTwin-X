/**
 * PatientReport.js
 * Full AI Patient Report component — upload, analyse, view, download PDF
 */
import React, { useState, useRef } from "react";
import axios from "axios";
import { generateReportFromScores } from "../services/api";
import { printPatientReport } from "./PrintReport";

const BASE = "http://127.0.0.1:8000";

// ── Status badge ──────────────────────────────────────────────────────
const STATUS_COLORS = {
  Normal:       { bg:"rgba(16,185,129,0.1)",  c:"#10b981", bd:"rgba(16,185,129,0.3)"  },
  Elevated:     { bg:"rgba(245,158,11,0.1)",  c:"#f59e0b", bd:"rgba(245,158,11,0.3)"  },
  Critical:     { bg:"rgba(239,68,68,0.1)",   c:"#ef4444", bd:"rgba(239,68,68,0.3)"   },
  Low:          { bg:"rgba(56,189,248,0.1)",  c:"#38bdf8", bd:"rgba(56,189,248,0.3)"  },
  High:         { bg:"rgba(239,68,68,0.1)",   c:"#ef4444", bd:"rgba(239,68,68,0.3)"   },
  Moderate:     { bg:"rgba(245,158,11,0.1)",  c:"#f59e0b", bd:"rgba(245,158,11,0.3)"  },
  "Rule Applied":{ bg:"rgba(167,139,250,0.1)",c:"#a78bfa", bd:"rgba(167,139,250,0.3)" },
  Unknown:      { bg:"rgba(71,85,105,0.1)",   c:"#64748b", bd:"rgba(71,85,105,0.3)"   },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.Unknown;
  return (
    <span style={{
      background:s.bg, color:s.c, border:`1px solid ${s.bd}`,
      borderRadius:12, padding:"2px 9px",
      fontSize:10, fontWeight:700, whiteSpace:"nowrap",
    }}>{status}</span>
  );
}

// ── Risk summary row (text only — no big visual gauge) ────────────────
function RiskSummaryRow({ label, score, color, interpretation }) {
  const pct = score;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:16,
      padding:"10px 14px",
      background:`${color}08`,
      border:`1px solid ${color}22`,
      borderLeft:`3px solid ${color}`,
      borderRadius:"0 8px 8px 0",
      marginBottom:8,
    }}>
      <div style={{ minWidth:80 }}>
        <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase",
                      letterSpacing:"0.08em", marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:900, color,
                      fontFamily:"var(--font-mono)",
                      textShadow:`0 0 8px ${color}66` }}>
          {pct.toFixed(1)}%
        </div>
      </div>
      <div style={{ flex:1, fontSize:12, color:"#cbd5e1", lineHeight:1.5 }}>
        {interpretation}
      </div>
      <div style={{ height:4, width:80, background:"rgba(255,255,255,0.06)",
                    borderRadius:2, overflow:"hidden", flexShrink:0 }}>
        <div style={{ height:"100%", width:`${Math.min(pct,100)}%`,
                      background:color, borderRadius:2 }}/>
      </div>
    </div>
  );
}

// ── Test Analysis Table ───────────────────────────────────────────────
function TestAnalysisTable({ rows }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"rgba(14,24,40,0.8)" }}>
            {["What You Tested","Input Value","What Should Happen",
              "What Actually Happened","Status"].map(h=>(
              <th key={h} style={{
                padding:"10px 12px", textAlign:"left",
                fontSize:10, fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.08em", color:"#64748b",
                borderBottom:"2px solid rgba(56,100,160,0.3)",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const sc = STATUS_COLORS[row.status] || STATUS_COLORS.Unknown;
            const rowBg = row.status==="Critical" ? "rgba(239,68,68,0.04)"
                        : row.status==="Elevated"  ? "rgba(245,158,11,0.04)"
                        : row.status==="Normal"    ? "rgba(16,185,129,0.03)"
                        : "rgba(14,24,40,0.3)";
            return (
              <tr key={i} style={{ background: rowBg, transition:"background 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(56,189,248,0.05)"}
                onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                <td style={{ padding:"10px 12px", fontWeight:600, color:"#e2e8f0",
                              borderBottom:"1px solid rgba(56,100,160,0.1)", fontSize:12 }}>
                  {row.flag} {row.what_tested}
                </td>
                <td style={{ padding:"10px 12px", fontFamily:"monospace",
                              color:"#cbd5e1", fontSize:12,
                              borderBottom:"1px solid rgba(56,100,160,0.1)" }}>
                  {row.input}
                </td>
                <td style={{ padding:"10px 12px", color:"#94a3b8", fontSize:11,
                              lineHeight:1.5, borderBottom:"1px solid rgba(56,100,160,0.1)" }}>
                  {row.what_should_happen}
                </td>
                <td style={{ padding:"10px 12px", color:sc.c, fontSize:11,
                              lineHeight:1.5, fontWeight:500,
                              borderBottom:"1px solid rgba(56,100,160,0.1)" }}>
                  {row.what_actually_happened}
                </td>
                <td style={{ padding:"10px 12px",
                              borderBottom:"1px solid rgba(56,100,160,0.1)",
                              textAlign:"center" }}>
                  <StatusBadge status={row.status}/>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Upload panel ──────────────────────────────────────────────────────
function UploadPanel({ onReport, loading, setLoading }) {
  const [file,     setFile]     = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error,    setError]    = useState(null);
  const [detected, setDetected] = useState(null); // patient info auto-detected
  const inputRef = useRef();

  const handleAnalyse = async () => {
    if (!file) return;
    setLoading(true); setError(null); setDetected(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // No patient_id / patient_name — fully automatic extraction
      const res = await axios.post(
        `${BASE}/report/from-upload`,
        fd, { timeout: 60000 }
      );
      // Show what was auto-detected from the document
      if (res.data.patient) {
        setDetected(res.data.patient);
      }
      onReport(res.data);
    } catch(e) {
      setError(e?.response?.data?.detail || e.message || "Analysis failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="glass-card" style={{ padding:"24px", marginBottom:20,
      background:"linear-gradient(135deg,rgba(56,189,248,0.05),rgba(167,139,250,0.04))",
      borderColor:"rgba(56,189,248,0.2)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
        <div style={{ width:46,height:46,
          background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(167,139,250,0.2))",
          border:"1px solid rgba(56,189,248,0.3)", borderRadius:13,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>📋</div>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)" }}>
            AI Patient Report Generator
          </div>
          <div style={{ fontSize:11, color:"#7c8fa8", marginTop:2 }}>
            Upload lab report → AI extracts patient details + biomarkers automatically → full structured report
          </div>
        </div>
      </div>

      {/* Auto-detection badge */}
      {detected && (
        <div style={{
          marginBottom:16, padding:"10px 14px", borderRadius:8,
          background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.25)",
          display:"flex", gap:14, flexWrap:"wrap", alignItems:"center",
        }}>
          <span style={{ fontSize:13 }}>✅</span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#10b981", marginBottom:2 }}>
              Patient details extracted from document
            </div>
            <div style={{ fontSize:11, color:"#94a3b8", display:"flex", gap:16, flexWrap:"wrap" }}>
              {detected.name && <span>👤 <strong style={{color:"#e2e8f0"}}>{detected.name}</strong></span>}
              {detected.id   && <span>🆔 <strong style={{color:"#38bdf8",fontFamily:"monospace"}}>{detected.id}</strong></span>}
              {detected.age  && <span>📅 Age {detected.age}</span>}
              {detected.sex  && <span>⚧ {detected.sex}</span>}
              {detected.report_date && <span>🗓 {detected.report_date}</span>}
              {detected.doctor && <span>👨‍⚕️ Dr. {detected.doctor}</span>}
              {detected.from_document === false && (
                <span style={{color:"#f59e0b"}}>⚠ Name/ID auto-generated</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div onDragOver={e=>{e.preventDefault();setDragOver(true)}}
           onDragLeave={()=>setDragOver(false)}
           onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)setFile(f);}}
           onClick={()=>!loading&&inputRef.current.click()}
           style={{
             border:`2px dashed ${dragOver?"#38bdf8":file?"#10b981":"rgba(56,100,160,0.35)"}`,
             borderRadius:10, padding:"24px 20px", textAlign:"center",
             cursor:loading?"default":"pointer", marginBottom:14,
             background:dragOver?"rgba(56,189,248,0.06)":file?"rgba(16,185,129,0.05)":"rgba(14,24,40,0.4)",
             transition:"all 0.2s",
           }}>
        <input ref={inputRef} type="file" style={{display:"none"}}
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={e=>{const f=e.target.files[0];if(f)setFile(f);}}/>
        {file ? (
          <div>
            <div style={{fontSize:28,marginBottom:6}}>📄</div>
            <div style={{color:"#10b981",fontWeight:700,fontSize:14,fontFamily:"monospace"}}>{file.name}</div>
            <div style={{color:"#7c8fa8",fontSize:11,marginTop:3}}>{(file.size/1024).toFixed(1)} KB</div>
          </div>
        ) : (
          <div>
            <div style={{fontSize:32,marginBottom:8}}>{dragOver?"📂":"⬆️"}</div>
            <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:13}}>Drop lab report here</div>
            <div style={{color:"#7c8fa8",fontSize:11,marginTop:3}}>PDF, PNG, JPG, TXT supported</div>
          </div>
        )}
      </div>

      {error && (
        <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",
                     borderRadius:8,padding:"10px 14px",marginBottom:12,
                     color:"#ef4444",fontSize:12}}>{error}</div>
      )}

      <button className="btn-neon-solid" onClick={handleAnalyse}
        disabled={!file||loading}
        style={{width:"100%",padding:"12px",fontSize:14}}>
        {loading ? (
          <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{width:14,height:14,border:"2px solid rgba(56,189,248,0.3)",
                          borderTop:"2px solid #38bdf8",borderRadius:"50%",
                          animation:"spin 0.8s linear infinite",display:"inline-block"}}/>
            Analysing Report…
          </span>
        ) : "🔬 Generate AI Patient Report"}
      </button>
    </div>
  );
}

// ── Main PatientReport component ──────────────────────────────────────
export default function PatientReport({ existingScores, existingBiomarkers,
                                         existingAudit, patientId, formData }) {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode,    setMode]    = useState("upload"); // "upload" | "from-scores"

  // Generate report from existing analysis results
  const generateFromScores = async () => {
    if (!existingScores) return;
    setLoading(true);
    try {
      const pName = formData
        ? `${formData.sex==="male"?"Mr":"Ms"} Patient, Age ${formData.age}`
        : "Patient";
      const res = await generateReportFromScores(
        patientId || "P001", pName,
        existingScores,
        { ...existingBiomarkers, ...formData },
        existingAudit || [],
      );
      setReport(res);
    } catch(e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const section = (icon, title, children, accent="#2563eb") => (
    <div className="glass-card" style={{padding:"20px 24px",marginBottom:18}}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16,
                    paddingBottom:10, borderBottom:"1px solid rgba(56,100,160,0.2)" }}>
        <div style={{ width:4, height:20, background:accent, borderRadius:2 }}/>
        <span style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)" }}>
          {icon} {title}
        </span>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{maxWidth:1000,margin:"0 auto",animation:"fadeIn 0.3s ease"}}>
      {/* Mode tabs */}
      <div className="tab-bar" style={{marginBottom:18}}>
        <button className={`tab-item${mode==="upload"?"active":""}`}
          onClick={()=>setMode("upload")}>📄 Upload Lab Report</button>
        {existingScores && (
          <button className={`tab-item${mode==="from-scores"?"active":""}`}
            onClick={()=>setMode("from-scores")}>⊞ From Current Analysis</button>
        )}
      </div>

      {/* Upload mode */}
      {mode==="upload" && (
        <UploadPanel
          onReport={d=>setReport(d)}
          loading={loading}
          setLoading={setLoading}/>
      )}

      {/* From scores mode */}
      {mode==="from-scores" && existingScores && (
        <div className="glass-card" style={{padding:"20px 24px",marginBottom:18}}>
          <div style={{fontSize:14,color:"#cbd5e1",marginBottom:14}}>
            Generate a full patient report from your current analysis results.
          </div>
          <button className="btn-neon-solid" onClick={generateFromScores}
            disabled={loading} style={{padding:"11px 28px",fontSize:14}}>
            {loading ? "Generating…" : "📋 Generate Report from Analysis"}
          </button>
        </div>
      )}

      {/* ════ REPORT OUTPUT ════ */}
      {report && (() => {
        const r   = report.report;
        const s   = r.summary;
        const ra  = r.risk_analysis;
        const hs  = s.health_score;
        // eslint-disable-next-line no-unused-vars
        const hsc = hs>=70?"#10b981":hs>=45?"#f59e0b":"#ef4444";

        return (
          <div style={{animation:"fadeIn 0.4s ease"}}>

            {/* ── Header ── */}
            <div className="glass-card" style={{
              padding:"24px 28px", marginBottom:18,
              background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%)",
              borderColor:"transparent",
            }}>
              <div style={{display:"flex",justifyContent:"space-between",
                           alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{color:"rgba(255,255,255,0.5)",fontSize:9,fontWeight:700,
                               textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6}}>
                    MetaTwin-X · AI Patient Report
                  </div>
                  <div style={{color:"#fff",fontSize:20,fontWeight:900,marginBottom:4}}>
                    {r.report_title}
                  </div>
                  <div style={{color:"rgba(255,255,255,0.65)",fontSize:12}}>
                    Patient: <strong style={{color:"#fff"}}>{r.patient_name}</strong>
                    &nbsp;·&nbsp; ID: <strong style={{color:"#38bdf8",fontFamily:"monospace"}}>{r.patient_id}</strong>
                    &nbsp;·&nbsp; {r.generated_at}
                  </div>
                  {report.patient && (
                    <div style={{marginTop:6,display:"flex",gap:10,flexWrap:"wrap"}}>
                      {report.patient.report_date && (
                        <span style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>
                          🗓 Report date: {report.patient.report_date}
                        </span>
                      )}
                      {report.patient.doctor && (
                        <span style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>
                          👨‍⚕️ {report.patient.doctor}
                        </span>
                      )}
                      {report.saved_to_db && (
                        <span style={{fontSize:10,color:"#10b981"}}>
                          ✅ Saved to database
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <button onClick={() => printPatientReport(report)}
                    style={{
                      background:"rgba(255,255,255,0.1)",color:"#fff",
                      border:"1px solid rgba(255,255,255,0.25)",
                      borderRadius:8,padding:"8px 16px",fontSize:12,
                      fontWeight:700,cursor:"pointer",
                      display:"flex",alignItems:"center",gap:6,
                    }}>
                    🖨️ Print / PDF
                  </button>
                  <span style={{
                    background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.7)",
                    border:"1px solid rgba(255,255,255,0.15)",
                    borderRadius:8,padding:"6px 12px",fontSize:11,
                  }}>
                    Confidence: <strong style={{color: report.extraction?.confidence>=0.7?"#10b981":"#f59e0b"}}>
                      {report.extraction ? `${(report.extraction.confidence*100).toFixed(0)}%` : "N/A"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* ── Section A: Summary ── */}
            {section("A.", "Patient Summary", (
              <div style={{display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
                {/* Health score — compact text version */}
                <div style={{
                  background:"rgba(14,24,40,0.6)",
                  border:`1px solid ${hs>=70?"rgba(16,185,129,0.3)":hs>=45?"rgba(245,158,11,0.3)":"rgba(239,68,68,0.3)"}`,
                  borderRadius:10, padding:"16px 20px", minWidth:180, textAlign:"center",
                }}>
                  <div style={{fontSize:10,color:"#64748b",fontWeight:700,
                               textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>
                    Health Score
                  </div>
                  <div style={{
                    fontSize:44, fontWeight:900, lineHeight:1,
                    color: hs>=70?"#10b981":hs>=45?"#f59e0b":"#ef4444",
                    fontFamily:"var(--font-mono)",
                  }}>{hs}</div>
                  <div style={{color:"#475569",fontSize:11,marginBottom:8}}>/100</div>
                  <StatusBadge status={s.health_status}/>
                </div>

                <div style={{flex:1,minWidth:240}}>
                  <p style={{color:"#cbd5e1",fontSize:13,lineHeight:1.8,marginBottom:14}}>
                    {s.overall}
                  </p>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {s.abnormal_count > 0
                      ? <span style={{background:"rgba(239,68,68,0.1)",color:"#ef4444",
                                      border:"1px solid rgba(239,68,68,0.3)",
                                      borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:600}}>
                          🚨 {s.abnormal_count} Abnormal Finding{s.abnormal_count!==1?"s":""}
                        </span>
                      : <span style={{background:"rgba(16,185,129,0.1)",color:"#10b981",
                                      border:"1px solid rgba(16,185,129,0.3)",
                                      borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:600}}>
                          ✅ All values normal
                        </span>
                    }
                    <span className="badge badge-blue">
                      📋 {r.extraction_metadata.extracted_fields.length} biomarkers extracted
                    </span>
                  </div>
                  {r.extraction_metadata.warnings?.length > 0 && (
                    <div style={{marginTop:10,fontSize:11,color:"#f59e0b"}}>
                      ⚠ {r.extraction_metadata.warnings.join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            ), "#2563eb")}

            {/* ── Section B: Risk Analysis — text rows, no big visual cards ── */}
            {section("B.", "Multi-Organ Risk Analysis", (
              <div>
                <RiskSummaryRow label="❤️ Heart"  score={ra.heart.score}
                  color={ra.heart.color}  interpretation={ra.heart.interpretation}/>
                <RiskSummaryRow label="🫘 Kidney" score={ra.kidney.score}
                  color={ra.kidney.color} interpretation={ra.kidney.interpretation}/>
                <RiskSummaryRow label="🟤 Liver"  score={ra.liver.score}
                  color={ra.liver.color}  interpretation={ra.liver.interpretation}/>
                <div style={{marginTop:12,padding:"10px 14px",
                             background:"rgba(56,189,248,0.05)",
                             border:"1px solid rgba(56,189,248,0.15)",
                             borderRadius:8,fontSize:11,color:"#94a3b8",lineHeight:1.7}}>
                  <strong style={{color:"#e2e8f0"}}>Model:</strong> XGBoost regression
                  (AUC 0.986–0.991). Cross-organ interaction rules (cardiorenal syndrome,
                  diabetic nephropathy, NAFLD-CVD axis) applied automatically.
                </div>
              </div>
            ), "#ef4444")}

            {/* ── Section C: Test Analysis Table ── */}
            {section("C.", "Structured Test Analysis", (
              <>
                <div style={{fontSize:11,color:"#7c8fa8",marginBottom:12,lineHeight:1.6}}>
                  Each row shows: what was tested, the measured value, what the clinical
                  expectation is, and what the AI system determined.
                </div>
                <TestAnalysisTable rows={r.test_analysis}/>
              </>
            ), "#7c3aed")}

            {/* ── Section D: Key Findings ── */}
            {section("D.", "Key Findings", (
              r.key_findings.length > 0 ? r.key_findings.map((f,i) => (
                <div key={i} style={{
                  display:"flex",alignItems:"flex-start",gap:10,
                  padding:"10px 14px",marginBottom:8,
                  background:`${f.color}0d`,
                  borderLeft:`4px solid ${f.color}`,
                  borderRadius:"0 8px 8px 0",
                }}>
                  <span style={{color:f.color,fontSize:14,flexShrink:0}}>
                    {f.severity==="Critical"?"🚨":"⚠️"}
                  </span>
                  <span style={{color:"#cbd5e1",fontSize:12,lineHeight:1.6}}>{f.finding}</span>
                </div>
              )) : (
                <p style={{color:"#10b981",fontWeight:600,fontSize:13}}>
                  ✅ No critical findings — all values within acceptable range.
                </p>
              )
            ), "#f59e0b")}

            {/* ── Section E: Recommendations ── */}
            {section("E.", "AI-Generated Recommendations", (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#ef4444",marginBottom:10,
                               display:"flex",alignItems:"center",gap:6}}>
                    🏥 Clinical Recommendations
                  </div>
                  <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",
                               borderRadius:8,padding:"12px 14px"}}>
                    {r.recommendations.clinical.map((rec,i) => (
                      <div key={i} style={{padding:"6px 0",color:"#cbd5e1",fontSize:12,
                                          lineHeight:1.6,borderBottom:i<r.recommendations.clinical.length-1
                                            ?"1px solid rgba(56,100,160,0.1)":"none"}}>
                        → {rec}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#10b981",marginBottom:10,
                               display:"flex",alignItems:"center",gap:6}}>
                    🌿 Lifestyle Recommendations
                  </div>
                  <div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",
                               borderRadius:8,padding:"12px 14px"}}>
                    {r.recommendations.lifestyle.map((rec,i) => (
                      <div key={i} style={{padding:"6px 0",color:"#cbd5e1",fontSize:12,
                                          lineHeight:1.6,borderBottom:i<r.recommendations.lifestyle.length-1
                                            ?"1px solid rgba(56,100,160,0.1)":"none"}}>
                        ✓ {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ), "#10b981")}

            {/* ── Section F: Conclusion ── */}
            {section("F.", "Conclusion & Next Steps", (
              <>
                <p style={{color:"#cbd5e1",fontSize:13,lineHeight:1.8,marginBottom:14}}>
                  {r.conclusion}
                </p>
                {hs < 40 && (
                  <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",
                               borderRadius:8,padding:"12px 16px",color:"#ef4444",
                               fontSize:13,fontWeight:600}}>
                    ⚠️ High-risk findings detected. Please consult a healthcare professional immediately.
                  </div>
                )}
                <div style={{marginTop:14,display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button onClick={() => printPatientReport(report)}
                    className="btn-neon-solid"
                    style={{padding:"10px 24px",fontSize:13,cursor:"pointer",border:"none"}}>
                    🖨️ Open Printable Report / Save as PDF
                  </button>
                  <button className="btn-neon" onClick={()=>setReport(null)}
                    style={{padding:"10px 20px",fontSize:13}}>
                    ↺ New Report
                  </button>
                </div>
              </>
            ), "#38bdf8")}

          </div>
        );
      })()}
    </div>
  );
}
