/**
 * useHealthScore.js
 * Derives the composite health score from organ risks.
 */
import { useMemo } from "react";
import { HEALTH_WEIGHTS } from "../config/constants";
import { normalizeRisks } from "../services/api";

export default function useHealthScore(risk) {
  return useMemo(() => {
    if (!risk) return { score: 0, label: "Unknown", color: "#64748b" };
    const r = normalizeRisks(risk);
    const h = r.heart  / 100;
    const k = r.kidney / 100;
    const l = r.liver  / 100;
    const score = Math.round(
      (1 - (HEALTH_WEIGHTS.heart*h + HEALTH_WEIGHTS.kidney*k + HEALTH_WEIGHTS.liver*l + 0.1*h*k)) * 100
    );
    const s = Math.max(0, Math.min(100, score));
    const label = s >= 80 ? "Excellent" : s >= 65 ? "Good" : s >= 50 ? "Fair"
                : s >= 35 ? "Moderate Risk" : "High Risk";
    const color = s >= 70 ? "#10b981" : s >= 45 ? "#f59e0b" : "#ef4444";
    return { score: s, label, color, risks: r };
  }, [risk]);
}
