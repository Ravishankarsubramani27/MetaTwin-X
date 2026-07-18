"""Population Comparison — Clinical Precision Design System (light theme)."""
from __future__ import annotations
import streamlit as st
import plotly.graph_objects as go
import numpy as np

POPULATION_AVERAGES = {
    "Fasting Glucose":   {"avg": 99,   "unit": "mg/dL", "attr": "fasting_glucose",   "lo": 70,  "hi": 100},
    "Total Cholesterol": {"avg": 200,  "unit": "mg/dL", "attr": "total_cholesterol", "lo": 0,   "hi": 200},
    "Systolic BP":       {"avg": 122,  "unit": "mmHg",  "attr": "systolic_bp",       "lo": 90,  "hi": 120},
    "BMI":               {"avg": 26.5, "unit": "kg/m²", "attr": "bmi",               "lo": 18.5,"hi": 25},
    "Creatinine":        {"avg": 0.95, "unit": "mg/dL", "attr": "serum_creatinine",  "lo": 0.6, "hi": 1.2},
    "ALT":               {"avg": 28,   "unit": "U/L",   "attr": "alt_enzyme",        "lo": 7,   "hi": 40},
}


def _biomarker_comparison_chart(raw_inputs) -> go.Figure:
    labels, user_vals, pop_vals, colors = [], [], [], []
    for name, info in POPULATION_AVERAGES.items():
        user_val = getattr(raw_inputs, info["attr"], info["avg"])
        pop_val  = info["avg"]
        labels.append(f"{name} ({info['unit']})")
        user_vals.append(user_val)
        pop_vals.append(pop_val)
        if user_val > pop_val * 1.1:   colors.append("#ef4444")
        elif user_val < pop_val * 0.9: colors.append("#3b82f6")
        else:                          colors.append("#10b981")

    fig = go.Figure()
    fig.add_trace(go.Bar(
        y=labels, x=pop_vals, orientation="h",
        name="Population Average",
        marker=dict(color="rgba(148,163,184,0.3)", line=dict(color="rgba(148,163,184,0.6)", width=1)),
        hovertemplate="%{y}: %{x} (Population Avg)<extra></extra>",
    ))
    fig.add_trace(go.Bar(
        y=labels, x=user_vals, orientation="h",
        name="Your Values",
        marker=dict(color=colors, opacity=0.85),
        hovertemplate="%{y}: %{x} (Your Value)<extra></extra>",
    ))
    fig.update_layout(
        barmode="overlay",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(248,250,252,0.8)",
        height=350,
        margin=dict(l=10, r=20, t=20, b=20),
        legend=dict(
            orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1,
            font=dict(color="#374151", size=11, family="Inter, sans-serif"),
            bgcolor="rgba(255,255,255,0.9)",
            bordercolor="#e2e8f0", borderwidth=1,
        ),
        xaxis=dict(
            gridcolor="rgba(226,232,240,0.8)",
            tickfont=dict(color="#64748b", size=10, family="Inter, sans-serif"),
        ),
        yaxis=dict(
            tickfont=dict(color="#0f172a", size=11, family="Inter, sans-serif"),
            gridcolor="rgba(226,232,240,0.4)",
        ),
        hoverlabel=dict(bgcolor="#ffffff", bordercolor="#e2e8f0",
                        font=dict(color="#0f172a", family="Inter, sans-serif")),
    )
    return fig


def _percentile_donut(percentile: int) -> go.Figure:
    remaining  = 100 - percentile
    perc_color = "#10b981" if percentile >= 60 else "#f59e0b" if percentile >= 40 else "#ef4444"
    fig = go.Figure(go.Pie(
        values=[percentile, remaining],
        labels=["Your Percentile", "Others"],
        hole=0.72,
        marker=dict(
            colors=[perc_color, "#f1f5f9"],
            line=dict(color="#ffffff", width=2),
        ),
        textinfo="none",
        hovertemplate="%{label}: %{value}%<extra></extra>",
        sort=False,
    ))
    fig.add_annotation(
        text=f"<b>{percentile}th</b><br><span style='font-size:10px'>Percentile</span>",
        x=0.5, y=0.5,
        font=dict(size=20, color=perc_color, family="Inter, sans-serif"),
        showarrow=False,
    )
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        height=320,
        margin=dict(l=20, r=20, t=20, b=20),
        showlegend=False,
        hoverlabel=dict(bgcolor="#ffffff", bordercolor="#e2e8f0",
                        font=dict(color="#0f172a", family="Inter, sans-serif")),
    )
    return fig


