"""Home Screen — Medical Analysis Report (when data available) or Welcome."""
from __future__ import annotations
import streamlit as st
import plotly.graph_objects as go
from datetime import datetime
from src.color_mapping import color_for_score, risk_label


# ── Welcome (no data) ─────────────────────────────────────────────────────────
def _welcome():
    st.markdown("""
<div style="text-align:center;padding:52px 20px 36px;">
    <div style="width:76px;height:76px;background:linear-gradient(135deg,#1e3a8a,#7c3aed);
                border-radius:22px;display:flex;align-items:center;justify-content:center;
                margin:0 auto 22px;box-shadow:0 8px 28px rgba(37,99,235,0.28);">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
             stroke="#fff" stroke-width="2" stroke-linecap="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
    </div>
    <h2 style="color:#0f172a;font-size:1.75rem;font-weight:800;margin:0 0 12px;
               letter-spacing:-0.03em;font-family:'Inter',sans-serif;">
        MetaTwin-X Digital Health Twin
    </h2>
    <p style="color:#64748b;font-size:0.92rem;max-width:540px;margin:0 auto 36px;
              line-height:1.75;font-family:'Inter',sans-serif;">
        Upload a medical report or enter your health data to generate a
        personalised multi-organ risk analysis with AI-powered predictions,
        12-month simulation, and clinical recommendations.
    </p>
</div>
""", unsafe_allow_html=True)

    c1, c2, c3, c4 = st.columns(4)
    features = [
        (c1, "#2563eb", "Upload Report",      "PDF or image lab report — auto-extract biomarkers",
         "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"),
        (c2, "#7c3aed", "Enter Health Data",  "Manual biomarker entry with live validation",
         "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"),
        (c3, "#0891b2", "AI Risk Prediction", "XGBoost models for Heart, Kidney & Liver",
         "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"),
        (c4, "#059669", "Clinical Report",    "Structured findings, outcomes & suggestions",
         "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"),
    ]
    for col, color, title, desc, path in features:
        with col:
            st.markdown(f"""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-top:3px solid {color};
            border-radius:12px;padding:22px;text-align:center;
            box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <div style="width:46px;height:46px;background:{color}14;border-radius:12px;
                display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke="{color}" stroke-width="2" stroke-linecap="round">
            <path d="{path}"/>
        </svg>
    </div>
    <div style="color:#0f172a;font-size:0.88rem;font-weight:700;margin-bottom:6px;
                font-family:'Inter',sans-serif;">{title}</div>
    <div style="color:#64748b;font-size:0.75rem;line-height:1.5;
                font-family:'Inter',sans-serif;">{desc}</div>
</div>
""", unsafe_allow_html=True)

    st.markdown("""
<div style="text-align:center;color:#94a3b8;font-size:0.82rem;margin-top:24px;
            font-family:'Inter',sans-serif;">
    Use the sidebar →
    <strong style="color:#2563eb;">Report Upload</strong> or
    <strong style="color:#2563eb;">Health Input</strong> to get started.
</div>
""", unsafe_allow_html=True)


# ── Helpers ───────────────────────────────────────────────────────────────────
def _risk_arc(score: float, color: str) -> go.Figure:
    pct = score * 100
    fig = go.Figure(go.Pie(
        values=[pct, max(0, 100 - pct)],
        hole=0.72,
        marker=dict(colors=[color, "#f1f5f9"], line=dict(color="#ffffff", width=2)),
        textinfo="none", hoverinfo="skip", sort=False,
        direction="clockwise", rotation=90,
    ))
    fig.add_annotation(
        text=f"<b>{pct:.0f}%</b>",
        x=0.5, y=0.5, showarrow=False,
        font=dict(size=16, color=color, family="Inter, sans-serif"),
    )
    fig.update_layout(
        height=120, margin=dict(l=4, r=4, t=4, b=4),
        paper_bgcolor="rgba(0,0,0,0)", showlegend=False,
    )
    return fig


def _severity_label(score: float) -> tuple[str, str, str]:
    """Returns (label, bg_color, text_color)."""
    if score < 0.4:
        return "LOW RISK",      "#dcfce7", "#15803d"
    elif score < 0.7:
        return "MODERATE RISK", "#fef9c3", "#a16207"
    else:
        return "HIGH RISK",     "#fee2e2", "#dc2626"


