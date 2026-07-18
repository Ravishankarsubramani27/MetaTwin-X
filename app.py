"""MetaTwin-X — Premium Clinical Dashboard Application."""
import sys, logging, traceback, requests
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
import streamlit as st

API_BASE = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="MetaTwin-X | Digital Health Twin",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded",
)

from dashboard.styles import GLOBAL_CSS
st.markdown(GLOBAL_CSS, unsafe_allow_html=True)

from src.preprocessor import DataPreprocessor
from src.prediction_engine import PredictionEngine
from src.interaction_engine import InteractionEngine
from src.simulation_engine import SimulationEngine
from src.xai_module import XAIModule
from src.recommendation_engine import RecommendationEngine
from src.serializer import HealthProfileSerializer
from src.models.health_profile import HealthProfile
from src.color_mapping import color_for_score, risk_label
from src.exceptions import ValidationError

from dashboard.sections.health_input import render_health_input
from dashboard.sections.report_upload import render_report_upload
from dashboard.sections.home_screen import render_home_screen
from dashboard.sections.risk_overview import render_risk_overview
from dashboard.sections.simulation import render_simulation
from dashboard.sections.explanations import render_explanations
from dashboard.sections.recommendations import render_recommendations
from dashboard.sections.health_analytics import render_health_analytics
from dashboard.sections.population_comparison import render_population_comparison
from dashboard.sections.about import render_about
from dashboard.sections.documentation import render_documentation

MODEL_DIR  = Path(__file__).parent / "models"
CONFIG_DIR = Path(__file__).parent / "config"


@st.cache_resource(show_spinner="Initialising AI engines…")
def load_engines():
    preprocessor          = DataPreprocessor(MODEL_DIR / "preprocessor")
    prediction_engine     = PredictionEngine(MODEL_DIR)
    interaction_engine    = InteractionEngine()
    simulation_engine     = SimulationEngine(CONFIG_DIR / "simulation.yaml")
    xai_module            = XAIModule(prediction_engine)
    recommendation_engine = RecommendationEngine(CONFIG_DIR / "recommendations.yaml")
    serializer            = HealthProfileSerializer()
    return (preprocessor, prediction_engine, interaction_engine,
            simulation_engine, xai_module, recommendation_engine, serializer)


