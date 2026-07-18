import React, { useState, useEffect, useCallback, useRef } from "react";
import { predictRisk, getRecommendations, predictAdaptive, updateTwin, normalizeRisks } from "../services/api";
import { useAuth } from "../components/AuthGate";
import TopBar              from "../components/TopBar";
import LeftPanel           from "../components/LeftPanel";
import CenterPanel         from "../components/CenterPanel";
import RightPanel          from "../components/RightPanel";
import BottomSection       from "../components/BottomSection";
import HealthForm          from "../components/HealthForm";
import ReportUpload        from "../components/ReportUpload";
import AdvancedPanel       from "../components/AdvancedPanel";
import PatientReport       from "../components/PatientReport";
import DiseaseProgression  from "../components/DiseaseProgression";
import AIAssistant         from "../components/AIAssistant";
import ClinicalIndices     from "../components/ClinicalIndices";
import SettingsPage        from "../components/SettingsPage";
import MedicationTracker   from "../components/MedicationTracker";
import RiskHeatmapCalendar from "../components/RiskHeatmapCalendar";
import OrganInteractionGraph from "../components/OrganInteractionGraph";
import SleepRecovery       from "../components/SleepRecovery";
import DoctorDashboard     from "../components/DoctorDashboard";
import ConfettiCelebration from "../components/ConfettiCelebration";
import HealthTimeline      from "../components/HealthTimeline";
import DigitalTwinStatus   from "../components/DigitalTwinStatus";
import { exportToCsv }     from "../utils/exportCsv";