def _clinical_interpretation(organ: str, score: float, raw_inputs) -> str:
    """Generate a clinical interpretation sentence for each organ."""
    level = risk_label(score)
    pct   = score * 100

    if organ == "heart":
        sbp  = getattr(raw_inputs, "systolic_bp", 120)
        chol = getattr(raw_inputs, "total_cholesterol", 190)
        if score >= 0.7:
            return (f"Cardiovascular risk is critically elevated at {pct:.1f}%. "
                    f"Systolic BP of {sbp:.0f} mmHg and cholesterol of {chol:.0f} mg/dL "
                    f"are primary contributors. Immediate cardiology consultation is advised.")
        elif score >= 0.4:
            return (f"Cardiovascular risk is moderately elevated at {pct:.1f}%. "
                    f"Blood pressure ({sbp:.0f} mmHg) and lipid profile require monitoring. "
                    f"Lifestyle modifications are recommended.")
        else:
            return (f"Cardiovascular risk is within acceptable range at {pct:.1f}%. "
                    f"Continue preventive care and annual screening.")

    elif organ == "kidney":
        cr  = getattr(raw_inputs, "serum_creatinine", 0.9)
        glc = getattr(raw_inputs, "fasting_glucose", 90)
        if score >= 0.7:
            return (f"Renal function is significantly compromised — risk score {pct:.1f}%. "
                    f"Creatinine of {cr:.2f} mg/dL and glucose of {glc:.0f} mg/dL indicate "
                    f"active kidney stress. Nephrology referral is urgently required.")
        elif score >= 0.4:
            return (f"Renal risk is moderately elevated at {pct:.1f}%. "
                    f"Creatinine ({cr:.2f} mg/dL) and glucose ({glc:.0f} mg/dL) should be "
                    f"monitored closely. Dietary sodium restriction is recommended.")
        else:
            return (f"Kidney function indicators are within normal limits — risk {pct:.1f}%. "
                    f"Maintain adequate hydration and avoid nephrotoxic medications.")

    elif organ == "liver":
        alt = getattr(raw_inputs, "alt_enzyme", 25)
        ast = getattr(raw_inputs, "ast_enzyme", 22)
        if score >= 0.7:
            return (f"Hepatic stress is critically high — risk score {pct:.1f}%. "
                    f"ALT of {alt:.0f} U/L and AST of {ast:.0f} U/L indicate significant "
                    f"liver inflammation. Hepatology evaluation and imaging are urgently needed.")
        elif score >= 0.4:
            return (f"Hepatic risk is moderately elevated at {pct:.1f}%. "
                    f"Enzyme levels (ALT: {alt:.0f}, AST: {ast:.0f} U/L) suggest mild hepatic "
                    f"stress. Alcohol restriction and dietary changes are advised.")
        else:
            return (f"Liver function markers are within normal range — risk {pct:.1f}%. "
                    f"Continue healthy lifestyle habits to maintain hepatic health.")
    return ""


def _get_suggestions(organ: str, score: float) -> list[str]:
    """Return structured actionable suggestions per organ and risk level."""
    if organ == "heart":
        if score >= 0.7:
            return [
                "Schedule an urgent cardiovascular evaluation with a cardiologist (ECG + stress test)",
                "Discuss antihypertensive and statin therapy with your physician",
                "Eliminate tobacco use immediately — reduces CVD risk by up to 50% within 1 year",
                "Target blood pressure below 130/80 mmHg through medication and lifestyle",
                "Adopt a cardiac diet: low saturated fat, high omega-3, high fibre",
                "Wear a continuous heart rate monitor to detect arrhythmias",
            ]
        elif score >= 0.4:
            return [
                "Schedule a cardiovascular check-up within the next 3 months",
                "Aim for 150 minutes of moderate aerobic exercise per week",
                "Reduce saturated fat intake to less than 7% of daily calories",
                "Monitor blood pressure at home weekly and log readings",
                "Add 2 sessions of resistance training per week",
                "Increase soluble fibre intake (oats, legumes) to reduce LDL by 5–10%",
            ]
        else:
            return [
                "Maintain current healthy lifestyle — annual cardiovascular screening",
                "Continue regular physical activity (7,000+ steps/day)",
                "Follow a heart-healthy diet rich in vegetables, fruits, and whole grains",
                "Avoid smoking and limit alcohol consumption",
            ]

    elif organ == "kidney":
        if score >= 0.7:
            return [
                "Arrange urgent nephrology evaluation — request eGFR and urine albumin-creatinine ratio",
                "Request kidney ultrasound to assess structural abnormalities",
                "Strictly control blood pressure to below 130/80 mmHg",
                "Consult a renal dietitian for a kidney-protective nutrition plan",
                "Avoid NSAIDs (ibuprofen, naproxen) without medical supervision",
                "Track fluid intake and output daily — report changes to nephrologist",
            ]
        elif score >= 0.4:
            return [
                "Schedule nephrology follow-up within 1–2 months",
                "Reduce sodium intake to less than 2,300 mg/day",
                "Moderate protein intake to 0.8 g/kg body weight per day",
                "Monitor fasting blood glucose regularly — diabetes is the leading cause of CKD",
                "Engage in 30 minutes of low-impact exercise at least 5 days per week",
                "Stay well-hydrated with 2–3 litres of water daily",
            ]
        else:
            return [
                "Maintain adequate hydration (2–3 litres/day)",
                "Annual kidney function panel (creatinine, eGFR, urinalysis)",
                "Avoid prolonged use of over-the-counter pain medications",
                "Maintain healthy blood pressure and blood sugar levels",
            ]

    elif organ == "liver":
        if score >= 0.7:
            return [
                "Arrange urgent hepatology evaluation — liver function tests + abdominal ultrasound",
                "Discuss FibroScan or liver biopsy with hepatologist to assess fibrosis stage",
                "Request hepatitis B and C serology testing",
                "Abstain completely from alcohol — even moderate use accelerates fibrosis",
                "Work with a hepatology dietitian for a liver-protective nutrition plan",
                "Ensure hepatitis A and B vaccinations are current",
            ]
        elif score >= 0.4:
            return [
                "Schedule hepatology review within 2–3 months",
                "Reduce refined carbohydrates and added sugars to decrease hepatic fat",
                "Adopt a Mediterranean-style diet (olive oil, fish, legumes, whole grains)",
                "Regular aerobic exercise (5 days/week, 30 min) reduces hepatic fat by up to 30%",
                "Limit alcohol to no more than 1 drink/day (women) or 2 drinks/day (men)",
                "Maintain a healthy weight — 5–10% weight loss significantly improves liver enzymes",
            ]
        else:
            return [
                "Limit alcohol consumption and avoid hepatotoxic medications",
                "Increase cruciferous vegetables (broccoli, kale) to support liver detoxification",
                "Annual liver function panel (ALT, AST, GGT)",
                "Maintain healthy BMI through diet and exercise",
            ]
    return []


