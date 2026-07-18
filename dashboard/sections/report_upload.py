"""
Report Upload & Analysis Section.

Pipeline:
  User Upload → Text Extraction (OCR/pdfplumber)
  → NLP/Regex Structuring → Rule-Based Analysis
  → AI/ML Prediction → Insight Generation → Dashboard Output
"""
from __future__ import annotations
import streamlit as st
from pathlib import Path


def _pipeline_step(number: int, title: str, subtitle: str, icon: str,
                   status: str = "pending", detail: str = ""):
    """Render a single pipeline step card — fully self-contained HTML."""
    colors = {
        "pending": ("#1e2530", "#64748b", "#334155"),
        "running": ("#1e3a5f", "#3b82f6", "#1d4ed8"),
        "done":    ("#14532d", "#10b981", "#065f46"),
        "warn":    ("#451a03", "#f59e0b", "#92400e"),
        "error":   ("#450a0a", "#ef4444", "#7f1d1d"),
    }
    bg, text_c, border_c = colors.get(status, colors["pending"])
    s_icon = {"pending": "○", "running": "⟳", "done": "✓", "warn": "⚠", "error": "✗"}.get(status, "○")
    detail_html = f'<div style="color:{text_c};font-size:0.75rem;margin-top:4px;font-style:italic;">{detail}</div>' if detail else ""

    st.markdown(
        f'<div style="background:{bg};border:1px solid {border_c};border-radius:10px;'
        f'padding:14px 18px;margin-bottom:8px;display:flex;align-items:center;gap:14px;">'
        f'<div style="width:36px;height:36px;border-radius:50%;background:{border_c}22;'
        f'border:2px solid {border_c};display:flex;align-items:center;'
        f'justify-content:center;font-size:1.1rem;flex-shrink:0;">{icon}</div>'
        f'<div style="flex:1;">'
        f'<div style="display:flex;align-items:center;gap:8px;">'
        f'<span style="color:#8b949e;font-size:0.7rem;font-weight:600;">STEP {number}</span>'
        f'<span style="color:{text_c};font-size:0.88rem;font-weight:600;">{title}</span>'
        f'<span style="margin-left:auto;color:{text_c};font-size:0.8rem;font-weight:700;">{s_icon}</span>'
        f'</div>'
        f'<div style="color:#8b949e;font-size:0.75rem;margin-top:2px;">{subtitle}</div>'
        f'{detail_html}'
        f'</div>'
        f'</div>',
        unsafe_allow_html=True,
    )


