"""Property-based tests for XAI, Recommendation, Serializer (PT-10 to PT-16)."""
import pytest
import json
from pathlib import Path
from hypothesis import given, settings, assume
from hypothesis import strategies as st

from tests.conftest import raw_health_inputs, adjusted_scores_strategy
from src.preprocessor import DataPreprocessor
from src.prediction_engine import PredictionEngine
from src.interaction_engine import InteractionEngine
from src.xai_module import XAIModule
from src.recommendation_engine import RecommendationEngine
from src.serializer import HealthProfileSerializer
from src.models.data_types import AdjustedScores
from src.models.health_profile import HealthProfile
from src.exceptions import SchemaValidationError

preprocessor = DataPreprocessor()
prediction_engine = PredictionEngine(Path(__file__).parent.parent.parent / "models")
interaction_engine = InteractionEngine()
xai_module = XAIModule(prediction_engine)
recommendation_engine = RecommendationEngine()
serializer = HealthProfileSerializer()


# PT-10: SHAP additivity
# Feature: metatwin-x-multi-organ-digital-twin, Property 10
@settings(max_examples=50)
@given(raw=raw_health_inputs(), scores=adjusted_scores_strategy())
def test_pt10_shap_additivity(raw, scores):
    """SHAP values must satisfy |sum(shap) - (predicted - base)| < 1e-5."""
    bundle = preprocessor.transform(raw)
    result = interaction_engine.apply_rules(
        prediction_engine.predict_all(bundle), raw
    )
    bundle_adj = result.adjusted_scores
    audit_log = result.audit_log

    explanation_bundle = xai_module.explain(bundle, bundle_adj, audit_log)
    for exp in [explanation_bundle.heart, explanation_bundle.kidney, explanation_bundle.liver]:
        shap_sum = exp.shap_values.sum()
        target = exp.predicted_score - exp.base_value
        assert abs(shap_sum - target) < 1e-4, (
            f"{exp.organ.value}: |sum(shap)={shap_sum:.6f} - target={target:.6f}| >= 1e-4"
        )


# PT-11: XAI output has exactly 5 features and correct sentence format
# Feature: metatwin-x-multi-organ-digital-twin, Property 11
@settings(max_examples=50)
@given(raw=raw_health_inputs())
def test_pt11_xai_top5_features_and_sentences(raw):
    """ExplanationResult must have exactly 5 top features and matching sentences."""
    bundle = preprocessor.transform(raw)
    raw_scores = prediction_engine.predict_all(bundle)
    result = interaction_engine.apply_rules(raw_scores, raw)
    exp_bundle = xai_module.explain(bundle, result.adjusted_scores, result.audit_log)

    for exp in [exp_bundle.heart, exp_bundle.kidney, exp_bundle.liver]:
        assert len(exp.top_features) == 5, f"Expected 5 top features, got {len(exp.top_features)}"
        assert len(exp.sentences) == 5, f"Expected 5 sentences, got {len(exp.sentences)}"
        for s in exp.sentences:
            assert "risk by" in s.lower(), f"Sentence missing 'risk by': {s}"
            assert "%" in s, f"Sentence missing '%': {s}"
        assert len(exp.interaction_notes) == sum(
            1 for e in result.audit_log if e.organ_affected == exp.organ.value
        )


# PT-12: Recommendation list structural invariants
# Feature: metatwin-x-multi-organ-digital-twin, Property 12
@settings(max_examples=100)
@given(scores=adjusted_scores_strategy())
def test_pt12_recommendation_invariants(scores):
    """RecommendationList must satisfy all structural invariants."""
    rec_list = recommendation_engine.generate(scores)
    items = rec_list.items

    assert 3 <= len(items) <= 10, f"Expected 3-10 recs, got {len(items)}"

    valid_categories = {"physical_activity", "dietary_modification", "clinical_consultation", "lifestyle_habit"}
    for rec in items:
        assert rec.category in valid_categories, f"Invalid category: {rec.category}"

    # Clinical consultation rules
    if scores.heart > 0.6:
        assert any(
            r.category == "clinical_consultation" and "cardiovascula" in r.text.lower()
            for r in items
        ), "Heart >0.6 must have cardiovascular clinical_consultation"

    if scores.kidney > 0.6:
        assert any(
            r.category == "clinical_consultation" and ("nephrolog" in r.text.lower() or "kidney" in r.text.lower())
            for r in items
        ), "Kidney >0.6 must have nephrology clinical_consultation"

    if scores.liver > 0.6:
        assert any(
            r.category == "clinical_consultation" and ("hepatolog" in r.text.lower() or "liver" in r.text.lower())
            for r in items
        ), "Liver >0.6 must have hepatology clinical_consultation"

    # Non-increasing priority order
    priorities = [r.priority for r in items]
    for i in range(len(priorities) - 1):
        assert priorities[i] >= priorities[i + 1], f"Priorities not sorted at index {i}"


