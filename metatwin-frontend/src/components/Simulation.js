import React, { useState, useRef, useEffect, useCallback } from "react";
import { simulateRisk } from "../services/api";
import { TrajectoryChart } from "./Charts";

// WebSocket URL uses /stream/{patientId} — patientId from localStorage
function getWsUrl() {
  const pid = localStorage.getItem("metatwin_patient_id") || "default";
  return `ws://127.0.0.1:8000/stream/${pid}`;
}
const MAX_RECONNECT_DELAY = 30000; // 30 s cap

function useWebSocketStream(enabled) {
  const [liveData,   setLiveData]   = useState(null);
  const [wsStatus,   setWsStatus]   = useState("idle"); // idle|connecting|connected|error
  const wsRef        = useRef(null);
  const retryCount   = useRef(0);
  const retryTimer   = useRef(null);
  const shouldRetry  = useRef(enabled);

  const connect = useCallback(() => {
    if (!shouldRetry.current) return;
    setWsStatus("connecting");
    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
        retryCount.current = 0;
      };

      ws.onmessage = (e) => {
        try { setLiveData(JSON.parse(e.data)); } catch { /* ignore malformed */ }
      };

      ws.onerror = () => setWsStatus("error");

      ws.onclose = () => {
        setWsStatus("error");
        if (!shouldRetry.current) return;
        // Exponential back-off: 1s, 2s, 4s, … up to MAX_RECONNECT_DELAY
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), MAX_RECONNECT_DELAY);
        retryCount.current += 1;
        retryTimer.current = setTimeout(connect, delay);
      };
    } catch {
      setWsStatus("error");
    }
  }, []);

  useEffect(() => {
    shouldRetry.current = enabled;
    if (enabled) {
      connect();
    } else {
      clearTimeout(retryTimer.current);
      wsRef.current?.close();
      setWsStatus("idle");
      setLiveData(null);
    }
    return () => {
      shouldRetry.current = false;
      clearTimeout(retryTimer.current);
      wsRef.current?.close();
    };
  }, [enabled, connect]);

  return { liveData, wsStatus };
}

