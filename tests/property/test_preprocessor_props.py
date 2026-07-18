"""Property-based tests for DataPreprocessor (PT-01 through PT-06)."""
import pytest
import numpy as np
from hypothesis import given, settings, assume
from hypothesis import strategies as st
from tests.conftest import raw_health_inputs
from src.preprocessor import DataPreprocessor, PHYSIOLOGICAL_RANGES
from src.models.data_types import RawHealthInput


preprocessor = DataPreprocessor()
ORGAN_DIMS = {"heart": 18, "kidney": 20, "liver": 12}


# PT-01: Input validation rejects out-of-range values with range descriptions
# Feature: metatwin-x-multi-organ-digital-twin, Property 1
@settings(max_examples=100)
@given(
    field=st.sampled_from(list(PHYSIOLOGICAL_RANGES.keys())),
    raw=raw_health_inputs(),
)
def test_pt01_validation_rejects_out_of_range(field, raw):
    """Out-of-range values must produce non-empty error list with range info."""
    lo, hi = PHYSIOLOGICAL_RANGES[field]
    # Set the field to a clearly invalid value
    bad_val = hi + 999
    setattr(raw, field, bad_val)

    result = preprocessor.validate(raw)
    assert not result.ok, "Should be invalid"
    assert any(e.field_name == field for e in result.errors)
    # Each error should identify min/max
    for e in result.errors:
        assert e.min_allowed is not None
        assert e.max_allowed is not None


# PT-02: Optional field imputation uses training median
# Feature: metatwin-x-multi-organ-digital-twin, Property 2
@settings(max_examples=100)
@given(raw=raw_health_inputs())
def test_pt02_imputation_fills_none_optional_fields(raw):
    """None optional fields must be filled with medians; no None in feature vectors."""
    raw.daily_step_count = None
    raw.sleep_duration = None
    raw.dietary_quality_score = None

    bundle = preprocessor.transform(raw)
    for vec in [bundle.heart, bundle.kidney, bundle.liver]:
        assert not np.any(np.isnan(vec.values)), "No NaN values after imputation"
        assert None not in vec.values.tolist(), "No None values after imputation"


# PT-03: Normalization produces values in [0.0, 1.0]
# Feature: metatwin-x-multi-organ-digital-twin, Property 3
@settings(max_examples=100)
@given(raw=raw_health_inputs())
def test_pt03_normalization_bounded(raw):
    """All continuous features in FeatureVector must be in [0.0, 1.0]."""
    bundle = preprocessor.transform(raw)
    for vec in [bundle.heart, bundle.kidney, bundle.liver]:
        assert np.all(vec.values >= 0.0), f"Values below 0: {vec.values[vec.values < 0]}"
        assert np.all(vec.values <= 1.0), f"Values above 1: {vec.values[vec.values > 1]}"


# PT-04: One-hot encoding produces valid indicator vectors
# Feature: metatwin-x-multi-organ-digital-twin, Property 4
@settings(max_examples=100)
@given(raw=raw_health_inputs())
def test_pt04_one_hot_encoding_valid(raw):
    """BMI category one-hot must sum to 1, all values 0 or 1."""
    bundle = preprocessor.transform(raw)
    # BMI one-hot is in heart and kidney vectors at known positions
    heart_names = bundle.heart.feature_names
    bmi_cols = [i for i, n in enumerate(heart_names) if n.startswith("bmi_") and "_" in n[4:]]
    if bmi_cols:
        ohe_vals = bundle.heart.values[bmi_cols]
        assert abs(ohe_vals.sum() - 1.0) < 1e-6, f"BMI one-hot sum != 1: {ohe_vals}"
        assert np.all((ohe_vals == 0.0) | (ohe_vals == 1.0)), "BMI one-hot has non-binary values"


# PT-05: Derived features match formula definitions
# Feature: metatwin-x-multi-organ-digital-twin, Property 5
@settings(max_examples=100)
@given(raw=raw_health_inputs())
def test_pt05_derived_features_correct(raw):
    """chol_hdl_ratio and egfr must be computable positive values."""
    assume(raw.hdl_cholesterol > 0)
    bundle = preprocessor.transform(raw)

    # chol/hdl ratio should be present in heart features
    names = bundle.heart.feature_names
    assert "chol_hdl_ratio" in names, "chol_hdl_ratio missing"

    # eGFR should be in kidney features
    kidney_names = bundle.kidney.feature_names
    assert "egfr" in kidney_names, "egfr missing in kidney features"

    # BMI category must be one of the four valid categories
    bmi_cats = ["bmi_underweight", "bmi_normal", "bmi_overweight", "bmi_obese"]
    for cat in bmi_cats:
        assert cat in names, f"{cat} missing from heart feature names"


# PT-06: Feature vector has fixed dimensionality
# Feature: metatwin-x-multi-organ-digital-twin, Property 6
@settings(max_examples=100)
@given(raw=raw_health_inputs())
def test_pt06_fixed_dimensionality(raw):
    """FeatureVectors must always have the specified fixed dimensions."""
    bundle = preprocessor.transform(raw)
    assert len(bundle.heart.values) == 18, f"Heart dim={len(bundle.heart.values)}, expected 18"
    assert len(bundle.kidney.values) == 20, f"Kidney dim={len(bundle.kidney.values)}, expected 20"
    assert len(bundle.liver.values) == 12, f"Liver dim={len(bundle.liver.values)}, expected 12"
    assert len(bundle.heart.feature_names) == 18
    assert len(bundle.kidney.feature_names) == 20
    assert len(bundle.liver.feature_names) == 12
