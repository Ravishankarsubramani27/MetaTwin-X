"""Cross-organ interaction rule engine — improved v3.
Improvements over v2:
  - Feature-specific normalization (not hardcoded ÷200)
  - Clinical threshold gating (rules only fire above threshold)
  - 8 interaction edges (was 4), including HDL protective effect
  - Bidirectional interactions (kidney→heart)
  - Weights config-loadable
"""
from __future__ import annotations
import yaml
from pathlib import Path
from src.models.data_types import (
    RawScores, RawHealthInput, AdjustedScores,
    InteractionAuditEntry, InteractionResult,
)

# ── Feature normalization ranges ───────────────────────────────────────
_NORM_RANGE = {
    "fasting_glucose":   (40,   600),
    "total_cholesterol": (50,   600),
    "systolic_bp":       (60,   250),
    "serum_creatinine":  (0.1,  20.0),
    "bmi":               (10.0, 70.0),
    "hdl_cholesterol":   (10,   150),
}

# ── Clinical thresholds — rule only fires if value EXCEEDS threshold ───
# For protective features (hdl), rule fires if value is BELOW threshold.
_THRESHOLD = {
    "fasting_glucose":   {"above": 100},   # pre-diabetic
    "total_cholesterol": {"above": 200},
    "systolic_bp":       {"above": 120},
    "serum_creatinine":  {"above": 1.2},
    "bmi":               {"above": 25.0},
    "hdl_cholesterol":   {"below": 40.0},  # low HDL = protective factor lost
}

# ── Default interaction graph ──────────────────────────────────────────
# Format: {feature: {target_organ: weight}}
# Positive weight = risk-increasing; negative = protective
_DEFAULT_GRAPH = {
    "fasting_glucose":    {"kidney": +0.12},            # diabetic nephropathy
    "total_cholesterol":  {"heart":  +0.08},            # atherosclerosis
    "systolic_bp":        {"heart":  +0.06,             # hypertensive CVD
                           "kidney": +0.04},            # hypertensive nephropathy
    "serum_creatinine":   {"kidney": +0.12,             # CKD marker
                           "heart":  +0.03},            # cardiorenal syndrome
    "bmi":                {"liver":  +0.07,             # NAFLD
                           "heart":  +0.04},            # obesity-CVD
    "hdl_cholesterol":    {"heart":  -0.05},            # protective (negative weight)
    # Organ-to-organ interactions
    "liver":              {"heart":  +0.05,             # hepato-cardiac axis
                           "kidney": +0.04},            # hepato-renal syndrome
    "kidney":             {"heart":  +0.04},            # cardiorenal bidirectional
}


def _normalize(value: float, feature: str) -> float:
    """Min-max normalise a feature value to [0, 1]."""
    lo, hi = _NORM_RANGE.get(feature, (0, 1))
    if hi == lo:
        return 0.0
    return float(min(max((value - lo) / (hi - lo), 0.0), 1.0))


def _threshold_ok(value: float, feature: str) -> bool:
    """Return True if this feature value should trigger its interaction rule."""
    gate = _THRESHOLD.get(feature)
    if gate is None:
        return True  # organ-to-organ rules always apply
    if "above" in gate:
        return value > gate["above"]
    if "below" in gate:
        return value < gate["below"]
    return True


class InteractionEngine:
    def __init__(self, config_path: Path = None):
        self.graph = dict(_DEFAULT_GRAPH)
        if config_path and Path(config_path).exists():
            try:
                with open(config_path) as f:
                    cfg = yaml.safe_load(f)
                if cfg and isinstance(cfg.get("interactions"), dict):
                    self.graph.update(cfg["interactions"])
            except Exception:
                pass  # fall back to defaults

    def apply_rules(
        self,
        raw_scores: RawScores,
        raw_inputs: RawHealthInput,
    ) -> InteractionResult:

        risks = {
            "heart":  raw_scores.heart,
            "kidney": raw_scores.kidney,
            "liver":  raw_scores.liver,
        }
        audit_log: list[InteractionAuditEntry] = []

        for feature, targets in self.graph.items():
            # Resolve feature value
            if feature in ("liver", "kidney", "heart"):
                value = risks[feature]
            else:
                value = float(getattr(raw_inputs, feature, 0) or 0)

            # Threshold gate — skip if value doesn't meet clinical threshold
            if not _threshold_ok(value, feature):
                continue

            # Normalise
            norm = _normalize(value, feature) if feature not in ("liver","kidney","heart") else value

            for organ, weight in targets.items():
                original = risks[organ]
                delta    = weight * norm
                risks[organ] = float(min(max(risks[organ] + delta, 0.0), 1.0))

                direction = "increases" if delta > 0 else "decreases"
                audit_log.append(InteractionAuditEntry(
                    rule_id=f"IR-{feature.upper()}->{organ.upper()}",
                    rule_description=(
                        f"{feature.replace('_',' ').title()} (value={value:.2f}) "
                        f"{direction} {organ} risk via cross-organ interaction"
                    ),
                    organ_affected=organ,
                    original_score=round(original, 4),
                    adjustment=round(delta, 4),
                    adjusted_score=round(risks[organ], 4),
                ))

        adjusted = AdjustedScores(
            heart=float(risks["heart"]),
            kidney=float(risks["kidney"]),
            liver=float(risks["liver"]),
        )
        return InteractionResult(adjusted_scores=adjusted, audit_log=audit_log)
