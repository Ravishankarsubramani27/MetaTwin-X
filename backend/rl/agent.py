"""
Reinforcement Learning intervention agent.
Rule-based RL with Q-value approximation (no training required).
State: health parameters → Actions: lifestyle interventions → Reward: risk reduction

For production: replace with a trained DQN/PPO agent using stable-baselines3.
"""
from __future__ import annotations
import logging
import numpy as np
from typing import List, Dict, Optional

log = logging.getLogger("metatwin-x.rl_agent")

# ── Action space ───────────────────────────────────────────────────────
ACTIONS = [
    {
        "id": 0, "name": "Aerobic Exercise",
        "description": "150 min/week moderate cardio (walking, cycling, swimming)",
        "targets": {"heart": 0.08, "kidney": 0.05, "liver": 0.06},
        "requirements": {"min_age": 18, "max_age": 80},
    },
    {
        "id": 1, "name": "Dietary Overhaul",
        "description": "Mediterranean diet: reduce saturated fat, increase fibre and omega-3",
        "targets": {"heart": 0.10, "liver": 0.08, "kidney": 0.04},
        "requirements": {},
    },
    {
        "id": 2, "name": "Antihypertensive Therapy",
        "description": "ACE inhibitor or ARB to lower systolic BP to <130 mmHg",
        "targets": {"heart": 0.12, "kidney": 0.10},
        "requirements": {"min_sbp": 140},
    },
    {
        "id": 3, "name": "Statin Therapy",
        "description": "Moderate-intensity statin to reduce LDL cholesterol by 30-50%",
        "targets": {"heart": 0.12, "kidney": 0.02},
        "requirements": {"min_cholesterol": 200},
    },
    {
        "id": 4, "name": "Glycaemic Control",
        "description": "Dietary control + metformin to maintain FBG <100 mg/dL",
        "targets": {"kidney": 0.14, "heart": 0.06, "liver": 0.04},
        "requirements": {"min_glucose": 100},
    },
    {
        "id": 5, "name": "Alcohol Cessation",
        "description": "Complete alcohol abstinence to reduce hepatic stress",
        "targets": {"liver": 0.15, "heart": 0.03},
        "requirements": {},
    },
    {
        "id": 6, "name": "Weight Reduction",
        "description": "5-10% body weight reduction through caloric deficit",
        "targets": {"liver": 0.12, "heart": 0.08, "kidney": 0.04},
        "requirements": {"min_bmi": 25},
    },
    {
        "id": 7, "name": "Sleep Optimisation",
        "description": "7-9 hours of quality sleep to reduce cortisol and inflammatory markers",
        "targets": {"heart": 0.05, "kidney": 0.03, "liver": 0.04},
        "requirements": {},
    },
    {
        "id": 8, "name": "Smoking Cessation",
        "description": "Complete tobacco cessation — reduces CVD risk by 50% within 1 year",
        "targets": {"heart": 0.20, "kidney": 0.05, "liver": 0.03},
        "requirements": {},
    },
    {
        "id": 9, "name": "Stress Management",
        "description": "Mindfulness, yoga, or CBT to reduce chronic stress score",
        "targets": {"heart": 0.06, "kidney": 0.04, "liver": 0.05},
        "requirements": {"min_stress": 50},
    },
]


