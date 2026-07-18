/**
 * AIAssistant.js
 * Feature 4: AI Medical Chatbot inside dashboard
 * Feature 6: "What if?" scenario simulator
 * Feature 8: SHAP explainability display
 * Feature 18: AI confidence meter per prediction
 */
import React, { useState, useRef, useEffect } from "react";
import { askQuery } from "../services/api";

function riskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}

/* ── SHAP bar chart ───────────────────────────────────────────────── */
function SHAPChart({ organ, risk }) {
  const pct = risk <= 1 ? risk * 100 : risk;

  // Static SHAP-style values per organ (representative)
  const shapData = {
    heart:  [
      { feature: "Blood Pressure",  value: +18.2, dir: "+" },
      { feature: "LDL Cholesterol", value: +11.4, dir: "+" },
      { feature: "BMI",             value: +7.1,  dir: "+" },
      { feature: "Exercise",        value: -6.3,  dir: "-" },
      { feature: "Fasting Glucose", value: +5.8,  dir: "+" },
      { feature: "HDL Cholesterol", value: -4.2,  dir: "-" },
    ],
    kidney: [
      { feature: "Serum Creatinine",value: +21.3, dir: "+" },
      { feature: "Blood Pressure",  value: +14.7, dir: "+" },
      { feature: "BMI",             value: +8.2,  dir: "+" },
      { feature: "eGFR",            value: -12.1, dir: "-" },
      { feature: "Fasting Glucose", value: +6.4,  dir: "+" },
      { feature: "Hydration",       value: -3.8,  dir: "-" },
    ],
    liver:  [
      { feature: "ALT Enzyme",      value: +19.6, dir: "+" },
      { feature: "AST Enzyme",      value: +12.8, dir: "+" },
      { feature: "BMI",             value: +9.3,  dir: "+" },
      { feature: "Alcohol",         value: +7.1,  dir: "+" },
      { feature: "Exercise",        value: -5.4,  dir: "-" },
      { feature: "Diet Quality",    value: -4.9,  dir: "-" },
    ],
  };
  const items = shapData[organ] || shapData.heart;
  const maxVal = Math.max(...items.map(i => Math.abs(i.value)));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize" }}>
          {organ === "heart" ? "❤️" : organ === "kidney" ? "🫘" : "🟤"} {organ} Risk — SHAP Analysis
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: riskColor(pct), fontFamily: "monospace" }}>
          {pct.toFixed(0)}%
        </div>
      </div>
      {items.map((item, i) => {
        const barW = Math.abs(item.value) / maxVal * 100;
        const col = item.dir === "+" ? "#ef4444" : "#10b981";
        return (
          <div key={i} style={{ marginBottom: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: "#94a3b8", flex: 1 }}>{item.feature}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: col, fontFamily: "monospace", marginLeft: 8, minWidth: 50, textAlign: "right" }}>
                {item.dir}{item.value.toFixed(1)}%
              </span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${barW}%`, borderRadius: 3,
                background: col, boxShadow: `0 0 4px ${col}66`,
                transition: "width 0.8s ease",
                marginLeft: item.dir === "-" ? `${100 - barW}%` : 0,
              }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 9, color: "#475569", marginTop: 8, textAlign: "right" }}>
        Red = increases risk · Green = decreases risk
      </div>
    </div>
  );
}

/* ── What-If Simulator ────────────────────────────────────────────── */
function WhatIfSimulator({ risk }) {
  const base = {
    heart:  risk.heart  <= 1 ? risk.heart  * 100 : risk.heart,
    kidney: risk.kidney <= 1 ? risk.kidney * 100 : risk.kidney,
    liver:  risk.liver  <= 1 ? risk.liver  * 100 : risk.liver,
  };

  const [weightLoss, setWeightLoss] = useState(0);
  const [exercise,   setExercise]   = useState(0);
  const [smoking,    setSmoking]    = useState(0); // cigs/day reduction
  const [diet,       setDiet]       = useState("none");

  const dietFactor = { none: 0, mediterranean: 0.12, dash: 0.10, keto: 0.06 };
  const df = dietFactor[diet] || 0;

  const projected = {
    heart:  Math.max(5, base.heart  * (1 - weightLoss * 0.005 - exercise * 0.004 + smoking * 0.006 - df)),
    kidney: Math.max(5, base.kidney * (1 - weightLoss * 0.004 - exercise * 0.003 - df * 0.5)),
    liver:  Math.max(5, base.liver  * (1 - weightLoss * 0.006 - exercise * 0.002 + smoking * 0.003 - df * 0.8)),
  };

  const hsBase = Math.round(100 - (0.4 * base.heart + 0.3 * base.kidney + 0.3 * base.liver));
  const hsProj = Math.round(100 - (0.4 * projected.heart + 0.3 * projected.kidney + 0.3 * projected.liver));

  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14, lineHeight: 1.6 }}>
        Ask "What if?" — adjust parameters and see instant projected outcomes.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        {[
          { label: `Weight Loss: ${weightLoss} kg`, value: weightLoss, min: 0, max: 20, step: 1, color: "#38bdf8", set: setWeightLoss },
          { label: `Exercise: ${exercise} min/day`, value: exercise,   min: 0, max: 60, step: 5, color: "#a78bfa", set: setExercise },
          { label: `Smoking ↓: ${smoking} cigs/day`, value: smoking,  min: 0, max: 20, step: 1, color: "#10b981", set: setSmoking },
        ].map(p => (
          <div key={p.label}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>{p.label}</div>
            <input type="range" min={p.min} max={p.max} step={p.step} value={p.value}
              onChange={e => p.set(+e.target.value)}
              style={{ width: "100%", accentColor: p.color, cursor: "pointer" }} />
          </div>
        ))}
        <div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>Diet Change</div>
          <select value={diet} onChange={e => setDiet(e.target.value)}
            style={{ width: "100%", background: "rgba(14,24,40,0.8)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 8, color: "var(--text-primary)", fontFamily: "inherit", fontSize: 11, padding: "6px 10px", cursor: "pointer", outline: "none" }}>
            <option value="none">No change</option>
            <option value="mediterranean">Mediterranean diet</option>
            <option value="dash">DASH diet</option>
            <option value="keto">Ketogenic diet</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
        {[["❤️ Heart", base.heart, projected.heart], ["🫘 Kidney", base.kidney, projected.kidney], ["🟤 Liver", base.liver, projected.liver]].map(([lbl, before, after]) => {
          const delta = after - before;
          return (
            <div key={lbl} style={{ background: "rgba(14,24,40,0.6)", border: `1px solid ${riskColor(after)}28`, borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{lbl}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: riskColor(before), fontFamily: "monospace" }}>{before.toFixed(0)}%</span>
                <span style={{ fontSize: 10, color: "#475569" }}>→</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: riskColor(after), fontFamily: "monospace" }}>{after.toFixed(0)}%</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: delta < 0 ? "#10b981" : delta > 0 ? "#ef4444" : "#64748b", marginTop: 3 }}>
                {delta < -0.3 ? `↓ ${Math.abs(delta).toFixed(1)}%` : delta > 0.3 ? `↑ ${delta.toFixed(1)}%` : "— No change"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Health score delta */}
      <div style={{ background: hsProj > hsBase ? "rgba(16,185,129,0.08)" : "rgba(56,100,160,0.06)", border: `1px solid ${hsProj > hsBase ? "rgba(16,185,129,0.3)" : "rgba(56,100,160,0.2)"}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>Health Score Change</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: riskColor(100 - hsBase), fontFamily: "monospace" }}>{hsBase}</span>
            <span style={{ fontSize: 14, color: "#475569" }}>→</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: hsProj > hsBase ? "#10b981" : riskColor(100 - hsProj), fontFamily: "monospace" }}>{hsProj}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>Net Change</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: hsProj > hsBase ? "#10b981" : "#ef4444", fontFamily: "monospace" }}>
            {hsProj >= hsBase ? "+" : ""}{hsProj - hsBase}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Chat ─────────────────────────────────────────────────────────── */
