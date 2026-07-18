"""
FastAPI /predict route — runs the full prediction + interaction pipeline.
Outcome 1: Multi-Organ Risk Prediction
Outcome 2: Cross-Organ Interaction Modeling
"""
from __future__ import annotations
import sys
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File

# ── Make sure the project root is on the path ────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from src.preprocessor import DataPreprocessor
from src.prediction_engine import PredictionEngine
from src.interaction_engine import InteractionEngine
from src.models.data_types import RawHealthInput, AdjustedScores
from src.exceptions import ValidationError, PredictionError
from src.report_parser import extract_text, structure_report, to_raw_health_input

log = logging.getLogger("metatwin-x.predict_route")

router = APIRouter()

# ── Lazy-load engines once per worker ─────────────────────────────────────────
_MODEL_DIR   = ROOT / "models"
_CONFIG_DIR  = ROOT / "config"

_preprocessor:       DataPreprocessor  | None = None
_prediction_engine:  PredictionEngine  | None = None
_interaction_engine: InteractionEngine | None = None


def _get_engines():
    global _preprocessor, _prediction_engine, _interaction_engine
    if _preprocessor is None:
        _preprocessor       = DataPreprocessor(_MODEL_DIR / "preprocessor")
        _prediction_engine  = PredictionEngine(_MODEL_DIR)
        _interaction_engine = InteractionEngine()
    return _preprocessor, _prediction_engine, _interaction_engine


@router.post("/")
def predict(data: dict):
    """
    Accept raw health inputs, run the full ML pipeline and return:
      - adjusted_scores  (heart, kidney, liver — post interaction rules)
      - audit_log        (interaction rule trace for XAI)
    """
    try:
        preprocessor, prediction_engine, interaction_engine = _get_engines()

        # Build RawHealthInput from the incoming dict
        try:
            raw = RawHealthInput(
                age=int(data["age"]),
                sex=str(data["sex"]),
                bmi=float(data["bmi"]),
                systolic_bp=float(data["systolic_bp"]),
                diastolic_bp=float(data["diastolic_bp"]),
                total_cholesterol=float(data["total_cholesterol"]),
                hdl_cholesterol=float(data["hdl_cholesterol"]),
                ldl_cholesterol=float(data["ldl_cholesterol"]),
                fasting_glucose=float(data["fasting_glucose"]),
                serum_creatinine=float(data["serum_creatinine"]),
                alt_enzyme=float(data["alt_enzyme"]),
                ast_enzyme=float(data["ast_enzyme"]),
                daily_step_count=(int(data["daily_step_count"])
                                  if data.get("daily_step_count") is not None else None),
                sleep_duration=(float(data["sleep_duration"])
                                if data.get("sleep_duration") is not None else None),
                dietary_quality_score=(int(data["dietary_quality_score"])
                                       if data.get("dietary_quality_score") is not None else None),
                # ── Wearable / Smartwatch fields (optional) ──────────
                heart_rate_resting=(int(data["heart_rate_resting"])
                                    if data.get("heart_rate_resting") is not None else None),
                heart_rate_max=(int(data["heart_rate_max"])
                                if data.get("heart_rate_max") is not None else None),
                hrv_ms=(float(data["hrv_ms"])
                        if data.get("hrv_ms") is not None else None),
                spo2_pct=(float(data["spo2_pct"])
                          if data.get("spo2_pct") is not None else None),
                active_calories=(int(data["active_calories"])
                                 if data.get("active_calories") is not None else None),
                stress_score=(int(data["stress_score"])
                              if data.get("stress_score") is not None else None),
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise HTTPException(status_code=422, detail=f"Invalid input data: {exc}")

        # Step 1 — validate + transform
        try:
            bundle = preprocessor.validate_and_transform(raw)
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

        # Step 2 — parallel inference across 3 organs
        raw_scores = prediction_engine.predict_all(bundle)

        # Step 3 — cross-organ interaction rules (IR-01, IR-02, IR-03)
        result = interaction_engine.apply_rules(raw_scores, raw)
        adjusted = result.adjusted_scores

        audit_log = [
            {
                "rule_id":          e.rule_id,
                "rule_description": e.rule_description,
                "organ_affected":   e.organ_affected,
                "original_score":   round(e.original_score, 4),
                "adjustment":       round(e.adjustment, 4),
                "adjusted_score":   round(e.adjusted_score, 4),
            }
            for e in result.audit_log
        ]

        log.info("Prediction complete — heart=%.3f kidney=%.3f liver=%.3f",
                 adjusted.heart, adjusted.kidney, adjusted.liver)

        return {
            "adjusted_scores": {
                "heart":  round(adjusted.heart,  4),
                "kidney": round(adjusted.kidney, 4),
                "liver":  round(adjusted.liver,  4),
            },
            "raw_scores": {
                "heart":  round(raw_scores.heart,  4),
                "kidney": round(raw_scores.kidney, 4),
                "liver":  round(raw_scores.liver,  4),
            },
            "audit_log": audit_log,
        }

    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Unexpected error in /predict")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")


