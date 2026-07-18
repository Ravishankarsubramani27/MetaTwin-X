/**
 * RiskCard.jsx — Organ risk card with arc gauge, label, trend
 */
import React from "react";

const ORGAN_META = {
  heart:  { icon:"❤️", accent:"#ef4444", label:"Heart"  },
  kidney: { icon:"🫘", accent:"#38bdf8", label:"Kidney" },
  liver:  { icon:"🟤", accent:"#f59e0b", label:"Liver"  },
};

function riskInfo(pct) {
  if (pct < 30) return { label:"Low",      bg:"rgba(16,185,129,0.12)",  c:"#10b981" };
  if (pct < 60) return { label:"Moderate", bg:"rgba(245,158,11,0.12)",  c:"#f59e0b" };
  return             { label:"High",     bg:"rgba(239,68,68,0.12)",   c:"#ef4444" };
}

export default function RiskCard({ organ = "heart", value = 0, trend = null, onClick }) {
  const meta  = ORGAN_META[organ] || ORGAN_META.heart;
  const pct   = Math.round((value || 0) * 10) / 10;
  const info  = riskInfo(pct);
  const col   = meta.accent;

  // Mini arc
  const r      = 28; const cx = 36; const cy = 36;
  const circ   = 2 * Math.PI * r;
  const arc    = circ * 0.75;
  const filled = (pct / 100) * arc;
  const offset = -(circ * 0.125);

  return (
    <div onClick={onClick}
      style={{
        background:"rgba(14,24,40,0.8)",
        border:`1px solid ${col}33`,
        borderLeft:`3px solid ${col}`,
        borderRadius:10, padding:"12px 14px",
        cursor: onClick ? "pointer" : "default",
        transition:"all 0.2s",
        userSelect:"none",
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = `${col}12`; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(14,24,40,0.8)"; }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {/* Mini arc gauge */}
        <div style={{ flexShrink:0 }}>
          <svg width={72} height={72} style={{ overflow:"visible" }}>
            <circle cx={cx} cy={cy} r={r} fill="none"
              stroke="rgba(255,255,255,0.06)" strokeWidth={6}
              strokeDasharray={`${arc} ${circ - arc}`}
              strokeDashoffset={offset} strokeLinecap="round"
              style={{ transform:"rotate(-135deg)", transformOrigin:`${cx}px ${cy}px` }}
            />
            <circle cx={cx} cy={cy} r={r} fill="none"
              stroke={col} strokeWidth={6}
              strokeDasharray={`${filled} ${circ - filled}`}
              strokeDashoffset={offset} strokeLinecap="round"
              style={{
                transform:"rotate(-135deg)", transformOrigin:`${cx}px ${cy}px`,
                transition:"stroke-dasharray 0.8s ease",
                filter:`drop-shadow(0 0 4px ${col})`,
              }}
            />
            <text x={cx} y={cy + 5} textAnchor="middle"
              style={{ fontSize:13, fontWeight:900, fill:col,
                       fontFamily:"JetBrains Mono,monospace" }}>
              {pct.toFixed(0)}%
            </text>
          </svg>
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
            <span style={{ fontSize:16,
              ...(organ==="heart" ? {animation:"pulse-heart 1.2s infinite"} : {}) }}>
              {meta.icon}
            </span>
            <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>
              {meta.label}
            </span>
          </div>

          <span style={{
            background:info.bg, color:info.c,
            border:`1px solid ${info.c}44`,
            borderRadius:20, padding:"2px 9px",
            fontSize:10, fontWeight:700,
          }}>{info.label}</span>

          {trend !== null && (
            <div style={{ marginTop:5, fontSize:11, fontWeight:600,
                          color: trend > 0 ? "#ef4444" : trend < 0 ? "#10b981" : "#64748b" }}>
              {trend > 0 ? `↑ +${trend.toFixed(1)}%` : trend < 0 ? `↓ ${trend.toFixed(1)}%` : "→ Stable"}
            </div>
          )}

          {/* Mini bar */}
          <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2,
                        marginTop:6, overflow:"hidden" }}>
            <div style={{
              height:"100%", width:`${pct}%`, borderRadius:2,
              background:col, boxShadow:`0 0 4px ${col}`,
              transition:"width 0.8s ease",
            }}/>
          </div>
        </div>
      </div>
    </div>
  );
}
