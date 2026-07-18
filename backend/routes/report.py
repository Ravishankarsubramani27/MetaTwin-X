"""
MetaTwin-X — /report endpoints
POST /report/generate       → JSON structured report from risk scores + biomarkers
POST /report/from-upload    → Upload PDF/image → OCR → extract patient identity
                              + biomarkers → predict → full report JSON + HTML
                              → Auto-save to DB (no manual patient ID needed)
GET  /report/html/{id}      → Return HTML report for browser print-to-PDF
"""
from __future__ import annotations
import sys, logging, json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from src.preprocessor import DataPreprocessor
from src.prediction_engine import PredictionEngine
from src.interaction_engine import InteractionEngine
from src.models.data_types import RawHealthInput
from src.exceptions import ValidationError
from src.report_parser import extract_text, structure_report, to_raw_health_input
from backend.reports.report_generator import generate_report
from backend.reports.html_generator import generate_html_report
from backend.db.database import (
    get_db, upsert_patient, save_health_record, init_db
)

log = logging.getLogger("metatwin-x.report_route")
router = APIRouter()

_MODEL_DIR = ROOT / "models"
_preprocessor = _prediction_engine = _interaction_engine = None

# In-memory store for HTML reports (keyed by patient_id)
_report_cache: dict[str, str] = {}


def _get_engines():
    global _preprocessor, _prediction_engine, _interaction_engine
    if _preprocessor is None:
        _preprocessor       = DataPreprocessor(_MODEL_DIR / "preprocessor")
        _prediction_engine  = PredictionEngine(_MODEL_DIR)
        _interaction_engine = InteractionEngine()
    return _preprocessor, _prediction_engine, _interaction_engine


def _run_pipeline(raw: RawHealthInput):
    """Run full ML pipeline and return scores + audit_log."""
    pp, pe, ie = _get_engines()
    bundle   = pp.validate_and_transform(raw)
    raw_s    = pe.predict_all(bundle)
    result   = ie.apply_rules(raw_s, raw)
    adjusted = result.adjusted_scores
    audit    = [
        {"rule_id": e.rule_id, "rule_description": e.rule_description,
         "organ_affected": e.organ_affected,
         "original_score": round(e.original_score, 4),
         "adjustment": round(e.adjustment, 4),
         "adjusted_score": round(e.adjusted_score, 4)}
        for e in result.audit_log
    ]
    scores = {"heart": round(adjusted.heart, 4),
              "kidney": round(adjusted.kidney, 4),
              "liver": round(adjusted.liver, 4)}
    return scores, audit, raw


# ── POST /report/generate ────────────────────────────────────────────────────
@router.post("/generate", tags=["Report"])
async def generate_report_endpoint(body: dict):
    """
    Generate structured AI report from risk scores + biomarkers.
    Body: { patient_id, patient_name, scores, biomarkers, audit_log }
    """
    patient_id   = body.get("patient_id", "ANON-001")
    patient_name = body.get("patient_name", "Patient")
    scores       = body.get("scores", {})
    biomarkers   = body.get("biomarkers", {})
    audit_log    = body.get("audit_log", [])

    if not scores:
        raise HTTPException(400, "scores required")

    report = generate_report(
        patient_id=patient_id,
        patient_name=patient_name,
        scores=scores,
        biomarkers=biomarkers,
        audit_log=audit_log,
    )
    html = generate_html_report(report)
    _report_cache[patient_id] = html

    return {"report": report, "html_url": f"/report/html/{patient_id}"}