# ── Main render ───────────────────────────────────────────────────────────────
def render_home_screen(adjusted_scores=None, raw_inputs=None,
                       sim_result=None, recommendations=None):
    if not adjusted_scores:
        _welcome()
        return

    scores   = adjusted_scores
    max_risk = max(scores.heart, scores.kidney, scores.liver)
    hs       = int((1 - max_risk) * 100)
    hs_color = "#10b981" if hs >= 70 else "#f59e0b" if hs >= 40 else "#ef4444"
    now      = datetime.now().strftime("%d %B %Y, %H:%M")

    # ── REPORT HEADER ─────────────────────────────────────────────────
    age_str = f"{raw_inputs.age} yrs" if raw_inputs else "—"
    sex_str = raw_inputs.sex.capitalize() if raw_inputs else "—"

    st.markdown(f"""
<div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%);
            border-radius:14px;padding:24px 28px;margin-bottom:22px;
            box-shadow:0 6px 24px rgba(15,23,42,0.2);">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
            <div style="color:rgba(255,255,255,0.6);font-size:0.7rem;font-weight:700;
                        text-transform:uppercase;letter-spacing:0.12em;
                        font-family:'Inter',sans-serif;margin-bottom:6px;">
                MetaTwin-X · Medical Analysis Report
            </div>
            <div style="color:#ffffff;font-size:1.5rem;font-weight:800;
                        letter-spacing:-0.02em;font-family:'Inter',sans-serif;
                        margin-bottom:4px;">
                Multi-Organ Risk Assessment
            </div>
            <div style="color:rgba(255,255,255,0.65);font-size:0.8rem;
                        font-family:'Inter',sans-serif;">
                Patient: {sex_str}, {age_str} &nbsp;·&nbsp; Generated: {now}
            </div>
        </div>
        <div style="text-align:right;">
            <div style="color:rgba(255,255,255,0.6);font-size:0.65rem;font-weight:700;
                        text-transform:uppercase;letter-spacing:0.1em;
                        font-family:'Inter',sans-serif;margin-bottom:4px;">Overall Health Score</div>
            <div style="color:{hs_color};font-size:2.8rem;font-weight:900;
                        font-family:'Inter',sans-serif;line-height:1;">{hs}</div>
            <div style="color:rgba(255,255,255,0.5);font-size:0.72rem;
                        font-family:'Inter',sans-serif;">out of 100</div>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

    # ── CRITICAL ALERT ─────────────────────────────────────────────────
    if max_risk >= 0.7:
        worst = max({"Heart": scores.heart, "Kidney": scores.kidney, "Liver": scores.liver},
                    key=lambda k: {"Heart": scores.heart, "Kidney": scores.kidney, "Liver": scores.liver}[k])
        st.markdown(f"""
<div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #ef4444;
            border-radius:10px;padding:14px 18px;margin-bottom:20px;
            display:flex;align-items:center;gap:12px;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="#ef4444" stroke-width="2" style="flex-shrink:0;">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    <div>
        <strong style="color:#dc2626;font-size:0.88rem;font-family:'Inter',sans-serif;">
            ⚠ Critical Risk Alert — {worst}
        </strong>
        <div style="color:#b91c1c;font-size:0.78rem;font-family:'Inter',sans-serif;margin-top:2px;">
            High-risk findings detected. Immediate consultation with a healthcare professional is strongly advised.
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

    # ── SECTION 1: RISK SCORE SUMMARY ─────────────────────────────────
    st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:800;letter-spacing:-0.01em;
            margin-bottom:14px;font-family:'Inter',sans-serif;
            display:flex;align-items:center;gap:8px;">
    <span style="width:4px;height:20px;background:#2563eb;border-radius:2px;display:inline-block;"></span>
    Risk Score Summary
</div>
""", unsafe_allow_html=True)

    c1, c2, c3 = st.columns(3)
    for col, organ, score, accent, icon_path in [
        (c1, "Heart",  scores.heart,  "#ef4444",
         "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"),
        (c2, "Kidney", scores.kidney, "#3b82f6",
         "M4.5 12.5c-.5-4 2-8 7.5-8s8 4 7.5 8c-.5 4-3 7-7.5 7s-7-3-7.5-7z"),
        (c3, "Liver",  scores.liver,  "#10b981",
         "M12 2C8 2 4 6 4 10c0 5 4 10 8 12 4-2 8-7 8-12 0-4-4-8-8-8z"),
    ]:
        c      = color_for_score(score)
        lbl, bb, bc = _severity_label(score)
        with col:
            st.markdown(f"""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
            padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.05);text-align:center;">
    <div style="width:44px;height:44px;background:{accent}14;border-radius:12px;
                display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="{accent}" stroke-width="2">
            <path d="{icon_path}"/>
        </svg>
    </div>
    <div style="color:#94a3b8;font-size:0.65rem;font-weight:700;text-transform:uppercase;
                letter-spacing:0.1em;margin-bottom:6px;font-family:'Inter',sans-serif;">
        {organ} Risk
    </div>
    <div style="color:{c};font-size:2.4rem;font-weight:900;line-height:1;
                font-family:'Inter',sans-serif;">{score*100:.1f}%</div>
    <span style="background:{bb};color:{bc};border-radius:20px;padding:4px 14px;
                 font-size:0.68rem;font-weight:700;text-transform:uppercase;
                 font-family:'Inter',sans-serif;display:inline-block;margin-top:10px;">
        {lbl}
    </span>