def render_report_upload(preprocessor=None, prediction_engine=None,
                         interaction_engine=None, simulation_engine=None,
                         xai_module=None, recommendation_engine=None) -> bool:
    """
    Render the report upload section.
    Returns True if analysis was triggered and results stored in session_state.
    """
    st.markdown("""
    <div class="section-header">
        <div class="section-icon" style="background:rgba(124,58,237,0.1);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="#7c3aed" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
            </svg>
        </div>
        <div>
            <h2>Medical Report Analyser</h2>
            <p class="section-sub">Upload your lab report — AI extracts values and generates your digital twin automatically</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── Pipeline overview ──────────────────────────────────────────────
    with st.expander("🔬 How it works — Analysis Pipeline", expanded=False):
        steps = [
            ("📤", "User Upload",          "PDF, image, or text report"),
            ("🔍", "Text Extraction",       "OCR / pdfplumber extracts raw text"),
            ("🧩", "Data Structuring",      "NLP + Regex identifies 15+ biomarkers"),
            ("⚙️", "Rule-Based Analysis",   "Cross-organ interaction rules applied"),
            ("🤖", "AI/ML Prediction",      "XGBoost models predict organ risks"),
            ("💡", "Insight Generation",    "SHAP explanations + recommendations"),
        ]
        rows_html = ""
        for i, (icon, title, sub) in enumerate(steps, 1):
            border_style = "1px solid #e2e8f0" if i < len(steps) else "none"
            rows_html += (
                f'<div style="display:flex;align-items:center;gap:12px;padding:8px 0;'
                f'border-bottom:{border_style};">'
                f'<div style="width:28px;height:28px;border-radius:50%;background:rgba(37,99,235,0.12);'
                f'border:1px solid rgba(37,99,235,0.3);display:flex;align-items:center;'
                f'justify-content:center;font-size:0.9rem;flex-shrink:0;">{icon}</div>'
                f'<div>'
                f'<span style="color:#2563eb;font-size:0.7rem;font-weight:600;">STEP {i} &nbsp;</span>'
                f'<span style="color:#0f172a;font-size:0.82rem;font-weight:600;">{title}</span>'
                f'<span style="color:#64748b;font-size:0.75rem;"> — {sub}</span>'
                f'</div>'
                f'</div>'
            )
        st.markdown(
            f'<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;'
            f'padding:16px;margin-bottom:8px;">'
            f'<div style="color:#0f172a;font-size:0.88rem;font-weight:700;margin-bottom:12px;'
            f'font-family:Inter,sans-serif;">6-Stage AI Analysis Pipeline</div>'
            f'{rows_html}'
            f'</div>',
            unsafe_allow_html=True,
        )

    # ── Supported formats ──────────────────────────────────────────────
    st.markdown("""
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <span style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);
                     color:#60a5fa;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;">
            📄 PDF Reports
        </span>
        <span style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);
                     color:#34d399;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;">
            🖼️ Images (JPG/PNG)
        </span>
        <span style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);
                     color:#fbbf24;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;">
            📝 Text Files
        </span>
        <span style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.25);
                     color:#a78bfa;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;">
            🔬 Lab Reports
        </span>
    </div>
    """, unsafe_allow_html=True)

    # ── File uploader ──────────────────────────────────────────────────
    uploaded_file = st.file_uploader(
        "Drop your medical report here",
        type=["pdf", "png", "jpg", "jpeg", "tiff", "bmp", "txt"],
        help="Supported: PDF lab reports, scanned images, blood test reports",
        key="report_uploader",
        label_visibility="collapsed",
    )

    # Sample report hint
    st.markdown("""
    <div style="color:#8b949e;font-size:0.75rem;margin-top:6px;">
        💡 Tip: Works best with digital PDF lab reports. Scanned images require Tesseract OCR.
        Common reports: CBC, LFT, KFT, Lipid Profile, Blood Sugar, HbA1c.
    </div>
    """, unsafe_allow_html=True)

    if not uploaded_file:
        # Show example of what the system can extract
        st.markdown('<div style="height:12px;"></div>', unsafe_allow_html=True)
        with st.expander("📋 What biomarkers can be extracted?", expanded=False):
            cols = st.columns(3)
            biomarkers = [
                ("❤️ Cardiovascular", ["Blood Pressure (Systolic/Diastolic)", "Total Cholesterol", "HDL Cholesterol", "LDL Cholesterol"]),
                ("🧪 Metabolic", ["Fasting Blood Glucose", "HbA1c (→ estimated glucose)", "BMI / Weight / Height"]),
                ("🫁 Renal & Hepatic", ["Serum Creatinine", "ALT / SGPT", "AST / SGOT", "GGT", "Bilirubin", "Urea / BUN"]),
            ]
            for col, (title, items) in zip(cols, biomarkers):
                with col:
                    st.markdown(f'<div style="color:#e6edf3;font-size:0.82rem;font-weight:600;margin-bottom:8px;">{title}</div>', unsafe_allow_html=True)
                    for item in items:
                        st.markdown(f'<div style="color:#8b949e;font-size:0.75rem;margin-bottom:4px;">• {item}</div>', unsafe_allow_html=True)
        return False

    # ── Process the uploaded file ──────────────────────────────────────
    st.markdown('<div style="height:12px;"></div>', unsafe_allow_html=True)
    st.markdown(f"""
    <div style="background:#161b22;border:1px solid #21262d;border-radius:10px;
                padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:1.5rem;">📄</span>
        <div>
            <div style="color:#e6edf3;font-size:0.88rem;font-weight:600;">{uploaded_file.name}</div>
            <div style="color:#8b949e;font-size:0.75rem;">{uploaded_file.size:,} bytes · {uploaded_file.type}</div>
        </div>
        <span style="margin-left:auto;background:rgba(16,185,129,0.15);color:#10b981;
                     padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;">Ready</span>
    </div>
    """, unsafe_allow_html=True)

    analyze_btn = st.button("🔬 Analyse Report", type="primary",
                            use_container_width=True, key="analyse_report_btn")

    if not analyze_btn:
        return False

    # ── Run the 6-stage pipeline with live status ──────────────────────
    from src.report_parser import extract_text, structure_report, to_raw_health_input

    pipeline_placeholder = st.empty()

    def render_pipeline(statuses: dict, details: dict = {}):
        steps_info = [
            (1, "User Upload",         "File received and validated",          "📤"),
            (2, "Text Extraction",     "OCR / pdfplumber processing",          "🔍"),
            (3, "Data Structuring",    "NLP + Regex biomarker identification", "🧩"),
            (4, "Rule-Based Analysis", "Cross-organ interaction rules",        "⚙️"),
            (5, "AI/ML Prediction",    "XGBoost organ risk models",            "🤖"),
            (6, "Insight Generation",  "SHAP + Recommendations",               "💡"),
        ]
        with pipeline_placeholder.container():
            st.markdown('<div style="margin-bottom:8px;color:#e6edf3;font-size:0.88rem;font-weight:600;">Analysis Pipeline</div>', unsafe_allow_html=True)
            for num, title, sub, icon in steps_info:
                _pipeline_step(num, title, sub, icon,
                               status=statuses.get(num, "pending"),
                               detail=details.get(num, ""))

    # Stage 1: Upload
    render_pipeline({1: "done"})

    # Stage 2: Text extraction
    render_pipeline({1: "done", 2: "running"})
    file_bytes = uploaded_file.read()
    raw_text = extract_text(file_bytes, uploaded_file.name)

    if not raw_text.strip():
        render_pipeline({1: "done", 2: "error"}, {2: "Could not extract text. Try a digital PDF or clearer image."})
        st.error("❌ Could not extract text from the file. Please ensure it's a digital PDF or a clear image.")
        return False

    word_count = len(raw_text.split())
    render_pipeline({1: "done", 2: "done"}, {2: f"Extracted {word_count} words"})

    # Stage 3: Data structuring
    render_pipeline({1: "done", 2: "done", 3: "running"})
    extraction = structure_report(raw_text)
    n_found = len(extraction.extracted_fields)
    conf_pct = extraction.confidence * 100

    if extraction.confidence < 0.3:
        render_pipeline({1: "done", 2: "done", 3: "warn"},
                        {3: f"Low confidence ({conf_pct:.0f}%) — only {n_found} fields found. Missing values filled with population averages."})
    else:
        render_pipeline({1: "done", 2: "done", 3: "done"},
                        {3: f"Found {n_found} biomarkers · Confidence: {conf_pct:.0f}%"})

    # Stage 4: Rule-based analysis
    render_pipeline({1: "done", 2: "done", 3: "done" if conf_pct >= 30 else "warn", 4: "running"})
    raw_inputs = to_raw_health_input(extraction)

    try:
        bundle = preprocessor.validate_and_transform(raw_inputs)
        render_pipeline({1: "done", 2: "done", 3: "done" if conf_pct >= 30 else "warn", 4: "done"},
                        {4: "Validation passed · Feature vectors built"})
    except Exception as e:
        render_pipeline({1: "done", 2: "done", 3: "warn", 4: "error"}, {4: str(e)})
        st.error(f"❌ Preprocessing failed: {e}")
        return False

    # Stage 5: AI/ML prediction
    render_pipeline({1: "done", 2: "done", 3: "done" if conf_pct >= 30 else "warn",
                     4: "done", 5: "running"})
    try:
        raw_scores = prediction_engine.predict_all(bundle)
        ir = interaction_engine.apply_rules(raw_scores, raw_inputs)
        adjusted = ir.adjusted_scores
        audit_log = ir.audit_log
        render_pipeline({1: "done", 2: "done", 3: "done" if conf_pct >= 30 else "warn",
                         4: "done", 5: "done"},
                        {5: f"Heart={adjusted.heart*100:.1f}% · Kidney={adjusted.kidney*100:.1f}% · Liver={adjusted.liver*100:.1f}%"})
    except Exception as e:
        render_pipeline({1: "done", 2: "done", 3: "warn", 4: "done", 5: "error"}, {5: str(e)})
        st.error(f"❌ Prediction failed: {e}")
        return False

    # Stage 6: Insight generation
    render_pipeline({1: "done", 2: "done", 3: "done" if conf_pct >= 30 else "warn",
                     4: "done", 5: "done", 6: "running"})
    try:
        sim_result = simulation_engine.project(adjusted)
        explanation_bundle = xai_module.explain(bundle, adjusted, audit_log)
        recs = recommendation_engine.generate(adjusted)
        render_pipeline({1: "done", 2: "done", 3: "done" if conf_pct >= 30 else "warn",
                         4: "done", 5: "done", 6: "done"},
                        {6: f"{len(recs.items)} recommendations · 12-month simulation ready"})
    except Exception as e:
        render_pipeline({1: "done", 2: "done", 3: "warn", 4: "done", 5: "done", 6: "error"}, {6: str(e)})
        st.error(f"❌ Insight generation failed: {e}")
        return False

    # ── Store results in session state ─────────────────────────────────
    st.session_state["raw_inputs"]         = raw_inputs
    st.session_state["feature_bundle"]     = bundle
    st.session_state["raw_scores"]         = raw_scores
    st.session_state["adjusted_scores"]    = adjusted
    st.session_state["audit_log"]          = audit_log
    st.session_state["simulation_result"]  = sim_result
    st.session_state["explanation_bundle"] = explanation_bundle
    st.session_state["recommendations"]    = recs
    st.session_state["report_extraction"]  = extraction
    st.session_state["error"]              = None

    # ── Render full inline analysis report ────────────────────────────
    _render_analysis_report(extraction, raw_inputs, adjusted, sim_result,
                             explanation_bundle, recs)
    return True


def _render_extraction_summary(extraction, raw_inputs):
    """Show what was extracted from the report."""
    st.markdown("""
    <div style="background:#161b22;border:1px solid #21262d;border-radius:12px;padding:18px;margin-bottom:16px;">
        <div style="color:#e6edf3;font-size:0.9rem;font-weight:600;margin-bottom:14px;">
            📊 Extracted Biomarkers
        </div>
    </div>
    """, unsafe_allow_html=True)

    conf = extraction.confidence
    conf_c = "#10b981" if conf >= 0.7 else "#f59e0b" if conf >= 0.4 else "#ef4444"
    conf_label = "High" if conf >= 0.7 else "Medium" if conf >= 0.4 else "Low"

    st.markdown(f"""
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;
                padding-bottom:12px;border-bottom:1px solid #21262d;">
        <div style="flex:1;">
            <div style="height:8px;background:#21262d;border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:{conf*100:.0f}%;background:{conf_c};border-radius:4px;"></div>
            </div>
        </div>
        <div style="color:{conf_c};font-size:0.85rem;font-weight:700;min-width:80px;text-align:right;">
            {conf*100:.0f}% {conf_label}
        </div>
        <div style="color:#8b949e;font-size:0.75rem;">Extraction Confidence</div>
    </div>
    """, unsafe_allow_html=True)

    # Show extracted values in a grid
    fields_display = [
        ("Age",               raw_inputs.age,               "years",   None),
        ("Sex",               raw_inputs.sex,               "",        None),
        ("BMI",               raw_inputs.bmi,               "kg/m²",   None),
        ("Systolic BP",       raw_inputs.systolic_bp,       "mmHg",    (90, 120)),
        ("Diastolic BP",      raw_inputs.diastolic_bp,      "mmHg",    (60, 80)),
        ("Total Cholesterol", raw_inputs.total_cholesterol, "mg/dL",   (0, 200)),
        ("HDL Cholesterol",   raw_inputs.hdl_cholesterol,   "mg/dL",   (40, 150)),
        ("LDL Cholesterol",   raw_inputs.ldl_cholesterol,   "mg/dL",   (0, 130)),
        ("Fasting Glucose",   raw_inputs.fasting_glucose,   "mg/dL",   (70, 100)),
        ("Creatinine",        raw_inputs.serum_creatinine,  "mg/dL",   (0.6, 1.2)),
        ("ALT",               raw_inputs.alt_enzyme,        "U/L",     (7, 40)),
        ("AST",               raw_inputs.ast_enzyme,        "U/L",     (10, 40)),
    ]

    cols = st.columns(4)
    for i, (label, val, unit, normal_range) in enumerate(fields_display):
        with cols[i % 4]:
            if isinstance(val, float):
                val_str = f"{val:.1f}"
            else:
                val_str = str(val)

            # Determine if extracted or defaulted
            field_key = label.lower().replace(" ", "_")
            was_extracted = any(field_key in f.lower() for f in extraction.extracted_fields)
            border_c = "#21262d" if was_extracted else "#374151"
            label_suffix = "" if was_extracted else " *"

            # Clinical color
            if normal_range and isinstance(val, (int, float)):
                lo, hi = normal_range
                if lo <= val <= hi:
                    val_c = "#10b981"
                elif val > hi * 1.2 or val < lo * 0.8:
                    val_c = "#ef4444"
                else:
                    val_c = "#f59e0b"
            else:
                val_c = "#e6edf3"

            st.markdown(f"""
            <div style="background:#0d1117;border:1px solid {border_c};border-radius:8px;
                        padding:10px 12px;margin-bottom:8px;text-align:center;">
                <div style="color:#8b949e;font-size:0.65rem;text-transform:uppercase;
                            letter-spacing:0.06em;margin-bottom:4px;">{label}{label_suffix}</div>
                <div style="color:{val_c};font-size:1.1rem;font-weight:700;">{val_str}</div>
                <div style="color:#8b949e;font-size:0.65rem;">{unit}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("""
    <div style="color:#8b949e;font-size:0.7rem;margin-top:4px;">
        * Fields marked with asterisk were not found in the report and filled with population averages.
    </div>
    """, unsafe_allow_html=True)


