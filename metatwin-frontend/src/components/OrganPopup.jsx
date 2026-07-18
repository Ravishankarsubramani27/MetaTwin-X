/**
 * OrganPopup.jsx — Click popup when user clicks organ in 3D viewer
 * Shows: organ name, risk %, clinical interpretation, biomarkers, key findings
 */
import React from "react";

const ORGAN_INFO = {
  heart: {
    icon:"❤️", name:"Heart — Cardiovascular System",
    accent:"#ef4444",
    findings: {
      low:  "Cardiovascular risk is within acceptable range. Annual ECG screening recommended.",
      mod:  "Moderate cardiovascular risk detected. Blood pressure and lipid monitoring advised.",
      high: "High cardiovascular risk. Urgent cardiology evaluation — ECG + stress test recommended.",
    },
    biomarkers: ["Systolic BP","Total Cholesterol","HDL Cholesterol","Fasting Glucose","BMI"],
  },
  kidney: {
    icon:"🫘", name:"Kidney — Renal System",
    accent:"#38bdf8",
    findings: {
      low:  "Renal function is within normal limits. Maintain adequate hydration.",
      mod:  "Moderate renal risk. Monitor creatinine, eGFR, and sodium intake.",
      high: "High renal risk. Nephrology referral urgently required. eGFR + urine ACR needed.",
    },
    biomarkers: ["Serum Creatinine","eGFR","Fasting Glucose","Blood Pressure","BMI"],
  },
  liver: {
    icon:"🟤", name:"Liver — Hepatic System",
    accent:"#f59e0b",
    findings: {
      low:  "Liver function markers are within normal range. Maintain healthy BMI.",
      mod:  "Mild hepatic stress detected. Reduce alcohol, refined carbohydrates, and fat.",
      high: "High hepatic risk. Urgent hepatology evaluation — LFT + abdominal ultrasound.",
    },
    biomarkers: ["ALT Enzyme","AST Enzyme","Total Bilirubin","BMI","Fasting Glucose"],
  },
};

function getLevel(pct) {
  if (pct >= 60) return "high";
  if (pct >= 30) return "mod";
  return "low";
}

function riskColor(pct) {
  if (pct >= 60) return "#ef4444";
  if (pct >= 30) return "#f59e0b";
  return "#10b981";
}

function riskLabel(pct) {
  if (pct >= 60) return "High Risk";
  if (pct >= 30) return "Moderate";
  return "Low Risk";
}

export default function OrganPopup({ organ, riskPct, onClose }) {
  if (!organ) return null;
  const info  = ORGAN_INFO[organ] || ORGAN_INFO.heart;
  const level = getLevel(riskPct);
  const col   = riskColor(riskPct);
  const pct   = Math.round(riskPct * 10) / 10;

  return (
    <div style={{
      position:"absolute", top:16, right:16, zIndex:100,
      width:280,
      background:"rgba(6,11,20,0.97)",
      border:`1px solid ${col}44`,
      borderTop:`3px solid ${col}`,
      borderRadius:12,
      boxShadow:`0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${col}22`,
      animation:"fadeIn 0.2s ease",
      backdropFilter:"blur(12px)",
      overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{
        padding:"12px 14px",
        borderBottom:`1px solid ${col}22`,
        display:"flex", alignItems:"center",
        justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20,
            ...(organ==="heart"?{animation:"pulse-heart 1.2s infinite"}:{}) }}>
            {info.icon}
          </span>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:"#e2e8f0" }}>
              {info.name}
            </div>
            <div style={{ fontSize:9, color:col, fontWeight:700,
                          textTransform:"uppercase", letterSpacing:"0.1em" }}>
              {riskLabel(pct)}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background:"rgba(255,255,255,0.08)",
          border:"1px solid rgba(255,255,255,0.1)",
          color:"#94a3b8", borderRadius:6,
          width:24, height:24, cursor:"pointer",
          fontSize:13, lineHeight:1,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>✕</button>
      </div>

      {/* Risk score */}
      <div style={{ padding:"14px", borderBottom:`1px solid ${col}18` }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ textAlign:"center", minWidth:70 }}>
            <div style={{ fontSize:36, fontWeight:900, color:col,
                          fontFamily:"JetBrains Mono,monospace",
                          textShadow:`0 0 12px ${col}88`,
                          lineHeight:1 }}>
              {pct.toFixed(1)}%
            </div>
            <div style={{ fontSize:9, color:"#475569", marginTop:2 }}>risk score</div>
          </div>
          <div style={{ flex:1 }}>
            {/* Bar */}
            <div style={{ height:6, background:"rgba(255,255,255,0.06)",
                          borderRadius:3, overflow:"hidden", marginBottom:6 }}>
              <div style={{
                height:"100%", width:`${pct}%`, borderRadius:3,
                background:`linear-gradient(90deg,${col}88,${col})`,
                boxShadow:`0 0 6px ${col}`,
                transition:"width 0.8s ease",
              }}/>
            </div>
            <span style={{
              background:`${col}18`, color:col,
              border:`1px solid ${col}44`,
              borderRadius:20, padding:"2px 10px",
              fontSize:10, fontWeight:700,
            }}>{riskLabel(pct)}</span>
          </div>
        </div>
      </div>

      {/* Clinical interpretation */}
      <div style={{ padding:"12px 14px", borderBottom:`1px solid rgba(56,100,160,0.12)` }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#64748b",
                      textTransform:"uppercase", letterSpacing:"0.08em",
                      marginBottom:6 }}>Clinical Interpretation</div>
        <div style={{ fontSize:11, color:"#cbd5e1", lineHeight:1.6 }}>
          {info.findings[level]}
        </div>
      </div>

      {/* Key biomarkers */}
      <div style={{ padding:"12px 14px" }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#64748b",
                      textTransform:"uppercase", letterSpacing:"0.08em",
                      marginBottom:8 }}>Key Biomarkers</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {info.biomarkers.map(b => (
            <span key={b} style={{
              background:"rgba(56,189,248,0.08)",
              border:"1px solid rgba(56,189,248,0.2)",
              color:"#7dd3fc",
              borderRadius:6, padding:"3px 8px",
              fontSize:10, fontWeight:500,
            }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Urgency indicator */}
      {level === "high" && (
        <div style={{
          margin:"0 14px 12px",
          background:"rgba(239,68,68,0.1)",
          border:"1px solid rgba(239,68,68,0.3)",
          borderRadius:8, padding:"8px 12px",
          fontSize:11, color:"#fca5a5", fontWeight:600,
          lineHeight:1.5,
        }}>
          🚨 Immediate medical consultation strongly advised
        </div>
      )}
    </div>
  );
}