export default function Home() {
  const { logout } = useAuth();
  const [risk,       setRisk]       = useState(null);
  const [recs,       setRecs]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [watch] = useState({});
  const [view,       setView]       = useState("dashboard");
  const [toast,      setToast]      = useState(null);
  const [twinState,  setTwinState]  = useState(null);
  const [formData,   setFormData]   = useState(null);
  const [auditLog,   setAuditLog]   = useState([]);
  const [emergency,  setEmergency]  = useState(null);
  const [liveVitals] = useState({});
  const [confetti,   setConfetti]   = useState(false);
  const prevHealthRef = useRef(null);
  const toastTimer = useRef(null);

  const [patientId] = useState(() => {
    const s = localStorage.getItem("mt_pid");
    if (s) return s;
    const id = `MT-${Date.now().toString(36).toUpperCase()}`;
    localStorage.setItem("mt_pid", id);
    return id;
  });

  // restore last session
  useEffect(() => {
    try {
      const s = localStorage.getItem("mt_last");
      if (s) {
        const { risk:r, recs:rc, formData:fd, auditLog:al } = JSON.parse(s);
        if (r) { setRisk(r); setRecs(rc); setFormData(fd); setAuditLog(al||[]); }
      }
    } catch {}
  }, []);

  // ── Emergency alert detection ─────────────────────────────────────
  useEffect(() => {
    const notifSettings = (() => {
      try { return JSON.parse(localStorage.getItem("mt_notifs") || "{}"); } catch { return {}; }
    })();
    if (!notifSettings.emergency) { setEmergency(null); return; }

    const risks = risk ? normalizeRisks(risk) : {};
    const spo2  = liveVitals.spo2 || 98;
    const reasons = [];

    if (risks.heart  > 80) reasons.push(`Heart Risk ${risks.heart.toFixed(0)}% (>80%)`);
    if (risks.kidney > 80) reasons.push(`Kidney Risk ${risks.kidney.toFixed(0)}% (>80%)`);
    if (risks.liver  > 80) reasons.push(`Liver Risk ${risks.liver.toFixed(0)}% (>80%)`);
    if (spo2 < 90)         reasons.push(`SpO₂ ${spo2.toFixed(1)}% (<90%)`);

    setEmergency(reasons.length > 0 ? { reasons } : null);
  }, [risk, liveVitals]);

  const showToast = useCallback((msg, type="success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const map = {
        "d": "dashboard", "i": "input", "a": "assistant",
        "s": "settings",  "r": "report","c": "clinical",
        "p": "progression","m": "meds", "h": "heatmap",
        "g": "graph",      "z": "sleep","o": "doctor",
      };
      if (map[e.key.toLowerCase()]) setView(map[e.key.toLowerCase()]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handlePredict = async (data) => {
    setLoading(true); setError(null); setFormData(data);
    try {
      // wearable fields are merged into data by HealthForm already
      const payload = { ...data };
      let scores, audit = [];
      try {
        const r = await predictAdaptive(payload, payload, patientId);
        scores = r.adjusted_scores; audit = r.audit_log || [];
      } catch {
        const r = await predictRisk(payload);
        scores = r.adjusted_scores || r; audit = r.audit_log || [];
      }
      setRisk(scores); setAuditLog(audit);
      const [recRes, twinRes] = await Promise.all([
        getRecommendations(scores),
        updateTwin(patientId, scores, payload, null).catch(()=>null),
      ]);
      setRecs(recRes);
      if (twinRes) setTwinState(twinRes);
      // ── Confetti if health score improved by 10+ pts ──────────────
      const newHealth = Math.round(100 - (0.4*(scores.heart||0)*100 + 0.3*(scores.kidney||0)*100 + 0.3*(scores.liver||0)*100));
      if (prevHealthRef.current !== null && newHealth - prevHealthRef.current >= 10) {
        setConfetti(true);
        showToast(`🎉 Health score improved by +${newHealth - prevHealthRef.current} points!`, "success");
      }
      prevHealthRef.current = newHealth;
      try {
        localStorage.setItem("mt_last", JSON.stringify({
          risk: scores, recs: recRes, formData: data, auditLog: audit
        }));
      } catch {}
      setView("dashboard");
      showToast("✓ Digital twin updated", "success");
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Prediction failed");
      showToast("Prediction failed", "error");
    } finally { setLoading(false); }
  };

  const handleClear = () => {
    setRisk(null); setRecs(null); setFormData(null);
    setAuditLog([]); setTwinState(null);
    localStorage.removeItem("mt_last");
    setView("input");
    showToast("Session cleared", "info");
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
                  height:"100vh", overflow:"hidden" }}>
      <TopBar
        patientId={patientId}
        risk={risk}
        view={view} setView={setView}
        onClear={handleClear}
        loading={loading}
        onLogout={logout}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:72, right:20, zIndex:9999,
          padding:"10px 18px", borderRadius:10,
          fontFamily:"var(--font)", fontSize:13, fontWeight:600,
          animation:"slideIn 0.2s ease",
          background: toast.type==="success" ? "rgba(16,185,129,0.15)"
                    : toast.type==="error"   ? "rgba(239,68,68,0.15)"
                    : "rgba(56,189,248,0.15)",
          border: `1px solid ${toast.type==="success"?"rgba(16,185,129,0.4)":toast.type==="error"?"rgba(239,68,68,0.4)":"rgba(56,189,248,0.4)"}`,
          color:  toast.type==="success"?"#10b981":toast.type==="error"?"#ef4444":"#38bdf8",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          backdropFilter:"blur(12px)",
          maxWidth:320,
        }}>
          {toast.msg}
        </div>
      )}

      {/* 🚨 Emergency Alert Banner */}
      {emergency && (
        <div style={{
          position:"fixed", top:56, left:0, right:0, zIndex:9990,
          background:"linear-gradient(90deg,rgba(239,68,68,0.95),rgba(185,28,28,0.95))",
          borderBottom:"2px solid #ef4444",
          padding:"10px 24px",
          display:"flex", alignItems:"center", gap:14,
          animation:"slideIn 0.3s ease",
          backdropFilter:"blur(12px)",
          boxShadow:"0 4px 24px rgba(239,68,68,0.4)",
        }}>
          <span style={{ fontSize:20, animation:"pulse-heart 0.6s infinite" }}>🚨</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#fff", marginBottom:2 }}>
              EMERGENCY ALERT — Immediate Medical Consultation Recommended
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.8)" }}>
              {emergency.reasons.join(" · ")}
            </div>
          </div>
          <button onClick={() => setEmergency(null)} style={{
            background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)",
            color:"#fff", borderRadius:6, padding:"4px 12px", fontSize:11,
            fontWeight:700, cursor:"pointer",
          }}>Dismiss</button>
        </div>
      )}

      {/* 🎉 Confetti */}
      <ConfettiCelebration active={confetti} onDone={() => setConfetti(false)} />

      {/* Main content */}
      <div className="main-scroll" style={{
        flex:1, padding:"20px 24px",
        overflowY:"auto", overflowX:"hidden",
        minHeight:0,
      }}>
        {error && (
          <div style={{
            background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)",
            borderLeft:"3px solid #ef4444", borderRadius:8, padding:"10px 16px",
            marginBottom:16, color:"#fca5a5", fontSize:13,
          }}>⚠ {error}</div>
        )}

        {/* Input view */}
        {view === "input" && (
          <HealthForm onSubmit={handlePredict} loading={loading} />
        )}

        {/* Upload view */}
        {view === "upload" && (
          <ReportUpload onAnalysisComplete={(s, r) => {
            setRisk(s); setRecs(r); setView("dashboard");
          }} />
        )}

        {/* Advanced AI view */}
        {view === "advanced" && risk && (
          <AdvancedPanel
            risk={risk} biomarkers={formData||{}}
            auditLog={auditLog}
            age={formData?.age||50} sex={formData?.sex||"male"}
          />
        )}

        {/* Disease Progression + Body Heatmap + Playback + Future Me */}
        {view === "progression" && risk && (
          <DiseaseProgression risk={risk} simResult={null} />
        )}

        {/* AI Assistant — Chat + SHAP + What-If */}
        {view === "assistant" && risk && (
          <AIAssistant
            risk={risk}
            biomarkers={formData || {}}
            auditLog={auditLog}
          />
        )}

        {/* Clinical Indices — Bio Age + Emergency + Doctor View */}
        {view === "clinical" && risk && (
          <ClinicalIndices
            risk={risk}
            formData={formData}
            liveData={null}
          />
        )}

        {/* Patient Report view */}
        {view === "report" && (
          <PatientReport
            existingScores={risk}
            existingBiomarkers={formData||{}}
            existingAudit={auditLog}
            patientId={patientId}
            formData={formData}
          />
        )}

        {/* Settings view */}
        {view === "settings" && (
          <SettingsPage onClose={() => setView("dashboard")} />
        )}

        {/* Medication Tracker */}
        {view === "meds" && (
          <MedicationTracker risk={risk} />
        )}

        {/* Risk Heatmap Calendar */}
        {view === "heatmap" && risk && (
          <RiskHeatmapCalendar risk={risk} />
        )}

        {/* Organ Interaction Graph */}
        {view === "graph" && risk && (
          <OrganInteractionGraph risk={risk} />
        )}

        {/* Sleep & Recovery */}
        {view === "sleep" && (
          <SleepRecovery risk={risk} />
        )}

        {/* Doctor Dashboard */}
        {view === "doctor" && (
          <DoctorDashboard patientId={patientId} risk={risk} formData={formData} />
        )}

        {/* Dashboard view — 3-panel layout */}
        {(view === "dashboard" || !["input","upload","advanced","report","progression","assistant","clinical","settings","meds","heatmap","graph","sleep","doctor"].includes(view)) && (
          risk ? (
            <div>
              {/* Dashboard toolbar */}
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginBottom:12 }}>
                <button onClick={() => exportToCsv(patientId, risk, formData, auditLog)}
                  className="btn-neon" style={{ padding:"6px 14px", fontSize:11 }}>
                  📥 Export CSV
                </button>
                <button onClick={() => setView("graph")} className="btn-neon"
                  style={{ padding:"6px 14px", fontSize:11 }}>
                  🫀 Organ Graph
                </button>
                <button onClick={() => setView("heatmap")} className="btn-neon"
                  style={{ padding:"6px 14px", fontSize:11 }}>
                  📅 Heatmap
                </button>
              </div>
              {/* 3-column main panel */}
              <div style={{
                display:"grid",
                gridTemplateColumns:"280px 1fr 280px",
                gap:18, marginBottom:18,
              }}>
                <LeftPanel risk={risk} twinState={twinState} formData={formData} />
                <CenterPanel risk={risk} loading={loading} formData={formData} />
                <RightPanel recs={recs} twinState={twinState} watch={watch} patientId={patientId} risk={risk} />
              </div>
              {/* Bottom section — simulation + health gauge */}
              <BottomSection risk={risk} formData={formData} />

              {/* Health Timeline + Twin Status row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 300px",
                            gap:18, marginTop:18 }}>
                <HealthTimeline risk={risk} />
                <DigitalTwinStatus twinState={twinState} />
              </div>
            </div>
          ) : (
            <WelcomeScreen onStart={() => setView("input")} onUpload={() => setView("upload")} />
          )
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart, onUpload }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px", animation:"fadeIn 0.4s ease" }}>
      <div style={{
        width:80, height:80, margin:"0 auto 24px",
        background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(167,139,250,0.2))",
        border:"1px solid rgba(56,189,248,0.3)",
        borderRadius:22, display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:36, boxShadow:"0 0 40px rgba(56,189,248,0.2)",
      }}>🩺</div>
      <h1 style={{
        fontSize:28, fontWeight:800, marginBottom:12,
        background:"linear-gradient(135deg,#38bdf8,#a78bfa)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        letterSpacing:"-0.02em",
      }}>MetaTwin-X</h1>
      <p style={{ color:"var(--text-secondary)", fontSize:14, maxWidth:480, margin:"0 auto 40px", lineHeight:1.7 }}>
        AI-powered multi-organ digital health twin. Predict heart, kidney & liver risks
        with explainable AI, 12-month simulation, and intelligent interventions.
      </p>
      <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
        <button className="btn-neon-solid" onClick={onStart} style={{ padding:"13px 36px", fontSize:14 }}>
          ✏ Enter Health Data
        </button>
        <button className="btn-neon" onClick={onUpload} style={{ padding:"13px 36px", fontSize:14 }}>
          📄 Upload Lab Report
        </button>
      </div>
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14,
        maxWidth:720, margin:"48px auto 0",
      }}>
        {[
          ["❤️","Heart Risk","XGBoost + interaction engine"],
          ["🫘","Kidney Risk","eGFR + creatinine analysis"],
          ["🟤","Liver Risk","ALT/AST enzyme profiling"],
          ["🧠","AI Insights","Causal inference + RL agent"],
        ].map(([icon,title,desc])=>(
          <div key={title} className="glass-card" style={{ padding:"16px", textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:4, color:"var(--text-primary)" }}>{title}</div>
            <div style={{ fontSize:11, color:"var(--text-dim)", lineHeight:1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
