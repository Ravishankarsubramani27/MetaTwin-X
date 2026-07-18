"""
Advanced API routes — all novel components.
/xai/counterfactuals, /xai/causal, /xai/query
/rl/interventions
/simulate/ode
/twin/{patient_id}
/patients/{patient_id}
/stream/{patient_id}
"""
from __future__ import annotations
import sys
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, WebSocket, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from backend.schemas.health import (
    BiomarkerSnapshot, CounterfactualRequest,
    RLStateRequest, SimulationRequest,
)
from backend.xai.counterfactuals import generate_counterfactuals, feature_sensitivity
from backend.xai.causal_engine    import full_causal_analysis, uncertainty_estimate
from backend.xai.llm_reasoning    import answer_query
from backend.rl.agent             import recommend_interventions
from backend.simulation.ode_engine import simulate_ode
from backend.twin.digital_twin    import LivingDigitalTwin
from backend.core.adaptive_interaction import AdaptiveInteractionEngine
from backend.db.database import (
    get_db, upsert_patient, save_health_record,
    save_simulation, get_patient_history, log_alert, init_db,
    Patient, HealthRecord,
)
from backend.streaming.websocket_manager import manager, stream_wearable_updates

log    = logging.getLogger("metatwin-x.advanced_api")
router = APIRouter()

try:
    init_db()
except Exception as e:
    log.warning("DB init: %s", e)


# ── Pydantic models for new endpoints ─────────────────────────────────
class CausalRequest(BaseModel):
    scores:       dict
    biomarkers:   dict
    target_organ: str = "heart"


class NLQueryRequest(BaseModel):
    query:      str
    scores:     dict
    biomarkers: dict
    audit_log:  list = []


class TwinUpdateRequest(BaseModel):
    scores:     dict
    biomarkers: Optional[dict] = None
    wearable:   Optional[dict] = None
    confidence: Optional[dict] = None


class AdaptivePredict(BaseModel):
    scores:     dict
    biomarkers: dict
    patient_id: str = "default"


# ── Adaptive Cross-Organ Engine ────────────────────────────────────────
@router.post("/predict/adaptive", tags=["Adaptive AI"])
async def predict_adaptive(req: AdaptivePredict):
    """
    🔑 NOVEL: Adaptive interaction engine with online weight learning.
    Uses patient-specific learned interaction weights.
    """
    engine = AdaptiveInteractionEngine(req.patient_id)
    adjusted, audit = engine.apply(req.scores, req.biomarkers)

    # Update weights from this observation
    engine.update_weights(req.scores, adjusted, req.biomarkers)

    uncertainty = uncertainty_estimate(adjusted)

    return {
        "adjusted_scores":   adjusted,
        "uncertainty":       uncertainty,
        "audit_log":         audit,
        "learned_weights":   engine.learned_weights,
        "patient_id":        req.patient_id,
    }


# ── Living Digital Twin ────────────────────────────────────────────────
@router.post("/twin/{patient_id}/update", tags=["Digital Twin"])
async def update_twin(patient_id: str, req: TwinUpdateRequest):
    """🔑 NOVEL: Update the living digital twin for a patient."""
    twin   = LivingDigitalTwin(patient_id)
    result = twin.update(
        req.scores, req.biomarkers, req.wearable, req.confidence
    )
    return result


@router.get("/twin/{patient_id}", tags=["Digital Twin"])
async def get_twin(patient_id: str):
    """Get the current state of a patient's digital twin."""
    twin = LivingDigitalTwin(patient_id)
    return twin.get_summary()


# ── Causal Inference ───────────────────────────────────────────────────
@router.post("/xai/causal", tags=["XAI"])
async def causal_analysis(req: CausalRequest):
    """
    🔑 NOVEL: Causal inference engine.
    Returns: 'Reducing glucose CAUSES X% kidney risk reduction'
    Grounded in RCT/meta-analysis evidence.
    """
    result = full_causal_analysis(req.biomarkers, req.scores, req.target_organ)
    uncertainty = uncertainty_estimate(req.scores)
    return {
        "causal_analysis":  result,
        "uncertainty":      uncertainty,
    }


# ── Counterfactual Explanations ────────────────────────────────────────
@router.post("/xai/counterfactuals", tags=["XAI"])
async def counterfactuals(req: dict):
    """Generate counterfactual explanations: 'If X changes → risk changes by Y'"""
    from backend.xai.counterfactuals import generate_counterfactuals
    scores       = req.get("scores", {})
    bm           = req.get("biomarkers", {})
    target_organ = req.get("target_organ", "heart")
    reduction    = float(req.get("target_reduction", 0.10))
    cf = generate_counterfactuals(bm, scores, target_organ, reduction)
    return {
        "original_risk":   round(scores.get(target_organ, 0), 4),
        "target_risk":     round(scores.get(target_organ, 0) - reduction, 4),
        "counterfactuals": cf,
    }


@router.post("/xai/sensitivity", tags=["XAI"])
async def sensitivity(req: dict):
    """Feature sensitivity analysis."""
    from backend.xai.counterfactuals import feature_sensitivity
    bm           = req.get("biomarkers", {})
    scores       = req.get("scores", {})
    target_organ = req.get("target_organ", "heart")
    return {"sensitivities": feature_sensitivity(bm, scores, target_organ)}


# ── LLM Clinical Reasoning ────────────────────────────────────────────
@router.post("/xai/query", tags=["XAI"])
async def nl_query(req: NLQueryRequest):
    """
    🔑 NOVEL: Natural language clinical reasoning.
    Answer: 'Why is my heart risk high?' 'How do I improve?'
    """
    answer = answer_query(req.query, req.scores, req.biomarkers, req.audit_log)
    return {"query": req.query, "answer": answer}


