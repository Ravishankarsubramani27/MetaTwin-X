"""Unit tests (example-based) for MetaTwin-X components."""
import pytest
import json
from pathlib import Path

from src.preprocessor import DataPreprocessor
from src.interaction_engine import InteractionEngine
from src.simulation_engine import SimulationEngine
from src.recommendation_engine import RecommendationEngine
from src.serializer import HealthProfileSerializer
from src.color_mapping import color_for_score
from src.models.data_types import (
    RawHealthInput, RawScores, AdjustedScores
)
from src.models.health_profile import HealthProfile
from src.exceptions import ValidationError, SchemaValidationError


preprocessor = DataPreprocessor()
interaction_engine = InteractionEngine()
simulation_engine = SimulationEngine()
recommendation_engine = RecommendationEngine()
serializer = HealthProfileSerializer()


def make_input(**kwargs) -> RawHealthInput:
    defaults = dict(
        age=45, sex="male", bmi=25.0, systolic_bp=120.0, diastolic_bp=80.0,
        total_cholesterol=190.0, hdl_cholesterol=55.0, ldl_cholesterol=110.0,
        fasting_glucose=95.0, serum_creatinine=1.0, alt_enzyme=25.0, ast_enzyme=22.0,
        daily_step_count=7000, sleep_duration=7.0, dietary_quality_score=6,
    )
    defaults.update(kwargs)
    return RawHealthInput(**defaults)


# ---------------------------------------------------------------------------
# DataPreprocessor unit tests
# ---------------------------------------------------------------------------

class TestDataPreprocessor:
    def test_egfr_formula_male(self):
        raw = make_input(serum_creatinine=1.0, age=45, sex="male")
        bundle = preprocessor.transform(raw)
        # eGFR for male, creatinine=1.0, age=45: expect ~90 range
        egfr_idx = bundle.kidney.feature_names.index("egfr")
        egfr_normalized = bundle.kidney.values[egfr_idx]
        assert 0.0 <= egfr_normalized <= 1.0

    def test_egfr_formula_female(self):
        raw = make_input(serum_creatinine=0.7, age=40, sex="female")
        bundle = preprocessor.transform(raw)
        egfr_idx = bundle.kidney.feature_names.index("egfr")
        assert bundle.kidney.values[egfr_idx] >= 0.0

    def test_chol_hdl_ratio_correct(self):
        raw = make_input(total_cholesterol=200.0, hdl_cholesterol=50.0)
        bundle = preprocessor.transform(raw)
        # ratio = 200/50 = 4.0
        ratio_idx = bundle.heart.feature_names.index("chol_hdl_ratio")
        assert bundle.heart.values[ratio_idx] >= 0.0

    def test_bmi_underweight(self):
        raw = make_input(bmi=16.0)
        bundle = preprocessor.transform(raw)
        names = bundle.heart.feature_names
        underweight_idx = names.index("bmi_underweight")
        assert bundle.heart.values[underweight_idx] == 1.0

    def test_bmi_obese(self):
        raw = make_input(bmi=35.0)
        bundle = preprocessor.transform(raw)
        names = bundle.heart.feature_names
        obese_idx = names.index("bmi_obese")
        assert bundle.heart.values[obese_idx] == 1.0

    def test_boundary_age_min(self):
        raw = make_input(age=0)
        result = preprocessor.validate(raw)
        assert not result.ok
        assert any(e.field_name == "age" for e in result.errors)

    def test_boundary_age_max(self):
        raw = make_input(age=121)
        result = preprocessor.validate(raw)
        assert not result.ok

    def test_all_optional_absent_imputed(self):
        raw = make_input(daily_step_count=None, sleep_duration=None, dietary_quality_score=None)
        bundle = preprocessor.transform(raw)
        import numpy as np
        for vec in [bundle.heart, bundle.kidney, bundle.liver]:
            assert not any(v is None for v in vec.values.tolist())
            assert not np.any(np.isnan(vec.values))

    def test_validate_and_transform_raises_on_invalid(self):
        raw = make_input(age=0)
        with pytest.raises(ValidationError):
            preprocessor.validate_and_transform(raw)


# ---------------------------------------------------------------------------
# InteractionEngine unit tests
# ---------------------------------------------------------------------------

