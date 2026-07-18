"""pytest conftest: Hypothesis strategies, shared fixtures."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import numpy as np
from hypothesis import strategies as st
from hypothesis.strategies import composite

from src.models.data_types import (
    RawHealthInput, FeatureVector, AdjustedScores, RawScores, Organ
)
from src.preprocessor import DataPreprocessor
from src.prediction_engine import PredictionEngine
from src.interaction_engine import InteractionEngine
from src.simulation_engine import SimulationEngine
from src.xai_module import XAIModule
from src.recommendation_engine import RecommendationEngine
from src.serializer import HealthProfileSerializer


# ---------------------------------------------------------------------------
# Hypothesis strategies
# ---------------------------------------------------------------------------

@composite
def raw_health_inputs(draw, force_valid=True):
    """Strategy that generates valid RawHealthInput objects."""
    age = draw(st.integers(min_value=1, max_value=120))
    sex = draw(st.sampled_from(["male", "female"]))
    bmi = draw(st.floats(min_value=10.0, max_value=70.0, allow_nan=False, allow_infinity=False))
    systolic_bp = draw(st.floats(min_value=60.0, max_value=250.0, allow_nan=False))
    diastolic_bp = draw(st.floats(min_value=40.0, max_value=150.0, allow_nan=False))
    total_cholesterol = draw(st.floats(min_value=50.0, max_value=600.0, allow_nan=False))
    hdl_cholesterol = draw(st.floats(min_value=10.0, max_value=150.0, allow_nan=False))
    ldl_cholesterol = draw(st.floats(min_value=10.0, max_value=400.0, allow_nan=False))
    fasting_glucose = draw(st.floats(min_value=40.0, max_value=600.0, allow_nan=False))
    serum_creatinine = draw(st.floats(min_value=0.1, max_value=20.0, allow_nan=False))
    alt_enzyme = draw(st.floats(min_value=1.0, max_value=2000.0, allow_nan=False))
    ast_enzyme = draw(st.floats(min_value=1.0, max_value=2000.0, allow_nan=False))
    daily_step_count = draw(st.one_of(st.none(), st.integers(min_value=0, max_value=50000)))
    sleep_duration = draw(st.one_of(st.none(), st.floats(min_value=0.0, max_value=24.0, allow_nan=False)))
    dietary_quality_score = draw(st.one_of(st.none(), st.integers(min_value=1, max_value=10)))

    return RawHealthInput(
        age=age, sex=sex, bmi=bmi,
        systolic_bp=systolic_bp, diastolic_bp=diastolic_bp,
        total_cholesterol=total_cholesterol, hdl_cholesterol=hdl_cholesterol,
        ldl_cholesterol=ldl_cholesterol, fasting_glucose=fasting_glucose,
        serum_creatinine=serum_creatinine, alt_enzyme=alt_enzyme, ast_enzyme=ast_enzyme,
        daily_step_count=daily_step_count, sleep_duration=sleep_duration,
        dietary_quality_score=dietary_quality_score,
    )


@composite
def adjusted_scores_strategy(draw):
    h = draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False))
    k = draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False))
    l = draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False))
    return AdjustedScores(heart=h, kidney=k, liver=l)


@composite
def raw_scores_strategy(draw):
    h = draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False))
    k = draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False))
    l = draw(st.floats(min_value=0.0, max_value=1.0, allow_nan=False))
    return RawScores(heart=h, kidney=k, liver=l)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def preprocessor():
    return DataPreprocessor()


@pytest.fixture(scope="session")
def prediction_engine():
    models_dir = Path(__file__).parent.parent / "models"
    return PredictionEngine(models_dir)


@pytest.fixture(scope="session")
def interaction_engine():
    return InteractionEngine()


@pytest.fixture(scope="session")
def simulation_engine():
    return SimulationEngine()


@pytest.fixture(scope="session")
def xai_module(prediction_engine):
    return XAIModule(prediction_engine)


@pytest.fixture(scope="session")
def recommendation_engine():
    return RecommendationEngine()


@pytest.fixture(scope="session")
def serializer():
    return HealthProfileSerializer()


@pytest.fixture
def valid_raw_input():
    return RawHealthInput(
        age=45, sex="male", bmi=26.5,
        systolic_bp=125.0, diastolic_bp=82.0,
        total_cholesterol=210.0, hdl_cholesterol=55.0, ldl_cholesterol=130.0,
        fasting_glucose=100.0, serum_creatinine=1.0,
        alt_enzyme=30.0, ast_enzyme=25.0,
        daily_step_count=7000, sleep_duration=7.0, dietary_quality_score=6,
    )


@pytest.fixture
def feature_bundle(preprocessor, valid_raw_input):
    return preprocessor.transform(valid_raw_input)
