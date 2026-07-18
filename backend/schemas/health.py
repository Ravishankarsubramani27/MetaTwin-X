"""Pydantic v2 schemas for MetaTwin-X API."""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class WearableSnapshot(BaseModel):
    """Single wearable reading at a point in time."""
    heart_rate_resting: Optional[float] = Field(None, ge=30, le=200)
    heart_rate_max:     Optional[float] = Field(None, ge=60, le=220)
    hrv_ms:             Optional[float] = Field(None, ge=5,  le=200)
    spo2_pct:           Optional[float] = Field(None, ge=80, le=100)
    active_calories:    Optional[float] = Field(None, ge=0,  le=5000)
    stress_score:       Optional[float] = Field(None, ge=0,  le=100)
    daily_steps:        Optional[int]   = Field(None, ge=0,  le=50000)


class BiomarkerSnapshot(BaseModel):
    """One-time clinical biomarker reading."""
    age:               int   = Field(..., ge=1,   le=120)
    sex:               str   = Field(..., pattern="^(male|female)$")
    bmi:               float = Field(..., ge=10,  le=70)
    systolic_bp:       float = Field(..., ge=60,  le=250)
    diastolic_bp:      float = Field(..., ge=40,  le=150)
    total_cholesterol: float = Field(..., ge=50,  le=600)
    hdl_cholesterol:   float = Field(..., ge=10,  le=150)
    ldl_cholesterol:   float = Field(..., ge=10,  le=400)
    fasting_glucose:   float = Field(..., ge=40,  le=600)
    serum_creatinine:  float = Field(..., ge=0.1, le=20)
    alt_enzyme:        float = Field(..., ge=1,   le=2000)
    ast_enzyme:        float = Field(..., ge=1,   le=2000)
    daily_step_count:  Optional[int]   = Field(None, ge=0,  le=50000)
    sleep_duration:    Optional[float] = Field(None, ge=0,  le=24)
    dietary_quality_score: Optional[int] = Field(None, ge=1, le=10)
    wearable: Optional[WearableSnapshot] = None

    @field_validator("sex")
    @classmethod
    def sex_lower(cls, v: str) -> str:
        return v.lower()


class TemporalHealthInput(BaseModel):
    """Sequential snapshots for LSTM/GRU temporal modeling."""
    snapshots: List[BiomarkerSnapshot] = Field(
        ..., min_length=1, max_length=365,
        description="Ordered time-series of health snapshots (oldest first)"
    )
    patient_id: Optional[str] = Field(None, description="Optional patient identifier")
    days_between: int = Field(7, ge=1, le=365, description="Days between snapshots")


class RiskScores(BaseModel):
    heart:  float = Field(..., ge=0, le=1)
    kidney: float = Field(..., ge=0, le=1)
    liver:  float = Field(..., ge=0, le=1)


class PredictionResponse(BaseModel):
    adjusted_scores: RiskScores
    raw_scores:      RiskScores
    confidence:      Dict[str, float]   # per-organ confidence interval width
    audit_log:       List[Dict[str, Any]]
    model_type:      str = "xgboost"    # or "lstm"


class SimulationRequest(BaseModel):
    scores:       RiskScores
    horizon_days: int = Field(365, ge=30, le=730)
    interventions: Optional[Dict[str, float]] = Field(
        None, description="e.g. {'bmi_reduction': 0.1, 'bp_target': 120}"
    )
    stochastic:   bool = Field(True, description="Add uncertainty bands")
    n_samples:    int  = Field(50, ge=10, le=200, description="MC samples for uncertainty")


class TrajectoryPoint(BaseModel):
    day:    int
    heart:  float
    kidney: float
    liver:  float


class SimulationResponse(BaseModel):
    trajectory:        List[TrajectoryPoint]
    uncertainty_bands: Optional[Dict[str, Dict[str, List[float]]]] = None
    scenario_label:    str = "Baseline"
    peak_risk:         RiskScores
    day_of_peak:       Dict[str, int]


class CounterfactualRequest(BaseModel):
    scores:      RiskScores
    biomarkers:  BiomarkerSnapshot
    target_organ: str = Field(..., pattern="^(heart|kidney|liver)$")
    target_reduction: float = Field(0.1, ge=0.01, le=0.5)


class CounterfactualResult(BaseModel):
    feature:         str
    current_value:   float
    suggested_value: float
    unit:            str
    risk_reduction:  float
    feasibility:     str   # "easy" | "moderate" | "hard"
    explanation:     str


class CounterfactualResponse(BaseModel):
    original_risk:  float
    target_risk:    float
    counterfactuals: List[CounterfactualResult]


class RLStateRequest(BaseModel):
    scores:    RiskScores
    wearable:  Optional[WearableSnapshot] = None
    age:       int = Field(50, ge=1, le=120)
    sex:       str = Field("male")


class RLAction(BaseModel):
    action_id:   int
    name:        str
    description: str
    expected_reward: float
    confidence:  float


class RLResponse(BaseModel):
    recommended_actions: List[RLAction]
    state_vector:        List[float]
    total_expected_reward: float


class PatientProfile(BaseModel):
    patient_id:  str
    name:        Optional[str] = None
    created_at:  Optional[str] = None
    latest_scores: Optional[RiskScores] = None


class HealthRecord(BaseModel):
    patient_id:  str
    snapshot:    BiomarkerSnapshot
    scores:      Optional[RiskScores] = None
    timestamp:   Optional[str] = None


class WebSocketMessage(BaseModel):
    type:    str   # "wearable_update" | "prediction_update" | "alert"
    payload: Dict[str, Any]
    timestamp: Optional[str] = None