class TestInteractionEngine:
    def test_ir01_fires(self):
        raw = make_input(fasting_glucose=130.0)
        raw_scores = RawScores(heart=0.4, kidney=0.7, liver=0.4)
        result = interaction_engine.apply_rules(raw_scores, raw)
        rule_ids = [e.rule_id for e in result.audit_log]
        assert "IR-01" in rule_ids
        assert result.adjusted_scores.kidney > 0.7

    def test_ir01_does_not_fire_low_kidney(self):
        raw = make_input(fasting_glucose=130.0)
        raw_scores = RawScores(heart=0.4, kidney=0.5, liver=0.4)
        result = interaction_engine.apply_rules(raw_scores, raw)
        assert "IR-01" not in [e.rule_id for e in result.audit_log]

    def test_ir02_fires(self):
        raw = make_input(total_cholesterol=260.0)
        raw_scores = RawScores(heart=0.6, kidney=0.3, liver=0.3)
        result = interaction_engine.apply_rules(raw_scores, raw)
        assert "IR-02" in [e.rule_id for e in result.audit_log]
        assert result.adjusted_scores.heart > 0.6

    def test_ir02_does_not_fire_low_chol(self):
        raw = make_input(total_cholesterol=200.0)
        raw_scores = RawScores(heart=0.6, kidney=0.3, liver=0.3)
        result = interaction_engine.apply_rules(raw_scores, raw)
        assert "IR-02" not in [e.rule_id for e in result.audit_log]

    def test_ir03_fires_adjusts_heart_and_kidney(self):
        raw = make_input()
        raw_scores = RawScores(heart=0.4, kidney=0.4, liver=0.6)
        result = interaction_engine.apply_rules(raw_scores, raw)
        audit_ids = [e.rule_id for e in result.audit_log]
        assert "IR-03" in audit_ids
        assert result.adjusted_scores.heart > 0.4
        assert result.adjusted_scores.kidney > 0.4

    def test_no_rules_fire_scores_unchanged(self):
        raw = make_input(fasting_glucose=80.0, total_cholesterol=180.0)
        raw_scores = RawScores(heart=0.3, kidney=0.3, liver=0.3)
        result = interaction_engine.apply_rules(raw_scores, raw)
        assert len(result.audit_log) == 0
        assert abs(result.adjusted_scores.heart - 0.3) < 1e-9

    def test_cap_at_1_0(self):
        raw = make_input(fasting_glucose=200.0, total_cholesterol=400.0)
        raw_scores = RawScores(heart=0.98, kidney=0.98, liver=0.98)
        result = interaction_engine.apply_rules(raw_scores, raw)
        assert result.adjusted_scores.heart <= 1.0
        assert result.adjusted_scores.kidney <= 1.0
        assert result.adjusted_scores.liver <= 1.0

    def test_audit_log_structure(self):
        raw = make_input(fasting_glucose=130.0)
        raw_scores = RawScores(heart=0.4, kidney=0.7, liver=0.4)
        result = interaction_engine.apply_rules(raw_scores, raw)
        for entry in result.audit_log:
            assert entry.rule_id.startswith("IR-")
            assert entry.organ_affected in ("heart", "kidney", "liver")
            assert isinstance(entry.adjustment, float)
            assert entry.adjusted_score == pytest.approx(
                min(entry.original_score + entry.adjustment, 1.0), abs=1e-6
            )


# ---------------------------------------------------------------------------
# SimulationEngine unit tests
# ---------------------------------------------------------------------------

class TestSimulationEngine:
    def test_baseline_12_months(self):
        scores = AdjustedScores(heart=0.4, kidney=0.3, liver=0.2)
        result = simulation_engine.project(scores)
        assert len(result.heart_trajectory) == 12
        assert len(result.kidney_trajectory) == 12
        assert len(result.liver_trajectory) == 12
        assert result.months == list(range(1, 13))

    def test_logistic_growth_non_decreasing(self):
        scores = AdjustedScores(heart=0.5, kidney=0.5, liver=0.5)
        result = simulation_engine.project(scores)
        # Logistic growth with positive rate is non-decreasing
        for i in range(11):
            assert result.heart_trajectory[i+1] >= result.heart_trajectory[i] - 1e-9

    def test_zero_score_stays_zero(self):
        scores = AdjustedScores(heart=0.0, kidney=0.0, liver=0.0)
        result = simulation_engine.project(scores)
        # Logistic: 0 * (1-0) = 0, so stays 0
        assert all(abs(v) < 1e-9 for v in result.heart_trajectory)

    def test_label_default_baseline(self):
        scores = AdjustedScores(heart=0.3, kidney=0.3, liver=0.3)
        result = simulation_engine.project(scores)
        assert result.scenario_label == "Baseline"


