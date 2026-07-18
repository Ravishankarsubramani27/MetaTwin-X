"""Simulation — matches MetaTwin-X mobile design screenshots exactly."""
from __future__ import annotations
import streamlit as st
from src.models.data_types import AdjustedScores
from src.color_mapping import color_for_score, risk_label
from dashboard.components.timeline_chart import timeline_chart


def render_simulation(baseline, adjusted_scores, simulation_engine=None,
                      preprocessor=None, prediction_engine=None,
                      interaction_engine=None):

    # Page header
    st.markdown("""
    <div style="margin-bottom:16px;">
        <div style="font-size:1.5rem;font-weight:800;color:#0f172a;letter-spacing:-0.03em;
                    font-family:'Inter',sans-serif;line-height:1.2;">12-Month Simulation</div>
        <div style="font-size:0.82rem;color:#64748b;margin-top:4px;line-height:1.5;
                    font-family:'Inter',sans-serif;">
            Projected risk trajectories based on current clinical baseline.
            Adjust parameters below to simulate therapeutic interventions.
        </div>
    </div>
    """, unsafe_allow_html=True)

    results = [baseline]
    if "scenario_sims" in st.session_state:
        results += st.session_state["scenario_sims"]

    # ── Risk Trajectory Chart ──────────────────────────────────────────
    st.markdown("""
    <div class="mt-card">
        <div class="mt-card-title">Risk Trajectory Forecast</div>
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px;flex-wrap:wrap;">
            <span style="display:flex;align-items:center;gap:5px;font-size:0.74rem;color:#374151;font-family:'Inter',sans-serif;">
                <span style="width:20px;height:3px;background:#ef4444;display:inline-block;border-radius:2px;"></span> Cardio
            </span>
            <span style="display:flex;align-items:center;gap:5px;font-size:0.74rem;color:#374151;font-family:'Inter',sans-serif;">
                <span style="width:20px;height:3px;background:#3b82f6;display:inline-block;border-radius:2px;"></span> Renal
            </span>
            <span style="display:flex;align-items:center;gap:5px;font-size:0.74rem;color:#374151;font-family:'Inter',sans-serif;">
                <span style="width:20px;height:3px;background:#f59e0b;display:inline-block;border-radius:2px;"></span> Hepatic
            </span>
        </div>
        <div style="font-size:0.72rem;color:#94a3b8;margin-bottom:10px;font-family:'Inter',sans-serif;">
            Multi-system risk scoring over 12 months (0–100 scale)
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.plotly_chart(timeline_chart(results), use_container_width=True, key="sim_chart")

    # ── Intervention Modeling (What-If) ────────────────────────────────
    st.markdown("""
    <div class="mt-card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
            <div style="width:36px;height:36px;background:#eff6ff;border-radius:10px;
                        display:flex;align-items:center;justify-content:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="#2563eb" stroke-width="2">
                    <line x1="4" y1="21" x2="4" y2="14"/>
                    <line x1="4" y1="10" x2="4" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12" y2="3"/>
                    <line x1="20" y1="21" x2="20" y2="16"/>
                    <line x1="20" y1="12" x2="20" y2="3"/>
                    <line x1="1" y1="14" x2="7" y2="14"/>
                    <line x1="9" y1="8" x2="15" y2="8"/>
                    <line x1="17" y1="16" x2="23" y2="16"/>
                </svg>
            </div>
            <div>
                <div style="font-size:0.95rem;font-weight:700;color:#0f172a;
                            font-family:'Inter',sans-serif;">Intervention Modeling (What-If)</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Sliders
    w_bmi  = st.slider("Target BMI Reduction", -10.0, 0.0, -2.0, 0.5, key="w_bmi",
                       format="%.1f")
    w_sbp  = st.slider("Systolic BP Target (mmHg)", 100, 160, 125, 5, key="w_sbp")

    med_options = ["Low (<50%)", "Moderate (50-80%)", "High (>80%)"]
    w_med  = st.selectbox("Medication Adherence Factor", med_options,
                          index=2, key="w_med", label_visibility="visible")

    # Projected impact preview
    bmi_benefit  = abs(w_bmi) * 0.008
    sbp_benefit  = max(0, (125 - w_sbp)) * 0.002
    med_benefit  = 0.05 if "High" in w_med else 0.02 if "Moderate" in w_med else 0.0
    total_benefit = bmi_benefit + sbp_benefit + med_benefit

    heart_delta  = -total_benefit * 100 - 14
    hepatic_delta = -total_benefit * 80 - 8

    st.markdown(f"""
    <div class="impact-box">
        <div class="impact-box-title">PROJECTED 12M IMPACT</div>
        <div class="impact-row">
            <span class="impact-organ">Cardio Risk</span>
            <span class="impact-delta-neg">
                ↓ {abs(heart_delta):.0f}%
            </span>
        </div>
        <div class="impact-row">
            <span class="impact-organ">Hepatic Load</span>
            <span class="impact-delta-neg">
                ↓ {abs(hepatic_delta):.0f}%
            </span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    if st.button("Run Simulation", type="primary", key="run_sim"):
        if simulation_engine:
            benefit = total_benefit
            mod = AdjustedScores(
                heart=max(adjusted_scores.heart - benefit, 0.05),
                kidney=max(adjusted_scores.kidney - benefit * 0.8, 0.05),
                liver=max(adjusted_scores.liver - benefit * 0.6, 0.05),
            )
            sim = simulation_engine.project(mod)
            sim.scenario_label = f"Intervention (BMI{w_bmi:+.1f}, BP{w_sbp})"
            existing = st.session_state.get("scenario_sims", [])
            st.session_state["scenario_sims"] = (existing[1:] if len(existing) >= 3 else existing) + [sim]
            st.rerun()

    # ── Current Baseline ───────────────────────────────────────────────
    st.markdown("""
    <div class="mt-card" style="margin-top:14px;">
        <div class="mt-card-title">Current Baseline</div>
    </div>
    """, unsafe_allow_html=True)

    max_risk = max(adjusted_scores.heart, adjusted_scores.kidney, adjusted_scores.liver)
    health_score = int((1 - max_risk) * 100)
    hs_color = "#16a34a" if health_score >= 70 else "#ea580c" if health_score >= 40 else "#dc2626"
    hs_label = "Good" if health_score >= 70 else "Fair" if health_score >= 40 else "Poor"

    st.markdown(f"""
    <div class="baseline-row">
        <span class="baseline-label">Systemic Inflammatory Score</span>
        <span style="background:#fef9c3;color:#a16207;font-size:0.78rem;font-weight:700;
                     padding:3px 10px;border-radius:20px;font-family:'Inter',sans-serif;">
            {hs_label} ({health_score})
        </span>
    </div>
    <div class="baseline-row">
        <span class="baseline-label">Metabolic Efficiency</span>
        <span style="background:#dbeafe;color:#1d4ed8;font-size:0.78rem;font-weight:700;
                     padding:3px 10px;border-radius:20px;font-family:'Inter',sans-serif;">
            Fair ({int((1-adjusted_scores.liver)*100)}%)
        </span>
    </div>
    """, unsafe_allow_html=True)

    # ── Active Protocols ───────────────────────────────────────────────
    st.markdown("""
    <div class="mt-card">
        <div class="mt-card-title" style="margin-bottom:12px;">Active Protocols</div>
    </div>
    """, unsafe_allow_html=True)

    protocols = [
        ("💊", "#fef2f2", "Atorvastatin 20mg",    "Daily, Evening"),
        ("🏃", "#faf5ff", "Resistance Training",   "3x/week, Mod Intensity"),
        ("🥗", "#f0fdf4", "DASH Diet Protocol",    "Ongoing"),
    ]
    for icon, bg, name, sub in protocols:
        st.markdown(f"""
        <div class="protocol-item">
            <div class="protocol-icon" style="background:{bg};">{icon}</div>
            <div>
                <div class="protocol-name">{name}</div>
                <div class="protocol-sub">{sub}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    # Clear scenarios
    if st.session_state.get("scenario_sims"):
        if st.button("Clear Scenarios", key="clr_sc"):
            st.session_state["scenario_sims"] = []
            st.rerun()
