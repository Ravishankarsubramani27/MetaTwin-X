/**
 * config/constants.js
 * Central configuration — all magic strings, URLs, and thresholds in one place.
 */

export const API_BASE = "http://127.0.0.1:8000";
export const WS_VITALS_URL = "ws://127.0.0.1:8000/ws/vitals";

// Risk thresholds (%)
export const RISK_THRESHOLDS = {
  LOW:      30,
  MODERATE: 60,
  HIGH:     80,
};

// Emergency thresholds
export const EMERGENCY = {
  HEART_RISK:  80,   // %
  SPO2_LOW:    90,   // %
  BP_HIGH:    180,   // mmHg systolic
  TEMP_HIGH:   39,   // °C
};

// Health score weights
export const HEALTH_WEIGHTS = {
  heart:  0.4,
  kidney: 0.3,
  liver:  0.3,
};

// Organ display metadata
export const ORGAN_META = {
  heart:  { label: "Heart",  icon: "❤️", color: "#ef4444", specialist: "Cardiologist"  },
  kidney: { label: "Kidney", icon: "🫘", color: "#38bdf8", specialist: "Nephrologist"  },
  liver:  { label: "Liver",  icon: "🟤", color: "#10b981", specialist: "Hepatologist"  },
};

// Session config
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
export const WS_RECONNECT_MS = 5000;

// Chart colors
export const CHART_COLORS = {
  heart:  { stroke: "#ef4444", fill: "rgba(239,68,68,0.12)"  },
  kidney: { stroke: "#38bdf8", fill: "rgba(56,189,248,0.12)" },
  liver:  { stroke: "#10b981", fill: "rgba(16,185,129,0.12)" },
};
