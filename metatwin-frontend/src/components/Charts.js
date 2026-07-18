import React from "react";
import {
  AreaChart, Area,
  BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = {
  heart:  "#ef4444",
  kidney: "#3b82f6",
  liver:  "#10b981",
};

function Card({ title, children }) {
  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: "18px 20px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 20,
    }}>
      <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 700,
                    marginBottom: 16, fontFamily: "Inter,sans-serif" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function RiskBarChart({ risk }) {
  const data = [
    { organ: "Heart",  risk: Math.round(risk.heart  * 1000) / 10, fill: "#ef4444" },
    { organ: "Kidney", risk: Math.round(risk.kidney * 1000) / 10, fill: "#3b82f6" },
    { organ: "Liver",  risk: Math.round(risk.liver  * 1000) / 10, fill: "#10b981" },
  ];
  return (
    <Card title="📊 Risk Score Comparison">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="organ" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [`${v}%`, "Risk"]}
          />
          <Bar dataKey="risk" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <rect key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function RadarRiskChart({ risk }) {
  const data = [
    { subject: "Heart",  A: Math.round(risk.heart  * 1000) / 10, fullMark: 100 },
    { subject: "Kidney", A: Math.round(risk.kidney * 1000) / 10, fullMark: 100 },
    { subject: "Liver",  A: Math.round(risk.liver  * 1000) / 10, fullMark: 100 },
  ];
  return (
    <Card title="🕸️ Multi-Organ Radar">
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 12 }} />
          <Radar name="Risk" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} strokeWidth={2} />
          <Tooltip formatter={(v) => [`${v}%`, "Risk"]} />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function TrajectoryChart({ simResult }) {
  if (!simResult) return null;
  const data = (simResult.months || []).map((m, i) => ({
    month: `M${m}`,
    Heart:  Math.round(simResult.heart_trajectory[i]  * 1000) / 10,
    Kidney: Math.round(simResult.kidney_trajectory[i] * 1000) / 10,
    Liver:  Math.round(simResult.liver_trajectory[i]  * 1000) / 10,
  }));
  return (
    <Card title="📈 12-Month Risk Trajectory">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            {Object.entries(COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [`${v}%`]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#374151" }} />
          {Object.entries(COLORS).map(([key, color]) => (
            <Area key={key} type="monotoneX" dataKey={key.charAt(0).toUpperCase()+key.slice(1)}
                  stroke={color} fill={`url(#grad-${key})`} strokeWidth={2.5}
                  dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default function Charts({ risk }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
      <RiskBarChart risk={risk} />
      <RadarRiskChart risk={risk} />
    </div>
  );
}
