import React, { useState } from "react";
import Smartwatch from "./Smartwatch";

const PRESETS = {
  Healthy:   { age:35,sex:"male",   bmi:23.0,systolic_bp:115,diastolic_bp:75, total_cholesterol:175,hdl_cholesterol:60,ldl_cholesterol:100,fasting_glucose:88, serum_creatinine:0.9, alt_enzyme:20,ast_enzyme:18,daily_step_count:9000,sleep_duration:7.5,dietary_quality_score:8 },
  "High Risk":{ age:58,sex:"male",  bmi:32.5,systolic_bp:155,diastolic_bp:95, total_cholesterol:265,hdl_cholesterol:35,ldl_cholesterol:180,fasting_glucose:145,serum_creatinine:1.6, alt_enzyme:65,ast_enzyme:58,daily_step_count:2500,sleep_duration:5.5,dietary_quality_score:3 },
  Diabetic:  { age:50,sex:"female", bmi:29.0,systolic_bp:135,diastolic_bp:85, total_cholesterol:220,hdl_cholesterol:45,ldl_cholesterol:145,fasting_glucose:168,serum_creatinine:1.1, alt_enzyme:38,ast_enzyme:32,daily_step_count:4000,sleep_duration:6.5,dietary_quality_score:5 },
  Elderly:   { age:72,sex:"female", bmi:26.5,systolic_bp:142,diastolic_bp:82, total_cholesterol:235,hdl_cholesterol:52,ldl_cholesterol:155,fasting_glucose:105,serum_creatinine:1.3, alt_enzyme:28,ast_enzyme:25,daily_step_count:3500,sleep_duration:6.0,dietary_quality_score:6 },
};

const VALIDATION = {
  age:                   { min:1,   max:120, label:"Age must be 1–120" },
  bmi:                   { min:10,  max:70,  label:"BMI must be 10–70" },
  systolic_bp:           { min:60,  max:250, label:"Sys BP 60–250 mmHg" },
  diastolic_bp:          { min:40,  max:150, label:"Dia BP 40–150 mmHg" },
  total_cholesterol:     { min:50,  max:600, label:"Chol 50–600 mg/dL" },
  hdl_cholesterol:       { min:10,  max:150, label:"HDL 10–150 mg/dL" },
  ldl_cholesterol:       { min:10,  max:400, label:"LDL 10–400 mg/dL" },
  fasting_glucose:       { min:40,  max:600, label:"Glucose 40–600 mg/dL" },
  serum_creatinine:      { min:0.1, max:20,  label:"Creatinine 0.1–20 mg/dL" },
  alt_enzyme:            { min:1,   max:2000,label:"ALT 1–2000 U/L" },
  ast_enzyme:            { min:1,   max:2000,label:"AST 1–2000 U/L" },
  daily_step_count:      { min:0,   max:50000,label:"Steps 0–50,000" },
  sleep_duration:        { min:0,   max:24,  label:"Sleep 0–24 hrs" },
  dietary_quality_score: { min:1,   max:10,  label:"Diet score 1–10" },
};

function validate(form) {
  const errs = {};
  for (const [f,r] of Object.entries(VALIDATION)) {
    const v = form[f];
    if (v===undefined||v===null||v==="") { errs[f]="Required"; continue; }
    if (v < r.min || v > r.max) errs[f] = r.label;
  }
  if (!errs.diastolic_bp && !errs.systolic_bp && form.diastolic_bp >= form.systolic_bp)
    errs.diastolic_bp = "Diastolic must be < Systolic";
  if (!errs.ldl_cholesterol && !errs.total_cholesterol && form.ldl_cholesterol >= form.total_cholesterol)
    errs.ldl_cholesterol = "LDL must be < Total Chol";
  return errs;
}

