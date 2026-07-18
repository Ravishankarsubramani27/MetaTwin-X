import React, { useState } from "react";
import {
  getCausalAnalysis, getCounterfactuals,
  askQuery, getRLInterventions, simulateODE,
} from "../services/api";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

/* ── Dark glass card ──────────────────────────────────── */
function Card({ title, icon, accent="#38bdf8", children, loading, error }) {
  return (
    <div className="glass-card" style={{
      padding:"20px 22px", marginBottom:18,
      borderTopColor: accent,
      borderTopWidth:1, borderTopStyle:"solid",
      boxShadow:`0 -1px 10px ${accent}22`,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{
          width:36, height:36, background:`${accent}18`,
          border:`1px solid ${accent}30`,
          borderRadius:10, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:18, flexShrink:0,
        }}>{icon}</div>
        <div style={{ color:"var(--text-primary)", fontSize:15, fontWeight:700,
                      fontFamily:"var(--font)" }}>
          {title}
        </div>
        {loading && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
                        color:accent, fontSize:12, fontWeight:600 }}>
            <span style={{ width:12, height:12, border:`2px solid ${accent}44`,
                           borderTop:`2px solid ${accent}`, borderRadius:"50%",
                           animation:"spin 0.8s linear infinite", display:"inline-block" }}/>
            Processing…
          </div>
        )}
      </div>
      {error && (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)",
                      borderRadius:8, padding:"10px 14px", marginBottom:14,
                      color:"#ef4444", fontSize:12 }}>
          ⚠ {typeof error==="string" ? error : "Request failed — check FastAPI is running."}
        </div>
      )}
      {children}
    </div>
  );
}

function EvidenceBadge({ level }) {
  const s = { 1:{bg:"rgba(16,185,129,0.15)",c:"#10b981",l:"Strong RCT"},
               2:{bg:"rgba(56,189,248,0.15)",c:"#38bdf8",l:"Cohort Study"},
               3:{bg:"rgba(245,158,11,0.15)",c:"#f59e0b",l:"Observational"} }[level]
          || { bg:"rgba(71,85,105,0.15)",c:"#64748b",l:"Unknown" };
  return (
    <span style={{ background:s.bg, color:s.c, borderRadius:20,
                   padding:"2px 8px", fontSize:9, fontWeight:700, marginLeft:6 }}>
      {s.l}
    </span>
  );
}

function OrganSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{
        background:"rgba(14,24,40,0.8)", border:"1px solid rgba(56,189,248,0.25)",
        borderRadius:8, color:"var(--text-primary)",
        fontFamily:"var(--font)", fontSize:12, padding:"7px 12px",
        cursor:"pointer", outline:"none",
      }}>
      <option value="heart">❤️ Heart</option>
      <option value="kidney">🫘 Kidney</option>
      <option value="liver">🟤 Liver</option>
    </select>
  );
}

// ── Normalize biomarkers: accept both camelCase and snake_case ─────────
function normalizeBiomarkers(bm) {
  if (!bm) return {};
  const map = {
    fastingGlucose:"fasting_glucose", fasting_glucose:"fasting_glucose",
    totalCholesterol:"total_cholesterol", total_cholesterol:"total_cholesterol",
    systolicBp:"systolic_bp", systolic_bp:"systolic_bp",
    diastolicBp:"diastolic_bp", diastolic_bp:"diastolic_bp",
    hdlCholesterol:"hdl_cholesterol", hdl_cholesterol:"hdl_cholesterol",
    ldlCholesterol:"ldl_cholesterol", ldl_cholesterol:"ldl_cholesterol",
    serumCreatinine:"serum_creatinine", serum_creatinine:"serum_creatinine",
    altEnzyme:"alt_enzyme", alt_enzyme:"alt_enzyme",
    astEnzyme:"ast_enzyme", ast_enzyme:"ast_enzyme",
    bmi:"bmi", age:"age", sex:"sex",
  };
  const out = {};
  for (const [k,v] of Object.entries(bm)) {
    const norm = map[k] || k;
    if (v !== undefined && v !== null) out[norm] = v;
  }
  return out;
}

