"""
FastAPI /recommend route — runs the priority-driven recommendation engine.
Outcome 6: Personalized Recommendation Engine
"""
from __future__ import annotations
import sys
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from src.recommendation_engine import RecommendationEngine
from src.models.data_types import AdjustedScores

log = logging.getLogger("metatwin-x.recommend_route")

router = APIRouter()

_CONFIG_DIR = ROOT / "config"
_rec_engine: RecommendationEngine | None = None


def _get_engine():
    global _rec_engine
    if _rec_engine is None:
        _rec_engine = RecommendationEngine(_CONFIG_DIR / "recommendations.yaml")
    return _rec_engine


@router.post("/")
def recommend(data: dict):
    """
    Accept adjusted risk scores and return prioritized recommendations.

    Payload:
      {
        "heart":  0.45,
        "kidney": 0.32,
        "liver":  0.28
      }
    """
    try:
        engine = _get_engine()

        try:
            adjusted = AdjustedScores(
                heart=float(data.get("heart",  0.0)),
                kidney=float(data.get("kidney", 0.0)),
                liver=float(data.get("liver",  0.0)),
            )
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=422, detail=f"Invalid risk scores: {exc}")

        rec_list = engine.generate(adjusted)

        log.info("Recommendations generated — %d items", len(rec_list.items))

        return {
            "items": [
                {
                    "text":     r.text,
                    "category": r.category,
                    "organ":    r.organ,
                    "priority": round(r.priority, 4),
                }
                for r in rec_list.items
            ]
        }

    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Unexpected error in /recommend")
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {exc}")