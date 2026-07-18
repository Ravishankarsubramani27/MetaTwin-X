"""
FastAPI /simulate route — runs the 12-month logistic simulation engine.
Outcome 3: Digital Twin Simulation
Outcome 4: What-if Scenario Analysis
"""
from __future__ import annotations
import sys
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from src.simulation_engine import SimulationEngine
from src.models.data_types import AdjustedScores, ScenarioParams
from src.exceptions import SimulationError

log = logging.getLogger("metatwin-x.simulate_route")

router = APIRouter()

_CONFIG_DIR = ROOT / "config"
_simulation_engine: SimulationEngine | None = None


def _get_engine():
    global _simulation_engine
    if _simulation_engine is None:
        _simulation_engine = SimulationEngine(_CONFIG_DIR / "simulation.yaml")
    return _simulation_engine


@router.post("/")
def simulate(data: dict):
    """
    Accept adjusted risk scores and an optional scenario, return 12-month trajectories.

    Payload:
      {
        "heart":  0.45,          # required
        "kidney": 0.32,          # required
        "liver":  0.28,          # required
        "scenario_label": "...", # optional
        "intervention": 0.0      # optional  [0, 1]
      }

    Also supports legacy single-value payload: {"risk": 0.5}
    """
    try:
        engine = _get_engine()

        # ── Support both new multi-organ payload and legacy single-risk payload ──
        if "heart" in data and "kidney" in data and "liver" in data:
            adjusted = AdjustedScores(
                heart=float(data["heart"]),
                kidney=float(data["kidney"]),
                liver=float(data["liver"]),
            )
        elif "risk" in data:
            # Legacy: broadcast single risk to all three organs
            risk = float(data["risk"])
            adjusted = AdjustedScores(heart=risk, kidney=risk, liver=risk)
        else:
            raise HTTPException(
                status_code=422,
                detail="Payload must include 'heart'/'kidney'/'liver' or 'risk'."
            )

        # ── Build optional scenario ───────────────────────────────────────────
        scenario = None
        if "scenario_label" in data or "intervention" in data:
            overrides = {}
            if "intervention" in data:
                overrides["intervention"] = float(data["intervention"])
            scenario = ScenarioParams(
                label=data.get("scenario_label", "Custom Scenario"),
                overrides=overrides,
            )

        result = engine.project(adjusted, scenario=scenario)

        log.info("Simulation complete — scenario=%s", result.scenario_label)

        return {
            "months":             result.months,
            "heart_trajectory":   result.heart_trajectory,
            "kidney_trajectory":  result.kidney_trajectory,
            "liver_trajectory":   result.liver_trajectory,
            "scenario_label":     result.scenario_label,
        }

    except HTTPException:
        raise
    except SimulationError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        log.exception("Unexpected error in /simulate")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {exc}")