function Field({ label, name, value, onChange, min, max, step=1, unit, error }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:10, fontWeight:600, color: error?"#ef4444":"var(--text-secondary)",
                      marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>
        {label}{unit && <span style={{ color:"var(--text-dim)", fontWeight:400, textTransform:"none", letterSpacing:0 }}> ({unit})</span>}
      </label>
      <input type="number" name={name} value={value} min={min} max={max} step={step}
        onChange={onChange}
        className={`neo-input${error?" error":""}`}/>
      {error && <div style={{ color:"#ef4444", fontSize:10, marginTop:3 }}>⚠ {error}</div>}
    </div>
  );
}

const TABS = ["Demographics","Cardiovascular","Metabolic","Lifestyle","⌚ Wearable"];

export default function HealthForm({ onSubmit, loading }) {
  const [form,      setForm]      = useState(PRESETS.Healthy);
  const [activeTab, setActiveTab] = useState(0);
  const [errors,    setErrors]    = useState({});
  const [tried,     setTried]     = useState(false);
  const [watchData, setWatchData] = useState({});

  const handle = e => {
    const { name, value } = e.target;
    const upd = { ...form, [name]: name==="sex" ? value : Number(value) };
    setForm(upd);
    if (tried) setErrors(validate(upd));
  };

  const handleSubmit = () => {
    setTried(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({ ...form, ...watchData }); // merge wearable data
  };

  const errCount = Object.keys(errors).length;

  return (
    <div style={{ maxWidth:760, margin:"0 auto", animation:"fadeIn 0.3s ease" }}>
      {/* Header */}
      <div className="glass-card" style={{
        marginBottom:4,
        background:"linear-gradient(135deg,rgba(56,189,248,0.08),rgba(167,139,250,0.06))",
        borderColor:"rgba(56,189,248,0.2)",
        padding:"20px 24px 16px",
        borderRadius:"14px 14px 0 0",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)" }}>
              ✏ Health Profile
            </div>
            <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:3 }}>
              Enter your biomarkers to generate a personalised digital twin
            </div>
          </div>
          {/* Presets */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {Object.keys(PRESETS).map(k=>(
              <button key={k} className="btn-neon" style={{ padding:"4px 12px", fontSize:11 }}
                onClick={()=>{ setForm(PRESETS[k]); setErrors({}); setTried(false); }}>
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          {TABS.map((t,i)=>(
            <button key={t} className={`tab-item${activeTab===i?" active":""}`} onClick={()=>setActiveTab(i)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="glass-card" style={{
        borderRadius:"0 0 14px 14px", padding:"20px 24px",
        borderTop:"none",
        borderColor:"rgba(56,189,248,0.12)",
      }}>
        {activeTab===0 && (
          <div className="grid-3">
            <Field label="Age" name="age" value={form.age} onChange={handle} min={1} max={120} unit="years" error={errors.age}/>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:600, color:"var(--text-secondary)",
                              marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Sex</label>
              <select name="sex" value={form.sex}
                onChange={e=>setForm(f=>({...f,sex:e.target.value}))}
                className="neo-input">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <Field label="BMI" name="bmi" value={form.bmi} onChange={handle} min={10} max={70} step={0.1} unit="kg/m²" error={errors.bmi}/>
          </div>
        )}
        {activeTab===1 && (
          <div className="grid-2">
            <Field label="Systolic BP"       name="systolic_bp"       value={form.systolic_bp}       onChange={handle} min={60}  max={250} unit="mmHg"   error={errors.systolic_bp}/>
            <Field label="Diastolic BP"      name="diastolic_bp"      value={form.diastolic_bp}      onChange={handle} min={40}  max={150} unit="mmHg"   error={errors.diastolic_bp}/>
            <Field label="Total Cholesterol" name="total_cholesterol" value={form.total_cholesterol} onChange={handle} min={50}  max={600} unit="mg/dL"  error={errors.total_cholesterol}/>
            <Field label="HDL Cholesterol"   name="hdl_cholesterol"   value={form.hdl_cholesterol}   onChange={handle} min={10}  max={150} unit="mg/dL"  error={errors.hdl_cholesterol}/>
            <Field label="LDL Cholesterol"   name="ldl_cholesterol"   value={form.ldl_cholesterol}   onChange={handle} min={10}  max={400} unit="mg/dL"  error={errors.ldl_cholesterol}/>
          </div>
        )}
        {activeTab===2 && (
          <div className="grid-2">
            <Field label="Fasting Glucose"   name="fasting_glucose"   value={form.fasting_glucose}   onChange={handle} min={40}   max={600}  unit="mg/dL" error={errors.fasting_glucose}/>
            <Field label="Serum Creatinine"  name="serum_creatinine"  value={form.serum_creatinine}  onChange={handle} min={0.1}  max={20}   step={0.01} unit="mg/dL" error={errors.serum_creatinine}/>
            <Field label="ALT Enzyme"        name="alt_enzyme"        value={form.alt_enzyme}        onChange={handle} min={1}    max={2000} unit="U/L"   error={errors.alt_enzyme}/>
            <Field label="AST Enzyme"        name="ast_enzyme"        value={form.ast_enzyme}        onChange={handle} min={1}    max={2000} unit="U/L"   error={errors.ast_enzyme}/>
          </div>
        )}
        {activeTab===3 && (
          <div className="grid-3">
            <Field label="Daily Steps"      name="daily_step_count"      value={form.daily_step_count}      onChange={handle} min={0} max={50000} unit="steps" error={errors.daily_step_count}/>
            <Field label="Sleep Duration"   name="sleep_duration"         value={form.sleep_duration}         onChange={handle} min={0} max={24}    step={0.5} unit="hrs"   error={errors.sleep_duration}/>
            <Field label="Diet Quality 1-10" name="dietary_quality_score" value={form.dietary_quality_score}  onChange={handle} min={1} max={10}    error={errors.dietary_quality_score}/>
          </div>
        )}

        {/* ── Wearable / Smartwatch tab ── */}
        {activeTab===4 && (
          <div>
            <div style={{
              background:"rgba(56,189,248,0.06)",
              border:"1px solid rgba(56,189,248,0.2)",
              borderRadius:10, padding:"12px 16px", marginBottom:16,
              display:"flex", alignItems:"center", gap:10,
            }}>
              <span style={{ fontSize:18 }}>⌚</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>
                  Smartwatch / Wearable Data
                </div>
                <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:1 }}>
                  Adjust sliders to match your wearable readings.
                  These feed directly into the ML pipeline as extra features.
                </div>
              </div>
              {watchData.heart_rate_resting && (
                <span className="badge badge-green" style={{ marginLeft:"auto", fontSize:9 }}>
                  ● Active
                </span>
              )}
            </div>
            <Smartwatch onChange={setWatchData}/>
          </div>
        )}

        {/* Tab navigation + submit */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:20 }}>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-neon" disabled={activeTab===0}
              onClick={()=>setActiveTab(t=>t-1)} style={{ padding:"7px 16px", fontSize:12 }}>
              ← Back
            </button>
            <button className="btn-neon" disabled={activeTab===TABS.length-1}
              onClick={()=>setActiveTab(t=>t+1)} style={{ padding:"7px 16px", fontSize:12 }}>
              Next →
            </button>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {tried && errCount > 0 && (
              <span style={{ fontSize:11, color:"#ef4444" }}>
                ⚠ {errCount} field{errCount>1?"s":""} invalid
              </span>
            )}
            <button className="btn-neon-solid" onClick={handleSubmit} disabled={loading}
              style={{ padding:"11px 32px", fontSize:14 }}>
              {loading
                ? <span style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{width:14,height:14,border:"2px solid rgba(56,189,248,0.3)",borderTop:"2px solid #38bdf8",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/>
                    Analysing…
                  </span>
                : "▶ Analyse Digital Twin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
