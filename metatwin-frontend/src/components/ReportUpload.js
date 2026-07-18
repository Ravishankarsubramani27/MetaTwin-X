import React, { useState, useRef } from "react";
import axios from "axios";

const BASE = "http://127.0.0.1:8000";

const STEPS = [
  { id:1, icon:"📤", title:"File Upload",       sub:"PDF / Image / Text received"       },
  { id:2, icon:"🔍", title:"Text Extraction",   sub:"OCR / pdfplumber processing"       },
  { id:3, icon:"🧩", title:"Biomarker Parsing", sub:"NLP + Regex identification"         },
  { id:4, icon:"⚙️", title:"Interaction Rules", sub:"Cross-organ rules applied"          },
  { id:5, icon:"🤖", title:"AI/ML Prediction",  sub:"XGBoost organ risk models"          },
  { id:6, icon:"💡", title:"Recommendations",   sub:"SHAP + Clinical suggestions"        },
];

const STEP_STYLE = {
  idle:  { bg:"rgba(14,24,40,0.6)",  bd:"rgba(56,100,160,0.2)",  tx:"#475569", icon:"○" },
  run:   { bg:"rgba(56,189,248,0.08)", bd:"rgba(56,189,248,0.4)", tx:"#38bdf8", icon:"⟳" },
  done:  { bg:"rgba(16,185,129,0.08)", bd:"rgba(16,185,129,0.4)", tx:"#10b981", icon:"✓" },
  warn:  { bg:"rgba(245,158,11,0.08)", bd:"rgba(245,158,11,0.4)", tx:"#f59e0b", icon:"⚠" },
  error: { bg:"rgba(239,68,68,0.08)",  bd:"rgba(239,68,68,0.4)",  tx:"#ef4444", icon:"✗" },
};

const BIO_LABELS = {
  age:"Age", sex:"Sex", bmi:"BMI (kg/m²)",
  systolic_bp:"Systolic BP", diastolic_bp:"Diastolic BP",
  total_cholesterol:"Total Chol", hdl_cholesterol:"HDL",
  ldl_cholesterol:"LDL", fasting_glucose:"Fasting Glucose",
  serum_creatinine:"Creatinine", alt_enzyme:"ALT", ast_enzyme:"AST",
};

const REC_CFG = {
  clinical_consultation:{ col:"#ef4444", tag:"CLINICAL"  },
  physical_activity:    { col:"#a78bfa", tag:"EXERCISE"  },
  dietary_modification: { col:"#38bdf8", tag:"DIETARY"   },
  lifestyle_habit:      { col:"#10b981", tag:"LIFESTYLE" },
};

function riskLevel(p) { return p<40?"low":p<70?"moderate":"high"; }
function riskColor(p) { return p<40?"#10b981":p<70?"#f59e0b":"#ef4444"; }

function PipelineStep({ s, status, detail }) {
  const c = STEP_STYLE[status] || STEP_STYLE.idle;
  const spinning = status === "run";
  return (
    <div style={{
      background:c.bg, border:`1px solid ${c.bd}`,
      borderRadius:10, padding:"11px 16px", marginBottom:8,
      display:"flex", alignItems:"center", gap:14,
      transition:"all 0.3s",
    }}>
      <div style={{
        width:34, height:34, borderRadius:"50%",
        background:`${c.bd}22`, border:`2px solid ${c.bd}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:15, flexShrink:0,
        animation: spinning ? "spin 1s linear infinite" : undefined,
      }}>{s.icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"var(--text-dim)", fontSize:10, fontWeight:700, letterSpacing:"0.08em" }}>
            STEP {s.id}
          </span>
          <span style={{ color:c.tx, fontSize:13, fontWeight:700 }}>{s.title}</span>
          <span style={{ marginLeft:"auto", color:c.tx, fontWeight:800, fontSize:14 }}>{c.icon}</span>
        </div>
        <div style={{ color:"var(--text-dim)", fontSize:11, marginTop:2 }}>{s.sub}</div>
        {detail && (
          <div style={{ color:c.tx, fontSize:10, marginTop:3, fontStyle:"italic", opacity:0.85 }}>
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}

function RiskGauge({ label, score, color }) {
  const pct = parseFloat((score*100).toFixed(1));
  const lv  = riskLevel(pct);
  const col = riskColor(pct);
  return (
    <div className="glass-card neon-top" style={{
      borderTopColor:color,
      boxShadow:`0 -1px 10px ${color}44`,
      padding:"16px", textAlign:"center",
    }}>
      <div style={{ fontSize:11, color:"var(--text-dim)", fontWeight:700,
                    textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
        {label}
      </div>
      <div style={{
        fontSize:30, fontWeight:900, lineHeight:1, color:col,
        fontFamily:"var(--font-mono)",
        textShadow:`0 0 10px ${col}88`,
      }}>{pct}%</div>
      <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, margin:"10px 0 8px", overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${pct}%`, borderRadius:2,
          background:col, boxShadow:`0 0 6px ${col}`,
          transition:"width 0.8s ease",
        }}/>
      </div>
      <span className={`badge ${lv==="low"?"badge-green":lv==="moderate"?"badge-amber":"badge-red"}`}
        style={{ fontSize:9 }}>
        {lv}
      </span>
    </div>
  );
}