@router.post("/upload")
async def predict_from_upload(file: UploadFile = File(...)):
    """
    Accept a medical report file (PDF/image/text), extract biomarkers,
    run the full ML pipeline and return risk scores + extracted fields.
    """
    try:
        contents = await file.read()
        filename  = file.filename or "report.pdf"

        # Step 1 — extract text from file
        raw_text = extract_text(contents, filename)
        if not raw_text.strip():
            raise HTTPException(status_code=422,
                detail="Could not extract text from the uploaded file. "
                       "Try a clearer scan or digital PDF.")

        # Step 2 — structure biomarkers from text
        extraction = structure_report(raw_text)

        # Step 3 — build RawHealthInput (fills missing with population averages)
        raw = to_raw_health_input(extraction)

        # Step 4 — run prediction pipeline
        preprocessor, prediction_engine, interaction_engine = _get_engines()
        bundle      = preprocessor.validate_and_transform(raw)
        raw_scores  = prediction_engine.predict_all(bundle)
        result      = interaction_engine.apply_rules(raw_scores, raw)
        adjusted    = result.adjusted_scores

        audit_log = [
            {
                "rule_id":          e.rule_id,
                "rule_description": e.rule_description,
                "organ_affected":   e.organ_affected,
                "original_score":   round(e.original_score, 4),
                "adjustment":       round(e.adjustment, 4),
                "adjusted_score":   round(e.adjusted_score, 4),
            }
            for e in result.audit_log
        ]

        log.info("Upload predict — %s — confidence=%.2f — "
                 "heart=%.3f kidney=%.3f liver=%.3f",
                 filename, extraction.confidence,
                 adjusted.heart, adjusted.kidney, adjusted.liver)

        return {
            "adjusted_scores": {
                "heart":  round(adjusted.heart,  4),
                "kidney": round(adjusted.kidney, 4),
                "liver":  round(adjusted.liver,  4),
            },
            "raw_scores": {
                "heart":  round(raw_scores.heart,  4),
                "kidney": round(raw_scores.kidney, 4),
                "liver":  round(raw_scores.liver,  4),
            },
            "extraction": {
                "confidence":       round(extraction.confidence, 2),
                "extracted_fields": extraction.extracted_fields,
                "warnings":         extraction.warnings,
                "biomarkers": {
                    "age":               raw.age,
                    "sex":               raw.sex,
                    "bmi":               raw.bmi,
                    "systolic_bp":       raw.systolic_bp,
                    "diastolic_bp":      raw.diastolic_bp,
                    "total_cholesterol": raw.total_cholesterol,
                    "hdl_cholesterol":   raw.hdl_cholesterol,
                    "ldl_cholesterol":   raw.ldl_cholesterol,
                    "fasting_glucose":   raw.fasting_glucose,
                    "serum_creatinine":  raw.serum_creatinine,
                    "alt_enzyme":        raw.alt_enzyme,
                    "ast_enzyme":        raw.ast_enzyme,
                },
            },
            "audit_log": audit_log,
        }

    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Unexpected error in /predict/upload")
        raise HTTPException(status_code=500, detail=f"Upload prediction failed: {exc}")
