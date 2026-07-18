/**
 * DiseaseProgression.js
 * Feature 1: Animated disease progression (healthy→yellow→orange→red)
 * Feature 2: Full-body heatmap (head=brain, chest=cardiac, abdomen=liver, lower=kidney)
 * Feature 15: Digital Twin Playback (▶ Play month-by-month)
 * Feature 20: "Future Me" — Current / Best-case / Worst-case
 */
import React, { useState, useEffect, useRef } from "react";

function riskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}
function riskAlpha(pct) { return 0.25 + (pct / 100) * 0.55; }

/* interpolate color string for smooth animation */
function interpColor(pct) {
  if (pct <= 20) return `rgba(16,185,129,${riskAlpha(pct)})`;
  if (pct <= 40) return `rgba(245,158,11,${riskAlpha(pct)})`;
  if (pct <= 60) return `rgba(249,115,22,${riskAlpha(pct)})`;
  if (pct <= 80) return `rgba(239,68,68,${riskAlpha(pct)})`;
  return `rgba(220,38,38,${riskAlpha(pct)})`;
}

/* ── Body Heatmap SVG ─────────────────────────────────────────────── */
function BodyHeatmap({ risks, label }) {
  const h = risks.heart  || 0;
  const k = risks.kidney || 0;
  const l = risks.liver  || 0;
  const brain = Math.round((h * 0.3 + k * 0.2) * 0.8); // derived
  const metabolic = Math.round((l * 0.5 + k * 0.3 + h * 0.2));

  return (
    <div style={{ textAlign: "center" }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 6,
          background: "rgba(14,24,40,0.6)", borderRadius: 20, padding: "3px 12px",
          display: "inline-block" }}>{label}</div>
      )}
      <svg viewBox="0 0 200 380" style={{ width: "100%", maxWidth: 160, height: "auto" }}>
        <defs>
          <linearGradient id="hmbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#010810" /><stop offset="100%" stopColor="#020c1b" />
          </linearGradient>
        </defs>
        <rect width={200} height={380} fill="url(#hmbg)" />

        {/* ── Head / Brain zone ── */}
        <ellipse cx={100} cy={38} rx={28} ry={34} fill={interpColor(brain)} stroke={riskColor(brain)} strokeWidth={1.2} />
        <text x={100} y={34} textAnchor="middle" fill={riskColor(brain)} fontSize={7} fontWeight="700">Brain</text>
        <text x={100} y={45} textAnchor="middle" fill={riskColor(brain)} fontSize={8} fontWeight="900">{brain}%</text>

        {/* Neck */}
        <rect x={86} y={70} width={28} height={14} rx={4} fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.3)" strokeWidth={0.8} />

        {/* ── Chest / Cardiac zone ── */}
        <path d="M 60,84 Q 45,90 42,108 L 40,190 Q 40,198 50,198 L 150,198 Q 160,198 160,190 L 158,108 Q 155,90 140,84 Q 120,78 100,78 Q 80,78 60,84 Z"
          fill={interpColor(h)} stroke={riskColor(h)} strokeWidth={1.2} />
        <text x={100} y={126} textAnchor="middle" fill={riskColor(h)} fontSize={7} fontWeight="700">Cardiac</text>
        <text x={100} y={138} textAnchor="middle" fill={riskColor(h)} fontSize={10} fontWeight="900">{h.toFixed(0)}%</text>

        {/* Heart icon */}
        <path d="M 100,155 C 100,155 86,147 86,138 C 86,132 91,129 95,131 C 97,132 99,134 100,136 C 101,134 103,132 105,131 C 109,129 114,132 114,138 C 114,147 100,155 100,155 Z"
          fill={riskColor(h)} opacity={0.9}
          style={{ animation: h >= 30 ? "pulse-heart 1s infinite" : "pulse-heart 2s infinite" }} />

        {/* ── Abdomen / Liver+Digestive zone ── */}
        <path d="M 42,196 L 42,246 Q 42,256 52,256 L 148,256 Q 158,256 158,246 L 158,196 Z"
          fill={interpColor(l)} stroke={riskColor(l)} strokeWidth={1} />
        <text x={100} y={218} textAnchor="middle" fill={riskColor(l)} fontSize={7} fontWeight="700">Liver / Digest</text>
        <text x={100} y={230} textAnchor="middle" fill={riskColor(l)} fontSize={10} fontWeight="900">{l.toFixed(0)}%</text>

        {/* ── Lower abdomen / Kidney zone ── */}
        <path d="M 44,254 L 44,296 Q 44,306 54,306 L 146,306 Q 156,306 156,296 L 156,254 Z"
          fill={interpColor(k)} stroke={riskColor(k)} strokeWidth={1} />
        {/* Left kidney */}
        <ellipse cx={72} cy={278} rx={12} ry={16} fill={riskColor(k)} opacity={0.7} />
        {/* Right kidney */}
        <ellipse cx={128} cy={278} rx={12} ry={16} fill={riskColor(k)} opacity={0.7} />
        <text x={100} y={302} textAnchor="middle" fill={riskColor(k)} fontSize={7} fontWeight="700">Renal</text>

        {/* ── Legs ── */}
        <path d="M 60,304 Q 52,316 50,340 L 48,360 Q 47,368 54,368 Q 62,368 64,362 L 66,340 Q 68,318 72,306 Z"
          fill="rgba(56,189,248,0.1)" stroke="rgba(56,189,248,0.25)" strokeWidth={0.8} />
        <path d="M 140,304 Q 148,316 150,340 L 152,360 Q 153,368 146,368 Q 138,368 136,362 L 134,340 Q 132,318 128,306 Z"
          fill="rgba(56,189,248,0.1)" stroke="rgba(56,189,248,0.25)" strokeWidth={0.8} />

        {/* Arms */}
        <path d="M 42,90 Q 28,100 22,120 L 18,160 Q 17,170 24,170 Q 32,170 34,162 L 38,124 Q 40,106 44,96 Z"
          fill="rgba(56,189,248,0.1)" stroke="rgba(56,189,248,0.25)" strokeWidth={0.8} />
        <path d="M 158,90 Q 172,100 178,120 L 182,160 Q 183,170 176,170 Q 168,170 166,162 L 162,124 Q 160,106 156,96 Z"
          fill="rgba(56,189,248,0.1)" stroke="rgba(56,189,248,0.25)" strokeWidth={0.8} />

        {/* Metabolic index */}
        <text x={100} y={376} textAnchor="middle" fill="#475569" fontSize={7}>
          Metabolic: {metabolic}%
        </text>
      </svg>
    </div>
  );
}