</div>
""", unsafe_allow_html=True)
            st.plotly_chart(_risk_arc(score, c), use_container_width=True,
                            key=f"arc_{organ}")

    st.markdown("<div style='height:8px;'></div>", unsafe_allow_html=True)

    # ── SECTION 2: CLINICAL FINDINGS ──────────────────────────────────
    st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:800;letter-spacing:-0.01em;
            margin:20px 0 14px;font-family:'Inter',sans-serif;
            display:flex;align-items:center;gap:8px;">
    <span style="width:4px;height:20px;background:#7c3aed;border-radius:2px;display:inline-block;"></span>
    Clinical Findings
</div>
""", unsafe_allow_html=True)

    for organ, score, accent in [
        ("heart",  scores.heart,  "#ef4444"),
        ("kidney", scores.kidney, "#3b82f6"),
        ("liver",  scores.liver,  "#10b981"),
    ]:
        lbl, bb, bc = _severity_label(score)
        interp = _clinical_interpretation(organ, score, raw_inputs)
        organ_title = {"heart": "Cardiovascular System", "kidney": "Renal System", "liver": "Hepatic System"}[organ]
        st.markdown(f"""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-left:4px solid {accent};
            border-radius:10px;padding:16px 20px;margin-bottom:12px;
            box-shadow:0 1px 4px rgba(0,0,0,0.04);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
            <span style="width:10px;height:10px;border-radius:50%;background:{accent};
                         display:inline-block;"></span>
            <span style="color:#0f172a;font-size:0.9rem;font-weight:700;
                         font-family:'Inter',sans-serif;">{organ_title}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
            <span style="color:{color_for_score(score)};font-size:1rem;font-weight:800;
                         font-family:'Inter',sans-serif;">{score*100:.1f}%</span>
            <span style="background:{bb};color:{bc};border-radius:20px;padding:3px 12px;
                         font-size:0.67rem;font-weight:700;text-transform:uppercase;
                         font-family:'Inter',sans-serif;">{lbl}</span>
        </div>
    </div>
    <div style="height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden;margin-bottom:12px;">
        <div style="height:100%;width:{score*100:.1f}%;
                    background:linear-gradient(90deg,{color_for_score(score)}88,{color_for_score(score)});
                    border-radius:3px;"></div>
    </div>
    <div style="color:#374151;font-size:0.84rem;line-height:1.7;font-family:'Inter',sans-serif;">
        {interp}
    </div>
</div>
""", unsafe_allow_html=True)

    # ── SECTION 3: KEY BIOMARKERS ──────────────────────────────────────
    if raw_inputs:
        st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:800;letter-spacing:-0.01em;
            margin:20px 0 14px;font-family:'Inter',sans-serif;
            display:flex;align-items:center;gap:8px;">
    <span style="width:4px;height:20px;background:#0891b2;border-radius:2px;display:inline-block;"></span>
    Key Biomarker Values
