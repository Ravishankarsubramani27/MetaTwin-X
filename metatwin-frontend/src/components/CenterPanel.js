/**
 * CenterPanel.js — R3F 3D Anatomy + SVG fallback + Compare Mode + Organ Drawer
 */
import React, { useState, Suspense } from "react";
import HumanBody3D from "./HumanBody3D";
import Human3D from "./three/Human3D";
import RiskCard from "./RiskCard.jsx";
import HealthGauge from "./HealthGauge.jsx";
import OrganDrawer from "./OrganDrawer";
import { normalizeRisks } from "../services/api";

function computeHealthScore(risks) {
  var h = (risks.heart  || 0) / 100;
  var k = (risks.kidney || 0) / 100;
  var l = (risks.liver  || 0) / 100;
  return Math.round((1 - (0.4*h + 0.3*k + 0.3*l + 0.1*h*k)) * 100);
}

function improvedRisks(risks) {
  return {
    heart:  Math.max(5, Math.round(risks.heart  * 0.75 * 10) / 10),
    kidney: Math.max(5, Math.round(risks.kidney * 0.80 * 10) / 10),
    liver:  Math.max(5, Math.round(risks.liver  * 0.78 * 10) / 10),
  };
}

function worstRisks(risks) {
  return {
    heart:  Math.min(96, Math.round(risks.heart  * 1.45 * 10) / 10),
    kidney: Math.min(96, Math.round(risks.kidney * 1.38 * 10) / 10),
    liver:  Math.min(96, Math.round(risks.liver  * 1.42 * 10) / 10),
  };
}

function riskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}

var LIVE_METRICS = [
  { key:"heart",  label:"Heart Risk"  },
  { key:"kidney", label:"Kidney Risk" },
  { key:"liver",  label:"Liver Risk"  },
];

function RiskDot({ pct }) {
  var col = riskColor(pct);
  var dur = pct >= 60 ? "0.7s" : pct >= 30 ? "1.2s" : "2s";
  return (
    <span style={{
      display:"inline-block", width:8, height:8, borderRadius:"50%",
      background:col, boxShadow:`0 0 6px ${col}`, flexShrink:0,
      animation:`pulse-heart ${dur} ease-in-out infinite`,
    }}/>
  );
}

/* Loading spinner shown while R3F Canvas initialises */
function CanvasLoader() {
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, background:"#020810" }}>
      <div style={{ width:28, height:28, border:"2px solid rgba(56,189,248,0.2)", borderTop:"2px solid #38bdf8", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      <span style={{ fontSize:11, color:"#475569" }}>Loading 3D model…</span>
    </div>
  );
}

/* A single body viewer — 3D or SVG */
function BodyViewer({ risks, use3D, height = "auto" }) {
  return (
    <div style={{ borderRadius:12, overflow:"hidden", background:"#020810", border:"1px solid rgba(56,189,248,0.15)", height: use3D ? 340 : height }}>
      {use3D ? (
        <Suspense fallback={<CanvasLoader />}>
          <Human3D risks={risks} />
        </Suspense>
      ) : (
        <HumanBody3D risks={risks} />
      )}
    </div>
  );
}

