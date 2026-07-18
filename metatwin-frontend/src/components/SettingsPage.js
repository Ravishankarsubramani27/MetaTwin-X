/**
 * SettingsPage.js
 * Theme · Notifications · Export · Security · About
 */
import React, { useState, useEffect } from "react";

const THEMES = [
  { key: "dark-blue",   label: "Dark Navy",    bg: "#060b14", accent: "#38bdf8" },
  { key: "dark-purple", label: "Dark Purple",  bg: "#0d0618", accent: "#a78bfa" },
  { key: "dark-green",  label: "Dark Forest",  bg: "#061410", accent: "#10b981" },
  { key: "midnight",    label: "Midnight",      bg: "#080808", accent: "#f59e0b" },
];

const LANGUAGES = [
  { key: "en", label: "English" },
  { key: "es", label: "Español" },
  { key: "fr", label: "Français" },
  { key: "de", label: "Deutsch" },
  { key: "hi", label: "हिन्दी" },
];

const EXPORT_FORMATS = ["PDF", "CSV", "JSON"];

function Section({ icon, title, accent = "#38bdf8", children }) {
  return (
    <div className="glass-card" style={{ padding: "20px 24px", marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
        paddingBottom: 12, borderBottom: "1px solid rgba(56,100,160,0.2)",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: `${accent}18`, border: `1px solid ${accent}33`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>{icon}</div>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, label, desc }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0", borderBottom: "1px solid rgba(56,100,160,0.08)",
    }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: value ? "#10b981" : "rgba(71,85,105,0.4)",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
          boxShadow: value ? "0 0 8px rgba(16,185,129,0.4)" : "none",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: value ? 22 : 3,
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </button>
    </div>
  );
}

function hashPin(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0;
  return h.toString(36);
}

