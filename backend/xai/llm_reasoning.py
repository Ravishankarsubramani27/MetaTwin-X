"""
🧠 NOVEL COMPONENT 10: LLM-Based Clinical Reasoning Engine

Provides natural language explanations without requiring a hosted LLM.
Uses structured template reasoning with medical knowledge base.
Answers queries like "Why is my heart risk high?"
"""
from __future__ import annotations
import re
from typing import Dict, List, Optional

# ── Knowledge base for natural language generation ─────────────────────
ORGAN_DESCRIPTIONS = {
    "heart": {
        "name": "Cardiovascular System",
        "drivers_high": ["elevated blood pressure", "high cholesterol", "high glucose", "obesity", "low HDL"],
        "drivers_low":  ["normal BP", "optimal lipids", "healthy weight", "regular exercise"],
        "symptoms":     ["chest discomfort", "shortness of breath", "irregular heartbeat"],
        "interventions":["blood pressure control", "statin therapy", "aerobic exercise", "dietary modification"],
    },
    "kidney": {
        "name": "Renal System",
        "drivers_high": ["diabetes (high glucose)", "hypertension", "elevated creatinine", "obesity"],
        "drivers_low":  ["controlled glucose", "normal BP", "adequate hydration"],
        "symptoms":     ["reduced urine output", "ankle swelling", "fatigue"],
        "interventions":["glycaemic control", "BP management", "low sodium diet", "nephrology review"],
    },
    "liver": {
        "name": "Hepatic System",
        "drivers_high": ["elevated ALT/AST", "obesity (BMI>30)", "alcohol", "high cholesterol"],
        "drivers_low":  ["normal liver enzymes", "healthy weight", "low alcohol"],
        "symptoms":     ["fatigue", "abdominal discomfort", "jaundice"],
        "interventions":["weight reduction", "alcohol cessation", "Mediterranean diet", "hepatology review"],
    },
}

RISK_NARRATIVE = {
    "low":      ("within a healthy range", "Your current lifestyle appears to be protective."),
    "moderate": ("moderately elevated", "Early intervention can prevent progression to high risk."),
    "high":     ("significantly elevated", "Immediate clinical attention and lifestyle modification are strongly advised."),
}


def _risk_level(score: float) -> str:
    if score < 0.4: return "low"
    if score < 0.7: return "moderate"
    return "high"


def _top_biomarker_drivers(
    biomarkers: Dict[str, float],
    organ: str,
    audit_log: List[Dict],
) -> List[str]:
    """Extract top contributing biomarkers from audit log."""
    relevant = [
        e for e in audit_log
        if e.get("target_organ") == organ and abs(e.get("delta", 0)) > 0.005
    ]
    relevant.sort(key=lambda x: abs(x.get("delta", 0)), reverse=True)
    drivers = []
    for e in relevant[:3]:
        feat  = e.get("source_feature", e.get("source_organ", "unknown"))
        val   = e.get("source_value", biomarkers.get(feat))
        delta = e.get("delta", 0)
        if val is not None:
            direction = "elevated" if delta > 0 else "protective"
            drivers.append(f"{feat.replace('_',' ')} ({val:.1f}) is {direction}")
    return drivers


def explain_risk(
    organ: str,
    score: float,
    biomarkers: Dict[str, float],
    audit_log: List[Dict],
    patient_age: Optional[int] = None,
    patient_sex: Optional[str] = None,
) -> str:
    """Generate natural language explanation for organ risk."""
    level       = _risk_level(score)
    organ_meta  = ORGAN_DESCRIPTIONS.get(organ, {})
    narrative   = RISK_NARRATIVE[level]
    drivers     = _top_biomarker_drivers(biomarkers, organ, audit_log)

    demo = ""
    if patient_age and patient_sex:
        demo = f"For a {patient_age}-year-old {patient_sex}, "

    explanation = (
        f"{demo}your {organ_meta.get('name', organ)} risk score is {score*100:.1f}%, "
        f"which is {narrative[0]}. {narrative[1]}\n\n"
    )

    if drivers:
        explanation += "**Key contributing factors:**\n"
        for d in drivers:
            explanation += f"• {d.capitalize()}\n"
        explanation += "\n"

    if level in ("moderate", "high"):
        top_interventions = organ_meta.get("interventions", [])[:3]
        if top_interventions:
            explanation += "**Recommended actions:**\n"
            for action in top_interventions:
                explanation += f"• {action.capitalize()}\n"

    return explanation.strip()