</div>
""", unsafe_allow_html=True)

        # ── CKD-EPI eGFR calculation ──────────────────────────────
        def _egfr(cr, age, sex):
            """CKD-EPI 2021 simplified estimate (mL/min/1.73 m²)."""
            is_female = str(sex).lower() == "female"
            kappa  = 0.7 if is_female else 0.9
            alpha  = -0.241 if is_female else -0.302
            smult  = 1.012 if is_female else 1.0
            ratio  = cr / kappa
            term   = ratio ** alpha if ratio < 1 else ratio ** -1.200
            return int(142 * term * (0.9938 ** age) * smult)

        egfr_val  = _egfr(raw_inputs.serum_creatinine, raw_inputs.age, raw_inputs.sex)
        egfr_col  = ("#10b981" if egfr_val >= 90 else
                     "#f59e0b" if egfr_val >= 60 else
                     "#f97316" if egfr_val >= 30 else "#ef4444")
        egfr_lbl  = ("G1 — Normal (≥90)"       if egfr_val >= 90 else
                     "G2 — Mildly ↓ (60–89)"   if egfr_val >= 60 else
                     "G3 — Moderately ↓ (30–59)" if egfr_val >= 30 else
                     "G4/5 — Severely ↓ (<30)")

        bio_rows = [
            ("Blood Pressure",    f"{raw_inputs.systolic_bp:.0f}/{raw_inputs.diastolic_bp:.0f}", "mmHg",
             "#10b981" if raw_inputs.systolic_bp < 130 else "#f59e0b" if raw_inputs.systolic_bp < 140 else "#ef4444",
             "Normal" if raw_inputs.systolic_bp < 130 else "Elevated" if raw_inputs.systolic_bp < 140 else "High"),
            ("Total Cholesterol", f"{raw_inputs.total_cholesterol:.0f}", "mg/dL",
             "#10b981" if raw_inputs.total_cholesterol < 200 else "#f59e0b" if raw_inputs.total_cholesterol < 240 else "#ef4444",
             "Desirable" if raw_inputs.total_cholesterol < 200 else "Borderline" if raw_inputs.total_cholesterol < 240 else "High"),
            ("Fasting Glucose",   f"{raw_inputs.fasting_glucose:.0f}", "mg/dL",
             "#10b981" if raw_inputs.fasting_glucose < 100 else "#f59e0b" if raw_inputs.fasting_glucose < 126 else "#ef4444",
             "Normal" if raw_inputs.fasting_glucose < 100 else "Pre-diabetic" if raw_inputs.fasting_glucose < 126 else "Diabetic range"),
            ("Serum Creatinine",  f"{raw_inputs.serum_creatinine:.2f}", "mg/dL",
             "#10b981" if 0.6 <= raw_inputs.serum_creatinine <= 1.2 else "#f59e0b" if raw_inputs.serum_creatinine <= 1.5 else "#ef4444",
             "Normal" if 0.6 <= raw_inputs.serum_creatinine <= 1.2 else "Borderline" if raw_inputs.serum_creatinine <= 1.5 else "Elevated"),
            # ── eGFR derived row ──────────────────────────────────
            ("eGFR (CKD-EPI)",    f"{egfr_val}", "mL/min/1.73m²",
             egfr_col, egfr_lbl),
            ("ALT Enzyme",        f"{raw_inputs.alt_enzyme:.0f}", "U/L",
             "#10b981" if raw_inputs.alt_enzyme <= 40 else "#f59e0b" if raw_inputs.alt_enzyme <= 80 else "#ef4444",
             "Normal" if raw_inputs.alt_enzyme <= 40 else "Mildly Elevated" if raw_inputs.alt_enzyme <= 80 else "Elevated"),
            ("AST Enzyme",        f"{raw_inputs.ast_enzyme:.0f}", "U/L",
             "#10b981" if raw_inputs.ast_enzyme <= 40 else "#f59e0b" if raw_inputs.ast_enzyme <= 80 else "#ef4444",
             "Normal" if raw_inputs.ast_enzyme <= 40 else "Mildly Elevated" if raw_inputs.ast_enzyme <= 80 else "Elevated"),
            ("BMI",               f"{raw_inputs.bmi:.1f}", "kg/m²",
             "#10b981" if 18.5 <= raw_inputs.bmi < 25 else "#f59e0b" if raw_inputs.bmi < 30 else "#ef4444",
             "Normal" if 18.5 <= raw_inputs.bmi < 25 else "Overweight" if raw_inputs.bmi < 30 else "Obese"),
            ("HDL Cholesterol",   f"{raw_inputs.hdl_cholesterol:.0f}", "mg/dL",
             "#10b981" if raw_inputs.hdl_cholesterol >= 40 else "#ef4444",
             "Good" if raw_inputs.hdl_cholesterol >= 60 else "Acceptable" if raw_inputs.hdl_cholesterol >= 40 else "Low"),
        ]

        st.markdown("""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
            overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <table style="width:100%;border-collapse:collapse;">
        <thead>
            <tr style="background:#f8fafc;">
                <th style="padding:11px 16px;text-align:left;font-size:0.65rem;font-weight:700;
                           text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;
                           border-bottom:1px solid #f1f5f9;font-family:'Inter',sans-serif;">
                    Biomarker</th>
                <th style="padding:11px 16px;text-align:center;font-size:0.65rem;font-weight:700;
                           text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;
                           border-bottom:1px solid #f1f5f9;font-family:'Inter',sans-serif;">
                    Value</th>
                <th style="padding:11px 16px;text-align:center;font-size:0.65rem;font-weight:700;
                           text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;
                           border-bottom:1px solid #f1f5f9;font-family:'Inter',sans-serif;">
                    Unit</th>
                <th style="padding:11px 16px;text-align:center;font-size:0.65rem;font-weight:700;
                           text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;
                           border-bottom:1px solid #f1f5f9;font-family:'Inter',sans-serif;">
                    Status</th>
            </tr>
        </thead>
        <tbody>
