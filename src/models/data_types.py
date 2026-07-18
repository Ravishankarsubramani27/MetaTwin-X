"""Core data types for MetaTwin-X."""
from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Any
import numpy as np


class Organ(str, Enum):
    HEART  = "heart"
    KIDNEY = "kidney"
    LIVER  = "liver"


@dataclass
class RawHealthInput:
    # Demographics
    age: int                                    # [1, 120]
    sex: str                                    # "male" | "female"
    # Anthropometric
    bmi: float                                  # [10.0, 70.0] kg/m²
    # Cardiovascular
    systolic_bp: float                          # [60, 250] mmHg
    diastolic_bp: float                         # [40, 150] mmHg
    total_cholesterol: float                    # [50, 600] mg/dL
    hdl_cholesterol: float                      # [10, 150] mg/dL
    ldl_cholesterol: float                      # [10, 400] mg/dL
    # Metabolic
    fasting_glucose: float                      # [40, 600] mg/dL
    # Renal
    serum_creatinine: float                     # [0.1, 20.0] mg/dL
    # Hepatic
    alt_enzyme: float                           # [1, 2000] U/L
    ast_enzyme: float                           # [1, 2000] U/L
    # Behavioral (optional — imputed if None)
    daily_step_count: Optional[int]   = None   # [0, 50000]
    sleep_duration:   Optional[float] = None   # [0.0, 24.0]
    dietary_quality_score: Optional[int] = None  # [1, 10]
    # ── Smartwatch / Wearable inputs (optional) ──────────────────────
    heart_rate_resting: Optional[int]   = None  # [30, 200] bpm
    heart_rate_max:     Optional[int]   = None  # [60, 220] bpm
    hrv_ms:             Optional[float] = None  # [5, 200] ms  (HRV RMSSD)
    spo2_pct:           Optional[float] = None  # [80, 100] %  (blood oxygen)
    active_calories:    Optional[int]   = None  # [0, 5000] kcal/day
    stress_score:       Optional[int]   = None  # [0, 100]  (Garmin/Fitbit scale)

    def dict(self) -> dict:
        """Serialize to plain dict (Pydantic-compatible .dict() for API calls)."""
        return {
            "age":                   self.age,
            "sex":                   self.sex,
            "bmi":                   self.bmi,
            "systolic_bp":           self.systolic_bp,
            "diastolic_bp":          self.diastolic_bp,
            "total_cholesterol":     self.total_cholesterol,
            "hdl_cholesterol":       self.hdl_cholesterol,
            "ldl_cholesterol":       self.ldl_cholesterol,
            "fasting_glucose":       self.fasting_glucose,
            "serum_creatinine":      self.serum_creatinine,
            "alt_enzyme":            self.alt_enzyme,
            "ast_enzyme":            self.ast_enzyme,
            "daily_step_count":      self.daily_step_count,
            "sleep_duration":        self.sleep_duration,
            "dietary_quality_score": self.dietary_quality_score,
            # Smartwatch fields
            "heart_rate_resting":    self.heart_rate_resting,
            "heart_rate_max":        self.heart_rate_max,
            "hrv_ms":                self.hrv_ms,
            "spo2_pct":              self.spo2_pct,
            "active_calories":       self.active_calories,
            "stress_score":          self.stress_score,
        }


@dataclass
class FieldError:
    field_name: str
    value: Any
    min_allowed: Any
    max_allowed: Any

    def __str__(self):
        return (f"{self.field_name}: {self.value} is out of range "
                f"[{self.min_allowed}, {self.max_allowed}]")


@dataclass
class ValidationResult:
    ok: bool
    errors: list[FieldError] = field(default_factory=list)


@dataclass
class FeatureVector:
    organ: Organ
    values: np.ndarray
    feature_names: list[str]


@dataclass
class FeatureBundle:
    heart:  FeatureVector
    kidney: FeatureVector
    liver:  FeatureVector
    raw_inputs: RawHealthInput


@dataclass
class RawScores:
    heart:  float
    kidney: float
    liver:  float


@dataclass
class AdjustedScores:
    heart:  float
    kidney: float
    liver:  float


@dataclass
class InteractionAuditEntry:
    rule_id:          str
    rule_description: str
    organ_affected:   str
    original_score:   float
    adjustment:       float
    adjusted_score:   float


@dataclass
class InteractionResult:
    adjusted_scores: AdjustedScores
    audit_log: list[InteractionAuditEntry]


@dataclass
class SimulationResult:
    months:             list[int]
    heart_trajectory:   list[float]
    kidney_trajectory:  list[float]
    liver_trajectory:   list[float]
    scenario_label:     str = "Baseline"


@dataclass
class FeatureContribution:
    feature_name: str
    value:        float
    shap_value:   float


@dataclass
class ExplanationResult:
    organ:           Organ
    shap_values:     np.ndarray
    base_value:      float
    predicted_score: float
    top_features:    list[FeatureContribution]
    sentences:       list[str]
    interaction_notes: list[str]


@dataclass
class ExplanationBundle:
    heart:  ExplanationResult
    kidney: ExplanationResult
    liver:  ExplanationResult


@dataclass
class Recommendation:
    text:     str
    category: str   # physical_activity | dietary_modification | clinical_consultation | lifestyle_habit
    organ:    str   # heart | kidney | liver | general
    priority: float


@dataclass
class RecommendationList:
    items: list[Recommendation]


@dataclass
class ScenarioParams:
    label:     str
    overrides: dict  # partial override of RawHealthInput fields