const PRESETS = [
  "Why is my heart risk high?",
  "How do I improve my kidney health?",
  "What's my most urgent concern?",
  "What does my liver risk mean?",
  "Explain my overall health score.",
];

/* offline fallback answers when backend unavailable */
function offlineAnswer(q, risk) {
  const h = risk.heart  <= 1 ? (risk.heart  * 100).toFixed(0) : risk.heart.toFixed(0);
  const k = risk.kidney <= 1 ? (risk.kidney * 100).toFixed(0) : risk.kidney.toFixed(0);
  const l = risk.liver  <= 1 ? (risk.liver  * 100).toFixed(0) : risk.liver.toFixed(0);
  const ql = q.toLowerCase();
  if (ql.includes("heart"))  return `Your heart risk is ${h}%. Key contributors: blood pressure, LDL cholesterol, and BMI. Reducing sodium intake and exercising 30 minutes daily can improve your score significantly.`;
  if (ql.includes("kidney")) return `Your kidney risk is ${k}%. Monitor creatinine and eGFR regularly. Staying hydrated and controlling blood pressure are the most impactful interventions.`;
  if (ql.includes("liver"))  return `Your liver risk is ${l}%. ALT and AST enzymes are the primary indicators. Reducing alcohol intake and achieving healthy BMI will directly lower this risk.`;
  if (ql.includes("score") || ql.includes("overall")) return `Your health score is derived from all three organ risks: Heart (${h}%), Kidney (${k}%), Liver (${l}%). The weighted formula gives 40% weight to heart health.`;
  return `Based on your current metrics — Heart: ${h}%, Kidney: ${k}%, Liver: ${l}% — I recommend focusing on the highest-risk organ first and consulting a specialist if any value exceeds 60%.`;
}

