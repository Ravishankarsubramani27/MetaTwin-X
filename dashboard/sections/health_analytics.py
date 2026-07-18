"""Health Analytics — Clinical Precision Design System (light theme)."""
from __future__ import annotations
import streamlit as st
import plotly.graph_objects as go


def _risk_color(score: float) -> str:
    if score < 0.4: return "#10b981"
    if score < 0.7: return "#f59e0b"
    return "#ef4444"


def _risk_label(score: float) -> str:
    if score < 0.4: return "Low"
    if score < 0.7: return "Moderate"
    return "High"


def _metabolic_syndrome_check(raw_inputs) -> dict:
    sex      = getattr(raw_inputs, "sex", "male").lower()
    criteria = []
    bmi      = getattr(raw_inputs, "bmi", 0)
    criteria.append(("Obesity (BMI > 30)", bmi > 30, f"BMI = {bmi:.1f}"))
    fg = getattr(raw_inputs, "fasting_glucose", 0)
    criteria.append(("Elevated Glucose (> 100)", fg > 100, f"{fg:.0f} mg/dL"))
    sbp = getattr(raw_inputs, "systolic_bp", 0)
    dbp = getattr(raw_inputs, "diastolic_bp", 0)
    criteria.append(("Elevated BP (SBP>130 or DBP>85)", sbp > 130 or dbp > 85, f"{sbp:.0f}/{dbp:.0f} mmHg"))
    tc = getattr(raw_inputs, "total_cholesterol", 0)
    criteria.append(("High Cholesterol (> 200)", tc > 200, f"{tc:.0f} mg/dL"))
    hdl = getattr(raw_inputs, "hdl_cholesterol", 0)
    hdl_threshold = 40 if sex == "male" else 50
    criteria.append((f"Low HDL (< {hdl_threshold})", hdl < hdl_threshold, f"{hdl:.0f} mg/dL"))
    met_count = sum(1 for _, met, _ in criteria if met)
    return {"criteria": criteria, "count": met_count, "positive": met_count >= 3}


def _framingham_risk(raw_inputs) -> float:
    age = getattr(raw_inputs, "age", 50)
    sex = getattr(raw_inputs, "sex", "male").lower()
    tc  = getattr(raw_inputs, "total_cholesterol", 200)
    sbp = getattr(raw_inputs, "systolic_bp", 120)
    fg  = getattr(raw_inputs, "fasting_glucose", 90)
    score = 0.0
    score += (age - 40) * 0.012
    if sex == "male": score += 0.05
    score += (tc - 200) * 0.0005
    score += (sbp - 120) * 0.003
    if fg > 126:   score += 0.08
    elif fg > 100: score += 0.04
    return max(0.01, min(0.99, score))


def _radar_chart(adjusted_scores) -> go.Figure:
    organs = ["Heart", "Kidney", "Liver"]
    health_vals = [
        (1 - adjusted_scores.heart)  * 100,
        (1 - adjusted_scores.kidney) * 100,
        (1 - adjusted_scores.liver)  * 100,
    ]
    health_vals_closed = health_vals + [health_vals[0]]
    organs_closed      = organs + [organs[0]]

    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=health_vals_closed, theta=organs_closed,
        fill="toself",
        fillcolor="rgba(37,99,235,0.1)",
        line=dict(color="#2563eb", width=2.5),
        name="Your Health",
        hovertemplate="%{theta}: %{r:.1f}%<extra></extra>",
    ))
    fig.add_trace(go.Scatterpolar(
        r=[70, 70, 70, 70], theta=organs_closed,
        fill="toself",
        fillcolor="rgba(148,163,184,0.06)",
        line=dict(color="#94a3b8", width=1.5, dash="dash"),
        name="Population Avg",
        hovertemplate="%{theta}: %{r:.1f}%<extra></extra>",
    ))
    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True, range=[0, 100],
                tickfont=dict(color="#64748b", size=10, family="Inter, sans-serif"),
                gridcolor="rgba(226,232,240,0.8)",
                linecolor="rgba(226,232,240,0.8)",
            ),
            angularaxis=dict(
                tickfont=dict(color="#0f172a", size=12, family="Inter, sans-serif"),
                gridcolor="rgba(226,232,240,0.8)",
                linecolor="rgba(226,232,240,0.8)",
            ),
            bgcolor="rgba(248,250,252,0.8)",
        ),
        paper_bgcolor="rgba(0,0,0,0)",
        height=350,
        margin=dict(l=40, r=40, t=40, b=40),
        legend=dict(
            font=dict(color="#374151", size=11, family="Inter, sans-serif"),
            bgcolor="rgba(255,255,255,0.9)",
            bordercolor="#e2e8f0",
            borderwidth=1,
        ),
        showlegend=True,
    )
    return fig


