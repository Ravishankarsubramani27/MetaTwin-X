/**
 * HealthTimeline.js
 * Projected health timeline: Today → 1M → 3M → 6M → 12M
 * with organ risk projections and health score.
 */
import React, { useMemo } from "react";
import { getRiskColor } from "../hooks/useRiskColor";
import { normalizeRisks } from "../services/api";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const TIMELINE_POINTS = [
  { label: "Now",     months: 0  },
  { label: "1 Month", months: 1  },
  { label: "3 Months",months: 3  },
  { label: "6 Months",months: 6  },
  { label: "12 Months",months: 12 },
];

// Simple projection: logistic growth model
function project(base, months, rate = 0.022) {
  const r = base / 100;
  return Math.min(99, Math.round((r + r * (1 - r) * rate * months) * 100 * 10) / 10);
}

function computeHealthScore(h, k, l) {
  const hf = h / 100, kf = k / 100, lf = l / 100;
  return Math.round((1 - (0.4*hf + 0.3*kf + 0.3*lf + 0.1*hf*kf)) * 100);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(6,11,20,0.97)", border: "1px solid rgba(56,189,248,0.25)",
      borderRadius: 8, padding: "10px 14px", backdropFilter: "blur(12px)",
    }}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ fontSize: 11, color: p.color,
                                      fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {p.value.toFixed(1)}%
        </div>
      ))}
    </div>
  );
};

export default function HealthTimeline({ risk }) {
  const risks = normalizeRisks(risk);

  const timelineData = useMemo(() => TIMELINE_POINTS.map(pt => {
    const h = project(risks.heart,  pt.months, 0.020);
    const k = project(risks.kidney, pt.months, 0.022);
    const l = project(risks.liver,  pt.months, 0.018);
    return {
      label:  pt.label,
      heart:  h,
      kidney: k,
      liver:  l,
      health: computeHealthScore(h, k, l),
    };
  }), [risks.heart, risks.kidney, risks.liver]);

  const last = timelineData[timelineData.length - 1];
  const deltaHealth = timelineData[0].health - last.health;

  return (
    <div className="glass-card" style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
            📈 Health Timeline
          </div>
          <div style={{ fontSize: 11, color: "#7c8fa8", marginTop: 2 }}>
            Projected risk trajectory without intervention
          </div>
        </div>
        {deltaHealth > 0 && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#ef4444", fontWeight: 700,
          }}>
            Health Score −{deltaHealth} pts over 12M
          </div>
        )}
      </div>

      {/* Area chart */}
      <div style={{ height: 180, marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timelineData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              {[["heart","#ef4444"],["kidney","#38bdf8"],["liver","#10b981"]].map(([k,c])=>(
                <linearGradient key={k} id={`tl-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={c} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={c} stopOpacity={0.02}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,100,160,0.1)" vertical={false}/>
            <XAxis dataKey="label" tick={{ fill:"#475569", fontSize:9 }}
              tickLine={false} axisLine={false}/>
            <YAxis tick={{ fill:"#475569", fontSize:9 }} tickLine={false}
              axisLine={false} domain={[0,100]} tickFormatter={v=>`${v}%`} width={30}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="heart"  name="Heart"
              stroke="#ef4444" strokeWidth={2} fill="url(#tl-heart)"  dot={false}/>
            <Area type="monotone" dataKey="kidney" name="Kidney"
              stroke="#38bdf8" strokeWidth={2} fill="url(#tl-kidney)" dot={false}/>
            <Area type="monotone" dataKey="liver"  name="Liver"
              stroke="#10b981" strokeWidth={2} fill="url(#tl-liver)"  dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline milestones */}
      <div style={{ display: "flex", position: "relative" }}>
        <div style={{
          position: "absolute", top: 10, left: "5%", right: "5%", height: 1,
          background: "linear-gradient(90deg, rgba(56,189,248,0.3), rgba(239,68,68,0.4))",
        }}/>
        {timelineData.map((pt, i) => {
          const hCol = getRiskColor(pt.heart);
          const hs   = pt.health;
          const hsCol = hs >= 70 ? "#10b981" : hs >= 45 ? "#f59e0b" : "#ef4444";
          const isNow = i === 0;
          return (
            <div key={pt.label} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6,
            }}>
              {/* Dot */}
              <div style={{
                width: isNow ? 14 : 10, height: isNow ? 14 : 10,
                borderRadius: "50%", background: isNow ? "#38bdf8" : hCol,
                boxShadow: `0 0 ${isNow ? 10 : 5}px ${isNow ? "#38bdf8" : hCol}`,
                border: "2px solid #060b14", zIndex: 1,
                animation: isNow ? "pulse-dot 2s infinite" : "none",
              }}/>
              {/* Values */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#475569", marginBottom: 2 }}>{pt.label}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: hsCol,
                               fontFamily: "var(--font-mono)" }}>
                  {hs}<span style={{ fontSize: 8, color: "#475569" }}>/100</span>
                </div>
                <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 2 }}>
                  {[["❤", pt.heart,"#ef4444"],["⬡", pt.kidney,"#38bdf8"],["◉", pt.liver,"#10b981"]]
                    .map(([ic, v, c]) => (
                      <span key={ic} style={{ fontSize: 8, color: getRiskColor(v),
                                              fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {v.toFixed(0)}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, fontSize: 10, color: "#475569", textAlign: "center" }}>
        ❤ Heart · ⬡ Kidney · ◉ Liver · Values in % · Projected without intervention
      </div>
    </div>
  );
}