# ── POST /report/from-upload ─────────────────────────────────────────────────
@router.post("/from-upload", tags=["Report"])
async def report_from_upload(
    file: UploadFile = File(...),
    patient_id:   str = "",
    patient_name: str = "",
    db: Session = Depends(get_db),
):
    """
    Fully automatic pipeline:
    Upload PDF/image → OCR → extract patient identity from document
    → extract biomarkers → predict → save to DB → full AI report

    Patient name and ID are extracted from the document automatically.
    Manual overrides accepted if provided.
    """
    try:
        contents = await file.read()
        filename = file.filename or "report.pdf"

        # ── Step 1: OCR ──────────────────────────────────────────────
        raw_text = extract_text(contents, filename)
        if not raw_text.strip():
            raise HTTPException(422,
                "Could not extract text. Try a clearer image or a digital PDF.")

        # ── Step 2: Parse — extracts identity + biomarkers ───────────
        extraction = structure_report(raw_text)

        # ── Step 3: Resolve patient identity ────────────────────────
        # Document values take priority; manual overrides only if doc has nothing
        resolved_name = (
            extraction.patient_name
            or (patient_name.strip() if patient_name.strip() else None)
            or "Unknown Patient"
        )
        resolved_id = (
            extraction.patient_id
            or (patient_id.strip() if patient_id.strip() else None)
            or f"PT-UPLOAD-{filename[:8].upper().replace('.','')}"
        )

        # ── Step 4: Build RawHealthInput ─────────────────────────────
        raw = to_raw_health_input(extraction)

        # ── Step 5: Predict ──────────────────────────────────────────
        try:
            scores, audit_log, _ = _run_pipeline(raw)
        except ValidationError as e:
            raise HTTPException(422, str(e))

        # ── Step 6: Build biomarkers dict ────────────────────────────
        biomarkers = {
            "systolic_bp":       raw.systolic_bp,
            "diastolic_bp":      raw.diastolic_bp,
            "total_cholesterol": raw.total_cholesterol,
            "hdl_cholesterol":   raw.hdl_cholesterol,
            "ldl_cholesterol":   raw.ldl_cholesterol,
            "fasting_glucose":   raw.fasting_glucose,
            "serum_creatinine":  raw.serum_creatinine,
            "alt_enzyme":        raw.alt_enzyme,
            "ast_enzyme":        raw.ast_enzyme,
            "bmi":               raw.bmi,
            "age":               raw.age,
            "sex":               raw.sex,
        }
        if extraction.hba1c:   biomarkers["hba1c"] = extraction.hba1c
        if extraction.urea:    biomarkers["urea"]  = extraction.urea

        # ── Step 7: Auto-save to DB ───────────────────────────────────
        try:
            upsert_patient(
                db, resolved_id,
                name=resolved_name,
                age=int(raw.age) if raw.age else None,
                sex=raw.sex,
            )
            snapshot = {
                **biomarkers,
                "patient_name":  resolved_name,
                "patient_id":    resolved_id,
                "report_date":   extraction.report_date,
                "doctor_name":   extraction.doctor_name,
                "source":        "document_upload",
                "filename":      filename,
            }
            save_health_record(db, resolved_id, snapshot, scores)
            log.info("Auto-saved upload record: patient=%s scores=%s",
                     resolved_id, scores)
        except Exception as db_err:
            log.warning("DB save failed (non-fatal): %s", db_err)
            extraction.warnings.append("Note: Record could not be saved to database.")

        # ── Step 8: Generate report ───────────────────────────────────
        report = generate_report(
            patient_id=resolved_id,
            patient_name=resolved_name,
            scores=scores,
            biomarkers=biomarkers,
            audit_log=audit_log,
            extraction_confidence=extraction.confidence,
            extracted_fields=extraction.extracted_fields,
            warnings=extraction.warnings,
        )
        html = generate_html_report(report)
        _report_cache[resolved_id] = html

        log.info(
            "Report generated: patient=%s name=%s health=%d confidence=%.0f%%",
            resolved_id, resolved_name,
            report["summary"]["health_score"],
            extraction.confidence * 100,
        )

        return {
            "report":   report,
            "html_url": f"/report/html/{resolved_id}",
            "scores":   scores,
            "patient": {
                "id":          resolved_id,
                "name":        resolved_name,
                "age":         raw.age,
                "sex":         raw.sex,
                "report_date": extraction.report_date,
                "doctor":      extraction.doctor_name,
                "from_document": extraction.patient_name is not None,
            },
            "extraction": {
                "confidence":       round(extraction.confidence, 2),
                "extracted_fields": extraction.extracted_fields,
                "warnings":         extraction.warnings,
            },
            "saved_to_db": True,
        }

    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Report generation failed")
        raise HTTPException(500, f"Report generation failed: {exc}")


# ── GET /report/html/{patient_id} ────────────────────────────────────────────
@router.get("/html/{patient_id}", response_class=HTMLResponse, tags=["Report"])
async def get_report_html(patient_id: str):
    """Return the cached HTML report for browser print-to-PDF."""
    html = _report_cache.get(patient_id)
    if not html:
        raise HTTPException(404, f"No report found for patient_id={patient_id}. Generate one first.")
    return HTMLResponse(content=html)


# ── POST /report/from-scores (quick JSON report) ─────────────────────────────
@router.post("/from-scores", tags=["Report"])
async def report_from_scores(body: dict):
    """
    Direct report from existing scores (no upload needed).
    Used after Health Input form submission.
    """
    patient_id   = body.get("patient_id",   "P001")
    patient_name = body.get("patient_name", "Patient")
    scores       = body.get("scores",    {})
    biomarkers   = body.get("biomarkers", {})
    audit_log    = body.get("audit_log",  [])

    # Run prediction if no scores provided
    if not scores and biomarkers:
        raw_fields = {k: biomarkers.get(k) for k in [
            "age","sex","bmi","systolic_bp","diastolic_bp","total_cholesterol",
            "hdl_cholesterol","ldl_cholesterol","fasting_glucose","serum_creatinine",
            "alt_enzyme","ast_enzyme","daily_step_count","sleep_duration",
            "dietary_quality_score","heart_rate_resting","heart_rate_max",
            "hrv_ms","spo2_pct","active_calories","stress_score",
        ] if biomarkers.get(k) is not None}
        try:
            raw = RawHealthInput(**raw_fields)
            scores, audit_log, _ = _run_pipeline(raw)
        except Exception:
            raise HTTPException(422, "Could not run prediction from biomarkers")

    report = generate_report(
        patient_id=patient_id,
        patient_name=patient_name,
        scores=scores,
        biomarkers=biomarkers,
        audit_log=audit_log,
    )
    html = generate_html_report(report)
    _report_cache[patient_id] = html
    return {"report": report, "html_url": f"/report/html/{patient_id}"}