def render_health_analytics(adjusted_scores, raw_inputs):
    st.markdown("""
    <div class="section-header">
        <div class="section-icon" style="background:rgba(37,99,235,0.1);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="#2563eb" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
        </div>
        <div>
            <h2>Health Score Analytics</h2>
            <p class="section-sub">Comprehensive health scoring, biological age estimate, and population comparison</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    max_risk     = max(adjusted_scores.heart, adjusted_scores.kidney, adjusted_scores.liver)
    health_score = int((1 - max_risk) * 100)
    hs_color     = "#10b981" if health_score >= 70 else "#f59e0b" if health_score >= 40 else "#ef4444"
    hs_label     = "Good" if health_score >= 70 else "Fair" if health_score >= 40 else "Poor"
    hs_badge_bg  = "#dcfce7" if health_score >= 70 else "#fef9c3" if health_score >= 40 else "#fee2e2"
    hs_badge_c   = "#15803d" if health_score >= 70 else "#a16207" if health_score >= 40 else "#dc2626"

    age        = getattr(raw_inputs, "age", 50)
    health_age = age + (max_risk - 0.2) * 15
    age_diff   = health_age - age

    percentile = 70 if max_risk < 0.4 else 50 if max_risk < 0.7 else 30
    percentile_text = f"You are healthier than {percentile}% of people your age"

    met       = _metabolic_syndrome_check(raw_inputs)
    fram_risk = _framingham_risk(raw_inputs)

    # Row 1: Score cards
    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown(f"""
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:3px solid {hs_color};
                    border-radius:8px;padding:24px;text-align:center;
                    box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="color:#94a3b8;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                        text-transform:uppercase;margin-bottom:10px;font-family:'Inter',sans-serif;">
                Overall Health Score
            </div>
            <div style="font-size:3.5rem;font-weight:900;color:{hs_color};line-height:1;
                        margin:8px 0;font-family:'Inter',sans-serif;">{health_score}</div>
            <div style="color:#94a3b8;font-size:0.8rem;margin-bottom:10px;
                        font-family:'Inter',sans-serif;">out of 100</div>
            <span style="background:{hs_badge_bg};color:{hs_badge_c};border-radius:20px;
                         padding:3px 12px;font-size:0.68rem;font-weight:700;
                         text-transform:uppercase;font-family:'Inter',sans-serif;">{hs_label}</span>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        age_color = "#ef4444" if age_diff > 5 else "#f59e0b" if age_diff > 2 else "#10b981"
        age_arrow = "↑" if age_diff > 2 else "↓" if age_diff < -2 else "→"
        age_note  = f"{abs(age_diff):.0f} yrs {'older' if age_diff > 0 else 'younger'} than actual" if abs(age_diff) > 1 else "Aligned with actual age"
        st.markdown(f"""
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:3px solid {age_color};
                    border-radius:8px;padding:24px;text-align:center;
                    box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="color:#94a3b8;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                        text-transform:uppercase;margin-bottom:10px;font-family:'Inter',sans-serif;">
                Health Age Estimate
            </div>
            <div style="font-size:3.5rem;font-weight:900;color:{age_color};line-height:1;
                        margin:8px 0;font-family:'Inter',sans-serif;">{health_age:.0f}</div>
            <div style="color:#94a3b8;font-size:0.8rem;margin-bottom:6px;
                        font-family:'Inter',sans-serif;">years (biological)</div>
            <div style="color:{age_color};font-size:0.78rem;font-family:'Inter',sans-serif;">
                {age_arrow} {age_note}
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        perc_color = "#10b981" if percentile >= 60 else "#f59e0b" if percentile >= 40 else "#ef4444"
        st.markdown(f"""
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:3px solid {perc_color};
                    border-radius:8px;padding:24px;text-align:center;
                    box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="color:#94a3b8;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                        text-transform:uppercase;margin-bottom:10px;font-family:'Inter',sans-serif;">
                Population Percentile
            </div>
            <div style="font-size:3.5rem;font-weight:900;color:{perc_color};line-height:1;
                        margin:8px 0;font-family:'Inter',sans-serif;">Top {100-percentile}%</div>
            <div style="color:#94a3b8;font-size:0.8rem;margin-bottom:6px;
                        font-family:'Inter',sans-serif;">of your age group</div>
            <div style="color:{perc_color};font-size:0.78rem;font-family:'Inter',sans-serif;">
                {percentile_text}
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown('<div style="height:18px;"></div>', unsafe_allow_html=True)

    # Row 2: Radar + Trend indicators
    col_radar, col_trends = st.columns([1.2, 1])

    with col_radar:
        st.markdown(
            '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;'
            'padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">'
            '<div style="font-size:0.9rem;font-weight:700;color:#0f172a;margin-bottom:3px;">Organ Health Radar</div>'
            '<div style="font-size:0.73rem;color:#64748b;margin-bottom:12px;">Health score per organ vs. population average (higher = healthier)</div>'
            '</div>',
            unsafe_allow_html=True,
        )
        st.plotly_chart(_radar_chart(adjusted_scores), use_container_width=True, key="health_radar")

    with col_trends:
        st.markdown("""
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;
                    padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div style="font-size:0.9rem;font-weight:700;color:#0f172a;margin-bottom:3px;">Risk Trend Indicators</div>
            <div style="font-size:0.73rem;color:#64748b;margin-bottom:12px;">Estimated trend based on current biomarker profile</div>
        </div>
        """, unsafe_allow_html=True)

        def _trend(score: float):
            if score < 0.3:  return "↓", "Decreasing", "#059669", "#f0fdf4"
            elif score < 0.5: return "→", "Stable",    "#d97706", "#fffbeb"
            else:             return "↑", "Increasing", "#dc2626", "#fef2f2"

        for organ, score in [
            ("Heart",  adjusted_scores.heart),
            ("Kidney", adjusted_scores.kidney),
            ("Liver",  adjusted_scores.liver),
        ]:
            arrow, trend_label, trend_color, trend_bg = _trend(score)
            risk_c = _risk_color(score)
            st.markdown(f"""
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                        padding:14px 16px;margin-bottom:10px;
                        display:flex;align-items:center;justify-content:space-between;">
                <div>
                    <div style="color:#0f172a;font-size:0.88rem;font-weight:600;
                                font-family:'Inter',sans-serif;">{organ}</div>
                    <div style="color:{risk_c};font-size:0.78rem;font-family:'Inter',sans-serif;">
                        {score*100:.1f}% — {_risk_label(score)}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="color:{trend_color};font-size:1.8rem;font-weight:700;
                                line-height:1;font-family:'Inter',sans-serif;">{arrow}</div>
                    <div style="color:{trend_color};font-size:0.72rem;
                                font-family:'Inter',sans-serif;">{trend_label}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)

        # Framingham CVD risk
        fram_pct   = fram_risk * 100
        fram_color = "#ef4444" if fram_pct >= 20 else "#f59e0b" if fram_pct >= 10 else "#10b981"
        fram_bg    = "#fee2e2" if fram_pct >= 20 else "#fffbeb" if fram_pct >= 10 else "#f0fdf4"
        fram_label = "High" if fram_pct >= 20 else "Intermediate" if fram_pct >= 10 else "Low"
        fram_badge_bg = "#fee2e2" if fram_pct >= 20 else "#fef9c3" if fram_pct >= 10 else "#dcfce7"
        fram_badge_c  = "#dc2626" if fram_pct >= 20 else "#a16207" if fram_pct >= 10 else "#15803d"
        st.markdown(f"""
        <div style="background:{fram_bg};border:1px solid #e2e8f0;border-radius:8px;
                    padding:14px 16px;margin-top:4px;">
            <div style="color:#64748b;font-size:0.7rem;text-transform:uppercase;
                        letter-spacing:0.08em;margin-bottom:6px;font-family:'Inter',sans-serif;">
                10-Year CVD Risk (Framingham)
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <div style="color:{fram_color};font-size:1.6rem;font-weight:800;
                            font-family:'Inter',sans-serif;">{fram_pct:.1f}%</div>
                <span style="background:{fram_badge_bg};color:{fram_badge_c};border-radius:20px;
                             padding:3px 10px;font-size:0.68rem;font-weight:700;
                             font-family:'Inter',sans-serif;">{fram_label}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown('<div style="height:18px;"></div>', unsafe_allow_html=True)

    # Row 3: Metabolic Syndrome Checker
    st.markdown(
        '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;'
        'padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">'
        '<div style="font-size:0.9rem;font-weight:700;color:#0f172a;margin-bottom:3px;">Metabolic Syndrome Checker</div>'
        '<div style="font-size:0.73rem;color:#64748b;margin-bottom:12px;">Meets 3 or more of 5 criteria = Metabolic Syndrome positive</div>'
        '</div>',
        unsafe_allow_html=True,
    )

    met_color  = "#dc2626" if met["positive"] else "#059669"
    met_status = "POSITIVE" if met["positive"] else "NEGATIVE"
    met_bg     = "#fef2f2" if met["positive"] else "#f0fdf4"
    met_border = "#fecaca" if met["positive"] else "#bbf7d0"

    st.markdown(f"""
    <div style="background:{met_bg};border:1px solid {met_border};border-radius:8px;
                padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
        <div style="font-size:2rem;">{'⚠️' if met['positive'] else '✅'}</div>
        <div>
            <div style="color:{met_color};font-size:1rem;font-weight:700;
                        font-family:'Inter',sans-serif;">
                Metabolic Syndrome: {met_status}
            </div>
            <div style="color:#64748b;font-size:0.8rem;font-family:'Inter',sans-serif;">
                {met['count']} of 5 criteria met (threshold: 3 or more)
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    cols = st.columns(5)
    for col, (name, is_met, detail) in zip(cols, met["criteria"]):
        with col:
            c      = "#dc2626" if is_met else "#059669"
            icon   = "✗" if is_met else "✓"
            bg     = "#fef2f2" if is_met else "#f0fdf4"
            border = "#fecaca" if is_met else "#bbf7d0"
            short  = name.split("(")[0].strip()
            st.markdown(f"""
            <div style="background:{bg};border:1px solid {border};border-radius:8px;
                        padding:14px;text-align:center;">
                <div style="color:{c};font-size:1.5rem;font-weight:700;">{icon}</div>
                <div style="color:#0f172a;font-size:0.72rem;font-weight:600;margin:4px 0;
                            font-family:'Inter',sans-serif;">{short}</div>
                <div style="color:#64748b;font-size:0.68rem;font-family:'Inter',sans-serif;">
                    {detail}
                </div>
            </div>
            """, unsafe_allow_html=True)

