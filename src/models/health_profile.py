"""HealthProfile dataclass for export/import."""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from src.models.data_types import RawHealthInput, AdjustedScores


@dataclass
class HealthProfile:
    inputs: RawHealthInput
    risk_scores: AdjustedScores
    exported_at: datetime = None
    schema_version: str = "1.0"
