"""
MetaTwin-X — AI Patient Report Generator
Generates structured patient reports with:
  - Test Analysis Table (What tested | Input | Expected | Actual)
  - Clinical interpretation per biomarker
  - Risk summary per organ
  - AI Recommendations
  - PDF-ready HTML output
"""
from __future__ import annotations
import sys, logging
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

log = logging.getLogger("metatwin-x.report_generator")

# ── Clinical reference ranges ──────────────────────────────────────────
CLINICAL_RANGES = {
    "systolic_bp":       {"name":"Systolic BP",       "unit":"mmHg", "low":None,"normal":(90,129), "high":(130,179),"critical":180},
    "diastolic_bp":      {"name":"Diastolic BP",       "unit":"mmHg", "low":None,"normal":(60,84),  "high":(85,119), "critical":120},
    "total_cholesterol": {"name":"Total Cholesterol",  "unit":"mg/dL","low":None,"normal":(0,199),  "high":(200,239),"critical":240},
    "hdl_cholesterol":   {"name":"HDL Cholesterol",    "unit":"mg/dL","low":40,  "normal":(40,59),  "high":(60,999), "critical":None},
    "ldl_cholesterol":   {"name":"LDL Cholesterol",    "unit":"mg/dL","low":None,"normal":(0,99),   "high":(100,159),"critical":160},
    "fasting_glucose":   {"name":"Fasting Glucose",    "unit":"mg/dL","low":70,  "normal":(70,99),  "high":(100,125),"critical":126},
    "serum_creatinine":  {"name":"Serum Creatinine",   "unit":"mg/dL","low":None,"normal":(0.5,1.2),"high":(1.3,2.0),"critical":2.0},
    "alt_enzyme":        {"name":"ALT Enzyme",         "unit":"U/L",  "low":None,"normal":(0,40),   "high":(41,80),  "critical":80},
    "ast_enzyme":        {"name":"AST Enzyme",         "unit":"U/L",  "low":None,"normal":(0,40),   "high":(41,80),  "critical":80},
    "bmi":               {"name":"BMI",                "unit":"kg/m²","low":18.5,"normal":(18.5,24.9),"high":(25,29.9),"critical":30},
    "hba1c":             {"name":"HbA1c",              "unit":"%",    "low":None,"normal":(0,5.6),  "high":(5.7,6.4),"critical":6.5},
    "urea":              {"name":"Blood Urea",         "unit":"mg/dL","low":None,"normal":(7,20),   "high":(21,40),  "critical":40},
}

BIOMARKER_EXPECTED = {
    "systolic_bp":       "Blood pressure should be below 130 mmHg for cardiovascular health",
    "diastolic_bp":      "Diastolic pressure should remain below 85 mmHg",
    "total_cholesterol": "Total cholesterol below 200 mg/dL reduces heart disease risk",
    "hdl_cholesterol":   "HDL above 60 mg/dL is cardioprotective",
    "ldl_cholesterol":   "LDL below 100 mg/dL is optimal for cardiovascular protection",
    "fasting_glucose":   "Fasting glucose 70–99 mg/dL indicates normal metabolic function",
    "serum_creatinine":  "Creatinine 0.5–1.2 mg/dL reflects normal kidney filtration",
    "alt_enzyme":        "ALT below 40 U/L indicates healthy liver function",
    "ast_enzyme":        "AST below 40 U/L indicates no hepatocyte damage",
    "bmi":               "BMI 18.5–24.9 represents healthy body weight",
    "hba1c":             "HbA1c below 5.7% indicates no diabetes risk",
    "urea":              "Blood urea 7–20 mg/dL reflects normal renal clearance",
}


def classify_biomarker(field: str, value: float) -> dict:
    """Classify a biomarker value as Normal / Elevated / High / Critical / Low."""
    ref = CLINICAL_RANGES.get(field)
    if ref is None:
        return {"status": "Unknown", "color": "gray", "flag": ""}

    status, color, flag = "Normal", "#10b981", ""
    lo = ref.get("low"); hi_thr = ref.get("high"); crit = ref.get("critical")
    norm = ref.get("normal", (0, 9999))

    if lo is not None and value < lo:
        status, color, flag = "Low", "#38bdf8", "⚠"
    elif crit is not None and value >= crit:
        status, color, flag = "Critical", "#dc2626", "🚨"
    elif hi_thr is not None:
        hi_lo, hi_hi = hi_thr
        if hi_lo <= value < (crit or 99999):
            status, color, flag = "Elevated", "#f59e0b", "⚠"
    elif isinstance(norm, tuple) and not (norm[0] <= value <= norm[1]):
        status, color, flag = "Abnormal", "#f59e0b", "⚠"

    return {"status": status, "color": color, "flag": flag}