""", unsafe_allow_html=True)

        for i, (label, val, unit, color, status) in enumerate(bio_rows):
            row_bg = "#ffffff" if i % 2 == 0 else "#fafbfc"
            sb = "#dcfce7" if "Normal" in status or "Good" in status or "Desirable" in status else \
                 "#fef9c3" if "Border" in status or "Pre" in status or "Mild" in status or "Over" in status or "Accept" in status else \
                 "#fee2e2"
            sc = "#15803d" if sb == "#dcfce7" else "#a16207" if sb == "#fef9c3" else "#dc2626"
            st.markdown(f"""
            <tr style="background:{row_bg};">
                <td style="padding:11px 16px;font-size:0.84rem;color:#374151;font-weight:500;
                           border-bottom:1px solid #f1f5f9;font-family:'Inter',sans-serif;">
                    {label}</td>
                <td style="padding:11px 16px;text-align:center;font-size:0.9rem;
                           color:{color};font-weight:700;border-bottom:1px solid #f1f5f9;
                           font-family:'Inter',sans-serif;">{val}</td>
                <td style="padding:11px 16px;text-align:center;font-size:0.78rem;
                           color:#94a3b8;border-bottom:1px solid #f1f5f9;
                           font-family:'Inter',sans-serif;">{unit}</td>
                <td style="padding:11px 16px;text-align:center;border-bottom:1px solid #f1f5f9;">
                    <span style="background:{sb};color:{sc};border-radius:20px;
                                 padding:3px 10px;font-size:0.67rem;font-weight:700;
                                 font-family:'Inter',sans-serif;">{status}</span>
                </td>
            </tr>