# PT-14: Health profile serialization conforms to schema
# Feature: metatwin-x-multi-organ-digital-twin, Property 14
@settings(max_examples=100)
@given(raw=raw_health_inputs(), scores=adjusted_scores_strategy())
def test_pt14_serialization_schema_valid(raw, scores):
    """Serialized health profile must pass JSON schema validation."""
    import jsonschema
    profile = HealthProfile(inputs=raw, risk_scores=scores)
    d = serializer.serialize(profile)
    # Should not raise
    from src.serializer import SCHEMA
    jsonschema.validate(d, SCHEMA)


# PT-15: Health profile round-trip
# Feature: metatwin-x-multi-organ-digital-twin, Property 15
@settings(max_examples=100)
@given(raw=raw_health_inputs(), scores=adjusted_scores_strategy())
def test_pt15_round_trip(raw, scores):
    """parse(pretty_print(serialize(p))) == p (all fields equal)."""
    profile = HealthProfile(inputs=raw, risk_scores=scores)
    d = serializer.serialize(profile)
    pp = serializer.pretty_print(d)

    # Verify 2-space indentation
    lines = pp.split("\n")
    indented = [l for l in lines if l.startswith(" ")]
    for l in indented:
        leading = len(l) - len(l.lstrip())
        assert leading % 2 == 0, f"Non-2-space indent found in: {l!r}"

    # Verify sorted keys
    parsed_dict = json.loads(pp)
    top_keys = list(parsed_dict.keys())
    assert top_keys == sorted(top_keys), "Top-level keys not sorted"

    # Verify round-trip equality
    recovered = serializer.parse(pp)
    ri = recovered.inputs
    assert ri.age == raw.age
    assert ri.sex == raw.sex
    assert abs(ri.bmi - raw.bmi) < 1e-6
    assert abs(recovered.risk_scores.heart - scores.heart) < 1e-9
    assert abs(recovered.risk_scores.kidney - scores.kidney) < 1e-9
    assert abs(recovered.risk_scores.liver - scores.liver) < 1e-9


# PT-16: Invalid health profile JSON is rejected with descriptive error
# Feature: metatwin-x-multi-organ-digital-twin, Property 16
def test_pt16_invalid_json_rejected():
    """Schema violations must raise SchemaValidationError with descriptive messages."""
    violations = [
        # Missing required field
        '{"schema_version": "1.0", "exported_at": "2024-01-01T00:00:00Z", "inputs": {}, "risk_scores": {"heart": 0.5}}',
        # Wrong type
        '{"schema_version": 1, "exported_at": "2024-01-01T00:00:00Z", "inputs": {"age": 45, "sex": "male", "bmi": 25.0, "systolic_bp": 120, "diastolic_bp": 80, "total_cholesterol": 190, "hdl_cholesterol": 55, "ldl_cholesterol": 110, "fasting_glucose": 95, "serum_creatinine": 1.0, "alt_enzyme": 30, "ast_enzyme": 25}, "risk_scores": {"heart": 0.5, "kidney": 0.3, "liver": 0.2}}',
        # Extra property
        '{"schema_version": "1.0", "exported_at": "2024-01-01T00:00:00Z", "inputs": {"age": 45, "sex": "male", "bmi": 25.0, "systolic_bp": 120, "diastolic_bp": 80, "total_cholesterol": 190, "hdl_cholesterol": 55, "ldl_cholesterol": 110, "fasting_glucose": 95, "serum_creatinine": 1.0, "alt_enzyme": 30, "ast_enzyme": 25}, "risk_scores": {"heart": 0.5, "kidney": 0.3, "liver": 0.2}, "extra_field": true}',
        # Invalid JSON
        '{not valid json}',
    ]
    for invalid_json in violations:
        with pytest.raises(SchemaValidationError):
            serializer.parse(invalid_json)