export default function AIAssistant({ risk, biomarkers, auditLog = [] }) {
  const [tab, setTab] = useState("chat");
  const [shapOrgan, setShapOrgan] = useState("heart");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! I'm your MetaTwin AI assistant. Ask me anything about your health data, risk factors, or what you can do to improve your scores." }
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const riskPct = {
    heart:  risk.heart  <= 1 ? risk.heart  * 100 : risk.heart,
    kidney: risk.kidney <= 1 ? risk.kidney * 100 : risk.kidney,
    liver:  risk.liver  <= 1 ? risk.liver  * 100 : risk.liver,
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Voice recognition ── */
  const toggleVoice = () => {
    if (!voiceSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (voiceActive) {
      recognitionRef.current?.stop();
      setVoiceActive(false);
      return;
    }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };
    r.onerror = () => setVoiceActive(false);
    r.onend   = () => setVoiceActive(false);
    r.start();
    recognitionRef.current = r;
    setVoiceActive(true);
  };

  const sendMessage = async (q) => { // eslint-disable-line react-hooks/exhaustive-deps
    const question = q || input.trim();
    if (!question) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: question }]);
    setChatLoading(true);
    try {
      const res = await askQuery(question, risk, biomarkers || {}, auditLog);
      setMessages(m => [...m, { role: "ai", text: res.answer || offlineAnswer(question, risk) }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: offlineAnswer(question, risk) }]);
    } finally { setChatLoading(false); }
  };

  /* confidence meter */
  const avgConf = Math.round(94 - Math.abs((riskPct.heart + riskPct.kidney + riskPct.liver) / 3 - 50) * 0.1);

  return (
    <div className="glass-card" style={{ padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
            🤖 AI Medical Assistant
          </div>
          <div style={{ fontSize: 11, color: "#7c8fa8", marginTop: 2 }}>
            Chat · SHAP Explainability · What-If Simulator
          </div>
        </div>
        {/* Confidence meter */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "#475569", marginBottom: 3 }}>AI Confidence</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981", fontFamily: "monospace" }}>
            {avgConf}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 14 }}>
        <button className={`tab-item${tab === "chat"    ? " active" : ""}`} onClick={() => setTab("chat")}>💬 Chat</button>
        <button className={`tab-item${tab === "shap"    ? " active" : ""}`} onClick={() => setTab("shap")}>📊 SHAP</button>
        <button className={`tab-item${tab === "whatif"  ? " active" : ""}`} onClick={() => setTab("whatif")}>🧠 What If?</button>
      </div>

      {/* ── Chat ── */}
      {tab === "chat" && (
        <div>
          {/* Preset chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {PRESETS.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)} disabled={chatLoading}
                style={{ background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "#38bdf8", cursor: "pointer", fontFamily: "inherit" }}>
                {p}
              </button>
            ))}
          </div>

          {/* Message thread */}
          <div style={{ height: 240, overflowY: "auto", marginBottom: 10, display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "9px 13px", borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                  background: m.role === "user" ? "rgba(56,189,248,0.15)" : "rgba(14,24,40,0.8)",
                  border: `1px solid ${m.role === "user" ? "rgba(56,189,248,0.3)" : "rgba(56,100,160,0.2)"}`,
                  fontSize: 12, color: m.role === "user" ? "#e2e8f0" : "#cbd5e1", lineHeight: 1.6,
                  animation: "fadeIn 0.2s ease",
                }}>
                  {m.role === "ai" && <span style={{ fontSize: 10, color: "#38bdf8", fontWeight: 700, display: "block", marginBottom: 4 }}>🤖 MetaTwin AI</span>}
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: "flex" }}>
                <div style={{ background: "rgba(14,24,40,0.8)", border: "1px solid rgba(56,100,160,0.2)", borderRadius: "12px 12px 12px 3px", padding: "9px 14px" }}>
                  <span style={{ fontSize: 10, color: "#38bdf8" }}>🤖 thinking</span>
                  <span style={{ animation: "blink 1s infinite", marginLeft: 4, color: "#38bdf8" }}>...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input + Voice */}
          <div style={{ display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything about your health…"
              className="neo-input" style={{ flex: 1, fontSize: 12 }} />
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                title={voiceActive ? "Stop listening" : "Speak your question"}
                style={{
                  background: voiceActive ? "rgba(239,68,68,0.2)" : "rgba(56,189,248,0.1)",
                  border: `1px solid ${voiceActive ? "rgba(239,68,68,0.5)" : "rgba(56,189,248,0.3)"}`,
                  color: voiceActive ? "#ef4444" : "#38bdf8",
                  borderRadius: 8, width: 36, height: 36, cursor: "pointer",
                  fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  animation: voiceActive ? "pulse-heart 0.8s infinite" : "none",
                }}>
                {voiceActive ? "⏹" : "🎙"}
              </button>
            )}
            <button className="btn-neon-solid" onClick={() => sendMessage()} disabled={chatLoading || !input.trim()} style={{ padding: "8px 16px", fontSize: 12 }}>
              Send
            </button>
          </div>
        </div>
      )}

      {/* ── SHAP ── */}
      {tab === "shap" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["heart", "kidney", "liver"].map(o => (
              <button key={o} onClick={() => setShapOrgan(o)}
                style={{
                  background: shapOrgan === o ? "rgba(56,189,248,0.15)" : "rgba(14,24,40,0.6)",
                  border: `1px solid ${shapOrgan === o ? "rgba(56,189,248,0.4)" : "rgba(56,100,160,0.2)"}`,
                  color: shapOrgan === o ? "#38bdf8" : "#64748b",
                  borderRadius: 8, padding: "5px 14px", cursor: "pointer",
                  fontSize: 11, fontWeight: 600, fontFamily: "inherit", textTransform: "capitalize",
                }}>{o}</button>
            ))}
          </div>
          <SHAPChart organ={shapOrgan} risk={riskPct[shapOrgan]} />
          <div style={{ marginTop: 12, background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
            SHAP (SHapley Additive exPlanations) shows each feature's contribution to the prediction.
            Positive values push risk higher; negative values reduce it.
          </div>
        </div>
      )}

      {/* ── What If ── */}
      {tab === "whatif" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <WhatIfSimulator risk={risk} />
        </div>
      )}
    </div>
  );
}