// ── Default biomarkers for demo when none entered ──────────────────────
const DEMO_BM = {
  fasting_glucose:128, systolic_bp:142, diastolic_bp:88,
  total_cholesterol:245, hdl_cholesterol:42, ldl_cholesterol:168,
  serum_creatinine:1.4, alt_enzyme:68, ast_enzyme:52, bmi:28.7,
  age:48, sex:"male",
};

// ── 1. Causal Analysis ─────────────────────────────────────────────────
export function CausalPanel({ risk, biomarkers }) {
  const [data,    setData]    = useState(null);
  const [organ,   setOrgan]   = useState("heart");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);
  const bm = Object.keys(normalizeBiomarkers(biomarkers)).length >= 3
    ? normalizeBiomarkers(biomarkers)
    : DEMO_BM;

  const run = async () => {
    setLoading(true); setErr(null); setData(null);
    try {
      const res = await getCausalAnalysis(risk, bm, organ);
      setData(res);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Causal analysis failed");
    } finally { setLoading(false); }
  };

  const effects = data?.causal_analysis?.causal_effects || [];
  const total   = data?.causal_analysis?.total_addressable_risk;

  return (
    <Card title="Causal Inference Engine" icon="🔬" accent="#a78bfa" loading={loading} error={err}>
      <div style={{ color:"#cbd5e1", fontSize:12, marginBottom:14, lineHeight:1.6 }}>
        Estimates true causal effects (not correlations) grounded in clinical trial evidence.
        Output: <em style={{ color:"#a78bfa" }}>"Reducing glucose CAUSES X% kidney risk reduction."</em>
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
        <OrganSelect value={organ} onChange={setOrgan}/>
        <button className="btn-neon-solid" onClick={run} disabled={loading}
          style={{ background:"rgba(167,139,250,0.15)", borderColor:"rgba(167,139,250,0.4)",
                   color:"#a78bfa" }}>
          Run Causal Analysis
        </button>
      </div>

      {effects.length > 0 && (
        <div style={{ animation:"fadeIn 0.3s ease" }}>
          {effects.map((cf, i) => (
            <div key={i} style={{
              background:"rgba(167,139,250,0.06)",
              border:"1px solid rgba(167,139,250,0.2)",
              borderLeft:"3px solid #a78bfa",
              borderRadius:8, padding:"12px 14px", marginBottom:10,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                            alignItems:"center", marginBottom:6 }}>
                <span style={{ color:"var(--text-primary)", fontWeight:600, fontSize:13 }}>
                  {cf.feature.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                </span>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ color:"#a78bfa", fontWeight:800, fontSize:15,
                                 fontFamily:"var(--font-mono)",
                                 textShadow:"0 0 8px rgba(167,139,250,0.6)" }}>
                    -{cf.effect_pct?.toFixed(1)}%
                  </span>
                  <EvidenceBadge level={cf.evidence_level}/>
                </div>
              </div>
              <div style={{ color:"#b0bdd6", fontSize:12, lineHeight:1.6 }}>
                {cf.interpretation}
              </div>
              <div style={{ marginTop:8, height:3, background:"rgba(255,255,255,0.06)",
                            borderRadius:2, overflow:"hidden" }}>
                <div style={{
                  height:"100%", width:`${Math.min(cf.effect_pct*2,100)}%`,
                  background:"#a78bfa", boxShadow:"0 0 4px #a78bfa",
                  borderRadius:2,
                }}/>
              </div>
            </div>
          ))}
          {total > 0 && (
            <div style={{
              background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.3)",
              borderRadius:8, padding:"10px 14px", marginTop:6,
              color:"#10b981", fontSize:13, fontWeight:600,
            }}>
              ✅ Total addressable {organ} risk: <strong>
                {(total*100).toFixed(1)}%
              </strong> reduction achievable
            </div>
          )}
        </div>
      )}

      {data && effects.length === 0 && (
        <div style={{ color:"#94a3b8", fontSize:12, textAlign:"center", padding:"20px 0" }}>
          All biomarkers are within optimal range for {organ} — no major causal factors identified.
        </div>
      )}
    </Card>
  );
}

