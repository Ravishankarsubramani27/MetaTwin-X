"""About / Innovation — MetaTwin-X system overview card for the More tab."""
from __future__ import annotations
import streamlit as st


def render_about():
    # ── Hero banner ────────────────────────────────────────────────────
    st.markdown("""
    <div style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#7c3aed 100%);
                border-radius:18px;padding:24px 22px 20px;margin-bottom:14px;
                box-shadow:0 8px 28px rgba(37,99,235,0.28);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            <div style="width:44px;height:44px;background:rgba(255,255,255,0.15);
                        border-radius:12px;display:flex;align-items:center;
                        justify-content:center;flex-shrink:0;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="#ffffff" stroke-width="2.2" stroke-linecap="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                             a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
                             1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </div>
            <div>
                <div style="color:#ffffff;font-size:1.15rem;font-weight:800;
                            letter-spacing:-0.02em;font-family:'Inter',sans-serif;">
                    MetaTwin-X
                </div>
                <div style="color:rgba(255,255,255,0.7);font-size:0.72rem;
                            font-family:'Inter',sans-serif;">
                    Multi-Organ Digital Health Twin
                </div>
            </div>
        </div>
        <div style="color:rgba(255,255,255,0.9);font-size:0.84rem;line-height:1.65;
                    font-family:'Inter',sans-serif;">
            Our project extends traditional health prediction by introducing an
            <strong style="color:#ffffff;">adaptive cross-organ interaction system.</strong>
            Unlike static models, our system dynamically updates risk values based on
            interdependent organ behaviour and simulated future health states.
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── Technical Explanation ──────────────────────────────────────────
    st.markdown("""
    <div style="background:#ffffff;border-radius:16px;padding:20px;margin-bottom:14px;
                box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <div style="width:36px;height:36px;background:#f0fdf4;border-radius:10px;
                        display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span style="font-size:1.1rem;">🧠</span>
            </div>
            <div style="font-size:0.95rem;font-weight:700;color:#0f172a;
                        font-family:'Inter',sans-serif;">Technical Explanation</div>
        </div>
        <div style="font-size:0.82rem;color:#374151;line-height:1.7;
                    font-family:'Inter',sans-serif;">
            The system integrates <strong style="color:#0f172a;">machine learning predictions</strong>
            with a <strong style="color:#0f172a;">dynamic interaction engine</strong>, where organ
            risks influence each other through adaptive weights. These interactions are further
            refined using a <strong style="color:#0f172a;">feedback-driven digital twin simulation</strong>,
            enabling continuous recalibration of health predictions.
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── Innovation Statement ───────────────────────────────────────────
    st.markdown("""
    <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);
                border:1.5px solid #fde68a;border-radius:16px;padding:20px;
                margin-bottom:14px;box-shadow:0 2px 10px rgba(245,158,11,0.12);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <div style="width:36px;height:36px;background:rgba(245,158,11,0.15);
                        border-radius:10px;display:flex;align-items:center;
                        justify-content:center;flex-shrink:0;">
                <span style="font-size:1.1rem;">🚀</span>
            </div>
            <div>
                <div style="font-size:0.95rem;font-weight:700;color:#92400e;
                            font-family:'Inter',sans-serif;">Innovation Statement</div>
                <div style="font-size:0.68rem;font-weight:700;color:#d97706;
                            text-transform:uppercase;letter-spacing:0.08em;
                            font-family:'Inter',sans-serif;">VERY IMPORTANT</div>
            </div>
        </div>
        <div style="font-size:0.84rem;color:#78350f;line-height:1.7;
                    font-family:'Inter',sans-serif;">
            The novelty of our work lies in combining
            <strong style="color:#92400e;">cross-organ dependency modelling</strong>
            with <strong style="color:#92400e;">adaptive rule learning</strong> and
            <strong style="color:#92400e;">simulation feedback</strong>, creating a
            <em>self-updating predictive healthcare system</em>.
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── Key Features ───────────────────────────────────────────────────
    st.markdown("""
    <div style="background:#ffffff;border-radius:16px;padding:20px;margin-bottom:14px;
                box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
            <div style="width:36px;height:36px;background:#eff6ff;border-radius:10px;
                        display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span style="font-size:1.1rem;">📌</span>
            </div>
            <div style="font-size:0.95rem;font-weight:700;color:#0f172a;
                        font-family:'Inter',sans-serif;">Key Features</div>
        </div>
    """, unsafe_allow_html=True)

    features = [
        ("#2563eb", "#eff6ff",
         "Multi-Organ AI Prediction",
         "Simultaneous XGBoost inference across Heart, Kidney, and Liver with parallel execution.",
         "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"),
        ("#7c3aed", "#faf5ff",
         "Cross-Organ Interaction Modelling",
         "Liver dysfunction elevates cardiac and renal risk. Glucose dysregulation amplifies kidney stress. Cholesterol cascades into cardiovascular load.",
         "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"),
        ("#dc2626", "#fef2f2",
         "Adaptive Rule Engine",
         "NEW — Rules dynamically adjust organ risk weights based on real-time biomarker patterns, learning from interaction audit logs to refine predictions.",
         "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"),
        ("#0891b2", "#f0f9ff",
         "Digital Twin Simulation",
         "12-month logistic growth model projects organ risk trajectories. What-if scenarios simulate therapeutic interventions in real time.",
         "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"),
        ("#059669", "#f0fdf4",
         "Feedback Loop Mechanism",
         "Simulation outputs feed back into the interaction engine, continuously recalibrating risk scores as health states evolve over the 12-month window.",
         "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"),
    ]

    for color, bg, title, desc, path in features:
        is_new = "NEW" in title
        new_badge = f'<span style="background:{color};color:#ffffff;font-size:0.6rem;font-weight:700;padding:2px 7px;border-radius:4px;margin-left:6px;font-family:Inter,sans-serif;vertical-align:middle;">NEW</span>' if is_new else ""
        clean_title = title.replace(" NEW", "").replace("NEW — ", "")
        st.markdown(f"""
        <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;
                    border-bottom:1px solid #f1f5f9;">
            <div style="width:40px;height:40px;background:{bg};border-radius:10px;
                        display:flex;align-items:center;justify-content:center;
                        flex-shrink:0;margin-top:2px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="{color}" stroke-width="2" stroke-linecap="round">
                    <path d="{path}"/>
                </svg>
            </div>
            <div style="flex:1;">
                <div style="font-size:0.88rem;font-weight:700;color:#0f172a;
                            margin-bottom:4px;font-family:'Inter',sans-serif;">
                    {clean_title}{new_badge}
                </div>
                <div style="font-size:0.76rem;color:#64748b;line-height:1.55;
                            font-family:'Inter',sans-serif;">{desc}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    # ── System Architecture Flow ───────────────────────────────────────
    st.markdown("""
    <div style="background:#ffffff;border-radius:16px;padding:20px;margin-bottom:14px;
                box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <div style="font-size:0.95rem;font-weight:700;color:#0f172a;margin-bottom:16px;
                    font-family:'Inter',sans-serif;">System Architecture</div>
    """, unsafe_allow_html=True)

    steps = [
        ("#2563eb", "Health Input",        "Demographics, biomarkers, lifestyle data"),
        ("#7c3aed", "ML Prediction",       "Parallel XGBoost inference per organ"),
        ("#dc2626", "Interaction Engine",  "Adaptive cross-organ rule application"),
        ("#0891b2", "Digital Twin Sim",    "12-month logistic trajectory projection"),
        ("#059669", "Feedback Loop",       "Simulation recalibrates interaction weights"),
        ("#f59e0b", "SHAP Explanations",   "Feature importance + plain-language output"),
    ]

    for i, (color, title, sub) in enumerate(steps):
        connector = f"""
        <div style="display:flex;justify-content:center;margin:2px 0;">
            <div style="width:2px;height:14px;background:#e2e8f0;"></div>
        </div>
        """ if i < len(steps) - 1 else ""

        st.markdown(f"""
        <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;
                    background:#f8fafc;border-radius:10px;border-left:3px solid {color};">
            <div style="width:26px;height:26px;background:{color};border-radius:50%;
                        display:flex;align-items:center;justify-content:center;
                        flex-shrink:0;">
                <span style="color:#ffffff;font-size:0.72rem;font-weight:800;
                             font-family:'Inter',sans-serif;">{i+1}</span>
            </div>
            <div>
                <div style="font-size:0.84rem;font-weight:700;color:#0f172a;
                            font-family:'Inter',sans-serif;">{title}</div>
                <div style="font-size:0.72rem;color:#64748b;font-family:'Inter',sans-serif;">
                    {sub}
                </div>
            </div>
        </div>
        {connector}
        """, unsafe_allow_html=True)

    # ── Tech Stack ─────────────────────────────────────────────────────
    stack = [
        ("Python 3.11",      "#3b82f6"), ("XGBoost",    "#f59e0b"),
        ("SHAP",             "#10b981"), ("Streamlit",  "#ef4444"),
        ("FastAPI",          "#8b5cf6"), ("Plotly",     "#06b6d4"),
        ("Scikit-learn",     "#f97316"), ("Pydantic",   "#84cc16"),
        ("Three.js / WebGL", "#e879f9"), ("HIPAA-Ready","#94a3b8"),
    ]
    badges_html = "".join(
        f'<span style="background:{c}22;color:{c};border:1px solid {c}44;'
        f'font-size:0.72rem;font-weight:600;padding:4px 10px;border-radius:20px;'
        f'font-family:Inter,sans-serif;display:inline-block;">{t}</span>'
        for t, c in stack
    )
    st.markdown(
        f'<div style="background:#0f172a;border-radius:16px;padding:20px;margin-bottom:14px;">'
        f'<div style="font-size:0.95rem;font-weight:700;color:#f8fafc;margin-bottom:14px;'
        f'font-family:Inter,sans-serif;">Technology Stack</div>'
        f'<div style="display:flex;flex-wrap:wrap;gap:8px;">{badges_html}</div>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # ── Disclaimer ─────────────────────────────────────────────────────
    st.markdown("""
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;
                padding:14px 16px;margin-bottom:8px;
                display:flex;align-items:flex-start;gap:10px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="#d97706" stroke-width="2" style="flex-shrink:0;margin-top:2px;">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div style="font-size:0.74rem;color:#78350f;line-height:1.5;
                    font-family:'Inter',sans-serif;">
            MetaTwin-X is a research prototype for educational and demonstration purposes.
            It does not constitute medical advice. Always consult a qualified healthcare professional.
        </div>
    </div>
    """, unsafe_allow_html=True)