def risk_label(score: float) -> tuple:
    if score < 0.30: return ("Low",      "#10b981", "Low risk — routine monitoring")
    if score < 0.60: return ("Moderate", "#f59e0b", "Moderate risk — lifestyle changes recommended")
    return                   ("High",     "#ef4444", "High risk — medical consultation required")


def health_score(scores: dict) -> int:
    h = scores.get("heart", 0); k = scores.get("kidney", 0); l = scores.get("liver", 0)
    return round((1 - (0.4*h + 0.3*k + 0.3*l)) * 100)


def health_status(score: int) -> str:
    if score >= 80: return "Excellent"
    if score >= 65: return "Good"
    if score >= 50: return "Fair"
    if score >= 35: return "Moderate Risk"
    return "High Risk"


def build_test_analysis(biomarkers: dict, scores: dict, audit_log: list) -> list:
    """
    Build structured test analysis table:
    What you tested | Input | What should happen | What actually happened
    """
    rows = []
    # Biomarker-level analysis
    for field, ref in CLINICAL_RANGES.items():
        val = biomarkers.get(field)
        if val is None: continue
        clf = classify_biomarker(field, val)
        expected = BIOMARKER_EXPECTED.get(field, "Should be within normal range")
        # Derive what actually happened based on classification
        if clf["status"] == "Normal":
            actual = f"✅ {ref['name']} is within normal range ({val} {ref['unit']})"
        elif clf["status"] == "Low":
            actual = f"⚠️ {ref['name']} is below normal ({val} {ref['unit']}) — may indicate deficiency"
        elif clf["status"] == "Critical":
            actual = f"🚨 {ref['name']} is critically elevated ({val} {ref['unit']}) — immediate attention required"
        else:
            actual = f"⚠️ {ref['name']} is elevated ({val} {ref['unit']}) — warrants investigation"
        rows.append({
            "what_tested":       ref["name"],
            "input":             f"{val} {ref['unit']}",
            "what_should_happen": expected,
            "what_actually_happened": actual,
            "status":            clf["status"],
            "color":             clf["color"],
            "flag":              clf["flag"],
        })

    # Organ-level risk analysis
    organ_info = [
        ("heart",  "Heart Risk Prediction",  "Heart",  "Heart risk should reflect cardiovascular biomarker severity"),
        ("kidney", "Kidney Risk Prediction", "Kidney", "Kidney risk should reflect renal biomarker severity"),
        ("liver",  "Liver Risk Prediction",  "Liver",  "Liver risk should reflect hepatic biomarker severity"),
    ]
    for key, label, name, expected in organ_info:
        score = scores.get(key, 0)
        lbl, col, interp = risk_label(score)
        rows.append({
            "what_tested":       label,
            "input":             f"Multi-biomarker profile",
            "what_should_happen": expected,
            "what_actually_happened": f"{lbl} risk detected — {name} risk score = {score*100:.1f}% ({interp})",
            "status":            lbl,
            "color":             col,
            "flag":              "🚨" if lbl=="High" else "⚠" if lbl=="Moderate" else "✅",
        })

    # Cross-organ interaction rules
    for entry in (audit_log or []):
        rule_id = entry.get("rule_id", "")
        organ   = entry.get("organ_affected", "")
        adj     = entry.get("adjustment", 0)
        if abs(adj) > 0.001:
            rows.append({
                "what_tested":       f"Cross-Organ Rule ({rule_id})",
                "input":             f"Elevated {organ} biomarkers",
                "what_should_happen": f"Rule {rule_id} should propagate risk between organs",
                "what_actually_happened": f"✅ Rule applied — {organ} risk adjusted by {adj*100:+.1f}% via interaction pathway",
                "status":            "Rule Applied",
                "color":             "#a78bfa",
                "flag":              "🔗",
            })

    return rows