function PinChangeForm() {
  const [oldPin,  setOldPin]  = useState("");
  const [newPin,  setNewPin]  = useState("");
  const [confirm, setConfirm] = useState("");
  const [pinMsg,  setPinMsg]  = useState(null);

  const changePin = () => {
    const stored = localStorage.getItem("mt_auth_pin");
    if (stored && hashPin(oldPin) !== stored) {
      setPinMsg({ type: "error", text: "Current PIN is incorrect." }); return;
    }
    if (newPin.length < 4) {
      setPinMsg({ type: "error", text: "New PIN must be at least 4 digits." }); return;
    }
    if (newPin !== confirm) {
      setPinMsg({ type: "error", text: "New PINs do not match." }); return;
    }
    localStorage.setItem("mt_auth_pin", hashPin(newPin));
    setOldPin(""); setNewPin(""); setConfirm("");
    setPinMsg({ type: "success", text: "PIN changed successfully." });
    setTimeout(() => setPinMsg(null), 3000);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}>
        Change PIN
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
        Your PIN protects access to all patient data. Minimum 4 digits.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 10, color: "#64748b", display: "block", marginBottom: 4 }}>Current PIN</label>
          <input type="password" maxLength={8} value={oldPin}
            onChange={e => setOldPin(e.target.value)}
            placeholder="••••" className="neo-input"
            style={{ textAlign: "center", letterSpacing: "0.3em" }}/>
        </div>
        <div>
          <label style={{ fontSize: 10, color: "#64748b", display: "block", marginBottom: 4 }}>New PIN</label>
          <input type="password" maxLength={8} value={newPin}
            onChange={e => setNewPin(e.target.value)}
            placeholder="••••" className="neo-input"
            style={{ textAlign: "center", letterSpacing: "0.3em" }}/>
        </div>
        <div>
          <label style={{ fontSize: 10, color: "#64748b", display: "block", marginBottom: 4 }}>Confirm</label>
          <input type="password" maxLength={8} value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••" className="neo-input"
            style={{ textAlign: "center", letterSpacing: "0.3em" }}/>
        </div>
        {pinMsg && (
          <div style={{ gridColumn: "1/-1", fontSize: 11, fontWeight: 600,
            color: pinMsg.type === "success" ? "#10b981" : "#ef4444" }}>
            {pinMsg.type === "success" ? "✓" : "✕"} {pinMsg.text}
          </div>
        )}
        <div style={{ gridColumn: "1/-1" }}>
          <button onClick={changePin} className="btn-neon"
            style={{ padding: "8px 20px", fontSize: 12 }}>
            🔑 Update PIN
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage({ onClose }) {
  const [theme,     setThemeState] = useState(() => localStorage.getItem("mt_theme")     || "dark-blue");
  const [lightMode, setLightMode]  = useState(() => localStorage.getItem("mt_light") === "1");
  const [language,  setLanguage]   = useState(() => localStorage.getItem("mt_lang")      || "en");
  const [exportFmt, setExportFmt]  = useState(() => localStorage.getItem("mt_export_fmt")|| "PDF");
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mt_notifs") || "{}"); } catch { return {}; }
  });
  const [saved, setSaved] = useState(false);

  const toggleNotif = (key) => setNotifs(n => ({ ...n, [key]: !n[key] }));

  const applyTheme = (tk) => {
    const t = THEMES.find(x => x.key === tk);
    if (!t) return;
    document.documentElement.style.setProperty("--bg-base", t.bg);
    document.documentElement.style.setProperty("--neon-blue", t.accent);
  };

  useEffect(() => { applyTheme(theme); }, [theme]);

  // Apply light mode to body
  useEffect(() => {
    if (lightMode) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [lightMode]);

  const handleSave = () => {
    localStorage.setItem("mt_theme",      theme);
    localStorage.setItem("mt_light",      lightMode ? "1" : "0");
    localStorage.setItem("mt_lang",       language);
    localStorage.setItem("mt_export_fmt", exportFmt);
    localStorage.setItem("mt_notifs",     JSON.stringify(notifs));
    applyTheme(theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    localStorage.removeItem("mt_theme");
    localStorage.removeItem("mt_lang");
    localStorage.removeItem("mt_export_fmt");
    localStorage.removeItem("mt_notifs");
    localStorage.removeItem("mt_last");
    localStorage.removeItem("mt_pid");
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20,
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
            ⚙️ Settings
          </h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
            Customise MetaTwin-X to your preferences
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-neon" style={{ padding: "8px 16px", fontSize: 12 }}>
            ← Back
          </button>
        )}
      </div>

      {/* ── Theme ── */}
      <Section icon="🎨" title="Appearance" accent="#a78bfa">
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
          Colour theme (applied immediately)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
          {THEMES.map(t => (
            <button key={t.key} onClick={() => setThemeState(t.key)} style={{
              padding: "12px 8px", borderRadius: 10, cursor: "pointer",
              border: theme === t.key ? `2px solid ${t.accent}` : "2px solid rgba(56,100,160,0.2)",
              background: theme === t.key ? `${t.accent}14` : "rgba(14,24,40,0.6)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              transition: "all 0.15s",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: t.bg,
                border: `2px solid ${t.accent}`, boxShadow: `0 0 8px ${t.accent}44`,
              }} />
              <span style={{ fontSize: 10, color: theme === t.key ? t.accent : "#64748b", fontWeight: 600 }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
        <Toggle value={lightMode} onChange={setLightMode}
          label="Light Mode"
          desc="Switch to a white clinical interface (affects whole app)" />
      </Section>

      {/* ── Language ── */}
      <Section icon="🌐" title="Language" accent="#38bdf8">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LANGUAGES.map(l => (
            <button key={l.key} onClick={() => setLanguage(l.key)} style={{
              padding: "8px 16px", borderRadius: 8, cursor: "pointer",
              border: language === l.key ? "1px solid #38bdf8" : "1px solid rgba(56,100,160,0.25)",
              background: language === l.key ? "rgba(56,189,248,0.1)" : "rgba(14,24,40,0.6)",
              color: language === l.key ? "#38bdf8" : "#64748b",
              fontSize: 12, fontWeight: language === l.key ? 700 : 500,
              transition: "all 0.15s",
            }}>{l.label}</button>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "#475569" }}>
          Note: UI text remains in English. Language setting is saved for future localisation.
        </div>
      </Section>

      {/* ── Notifications ── */}
      <Section icon="🔔" title="Notifications & Alerts" accent="#ef4444">
        <Toggle value={!!notifs.emergency}  onChange={() => toggleNotif("emergency")}
          label="Emergency Alerts"
          desc="Banner when Heart Risk > 80% or SpO₂ < 90%" />
        <Toggle value={!!notifs.risk_change} onChange={() => toggleNotif("risk_change")}
          label="Risk Change Notifications"
          desc="Alert when any organ risk changes by > 10%" />
        <Toggle value={!!notifs.twin_sync}  onChange={() => toggleNotif("twin_sync")}
          label="Twin Sync Confirmations"
          desc="Toast when digital twin updates successfully" />
        <Toggle value={!!notifs.report_ready} onChange={() => toggleNotif("report_ready")}
          label="Report Ready"
          desc="Notification when AI report generation completes" />
      </Section>

      {/* ── Export ── */}
      <Section icon="📤" title="Export Preferences" accent="#10b981">
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
          Default format for data export
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {EXPORT_FORMATS.map(f => (
            <button key={f} onClick={() => setExportFmt(f)} style={{
              padding: "8px 20px", borderRadius: 8, cursor: "pointer",
              border: exportFmt === f ? "1px solid #10b981" : "1px solid rgba(56,100,160,0.25)",
              background: exportFmt === f ? "rgba(16,185,129,0.1)" : "rgba(14,24,40,0.6)",
              color: exportFmt === f ? "#10b981" : "#64748b",
              fontSize: 12, fontWeight: exportFmt === f ? 700 : 500,
              transition: "all 0.15s",
            }}>{f}</button>
          ))}
        </div>
      </Section>

      {/* ── Security ── */}
      <Section icon="🔒" title="Security & Access" accent="#ef4444">
        <PinChangeForm />
        <div style={{ paddingTop: 12, borderTop: "1px solid rgba(56,100,160,0.15)",
                      fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
          Session expires after <strong style={{ color: "#94a3b8" }}>8 hours</strong> of inactivity.
          Use the 🔒 button in the top bar to lock immediately.
          All data is stored locally — nothing is sent to external servers.
        </div>
      </Section>

      {/* ── About ── */}
      <Section icon="ℹ️" title="About MetaTwin-X" accent="#f59e0b">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["Version",     "2.0.0"],
            ["Backend",     "FastAPI + XGBoost"],
            ["Frontend",    "React + Three.js"],
            ["AI Models",   "XGBoost (AUC 0.986–0.991)"],
            ["XAI",         "SHAP + Causal Inference"],
            ["RL Agent",    "Q-Learning Interventions"],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 12px",
              background: "rgba(14,24,40,0.6)", borderRadius: 7,
              border: "1px solid rgba(56,100,160,0.12)",
            }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>{k}</span>
              <span style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{v}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8, paddingBottom: 24 }}>
        <button onClick={handleReset} style={{
          padding: "10px 20px", borderRadius: 8, cursor: "pointer",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#ef4444", fontSize: 12, fontWeight: 700,
        }}>
          🗑 Reset All Data
        </button>
        <button onClick={handleSave} className="btn-neon-solid"
          style={{ padding: "10px 28px", fontSize: 13 }}>
          {saved ? "✓ Saved!" : "💾 Save Settings"}
        </button>
      </div>
    </div>
  );
}
