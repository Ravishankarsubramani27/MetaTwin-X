"""
ODE-based hybrid simulation engine.
Replaces monthly logistic growth with:
  - Daily time-step SciPy ODE integration
  - Stochastic Monte Carlo uncertainty bands
  - Per-organ coupled differential equations
  - Intervention modelling (BMI reduction, BP control, medication)
"""
from __future__ import annotations
import logging
import numpy as np
from typing import Optional, Dict, List, Tuple

try:
    from scipy.integrate import solve_ivp
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False

log = logging.getLogger("metatwin-x.ode_engine")

# ── Organ-specific parameters ──────────────────────────────────────────
ORGAN_PARAMS = {
    "heart":  {"growth_rate": 0.0005, "carrying_capacity": 0.95, "decay": 0.0002},
    "kidney": {"growth_rate": 0.0006, "carrying_capacity": 0.95, "decay": 0.0002},
    "liver":  {"growth_rate": 0.0004, "carrying_capacity": 0.95, "decay": 0.0001},
}

# ── Cross-organ coupling ───────────────────────────────────────────────
# COUPLING[source][target] = coupling_strength
COUPLING = {
    "liver":  {"heart": 0.0003, "kidney": 0.0002},
    "kidney": {"heart": 0.0004},
    "heart":  {},
}

# ── Intervention efficacy ──────────────────────────────────────────────
# Maps intervention name to {organ: daily_reduction_rate}
INTERVENTION_EFFICACY = {
    "bmi_reduction":        {"liver": 0.0008, "heart": 0.0004, "kidney": 0.0002},
    "bp_control":           {"heart": 0.0010, "kidney": 0.0005},
    "medication_adherence": {"heart": 0.0012, "kidney": 0.0008, "liver": 0.0004},
    "exercise":             {"heart": 0.0006, "liver": 0.0005, "kidney": 0.0003},
    "dietary_change":       {"liver": 0.0006, "kidney": 0.0003, "heart": 0.0002},
}


def _ode_system(t: float, y: np.ndarray, interventions: Dict[str, float]) -> np.ndarray:
    """
    Coupled ODE system for three-organ risk dynamics.
    y = [heart_risk, kidney_risk, liver_risk]
    dy/dt = growth - natural_decay - intervention_effect + coupling_from_other_organs
    """
    h, k, l = y[0], y[1], y[2]
    organs   = {"heart": h, "kidney": k, "liver": l}
    dydt     = np.zeros(3)

    for i, (organ, risk) in enumerate(organs.items()):
        p = ORGAN_PARAMS[organ]
        # Logistic growth term
        growth = p["growth_rate"] * risk * (1 - risk / p["carrying_capacity"])
        # Natural decay
        decay  = p["decay"] * risk
        # Intervention reduction
        intervention_effect = 0.0
        for iname, strength in interventions.items():
            if organ in INTERVENTION_EFFICACY.get(iname, {}):
                intervention_effect += INTERVENTION_EFFICACY[iname][organ] * strength
        # Cross-organ coupling (other organs pulling this one up)
        coupling_effect = 0.0
        for src_organ, targets in COUPLING.items():
            if organ in targets:
                src_risk = organs[src_organ]
                coupling_effect += targets[organ] * src_risk

        dydt[i] = growth - decay - intervention_effect * risk + coupling_effect

    return dydt


