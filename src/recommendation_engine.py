"""Recommendation engine: priority-ranked personalized recommendations (v2)."""
from __future__ import annotations
import yaml
from pathlib import Path
from src.models.data_types import AdjustedScores, Recommendation, RecommendationList

BUILTIN_RECS = [
    # Heart
    dict(organ="heart", min_score=0.0, category="lifestyle_habit",
         text="Avoid smoking and limit alcohol to reduce cardiovascular strain.",
         impact=0.6, effort=0.3),

    dict(organ="heart", min_score=0.3, category="physical_activity",
         text="Aim for at least 150 minutes of moderate aerobic exercise per week.",
         impact=0.8, effort=0.5),

    dict(organ="heart", min_score=0.4, category="dietary_modification",
         text="Adopt a heart-healthy diet rich in omega-3 fatty acids and low in saturated fats.",
         impact=0.85, effort=0.5),

    dict(organ="heart", min_score=0.6, category="clinical_consultation",
         text="Schedule a cardiovascular evaluation with a cardiologist.",
         impact=0.9, effort=0.7),

    dict(organ="heart", min_score=0.7, category="clinical_consultation",
         text="Discuss blood pressure medication options with your cardiovascular specialist.",
         impact=0.95, effort=0.8),

    # Kidney
    dict(organ="kidney", min_score=0.0, category="lifestyle_habit",
         text="Stay well-hydrated with 2–3 liters of water daily to support kidney function.",
         impact=0.6, effort=0.2),

    dict(organ="kidney", min_score=0.3, category="dietary_modification",
         text="Reduce sodium intake to less than 2,300 mg/day to ease kidney filtration load.",
         impact=0.75, effort=0.4),

    dict(organ="kidney", min_score=0.4, category="physical_activity",
         text="Engage in low-impact exercise (e.g., walking, swimming) at least 30 minutes/day.",
         impact=0.7, effort=0.4),

    dict(organ="kidney", min_score=0.6, category="clinical_consultation",
         text="Arrange a nephrology evaluation and request a comprehensive metabolic panel.",
         impact=0.9, effort=0.7),

    dict(organ="kidney", min_score=0.7, category="clinical_consultation",
         text="Discuss eGFR monitoring and chronic kidney disease management with a nephrologist.",
         impact=0.95, effort=0.8),

    # Liver
    dict(organ="liver", min_score=0.0, category="lifestyle_habit",
         text="Limit alcohol consumption and avoid unnecessary hepatotoxic medications.",
         impact=0.7, effort=0.3),

    dict(organ="liver", min_score=0.3, category="dietary_modification",
         text="Increase intake of cruciferous vegetables (broccoli, kale) to support liver detoxification.",
         impact=0.75, effort=0.4),

    dict(organ="liver", min_score=0.4, category="physical_activity",
         text="Regular exercise helps reduce hepatic fat accumulation; aim for 5 days per week.",
         impact=0.8, effort=0.5),

    dict(organ="liver", min_score=0.6, category="clinical_consultation",
         text="Arrange a hepatology evaluation including liver function tests and ultrasound.",
         impact=0.9, effort=0.7),

    dict(organ="liver", min_score=0.7, category="clinical_consultation",
         text="Discuss liver biopsy or fibroscan with your hepatologist to assess fibrosis stage.",
         impact=0.95, effort=0.8),

    # General
    dict(organ="general", min_score=0.0, category="lifestyle_habit",
         text="Maintain consistent sleep of 7–9 hours per night to support metabolic health.",
         impact=0.6, effort=0.2),

    dict(organ="general", min_score=0.0, category="physical_activity",
         text="Walk at least 7,000 steps per day for broad cardiovascular and metabolic benefits.",
         impact=0.7, effort=0.3),

    dict(organ="general", min_score=0.2, category="dietary_modification",
         text="Reduce ultra-processed food intake and prioritize whole foods.",
         impact=0.75, effort=0.4),
]


def _score_for_organ(organ_name: str, scores: AdjustedScores) -> float:
    mapping = {"heart": scores.heart, "kidney": scores.kidney, "liver": scores.liver}
    return mapping.get(organ_name, max(scores.heart, scores.kidney, scores.liver))


class RecommendationEngine:
    def __init__(self, catalog_path: Path = None):
        self._catalog = list(BUILTIN_RECS)

        if catalog_path and catalog_path.exists():
            with open(catalog_path, encoding="utf-8") as f:
                data = yaml.safe_load(f)

            if data:
                if isinstance(data, list):
                    extra = data
                elif isinstance(data, dict):
                    extra = data.get("recommendations", [])
                else:
                    extra = []

                self._catalog.extend(extra)

    def generate(self, adjusted_scores: AdjustedScores, scenario=None) -> RecommendationList:

        score_map = {
            "heart": adjusted_scores.heart,
            "kidney": adjusted_scores.kidney,
            "liver": adjusted_scores.liver,
            "general": 0.0,
        }

        all_recs: list[Recommendation] = []
        seen_texts: set[str] = set()

        scenario_boost = 1.0
        if scenario and hasattr(scenario, "label"):
            if "improve" in scenario.label.lower():
                scenario_boost = 1.1

        # 🔥 Collect + intelligent scoring
        for entry in self._catalog:
            organ = entry["organ"]
            org_score = score_map.get(organ, 0.0)

            if org_score >= entry["min_score"]:
                text = entry["text"]

                if text not in seen_texts:
                    seen_texts.add(text)

                    impact = entry.get("impact", 0.5)
                    effort = entry.get("effort", 0.5)

                    priority = ((impact * org_score) / (effort + 0.1)) * scenario_boost

                    all_recs.append(Recommendation(
                        text=text,
                        category=entry["category"],
                        organ=organ,
                        priority=round(priority, 4),
                    ))

        # Sort by priority
        all_recs.sort(key=lambda r: r.priority, reverse=True)

        # 🔥 Clinical mandatory rules
        required = []
        required_texts = set()

        def _find_consult(organ_key: str):
            for r in all_recs:
                if r.category == "clinical_consultation" and r.organ == organ_key:
                    return r
            return None

        if adjusted_scores.heart > 0.6:
            rec = _find_consult("heart")
            if rec:
                required.append(rec)
                required_texts.add(rec.text)

        if adjusted_scores.kidney > 0.6:
            rec = _find_consult("kidney")
            if rec:
                required.append(rec)
                required_texts.add(rec.text)

        if adjusted_scores.liver > 0.6:
            rec = _find_consult("liver")
            if rec:
                required.append(rec)
                required_texts.add(rec.text)

        final = list(required)

        for r in all_recs:
            if len(final) >= 10:
                break
            if r.text not in required_texts:
                final.append(r)

        final.sort(key=lambda r: r.priority, reverse=True)

        # 🔥 Minimum fallback
        if len(final) < 3:
            fallback = [
                Recommendation("Maintain a balanced diet and active lifestyle.", "lifestyle_habit", "general", 0.0),
                Recommendation("Monitor your health indicators annually.", "clinical_consultation", "general", 0.0),
                Recommendation("Aim for daily physical activity.", "physical_activity", "general", 0.0),
            ]
            final.extend(fallback[:3 - len(final)])

        return RecommendationList(items=final)