""", unsafe_allow_html=True)

        st.markdown("</tbody></table></div>", unsafe_allow_html=True)

    # ── SECTION 4: 12-MONTH PROJECTION ────────────────────────────────
    if sim_result:
        st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:800;letter-spacing:-0.01em;
            margin:20px 0 14px;font-family:'Inter',sans-serif;
            display:flex;align-items:center;gap:8px;">
    <span style="width:4px;height:20px;background:#f59e0b;border-radius:2px;display:inline-block;"></span>
    12-Month Risk Projection
</div>
""", unsafe_allow_html=True)

        fig = go.Figure()
        for organ, traj, color in [
            ("Heart",  sim_result.heart_trajectory,  "#ef4444"),
            ("Kidney", sim_result.kidney_trajectory, "#3b82f6"),
            ("Liver",  sim_result.liver_trajectory,  "#10b981"),
        ]:
            fig.add_trace(go.Scatter(
                x=sim_result.months, y=[v * 100 for v in traj],
                name=organ,
                line=dict(color=color, width=2.5, shape="spline", smoothing=0.8),
                mode="lines+markers",
                marker=dict(size=4, color=color, line=dict(color="#ffffff", width=1.5)),
                hovertemplate=f"<b>{organ}</b><br>Month %{{x}}<br>Risk: %{{y:.1f}}%<extra></extra>",
            ))
        fig.add_hline(y=40, line_dash="dot", line_color="rgba(245,158,11,0.5)",
                      annotation_text="Moderate threshold (40%)",
                      annotation_font=dict(color="#d97706", size=10))
        fig.add_hline(y=70, line_dash="dot", line_color="rgba(239,68,68,0.5)",
                      annotation_text="High risk threshold (70%)",
                      annotation_font=dict(color="#dc2626", size=10))
        fig.update_layout(
            height=300, margin=dict(l=40, r=20, t=20, b=40),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(248,250,252,0.8)",
            xaxis=dict(title="Month", gridcolor="rgba(226,232,240,0.6)",
                       tickfont=dict(color="#64748b", size=10, family="Inter, sans-serif"),
                       title_font=dict(color="#64748b", family="Inter, sans-serif")),
            yaxis=dict(title="Risk Score (%)", range=[0, 100],
                       gridcolor="rgba(226,232,240,0.6)",
                       tickfont=dict(color="#64748b", size=10, family="Inter, sans-serif"),
                       title_font=dict(color="#64748b", family="Inter, sans-serif")),
            legend=dict(orientation="h", y=1.08, x=0,
                        font=dict(color="#374151", size=11, family="Inter, sans-serif"),
                        bgcolor="rgba(255,255,255,0.9)", bordercolor="#e2e8f0", borderwidth=1),
            hovermode="x unified",
            hoverlabel=dict(bgcolor="#ffffff", bordercolor="#e2e8f0",
                            font=dict(color="#0f172a", family="Inter, sans-serif")),
        )
        st.plotly_chart(fig, use_container_width=True, key="home_proj_chart")

        # Month-12 outcome cards
        p1, p2, p3 = st.columns(3)
        for col, organ, traj, cur, accent in [
            (p1, "Heart",  sim_result.heart_trajectory,  scores.heart,  "#ef4444"),
            (p2, "Kidney", sim_result.kidney_trajectory, scores.kidney, "#3b82f6"),
            (p3, "Liver",  sim_result.liver_trajectory,  scores.liver,  "#10b981"),
        ]:
            m12   = traj[-1]
            delta = (m12 - cur) * 100
            c     = color_for_score(m12)
            d_col = "#dc2626" if delta > 0 else "#059669"
            trend = "↑ Worsening" if delta > 1 else "↓ Improving" if delta < -1 else "→ Stable"
            with col:
                st.markdown(
                    f'<div style="background:#ffffff;border:1px solid #e2e8f0;'
                    f'border-top:3px solid {accent};border-radius:10px;'
                    f'padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05);">'
                    f'<div style="color:#94a3b8;font-size:0.62rem;font-weight:700;'
                    f'text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;'
                    f'font-family:Inter,sans-serif;">{organ} at Month 12</div>'
                    f'<div style="color:{c};font-size:1.8rem;font-weight:800;'
                    f'font-family:Inter,sans-serif;">{m12*100:.1f}%</div>'
                    f'<div style="color:{d_col};font-size:0.76rem;margin-top:4px;'
                    f'font-family:Inter,sans-serif;">{trend} ({delta:+.1f}%)</div>'
                    f'</div>',
                    unsafe_allow_html=True,
                )

    # ── SECTION 5: ACTIONABLE SUGGESTIONS ─────────────────────────────
    st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:800;letter-spacing:-0.01em;
            margin:24px 0 14px;font-family:'Inter',sans-serif;
            display:flex;align-items:center;gap:8px;">
    <span style="width:4px;height:20px;background:#10b981;border-radius:2px;display:inline-block;"></span>
    Actionable Suggestions
