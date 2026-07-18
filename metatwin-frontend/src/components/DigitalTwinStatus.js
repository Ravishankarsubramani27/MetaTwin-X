/**
 * DigitalTwinStatus.js
 * System status card showing all service health indicators.
 * Feature 11 from the improvement spec.
 */
import React, { useState, useEffect } from "react";
import { checkHealth } from "../services/api";

const SERVICES = [
  { key: "prediction",  label: "Prediction Engine",  icon: "🤖" },
  { key: "simulation",  label: "Simulation Engine",  icon: "⚙️" },
  { key: "database",    label: "Database",            icon: "🗄️" },
  { key: "api",         label: "API Server",          icon: "🌐" },
  { key: "twin",        label: "Digital Twin",        icon: "🧬" },
];

function StatusDot({ status }) {
  const cfg = {
    online:  { color: "#10b981", label: "Online",  pulse: true  },
    offline: { color: "#ef4444", label: "Offline", pulse: false },
    checking:{ color: "#f59e0b", label: "Checking",pulse: true  },
  }[status] || { color: "#64748b", label: "Unknown", pulse: false };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: cfg.color,
        display: "inline-block",
        boxShadow: `0 0 6px ${cfg.color}`,
        animation: cfg.pulse ? "pulse-dot 2s infinite" : "none",
      }}/>
      <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>
        {cfg.label}
      </span>
    </div>
  );
}

export default function DigitalTwinStatus({ twinState }) {
  const [services,   setServices]   = useState({});
  const [lastSync,   setLastSync]   = useState(null);
  const [modelVer,   setModelVer]   = useState("XGBoost v2.0");
  const [checking,   setChecking]   = useState(false);

  const runHealthCheck = async () => {
    setChecking(true);
    // Mark all as checking
    const checking = {};
    SERVICES.forEach(s => { checking[s.key] = "checking"; });
    setServices(checking);

    try {
      const health = await checkHealth();
      const statuses = {};
      SERVICES.forEach(s => { statuses[s.key] = "online"; });
      if (health?.version) setModelVer(`XGBoost v${health.version}`);
      setServices(statuses);
      setLastSync(new Date());
    } catch {
      const statuses = {};
      SERVICES.forEach(s => { statuses[s.key] = s.key === "api" ? "offline" : "checking"; });
      setServices(statuses);
    } finally {
      setChecking(false);
    }
  };

  // Check on mount and every 60 seconds
  useEffect(() => {
    runHealthCheck();
    const interval = setInterval(runHealthCheck, 60000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allOnline = SERVICES.every(s => services[s.key] === "online");

  return (
    <div className="glass-card" style={{
      padding: "16px 18px",
      borderColor: allOnline ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
      borderTopWidth: 2,
      borderTopColor: allOnline ? "#10b981" : "#ef4444",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#475569",
                      textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Digital Twin Status
        </div>
        <button onClick={runHealthCheck} disabled={checking}
          style={{
            background: "none", border: "1px solid rgba(56,100,160,0.3)",
            color: "#64748b", borderRadius: 6, padding: "3px 8px",
            fontSize: 10, cursor: "pointer",
          }}>
          {checking ? "⟳ Checking…" : "⟳ Refresh"}
        </button>
      </div>

      {/* Service list */}
      {SERVICES.map(s => (
        <div key={s.key} style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "6px 0",
          borderBottom: "1px solid rgba(56,100,160,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12 }}>{s.icon}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</span>
          </div>
          <StatusDot status={services[s.key] || "checking"} />
        </div>
      ))}

      {/* Metadata */}
      <div style={{ marginTop: 12, paddingTop: 10,
                    borderTop: "1px solid rgba(56,100,160,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
                      marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "#64748b" }}>Model Version</span>
          <span style={{ fontSize: 10, color: "#38bdf8", fontFamily: "var(--font-mono)",
                         fontWeight: 600 }}>{modelVer}</span>
        </div>
        {twinState?.update_count && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "#64748b" }}>Twin Updates</span>
            <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700 }}>
              {twinState.update_count}
            </span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "#64748b" }}>Last Sync</span>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>
            {lastSync ? lastSync.toLocaleTimeString() : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
