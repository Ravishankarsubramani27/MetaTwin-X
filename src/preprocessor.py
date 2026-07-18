"""Data preprocessor: validation, imputation, normalization, derived features."""
from __future__ import annotations
from pathlib import Path
import numpy as np
import joblib

from src.models.data_types import (
    RawHealthInput, FeatureVector, FeatureBundle, Organ,
    ValidationResult, FieldError,
)
from src.exceptions import ValidationError

# ── Physiological validation ranges ───────────────────────────────────────
PHYSIOLOGICAL_RANGES = {
    "age":                   (1,    120),
    "bmi":                   (10.0, 70.0),
    "systolic_bp":           (60,   250),
    "diastolic_bp":          (40,   150),
    "total_cholesterol":     (50,   600),
    "hdl_cholesterol":       (10,   150),
    "ldl_cholesterol":       (10,   400),
    "fasting_glucose":       (40,   600),
    "serum_creatinine":      (0.1,  20.0),
    "alt_enzyme":            (1,    2000),
    "ast_enzyme":            (1,    2000),
    "daily_step_count":      (0,    50000),
    "sleep_duration":        (0.0,  24.0),
    "dietary_quality_score": (1,    10),
    # Smartwatch / wearable (optional)
    "heart_rate_resting":    (30,   200),
    "heart_rate_max":        (60,   220),
    "hrv_ms":                (5,    200),
    "spo2_pct":              (80,   100),
    "active_calories":       (0,    5000),
    "stress_score":          (0,    100),
}

# ── Default medians (fallback when imputer.pkl not present) ───────────────
DEFAULT_MEDIANS = {
    "daily_step_count":      7000,
    "sleep_duration":        7.0,
    "dietary_quality_score": 5,
    # Smartwatch defaults (population medians)
    "heart_rate_resting":    68,
    "heart_rate_max":        150,
    "hrv_ms":                42.0,
    "spo2_pct":              98.0,
    "active_calories":       300,
    "stress_score":          30,
}

# ── Min-max normalization ranges ──────────────────────────────────────────
FEATURE_RANGES = {
    "age":                   (1,    120),
    "bmi":                   (10.0, 70.0),
    "systolic_bp":           (60,   250),
    "diastolic_bp":          (40,   150),
    "total_cholesterol":     (50,   600),
    "hdl_cholesterol":       (10,   150),
    "ldl_cholesterol":       (10,   400),
    "fasting_glucose":       (40,   600),
    "serum_creatinine":      (0.1,  20.0),
    "alt_enzyme":            (1,    2000),
    "ast_enzyme":            (1,    2000),
    "daily_step_count":      (0,    50000),
    "sleep_duration":        (0.0,  24.0),
    "dietary_quality_score": (1,    10),
    "chol_hdl_ratio":        (0.33, 60.0),
    "egfr":                  (1.0,  200.0),
    # Smartwatch
    "heart_rate_resting":    (30,   200),
    "heart_rate_max":        (60,   220),
    "hrv_ms":                (5,    200),
    "spo2_pct":              (80,   100),
    "active_calories":       (0,    5000),
    "stress_score":          (0,    100),
}

BMI_CATEGORIES = ["underweight", "normal", "overweight", "obese"]


def _normalize(value: float, lo: float, hi: float) -> float:
    if hi == lo:
        return 0.0
    return float(np.clip((value - lo) / (hi - lo), 0.0, 1.0))


def _bmi_category(bmi: float) -> str:
    if bmi < 18.5:  return "underweight"
    if bmi < 25.0:  return "normal"
    if bmi < 30.0:  return "overweight"
    return "obese"


def _egfr(creatinine: float, age: int, is_female: bool) -> float:
    """CKD-EPI eGFR formula."""
    kappa = 0.7 if is_female else 0.9
    alpha = -0.329 if is_female else -0.411
    ratio = creatinine / kappa
    result = (141.0
              * (min(ratio, 1.0) ** alpha)
              * (max(ratio, 1.0) ** -1.209)
              * (0.993 ** age))
    if is_female:
        result *= 1.018
    return max(result, 1.0)


