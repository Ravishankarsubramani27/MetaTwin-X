"""
Counterfactual explanation engine.
"If glucose reduces by X, heart risk reduces by Y"
Combines feature sensitivity analysis with the interaction engine.
"""
from __future__ import annotations
import logging
from typing import List, Dict, Optional
import numpy as np

log = logging.getLogger("metatwin-x.counterfactuals")

# ── Feature metadata ───────────────────────────────────────────────────
FEATURE_META = {
    "fasting_glucose": {
        "unit": "mg/dL", "direction": "lower_is_better",
        "min": 70, "max": 600, "clinical_target": 100,
        "step": 5, "organs_affected": {"kidney": 0.12, "heart": 0.04},
        "feasibility_per_unit": "moderate",
    },
    "total_cholesterol": {
        "unit": "mg/dL", "direction": "lower_is_better",
        "min": 100, "max": 600, "clinical_target": 200,
        "step": 10, "organs_affected": {"heart": 0.08, "liver": 0.03},
        "feasibility_per_unit": "moderate",
    },
    "systolic_bp": {
        "unit": "mmHg", "direction": "lower_is_better",
        "min": 90, "max": 250, "clinical_target": 120,
        "step": 5, "organs_affected": {"heart": 0.06, "kidney": 0.04},
        "feasibility_per_unit": "moderate",
    },
    "bmi": {
        "unit": "kg/m²", "direction": "lower_is_better",
        "min": 18.5, "max": 70, "clinical_target": 25,
        "step": 1, "organs_affected": {"liver": 0.07, "heart": 0.04},
        "feasibility_per_unit": "hard",
    },
    "hdl_cholesterol": {
        "unit": "mg/dL", "direction": "higher_is_better",
        "min": 10, "max": 150, "clinical_target": 60,
        "step": 5, "organs_affected": {"heart": -0.05},
        "feasibility_per_unit": "hard",
    },
    "serum_creatinine": {
        "unit": "mg/dL", "direction": "lower_is_better",
        "min": 0.1, "max": 20, "clinical_target": 1.0,
        "step": 0.1, "organs_affected": {"kidney": 0.12},
        "feasibility_per_unit": "hard",
    },
    "alt_enzyme": {
        "unit": "U/L", "direction": "lower_is_better",
        "min": 7, "max": 2000, "clinical_target": 40,
        "step": 5, "organs_affected": {"liver": 0.08, "heart": 0.02},
        "feasibility_per_unit": "moderate",
    },
}

NORM = {
    "fasting_glucose":   (40, 600),
    "total_cholesterol": (50, 600),
    "systolic_bp":       (60, 250),
    "bmi":               (10, 70),
    "hdl_cholesterol":   (10, 150),
    "serum_creatinine":  (0.1, 20),
    "alt_enzyme":        (1, 2000),
}


def _normalize(value: float, feature: str) -> float:
    lo, hi = NORM.get(feature, (0, 1))
    return float(np.clip((value - lo) / (hi - lo), 0.0, 1.0))


def _risk_delta(feature: str, current_val: float, new_val: float,
                target_organ: str) -> float:
    """Estimate risk reduction for a feature change on a target organ."""
    meta = FEATURE_META.get(feature, {})
    organs = meta.get("organs_affected", {})
    if target_organ not in organs:
        return 0.0

    weight     = organs[target_organ]
    norm_curr  = _normalize(current_val, feature)
    norm_new   = _normalize(new_val,     feature)
    delta_norm = norm_curr - norm_new  # positive = improvement

    if meta.get("direction") == "higher_is_better":
        delta_norm = norm_new - norm_curr  # higher HDL = better

    return float(weight * delta_norm)


def generate_counterfactuals(
    biomarkers: Dict[str, float],
    current_scores: Dict[str, float],
    target_organ: str,
    target_reduction: float = 0.10,
) -> List[Dict]:
    """
    Generate counterfactual explanations for a given organ.

    Args:
        biomarkers:       Current biomarker values
        current_scores:   Current risk scores (heart/kidney/liver)
        target_organ:     Which organ to reduce risk for
        target_reduction: How much risk to reduce (e.g. 0.10 = 10%)

    Returns:
        List of counterfactual dicts sorted by risk_reduction desc
    """
    current_risk = current_scores.get(target_organ, 0.5)
    results      = []

    for feature, meta in FEATURE_META.items():
        current_val = biomarkers.get(feature)
        if current_val is None:
            continue

        if target_organ not in meta.get("organs_affected", {}):
            continue

        # Calculate how much change is needed
        target_val = meta["clinical_target"]
        direction  = meta["direction"]

        if direction == "lower_is_better":
            if current_val <= target_val:
                continue  # already at target
            new_val = max(target_val, current_val * (1 - target_reduction * 2))
        else:  # higher_is_better
            if current_val >= target_val:
                continue
            new_val = min(target_val, current_val * (1 + target_reduction * 2))

        # Clamp to physiological range
        lo, hi  = NORM.get(feature, (0, 9999))
        new_val = float(np.clip(new_val, lo, hi))

        risk_red  = _risk_delta(feature, current_val, new_val, target_organ)
        reduction = abs(risk_red)
        if reduction < 0.005:
            continue

        # Feasibility score
        change_pct = abs(current_val - new_val) / (abs(current_val) + 1e-8)
        if change_pct < 0.08:
            feasibility = "easy"
        elif change_pct < 0.20:
            feasibility = "moderate"
        else:
            feasibility = "hard"

        change_dir = "decrease" if direction == "lower_is_better" else "increase"
        explanation = (
            f"If {feature.replace('_',' ')} {change_dir}s from "
            f"{current_val:.1f} to {new_val:.1f} {meta['unit']}, "
            f"estimated {target_organ} risk reduces by "
            f"{reduction*100:.1f} percentage points."
        )

        results.append({
            "feature":        feature,
            "current_value":  round(current_val, 2),
            "suggested_value": round(new_val, 2),
            "unit":           meta["unit"],
            "risk_reduction": round(reduction, 4),
            "feasibility":    feasibility,
            "explanation":    explanation,
        })

    # Sort by impact
    results.sort(key=lambda x: x["risk_reduction"], reverse=True)
    return results[:8]  # top 8


def feature_sensitivity(
    biomarkers: Dict[str, float],
    current_scores: Dict[str, float],
    target_organ: str,
    perturbation: float = 0.05,
) -> List[Dict]:
    """
    Sensitivity analysis: which feature change has the most impact per unit?
    Perturbs each feature by ±perturbation fraction and measures risk change.
    """
    sensitivities = []
    for feature, meta in FEATURE_META.items():
        current_val = biomarkers.get(feature)
        if current_val is None or target_organ not in meta.get("organs_affected", {}):
            continue

        lo, hi = NORM.get(feature, (0, 9999))
        delta_amount = current_val * perturbation

        # +perturbation
        val_up   = float(np.clip(current_val + delta_amount, lo, hi))
        risk_up  = _risk_delta(feature, current_val, val_up, target_organ)

        # -perturbation
        val_dn   = float(np.clip(current_val - delta_amount, lo, hi))
        risk_dn  = _risk_delta(feature, current_val, val_dn, target_organ)

        sensitivity = abs(risk_dn - risk_up) / (2 * perturbation + 1e-8)
        sensitivities.append({
            "feature":     feature,
            "sensitivity": round(sensitivity, 4),
            "direction":   meta["direction"],
            "unit":        meta["unit"],
            "current_value": current_val,
        })

    sensitivities.sort(key=lambda x: x["sensitivity"], reverse=True)
    return sensitivities