def init_session():
    defaults = {
        "raw_inputs": None, "feature_bundle": None, "adjusted_scores": None,
        "audit_log": [], "explanation_bundle": None, "simulation_result": None,
        "recommendations": None, "error": None,
        "active_section": "home", "backend_ok": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


# ── Sidebar ────────────────────────────────────────────────────────────────────
def render_sidebar(serializer):
    with st.sidebar:
        # ── Logo / Brand ──────────────────────────────────────────────
        st.markdown("""
<div style="padding:20px 16px 16px;border-bottom:1px solid #e8edf4;">
    <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:38px;height:38px;
                    background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);
                    border-radius:10px;display:flex;align-items:center;
                    justify-content:center;flex-shrink:0;
                    box-shadow:0 4px 12px rgba(37,99,235,0.35);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="#fff" stroke-width="2.2" stroke-linecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                         a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
                         1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        </div>
        <div>
            <div style="color:#0f172a;font-size:1rem;font-weight:800;
                        letter-spacing:-0.025em;font-family:'Inter',sans-serif;
                        line-height:1.2;">MetaTwin-X</div>
            <div style="color:#94a3b8;font-size:0.65rem;font-family:'Inter',sans-serif;
                        margin-top:1px;">Digital Health Twin</div>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

        # ── Nav items ─────────────────────────────────────────────────
        active = st.session_state.get("active_section", "home")

        nav = [
            ("home",            "⊞",  "Dashboard"),
            ("upload",          "📄",  "Report Upload"),
            ("input",           "✏️",  "Health Input"),
            ("risk",            "📊",  "Risk Analysis"),
            ("simulation",      "📈",  "Simulation"),
            ("explanations",    "🧠",  "AI Explanations"),
            ("recommendations", "💊",  "Recommendations"),
            ("analytics",       "📉",  "Health Analytics"),
            ("population",      "👥",  "Population View"),
            ("about",           "🚀",  "About"),
        ]

        st.markdown('<div style="height:8px;"></div>', unsafe_allow_html=True)

        for key, icon, label in nav:
            is_active = active == key
            if is_active:
                st.markdown(f"""
<div style="background:#eff6ff;border-radius:8px;padding:9px 14px;
            margin:1px 8px;display:flex;align-items:center;gap:9px;">
    <span style="font-size:0.88rem;line-height:1;">{icon}</span>
    <span style="color:#2563eb;font-size:0.83rem;font-weight:600;
                 font-family:'Inter',sans-serif;">{label}</span>
</div>
""", unsafe_allow_html=True)
            else:
                btn_label = f"{icon}  {label}"
                if st.button(btn_label, key=f"nav_{key}", use_container_width=True):
                    st.session_state["active_section"] = key
                    st.rerun()

        # ── Risk summary (if data available) ─────────────────────────
        scores = st.session_state.get("adjusted_scores")
        if scores:
            st.markdown("""
<div style="height:1px;background:#e8edf4;margin:12px 0;"></div>
<div style="color:#94a3b8;font-size:0.58rem;font-weight:700;letter-spacing:0.14em;
            text-transform:uppercase;padding:0 16px;margin-bottom:10px;
            font-family:'Inter',sans-serif;">CURRENT RISK</div>
""", unsafe_allow_html=True)
            for organ, score, dot_color in [
                ("Heart",  scores.heart,  "#ef4444"),
                ("Kidney", scores.kidney, "#3b82f6"),
                ("Liver",  scores.liver,  "#10b981"),
            ]:
                c   = color_for_score(score)
                pct = score * 100
                st.markdown(f"""
<div style="padding:0 16px;margin-bottom:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:6px;height:6px;border-radius:50%;background:{dot_color};
                         display:inline-block;"></span>
            <span style="color:#64748b;font-size:0.75rem;font-family:'Inter',sans-serif;">
                {organ}
            </span>
        </div>
        <span style="color:{c};font-size:0.75rem;font-weight:700;
                     font-family:'Inter',sans-serif;">{pct:.0f}%</span>
    </div>
    <div style="height:4px;background:#f1f5f9;border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:{pct:.1f}%;background:{c};border-radius:2px;"></div>
    </div>
</div>
""", unsafe_allow_html=True)

        # ── Export button ─────────────────────────────────────────────
        if scores and st.session_state.get("raw_inputs"):
            try:
                profile      = HealthProfile(inputs=st.session_state["raw_inputs"], risk_scores=scores)
                export_bytes = serializer.export_to_file(profile)
                st.download_button(
                    "⬇  Export Profile",
                    data=export_bytes,
                    file_name=f"metatwin_{datetime.now().strftime('%Y%m%d_%H%M')}.json",
                    mime="application/json",
                    use_container_width=True,
                )
            except Exception:
                pass

        # ── New Simulation button ─────────────────────────────────────
        st.markdown('<div style="height:1px;background:#e8edf4;margin:12px 0;"></div>', unsafe_allow_html=True)
        if st.button("+ New Simulation", type="primary", use_container_width=True, key="new_sim_btn"):
            st.session_state["active_section"] = "input"
            st.rerun()

        # ── Footer ────────────────────────────────────────────────────
        backend_ok = st.session_state.get("backend_ok", False)
        mode_dot   = '#10b981' if backend_ok else '#f59e0b'
        mode_text  = 'API Connected' if backend_ok else 'Local Mode'
        st.markdown(f"""
<div style="padding:10px 16px 16px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <span style="width:6px;height:6px;border-radius:50%;background:{mode_dot};
                     display:inline-block;"></span>
        <span style="color:#94a3b8;font-size:0.68rem;font-family:'Inter',sans-serif;">
            {mode_text}
        </span>
    </div>
    <div style="color:#cbd5e1;font-size:0.62rem;line-height:1.7;font-family:'Inter',sans-serif;">
        For educational purposes only.<br>Not a substitute for medical advice.
    </div>
</div>
""", unsafe_allow_html=True)


# ── Top bar ────────────────────────────────────────────────────────────────────
def render_topbar(title: str, subtitle: str = ""):
    now = datetime.now()
    sub = subtitle or now.strftime("%A, %d %B %Y")
    backend_ok = st.session_state.get("backend_ok", False)
    mode_html = (
        '<span style="display:inline-flex;align-items:center;gap:6px;'
        'background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;'
        'padding:4px 12px;font-size:0.7rem;font-weight:600;color:#15803d;'
        'font-family:Inter,sans-serif;">'
        '<span style="width:6px;height:6px;border-radius:50%;background:#10b981;'
        'display:inline-block;animation:blink 1.5s infinite;"></span>API</span>'
    ) if backend_ok else (
        '<span style="display:inline-flex;align-items:center;gap:6px;'
        'background:#fffbeb;border:1px solid #fde68a;border-radius:6px;'
        'padding:4px 12px;font-size:0.7rem;font-weight:600;color:#a16207;'
        'font-family:Inter,sans-serif;">⚡ Local</span>'
    )
    st.markdown(f"""
<div style="background:#ffffff;border-bottom:1px solid #e8edf4;
            padding:0 28px;height:60px;display:flex;align-items:center;
            justify-content:space-between;
            box-shadow:0 1px 4px rgba(0,0,0,0.04);margin-bottom:0;">
    <div>
        <div style="font-size:1.05rem;font-weight:800;color:#0f172a;
                    font-family:'Inter',sans-serif;letter-spacing:-0.02em;
                    line-height:1.2;">{title}</div>
        <div style="font-size:0.7rem;color:#94a3b8;font-family:'Inter',sans-serif;">
            {sub}
        </div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
        {mode_html}
        <div style="width:32px;height:32px;border-radius:50%;
                    background:linear-gradient(135deg,#2563eb,#7c3aed);
                    display:flex;align-items:center;justify-content:center;
                    font-size:0.75rem;font-weight:700;color:#fff;
                    font-family:'Inter',sans-serif;">MT</div>
    </div>
</div>
<div style="height:24px;"></div>
""", unsafe_allow_html=True)


# ── Content wrapper (removed — was causing </div> leaks) ──────────────────────


# ── No-data placeholder ────────────────────────────────────────────────────────
def no_data(section: str):
    st.markdown(f"""
<div style="text-align:center;padding:60px 20px;">
    <div style="width:64px;height:64px;background:#f8fafc;border:1px solid #e2e8f0;
                border-radius:16px;display:flex;align-items:center;justify-content:center;
                margin:0 auto 16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
             stroke="#94a3b8" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
    </div>
    <h3 style="color:#0f172a;font-size:1.1rem;font-weight:700;margin:0 0 8px;
               font-family:'Inter',sans-serif;">No Data Available</h3>
    <p style="color:#64748b;font-size:0.84rem;max-width:360px;margin:0 auto 24px;
              line-height:1.6;font-family:'Inter',sans-serif;">
        Please upload a medical report or enter your health data to view {section}.
    </p>
</div>
""", unsafe_allow_html=True)
    c1, c2, c3 = st.columns([1, 1, 1])
    with c2:
        if st.button("Go to Health Input", type="primary", use_container_width=True,
                     key=f"goto_{section}"):
            st.session_state["active_section"] = "input"
            st.rerun()


# ── Pipeline ───────────────────────────────────────────────────────────────────
def run_pipeline(raw_inputs, preprocessor, prediction_engine,
                 interaction_engine, simulation_engine, xai_module,
                 recommendation_engine):
    st.session_state["error"] = None
    with st.spinner("Running AI analysis…"):
        try:
            bundle     = preprocessor.validate_and_transform(raw_inputs)
            raw_scores = prediction_engine.predict_all(bundle)
            result     = interaction_engine.apply_rules(raw_scores, raw_inputs)
            adjusted   = result.adjusted_scores

            st.session_state.update({
                "feature_bundle":    bundle,
                "adjusted_scores":   adjusted,
                "audit_log":         result.audit_log,
                "simulation_result": simulation_engine.project(adjusted),
                "recommendations":   recommendation_engine.generate(adjusted),
            })

            from src.models.data_types import InteractionAuditEntry
            normalised = []
            for e in result.audit_log:
                if isinstance(e, dict):
                    normalised.append(InteractionAuditEntry(
                        rule_id=e.get("rule_id", ""),
                        rule_description=e.get("rule_description", ""),
                        organ_affected=e.get("organ_affected", ""),
                        original_score=float(e.get("original_score", 0)),
                        adjustment=float(e.get("adjustment", 0)),
                        adjusted_score=float(e.get("adjusted_score", 0)),
                    ))
                else:
                    normalised.append(e)

            st.session_state["explanation_bundle"] = xai_module.explain(
                bundle, adjusted, normalised
            )
            st.session_state["raw_inputs"]     = raw_inputs
            st.session_state["active_section"] = "home"
            st.rerun()

        except Exception as e:
            if isinstance(e, ValidationError):
                st.session_state["error"] = "Validation: " + " | ".join(str(x) for x in e.errors)
            else:
                logging.error(traceback.format_exc())
                st.session_state["error"] = str(e)
            st.rerun()


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    init_session()

    try:
        (preprocessor, prediction_engine, interaction_engine,
         simulation_engine, xai_module, recommendation_engine,
         serializer) = load_engines()
    except Exception as e:
        st.error(f"Failed to initialise engines: {e}")
        st.stop()

    if st.session_state["backend_ok"] is None:
        try:
            requests.get(API_BASE, timeout=2)
            st.session_state["backend_ok"] = True
        except Exception:
            st.session_state["backend_ok"] = False

    render_sidebar(serializer)

    active = st.session_state.get("active_section", "home")
    scores = st.session_state.get("adjusted_scores")
    sim    = st.session_state.get("simulation_result")
    recs   = st.session_state.get("recommendations")
    expl   = st.session_state.get("explanation_bundle")
    raw    = st.session_state.get("raw_inputs")

    # Error banner
    if st.session_state.get("error"):
        st.error(st.session_state["error"])
        if st.button("Dismiss", key="dismiss_err"):
            st.session_state["error"] = None
            st.rerun()

    # ── UPLOAD ─────────────────────────────────────────────────────────
    if active == "upload":
        render_topbar("Report Upload", "Upload a lab report for automated AI analysis")
        triggered = render_report_upload(
            preprocessor=preprocessor, prediction_engine=prediction_engine,
            interaction_engine=interaction_engine, simulation_engine=simulation_engine,
            xai_module=xai_module, recommendation_engine=recommendation_engine,
        )
        if triggered:
            st.session_state["active_section"] = "home"
            st.rerun()
        return

    # ── INPUT ──────────────────────────────────────────────────────────
    if active == "input":
        render_topbar("Health Input", "Enter your biomarkers to generate your digital twin")
        result = render_health_input(serializer)
        if result:
            run_pipeline(result, preprocessor, prediction_engine,
                         interaction_engine, simulation_engine, xai_module,
                         recommendation_engine)
        return

    # ── RISK ───────────────────────────────────────────────────────────
    if active == "risk":
        render_topbar("Risk Analysis", "AI-powered multi-organ risk assessment")
        if scores:
            render_risk_overview(scores)
        else:
            no_data("Risk Analysis")
        return

    # ── SIMULATION ─────────────────────────────────────────────────────
    if active == "simulation":
        render_topbar("Digital Twin Simulation", "12-month risk trajectory with what-if scenarios")
        if sim and scores:
            render_simulation(sim, scores, simulation_engine,
                              preprocessor, prediction_engine, interaction_engine)
        else:
            no_data("Simulation")
        return

    # ── EXPLANATIONS ───────────────────────────────────────────────────
    if active == "explanations":
        render_topbar("AI Explanations", "SHAP-based feature importance analysis")
        if expl:
            render_explanations(expl)
        else:
            no_data("AI Explanations")
        return

    # ── RECOMMENDATIONS ────────────────────────────────────────────────
    if active == "recommendations":
        render_topbar("Recommendations", "Personalised clinical and lifestyle action plan")
        if recs:
            render_recommendations(recs)
        else:
            no_data("Recommendations")
        return

    # ── ANALYTICS ──────────────────────────────────────────────────────
    if active == "analytics":
        render_topbar("Health Analytics", "Comprehensive health scoring and metabolic analysis")
        if scores and raw:
            render_health_analytics(scores, raw)
        else:
            no_data("Health Analytics")
        return

    # ── POPULATION ─────────────────────────────────────────────────────
    if active == "population":
        render_topbar("Population Comparison", "How your biomarkers compare to population averages")
        if scores and raw:
            render_population_comparison(scores, raw)
        else:
            no_data("Population Comparison")
        return

    # ── ABOUT ──────────────────────────────────────────────────────────
    if active == "about":
        render_topbar("About & Innovation", "MetaTwin-X system overview and technical details")
        render_about()
        return

    # ── DOCUMENTATION ──────────────────────────────────────────────────
    if active == "docs":
        render_topbar("Project Documentation", "Full technical report, literature survey and architecture")
        render_documentation()
        return

    # ── HOME (default) ─────────────────────────────────────────────────
    render_topbar("Health Overview", "Your personalised digital health twin dashboard")
    render_home_screen(
        adjusted_scores=scores, raw_inputs=raw,
        sim_result=sim, recommendations=recs,
    )


if __name__ == "__main__":
    main()