def answer_query(
    query: str,
    scores: Dict[str, float],
    biomarkers: Dict[str, float],
    audit_log: List[Dict],
) -> str:
    """
    Answer natural language health queries using structured reasoning.
    No LLM API required — uses medical knowledge templates.
    """
    q = query.lower().strip()

    # Route query to appropriate handler
    if any(w in q for w in ["heart", "cardiac", "cardiovascular", "chest"]):
        organ = "heart"
    elif any(w in q for w in ["kidney", "renal", "creatinine"]):
        organ = "kidney"
    elif any(w in q for w in ["liver", "hepatic", "alt", "ast"]):
        organ = "liver"
    elif any(w in q for w in ["overall", "health", "general", "summary", "status"]):
        return _overall_summary(scores, biomarkers)
    elif any(w in q for w in ["worst", "highest", "most risk", "biggest"]):
        worst = max(scores, key=lambda o: scores[o])
        return f"Your highest risk organ is **{worst.capitalize()}** at {scores[worst]*100:.1f}%. " + \
               explain_risk(worst, scores[worst], biomarkers, audit_log)
    elif any(w in q for w in ["improve", "reduce", "lower", "decrease", "better"]):
        return _improvement_advice(scores, biomarkers)
    else:
        return _general_health_response(scores)

    score = scores.get(organ, 0.0)
    return explain_risk(organ, score, biomarkers, audit_log)


def _overall_summary(scores: Dict[str, float], biomarkers: Dict) -> str:
    max_risk     = max(scores.values())
    health_score = int((1 - max_risk) * 100)
    worst        = max(scores, key=lambda o: scores[o])
    level        = _risk_level(max_risk)

    status_map = {"low": "✅ Good", "moderate": "⚠️ Fair", "high": "🚨 At Risk"}
    status     = status_map[level]

    summary = (
        f"**Overall Health Score: {health_score}/100** ({status})\n\n"
        f"• Heart Risk:  {scores.get('heart',0)*100:.1f}% — {_risk_level(scores.get('heart',0)).upper()}\n"
        f"• Kidney Risk: {scores.get('kidney',0)*100:.1f}% — {_risk_level(scores.get('kidney',0)).upper()}\n"
        f"• Liver Risk:  {scores.get('liver',0)*100:.1f}% — {_risk_level(scores.get('liver',0)).upper()}\n\n"
        f"Your primary concern is the **{worst.capitalize()}** system. "
        f"Focus interventions here for maximum health improvement."
    )
    return summary


def _improvement_advice(scores: Dict, biomarkers: Dict) -> str:
    # Find organ with most room for improvement
    targets = {
        "heart":  {"exercise": "150 min aerobic/week", "diet": "reduce saturated fat", "meds": "statin if cholesterol>200"},
        "kidney": {"exercise": "30 min low-impact/day", "diet": "low sodium, moderate protein", "meds": "BP control if SBP>130"},
        "liver":  {"exercise": "aerobic 5x/week reduces liver fat 30%", "diet": "Mediterranean diet", "meds": "hepatology review if ALT>80"},
    }
    worst = max(scores, key=lambda o: scores[o])
    t     = targets[worst]
    return (
        f"To improve your **{worst.capitalize()}** health (currently {scores[worst]*100:.1f}% risk):\n\n"
        f"🏃 **Exercise:** {t['exercise']}\n"
        f"🥗 **Diet:** {t['diet']}\n"
        f"💊 **Clinical:** {t['meds']}\n\n"
        f"Consistent adherence to these changes is estimated to reduce {worst} risk by 10-25% over 3 months."
    )


def _general_health_response(scores: Dict) -> str:
    return (
        f"I can help you understand your health. Current risk scores:\n"
        f"Heart: {scores.get('heart',0)*100:.1f}% | "
        f"Kidney: {scores.get('kidney',0)*100:.1f}% | "
        f"Liver: {scores.get('liver',0)*100:.1f}%\n\n"
        f"Ask me: 'Why is my heart risk high?' or 'How do I improve my liver health?'"
    )