def _render_analysis_report(extraction, raw_inputs, adjusted, sim_result,
                             explanation_bundle, recs):
    """Render the full inline medical analysis report after upload."""
    import plotly.graph_objects as go
    from src.color_mapping import color_for_score, risk_label

    st.markdown("<div style='height:8px;'></div>", unsafe_allow_html=True)

    # ── SUCCESS BANNER ─────────────────────────────────────────────────
    conf_pct = extraction.confidence * 100
    conf_c   = "#10b981" if conf_pct >= 70 else "#f59e0b" if conf_pct >= 40 else "#ef4444"
    st.markdown(f"""
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;
            padding:16px 20px;margin-bottom:20px;
            display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:1.5rem;">✅</span>
        <div>
            <div style="color:#15803d;font-size:0.95rem;font-weight:700;
                        font-family:'Inter',sans-serif;">Analysis Complete</div>
            <div style="color:#166534;font-size:0.78rem;font-family:'Inter',sans-serif;">
                Report processed · {len(extraction.extracted_fields)} biomarkers extracted ·
                Extraction confidence: <strong>{conf_pct:.0f}%</strong>
            </div>
        </div>
    </div>
    <span style="background:{conf_c}22;color:{conf_c};border:1px solid {conf_c}44;
                 border-radius:20px;padding:4px 14px;font-size:0.75rem;font-weight:700;
                 font-family:'Inter',sans-serif;">
        {'High' if conf_pct>=70 else 'Medium' if conf_pct>=40 else 'Low'} Confidence
    </span>
</div>
""", unsafe_allow_html=True)

    # ── SECTION 1: RISK SUMMARY ────────────────────────────────────────
    st.markdown("""
<div style="color:#0f172a;font-size:1.1rem;font-weight:800;letter-spacing:-0.02em;
            margin-bottom:14px;font-family:'Inter',sans-serif;
            padding-bottom:10px;border-bottom:2px solid #2563eb;">
    Multi-Organ Risk Assessment
</div>
""", unsafe_allow_html=True)

    max_risk = max(adjusted.heart, adjusted.kidney, adjusted.liver)
    hs       = int((1 - max_risk) * 100)
    hs_color = "#10b981" if hs >= 70 else "#f59e0b" if hs >= 40 else "#ef4444"

    r1, r2, r3, r4 = st.columns(4)
    for col, label, val, unit, score, accent in [
        (r1, "Health Score",  str(hs),                    "/ 100", max_risk,        "#2563eb"),
        (r2, "Heart Risk",    f"{adjusted.heart*100:.1f}", "%",     adjusted.heart,  "#ef4444"),
        (r3, "Kidney Risk",   f"{adjusted.kidney*100:.1f}","%" ,    adjusted.kidney, "#3b82f6"),
        (r4, "Liver Risk",    f"{adjusted.liver*100:.1f}", "%",     adjusted.liver,  "#10b981"),
    ]:
        c  = color_for_score(score)
        rl = risk_label(score)
        bb = "#dcfce7" if score < 0.4 else "#fef9c3" if score < 0.7 else "#fee2e2"
        bc = "#15803d" if score < 0.4 else "#a16207" if score < 0.7 else "#dc2626"
        with col:
            st.markdown(f"""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-top:3px solid {accent};
            border-radius:10px;padding:18px;text-align:center;
            box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <div style="color:#94a3b8;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;
                text-transform:uppercase;margin-bottom:8px;font-family:'Inter',sans-serif;">
        {label}
    </div>
    <div style="color:{c};font-size:2rem;font-weight:800;line-height:1;
                font-family:'Inter',sans-serif;">{val}
        <span style="font-size:0.8rem;color:#94a3b8;font-weight:400;">{unit}</span>
    </div>
    <span style="background:{bb};color:{bc};border-radius:20px;padding:3px 10px;
                 font-size:0.67rem;font-weight:700;text-transform:uppercase;
                 font-family:'Inter',sans-serif;margin-top:8px;display:inline-block;">
        {rl}
    </span>
</div>
""", unsafe_allow_html=True)

    st.markdown("<div style='height:20px;'></div>", unsafe_allow_html=True)

    # ── SECTION 2: EXTRACTED BIOMARKERS ───────────────────────────────
    st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:700;margin-bottom:12px;
            font-family:'Inter',sans-serif;">Extracted Biomarkers</div>
