"""12-month adaptive simulation engine with intervention-aware logistic growth."""
from __future__ import annotations
import yaml
from pathlib import Path
from src.models.data_types import (
    AdjustedScores, SimulationResult, ScenarioParams, RawHealthInput
)
from src.exceptions import SimulationError

DEFAULT_RATES = {
    "heart": 0.015,
    "kidney": 0.018,
    "liver": 0.012,
}


def _logistic_step(score: float, rate: float, intervention: float = 0.0) -> float:
    """
    Logistic growth with intervention reduction.
    """
    growth = rate * score * (1.0 - score)
    reduction = intervention * score
    return min(max(score + growth - reduction, 0.0), 1.0)


def _project_organ(
    start: float,
    rate: float,
    months: int = 12,
    intervention: float = 0.0
) -> list[float]:
    """
    Generate time-series risk trajectory for an organ.
    """
    trajectory = []
    s = start

    for t in range(months):
        # gradual increase in intervention effectiveness
        dynamic_intervention = intervention * (t / months)

        s = _logistic_step(s, rate, dynamic_intervention)
        trajectory.append(round(s, 6))

    return trajectory


class SimulationEngine:
    def __init__(self, config_path: Path = None):
        self._rates = dict(DEFAULT_RATES)

        if config_path and config_path.exists():
            with open(config_path) as f:
                cfg = yaml.safe_load(f)

            if cfg and "monthly_rates" in cfg:
                self._rates.update(cfg["monthly_rates"])

    def project(
        self,
        adjusted_scores: AdjustedScores,
        scenario: ScenarioParams | None = None,
        preprocessor=None,
        prediction_engine=None,
        interaction_engine=None,
    ) -> SimulationResult:
        try:
            intervention_strength = 0.0

            # 🔁 Scenario override (full pipeline re-evaluation)
            if scenario and preprocessor and prediction_engine and interaction_engine:

                # Apply new raw inputs
                raw = scenario.overrides.get("raw_inputs")
                if raw:
                    bundle = preprocessor.validate_and_transform(raw)
                    raw_scores = prediction_engine.predict_all(bundle)
                    result = interaction_engine.apply_rules(raw_scores, raw)
                    adjusted_scores = result.adjusted_scores

                # Extract intervention strength
                if "intervention" in scenario.overrides:
                    intervention_strength = scenario.overrides["intervention"]

            # 🔥 Adaptive simulation
            heart_traj = _project_organ(
                adjusted_scores.heart,
                self._rates["heart"],
                intervention=intervention_strength
            )

            kidney_traj = _project_organ(
                adjusted_scores.kidney,
                self._rates["kidney"],
                intervention=intervention_strength
            )

            liver_traj = _project_organ(
                adjusted_scores.liver,
                self._rates["liver"],
                intervention=intervention_strength
            )

            return SimulationResult(
                months=list(range(1, 13)),
                heart_trajectory=heart_traj,
                kidney_trajectory=kidney_traj,
                liver_trajectory=liver_traj,
                scenario_label=scenario.label if scenario else "Baseline",
            )

        except Exception as e:
            raise SimulationError(f"Simulation failed: {e}") from e