# ── RL Intervention Agent ──────────────────────────────────────────────
@router.post("/rl/interventions", tags=["RL Agent"])
async def rl_interventions(req: RLStateRequest):
    """🔑 NOVEL: RL agent recommends optimal health interventions."""
    scores   = req.scores.model_dump()
    wearable = req.wearable.model_dump() if req.wearable else None
    bm       = {"age": req.age, "sex": req.sex}
    return recommend_interventions(scores, bm, wearable, top_k=5)


# ── ODE Hybrid Simulation ──────────────────────────────────────────────
@router.post("/simulate/ode", tags=["Simulation"])
async def simulate_ode_endpoint(req: SimulationRequest):
    """
    🔑 NOVEL: Hybrid ODE+ML simulation with daily timesteps and
    stochastic uncertainty bands (10th-90th percentile MC).
    """
    result = simulate_ode(
        initial_scores=req.scores.model_dump(),
        horizon_days=req.horizon_days,
        interventions=req.interventions or {},
        stochastic=req.stochastic,
        n_samples=req.n_samples,
    )
    return {**result, "horizon_days": req.horizon_days}


# ── Patient Management ─────────────────────────────────────────────────
@router.get("/patients/all", tags=["Patients"])
async def list_all_patients(db: Session = Depends(get_db)):
    """Return all patients with their latest risk scores for the Doctor Dashboard."""
    from sqlalchemy import desc
    patients = db.query(Patient).all()
    result = []
    for p in patients:
        # Get latest health record
        latest = (db.query(HealthRecord)
                    .filter(HealthRecord.patient_id == p.patient_id)
                    .order_by(desc(HealthRecord.timestamp))
                    .first())
        if latest:
            snap = {}
            try:
                import json as _json
                snap = _json.loads(latest.snapshot_json or "{}")
            except Exception:
                pass
            result.append({
                "patient_id":  p.patient_id,
                "name":        p.name or p.patient_id,
                "age":         p.age or snap.get("age") or 0,
                "sex":         p.sex or snap.get("sex") or "—",
                "heart_risk":  latest.heart_risk  or 0,
                "kidney_risk": latest.kidney_risk or 0,
                "liver_risk":  latest.liver_risk  or 0,
                "last_visit":  str(latest.timestamp),
                "record_count": db.query(HealthRecord)
                                   .filter(HealthRecord.patient_id == p.patient_id)
                                   .count(),
                "biomarkers": {
                    "bmi":               latest.bmi,
                    "systolic_bp":       latest.systolic_bp,
                    "fasting_glucose":   latest.fasting_glucose,
                    "serum_creatinine":  latest.serum_creatinine,
                    "alt_enzyme":        latest.alt_enzyme,
                    "total_cholesterol": latest.total_cholesterol,
                },
            })
    # Sort critical first
    result.sort(key=lambda x: -max(x["heart_risk"], x["kidney_risk"], x["liver_risk"]))
    return {"patients": result, "total": len(result)}


@router.post("/patients/{patient_id}", tags=["Patients"])
async def create_patient(
    patient_id: str, name: Optional[str] = None,
    age: Optional[int] = None, sex: Optional[str] = None,
    db: Session = Depends(get_db),
):
    p = upsert_patient(db, patient_id, name, age, sex)
    return {"patient_id": p.patient_id, "created_at": str(p.created_at)}


@router.post("/patients/{patient_id}/records", tags=["Patients"])
async def save_record(
    patient_id: str, snapshot: BiomarkerSnapshot,
    heart_risk: float = 0.0, kidney_risk: float = 0.0, liver_risk: float = 0.0,
    db: Session = Depends(get_db),
):
    upsert_patient(db, patient_id)
    scores = {"heart": heart_risk, "kidney": kidney_risk, "liver": liver_risk}
    r      = save_health_record(db, patient_id, snapshot.model_dump(), scores)
    for organ, score in scores.items():
        if score >= 0.7:
            log_alert(db, patient_id, organ, score,
                      f"{organ} risk is {score*100:.1f}%")
    return {"record_id": r.id}


@router.get("/patients/{patient_id}/history", tags=["Patients"])
async def get_history(patient_id: str, limit: int = 30,
                      db: Session = Depends(get_db)):
    records = get_patient_history(db, patient_id, limit)
    return {
        "patient_id": patient_id,
        "records": [
            {"timestamp": str(r.timestamp), "heart_risk": r.heart_risk,
             "kidney_risk": r.kidney_risk, "liver_risk": r.liver_risk}
            for r in records
        ],
    }


# ── Real-time WebSocket Streaming ──────────────────────────────────────
@router.websocket("/stream/{patient_id}")
async def websocket_stream(
    patient_id: str, ws: WebSocket,
    heart: float = 0.35, kidney: float = 0.20, liver: float = 0.25,
):
    """
    🔑 NOVEL: Real-time wearable data streaming with closed-loop
    pipeline: Input → Model → Simulation → Feedback → Updated state.
    Connect: ws://127.0.0.1:8000/stream/{patient_id}
    """
    await manager.connect(patient_id, ws)
    await stream_wearable_updates(
        patient_id, ws, {"heart": heart, "kidney": kidney, "liver": liver}
    )


@router.get("/stream/status", tags=["Streaming"])
async def stream_status():
    return {"active_connections": manager.connection_count}