export default function Simulation({ risk }) {
  const [simResult, setSimResult] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [bmi,       setBmi]       = useState(0);
  const [sbp,       setSbp]       = useState(125);
  const [med,       setMed]       = useState("High (>80%)");
  const [wsEnabled, setWsEnabled] = useState(false);
  const { liveData, wsStatus }    = useWebSocketStream(wsEnabled);

  const handleSimulate = async () => {
    if (!risk) return;
    setLoading(true);
    try {
      const bmi_benefit = Math.abs(bmi) * 0.008;
      const sbp_benefit = Math.max(0, (125 - sbp)) * 0.002;
      const med_benefit = med.includes("High") ? 0.05 : med.includes("Moderate") ? 0.02 : 0.0;
      const total       = bmi_benefit + sbp_benefit + med_benefit;

      const payload = {
        heart:  Math.max(risk.heart  - total, 0.05),
        kidney: Math.max(risk.kidney - total * 0.8, 0.05),
        liver:  Math.max(risk.liver  - total * 0.6, 0.05),
      };
      const res = await simulateRisk(payload);
      setSimResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: "22px 24px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 20,
    }}>
      <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 800,
                    marginBottom: 4, fontFamily: "Inter,sans-serif" }}>
        📈 12-Month Simulation
      </div>
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 20 }}>
        Adjust therapeutic parameters to simulate future risk trajectories
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* BMI slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              BMI Reduction (kg/m²)
            </label>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{bmi}</span>
          </div>
          <input type="range" min="-10" max="0" step="0.5" value={bmi}
            onChange={e => setBmi(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#2563eb" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 3 }}>
            <span>-10</span><span>0</span>
          </div>
        </div>

        {/* SBP slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Systolic BP Target (mmHg)
            </label>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{sbp}</span>
          </div>
          <input type="range" min="100" max="160" step="5" value={sbp}
            onChange={e => setSbp(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#2563eb" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 3 }}>
            <span>100</span><span>160</span>
          </div>
        </div>

        {/* Medication dropdown */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151",
                          display: "block", marginBottom: 6 }}>
            Medication Adherence
          </label>
          <select value={med} onChange={e => setMed(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0",
                     borderRadius: 8, fontSize: 12, color: "#374151",
                     background: "#f8fafc", cursor: "pointer" }}>
            <option>Low (&lt;50%)</option>
            <option>Moderate (50-80%)</option>
            <option>High (&gt;80%)</option>
          </select>
        </div>
      </div>

      {/* Projected impact preview */}
      {risk && (
        <div style={{
          background: "#f8fafc", border: "1px solid #e2e8f0",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
          display: "flex", gap: 24,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          color: "#94a3b8", marginBottom: 4 }}>Heart</div>
            <div style={{ color: "#059669", fontWeight: 700, fontSize: 14 }}>
              ↓ {(Math.abs(bmi) * 0.8 + 14).toFixed(0)}% projected
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          color: "#94a3b8", marginBottom: 4 }}>Kidney</div>
            <div style={{ color: "#059669", fontWeight: 700, fontSize: 14 }}>
              ↓ {(Math.abs(bmi) * 0.6 + 10).toFixed(0)}% projected
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          color: "#94a3b8", marginBottom: 4 }}>Liver</div>
            <div style={{ color: "#059669", fontWeight: 700, fontSize: 14 }}>
              ↓ {(Math.abs(bmi) * 0.5 + 8).toFixed(0)}% projected
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <button onClick={handleSimulate} disabled={loading || !risk}
          style={{
            background: loading ? "#94a3b8" : "#2563eb",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "11px 28px", fontWeight: 700, fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            transition: "background 0.15s",
          }}>
          {loading ? "Simulating…" : "▶  Run Simulation"}
        </button>

        {/* WebSocket live stream toggle */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setWsEnabled(v => !v)} style={{
            background: wsEnabled ? "#f0fdf4" : "#f8fafc",
            border: `1px solid ${wsEnabled ? "#bbf7d0" : "#e2e8f0"}`,
            borderRadius: 8, padding: "8px 14px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            color: wsEnabled ? "#15803d" : "#64748b",
          }}>
            {wsEnabled ? "⏹ Stop Live Stream" : "📡 Start Live Stream"}
          </button>
          {wsEnabled && (
            <span style={{ fontSize: 11, fontWeight: 600,
              color: wsStatus === "connected" ? "#15803d"
                   : wsStatus === "connecting" ? "#d97706" : "#dc2626",
            }}>
              {wsStatus === "connected"  ? "● Connected"
               : wsStatus === "connecting" ? "◌ Connecting…"
               : "● Reconnecting…"}
            </span>
          )}
        </div>
      </div>

      {/* Live wearable data panel */}
      {wsEnabled && liveData && (
        <div style={{
          marginTop: 16, background: "#f0fdf4",
          border: "1px solid #bbf7d0", borderRadius: 10,
          padding: "14px 18px",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", marginBottom: 10 }}>
            📡 Live Wearable Data
          </div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {Object.entries(liveData?.payload || liveData || {}).map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize:10, color:"#64748b", fontWeight:700, textTransform:"uppercase" }}>
                  {k.replace(/_/g," ")}
                </div>
                <div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>
                  {typeof v === "number" ? v.toFixed(1) : String(v)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {simResult && (
        <div style={{ marginTop: 24 }}>
          <TrajectoryChart simResult={simResult} />
          {/* Month-12 summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 4 }}>
            {[
              ["Heart",  simResult.heart_trajectory,  risk?.heart,  "#ef4444"],
              ["Kidney", simResult.kidney_trajectory, risk?.kidney, "#3b82f6"],
              ["Liver",  simResult.liver_trajectory,  risk?.liver,  "#10b981"],
            ].map(([name, traj, cur, accent]) => {
              const m12   = traj ? traj[traj.length - 1] : 0;
              const delta = cur  ? (m12 - cur) * 100 : 0;
              return (
                <div key={name} style={{
                  background: "#fff", border: `1px solid #e2e8f0`,
                  borderTop: `3px solid ${accent}`,
                  borderRadius: 10, padding: "14px 16px", textAlign: "center",
                }}>
                  <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700,
                                textTransform: "uppercase", marginBottom: 6 }}>
                    {name} — Month 12
                  </div>
                  <div style={{ color: accent, fontSize: 22, fontWeight: 900 }}>
                    {(m12 * 100).toFixed(1)}%
                  </div>
                  <div style={{ color: delta > 0 ? "#dc2626" : "#059669", fontSize: 12,
                                fontWeight: 600, marginTop: 4 }}>
                    {delta > 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}% from current
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