def simulate_ode(
    initial_scores: Dict[str, float],
    horizon_days: int = 365,
    interventions: Optional[Dict[str, float]] = None,
    stochastic: bool = True,
    n_samples: int = 50,
) -> Dict:
    """
    Run ODE simulation with optional stochastic uncertainty.

    Returns:
      trajectory: list of {day, heart, kidney, liver}
      uncertainty_bands: {organ: {lower, upper}} if stochastic=True
    """
    if interventions is None:
        interventions = {}

    y0 = np.array([
        float(np.clip(initial_scores.get("heart",  0.3), 0.01, 0.98)),
        float(np.clip(initial_scores.get("kidney", 0.3), 0.01, 0.98)),
        float(np.clip(initial_scores.get("liver",  0.3), 0.01, 0.98)),
    ])
    t_span = (0, float(horizon_days))
    t_eval = np.arange(0, horizon_days + 1, 1.0)

    if SCIPY_AVAILABLE:
        sol = solve_ivp(
            _ode_system, t_span, y0,
            t_eval=t_eval,
            args=(interventions,),
            method="RK45",
            rtol=1e-4, atol=1e-6,
            dense_output=False,
        )
        if sol.success:
            base_traj = np.clip(sol.y, 0.0, 1.0)  # shape (3, n_days)
        else:
            log.warning("ODE solver failed, falling back to logistic approximation")
            base_traj = _fallback_logistic(y0, horizon_days, interventions)
    else:
        base_traj = _fallback_logistic(y0, horizon_days, interventions)

    # ── Stochastic uncertainty bands ──────────────────────────────────
    if stochastic:
        all_trajs = _monte_carlo(y0, horizon_days, interventions, n_samples)
        lower = np.percentile(all_trajs, 10, axis=0)  # (3, n_days)
        upper = np.percentile(all_trajs, 90, axis=0)
        uncertainty_bands = {
            "heart":  {"lower": lower[0].tolist(), "upper": upper[0].tolist()},
            "kidney": {"lower": lower[1].tolist(), "upper": upper[1].tolist()},
            "liver":  {"lower": lower[2].tolist(), "upper": upper[2].tolist()},
        }
    else:
        uncertainty_bands = None

    # ── Build trajectory list (downsample to weekly for response size) ─
    step    = max(1, horizon_days // 52)  # ~weekly
    indices = list(range(0, len(t_eval), step))

    trajectory = []
    for idx in indices:
        trajectory.append({
            "day":    int(t_eval[idx]),
            "heart":  round(float(base_traj[0, idx]), 4),
            "kidney": round(float(base_traj[1, idx]), 4),
            "liver":  round(float(base_traj[2, idx]), 4),
        })

    # ── Peak risk per organ ────────────────────────────────────────────
    peak = {
        "heart":  round(float(base_traj[0].max()), 4),
        "kidney": round(float(base_traj[1].max()), 4),
        "liver":  round(float(base_traj[2].max()), 4),
    }
    day_of_peak = {
        "heart":  int(base_traj[0].argmax()),
        "kidney": int(base_traj[1].argmax()),
        "liver":  int(base_traj[2].argmax()),
    }

    return {
        "trajectory":        trajectory,
        "uncertainty_bands": uncertainty_bands,
        "peak_risk":         peak,
        "day_of_peak":       day_of_peak,
    }


def _fallback_logistic(y0: np.ndarray, days: int,
                       interventions: Dict[str, float]) -> np.ndarray:
    """Fallback if SciPy unavailable — daily Euler integration."""
    y = y0.copy()
    traj = np.zeros((3, days + 1))
    traj[:, 0] = y
    organs = ["heart", "kidney", "liver"]
    for t in range(1, days + 1):
        dy = _ode_system(float(t), y, interventions)
        y  = np.clip(y + dy * 1.0, 0.0, 1.0)
        traj[:, t] = y
    return traj


def _monte_carlo(y0: np.ndarray, days: int,
                 interventions: Dict[str, float],
                 n_samples: int) -> np.ndarray:
    """Run n_samples noisy trajectories for uncertainty quantification."""
    all_trajs = np.zeros((n_samples, 3, days + 1))
    noise_std  = 0.008
    for s in range(n_samples):
        y = y0 + np.random.normal(0, noise_std, size=3)
        y = np.clip(y, 0.01, 0.98)
        traj = np.zeros((3, days + 1))
        traj[:, 0] = y
        for t in range(1, days + 1):
            dy = _ode_system(float(t), y, interventions)
            noise = np.random.normal(0, noise_std * 0.3, size=3)
            y = np.clip(y + dy + noise, 0.0, 1.0)
            traj[:, t] = y
        all_trajs[s] = traj
    return all_trajs  # shape (n_samples, 3, days+1)
