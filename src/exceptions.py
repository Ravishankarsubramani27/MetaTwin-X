"""Custom exceptions for MetaTwin-X."""
from dataclasses import dataclass
from typing import Any


@dataclass
class FieldError:
    field_name: str
    value: Any
    min_allowed: Any
    max_allowed: Any

    def __str__(self):
        return (f"{self.field_name}: {self.value} is out of range "
                f"[{self.min_allowed}, {self.max_allowed}]")


class MetaTwinError(Exception):
    """Base exception."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class ValidationError(MetaTwinError):
    def __init__(self, errors):
        self.errors = errors
        super().__init__("Validation failed: " + "; ".join(str(e) for e in errors))


class SchemaValidationError(MetaTwinError):
    def __init__(self, message: str, path: str = ""):
        self.path = path
        super().__init__(message)


class ModelLoadError(MetaTwinError):
    pass


class PredictionError(MetaTwinError):
    pass


class SimulationError(MetaTwinError):
    pass


class XAIError(MetaTwinError):
    pass