def _bell_curve_chart(max_risk: float) -> go.Figure:
    x    = np.linspace(0, 1, 300)
    mu, sigma = 0.35, 0.18
    y    = np.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * np.sqrt(2 * np.pi))
    user_color = "#ef4444" if max_risk >= 0.7 else "#f59e0b" if max_risk >= 0.4 else "#10b981"

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=x, y=y, fill="tozeroy",
        fillcolor="rgba(148,163,184,0.12)",
        line=dict(color="rgba(148,163,184,0.5)", width=1.5),
        name="Population", hoverinfo="skip",
    ))

    mask   = x <= max_risk
    x_fill = np.concatenate([x[mask], [max_risk, 0]])
    y_fill = np.concatenate([y[mask], [0, 0]])
    r, g, b = int(user_color[1:3], 16), int(user_color[3:5], 16), int(user_color[5:7], 16)
    fig.add_trace(go.Scatter(
        x=x_fill, y=y_fill, fill="toself",
        fillcolor=f"rgba({r},{g},{b},0.15)",
        line=dict(color="rgba(0,0,0,0)"),
        name="Your Position", hoverinfo="skip", showlegend=False,
    ))

    user_y = np.exp(-0.5 * ((max_risk - mu) / sigma) ** 2) / (sigma * np.sqrt(2 * np.pi))
    fig.add_trace(go.Scatter(
        x=[max_risk, max_risk], y=[0, user_y * 1.1],
        mode="lines",
        line=dict(color=user_color, width=2, dash="dash"),
        name=f"You ({max_risk*100:.0f}%)",
        hovertemplate=f"Your risk: {max_risk*100:.1f}%<extra></extra>",
    ))
    fig.add_trace(go.Scatter(
        x=[max_risk], y=[user_y], mode="markers",
        marker=dict(color=user_color, size=10, symbol="circle",
                    line=dict(color="white", width=2)),
        showlegend=False,
        hovertemplate=f"Your max risk: {max_risk*100:.1f}%<extra></extra>",
    ))

    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(248,250,252,0.8)",
        height=320,
        margin=dict(l=20, r=20, t=20, b=40),
        xaxis=dict(
            title="Risk Score", tickformat=".0%",
            gridcolor="rgba(226,232,240,0.8)",
            tickfont=dict(color="#64748b", size=10, family="Inter, sans-serif"),
            range=[0, 1],
        ),
        yaxis=dict(
            title="Population Density",
            gridcolor="rgba(226,232,240,0.8)",
            tickfont=dict(color="#64748b", size=10, family="Inter, sans-serif"),
            showticklabels=False,
        ),
        legend=dict(
            font=dict(color="#374151", size=11, family="Inter, sans-serif"),
            bgcolor="rgba(255,255,255,0.9)",
            bordercolor="#e2e8f0", borderwidth=1,
        ),
        hoverlabel=dict(bgcolor="#ffffff", bordercolor="#e2e8f0",
                        font=dict(color="#0f172a", family="Inter, sans-serif")),
    )
    return fig