""", unsafe_allow_html=True)

    bio_data = [
        ("Age",            raw_inputs.age,               "years",  None),
        ("Sex",            raw_inputs.sex.capitalize(),  "",       None),
        ("BMI",            raw_inputs.bmi,               "kg/m²",  (18.5, 25.0)),
        ("Systolic BP",    raw_inputs.systolic_bp,       "mmHg",   (90, 120)),
        ("Diastolic BP",   raw_inputs.diastolic_bp,      "mmHg",   (60, 80)),
        ("Cholesterol",    raw_inputs.total_cholesterol, "mg/dL",  (0, 200)),
        ("HDL",            raw_inputs.hdl_cholesterol,   "mg/dL",  (40, 150)),
        ("LDL",            raw_inputs.ldl_cholesterol,   "mg/dL",  (0, 130)),
        ("Glucose",        raw_inputs.fasting_glucose,   "mg/dL",  (70, 100)),
        ("Creatinine",     raw_inputs.serum_creatinine,  "mg/dL",  (0.6, 1.2)),
        ("ALT",            raw_inputs.alt_enzyme,        "U/L",    (7, 40)),
        ("AST",            raw_inputs.ast_enzyme,        "U/L",    (10, 40)),
    ]

    cols = st.columns(6)
    for i, (label, val, unit, rng) in enumerate(bio_data):
        val_str = f"{val:.1f}" if isinstance(val, float) else str(val)
        if rng and isinstance(val, (int, float)):
            lo, hi = rng
            vc = "#10b981" if lo <= val <= hi else "#ef4444" if (val > hi*1.2 or val < lo*0.8) else "#f59e0b"
        else:
            vc = "#0f172a"
        with cols[i % 6]:
            st.markdown(
                f'<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;'
                f'padding:10px;text-align:center;margin-bottom:8px;">'
                f'<div style="color:#94a3b8;font-size:0.6rem;text-transform:uppercase;'
                f'letter-spacing:0.06em;margin-bottom:4px;font-family:Inter,sans-serif;">{label}</div>'
                f'<div style="color:{vc};font-size:1rem;font-weight:700;font-family:Inter,sans-serif;">{val_str}</div>'
                f'<div style="color:#94a3b8;font-size:0.62rem;font-family:Inter,sans-serif;">{unit}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

    st.markdown("<div style='height:20px;'></div>", unsafe_allow_html=True)

    # ── SECTION 3: ORGAN RISK BARS ─────────────────────────────────────
    st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:700;margin-bottom:12px;
            font-family:'Inter',sans-serif;">Organ Risk Breakdown</div>
""", unsafe_allow_html=True)

    for organ_name, score, accent in [
        ("Heart  (Cardiovascular)",  adjusted.heart,  "#ef4444"),
        ("Kidney (Renal)",           adjusted.kidney, "#3b82f6"),
        ("Liver  (Hepatic)",         adjusted.liver,  "#10b981"),
    ]:
        c  = color_for_score(score)
        rl = risk_label(score)
        bb = "#dcfce7" if score < 0.4 else "#fef9c3" if score < 0.7 else "#fee2e2"
        bc = "#15803d" if score < 0.4 else "#a16207" if score < 0.7 else "#dc2626"
        st.markdown(
            f'<div style="background:#ffffff;border:1px solid #e2e8f0;border-left:4px solid {accent};'
            f'border-radius:8px;padding:14px 18px;margin-bottom:10px;">'
            f'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
            f'<span style="color:#0f172a;font-size:0.86rem;font-weight:600;font-family:Inter,sans-serif;">{organ_name}</span>'
            f'<div style="display:flex;align-items:center;gap:10px;">'
            f'<span style="color:{c};font-size:1rem;font-weight:800;font-family:Inter,sans-serif;">{score*100:.1f}%</span>'
            f'<span style="background:{bb};color:{bc};border-radius:20px;padding:2px 10px;'
            f'font-size:0.67rem;font-weight:700;text-transform:uppercase;font-family:Inter,sans-serif;">{rl}</span>'
            f'</div></div>'
            f'<div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;">'
            f'<div style="height:100%;width:{score*100:.1f}%;background:linear-gradient(90deg,{c}88,{c});'
            f'border-radius:4px;"></div></div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    st.markdown("<div style='height:20px;'></div>", unsafe_allow_html=True)

    # ── SECTION 4: 12-MONTH PROJECTION ────────────────────────────────
    if sim_result:
        st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:700;margin-bottom:12px;
            font-family:'Inter',sans-serif;">12-Month Risk Projection</div>
""", unsafe_allow_html=True)

        fig = go.Figure()
        for organ, traj, color in [
            ("Heart",  sim_result.heart_trajectory,  "#ef4444"),
            ("Kidney", sim_result.kidney_trajectory, "#3b82f6"),
            ("Liver",  sim_result.liver_trajectory,  "#10b981"),
        ]:
            fig.add_trace(go.Scatter(
                x=sim_result.months,
                y=[v * 100 for v in traj],
                name=organ,
                line=dict(color=color, width=2.5, shape="spline", smoothing=0.8),
                mode="lines+markers",
                marker=dict(size=4, color=color),
                hovertemplate=f"<b>{organ}</b><br>Month %{{x}}<br>Risk: %{{y:.1f}}%<extra></extra>",
            ))
        fig.add_hline(y=40, line_dash="dot", line_color="rgba(245,158,11,0.5)",
                      annotation_text="Moderate (40%)",
                      annotation_font=dict(color="#d97706", size=10))
        fig.add_hline(y=70, line_dash="dot", line_color="rgba(239,68,68,0.5)",
                      annotation_text="High Risk (70%)",
                      annotation_font=dict(color="#dc2626", size=10))
        fig.update_layout(
            height=280, margin=dict(l=40, r=20, t=20, b=40),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(248,250,252,0.8)",
            xaxis=dict(title="Month", gridcolor="rgba(226,232,240,0.6)",
                       tickfont=dict(color="#64748b", size=10)),
            yaxis=dict(title="Risk (%)", range=[0, 100],
                       gridcolor="rgba(226,232,240,0.6)",
                       tickfont=dict(color="#64748b", size=10)),
            legend=dict(orientation="h", y=1.08, x=0,
                        font=dict(color="#374151", size=11),
                        bgcolor="rgba(255,255,255,0.9)"),
            hovermode="x unified",
        )
        st.plotly_chart(fig, use_container_width=True, key="report_sim_chart")

        # Month-12 summary
        p1, p2, p3 = st.columns(3)
        for col, organ, traj, cur, accent in [
            (p1, "Heart",  sim_result.heart_trajectory,  adjusted.heart,  "#ef4444"),
            (p2, "Kidney", sim_result.kidney_trajectory, adjusted.kidney, "#3b82f6"),
            (p3, "Liver",  sim_result.liver_trajectory,  adjusted.liver,  "#10b981"),
        ]:
            m12   = traj[-1]
            delta = (m12 - cur) * 100
            c     = color_for_score(m12)
            d_col = "#dc2626" if delta > 0 else "#059669"
            with col:
                st.markdown(
                    f'<div style="background:#ffffff;border:1px solid #e2e8f0;'
                    f'border-top:3px solid {accent};border-radius:8px;padding:14px;text-align:center;">'
                    f'<div style="color:#94a3b8;font-size:0.62rem;font-weight:700;text-transform:uppercase;'
                    f'letter-spacing:0.08em;margin-bottom:6px;font-family:Inter,sans-serif;">{organ} — Month 12</div>'
                    f'<div style="color:{c};font-size:1.6rem;font-weight:800;font-family:Inter,sans-serif;">'
                    f'{m12*100:.1f}%</div>'
                    f'<div style="color:{d_col};font-size:0.74rem;font-family:Inter,sans-serif;">'
                    f'{"+" if delta>0 else ""}{delta:.1f}% from current</div>'
                    f'</div>',
                    unsafe_allow_html=True,
                )

    st.markdown("<div style='height:20px;'></div>", unsafe_allow_html=True)

    # ── SECTION 5: AI EXPLANATIONS (SHAP) ─────────────────────────────
    if explanation_bundle:
        st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:700;margin-bottom:12px;
            font-family:'Inter',sans-serif;">AI Explanations — Key Risk Drivers (SHAP)</div>
""", unsafe_allow_html=True)

        tab_h, tab_k, tab_l = st.tabs(["❤️ Heart", "🫘 Kidney", "🟤 Liver"])
        for tab, expl, organ_key, accent in [
            (tab_h, explanation_bundle.heart,  "Heart",  "#ef4444"),
            (tab_k, explanation_bundle.kidney, "Kidney", "#3b82f6"),
            (tab_l, explanation_bundle.liver,  "Liver",  "#10b981"),
        ]:
            with tab:
                sc = expl.predicted_score
                c  = color_for_score(sc)
                st.markdown(
                    f'<div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid {accent};'
                    f'border-radius:8px;padding:12px 16px;margin-bottom:14px;">'
                    f'<span style="color:{c};font-size:1.4rem;font-weight:800;font-family:Inter,sans-serif;">'
                    f'{sc*100:.1f}%</span>'
                    f'<span style="color:#64748b;font-size:0.8rem;margin-left:10px;font-family:Inter,sans-serif;">'
                    f'{risk_label(sc)} Risk — {organ_key}</span>'
                    f'</div>',
                    unsafe_allow_html=True,
                )
                if expl.top_features:
                    max_abs = max(abs(f.shap_value) for f in expl.top_features) or 1
                    for feat in expl.top_features[:5]:
                        fname  = feat.feature_name.replace("_", " ").title()
                        val    = feat.shap_value
                        pct    = abs(val) / max_abs * 100
                        bar_c  = "#ef4444" if val > 0 else "#2563eb"
                        val_c  = "#dc2626" if val > 0 else "#2563eb"
                        sign   = f"+{val:.3f}" if val > 0 else f"{val:.3f}"
                        st.markdown(
                            f'<div style="margin-bottom:10px;">'
                            f'<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'
                            f'<span style="color:#374151;font-size:0.82rem;font-family:Inter,sans-serif;">{fname}</span>'
                            f'<span style="color:{val_c};font-size:0.82rem;font-weight:700;font-family:Inter,sans-serif;">{sign}</span>'
                            f'</div>'
                            f'<div style="height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;">'
                            f'<div style="height:100%;width:{pct:.0f}%;background:{bar_c};border-radius:4px;"></div>'
                            f'</div>'
                            f'</div>',
                            unsafe_allow_html=True,
                        )
                if expl.sentences:
                    for s in expl.sentences[:3]:
                        st.markdown(
                            f'<div style="background:#eff6ff;border-radius:6px;padding:8px 12px;'
                            f'margin-bottom:6px;font-size:0.78rem;color:#1e40af;'
                            f'font-family:Inter,sans-serif;">• {s}</div>',
                            unsafe_allow_html=True,
                        )

    st.markdown("<div style='height:20px;'></div>", unsafe_allow_html=True)

    # ── SECTION 6: RECOMMENDATIONS ────────────────────────────────────
    if recs:
        st.markdown("""
<div style="color:#0f172a;font-size:1rem;font-weight:700;margin-bottom:12px;
            font-family:'Inter',sans-serif;">Clinical Recommendations</div>
""", unsafe_allow_html=True)

        cat_cfg = {
            "clinical_consultation": ("#fef2f2", "#dc2626", "#ef4444", "💊 Clinical"),
            "physical_activity":     ("#faf5ff", "#7c3aed", "#8b5cf6", "🏃 Exercise"),
            "dietary_modification":  ("#eff6ff", "#2563eb", "#3b82f6", "🥗 Dietary"),
            "lifestyle_habit":       ("#f0fdf4", "#15803d", "#22c55e", "🌿 Lifestyle"),
        }
        for rec in recs.items[:8]:
            bg, fg, border, cat_label = cat_cfg.get(
                rec.category, ("#f8fafc", "#64748b", "#e2e8f0", "• General")
            )
            st.markdown(
                f'<div style="background:#ffffff;border:1px solid #e2e8f0;'
                f'border-left:4px solid {border};border-radius:8px;'
                f'padding:14px 18px;margin-bottom:10px;">'
                f'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
                f'<span style="background:{bg};color:{fg};font-size:0.65rem;font-weight:700;'
                f'padding:2px 8px;border-radius:4px;text-transform:uppercase;'
                f'font-family:Inter,sans-serif;">{cat_label}</span>'
                f'<span style="background:#f1f5f9;color:#64748b;font-size:0.65rem;font-weight:600;'
                f'padding:2px 8px;border-radius:4px;font-family:Inter,sans-serif;">'
                f'{rec.organ.capitalize()}</span>'
                f'</div>'
                f'<div style="color:#374151;font-size:0.82rem;line-height:1.6;'
                f'font-family:Inter,sans-serif;">{rec.text}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

        st.markdown("""
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;
            padding:12px 16px;margin-top:8px;font-size:0.76rem;color:#78350f;
            font-family:'Inter',sans-serif;">
    ⚠️ These recommendations are for educational purposes only.
    Always consult a qualified healthcare professional before making changes.
</div>
""", unsafe_allow_html=True)

    # ── SECTION 7: NAVIGATE TO FULL DASHBOARD ─────────────────────────
    st.markdown("<div style='height:16px;'></div>", unsafe_allow_html=True)
    st.markdown("""
<div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);border-radius:12px;
            padding:20px 24px;text-align:center;margin-bottom:8px;">
    <div style="color:#ffffff;font-size:0.95rem;font-weight:700;margin-bottom:6px;
                font-family:'Inter',sans-serif;">
        Full analysis ready in your dashboard
    </div>
    <div style="color:rgba(255,255,255,0.75);font-size:0.8rem;font-family:'Inter',sans-serif;">
        Click Dashboard in the sidebar for the 3D Digital Twin, Simulation, and Population Comparison
    </div>
</div>
""", unsafe_allow_html=True)
    if st.button("→ Open Full Dashboard", type="primary", use_container_width=True,
                 key="goto_dashboard_from_report"):
        import streamlit as _st
        _st.session_state["active_section"] = "home"
        _st.rerun()