def build_recommendations(scores: dict, biomarkers: dict) -> dict:
    """Generate AI clinical and lifestyle recommendations."""
    clinical, lifestyle = [], []
    h = scores.get("heart", 0)
    k = scores.get("kidney", 0)
    l = scores.get("liver", 0)

    # Heart
    if h >= 0.7:
        clinical += ["Urgent cardiology evaluation — ECG + stress test recommended",
                     "Discuss antihypertensive and statin therapy with physician"]
        lifestyle += ["Follow a cardiac diet — reduce saturated fat, increase omega-3",
                      "Target 150 min/week aerobic exercise (walking, cycling)"]
    elif h >= 0.4:
        clinical += ["Schedule cardiovascular check-up within 3 months"]
        lifestyle += ["Monitor blood pressure weekly", "Increase fibre intake (oats, legumes)"]

    # Kidney
    if k >= 0.7:
        clinical += ["Urgent nephrology evaluation — request eGFR and urine ACR",
                     "Avoid NSAIDs without medical supervision"]
        lifestyle += ["Restrict sodium intake to < 2,300 mg/day", "Stay hydrated — 2–3 litres/day"]
    elif k >= 0.4:
        clinical += ["Schedule nephrology follow-up within 2 months"]
        lifestyle += ["Moderate protein intake to 0.8 g/kg/day",
                      "Monitor fasting glucose regularly"]

    # Liver
    if l >= 0.7:
        clinical += ["Urgent hepatology evaluation — LFT + abdominal ultrasound",
                     "Request hepatitis B/C serology testing"]
        lifestyle += ["Complete alcohol abstinence", "Adopt Mediterranean diet"]
    elif l >= 0.4:
        clinical += ["Schedule hepatology review within 2–3 months"]
        lifestyle += ["Reduce refined carbohydrates and added sugars",
                      "Regular aerobic exercise reduces hepatic fat by up to 30%"]

    # Biomarker-specific
    if biomarkers.get("fasting_glucose", 0) >= 126:
        clinical.append("HbA1c testing and diabetes specialist referral recommended")
        lifestyle.append("Glycaemic control diet — low GI foods, avoid sugary drinks")
    if biomarkers.get("systolic_bp", 0) >= 140:
        clinical.append("Consider antihypertensive therapy if BP remains > 140/90 mmHg")
        lifestyle.append("Reduce salt intake, practice stress reduction techniques")
    if biomarkers.get("bmi", 0) >= 30:
        lifestyle.append("5–10% body weight reduction significantly improves all organ risks")
        lifestyle.append("Caloric deficit of 500 kcal/day recommended for sustainable weight loss")

    if not clinical: clinical = ["Continue current health management", "Annual full health check recommended"]
    if not lifestyle: lifestyle = ["Maintain active lifestyle — 7,000+ steps/day", "Follow a balanced, plant-rich diet"]

    return {"clinical": list(dict.fromkeys(clinical)), "lifestyle": list(dict.fromkeys(lifestyle))}


def generate_report(
    patient_id: str,
    scores: dict,
    biomarkers: dict,
    audit_log: list,
    extraction_confidence: float = 1.0,
    extracted_fields: list = None,
    warnings: list = None,
    patient_name: str = "Patient",
) -> dict:
    """
    Generate the full structured AI patient report.
    Returns a dict suitable for JSON response + HTML generation.
    """
    hs      = health_score(scores)
    hs_lbl  = health_status(hs)
    rows    = build_test_analysis(biomarkers, scores, audit_log)
    recs    = build_recommendations(scores, biomarkers)
    now     = datetime.now().strftime("%d %B %Y, %H:%M")
    abnormal = [r for r in rows if r["status"] not in ("Normal", "Rule Applied")]

    h_lbl, h_col, h_int = risk_label(scores.get("heart",  0))
    k_lbl, k_col, k_int = risk_label(scores.get("kidney", 0))
    l_lbl, l_col, l_int = risk_label(scores.get("liver",  0))

    return {
        "patient_id":   patient_id,
        "patient_name": patient_name,
        "generated_at": now,
        "report_title": "Multi-Organ Risk Assessment Report",
        "summary": {
            "health_score":  hs,
            "health_status": hs_lbl,
            "overall":       f"Based on the uploaded medical report and AI analysis, {patient_name} has an overall health score of {hs}/100 ({hs_lbl}).",
            "abnormal_count": len(abnormal),
        },
        "risk_analysis": {
            "heart":  {"score": round(scores.get("heart",  0)*100, 1), "label": h_lbl, "color": h_col, "interpretation": h_int},
            "kidney": {"score": round(scores.get("kidney", 0)*100, 1), "label": k_lbl, "color": k_col, "interpretation": k_int},
            "liver":  {"score": round(scores.get("liver",  0)*100, 1), "label": l_lbl, "color": l_col, "interpretation": l_int},
        },
        "test_analysis": rows,
        "key_findings": [
            {"finding": r["what_actually_happened"], "severity": r["status"], "color": r["color"]}
            for r in rows if r["status"] not in ("Normal", "Rule Applied")
        ],
        "recommendations": recs,
        "conclusion": (
            f"{patient_name}'s health profile indicates {hs_lbl.lower()} status (score: {hs}/100). "
            f"{'Immediate medical consultation is strongly advised.' if hs < 40 else 'Regular monitoring and lifestyle adjustments are recommended.' if hs < 65 else 'Continue current healthy practices and annual screening.'}"
        ),
        "extraction_metadata": {
            "confidence":        round(extraction_confidence, 2),
            "extracted_fields":  extracted_fields or [],
            "warnings":          warnings or [],
        },
    }
