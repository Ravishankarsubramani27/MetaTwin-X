"""
🧬 NOVEL COMPONENT 3: Living Personalized Digital Twin

Patent claim: A persistent, self-updating digital twin model that
maintains organ-level internal states, continuously recalibrates
to individual baselines, and evolves predictions as new data arrives,
creating a 'living' patient-specific simulation.

Key innovations:
  1. Persistent organ state (not just risk scores)
  2. Patient-specific baseline calibration
  3. Continuous drift detection and adaptation
  4. State confidence tracking
  5. Multi-modal fusion (clinical + wearable)
"""
from __future__ import annotations
import json
import logging
import math
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field, asdict

log = logging.getLogger("metatwin-x.digital_twin")

TWIN_DIR = Path(__file__).parent.parent.parent / "data" / "twins"


@dataclass
class OrganState:
    """Internal state of a single organ node."""
    risk_score:   float = 0.3
    baseline:     float = 0.3      # personalised baseline
    trend:        float = 0.0      # +/- drift per week
    confidence:   float = 0.8      # prediction confidence [0,1]
    last_updated: str   = ""
    data_points:  int   = 0


@dataclass
class TwinState:
    """Complete digital twin state for one patient."""
    patient_id:    str
    created_at:    str = ""
    updated_at:    str = ""
    age:           Optional[int]   = None
    sex:           Optional[str]   = None

    # Organ states
    heart:  OrganState = field(default_factory=OrganState)
    kidney: OrganState = field(default_factory=OrganState)
    liver:  OrganState = field(default_factory=OrganState)

    # Wearable baseline
    hr_baseline:   Optional[float] = None
    hrv_baseline:  Optional[float] = None
    spo2_baseline: Optional[float] = None

    # System-level
    overall_health_score: float = 70.0
    calibration_phase:    bool  = True
    n_updates:            int   = 0
    alerts:               List[Dict] = field(default_factory=list)

    def to_json(self) -> str:
        return json.dumps(asdict(self), default=str)

    @classmethod
    def from_json(cls, s: str) -> "TwinState":
        d = json.loads(s)
        for organ in ["heart", "kidney", "liver"]:
            if isinstance(d.get(organ), dict):
                d[organ] = OrganState(**d[organ])
        return cls(**d)

    def get_organ(self, name: str) -> OrganState:
        return getattr(self, name)

    def set_organ_risk(self, name: str, risk: float, confidence: float = 0.8):
        organ = self.get_organ(name)
        organ.risk_score   = float(risk)
        organ.confidence   = float(confidence)
        organ.last_updated = datetime.utcnow().isoformat()
        organ.data_points += 1
        # Update baseline during calibration
        if self.calibration_phase and organ.data_points <= 5:
            organ.baseline = float(
                (organ.baseline * (organ.data_points - 1) + risk) / organ.data_points
            )
        # Detect trend (simple linear estimate)
        if organ.data_points >= 3:
            organ.trend = round(float(risk - organ.baseline), 4)