def _build_state_vector(
    scores: Dict[str, float],
    biomarkers: Optional[Dict] = None,
    wearable: Optional[Dict] = None,
) -> np.ndarray:
    """
    Build normalized state vector from health parameters.
    State = [heart_risk, kidney_risk, liver_risk, max_risk, health_score,
             glucose_norm, bp_norm, bmi_norm, hr_norm, hrv_inv_norm, stress_norm]
    """
    h = float(scores.get("heart",  0.5))
    k = float(scores.get("kidney", 0.5))
    l = float(scores.get("liver",  0.5))

    max_risk     = max(h, k, l)
    health_score = 1 - max_risk

    # Biomarker features (normalised to [0,1])
    bm = biomarkers or {}
    glucose_n = min((float(bm.get("fasting_glucose",   100)) - 40)  / 560,  1.0)
    bp_n      = min((float(bm.get("systolic_bp",       120)) - 60)  / 190,  1.0)
    bmi_n     = min((float(bm.get("bmi",               25))  - 10)  / 60,   1.0)
    chol_n    = min((float(bm.get("total_cholesterol", 200)) - 50)  / 550,  1.0)
    creat_n   = min((float(bm.get("serum_creatinine",  0.9)) - 0.1) / 19.9, 1.0)

    # Wearable features
    wv = wearable or {}
    hr_n     = min((float(wv.get("heart_rate_resting", 70)) - 30) / 170, 1.0)
    hrv_inv  = 1.0 - min(float(wv.get("hrv_ms", 42)) / 200, 1.0)  # inverse
    stress_n = min(float(wv.get("stress_score", 30)) / 100, 1.0)
    spo2_inv = 1.0 - min(float(wv.get("spo2_pct", 98)) / 100, 1.0)

    return np.array([
        h, k, l, max_risk, health_score,
        glucose_n, bp_n, bmi_n, chol_n, creat_n,
        hr_n, hrv_inv, stress_n, spo2_inv,
    ], dtype=np.float32)


def _q_value(action: Dict, state: np.ndarray,
             scores: Dict, biomarkers: Dict) -> float:
    """
    Approximate Q-value: expected cumulative reward of taking this action.
    Uses domain-knowledge-based value estimation rather than learned weights.
    """
    h, k, l = state[0], state[1], state[2]
    max_risk  = state[3]

    # Base reward = weighted sum of expected risk reduction per organ
    base_reward = 0.0
    for organ, reduction in action["targets"].items():
        organ_risk = {"heart": h, "kidney": k, "liver": l}.get(organ, 0)
        # Higher reward if organ is already at high risk (more to gain)
        base_reward += reduction * organ_risk * 2.0

    # Bonus for high-risk states (urgency multiplier)
    urgency = 1.0 + max_risk * 0.5

    # Check feasibility given current biomarkers
    reqs = action.get("requirements", {})
    feasible = True
    if "min_sbp"         in reqs and biomarkers.get("systolic_bp",      0) < reqs["min_sbp"]:
        feasible = False
    if "min_cholesterol" in reqs and biomarkers.get("total_cholesterol",0) < reqs["min_cholesterol"]:
        feasible = False
    if "min_glucose"     in reqs and biomarkers.get("fasting_glucose",  0) < reqs["min_glucose"]:
        feasible = False
    if "min_bmi"         in reqs and biomarkers.get("bmi",              0) < reqs["min_bmi"]:
        feasible = False
    if "min_stress"      in reqs and state[12]                              < reqs["min_stress"] / 100:
        feasible = False
    if not feasible:
        return 0.0

    return float(base_reward * urgency)


def recommend_interventions(
    scores: Dict[str, float],
    biomarkers: Optional[Dict] = None,
    wearable: Optional[Dict] = None,
    top_k: int = 5,
) -> Dict:
    """
    Run RL agent to recommend optimal interventions.

    Returns top_k actions ranked by expected reward.
    """
    bm    = biomarkers or {}
    state = _build_state_vector(scores, bm, wearable)

    ranked = []
    for action in ACTIONS:
        q = _q_value(action, state, scores, bm)
        if q > 0:
            ranked.append({
                "action_id":       action["id"],
                "name":            action["name"],
                "description":     action["description"],
                "expected_reward": round(float(q), 4),
                "confidence":      round(min(float(q) * 2.5, 1.0), 3),
                "targets":         action["targets"],
            })

    ranked.sort(key=lambda x: x["expected_reward"], reverse=True)
    top = ranked[:top_k]

    total_reward = sum(a["expected_reward"] for a in top)

    return {
        "recommended_actions":  top,
        "state_vector":         state.tolist(),
        "total_expected_reward": round(total_reward, 4),
        "max_risk_organ": max(scores, key=lambda o: scores[o]),
    }
