/**
 * useRiskColor.js
 * Returns colour, label, and CSS variables for a given risk percentage.
 */
import { useMemo } from "react";

export function getRiskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}

export function getRiskLabel(pct) {
  if (pct <= 20) return "Low";
  if (pct <= 40) return "Moderate";
  if (pct <= 60) return "Elevated";
  if (pct <= 80) return "High";
  return "Critical";
}

export function getRiskBadgeClass(pct) {
  if (pct <= 40) return "badge-green";
  if (pct <= 60) return "badge-amber";
  return "badge-red";
}

export default function useRiskColor(pct) {
  return useMemo(() => ({
    color:      getRiskColor(pct),
    label:      getRiskLabel(pct),
    badgeClass: getRiskBadgeClass(pct),
  }), [pct]);
}
