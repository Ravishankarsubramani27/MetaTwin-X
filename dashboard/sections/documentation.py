"""Project Documentation Section — renders PROJECT_DOCUMENTATION.md in-app."""
from __future__ import annotations
from pathlib import Path
import streamlit as st


def render_documentation():
    doc_path = Path(__file__).parent.parent.parent / "PROJECT_DOCUMENTATION.md"

    # ── Header card ────────────────────────────────────────────────────
    st.markdown("""
<div style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#7c3aed 100%);
            border-radius:14px;padding:28px 32px;margin-bottom:24px;
            box-shadow:0 8px 28px rgba(37,99,235,0.28);">
    <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:52px;height:52px;background:rgba(255,255,255,0.15);
                    border-radius:14px;display:flex;align-items:center;
                    justify-content:center;flex-shrink:0;font-size:1.6rem;">📋</div>
        <div>
            <div style="color:#ffffff;font-size:1.4rem;font-weight:800;
                        letter-spacing:-0.02em;font-family:'Inter',sans-serif;">
                MetaTwin-X — Project Documentation
            </div>
            <div style="color:rgba(255,255,255,0.7);font-size:0.82rem;
                        font-family:'Inter',sans-serif;margin-top:4px;">
                Full technical report · Abstract · Problem Statement ·
                Literature Survey · Architecture · Outcomes
            </div>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

    # ── Quick-nav tabs ─────────────────────────────────────────────────
    tabs = st.tabs([
        "📄 Abstract",
        "🎯 Problem Statement",
        "📚 Literature Survey",
        "🏗 Architecture",
        "🚀 Innovation",
        "✅ Outcomes",
        "📖 Full Document",
    ])

    with tabs[0]:
        st.markdown("""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
            padding:28px 32px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <h3 style="color:#0f172a;font-size:1.1rem;font-weight:700;margin:0 0 16px;
               font-family:'Inter',sans-serif;border-bottom:2px solid #2563eb;
               padding-bottom:10px;">Abstract</h3>
    <p style="color:#374151;font-size:0.9rem;line-height:1.8;
              font-family:'Inter',sans-serif;">
        MetaTwin-X is an AI-powered multi-organ digital health twin system designed for
        predictive clinical analytics. The system simultaneously models
        <strong style="color:#0f172a;">cardiovascular, renal, and hepatic risk</strong>
        using machine learning inference, a novel cross-organ interaction engine,
        and a 12-month logistic simulation framework.
    </p>
    <p style="color:#374151;font-size:0.9rem;line-height:1.8;
              font-family:'Inter',sans-serif;margin-top:12px;">
        Unlike conventional single-organ risk calculators, MetaTwin-X introduces an
        <strong style="color:#2563eb;">adaptive cross-organ dependency model</strong>
        where the risk state of one organ dynamically influences the predicted risk of
        others — reflecting the physiological reality of systemic disease.
    </p>
    <p style="color:#374151;font-size:0.9rem;line-height:1.8;
              font-family:'Inter',sans-serif;margin-top:12px;">
        The platform delivers explainable AI outputs via
        <strong style="color:#0f172a;">SHAP (SHapley Additive exPlanations)</strong>,
        personalised clinical recommendations, and an interactive 3D anatomical
        digital twin rendering. The system is deployable as a full-stack web application
        with a FastAPI microservices backend and a Streamlit clinical dashboard frontend.
    </p>
</div>
""", unsafe_allow_html=True)

    with tabs[1]:
        st.markdown("""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
            padding:28px 32px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <h3 style="color:#0f172a;font-size:1.1rem;font-weight:700;margin:0 0 16px;
               font-family:'Inter',sans-serif;border-bottom:2px solid #ef4444;
               padding-bottom:10px;">Problem Statement</h3>
    <p style="color:#374151;font-size:0.88rem;line-height:1.8;font-family:'Inter',sans-serif;">
        Chronic non-communicable diseases (NCDs) — including cardiovascular disease (CVD),
        chronic kidney disease (CKD), and non-alcoholic fatty liver disease (NAFLD) —
        are the leading causes of global mortality, accounting for over
        <strong style="color:#dc2626;">74% of all deaths worldwide</strong> (WHO, 2023).
    </p>
    <div style="margin-top:20px;">
        <div style="color:#94a3b8;font-size:0.68rem;font-weight:700;text-transform:uppercase;
                    letter-spacing:0.1em;margin-bottom:12px;font-family:'Inter',sans-serif;">
            LIMITATIONS OF EXISTING APPROACHES
        </div>
""", unsafe_allow_html=True)

        limitations = [
            ("#ef4444", "Single-Organ Focus",
             "Tools like Framingham (CVD), KDIGO (CKD), and FIB-4 (liver) assess organs in isolation, ignoring systemic interactions."),
            ("#f59e0b", "Static Prediction",
             "Risk scores are point-in-time estimates with no trajectory modelling or what-if simulation capability."),
            ("#8b5cf6", "Black-Box Models",
             "Most ML-based tools lack clinical explainability, limiting physician trust and adoption."),
        ]
        for color, title, desc in limitations:
            st.markdown(f"""
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid {color};
            border-radius:8px;padding:14px 18px;margin-bottom:10px;">
    <div style="color:#0f172a;font-size:0.86rem;font-weight:700;
                font-family:'Inter',sans-serif;margin-bottom:4px;">{title}</div>
    <div style="color:#64748b;font-size:0.8rem;line-height:1.5;
                font-family:'Inter',sans-serif;">{desc}</div>
</div>
""", unsafe_allow_html=True)

        st.markdown("""
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;
                    padding:16px 20px;margin-top:16px;">
            <div style="color:#1d4ed8;font-size:0.88rem;font-weight:700;
                        font-family:'Inter',sans-serif;margin-bottom:6px;">
                Research Question
            </div>
            <div style="color:#1e40af;font-size:0.84rem;line-height:1.6;
                        font-family:'Inter',sans-serif;font-style:italic;">
                "How can we build a self-updating, explainable, multi-organ predictive
                health system that models cross-organ dependencies and simulates future
                health trajectories under different therapeutic interventions?"
            </div>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

    with tabs[2]:
        st.markdown("""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
            padding:28px 32px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <h3 style="color:#0f172a;font-size:1.1rem;font-weight:700;margin:0 0 20px;
               font-family:'Inter',sans-serif;border-bottom:2px solid #10b981;
               padding-bottom:10px;">Literature Survey</h3>
""", unsafe_allow_html=True)

        sections = [
            ("Machine Learning in Clinical Risk Prediction", [
                ("Weng et al. (2017)", "PLOS ONE", "Random Forest/NN outperformed Framingham for CVD", "Single organ, no interaction modelling"),
                ("Tomašev et al. (2019)", "Nature", "48-hour AKI prediction from ICU data", "ICU-specific, not ambulatory"),
                ("Alaa & van der Schaar (2019)", "NeurIPS", "AutoPrognosis multi-disease pipeline", "No cross-organ dependency"),
            ]),
            ("Digital Twin Technology in Healthcare", [
                ("Björnsson et al. (2020)", "npj Digital Medicine", "Patient-specific cardiac simulation", "Requires imaging data"),
                ("Corral-Acero et al. (2020)", "European Heart Journal", "Virtual Heart electrophysiology", "Computationally expensive"),
                ("Laubenbacher et al. (2022)", "Nature Computational Science", "Multiscale digital twin", "Research prototype only"),
            ]),
            ("Cross-Organ Interaction Evidence", [
                ("Ronco et al. (2008)", "JACC", "Cardiorenal syndrome: bidirectional heart-kidney interaction", "Validates heart↔kidney rule"),
                ("Targher et al. (2010)", "Nature Reviews Endocrinology", "NAFLD independently predicts CVD", "Validates liver→heart weight"),
                ("Lonardo et al. (2015)", "Journal of Hepatology", "Metabolic syndrome links liver, kidney, heart", "Validates multi-organ graph"),
            ]),
        ]

        for section_title, papers in sections:
            st.markdown(f"""
<div style="color:#94a3b8;font-size:0.68rem;font-weight:700;text-transform:uppercase;
            letter-spacing:0.1em;margin:16px 0 10px;font-family:'Inter',sans-serif;">
    {section_title}
</div>
""", unsafe_allow_html=True)
            for ref, journal, contribution, limitation in papers:
                st.markdown(f"""
<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9;">
    <div style="flex:1;">
        <div style="color:#0f172a;font-size:0.82rem;font-weight:600;
                    font-family:'Inter',sans-serif;">{ref}</div>
        <div style="color:#2563eb;font-size:0.72rem;font-family:'Inter',sans-serif;">
            {journal}
        </div>
        <div style="color:#374151;font-size:0.78rem;margin-top:3px;
                    font-family:'Inter',sans-serif;">{contribution}</div>
    </div>
    <div style="background:#fef9c3;border-radius:6px;padding:4px 10px;
                font-size:0.7rem;color:#a16207;font-family:'Inter',sans-serif;
                align-self:flex-start;flex-shrink:0;max-width:160px;text-align:center;">
        {limitation}
    </div>
</div>
""", unsafe_allow_html=True)

        st.markdown("""
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;
                padding:16px 20px;margin-top:20px;">
        <div style="color:#15803d;font-size:0.88rem;font-weight:700;
                    font-family:'Inter',sans-serif;margin-bottom:8px;">
            Literature Survey Summary — Research Gap Confirmed
        </div>
        <div style="color:#166534;font-size:0.8rem;line-height:1.7;
                    font-family:'Inter',sans-serif;">
            No existing system combines: (1) simultaneous multi-organ ML prediction,
            (2) cross-organ interaction graph with audit trail, (3) SHAP explainability
            integrated with interaction logs, (4) 12-month simulation with what-if modelling,
            and (5) routine biomarker input without imaging requirements.
            <strong>MetaTwin-X addresses all five gaps simultaneously.</strong>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

    with tabs[3]:
        st.markdown("""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
            padding:28px 32px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <h3 style="color:#0f172a;font-size:1.1rem;font-weight:700;margin:0 0 20px;
               font-family:'Inter',sans-serif;border-bottom:2px solid #7c3aed;
               padding-bottom:10px;">System Architecture</h3>
""", unsafe_allow_html=True)

        pipeline = [
            ("#2563eb", "1", "Health Input Layer",
             "Manual biomarker entry, PDF/image report upload, JSON profile import. 15 biomarkers processed."),
            ("#0891b2", "2", "Data Preprocessor",
             "Physiological validation, median imputation, CKD-EPI eGFR, cholesterol ratio, min-max normalisation, organ-specific feature vectors."),
            ("#7c3aed", "3", "ML Prediction Engine",
             "Parallel XGBoost inference via ThreadPoolExecutor(max_workers=3). Heart (13 features), Kidney (20), Liver (12)."),
            ("#ef4444", "4", "Cross-Organ Interaction Engine",
             "Graph-based adaptive rules: Glucose→Kidney (+0.10), Cholesterol→Heart (+0.08), Liver→Heart (+0.05), Liver→Kidney (+0.05). Full audit trail."),
            ("#f59e0b", "5", "Simulation Engine",
             "12-month logistic growth: score(t+1) = score(t) + rate×score(t)×(1-score(t)) - intervention×score(t). What-if scenarios."),
            ("#10b981", "6", "XAI Module",
             "SHAP explainer per organ. Top-5 feature contributions. Plain-language sentences. Interaction audit notes."),
            ("#059669", "7", "Recommendation Engine",
             "Priority = (impact × score) / effort. Mandatory clinical consultations for scores > 0.6. 4 categories, 60+ recommendations."),
        ]

        for color, num, title, desc in pipeline:
            st.markdown(f"""
<div style="display:flex;align-items:flex-start;gap:14px;padding:12px 0;
            border-bottom:1px solid #f1f5f9;">
    <div style="width:32px;height:32px;border-radius:50%;background:{color};
                display:flex;align-items:center;justify-content:center;
                flex-shrink:0;color:#ffffff;font-size:0.82rem;font-weight:800;
                font-family:'Inter',sans-serif;">{num}</div>
    <div>
        <div style="color:#0f172a;font-size:0.88rem;font-weight:700;
                    font-family:'Inter',sans-serif;margin-bottom:3px;">{title}</div>
        <div style="color:#64748b;font-size:0.78rem;line-height:1.5;
                    font-family:'Inter',sans-serif;">{desc}</div>
    </div>
</div>
""", unsafe_allow_html=True)

    with tabs[4]:
        st.markdown("""
<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);
            border:1.5px solid #fde68a;border-radius:14px;padding:28px 32px;
            box-shadow:0 2px 10px rgba(245,158,11,0.12);">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <span style="font-size:2rem;">🚀</span>
        <div>
            <div style="color:#92400e;font-size:1.1rem;font-weight:800;
                        font-family:'Inter',sans-serif;">Innovation Statement</div>
            <div style="color:#d97706;font-size:0.7rem;font-weight:700;
                        text-transform:uppercase;letter-spacing:0.08em;
                        font-family:'Inter',sans-serif;">VERY IMPORTANT</div>
        </div>
    </div>
    <p style="color:#78350f;font-size:0.92rem;line-height:1.8;
              font-family:'Inter',sans-serif;margin-bottom:20px;">
        The novelty of our work lies in combining
        <strong>cross-organ dependency modelling</strong> with
        <strong>adaptive rule learning</strong> and
        <strong>simulation feedback</strong>, creating a
        <em>self-updating predictive healthcare system</em>.
    </p>
    <p style="color:#78350f;font-size:0.88rem;line-height:1.7;
              font-family:'Inter',sans-serif;">
        Our project extends traditional health prediction by introducing an
        <strong>adaptive cross-organ interaction system</strong>. Unlike static models,
        our system dynamically updates risk values based on interdependent organ behaviour
        and simulated future health states.
    </p>
    <p style="color:#78350f;font-size:0.88rem;line-height:1.7;
              font-family:'Inter',sans-serif;margin-top:12px;">
        The system integrates <strong>machine learning predictions</strong> with a
        <strong>dynamic interaction engine</strong>, where organ risks influence each other
        through adaptive weights. These interactions are further refined using a
        <strong>feedback-driven digital twin simulation</strong>, enabling continuous
        recalibration of health predictions.
    </p>
</div>
""", unsafe_allow_html=True)

        st.markdown("<div style='height:16px;'></div>", unsafe_allow_html=True)

        features = [
            ("#2563eb", "#eff6ff", "Multi-Organ AI Prediction",
             "Simultaneous XGBoost inference across Heart, Kidney, and Liver with parallel execution."),
            ("#7c3aed", "#faf5ff", "Cross-Organ Interaction Modelling",
             "Liver dysfunction elevates cardiac and renal risk. Glucose dysregulation amplifies kidney stress."),
            ("#dc2626", "#fef2f2", "Adaptive Rule Engine (NEW)",
             "Rules dynamically adjust organ risk weights based on real-time biomarker patterns with full audit trail."),
            ("#0891b2", "#f0f9ff", "Digital Twin Simulation",
             "12-month logistic growth model projects organ risk trajectories with therapeutic intervention modelling."),
            ("#059669", "#f0fdf4", "Feedback Loop Mechanism",
             "Simulation outputs feed back into the interaction engine, continuously recalibrating risk scores."),
        ]

        c1, c2 = st.columns(2)
        for i, (color, bg, title, desc) in enumerate(features):
            col = c1 if i % 2 == 0 else c2
            with col:
                is_new = "NEW" in title
                new_badge = f'<span style="background:{color};color:#fff;font-size:0.6rem;font-weight:700;padding:2px 6px;border-radius:4px;margin-left:6px;">NEW</span>' if is_new else ""
                clean = title.replace(" (NEW)", "")
                st.markdown(f"""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-left:4px solid {color};
            border-radius:10px;padding:16px;margin-bottom:12px;
            box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <div style="color:#0f172a;font-size:0.86rem;font-weight:700;
                font-family:'Inter',sans-serif;margin-bottom:6px;">
        {clean}{new_badge}
    </div>
    <div style="color:#64748b;font-size:0.78rem;line-height:1.5;
                font-family:'Inter',sans-serif;">{desc}</div>
</div>
""", unsafe_allow_html=True)

    with tabs[5]:
        st.markdown("""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
            padding:28px 32px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <h3 style="color:#0f172a;font-size:1.1rem;font-weight:700;margin:0 0 20px;
               font-family:'Inter',sans-serif;border-bottom:2px solid #10b981;
               padding-bottom:10px;">Final Outcomes</h3>
""", unsafe_allow_html=True)

        metrics = [
            ("3", "Organs Modelled", "Heart, Kidney, Liver", "#ef4444"),
            ("15", "Biomarkers", "12 required + 3 optional", "#2563eb"),
            ("12", "Month Simulation", "Logistic growth model", "#7c3aed"),
            ("60+", "Recommendations", "4 clinical categories", "#10b981"),
            ("4", "API Endpoints", "/predict /simulate /recommend /health", "#f59e0b"),
            ("<500ms", "Prediction Latency", "Parallel inference", "#0891b2"),
        ]

        cols = st.columns(3)
        for i, (val, label, sub, color) in enumerate(metrics):
            with cols[i % 3]:
                st.markdown(f"""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-top:3px solid {color};
            border-radius:10px;padding:18px;text-align:center;margin-bottom:14px;
            box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <div style="color:{color};font-size:2rem;font-weight:800;line-height:1;
                font-family:'Inter',sans-serif;">{val}</div>
    <div style="color:#0f172a;font-size:0.82rem;font-weight:700;margin:6px 0 3px;
                font-family:'Inter',sans-serif;">{label}</div>
    <div style="color:#94a3b8;font-size:0.72rem;font-family:'Inter',sans-serif;">{sub}</div>
</div>
""", unsafe_allow_html=True)

        st.markdown("""
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;
                padding:16px 20px;margin-top:8px;">
        <div style="color:#15803d;font-size:0.88rem;font-weight:700;
                    font-family:'Inter',sans-serif;margin-bottom:8px;">
            MetaTwin-X is the first open-source system to combine:
        </div>
        <div style="color:#166534;font-size:0.82rem;line-height:1.9;
                    font-family:'Inter',sans-serif;">
            ✅ Simultaneous multi-organ ML prediction from routine biomarkers<br>
            ✅ Graph-based adaptive cross-organ interaction engine with audit trail<br>
            ✅ 12-month logistic simulation with therapeutic what-if modelling<br>
            ✅ SHAP explainability integrated with interaction audit logs<br>
            ✅ Interactive 3D anatomical digital twin rendering
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

    with tabs[6]:
        if doc_path.exists():
            content = doc_path.read_text(encoding="utf-8")
            st.markdown(content)

            st.markdown("<div style='height:12px;'></div>", unsafe_allow_html=True)
            st.download_button(
                "⬇ Download Full Documentation (Markdown)",
                data=content.encode("utf-8"),
                file_name="MetaTwinX_Project_Documentation.md",
                mime="text/markdown",
                use_container_width=True,
            )
        else:
            st.warning("Documentation file not found. Please ensure PROJECT_DOCUMENTATION.md exists in the project root.")
