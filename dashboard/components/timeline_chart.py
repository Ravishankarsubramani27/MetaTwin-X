"""Timeline chart — mobile light theme matching screenshots."""
import plotly.graph_objects as go
from src.models.data_types import SimulationResult

_BG = "rgba(0,0,0,0)"
_COLORS = {"heart": "#ef4444", "kidney": "#3b82f6", "liver": "#f59e0b"}
_DASH_STYLES = ["solid", "dash", "dot", "dashdot"]


def timeline_chart(results: list[SimulationResult]) -> go.Figure:
    fig = go.Figure()

    for i, sim in enumerate(results):
        dash    = _DASH_STYLES[i % len(_DASH_STYLES)]
        label   = sim.scenario_label
        opacity = 1.0 if i == 0 else 0.65

        heart_y  = [v * 100 for v in sim.heart_trajectory]
        kidney_y = [v * 100 for v in sim.kidney_trajectory]
        liver_y  = [v * 100 for v in sim.liver_trajectory]

        # Filled areas for baseline
        if i == 0:
            for y_vals, fill_c in [
                (heart_y,  "rgba(239,68,68,0.07)"),
                (kidney_y, "rgba(59,130,246,0.07)"),
                (liver_y,  "rgba(245,158,11,0.07)"),
            ]:
                fig.add_trace(go.Scatter(
                    x=sim.months + sim.months[::-1],
                    y=y_vals + [0] * len(sim.months),
                    fill="toself", fillcolor=fill_c,
                    line=dict(width=0), showlegend=False, hoverinfo="skip",
                ))

        for organ, y_vals, color in [
            ("Cardio",  heart_y,  _COLORS["heart"]),
            ("Renal",   kidney_y, _COLORS["kidney"]),
            ("Hepatic", liver_y,  _COLORS["liver"]),
        ]:
            fig.add_trace(go.Scatter(
                x=sim.months, y=y_vals,
                name=f"{organ} ({label})" if i > 0 else organ,
                line=dict(color=color, dash=dash, width=2.5,
                          shape="spline", smoothing=0.8),
                mode="lines+markers",
                marker=dict(size=4, color=color, opacity=opacity,
                            line=dict(color="#ffffff", width=1.5)),
                opacity=opacity,
                hovertemplate=(
                    f"<b>{organ}</b><br>Month %{{x}}<br>Risk: %{{y:.1f}}%<extra></extra>"
                ),
            ))

    fig.update_layout(
        height=280,
        margin=dict(l=30, r=10, t=10, b=40),
        paper_bgcolor=_BG,
        plot_bgcolor="rgba(248,250,252,0.5)",
        xaxis=dict(
            title="Month", tickfont=dict(color="#94a3b8", size=10, family="Inter, sans-serif"),
            gridcolor="rgba(226,232,240,0.6)", linecolor="#e2e8f0", zeroline=False,
            title_font=dict(color="#94a3b8", size=10, family="Inter, sans-serif"),
        ),
        yaxis=dict(
            range=[0, 100],
            tickfont=dict(color="#94a3b8", size=10, family="Inter, sans-serif"),
            gridcolor="rgba(226,232,240,0.6)", linecolor="#e2e8f0", zeroline=False,
        ),
        legend=dict(
            orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1,
            font=dict(color="#374151", size=10, family="Inter, sans-serif"),
            bgcolor="rgba(255,255,255,0.9)", bordercolor="#e2e8f0", borderwidth=1,
        ),
        hovermode="x unified",
        hoverlabel=dict(bgcolor="#ffffff", bordercolor="#e2e8f0",
                        font=dict(color="#0f172a", family="Inter, sans-serif")),
    )
    return fig