/* ── Playback component ───────────────────────────────────────────── */
function PlaybackControl({ months, currentIdx, playing, onPlay, onPause, onNext, onPrev, onSeek }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <button onClick={onPrev} title="Previous month"
          style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ◀
        </button>
        <button onClick={playing ? onPause : onPlay}
          style={{ background: playing ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)", border: `1px solid ${playing ? "rgba(245,158,11,0.4)" : "rgba(16,185,129,0.4)"}`, color: playing ? "#f59e0b" : "#10b981", borderRadius: 8, padding: "6px 18px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button onClick={onNext} title="Next month"
          style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ▶
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 9, color: "#475569", width: 28, textAlign: "right" }}>M0</span>
        <input type="range" min={0} max={months.length - 1} value={currentIdx}
          onChange={e => onSeek(+e.target.value)}
          style={{ flex: 1, accentColor: "#38bdf8", cursor: "pointer" }} />
        <span style={{ fontSize: 9, color: "#475569", width: 28 }}>M{months.length - 1}</span>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>
        Month {currentIdx} / {months.length - 1}
      </div>
    </div>
  );
}

/* ── Main DiseaseProgression component ───────────────────────────── */
export default function DiseaseProgression({ risk, simResult }) {
  const baseRisks = {
    heart:  risk.heart  <= 1 ? risk.heart  * 100 : risk.heart,
    kidney: risk.kidney <= 1 ? risk.kidney * 100 : risk.kidney,
    liver:  risk.liver  <= 1 ? risk.liver  * 100 : risk.liver,
  };

  const [tab, setTab] = useState("heatmap"); // heatmap | playback | futureme
  const [playIdx, setPlayIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playTimer = useRef(null);

  /* Build playback frames from simResult or mock progression */
  const frames = simResult?.months
    ? simResult.months.map((m, i) => ({
        label: `M${m}`,
        heart:  (simResult.heart_trajectory?.[i]  || 0) * 100,
        kidney: (simResult.kidney_trajectory?.[i] || 0) * 100,
        liver:  (simResult.liver_trajectory?.[i]  || 0) * 100,
      }))
    : Array.from({ length: 13 }, (_, i) => ({
        label: `M${i}`,
        heart:  Math.min(98, baseRisks.heart  + i * 1.8),
        kidney: Math.min(98, baseRisks.kidney + i * 1.2),
        liver:  Math.min(98, baseRisks.liver  + i * 1.5),
      }));

  useEffect(() => {
    if (playing) {
      playTimer.current = setInterval(() => {
        setPlayIdx(i => {
          if (i >= frames.length - 1) { setPlaying(false); return i; }
          return i + 1;
        });
      }, 900);
    } else {
      clearInterval(playTimer.current);
    }
    return () => clearInterval(playTimer.current);
  }, [playing, frames.length]);

  const currentFrame = frames[playIdx] || baseRisks;

  /* Future Me scenarios */
  const bestCase = {
    heart:  Math.max(8,  baseRisks.heart  * 0.5),
    kidney: Math.max(8,  baseRisks.kidney * 0.55),
    liver:  Math.max(8,  baseRisks.liver  * 0.5),
  };
  const worstCase = {
    heart:  Math.min(95, baseRisks.heart  * 1.8),
    kidney: Math.min(95, baseRisks.kidney * 1.7),
    liver:  Math.min(95, baseRisks.liver  * 1.75),
  };

  return (
    <div className="glass-card" style={{ padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
            Disease Progression & Body Heatmap
          </div>
          <div style={{ fontSize: 11, color: "#7c8fa8", marginTop: 2 }}>
            Full-body risk visualization, playback & future projections
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button className={`tab-item${tab === "heatmap"  ? " active" : ""}`} onClick={() => setTab("heatmap")}>🌍 Body Heatmap</button>
        <button className={`tab-item${tab === "playback" ? " active" : ""}`} onClick={() => setTab("playback")}>🎥 Playback</button>
        <button className={`tab-item${tab === "futureme" ? " active" : ""}`} onClick={() => setTab("futureme")}>🌌 Future Me</button>
      </div>

      {/* ── Body Heatmap ── */}
      {tab === "heatmap" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginBottom: 14, lineHeight: 1.6 }}>
            Each body zone is colored by its organ system's risk. Click a zone to see details.
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            <BodyHeatmap risks={baseRisks} label="Current State" />
          </div>

          {/* Zone legend */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
            {[
              { zone: "🧠 Head / Brain", risk: Math.round((baseRisks.heart * 0.3 + baseRisks.kidney * 0.2) * 0.8), desc: "Derived from cardiovascular & renal health" },
              { zone: "❤️ Chest / Cardiac", risk: Math.round(baseRisks.heart), desc: "Direct heart risk score" },
              { zone: "🟤 Abdomen / Liver", risk: Math.round(baseRisks.liver), desc: "Hepatic & digestive health" },
              { zone: "🫘 Lower / Renal", risk: Math.round(baseRisks.kidney), desc: "Kidney & urinary health" },
            ].map(z => (
              <div key={z.zone} style={{ background: `${riskColor(z.risk)}0d`, border: `1px solid ${riskColor(z.risk)}28`, borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{z.zone}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: riskColor(z.risk), fontFamily: "monospace" }}>{z.risk}%</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>{z.desc}</div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 5 }}>
                  <div style={{ height: "100%", width: `${z.risk}%`, background: riskColor(z.risk), borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Playback ── */}
      {tab === "playback" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginBottom: 12 }}>
            Watch organs change over time. {simResult ? "Using your simulation data." : "Using projected progression."}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <BodyHeatmap risks={currentFrame} />
          </div>

          {/* Risk values at current frame */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
            {[["❤️ Heart", currentFrame.heart], ["🫘 Kidney", currentFrame.kidney], ["🟤 Liver", currentFrame.liver]].map(([lbl, val]) => (
              <div key={lbl} style={{ textAlign: "center", background: `${riskColor(val)}0d`, border: `1px solid ${riskColor(val)}28`, borderRadius: 8, padding: "8px" }}>
                <div style={{ fontSize: 10, color: "#64748b" }}>{lbl}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: riskColor(val), fontFamily: "monospace" }}>{val.toFixed(0)}%</div>
              </div>
            ))}
          </div>

          <PlaybackControl
            months={frames} currentIdx={playIdx} playing={playing}
            onPlay={() => { if (playIdx >= frames.length - 1) setPlayIdx(0); setPlaying(true); }}
            onPause={() => setPlaying(false)}
            onNext={() => setPlayIdx(i => Math.min(i + 1, frames.length - 1))}
            onPrev={() => setPlayIdx(i => Math.max(i - 1, 0))}
            onSeek={setPlayIdx}
          />

          {/* Progression bar */}
          <div style={{ marginTop: 12, display: "flex", gap: 2 }}>
            {frames.map((f, i) => (
              <div key={i} onClick={() => setPlayIdx(i)}
                style={{ flex: 1, height: 20, borderRadius: 3, cursor: "pointer",
                  background: riskColor(f.heart),
                  opacity: i === playIdx ? 1 : 0.35,
                  transition: "opacity 0.2s",
                  border: i === playIdx ? `1px solid ${riskColor(f.heart)}` : "none",
                }} title={`Month ${i}: Heart ${f.heart.toFixed(0)}%`} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#475569", marginTop: 3 }}>
            <span>Healthy</span><span>→ Disease Progression →</span><span>Critical</span>
          </div>
        </div>
      )}

      {/* ── Future Me ── */}
      {tab === "futureme" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginBottom: 14 }}>
            Three versions of you based on lifestyle choices over the next 12 months.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <BodyHeatmap risks={bestCase} label="🌟 Best Case (Healthy habits)" />
              <div style={{ marginTop: 8, fontSize: 10, color: "#10b981", textAlign: "center", lineHeight: 1.5, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "6px" }}>
                Exercise 45min/day<br />Mediterranean diet<br />8h sleep<br />No smoking
              </div>
            </div>
            <div>
              <BodyHeatmap risks={baseRisks} label="📍 Current State" />
              <div style={{ marginTop: 8, fontSize: 10, color: "#94a3b8", textAlign: "center", lineHeight: 1.5, background: "rgba(56,100,160,0.06)", border: "1px solid rgba(56,100,160,0.15)", borderRadius: 8, padding: "6px" }}>
                Current lifestyle<br />maintained
              </div>
            </div>
            <div>
              <BodyHeatmap risks={worstCase} label="⚠️ Worst Case (Poor habits)" />
              <div style={{ marginTop: 8, fontSize: 10, color: "#ef4444", textAlign: "center", lineHeight: 1.5, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px" }}>
                No exercise<br />High BMI<br />Poor diet<br />High stress
              </div>
            </div>
          </div>

          {/* Summary comparison table */}
          <div style={{ marginTop: 16, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "rgba(14,24,40,0.8)" }}>
                  {["Organ", "Best Case", "Current", "Worst Case"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", borderBottom: "2px solid rgba(56,100,160,0.2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[["❤️ Heart", bestCase.heart, baseRisks.heart, worstCase.heart],
                  ["🫘 Kidney", bestCase.kidney, baseRisks.kidney, worstCase.kidney],
                  ["🟤 Liver", bestCase.liver, baseRisks.liver, worstCase.liver]].map(([lbl, best, cur, worst]) => (
                  <tr key={lbl} style={{ borderBottom: "1px solid rgba(56,100,160,0.1)" }}>
                    <td style={{ padding: "8px 10px", color: "#e2e8f0", fontWeight: 600 }}>{lbl}</td>
                    <td style={{ padding: "8px 10px", color: "#10b981", fontFamily: "monospace", fontWeight: 700 }}>{best.toFixed(0)}%</td>
                    <td style={{ padding: "8px 10px", color: riskColor(cur), fontFamily: "monospace", fontWeight: 700 }}>{cur.toFixed(0)}%</td>
                    <td style={{ padding: "8px 10px", color: "#ef4444", fontFamily: "monospace", fontWeight: 700 }}>{worst.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
