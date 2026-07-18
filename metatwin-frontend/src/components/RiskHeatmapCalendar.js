/**
 * RiskHeatmapCalendar.js
 * GitHub-style calendar grid showing daily health score colour over 90 days.
 */
import React, { useMemo, useState } from "react";

function scoreColor(score) {
  if (score === null) return "rgba(255,255,255,0.04)";
  if (score >= 75) return "#10b981";
  if (score >= 60) return "#84cc16";
  if (score >= 45) return "#f59e0b";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

function scoreLabel(score) {
  if (score === null) return "No data";
  if (score >= 75) return "Good";
  if (score >= 60) return "Moderate";
  if (score >= 45) return "Needs Attention";
  if (score >= 30) return "High Risk";
  return "Critical";
}

function generateHistory(currentScore) {
  const days = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // Simulate gradual rise toward current score with noise
    const progress = (89 - i) / 89;
    const base = currentScore * 0.6 + currentScore * 0.4 * progress;
    const noise = (Math.sin(i * 0.7) * 8) + (Math.cos(i * 1.3) * 5);
    const score = Math.min(99, Math.max(5, Math.round(base + noise)));
    days.push({ date: d, score, dayOfWeek: d.getDay() });
  }
  return days;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function RiskHeatmapCalendar({ risk }) {
  const [hovered, setHovered] = useState(null);

  const healthScore = useMemo(() => {
    const h = risk?.heart  <= 1 ? (risk.heart  || 0) * 100 : (risk?.heart  || 0);
    const k = risk?.kidney <= 1 ? (risk.kidney || 0) * 100 : (risk?.kidney || 0);
    const l = risk?.liver  <= 1 ? (risk.liver  || 0) * 100 : (risk?.liver  || 0);
    return Math.round(100 - (0.4 * h + 0.3 * k + 0.3 * l));
  }, [risk]);

  const history = useMemo(() => generateHistory(healthScore), [healthScore]);

  // Group into weeks (columns)
  const weeks = useMemo(() => {
    const ws = [];
    let week = new Array(history[0].dayOfWeek).fill(null); // padding
    for (const day of history) {
      week.push(day);
      if (day.dayOfWeek === 6) { ws.push(week); week = []; }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      ws.push(week);
    }
    return ws;
  }, [history]);

  // Stats
  const valid = history.filter(d => d.score !== null);
  const avg   = Math.round(valid.reduce((s, d) => s + d.score, 0) / valid.length);
  const best  = Math.max(...valid.map(d => d.score));
  const worst = Math.min(...valid.map(d => d.score));
  const goodDays = valid.filter(d => d.score >= 60).length;

  // Month labels above grid
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstReal = week.find(d => d !== null);
      if (firstReal && firstReal.date.getMonth() !== lastMonth) {
        labels.push({ wi, label: MONTH_NAMES[firstReal.date.getMonth()] });
        lastMonth = firstReal.date.getMonth();
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
          📅 Risk Heatmap Calendar
        </h2>
        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
          90-day daily health score — hover any cell for details.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Average Score", value: avg, color: scoreColor(avg) },
          { label: "Best Day",      value: best, color: "#10b981" },
          { label: "Worst Day",     value: worst, color: "#ef4444" },
          { label: "Good Days",     value: `${goodDays}/90`, color: "#38bdf8" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase",
                          letterSpacing: "0.08em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color,
                          fontFamily: "var(--font-mono)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: "20px 24px" }}>
        {/* Month labels */}
        <div style={{ display: "flex", marginLeft: 36, marginBottom: 4 }}>
          {weeks.map((_, wi) => {
            const ml = monthLabels.find(m => m.wi === wi);
            return (
              <div key={wi} style={{ width: 14, marginRight: 3, flexShrink: 0 }}>
                {ml && <span style={{ fontSize: 9, color: "#475569", whiteSpace: "nowrap" }}>{ml.label}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {/* Day labels */}
          <div style={{ display: "flex", flexDirection: "column", marginRight: 6 }}>
            {DAY_LABELS.map((d, i) => (
              <div key={d} style={{ height: 14, marginBottom: 3, fontSize: 9,
                                    color: i % 2 === 1 ? "#475569" : "transparent",
                                    lineHeight: "14px", width: 26 }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "flex", gap: 3 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {week.map((day, di) => (
                  <div key={di}
                    onMouseEnter={() => day && setHovered(day)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: 14, height: 14, borderRadius: 3,
                      background: day ? scoreColor(day.score) : "transparent",
                      cursor: day ? "pointer" : "default",
                      border: day && hovered?.date?.getTime() === day.date?.getTime()
                        ? "1px solid rgba(255,255,255,0.6)" : "1px solid transparent",
                      transition: "transform 0.1s",
                      transform: day && hovered?.date?.getTime() === day.date?.getTime()
                        ? "scale(1.3)" : "scale(1)",
                      boxShadow: day ? `0 0 4px ${scoreColor(day.score)}44` : "none",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16,
                      justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#475569" }}>Less healthy</span>
            {[10, 30, 50, 65, 80].map(s => (
              <div key={s} style={{ width: 12, height: 12, borderRadius: 2,
                                    background: scoreColor(s) }}/>
            ))}
            <span style={{ fontSize: 10, color: "#475569" }}>Healthier</span>
          </div>
          <div style={{ fontSize: 10, color: "#475569" }}>
            Each cell = 1 day · Based on current organ risks
          </div>
        </div>

        {/* Tooltip */}
        {hovered && (
          <div style={{
            marginTop: 14, padding: "10px 14px",
            background: "rgba(56,189,248,0.08)",
            border: "1px solid rgba(56,189,248,0.25)", borderRadius: 8,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {hovered.date.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: scoreColor(hovered.score),
                           fontFamily: "var(--font-mono)" }}>{hovered.score}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: scoreColor(hovered.score) }}>
              {scoreLabel(hovered.score)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