class DataPreprocessor:
    def __init__(self, preprocessor_dir: Path = None):
        self._medians = dict(DEFAULT_MEDIANS)
        if preprocessor_dir:
            imp_path = Path(preprocessor_dir) / "imputer.pkl"
            if imp_path.exists():
                try:
                    imputer = joblib.load(imp_path)
                    if isinstance(imputer, dict):
                        self._medians.update(imputer)
                except Exception:
                    pass

    # ── Validation ────────────────────────────────────────────────────────
    def validate(self, raw: RawHealthInput) -> ValidationResult:
        errors: list[FieldError] = []
        for field_name, (lo, hi) in PHYSIOLOGICAL_RANGES.items():
            val = getattr(raw, field_name, None)
            if val is None:
                continue  # optional fields may be None
            try:
                val = float(val)
            except (TypeError, ValueError):
                errors.append(FieldError(field_name, val, lo, hi))
                continue
            if not (lo <= val <= hi):
                errors.append(FieldError(field_name, val, lo, hi))
        if raw.sex not in ("male", "female"):
            errors.append(FieldError("sex", raw.sex, "male", "female"))
        return ValidationResult(ok=len(errors) == 0, errors=errors)

    # ── Transform ─────────────────────────────────────────────────────────
    def transform(self, raw: RawHealthInput) -> FeatureBundle:
        # Impute optional fields
        steps = (raw.daily_step_count if raw.daily_step_count is not None
                 else self._medians["daily_step_count"])
        sleep = (raw.sleep_duration if raw.sleep_duration is not None
                 else self._medians["sleep_duration"])
        diet  = (raw.dietary_quality_score if raw.dietary_quality_score is not None
                 else self._medians["dietary_quality_score"])

        # ── Smartwatch / wearable imputation ──────────────────────────
        hr_rest  = (raw.heart_rate_resting if raw.heart_rate_resting is not None
                    else self._medians["heart_rate_resting"])
        hr_max   = (raw.heart_rate_max if raw.heart_rate_max is not None
                    else self._medians["heart_rate_max"])
        hrv      = (raw.hrv_ms if raw.hrv_ms is not None
                    else self._medians["hrv_ms"])
        spo2     = (raw.spo2_pct if raw.spo2_pct is not None
                    else self._medians["spo2_pct"])
        act_cal  = (raw.active_calories if raw.active_calories is not None
                    else self._medians["active_calories"])
        stress   = (raw.stress_score if raw.stress_score is not None
                    else self._medians["stress_score"])

        is_female  = raw.sex == "female"
        sex_m      = 0.0 if is_female else 1.0
        egfr_val   = _egfr(raw.serum_creatinine, raw.age, is_female)
        chol_ratio = raw.total_cholesterol / max(raw.hdl_cholesterol, 0.01)
        bmi_cat    = _bmi_category(raw.bmi)
        bmi_ohe    = [1.0 if bmi_cat == c else 0.0 for c in BMI_CATEGORIES]

        def n(val, key):
            lo, hi = FEATURE_RANGES[key]
            return _normalize(float(val), lo, hi)

        age_n   = n(raw.age,               "age")
        bmi_n   = n(raw.bmi,               "bmi")
        sbp_n   = n(raw.systolic_bp,       "systolic_bp")
        chol_n  = n(raw.total_cholesterol, "total_cholesterol")
        gluc_n  = n(raw.fasting_glucose,   "fasting_glucose")
        creat_n = n(raw.serum_creatinine,  "serum_creatinine")
        alt_n   = n(raw.alt_enzyme,        "alt_enzyme")
        ast_n   = n(raw.ast_enzyme,        "ast_enzyme")
        step_n  = n(steps,                 "daily_step_count")
        sleep_n = n(sleep,                 "sleep_duration")
        diet_n  = n(diet,                  "dietary_quality_score")
        ratio_n = n(chol_ratio,            "chol_hdl_ratio")
        egfr_n  = n(egfr_val,              "egfr")

        # ── Smartwatch normalised features ────────────────────────────
        hr_rest_n = n(hr_rest, "heart_rate_resting")
        hrv_n     = n(hrv,     "hrv_ms")
        spo2_n    = n(spo2,    "spo2_pct")
        act_n     = n(act_cal, "active_calories")
        stress_n  = n(stress,  "stress_score")

        # Composite wearable features
        # Cardiac stress: high HR + low HRV = higher stress
        cardiac_stress = float(np.clip(hr_rest_n * (1.0 - hrv_n), 0.0, 1.0))
        # Oxygen efficiency: high SpO2 + low stress = better
        oxy_efficiency = float(np.clip(spo2_n * (1.0 - stress_n * 0.5), 0.0, 1.0))
        # Activity composite
        activity_score = float(np.clip((step_n + act_n) / 2.0, 0.0, 1.0))

        # ── Heart (16 features — Cleveland + smartwatch) ──────────────────
        fbs_flag = 1.0 if raw.fasting_glucose > 120 else 0.0
        heart_vals = np.array([
            age_n, sex_m, sbp_n, sbp_n, chol_n, fbs_flag,
            0.0, step_n, diet_n, ratio_n, sleep_n, creat_n, bmi_n,
            cardiac_stress, hrv_n, spo2_n,
        ], dtype=np.float32)
        heart_names = [
            "age", "sex", "cp", "trestbps", "chol", "fbs",
            "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal",
            "cardiac_stress_index", "hrv_normalised", "spo2_normalised",
        ]

        # ── Kidney (22 features — UCI CKD + smartwatch) ───────────────────
        kidney_vals = np.array([
            age_n, sbp_n, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            gluc_n, creat_n, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
            egfr_n, bmi_n,
            oxy_efficiency, activity_score,
        ], dtype=np.float32)
        kidney_names = [
            "age", "bp", "sg", "al", "su", "rbc", "pc", "pcc", "ba",
            "bgr", "bu", "sc", "sod", "pot", "hemo", "pcv", "wbcc", "rbcc",
            "egfr", "bmi",
            "oxygen_efficiency", "activity_score",
        ]

        # ── Liver (13 features — ILPD + smartwatch) ───────────────────────
        liver_vals = np.array([
            age_n, sex_m, chol_n, chol_n * 0.3, sbp_n,
            alt_n, ast_n, 0.5, 0.5, ratio_n, bmi_n, diet_n,
            stress_n,
        ], dtype=np.float32)
        liver_names = [
            "age", "gender", "total_bilirubin", "direct_bilirubin",
            "alkaline_phosphotase", "alamine_aminotransferase",
            "aspartate_aminotransferase", "total_proteins", "albumin",
            "albumin_globulin_ratio", "bmi", "dietary_quality_score",
            "stress_score_normalised",
        ]

        return FeatureBundle(
            heart=FeatureVector(Organ.HEART,  heart_vals,  heart_names),
            kidney=FeatureVector(Organ.KIDNEY, kidney_vals, kidney_names),
            liver=FeatureVector(Organ.LIVER,  liver_vals,  liver_names),
            raw_inputs=raw,
        )

    def validate_and_transform(self, raw: RawHealthInput) -> FeatureBundle:
        result = self.validate(raw)
        if not result.ok:
            raise ValidationError(result.errors)
        return self.transform(raw)
