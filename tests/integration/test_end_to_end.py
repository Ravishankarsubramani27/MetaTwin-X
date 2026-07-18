"""Integration tests: end-to-end pipeline."""
import time
import pytest
from pathlib import Path

from src.preprocessor import DataPreprocessor
from src.prediction_engine import PredictionEngine
from src.interaction_engine import InteractionEngine
from src.simulation_engine import SimulationEngine
from src.xai_module import XAIModule
from src.recommendation_engine import RecommendationEngine
from src.models.data_types import RawHealthInput

MODELS_DIR = Path(__file__).parent.parent.parent / "models"


@pytest.fixture(scope="module")
def pipeline():
    preprocessor = DataPreprocessor()
    prediction_engine = PredictionEngine(MODELS_DIR)
    interaction_engine = InteractionEngine()
    simulation_engine = SimulationEngine()
    xai_module = XAIModule(prediction_engine)
    recommendation_engine = RecommendationEngine()
    return (preprocessor, prediction_engine, interaction_engine,
            simulation_engine, xai_module, recommendation_engine)


@pytest.fixture
def sample_input():
    return RawHealthInput(
        age=55, sex="male", bmi=28.5, systolic_bp=140.0, diastolic_bp=88.0,
        total_cholesterol=250.0, hdl_cholesterol=45.0, ldl_cholesterol=160.0,
        fasting_glucose=130.0, serum_creatinine=1.2, alt_enzyme=45.0, ast_enzyme=40.0,
        daily_step_count=5000, sleep_duration=6.0, dietary_quality_score=4,
    )


def test_end_to_end_within_5_seconds(pipeline, sample_input):
    (preprocessor, prediction_engine, interaction_engine,
     simulation_engine, xai_module, recommendation_engine) = pipeline

    start = time.time()

    bundle = preprocessor.validate_and_transform(sample_input)
    raw_scores = prediction_engine.predict_all(bundle)
    interaction_result = interaction_engine.apply_rules(raw_scores, sample_input)
    adj = interaction_result.adjusted_scores

    sim = simulation_engine.project(adj)
    xai = xai_module.explain(bundle, adj, interaction_result.audit_log)
    recs = recommendation_engine.generate(adj)

    elapsed = time.time() - start
    assert elapsed < 5.0, f"End-to-end took {elapsed:.2f}s, exceeds 5s limit"

    # Verify outputs are complete
    assert 0 <= adj.heart <= 1
    assert 0 <= adj.kidney <= 1
    assert 0 <= adj.liver <= 1
    assert len(sim.months) == 12
    assert xai.heart is not None
    assert xai.kidney is not None
    assert xai.liver is not None
    assert 3 <= len(recs.items) <= 10


def test_parallel_inference_within_3_seconds(pipeline, sample_input):
    (preprocessor, prediction_engine, *_) = pipeline
    bundle = preprocessor.validate_and_transform(sample_input)

    start = time.time()
    raw_scores = prediction_engine.predict_all(bundle)
    elapsed = time.time() - start

    assert elapsed < 3.0, f"Parallel inference took {elapsed:.2f}s, exceeds 3s"
    assert 0 <= raw_scores.heart <= 1
    assert 0 <= raw_scores.kidney <= 1
    assert 0 <= raw_scores.liver <= 1


def test_high_risk_input_triggers_consultations(pipeline):
    (preprocessor, prediction_engine, interaction_engine,
     simulation_engine, xai_module, recommendation_engine) = pipeline

    # Craft an extreme input that should yield high risk
    high_risk = RawHealthInput(
        age=70, sex="male", bmi=35.0, systolic_bp=180.0, diastolic_bp=110.0,
        total_cholesterol=300.0, hdl_cholesterol=25.0, ldl_cholesterol=220.0,
        fasting_glucose=250.0, serum_creatinine=3.5, alt_enzyme=300.0, ast_enzyme=280.0,
        daily_step_count=1000, sleep_duration=5.0, dietary_quality_score=2,
    )
    bundle = preprocessor.validate_and_transform(high_risk)
    raw_scores = prediction_engine.predict_all(bundle)
    result = interaction_engine.apply_rules(raw_scores, high_risk)
    recs = recommendation_engine.generate(result.adjusted_scores)

    # Scores should be bounded
    assert 0 <= result.adjusted_scores.heart <= 1

    # Should have recommendations
    assert len(recs.items) >= 3