class LivingDigitalTwin:
    """
    🔑 NOVEL COMPONENT: Living, self-updating patient digital twin.

    Unlike static risk calculators, this twin:
    - Maintains continuous internal state per organ
    - Learns patient-specific normal ranges
    - Tracks health trajectory over time
    - Fuses multi-modal inputs (clinical + wearable)
    - Generates contextual alerts
    """

    CALIBRATION_THRESHOLD = 5    # snapshots before leaving calibration
    EMA_ALPHA             = 0.3  # smoothing factor for risk updates

    def __init__(self, patient_id: str):
        self.patient_id = patient_id
        TWIN_DIR.mkdir(parents=True, exist_ok=True)
        self.state = self._load_or_create(patient_id)

    # ── Public API ─────────────────────────────────────────────────────

    def update(self,
               adjusted_scores: Dict[str, float],
               biomarkers: Optional[Dict] = None,
               wearable: Optional[Dict]   = None,
               confidence: Dict[str, float] = None) -> Dict:
        """
        Update the twin with new prediction results.
        Returns a summary of changes and any alerts.
        """
        conf = confidence or {"heart": 0.8, "kidney": 0.8, "liver": 0.8}
        prev_scores = {
            "heart":  self.state.heart.risk_score,
            "kidney": self.state.kidney.risk_score,
            "liver":  self.state.liver.risk_score,
        }

        # Smooth update (EMA prevents jumps)
        for organ in ["heart", "kidney", "liver"]:
            new_risk  = adjusted_scores[organ]
            prev_risk = prev_scores[organ]
            smoothed  = self.EMA_ALPHA * new_risk + (1 - self.EMA_ALPHA) * prev_risk
            self.state.set_organ_risk(organ, smoothed, conf.get(organ, 0.8))

        # Update wearable baselines
        if wearable:
            self._update_wearable_baselines(wearable)

        # Update demographics
        if biomarkers:
            if "age" in biomarkers:
                self.state.age = int(biomarkers["age"])
            if "sex" in biomarkers:
                self.state.sex = str(biomarkers["sex"])

        # Leave calibration phase
        if self.state.n_updates >= self.CALIBRATION_THRESHOLD:
            self.state.calibration_phase = False

        self.state.n_updates  += 1
        self.state.updated_at  = datetime.utcnow().isoformat()

        # Compute overall health score
        max_risk = max(adjusted_scores.values())
        self.state.overall_health_score = round((1 - max_risk) * 100, 1)

        # Generate alerts
        new_alerts = self._check_alerts(adjusted_scores, prev_scores)
        self.state.alerts = (self.state.alerts + new_alerts)[-10:]  # keep last 10

        self._save()

        return {
            "updated_scores": adjusted_scores,
            "organ_states": self.organ_states_dict(),
            "health_score": self.state.overall_health_score,
            "calibration_phase": self.state.calibration_phase,
            "alerts": new_alerts,
            "n_updates": self.state.n_updates,
        }

    def organ_states_dict(self) -> Dict:
        return {
            organ: {
                "risk_score":   getattr(self.state, organ).risk_score,
                "baseline":     getattr(self.state, organ).baseline,
                "trend":        getattr(self.state, organ).trend,
                "confidence":   getattr(self.state, organ).confidence,
                "data_points":  getattr(self.state, organ).data_points,
            }
            for organ in ["heart", "kidney", "liver"]
        }

    def get_summary(self) -> Dict:
        return {
            "patient_id":      self.state.patient_id,
            "health_score":    self.state.overall_health_score,
            "calibration":     self.state.calibration_phase,
            "n_updates":       self.state.n_updates,
            "organ_states":    self.organ_states_dict(),
            "wearable_baselines": {
                "hr":   self.state.hr_baseline,
                "hrv":  self.state.hrv_baseline,
                "spo2": self.state.spo2_baseline,
            },
            "recent_alerts": self.state.alerts[-3:],
        }

    # ── Internal helpers ───────────────────────────────────────────────

    def _update_wearable_baselines(self, wearable: Dict):
        α = 0.2
        if "heart_rate_resting" in wearable and wearable["heart_rate_resting"]:
            hr = float(wearable["heart_rate_resting"])
            self.state.hr_baseline = (
                α * hr + (1-α) * (self.state.hr_baseline or hr)
            )
        if "hrv_ms" in wearable and wearable["hrv_ms"]:
            hrv = float(wearable["hrv_ms"])
            self.state.hrv_baseline = (
                α * hrv + (1-α) * (self.state.hrv_baseline or hrv)
            )
        if "spo2_pct" in wearable and wearable["spo2_pct"]:
            spo2 = float(wearable["spo2_pct"])
            self.state.spo2_baseline = (
                α * spo2 + (1-α) * (self.state.spo2_baseline or spo2)
            )

    def _check_alerts(self, current: Dict[str, float],
                      previous: Dict[str, float]) -> List[Dict]:
        alerts = []
        now    = datetime.utcnow().isoformat()
        for organ in ["heart", "kidney", "liver"]:
            cur  = current.get(organ, 0)
            prev = previous.get(organ, 0)
            delta = cur - prev

            # Crossed high-risk threshold
            if cur >= 0.7 and prev < 0.7:
                alerts.append({
                    "type":    "threshold_crossed",
                    "organ":   organ,
                    "level":   "high",
                    "score":   round(cur, 3),
                    "message": f"{organ.capitalize()} risk has entered HIGH zone ({cur*100:.1f}%). Immediate attention required.",
                    "time":    now,
                })
            # Rapid deterioration (>10% increase)
            elif delta > 0.10:
                alerts.append({
                    "type":    "rapid_deterioration",
                    "organ":   organ,
                    "level":   "warning",
                    "score":   round(cur, 3),
                    "delta":   round(delta, 3),
                    "message": f"{organ.capitalize()} risk increased by {delta*100:.1f}% — monitor closely.",
                    "time":    now,
                })
        return alerts

    def _load_or_create(self, patient_id: str) -> TwinState:
        path = TWIN_DIR / f"{patient_id}.json"
        try:
            if path.exists():
                return TwinState.from_json(path.read_text())
        except Exception as e:
            log.warning("Could not load twin state for %s: %s", patient_id, e)
        state = TwinState(
            patient_id=patient_id,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat(),
        )
        return state

    def _save(self):
        path = TWIN_DIR / f"{self.patient_id}.json"
        path.write_text(self.state.to_json())
