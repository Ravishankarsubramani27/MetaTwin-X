"""Property-based tests for prediction, interaction, simulation, color mapping (PT-07 to PT-13)."""
import pytest
import numpy as np
from pathlib import Path
from hypothesis import given, settings
from hypothesis import strategies as st

from tests.conftest import raw_health_inputs, adjusted_scores_strategy, raw_scores_strategy
from src.preprocessor import DataPreprocessor
from src.prediction_engine import PredictionEngine
from src.interaction_engine import InteractionEngine
from src.simulation_engine import SimulationEngine
from src.color_mapping import color_for_score
from src.models.data_types import Organ

preprocessor = DataPreprocessor()
prediction_engine = PredictionEngine(Path(__file__).parent.parent.parent / "models")
interaction_engine = InteractionEngine()
simulation_engine = SimulationEngine()


# PT-07: All risk scores bounded in [0.0, 1.0]
# Feature: metatwin-x-multi-organ-digital-twin, Property 7
@settings(max_examples=100)
@given(raw=raw_health_inputs())
def test_pt07_risk_scores_bounded(raw):
    """All prediction and interaction engine scores must be in [0, 1]."""
    bundle = preprocessor.transform(raw)
    for organ in Organ:
        vec = getattr(bundle, organ.value)
        score = prediction_engine.predict_organ(organ, vec)
        assert 0.0 <= score <= 1.0, f"{organ.value} raw score {score} out of bounds"

    raw_scores = prediction_engine.predict_all(bundle)
    result = interaction_engine.apply_rules(raw_scores, raw)
    adj = result.adjusted_scores
    assert 0.0 <= adj.heart <= 1.0
    assert 0.0 <= adj.kidney <= 1.0
    assert 0.0 <= adj.liver <= 1.0


# PT-08: Interaction rules applied correctly and audited
# Feature: metatwin-x-multi-organ-digital-twin, Property 8
@settings(max_examples=200)
@given(
    raw_scores=raw_scores_strategy(),
    raw=raw_health_inputs(),
)
def test_pt08_interaction_rules_correct(raw_scores, raw):
    """Interaction rules must fire exactly when conditions are met."""
    result = interaction_engine.apply_rules(raw_scores, raw)
    adj = result.adjusted_scores
    log = result.audit_log

    rule_ids_fired = [e.rule_id for e in log]

    # IR-01
    if raw_scores.kidney > 0.6 and raw.fasting_glucose > 126:
        assert "IR-01" in rule_ids_fired, "IR-01 should fire"
    else:
        assert "IR-01" not in rule_ids_fired, "IR-01 should not fire"

    # IR-02
    if raw_scores.heart > 0.5 and raw.total_cholesterol > 240:
        assert "IR-02" in rule_ids_fired, "IR-02 should fire"
    else:
        assert "IR-02" not in rule_ids_fired, "IR-02 should not fire"

    # IR-03
    if raw_scores.liver > 0.5:
        assert "IR-03" in rule_ids_fired, "IR-03 should fire"
    else:
        assert "IR-03" not in rule_ids_fired, "IR-03 should not fire"

    # Scores must be capped at 1.0
    assert adj.heart <= 1.0
    assert adj.kidney <= 1.0
    assert adj.liver <= 1.0

    # When no rules fire, original scores returned
    if not rule_ids_fired:
        assert abs(adj.heart - raw_scores.heart) < 1e-9
        assert abs(adj.kidney - raw_scores.kidney) < 1e-9
        assert abs(adj.liver - raw_scores.liver) < 1e-9


# PT-09: Simulation produces exactly 12 monthly values per organ
# Feature: metatwin-x-multi-organ-digital-twin, Property 9
@settings(max_examples=100)
@given(scores=adjusted_scores_strategy())
def test_pt09_simulation_12_months(scores):
    """SimulationResult must contain exactly 12 values per organ, all in [0, 1]."""
    result = simulation_engine.project(scores)
    assert result.months == list(range(1, 13)), "months must be [1..12]"
    for traj_name in ["heart_trajectory", "kidney_trajectory", "liver_trajectory"]:
        traj = getattr(result, traj_name)
        assert len(traj) == 12, f"{traj_name} must have 12 values"
        for v in traj:
            assert 0.0 <= v <= 1.0, f"{traj_name} value {v} out of [0,1]"


# PT-13: Organ color mapping correctness
# Feature: metatwin-x-multi-organ-digital-twin, Property 13
@settings(max_examples=200)
@given(score=st.floats(min_value=0.0, max_value=1.0, allow_nan=False))
def test_pt13_color_mapping_correct(score):
    """color_for_score must return the correct hex color for all valid scores."""
    color = color_for_score(score)
    if score < 0.4:
        assert color == "#4CAF50", f"score={score} expected green, got {color}"
    elif score < 0.7:
        assert color == "#FF9800", f"score={score} expected amber, got {color}"
    else:
        assert color == "#F44336", f"score={score} expected red, got {color}"