export default function CenterPanel({ risk, formData }) {
  var risks    = normalizeRisks(risk);
  var hs       = computeHealthScore(risks);
  var improved = improvedRisks(risks);
  var worst    = worstRisks(risks);
  var hsImp    = computeHealthScore(improved);
  var hsWorst  = computeHealthScore(worst);

  var [compareMode,   setCompareMode]   = useState(false);
  var [use3D,         setUse3D]         = useState(true);
  var [drawerOrgan,   setDrawerOrgan]   = useState(null);

  return (
    <div className="glass-card" style={{ padding:"18px", overflow:"hidden" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)" }}>
            Digital Twin — {use3D ? "3D Anatomy" : "SVG View"}
          </div>
          <div style={{ fontSize:11, color:"#7c8fa8", marginTop:2 }}>
            {use3D ? "Click organs for details · Drag to orbit · Scroll to zoom" : "Click organs for clinical details"}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* SYNCED badge */}
          <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:20, padding:"4px 10px" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", display:"inline-block", boxShadow:"0 0 5px #10b981", animation:"pulse-heart 2s infinite" }}/>
            <span style={{ fontSize:10, color:"#10b981", fontWeight:700 }}>SYNCED</span>
          </div>

          {/* 3D / SVG toggle */}
          <button onClick={() => setUse3D(v => !v)} style={{
            background: use3D ? "rgba(167,139,250,0.15)" : "rgba(56,189,248,0.1)",
            border:`1px solid ${use3D ? "rgba(167,139,250,0.45)" : "rgba(56,189,248,0.3)"}`,
            color: use3D ? "#a78bfa" : "#38bdf8",
            borderRadius:8, padding:"5px 12px", fontSize:11,
            fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}>
            {use3D ? "🖼 SVG View" : "🧬 3D View"}
          </button>

          {/* Compare toggle */}
          <button onClick={() => setCompareMode(m => !m)} style={{
            background: compareMode ? "rgba(245,158,11,0.15)" : "rgba(56,189,248,0.1)",
            border:`1px solid ${compareMode ? "rgba(245,158,11,0.45)" : "rgba(56,189,248,0.3)"}`,
            color: compareMode ? "#f59e0b" : "#38bdf8",
            borderRadius:8, padding:"5px 12px", fontSize:11,
            fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}>
            {compareMode ? "✕ Exit Compare" : "⊞ Compare Mode"}
          </button>
        </div>
      </div>

      {/* ── Normal mode — 3-column ── */}
      {!compareMode && (
        <div style={{ display:"grid", gridTemplateColumns:"200px 1fr 200px", gap:14, alignItems:"start" }}>

          {/* Left — organ risk cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:2 }}>Organ Risk</div>
            {["heart","kidney","liver"].map(organ => (
              <div key={organ} onClick={() => setDrawerOrgan(organ)}
                style={{ cursor: "pointer" }}>
                <RiskCard organ={organ} value={risks[organ]}/>
              </div>
            ))}
            <div style={{ fontSize:9, color:"#475569", textAlign:"center", marginTop:2 }}>
              Click organ for details
            </div>
          </div>

          {/* Center — body viewer */}
          <BodyViewer risks={risks} use3D={use3D} />

          {/* Right — vitals */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:2 }}>Live Vitals</div>
            <HealthGauge score={hs} label="H×0.4 + K×0.3 + L×0.3"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:2 }}>
              {LIVE_METRICS.map(m => {
                var col = riskColor(risks[m.key]);
                return (
                  <div key={m.key} style={{ background:col+"0d", border:"1px solid "+col+"28", borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, marginBottom:3 }}>
                      <RiskDot pct={risks[m.key]}/>
                      <div style={{ fontSize:10, color:"#475569" }}>{m.label}</div>
                    </div>
                    <div style={{ fontSize:16, fontWeight:900, color:col, fontFamily:"JetBrains Mono,monospace", textShadow:"0 0 6px "+col+"88" }}>
                      {risks[m.key].toFixed(1)}
                    </div>
                  </div>
                );
              })}
              <div style={{ gridColumn:"1/-1", background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:8, padding:"7px 8px", textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#64748b", marginBottom:2 }}>Health Index</div>
                <div style={{ fontSize:20, fontWeight:900, fontFamily:"JetBrains Mono,monospace", color: hs>=70?"#10b981":hs>=45?"#f59e0b":"#ef4444" }}>
                  {hs}<span style={{ fontSize:11, fontWeight:400, color:"#475569" }}>/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Compare mode — THREE bodies side by side ── */}
      {compareMode && (
        <div style={{ animation:"fadeIn 0.3s ease" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>

            {/* ── CURRENT ── */}
            <div>
              <div style={{ textAlign:"center", marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#94a3b8",
                               background:"rgba(56,189,248,0.08)",
                               border:"1px solid rgba(56,189,248,0.2)",
                               borderRadius:20, padding:"3px 10px" }}>
                  📍 Current
                </span>
              </div>
              <BodyViewer risks={risks} use3D={use3D}/>
              <div style={{ display:"flex", justifyContent:"space-around", marginTop:6 }}>
                {["heart","kidney","liver"].map(o => (
                  <div key={o} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:8, color:"#64748b", textTransform:"capitalize" }}>{o}</div>
                    <div style={{ fontSize:12, fontWeight:800, color:riskColor(risks[o]),
                                  fontFamily:"monospace" }}>{risks[o].toFixed(0)}%</div>
                  </div>
                ))}
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:8, color:"#64748b" }}>Score</div>
                  <div style={{ fontSize:12, fontWeight:800, color:riskColor(100-hs),
                                fontFamily:"monospace" }}>{hs}</div>
                </div>
              </div>
            </div>

            {/* ── BEST CASE ── */}
            <div>
              <div style={{ textAlign:"center", marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#10b981",
                               background:"rgba(16,185,129,0.08)",
                               border:"1px solid rgba(16,185,129,0.25)",
                               borderRadius:20, padding:"3px 10px" }}>
                  🏃 Best Case (+6M)
                </span>
              </div>
              <BodyViewer risks={improved} use3D={use3D}/>
              <div style={{ display:"flex", justifyContent:"space-around", marginTop:6 }}>
                {["heart","kidney","liver"].map(o => (
                  <div key={o} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:8, color:"#64748b", textTransform:"capitalize" }}>{o}</div>
                    <div style={{ fontSize:12, fontWeight:800, color:riskColor(improved[o]),
                                  fontFamily:"monospace" }}>
                      {improved[o].toFixed(0)}%
                      <span style={{ fontSize:8, color:"#10b981", marginLeft:1 }}>↓</span>
                    </div>
                  </div>
                ))}
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:8, color:"#64748b" }}>Score</div>
                  <div style={{ fontSize:12, fontWeight:800, color:"#10b981",
                                fontFamily:"monospace" }}>{hsImp}↑</div>
                </div>
              </div>
            </div>

            {/* ── WORST CASE ── */}
            <div>
              <div style={{ textAlign:"center", marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#ef4444",
                               background:"rgba(239,68,68,0.08)",
                               border:"1px solid rgba(239,68,68,0.25)",
                               borderRadius:20, padding:"3px 10px" }}>
                  ⚠ Worst Case (+6M)
                </span>
              </div>
              <BodyViewer risks={worst} use3D={use3D}/>
              <div style={{ display:"flex", justifyContent:"space-around", marginTop:6 }}>
                {["heart","kidney","liver"].map(o => (
                  <div key={o} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:8, color:"#64748b", textTransform:"capitalize" }}>{o}</div>
                    <div style={{ fontSize:12, fontWeight:800, color:riskColor(worst[o]),
                                  fontFamily:"monospace" }}>
                      {worst[o].toFixed(0)}%
                      <span style={{ fontSize:8, color:"#ef4444", marginLeft:1 }}>↑</span>
                    </div>
                  </div>
                ))}
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:8, color:"#64748b" }}>Score</div>
                  <div style={{ fontSize:12, fontWeight:800, color:"#ef4444",
                                fontFamily:"monospace" }}>{hsWorst}↓</div>
                </div>
              </div>
            </div>
          </div>

          {/* Δ summary bar */}
          <div style={{ marginTop:12, display:"grid",
                        gridTemplateColumns:"repeat(3,1fr) repeat(3,1fr)", gap:8 }}>
            {["heart","kidney","liver"].map(o => {
              var bestDelta  = improved[o] - risks[o];
              var worstDelta = worst[o]    - risks[o];
              return (
                <div key={o} style={{ background:"rgba(14,24,40,0.7)",
                                      border:"1px solid rgba(56,100,160,0.15)",
                                      borderRadius:8, padding:"8px", textAlign:"center" }}>
                  <div style={{ fontSize:8, color:"#64748b",
                                textTransform:"capitalize", marginBottom:4 }}>{o}</div>
                  <div style={{ display:"flex", justifyContent:"space-around" }}>
                    <span style={{ fontSize:11, fontWeight:800, color:"#10b981",
                                   fontFamily:"monospace" }}>
                      {bestDelta.toFixed(1)}%
                    </span>
                    <span style={{ fontSize:8, color:"#475569" }}>vs</span>
                    <span style={{ fontSize:11, fontWeight:800, color:"#ef4444",
                                   fontFamily:"monospace" }}>
                      +{Math.abs(worstDelta).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
            <div style={{ gridColumn:"4/-1", background:"rgba(14,24,40,0.7)",
                          border:"1px solid rgba(56,100,160,0.15)",
                          borderRadius:8, padding:"8px", textAlign:"center" }}>
              <div style={{ fontSize:8, color:"#64748b", marginBottom:4 }}>Health Score Range</div>
              <div style={{ fontSize:13, fontWeight:900, fontFamily:"monospace" }}>
                <span style={{ color:"#10b981" }}>{hsImp}</span>
                <span style={{ color:"#475569", fontSize:10 }}> — {hs} — </span>
                <span style={{ color:"#ef4444" }}>{hsWorst}</span>
              </div>
              <div style={{ fontSize:8, color:"#475569", marginTop:2 }}>
                Best · Current · Worst
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:14, flexWrap:"wrap" }}>
        {[["#10b981","Low","0–30%"],["#f59e0b","Moderate","30–60%"],["#ef4444","High","≥60%"]].map(item => (
          <div key={item[1]} style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:"#7c8fa8" }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:item[0], display:"inline-block", boxShadow:"0 0 5px "+item[0] }}/>
            <span style={{ fontWeight:600 }}>{item[1]}</span>
            <span style={{ opacity:0.6 }}>{item[2]}</span>
          </div>
        ))}
      </div>

      {/* Organ Analytics Drawer */}
      {drawerOrgan && (
        <OrganDrawer
          organ={drawerOrgan}
          risk={risk}
          formData={formData}
          onClose={() => setDrawerOrgan(null)}
        />
      )}
    </div>
  );
}
