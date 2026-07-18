/**
 * HealthGauge.jsx — Animated semicircular gauge for health score
 */
import React from "react";

export default function HealthGauge({ score = 0, label = "" }) {
  const clipped = Math.max(0, Math.min(100, score));
  const color   = clipped >= 70 ? "#10b981" : clipped >= 45 ? "#f59e0b" : "#ef4444";
  const status  = clipped >= 70 ? "Excellent" : clipped >= 55 ? "Good"
                : clipped >= 40 ? "Fair" : clipped >= 25 ? "Moderate Risk" : "High Risk";

  // SVG arc math
  const r        = 54;
  const cx       = 70;
  const cy       = 70;
  const circ     = 2 * Math.PI * r;
  const arc      = circ * 0.75;            // 270° sweep
  const filled   = (clipped / 100) * arc;
  const offset   = -(circ * 0.125);        // start at 7 o'clock

  return (
    <div style={{
      background:"rgba(14,24,40,0.7)",
      border:`1px solid ${color}33`,
      borderRadius:12, padding:"16px 12px",
      textAlign:"center",
    }}>
      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8",
                    textTransform:"uppercase", letterSpacing:"0.1em",
                    marginBottom:8 }}>
        Health Score
      </div>

      <svg width={140} height={100} style={{ overflow:"visible", margin:"0 auto",
                                              display:"block" }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={9}
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform:"rotate(-135deg)", transformOrigin:`${cx}px ${cy}px` }}
        />
        {/* Fill */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={9}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transform:"rotate(-135deg)", transformOrigin:`${cx}px ${cy}px`,
            transition:"stroke-dasharray 1s ease",
            filter:`drop-shadow(0 0 6px ${color})`,
          }}
        />
        {/* Score text */}
        <text x={cx} y={cy + 6} textAnchor="middle"
          style={{ fontSize:26, fontWeight:900, fill:color,
                   fontFamily:"JetBrains Mono,monospace" }}>
          {clipped}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle"
          style={{ fontSize:9, fill:"#64748b", fontFamily:"Inter,sans-serif" }}>
          out of 100
        </text>
      </svg>

      <div style={{ marginTop:4 }}>
        <span style={{
          background:`${color}18`, color, border:`1px solid ${color}44`,
          borderRadius:20, padding:"3px 12px",
          fontSize:11, fontWeight:700,
        }}>{status}</span>
      </div>

      {label && (
        <div style={{ fontSize:10, color:"#475569", marginTop:6 }}>{label}</div>
      )}
    </div>
  );
}