# ---------------------------------------------------------------------------
# RecommendationEngine unit tests
# ---------------------------------------------------------------------------

class TestRecommendationEngine:
    def test_high_heart_triggers_cardio_consult(self):
        scores = AdjustedScores(heart=0.75, kidney=0.2, liver=0.2)
        recs = recommendation_engine.generate(scores)
        texts = [r.text.lower() for r in recs.items]
        assert any("cardiovascula" in t for t in texts)
        categories = [r.category for r in recs.items]
        assert "clinical_consultation" in categories

    def test_high_kidney_triggers_nephro_consult(self):
        scores = AdjustedScores(heart=0.2, kidney=0.75, liver=0.2)
        recs = recommendation_engine.generate(scores)
        texts = [r.text.lower() for r in recs.items]
        assert any("nephrolog" in t or "kidney" in t for t in texts)

    def test_high_liver_triggers_hepato_consult(self):
        scores = AdjustedScores(heart=0.2, kidney=0.2, liver=0.75)
        recs = recommendation_engine.generate(scores)
        texts = [r.text.lower() for r in recs.items]
        assert any("hepatolog" in t or "liver" in t for t in texts)

    def test_minimum_3_recs(self):
        scores = AdjustedScores(heart=0.0, kidney=0.0, liver=0.0)
        recs = recommendation_engine.generate(scores)
        assert len(recs.items) >= 3

    def test_maximum_10_recs(self):
        scores = AdjustedScores(heart=1.0, kidney=1.0, liver=1.0)
        recs = recommendation_engine.generate(scores)
        assert len(recs.items) <= 10

    def test_sorted_by_priority(self):
        scores = AdjustedScores(heart=0.8, kidney=0.5, liver=0.3)
        recs = recommendation_engine.generate(scores)
        priorities = [r.priority for r in recs.items]
        assert priorities == sorted(priorities, reverse=True)


# ---------------------------------------------------------------------------
# HealthProfileSerializer unit tests
# ---------------------------------------------------------------------------

class TestHealthProfileSerializer:
    def _make_profile(self, **kwargs):
        raw = make_input(**kwargs)
        scores = AdjustedScores(heart=0.3, kidney=0.25, liver=0.2)
        return HealthProfile(inputs=raw, risk_scores=scores)

    def test_valid_round_trip(self):
        profile = self._make_profile()
        d = serializer.serialize(profile)
        pp = serializer.pretty_print(d)
        recovered = serializer.parse(pp)
        assert recovered.inputs.age == profile.inputs.age
        assert recovered.inputs.sex == profile.inputs.sex
        assert abs(recovered.risk_scores.heart - profile.risk_scores.heart) < 1e-9

    def test_pretty_print_2_space_indent(self):
        profile = self._make_profile()
        pp = serializer.pretty_print(serializer.serialize(profile))
        # Must have 2-space indented lines
        assert '  "schema_version"' in pp

    def test_pretty_print_sorted_keys(self):
        profile = self._make_profile()
        d = serializer.serialize(profile)
        pp = serializer.pretty_print(d)
        top_keys = list(json.loads(pp).keys())
        assert top_keys == sorted(top_keys)

    def test_export_import_bytes(self):
        profile = self._make_profile()
        b = serializer.export_to_file(profile)
        assert isinstance(b, bytes)
        recovered = serializer.import_from_file(b)
        assert recovered.inputs.age == profile.inputs.age

    def test_missing_required_field_raises(self):
        bad = '{"schema_version": "1.0", "exported_at": "2024-01-01T00:00:00Z", "inputs": {}, "risk_scores": {"heart": 0.5, "kidney": 0.3, "liver": 0.2}}'
        with pytest.raises(SchemaValidationError):
            serializer.parse(bad)

    def test_extra_property_raises(self):
        profile = self._make_profile()
        d = serializer.serialize(profile)
        d["intruder"] = "value"
        with pytest.raises(SchemaValidationError):
            serializer.parse(json.dumps(d))

    def test_invalid_json_raises(self):
        with pytest.raises(SchemaValidationError):
            serializer.parse("{not: json}")

    def test_out_of_range_value_raises(self):
        profile = self._make_profile()
        d = serializer.serialize(profile)
        d["inputs"]["age"] = 999
        with pytest.raises(SchemaValidationError):
            serializer.parse(json.dumps(d))
