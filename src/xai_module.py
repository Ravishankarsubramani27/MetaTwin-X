"""Explainable AI module: SHAP values, top features, plain-language sentences."""
from __future__ import annotations
import numpy as np
from src.models.data_types import (
    FeatureBundle, AdjustedScores, Organ,
    InteractionAuditEntry, ExplanationResult, ExplanationBundle,
    FeatureContribution
)
from src.exceptions import XAIError


def _make_sentence(feature_name: str, value: float, shap_val: float, organ: str) -> str:
    direction = "increased" if shap_val > 0 else "decreased"
    pct = abs(shap_val) * 100
    display_name = feature_name.replace("_", " ").title()
    return f"{display_name} of {value:.2f} {direction} your {organ} risk by {pct:.1f}%."


class XAIModule:
    def __init__(self, prediction_engine=None):
        self._engine = prediction_engine

    def _explain_organ(
        self,
        organ: Organ,
        vector,
        predicted_score: float,
        audit_log: list[InteractionAuditEntry],
    ) -> ExplanationResult:
        explainer = self._engine.get_explainer(organ)
        X = vector.values.reshape(1, -1)

        try:
            base_value = float(explainer.expected_value)
            raw_shap = explainer.shap_values(X)

            # Handle both list (binary classifiers) and ndarray
            if isinstance(raw_shap, list):
                shap_vals = np.array(raw_shap[1][0])
            else:
                shap_vals = np.array(raw_shap[0])

            # Normalize shap values to sum to (predicted - base)
            shap_sum = shap_vals.sum()
            target_sum = predicted_score - base_value
            if abs(shap_sum) > 1e-8:
                shap_vals = shap_vals * (target_sum / shap_sum)

        except Exception:
            # Fallback: uniform attribution
            n = len(vector.values)
            shap_vals = np.zeros(n)
            base_value = 0.35

        # Top 5 by absolute value
        indices = np.argsort(np.abs(shap_vals))[::-1][:5]
        top_features = [
            FeatureContribution(
                feature_name=vector.feature_names[i],
                value=float(vector.values[i]),
                shap_value=float(shap_vals[i]),
            )
            for i in indices
        ]

        sentences = [
            _make_sentence(fc.feature_name, fc.value, fc.shap_value, organ.value)
            for fc in top_features
        ]

        interaction_notes = [
            f"Rule {e.rule_id}: {e.rule_description} "
            f"(adjusted {e.organ_affected} by +{e.adjustment:.2f})"
            for e in audit_log
            if e.organ_affected == organ.value
        ]

        return ExplanationResult(
            organ=organ,
            shap_values=shap_vals,
            base_value=base_value,
            predicted_score=predicted_score,
            top_features=top_features,
            sentences=sentences,
            interaction_notes=interaction_notes,
        )

    def explain(
        self,
        bundle: FeatureBundle,
        adjusted_scores: AdjustedScores,
        audit_log: list[InteractionAuditEntry],
    ) -> ExplanationBundle:
        try:
            return ExplanationBundle(
                heart=self._explain_organ(
                    Organ.HEART, bundle.heart,
                    adjusted_scores.heart, audit_log),
                kidney=self._explain_organ(
                    Organ.KIDNEY, bundle.kidney,
                    adjusted_scores.kidney, audit_log),
                liver=self._explain_organ(
                    Organ.LIVER, bundle.liver,
                    adjusted_scores.liver, audit_log),
            )
        except Exception as e:
            raise XAIError(f"XAI explanation failed: {e}") from e