// ── 2. Counterfactual Panel ────────────────────────────────────────────
export function CounterfactualPanel({ risk, biomarkers }) {
  const [data,    setData]    = useState(null);
  const [organ,   setOrgan]   = useState("heart");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);
  const bm = Object.keys(normalizeBiomarkers(biomarkers)).length >= 3
    ? normalizeBiomarkers(biomarkers)
    : DEMO_BM;

  const run = async () => {
    setLoading(true); setErr(null); setData(null);
    try { setData(await getCounterfactuals(risk, bm, organ, 0.10)); }
    catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Counterfactual analysis failed");
    } finally { setLoading(false); }
  };

  const FEAS_STYLE = {
    easy:     { bg:"rgba(16,185,129,0.12)", c:"#10b981", bd:"rgba(16,185,129,0.3)"  },
    moderate: { bg:"rgba(245,158,11,0.12)", c:"#f59e0b", bd:"rgba(245,158,11,0.3)"  },
    hard:     { bg:"rgba(239,68,68,0.12)",  c:"#ef4444", bd:"rgba(239,68,68,0.3)"   },
  };

  const cfs = data?.counterfactuals || [];

  return (
    <Card title="Counterfactual Explanations" icon="💡" accent="#38bdf8" loading={loading} error={err}>
      <div style={{ color:"#cbd5e1", fontSize:12, marginBottom:14, lineHeight:1.6 }}>
        Shows exactly what needs to change and by how much.
        Output: <em style={{ color:"#38bdf8" }}>"If glucose → 90 mg/dL, risk drops by 12%"</em>
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
        <OrganSelect value={organ} onChange={setOrgan}/>
        <button className="btn-neon-solid" onClick={run} disabled={loading}>
          Generate Counterfactuals
        </button>
      </div>

      {cfs.length > 0 && (
        <div style={{ animation:"fadeIn 0.3s ease" }}>
          {cfs.map((cf, i) => {
            const fs = FEAS_STYLE[cf.feasibility] || FEAS_STYLE.moderate;
            return (
              <div key={i} style={{
                display:"flex", alignItems:"flex-start",
                justifyContent:"space-between",
                padding:"12px 14px",
                background:"rgba(14,24,40,0.6)",
                border:`1px solid rgba(56,189,248,0.15)`,
                borderRadius:8, marginBottom:8,
                gap:12,
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:"var(--text-primary)", fontWeight:600,
                                fontSize:13, marginBottom:4 }}>
                    {cf.feature.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <span style={{ color:"#ef4444", fontWeight:700,
                                   fontFamily:"var(--font-mono)", fontSize:12 }}>
                      {cf.current_value}
                    </span>
                    <span style={{ color:"var(--text-dim)", fontSize:11 }}>→</span>
                    <span style={{ color:"#10b981", fontWeight:700,
                                   fontFamily:"var(--font-mono)", fontSize:12 }}>
                      {cf.suggested_value}
                    </span>
                    <span style={{ color:"var(--text-dim)", fontSize:10 }}>{cf.unit}</span>
                  </div>
                  <div style={{ color:"#b0bdd6", fontSize:12, lineHeight:1.5 }}>
                    {cf.explanation}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ color:"#10b981", fontWeight:900, fontSize:16,
                                fontFamily:"var(--font-mono)",
                                textShadow:"0 0 8px rgba(16,185,129,0.6)" }}>
                    -{(cf.risk_reduction*100).toFixed(1)}%
                  </div>
                  <span style={{
                    display:"inline-block", marginTop:4, fontSize:9, fontWeight:700,
                    padding:"2px 8px", borderRadius:10,
                    background:fs.bg, color:fs.c, border:`1px solid ${fs.bd}`,
                  }}>
                    {cf.feasibility}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && cfs.length === 0 && (
        <div style={{ color:"var(--text-dim)", fontSize:12, textAlign:"center", padding:"20px 0" }}>
          No feasible counterfactuals found for {organ} — biomarkers may already be at optimal levels.
        </div>
      )}
    </Card>
  );
}

// ── 3. NL Query Panel ──────────────────────────────────────────────────
export function NLQueryPanel({ risk, biomarkers, auditLog=[] }) {
  const [query,  setQuery]  = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading,setLoading]= useState(false);
  const [err,    setErr]    = useState(null);
  const bm = Object.keys(normalizeBiomarkers(biomarkers)).length >= 3
    ? normalizeBiomarkers(biomarkers) : DEMO_BM;

  const PRESETS = [
    "Why is my heart risk high?",
    "How do I improve my kidney health?",
    "What is my overall health status?",
    "Which organ needs the most attention?",
    "How can I reduce my liver risk?",
  ];

  const ask = async (q) => {
    const question = q || query;
    if (!question.trim()) return;
    setLoading(true); setErr(null); setAnswer(null);
    try {
      const res = await askQuery(question, risk, bm, auditLog);
      setAnswer(res.answer);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Query failed");
    } finally { setLoading(false); }
  };

  return (
    <Card title="Clinical AI Assistant" icon="🤖" accent="#10b981" loading={loading} error={err}>
      <div style={{ color:"#cbd5e1", fontSize:12, marginBottom:14, lineHeight:1.6 }}>
        Ask natural language questions about your health — powered by structured medical reasoning.
      </div>
      {/* Preset chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
        {PRESETS.map((p,i)=>(
          <button key={i} onClick={()=>{setQuery(p);ask(p);}}
            style={{
              background:"rgba(16,185,129,0.08)",
              border:"1px solid rgba(16,185,129,0.25)",
              borderRadius:20, padding:"4px 12px",
              fontSize:11, fontWeight:500, cursor:"pointer",
              color:"#10b981", fontFamily:"var(--font)",
              transition:"all 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(16,185,129,0.15)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(16,185,129,0.08)"}
          >{p}</button>
        ))}
      </div>
      {/* Input */}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        <input value={query} onChange={e=>setQuery(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&ask()}
          placeholder="Ask anything about your health…"
          className="neo-input" style={{ flex:1 }}/>
        <button className="btn-neon-solid" onClick={()=>ask()}
          disabled={loading||!query.trim()}
          style={{ padding:"8px 20px", flexShrink:0 }}>
          Ask
        </button>
      </div>
      {answer && (
        <div style={{
          background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.25)",
          borderRadius:10, padding:"16px 18px", animation:"fadeIn 0.3s ease",
        }}>
          <div style={{ color:"var(--text-primary)", fontSize:13, lineHeight:1.8,
                        fontFamily:"var(--font)", whiteSpace:"pre-wrap" }}>
            {answer.replace(/\*\*(.*?)\*\*/g,"$1")}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── 4. RL Intervention Agent ───────────────────────────────────────────
export function RLPanel({ risk, age=50, sex="male" }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);

  const run = async () => {
    setLoading(true); setErr(null);
    try { setData(await getRLInterventions(risk, age, sex)); }
    catch (e) { setErr(e?.response?.data?.detail || e.message || "RL agent failed"); }
    finally { setLoading(false); }
  };

  return (
    <Card title="RL Intervention Agent" icon="🎯" accent="#f59e0b" loading={loading} error={err}>
      <div style={{ color:"#cbd5e1", fontSize:12, marginBottom:14, lineHeight:1.6 }}>
        Reinforcement learning agent computes optimal interventions to maximise long-term health reward.
      </div>
      {!data ? (
        <button className="btn-neon-solid" onClick={run} disabled={loading}
          style={{ background:"rgba(245,158,11,0.15)", borderColor:"rgba(245,158,11,0.4)",
                   color:"#f59e0b", padding:"11px 28px" }}>
          {loading ? "Computing…" : "🎯 Get Optimal Interventions"}
        </button>
      ) : (
        <div style={{ animation:"fadeIn 0.3s ease" }}>
          <div style={{
            background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)",
            borderRadius:8, padding:"10px 14px", marginBottom:14,
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <span style={{ color:"#f59e0b", fontSize:13, fontWeight:600 }}>
              Total expected reward: {(data.total_expected_reward*100).toFixed(1)}%
            </span>
            <span style={{ fontSize:11, color:"#94a3b8" }}>
              Primary: <strong style={{ color:"#f59e0b" }}>{data.max_risk_organ}</strong>
            </span>
          </div>
          {data.recommended_actions?.map((a, i) => (
            <div key={i} style={{
              background:"rgba(14,24,40,0.6)",
              border:"1px solid rgba(245,158,11,0.15)",
              borderLeft:"3px solid #f59e0b",
              borderRadius:8, padding:"12px 16px", marginBottom:10,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"var(--text-primary)", fontWeight:700, fontSize:13 }}>
                  #{i+1} {a.name}
                </span>
                <div style={{ textAlign:"right" }}>
                  <div style={{ color:"#f59e0b", fontWeight:900, fontSize:14,
                                fontFamily:"var(--font-mono)",
                                textShadow:"0 0 8px rgba(245,158,11,0.5)" }}>
                    +{(a.expected_reward*100).toFixed(1)}%
                  </div>
                  <div style={{ color:"#94a3b8", fontSize:10 }}>
                    conf: {(a.confidence*100).toFixed(0)}%
                  </div>
                </div>
              </div>
              <div style={{ color:"var(--text-secondary)", fontSize:12, lineHeight:1.5, marginBottom:8 }}>
                {a.description}
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {Object.entries(a.targets||{}).map(([organ, effect]) => (
                  <span key={organ} style={{
                    background:"rgba(245,158,11,0.1)", color:"#f59e0b",
                    border:"1px solid rgba(245,158,11,0.25)",
                    borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:600,
                  }}>
                    {organ}: -{(effect*100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          ))}
          <button className="btn-neon" onClick={()=>setData(null)}
            style={{ marginTop:4, padding:"6px 16px", fontSize:11 }}>
            ↺ Reset
          </button>
        </div>
      )}
    </Card>
  );
}

// ── 5. Hybrid ODE+ML Simulation ────────────────────────────────────────
export function ODESimPanel({ risk }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [horizon, setHorizon] = useState(180);
  const [stoch,   setStoch]   = useState(true);
  const [intv,    setIntv]    = useState({ bmi_reduction:0, bp_control:0 });
  const [err,     setErr]     = useState(null);

  const run = async () => {
    setLoading(true); setErr(null);
    try { setData(await simulateODE(risk, horizon, intv, stoch)); }
    catch (e) { setErr(e?.response?.data?.detail || e.message || "ODE simulation failed"); }
    finally { setLoading(false); }
  };

  const chartData = data?.trajectory
    ? data.trajectory.map(p => ({
        month: +(p.day/30).toFixed(1),
        heart:  +(p.heart*100).toFixed(1),
        kidney: +(p.kidney*100).toFixed(1),
        liver:  +(p.liver*100).toFixed(1),
      }))
    : [];

  const CTIP = ({ active, payload, label }) => {
    if (!active||!payload?.length) return null;
    return (
      <div style={{ background:"rgba(6,11,20,0.95)", border:"1px solid rgba(56,189,248,0.25)",
                    borderRadius:8, padding:"10px 14px" }}>
        <div style={{ fontSize:10, color:"#94a3b8", marginBottom:4 }}>Month {label}</div>
        {payload.map(p=>(
          <div key={p.name} style={{ fontSize:12, color:p.color, fontWeight:600 }}>
            {p.name}: {p.value}%
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card title="Hybrid ODE+ML Simulation" icon="🧬" accent="#38bdf8" loading={loading} error={err}>
      <div style={{ color:"#cbd5e1", fontSize:12, marginBottom:14, lineHeight:1.6 }}>
        Coupled differential equations with stochastic uncertainty bands — daily timesteps,
        multi-organ physiological feedback loops.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
        {[
          { label:`Horizon: ${horizon} days`, value:horizon, min:30, max:365, step:30,
            onChange:e=>setHorizon(+e.target.value) },
          { label:`BMI Reduction: ${(intv.bmi_reduction*100).toFixed(0)}%`,
            value:intv.bmi_reduction, min:0, max:1, step:0.1,
            onChange:e=>setIntv(v=>({...v,bmi_reduction:+e.target.value})) },
          { label:`BP Control: ${(intv.bp_control*100).toFixed(0)}%`,
            value:intv.bp_control, min:0, max:1, step:0.1,
            onChange:e=>setIntv(v=>({...v,bp_control:+e.target.value})) },
        ].map(s=>(
          <div key={s.label}>
            <div style={{ fontSize:11, color:"var(--text-secondary)", marginBottom:5, fontWeight:500 }}>{s.label}</div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={s.onChange} style={{ width:"100%", accentColor:"#38bdf8" }}/>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12,
                        color:"var(--text-secondary)", cursor:"pointer" }}>
          <input type="checkbox" checked={stoch} onChange={e=>setStoch(e.target.checked)}
            style={{ accentColor:"#38bdf8" }}/>
          Monte Carlo uncertainty bands
        </label>
        <button className="btn-neon-solid" onClick={run} disabled={loading}>
          {loading?"Simulating…":"▶ Run ODE Simulation"}
        </button>
      </div>

      {chartData.length > 0 && (
        <div style={{ animation:"fadeIn 0.3s ease" }}>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{top:5,right:10,bottom:5,left:0}}>
                <defs>
                  {[["heart","#ef4444"],["kidney","#38bdf8"],["liver","#10b981"]].map(([k,c])=>(
                    <linearGradient key={k} id={`ode-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0.02}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,100,160,0.1)" vertical={false}/>
                <XAxis dataKey="month" tick={{fill:"#475569",fontSize:10}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fill:"#475569",fontSize:10}} tickLine={false} axisLine={false}
                  tickFormatter={v=>`${v}%`} width={38}/>
                <Tooltip content={<CTIP/>}/>
                {[["heart","#ef4444"],["kidney","#38bdf8"],["liver","#10b981"]].map(([k,c])=>(
                  <Area key={k} type="monotone" dataKey={k} name={k.charAt(0).toUpperCase()+k.slice(1)}
                    stroke={c} strokeWidth={2} fill={`url(#ode-${k})`} dot={false}
                    activeDot={{r:4,fill:c}}/>
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Peak summary */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:12 }}>
            {["heart","kidney","liver"].map(organ => {
              const peak = data.peak_risk?.[organ];
              const day  = data.day_of_peak?.[organ];
              const col  = peak>=0.7?"#ef4444":peak>=0.4?"#f59e0b":"#10b981";
              const ub   = data.uncertainty_bands?.[organ];
              return (
                <div key={organ} style={{
                  background:"rgba(14,24,40,0.6)", border:"1px solid rgba(56,100,160,0.2)",
                  borderRadius:8, padding:"12px", textAlign:"center",
                }}>
                  <div style={{ fontSize:10, color:"var(--text-dim)", fontWeight:700,
                                textTransform:"uppercase", marginBottom:4 }}>{organ} Peak</div>
                  <div style={{ color:col, fontSize:20, fontWeight:900,
                                fontFamily:"var(--font-mono)", textShadow:`0 0 8px ${col}88` }}>
                    {peak!=null?(peak*100).toFixed(1):"—"}%
                  </div>
                  {day!=null && <div style={{ color:"var(--text-dim)", fontSize:10, marginTop:2 }}>Day {day}</div>}
                  {ub && (
                    <div style={{ fontSize:9, color:"var(--text-dim)", marginTop:3 }}>
                      CI: {(ub.lower[ub.lower.length-1]*100).toFixed(0)}–{(ub.upper[ub.upper.length-1]*100).toFixed(0)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Main AdvancedPanel (tab switcher) ──────────────────────────────────
export default function AdvancedPanel({ risk, biomarkers, auditLog, age, sex }) {
  const [tab, setTab] = useState("causal");

  const TABS = [
    { key:"causal", label:"🔬 Causal"          },
    { key:"cf",     label:"💡 Counterfactual"   },
    { key:"query",  label:"🤖 AI Query"         },
    { key:"rl",     label:"🎯 RL Agent"         },
    { key:"ode",    label:"🧬 ODE Sim"          },
  ];

  return (
    <div style={{ maxWidth:900, margin:"0 auto", animation:"fadeIn 0.3s ease" }}>
      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom:18 }}>
        {TABS.map(t=>(
          <button key={t.key}
            className={`tab-item${tab===t.key?" active":""}`}
            onClick={()=>setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab==="causal" && <CausalPanel risk={risk} biomarkers={biomarkers}/>}
      {tab==="cf"     && <CounterfactualPanel risk={risk} biomarkers={biomarkers}/>}
      {tab==="query"  && <NLQueryPanel risk={risk} biomarkers={biomarkers} auditLog={auditLog}/>}
      {tab==="rl"     && <RLPanel risk={risk} age={age} sex={sex}/>}
      {tab==="ode"    && <ODESimPanel risk={risk}/>}
    </div>
  );
}