export default function ReportUpload({ onAnalysisComplete }) {
  const [file,    setFile]    = useState(null);
  const [steps,   setSteps]   = useState({});
  const [details, setDetails] = useState({});
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [dragOver,setDragOver]= useState(false);
  const inputRef = useRef();

  const upd = (id, st, detail="") => {
    setSteps(s  => ({ ...s, [id]: st }));
    setDetails(d => ({ ...d, [id]: detail }));
  };

  const reset = () => {
    setFile(null); setSteps({}); setDetails({});
    setResult(null); setError(null); setLoading(false);
  };

  const handleAnalyse = async () => {
    if (!file) return;
    setLoading(true); setResult(null); setError(null);
    setSteps({}); setDetails({});

    const fd = new FormData();
    fd.append("file", file);

    try {
      upd(1, "done", `${file.name} (${(file.size/1024).toFixed(1)} KB)`);
      upd(2, "run");

      // ── DO NOT set Content-Type manually — let browser/axios add boundary ──
      const res = await axios.post(`${BASE}/predict/upload`, fd, {
        timeout: 45000,
      });

      const { adjusted_scores, extraction, audit_log } = res.data;
      const conf   = extraction?.confidence ?? 0;
      const fields = extraction?.extracted_fields ?? [];
      const warns  = extraction?.warnings ?? [];
      const bm     = extraction?.biomarkers ?? {};

      upd(2, "done",  `Text extracted — ${fields.length} biomarkers found`);
      upd(3, conf>=0.5 ? "done" : "warn",
          `Confidence ${(conf*100).toFixed(0)}% — ${fields.length} fields extracted`);
      upd(4, "done",  "Cross-organ interaction rules applied");
      upd(5, "done",
        `Heart ${(adjusted_scores.heart*100).toFixed(1)}% · ` +
        `Kidney ${(adjusted_scores.kidney*100).toFixed(1)}% · ` +
        `Liver ${(adjusted_scores.liver*100).toFixed(1)}%`);

      upd(6, "run");
      let recs = { items: [] };
      try {
        const rr = await axios.post(`${BASE}/recommend/`, adjusted_scores, { timeout: 10000 });
        recs = rr.data;
      } catch { /* recommendations optional */ }
      upd(6, "done", `${recs.items?.length ?? 0} recommendations generated`);

      if (warns.length) setError(`⚠ Note: ${warns.join(" · ")}`);

      setResult({ scores: adjusted_scores, recs, biomarkers: bm, confidence: conf, fields, audit_log });
      if (onAnalysisComplete) onAnalysisComplete(adjusted_scores, recs);

    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Analysis failed";
      upd(2, "error", msg);
      setError(`Analysis failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth:860, margin:"0 auto", animation:"fadeIn 0.3s ease" }}>

      {/* ── Upload card ── */}
      <div className="glass-card" style={{
        padding:"24px", marginBottom:18,
        background:"linear-gradient(135deg,rgba(56,189,248,0.05),rgba(167,139,250,0.04))",
        borderColor:"rgba(56,189,248,0.2)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
          <div style={{
            width:46, height:46,
            background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(167,139,250,0.2))",
            border:"1px solid rgba(56,189,248,0.3)",
            borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, boxShadow:"0 0 20px rgba(56,189,248,0.15)",
          }}>📄</div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)" }}>
              Medical Report Analyser
            </div>
            <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:2 }}>
              Upload a lab report — AI extracts biomarkers and runs multi-organ risk prediction
            </div>
          </div>
        </div>

        {/* Format badges */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
          {[["📄 PDF","#38bdf8"],["🖼 JPG/PNG","#10b981"],["📝 TXT","#f59e0b"],["🔬 Lab Reports","#a78bfa"]].map(([l,c])=>(
            <span key={l} style={{
              background:`${c}12`, border:`1px solid ${c}44`, color:c,
              borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600,
            }}>{l}</span>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e=>{e.preventDefault();setDragOver(true)}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{
            e.preventDefault(); setDragOver(false);
            const f=e.dataTransfer.files[0];
            if(f){setFile(f);setResult(null);setError(null);setSteps({});}
          }}
          onClick={()=>!loading&&inputRef.current.click()}
          style={{
            border:`2px dashed ${dragOver?"#38bdf8":file?"#10b981":"rgba(56,100,160,0.35)"}`,
            borderRadius:12, padding:"28px 20px", textAlign:"center",
            cursor:loading?"default":"pointer",
            background:dragOver
              ? "rgba(56,189,248,0.06)"
              : file
              ? "rgba(16,185,129,0.05)"
              : "rgba(14,24,40,0.4)",
            transition:"all 0.2s", marginBottom:16,
            boxShadow:dragOver?"0 0 20px rgba(56,189,248,0.2)":file?"0 0 16px rgba(16,185,129,0.15)":"none",
          }}>
          <input ref={inputRef} type="file" style={{ display:"none" }}
            accept=".pdf,.png,.jpg,.jpeg,.txt,.bmp,.tiff"
            onChange={e=>{
              const f=e.target.files[0];
              if(f){setFile(f);setResult(null);setError(null);setSteps({});}
            }}/>
          {file ? (
            <div>
              <div style={{ fontSize:32, marginBottom:8 }}>📄</div>
              <div style={{ color:"#10b981", fontWeight:700, fontSize:15,
                            fontFamily:"var(--font-mono)" }}>{file.name}</div>
              <div style={{ color:"var(--text-dim)", fontSize:11, marginTop:4 }}>
                {(file.size/1024).toFixed(1)} KB · {file.type||"document"}
              </div>
              <span className="badge badge-green" style={{ marginTop:10, display:"inline-flex" }}>
                ✓ Ready to Analyse
              </span>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:38, marginBottom:10 }}>
                {dragOver ? "📂" : "⬆️"}
              </div>
              <div style={{ color:"var(--text-primary)", fontWeight:600, fontSize:14, marginBottom:4 }}>
                Drop your medical report here
              </div>
              <div style={{ color:"var(--text-dim)", fontSize:12 }}>
                or click to browse — PDF, PNG, JPG, TXT supported
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-neon-solid" onClick={handleAnalyse}
            disabled={!file||loading}
            style={{ flex:1, padding:"12px", fontSize:14 }}>
            {loading ? (
              <span style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                <span style={{ width:14,height:14,border:"2px solid rgba(56,189,248,0.3)",
                               borderTop:"2px solid #38bdf8",borderRadius:"50%",
                               animation:"spin 0.8s linear infinite",display:"inline-block"}}/>
                Analysing Report…
              </span>
            ) : "🔬 Analyse Report"}
          </button>
          {(result||error||Object.keys(steps).length>0) && (
            <button className="btn-neon" onClick={reset} style={{ padding:"12px 20px" }}>
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Pipeline ── */}
      {Object.keys(steps).length > 0 && (
        <div className="glass-card" style={{ padding:"20px", marginBottom:18 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:14, color:"var(--text-primary)" }}>
            📊 Analysis Pipeline
          </div>
          {STEPS.map(s=>(
            <PipelineStep key={s.id} s={s}
              status={steps[s.id]||"idle"}
              detail={details[s.id]||""}/>
          ))}
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          background: error.startsWith("⚠") ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
          border:`1px solid ${error.startsWith("⚠")?"rgba(245,158,11,0.4)":"rgba(239,68,68,0.4)"}`,
          borderLeft:`3px solid ${error.startsWith("⚠")?"#f59e0b":"#ef4444"}`,
          borderRadius:8, padding:"12px 16px", marginBottom:16,
          color:error.startsWith("⚠")?"#f59e0b":"#ef4444",
          fontSize:12, lineHeight:1.5,
        }}>{error}</div>
      )}

      {/* ── Results ── */}
      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn 0.4s ease" }}>

          {/* Confidence */}
          <div className="glass-card" style={{
            padding:"12px 18px",
            background: result.confidence>=0.7
              ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
            borderColor: result.confidence>=0.7
              ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <span style={{ fontWeight:700, fontSize:13,
                           color:result.confidence>=0.7?"#10b981":"#f59e0b" }}>
              {result.confidence>=0.7
                ? "✅ High confidence — all key biomarkers extracted"
                : "⚠ Partial extraction — some defaults applied"}
            </span>
            <span style={{
              fontFamily:"var(--font-mono)", fontWeight:900, fontSize:15,
              color:result.confidence>=0.7?"#10b981":"#f59e0b",
            }}>
              {(result.confidence*100).toFixed(0)}%
            </span>
          </div>

          {/* Risk cards */}
          <div>
            <div className="section-label">Risk Prediction Results</div>
            <div className="grid-3">
              <RiskGauge label="❤️ Heart"  score={result.scores.heart}  color="#ef4444"/>
              <RiskGauge label="🫘 Kidney" score={result.scores.kidney} color="#38bdf8"/>
              <RiskGauge label="🟤 Liver"  score={result.scores.liver}  color="#10b981"/>
            </div>
          </div>

          {/* Extracted biomarkers */}
          {result.biomarkers && Object.keys(result.biomarkers).length > 0 && (
            <div className="glass-card" style={{ padding:"20px" }}>
              <div className="section-label">Extracted Biomarkers</div>
              <div className="grid-2">
                {Object.entries(result.biomarkers).map(([k,v]) => {
                  const extracted = result.fields?.some(f=>f.startsWith(k));
                  return (
                    <div key={k} style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"9px 12px",
                      background: extracted ? "rgba(16,185,129,0.06)" : "rgba(14,24,40,0.4)",
                      border: `1px solid ${extracted?"rgba(16,185,129,0.25)":"rgba(56,100,160,0.15)"}`,
                      borderRadius:8,
                    }}>
                      <span style={{ color:"var(--text-secondary)", fontSize:12 }}>
                        {BIO_LABELS[k]||k}
                      </span>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{
                          color:"var(--text-primary)", fontWeight:700,
                          fontSize:13, fontFamily:"var(--font-mono)",
                        }}>
                          {typeof v==="number"&&!Number.isInteger(v)
                            ? parseFloat(v.toFixed(2)) : v}
                        </span>
                        <span style={{
                          fontSize:9, fontWeight:700, padding:"1px 6px",
                          borderRadius:10,
                          background:extracted?"rgba(16,185,129,0.15)":"rgba(71,85,105,0.2)",
                          color:extracted?"#10b981":"#64748b",
                        }}>
                          {extracted?"extracted":"default"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recs?.items?.length > 0 && (
            <div className="glass-card" style={{ padding:"20px" }}>
              <div className="section-label">Clinical Recommendations</div>
              {result.recs.items.slice(0,5).map((rec,i) => {
                const cfg = REC_CFG[rec.category] || { col:"#38bdf8", tag:"GENERAL" };
                return (
                  <div key={i} style={{
                    background:`${cfg.col}08`,
                    border:`1px solid ${cfg.col}22`,
                    borderLeft:`3px solid ${cfg.col}`,
                    borderRadius:"0 8px 8px 0",
                    padding:"11px 14px", marginBottom:10,
                    animation:`fadeIn 0.3s ease ${i*0.05}s both`,
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                      <span style={{
                        fontSize:9, fontWeight:800, padding:"2px 7px",
                        borderRadius:4, background:`${cfg.col}18`, color:cfg.col,
                        letterSpacing:"0.08em",
                      }}>{cfg.tag}</span>
                      <span style={{ fontSize:10, color:"var(--text-dim)" }}>
                        {rec.organ} · {Math.round(rec.priority*100)}% priority
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.55 }}>
                      {rec.text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Go to dashboard */}
          <button className="btn-neon-solid"
            onClick={()=>onAnalysisComplete&&onAnalysisComplete(result.scores, result.recs)}
            style={{ padding:"12px", fontSize:14 }}>
            ⊞ View Full Dashboard →
          </button>
        </div>
      )}

      {/* Tip */}
      {!file && !result && (
        <div style={{
          background:"rgba(56,189,248,0.05)", border:"1px solid rgba(56,189,248,0.15)",
          borderRadius:10, padding:"12px 16px",
          color:"#38bdf8", fontSize:12, lineHeight:1.6,
        }}>
          💡 <strong>Tip:</strong> Works best with digital PDF lab reports.
          Common formats: CBC, LFT, KFT, Lipid Profile, Blood Sugar, HbA1c.
          Scanned images are also supported via OCR.
        </div>
      )}
    </div>
  );
}
