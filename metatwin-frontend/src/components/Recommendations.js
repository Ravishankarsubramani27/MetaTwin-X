import React, { useState } from "react";

const CAT_STYLE = {
  clinical_consultation: { label: "CLINICAL",  bg: "#fef2f2", fg: "#dc2626", border: "#ef4444" },
  physical_activity:     { label: "EXERCISE",  bg: "#faf5ff", fg: "#7c3aed", border: "#8b5cf6" },
  dietary_modification:  { label: "DIETARY",   bg: "#eff6ff", fg: "#2563eb", border: "#3b82f6" },
  lifestyle_habit:       { label: "LIFESTYLE", bg: "#f0fdf4", fg: "#15803d", border: "#22c55e" },
};
const ORGAN_COLOR = { heart: "#ef4444", kidney: "#3b82f6", liver: "#10b981", general: "#7c3aed" };

export default function Recommendations({ data }) {
  const [filter, setFilter] = useState("All");
  if (!data || !data.items || data.items.length === 0) return null;

  const items     = data.items;
  const clinical  = items.filter(r => r.category === "clinical_consultation").length;
  const filters   = ["All", "Clinical", "Exercise", "Dietary", "Lifestyle"];
  const filterMap = {
    All: null,
    Clinical:  "clinical_consultation",
    Exercise:  "physical_activity",
    Dietary:   "dietary_modification",
    Lifestyle: "lifestyle_habit",
  };
  const filtered = items.filter(r => !filterMap[filter] || r.category === filterMap[filter]);

  // Build downloadable care plan
  const buildCarePlan = () => {
    const lines = [
      "MetaTwin-X — Full Care Plan",
      `Generated: ${new Date().toLocaleString()}`,
      "=".repeat(50),
      "",
    ];
    items.forEach((r, i) => {
      lines.push(`[${i+1}] [${r.organ.toUpperCase()}] ${r.category.replace("_"," ").toUpperCase()}`);
      lines.push(`    ${r.text}`);
      lines.push("");
    });
    lines.push("=".repeat(50));
    lines.push("DISCLAIMER: For educational purposes only.");
    return lines.join("\n");
  };

  const handleDownload = () => {
    const blob = new Blob([buildCarePlan()], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `metatwinx_care_plan_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: "22px 24px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 800,
                        fontFamily: "Inter,sans-serif", marginBottom: 4 }}>
            💊 Clinical Recommendations
          </div>
          <div style={{ color: "#64748b", fontSize: 12 }}>
            {items.length} recommendations · {clinical} clinical consults required
          </div>
        </div>
        <button onClick={handleDownload} style={{
          background: "#0f172a", color: "#fff", border: "none",
          borderRadius: 8, padding: "9px 18px", fontWeight: 700,
          fontSize: 12, cursor: "pointer",
          boxShadow: "0 2px 8px rgba(15,23,42,0.25)",
        }}>
          📋 Download Care Plan
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? "#0f172a" : "#f1f5f9",
            color:      filter === f ? "#ffffff"  : "#374151",
            border: "none", borderRadius: 20, padding: "5px 14px",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
            transition: "all 0.15s",
          }}>{f}</button>
        ))}
      </div>

      {/* Cards */}
      {filtered.slice(0, 10).map((rec, i) => {
        const cfg   = CAT_STYLE[rec.category] || CAT_STYLE.lifestyle_habit;
        const oc    = ORGAN_COLOR[rec.organ] || "#64748b";
        const pct   = Math.round(rec.priority * 100);
        return (
          <div key={i} style={{
            background: "#ffffff", border: "1px solid #e2e8f0",
            borderLeft: `4px solid ${cfg.border}`,
            borderRadius: 10, padding: "14px 16px", marginBottom: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8,
                          marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{
                background: cfg.bg, color: cfg.fg,
                fontSize: 10, fontWeight: 700, padding: "2px 8px",
                borderRadius: 4, textTransform: "uppercase",
              }}>{cfg.label}</span>
              <span style={{
                background: `${oc}18`, color: oc,
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
              }}>{rec.organ.charAt(0).toUpperCase() + rec.organ.slice(1)}</span>
              <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 11 }}>
                Priority: {pct}%
              </span>
            </div>
            <div style={{ color: "#374151", fontSize: 13, lineHeight: 1.6,
                          fontFamily: "Inter,sans-serif" }}>{rec.text}</div>
            <div style={{ marginTop: 8, height: 3, background: "#f1f5f9",
                          borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`,
                            background: cfg.border, borderRadius: 2,
                            opacity: 0.6, transition: "width 0.5s" }} />
            </div>
          </div>
        );
      })}

      {/* Disclaimer */}
      <div style={{
        background: "#fffbeb", border: "1px solid #fde68a",
        borderRadius: 8, padding: "10px 14px", marginTop: 8,
        fontSize: 12, color: "#78350f", lineHeight: 1.5,
      }}>
        ⚠️ For educational purposes only. Always consult a qualified healthcare professional.
      </div>
    </div>
  );
}