</div>
""", unsafe_allow_html=True)

    for organ, score, accent, organ_title in [
        ("heart",  scores.heart,  "#ef4444", "Cardiovascular"),
        ("kidney", scores.kidney, "#3b82f6", "Renal"),
        ("liver",  scores.liver,  "#10b981", "Hepatic"),
    ]:
        suggestions = _get_suggestions(organ, score)
        lbl, bb, bc = _severity_label(score)
        with st.expander(f"{organ_title} Suggestions — {score*100:.1f}% ({lbl})", expanded=(score >= 0.4)):
            for i, s in enumerate(suggestions, 1):
                priority_color = "#dc2626" if i <= 2 and score >= 0.7 else \
                                 "#d97706" if i <= 2 and score >= 0.4 else "#059669"
                priority_label = "Urgent" if i <= 2 and score >= 0.7 else \
                                 "Important" if i <= 2 and score >= 0.4 else "Preventive"
                priority_bg    = "#fef2f2" if "Urgent" in priority_label else \
                                 "#fffbeb" if "Important" in priority_label else "#f0fdf4"
                st.markdown(
                    f'<div style="display:flex;align-items:flex-start;gap:12px;'
                    f'padding:12px 0;border-bottom:1px solid #f1f5f9;">'
                    f'<div style="width:24px;height:24px;border-radius:50%;background:{accent}14;'
                    f'border:1.5px solid {accent};display:flex;align-items:center;'
                    f'justify-content:center;flex-shrink:0;color:{accent};'
                    f'font-size:0.72rem;font-weight:800;font-family:Inter,sans-serif;">{i}</div>'
                    f'<div style="flex:1;">'
                    f'<div style="color:#0f172a;font-size:0.84rem;line-height:1.6;'
                    f'font-family:Inter,sans-serif;">{s}</div>'
                    f'</div>'
                    f'<span style="background:{priority_bg};color:{priority_color};'
                    f'border-radius:4px;padding:2px 8px;font-size:0.62rem;font-weight:700;'
                    f'text-transform:uppercase;font-family:Inter,sans-serif;flex-shrink:0;">'
                    f'{priority_label}</span>'
                    f'</div>',
                    unsafe_allow_html=True,
                )

    # ── SECTION 6: RECOMMENDATIONS FROM MODEL ─────────────────────────
    if recommendations:
        st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:800;letter-spacing:-0.01em;
            margin:24px 0 14px;font-family:'Inter',sans-serif;
            display:flex;align-items:center;gap:8px;">
    <span style="width:4px;height:20px;background:#7c3aed;border-radius:2px;display:inline-block;"></span>
    AI-Generated Clinical Recommendations
</div>
""", unsafe_allow_html=True)

        cat_cfg = {
            "clinical_consultation": ("#fef2f2", "#dc2626", "#ef4444", "💊 Clinical"),
            "physical_activity":     ("#faf5ff", "#7c3aed", "#8b5cf6", "🏃 Exercise"),
            "dietary_modification":  ("#eff6ff", "#2563eb", "#3b82f6", "🥗 Dietary"),
            "lifestyle_habit":       ("#f0fdf4", "#15803d", "#22c55e", "🌿 Lifestyle"),
        }
        for rec in recommendations.items[:10]:
            bg, fg, border, cat_label = cat_cfg.get(
                rec.category, ("#f8fafc", "#64748b", "#e2e8f0", "• General")
            )
            organ_c = {"heart": "#ef4444", "kidney": "#3b82f6",
                       "liver": "#10b981", "general": "#7c3aed"}.get(rec.organ, "#64748b")
            st.markdown(
                f'<div style="background:#ffffff;border:1px solid #e2e8f0;'
                f'border-left:4px solid {border};border-radius:8px;'
                f'padding:14px 18px;margin-bottom:10px;">'
                f'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">'
                f'<span style="background:{bg};color:{fg};font-size:0.65rem;font-weight:700;'
                f'padding:2px 8px;border-radius:4px;text-transform:uppercase;'
                f'font-family:Inter,sans-serif;">{cat_label}</span>'
                f'<span style="background:{organ_c}14;color:{organ_c};font-size:0.65rem;'
                f'font-weight:600;padding:2px 8px;border-radius:4px;'
                f'font-family:Inter,sans-serif;">{rec.organ.capitalize()}</span>'
                f'<span style="margin-left:auto;color:#94a3b8;font-size:0.68rem;'
                f'font-family:Inter,sans-serif;">Priority: {rec.priority*100:.0f}%</span>'
                f'</div>'
                f'<div style="color:#374151;font-size:0.84rem;line-height:1.65;'
                f'font-family:Inter,sans-serif;">{rec.text}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

    # ── DISCLAIMER ────────────────────────────────────────────────────
    st.markdown("""
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;
            padding:14px 18px;margin-top:20px;
            display:flex;align-items:flex-start;gap:10px;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="#d97706" stroke-width="2" style="flex-shrink:0;margin-top:2px;">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    <div style="font-size:0.78rem;color:#78350f;line-height:1.6;font-family:'Inter',sans-serif;">
        <strong>Medical Disclaimer:</strong> This report is generated by an AI prediction model
        for educational and informational purposes only. It does not constitute medical advice,
        diagnosis, or treatment. Always consult a qualified healthcare professional before
        making any health decisions.
    </div>
</div>
""", unsafe_allow_html=True)
