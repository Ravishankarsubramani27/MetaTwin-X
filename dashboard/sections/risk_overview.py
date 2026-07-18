"""Risk Analysis Overview — Clinical Precision Design System (light theme)."""
from __future__ import annotations
import streamlit as st
from src.models.data_types import AdjustedScores
from src.color_mapping import color_for_score, risk_label
from dashboard.components.gauge_chart import gauge_chart
from components.organ_viewer import render_organ_viewer

ORGAN_FULL = {
    "heart":  "Cardiovascular",
    "kidney": "Renal",
    "liver":  "Hepatic",
}
ORGAN_ACCENT = {
    "heart":  "#ef4444",
    "kidney": "#3b82f6",
    "liver":  "#10b981",
}
ORGAN_DESC = {
    "heart":  "Predicts coronary artery disease and heart failure risk based on lipid profile, blood pressure, and lifestyle factors.",
    "kidney": "Predicts chronic kidney disease risk using creatinine, eGFR, glucose, and blood pressure markers.",
    "liver":  "Predicts hepatic disease risk using ALT, AST enzyme levels, BMI, and metabolic indicators.",
}


def render_risk_overview(adjusted_scores: AdjustedScores):
    st.markdown("""
    <div class="section-header">
        <div class="section-icon" style="background:rgba(239,68,68,0.1);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="#ef4444" stroke-width="2">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
        </div>
        <div>
            <h2>Multi-Organ Risk Assessment</h2>
            <p class="section-sub">AI-powered analysis with cross-organ interaction modelling</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    scores = {
        "heart":  adjusted_scores.heart,
        "kidney": adjusted_scores.kidney,
        "liver":  adjusted_scores.liver,
    }

    # Gauge charts
    g1, g2, g3 = st.columns(3)
    for col, (organ, score) in zip([g1, g2, g3], scores.items()):
        with col:
            st.plotly_chart(
                gauge_chart(score, organ),
                use_container_width=True,
                key=f"ov_gauge_{organ}",
            )

    st.markdown('<div style="height:10px;"></div>', unsafe_allow_html=True)

    # 3D viewer + detail cards
    v_col, d_col = st.columns([1.3, 1])

    with v_col:
        st.markdown("""
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
                    padding:14px 18px 8px;margin-bottom:8px;
                    box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div style="font-size:0.9rem;font-weight:700;color:#0f172a;margin-bottom:3px;">3D Organ Viewer</div>
            <div style="font-size:0.73rem;color:#64748b;margin-bottom:12px;">Drag to rotate &nbsp;&middot;&nbsp; Scroll to zoom &nbsp;&middot;&nbsp; Click organ for details</div>
        </div>
        """, unsafe_allow_html=True)

        clicked = render_organ_viewer(
            scores={"heart": adjusted_scores.heart,
                    "kidney": adjusted_scores.kidney,
                    "liver": adjusted_scores.liver},
            height=480, key="ov_3d",
        )
        if clicked and clicked in ("heart", "kidney", "liver"):
            sc = scores[clicked]
            c  = color_for_score(sc)
            st.markdown(f"""
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid {c};
                        border-radius:8px;padding:12px 16px;margin-top:8px;">
                <span style="color:{c};font-weight:700;font-size:0.86rem;
                             font-family:'Inter',sans-serif;">{clicked.capitalize()}</span>
                <span style="color:#64748b;font-size:0.78rem;margin-left:8px;
                             font-family:'Inter',sans-serif;">
                    {risk_label(sc)} &mdash; {sc*100:.1f}%
                </span>
                <div style="color:#94a3b8;font-size:0.72rem;margin-top:6px;line-height:1.5;
                            font-family:'Inter',sans-serif;">
                    {ORGAN_DESC[clicked]}
                </div>
            </div>
            """, unsafe_allow_html=True)

    with d_col:
        # Organ detail cards
        for organ, score in scores.items():
            c       = color_for_score(score)
            rl      = risk_label(score)
            pct     = score * 100
            accent  = ORGAN_ACCENT[organ]
            badge_bg = "#dcfce7" if score < 0.4 else "#fef9c3" if score < 0.7 else "#fee2e2"
            badge_c  = "#15803d" if score < 0.4 else "#a16207" if score < 0.7 else "#dc2626"

            st.markdown(f"""
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid {accent};
                        border-radius:8px;padding:18px 20px;margin-bottom:12px;
                        box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;
                            margin-bottom:12px;">
                    <div>
                        <div style="color:#94a3b8;font-size:0.65rem;font-weight:700;
                                    letter-spacing:0.1em;text-transform:uppercase;margin-bottom:5px;
                                    font-family:'Inter',sans-serif;">{ORGAN_FULL[organ]}</div>
                        <div style="color:{c};font-size:2.1rem;font-weight:800;line-height:1;
                                    font-family:'Inter',sans-serif;">
                            {pct:.1f}<span style="font-size:0.9rem;font-weight:400;color:#94a3b8;">%</span>
                        </div>
                    </div>
                    <span style="background:{badge_bg};color:{badge_c};border-radius:20px;
                                 padding:4px 12px;font-size:0.68rem;font-weight:700;
                                 text-transform:uppercase;font-family:'Inter',sans-serif;">{rl}</span>
                </div>
                <div style="height:5px;background:#f1f5f9;border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:{pct:.1f}%;
                                background:linear-gradient(90deg,{c}66,{c});
                                border-radius:3px;transition:width 0.6s;"></div>
                </div>
                <div style="color:#94a3b8;font-size:0.7rem;margin-top:8px;line-height:1.5;
                            font-family:'Inter',sans-serif;">
                    {ORGAN_DESC[organ][:80]}...
                </div>
            </div>
            """, unsafe_allow_html=True)

        # Cross-organ interaction panel
        hc = color_for_score(adjusted_scores.heart)
        kc = color_for_score(adjusted_scores.kidney)
        lc = color_for_score(adjusted_scores.liver)

        st.markdown(f"""
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px 20px;">
            <div style="color:#94a3b8;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                        text-transform:uppercase;margin-bottom:16px;
                        font-family:'Inter',sans-serif;">Cross-Organ Interactions</div>
            <div style="display:flex;align-items:center;justify-content:space-around;
                        margin-bottom:14px;">
                <div style="text-align:center;">
                    <div style="width:48px;height:48px;border-radius:50%;
                                border:2px solid {hc};background:{hc}14;
                                display:flex;align-items:center;justify-content:center;
                                margin:0 auto 6px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="{hc}" stroke="none">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </div>
                    <div style="color:{hc};font-size:0.72rem;font-weight:700;
                                font-family:'Inter',sans-serif;">
                        {adjusted_scores.heart*100:.0f}%
                    </div>
                </div>
                <div style="color:#cbd5e1;font-size:1.2rem;">&harr;</div>
                <div style="text-align:center;">
                    <div style="width:48px;height:48px;border-radius:50%;
                                border:2px solid {kc};background:{kc}14;
                                display:flex;align-items:center;justify-content:center;
                                margin:0 auto 6px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                             stroke="{kc}" stroke-width="2">
                            <path d="M4.5 12.5c-.5-4 2-8 7.5-8s8 4 7.5 8c-.5 4-3 7-7.5 7s-7-3-7.5-7z"/>
                        </svg>
                    </div>
                    <div style="color:{kc};font-size:0.72rem;font-weight:700;
                                font-family:'Inter',sans-serif;">
                        {adjusted_scores.kidney*100:.0f}%
                    </div>
                </div>
                <div style="color:#cbd5e1;font-size:1.2rem;">&harr;</div>
                <div style="text-align:center;">
                    <div style="width:48px;height:48px;border-radius:50%;
                                border:2px solid {lc};background:{lc}14;
                                display:flex;align-items:center;justify-content:center;
                                margin:0 auto 6px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                             stroke="{lc}" stroke-width="2">
                            <ellipse cx="12" cy="12" rx="6" ry="8"/>
                        </svg>
                    </div>
                    <div style="color:{lc};font-size:0.72rem;font-weight:700;
                                font-family:'Inter',sans-serif;">
                        {adjusted_scores.liver*100:.0f}%
                    </div>
                </div>
            </div>
            <div style="color:#94a3b8;font-size:0.7rem;text-align:center;
                        padding-top:10px;border-top:1px solid #e2e8f0;line-height:1.8;
                        font-family:'Inter',sans-serif;">
                Liver &rarr; Heart &amp; Kidney &nbsp;|&nbsp;
                Glucose &rarr; Kidney &nbsp;|&nbsp;
                Cholesterol &rarr; Heart
            </div>
        </div>
        """, unsafe_allow_html=True)
