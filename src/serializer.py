"""Health profile JSON serializer / parser with schema validation."""
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path
try:
    import jsonschema
    _JSONSCHEMA_AVAILABLE = True
except ImportError:
    _JSONSCHEMA_AVAILABLE = False

from src.models.data_types import RawHealthInput, AdjustedScores
from src.models.health_profile import HealthProfile
from src.exceptions import SchemaValidationError

SCHEMA_PATH = Path(__file__).parent.parent / "schemas" / "health_profile_v1.0.json"


def _load_schema() -> dict:
    if SCHEMA_PATH.exists():
        with open(SCHEMA_PATH) as f:
            return json.load(f)
    # Inline fallback schema
    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["schema_version", "exported_at", "inputs", "risk_scores"],
        "properties": {
            "schema_version": {"type": "string", "const": "1.0"},
            "exported_at": {"type": "string"},
            "inputs": {"type": "object"},
            "risk_scores": {
                "type": "object",
                "required": ["heart", "kidney", "liver"],
                "properties": {
                    "heart": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                    "kidney": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                    "liver": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                },
            },
        },
        "additionalProperties": False,
    }


SCHEMA = _load_schema()


class HealthProfileSerializer:
    def serialize(self, profile: HealthProfile) -> dict:
        inp = profile.inputs
        return {
            "schema_version": "1.0",
            "exported_at": (profile.exported_at or datetime.now(timezone.utc)).isoformat(),
            "inputs": {
                "age": inp.age,
                "sex": inp.sex,
                "bmi": inp.bmi,
                "systolic_bp": inp.systolic_bp,
                "diastolic_bp": inp.diastolic_bp,
                "total_cholesterol": inp.total_cholesterol,
                "hdl_cholesterol": inp.hdl_cholesterol,
                "ldl_cholesterol": inp.ldl_cholesterol,
                "fasting_glucose": inp.fasting_glucose,
                "serum_creatinine": inp.serum_creatinine,
                "alt_enzyme": inp.alt_enzyme,
                "ast_enzyme": inp.ast_enzyme,
                "daily_step_count": inp.daily_step_count,
                "sleep_duration": inp.sleep_duration,
                "dietary_quality_score": inp.dietary_quality_score,
            },
            "risk_scores": {
                "heart": profile.risk_scores.heart,
                "kidney": profile.risk_scores.kidney,
                "liver": profile.risk_scores.liver,
            },
        }

    def pretty_print(self, profile_dict: dict) -> str:
        return json.dumps(profile_dict, indent=2, sort_keys=True)

    def parse(self, json_str: str) -> HealthProfile:
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise SchemaValidationError(f"Invalid JSON: {e}")

        if _JSONSCHEMA_AVAILABLE:
            try:
                jsonschema.validate(data, SCHEMA)
            except jsonschema.ValidationError as e:
                raise SchemaValidationError(
                    f"Schema violation at {' -> '.join(str(p) for p in e.absolute_path)}: {e.message}"
                )
        else:
            for req in ["schema_version", "exported_at", "inputs", "risk_scores"]:
                if req not in data:
                    raise SchemaValidationError(f"Missing required field: {req}")
            rs = data.get("risk_scores", {})
            for organ in ["heart", "kidney", "liver"]:
                if organ not in rs:
                    raise SchemaValidationError(f"Missing risk_score field: {organ}")

        inp_data = data["inputs"]
        raw = RawHealthInput(
            age=inp_data["age"],
            sex=inp_data["sex"],
            bmi=inp_data["bmi"],
            systolic_bp=inp_data["systolic_bp"],
            diastolic_bp=inp_data["diastolic_bp"],
            total_cholesterol=inp_data["total_cholesterol"],
            hdl_cholesterol=inp_data["hdl_cholesterol"],
            ldl_cholesterol=inp_data["ldl_cholesterol"],
            fasting_glucose=inp_data["fasting_glucose"],
            serum_creatinine=inp_data["serum_creatinine"],
            alt_enzyme=inp_data["alt_enzyme"],
            ast_enzyme=inp_data["ast_enzyme"],
            daily_step_count=inp_data.get("daily_step_count"),
            sleep_duration=inp_data.get("sleep_duration"),
            dietary_quality_score=inp_data.get("dietary_quality_score"),
        )
        rs = data["risk_scores"]
        scores = AdjustedScores(heart=rs["heart"], kidney=rs["kidney"], liver=rs["liver"])
        return HealthProfile(inputs=raw, risk_scores=scores,
                             exported_at=datetime.fromisoformat(data["exported_at"]),
                             schema_version=data["schema_version"])

    def export_to_file(self, profile: HealthProfile) -> bytes:
        d = self.serialize(profile)
        return self.pretty_print(d).encode("utf-8")

    def import_from_file(self, file_bytes: bytes) -> HealthProfile:
        return self.parse(file_bytes.decode("utf-8"))