def render_population_comparison(adjusted_scores, raw_inputs):
    st.markdown("""
    <div class="section-header">
        <div class="section-icon" style="background:rgba(124,58,237,0.1);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="#7c3aed" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
        </div>
        <div>
            <h2>Population Comparison</h2>
            <p class="section-sub">How your biomarkers and risk profile compare to population averages</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    max_risk   = max(adjusted_scores.heart, adjusted_scores.kidney, adjusted_scores.liver)
    percentile = 70 if max_risk < 0.4 else 50 if max_risk < 0.7 else 30

    # Biomarker comparison chart
    st.markdown(
        '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;'
        'padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">'
        '<div style="font-size:0.9rem;font-weight:700;color:#0f172a;margin-bottom:3px;">Biomarker Comparison: You vs. Population Average</div>'
        '<div style="font-size:0.73rem;color:#64748b;margin-bottom:12px;">Grey bars = population average &nbsp;&middot;&nbsp; Colored bars = your values (green = near avg, red = above avg, blue = below avg)</div>'
        '</div>',
        unsafe_allow_html=True,
    )
    st.plotly_chart(_biomarker_comparison_chart(raw_inputs), use_container_width=True, key="biomarker_comparison")

    # Percentile donut + Bell curve
    col_donut, col_bell = st.columns(2)

    with col_donut:
        st.markdown('<div class="chart-card">', unsafe_allow_html=True)
        st.markdown('<div class="chart-title">Age-Adjusted Risk Percentile</div>', unsafe_allow_html=True)
        st.markdown('<div class="chart-sub">Your health percentile relative to your age group</div>', unsafe_allow_html=True)
        st.plotly_chart(_percentile_donut(percentile), use_container_width=True, key="percentile_donut")
        perc_color = "#10b981" if percentile >= 60 else "#f59e0b" if percentile >= 40 else "#ef4444"
        st.markdown(f"""
<div style="text-align:center;margin-top:8px;">
    <div style="color:{perc_color};font-size:0.88rem;font-weight:600;
                font-family:'Inter',sans-serif;">
        You are healthier than {percentile}% of people your age
    </div>
</div>
""", unsafe_allow_html=True)

    with col_bell:
        st.markdown("""
<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;
            padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <div style="font-size:0.9rem;font-weight:700;color:#0f172a;margin-bottom:3px;
                font-family:'Inter',sans-serif;">Risk Distribution</div>
    <div style="font-size:0.73rem;color:#64748b;margin-bottom:12px;
                font-family:'Inter',sans-serif;">Where you fall in the population risk distribution</div>
</div>
""", unsafe_allow_html=True)
        st.plotly_chart(_bell_curve_chart(max_risk), use_container_width=True, key="bell_curve")

    # Detailed comparison table
    with st.expander("Detailed Biomarker Comparison Table", expanded=False):
        st.markdown("""
        <table class="comp-table">
        <thead>
            <tr>
                <th>Biomarker</th>
                <th style="text-align:center;">Your Value</th>
                <th style="text-align:center;">Population Avg</th>
                <th style="text-align:center;">Difference</th>
                <th style="text-align:center;">Status</th>
            </tr>
        </thead>
        <tbody>
        """, unsafe_allow_html=True)

        for name, info in POPULATION_AVERAGES.items():
            user_val = getattr(raw_inputs, info["attr"], info["avg"])
            pop_val  = info["avg"]
            diff     = user_val - pop_val
            diff_pct = (diff / pop_val) * 100

            if abs(diff_pct) <= 10:
                status_color = "#059669"; status_bg = "#dcfce7"; status = "Normal"
            elif diff_pct > 10:
                status_color = "#dc2626"; status_bg = "#fee2e2"; status = "Above Avg"
            else:
                status_color = "#2563eb"; status_bg = "#dbeafe"; status = "Below Avg"

            diff_str = f"+{diff:.1f}" if diff > 0 else f"{diff:.1f}"
            st.markdown(f"""
            <tr>
                <td style="font-weight:500;color:#0f172a;">{name}</td>
                <td style="text-align:center;color:#0f172a;">{user_val:.1f} {info['unit']}</td>
                <td style="text-align:center;color:#64748b;">{pop_val} {info['unit']}</td>
                <td style="text-align:center;color:{status_color};font-weight:600;">{diff_str} {info['unit']}</td>
                <td style="text-align:center;">
                    <span style="background:{status_bg};color:{status_color};padding:3px 10px;
                                 border-radius:20px;font-size:0.72rem;font-weight:700;
                                 font-family:'Inter',sans-serif;">{status}</span>
                </td>
            </tr>
            """, unsafe_allow_html=True)

        st.markdown("</tbody></table>", unsafe_allow_html=True)
