"""Gauge chart — Premium Dark Design System."""
import plotly.graph_objects as go
from src.color_mapping import color_for_score, risk_label

_BG   = "rgba(0,0,0,0)"
_PLOT = "rgba(13,21,38,0.8)"

ORGAN_ACCENT = {
    "heart":  "#ef4444",
    "kidney": "#3b82f6",
    "liver":  "#10b981",
}
ORGAN_LABEL = {
    "heart":  "Cardiovascular",
    "kidney": "Renal",
    "liver":  "Hepatic",
}


def gauge_chart(score: float, organ: str) -> go.Figure:
    color  = color_for_score(score)
    label  = risk_label(score)
    accent = ORGAN_ACCENT.get(organ, color)
    pct    = round(score * 100, 1)
    full   = ORGAN_LABEL.get(organ, organ.capitalize())

    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=pct,
        title={
            "text": (
                f"<b style='font-family:Inter,sans-serif;color:#f1f5f9;'>{full}</b>"
                f"<br><span style='font-size:0.72em;color:{color};font-weight:600;'>"
                f"{label} Risk</span>"
            ),
            "font": {"color": "#f1f5f9", "size": 13, "family": "Inter, sans-serif"},
        },
        number={
            "suffix": "%",
            "font": {"size": 34, "color": color, "family": "Inter, sans-serif"},
        },
        gauge={
            "axis": {
                "range": [0, 100],
                "tickwidth": 1,
                "tickcolor": "rgba(255,255,255,0.15)",
                "tickfont": {"color": "#334155", "size": 9, "family": "Inter, sans-serif"},
                "nticks": 6,
            },
            "bar": {
                "color": color,
                "thickness": 0.28,
            },
            "bgcolor": "rgba(15,22,41,0.9)",
            "borderwidth": 1,
            "bordercolor": "rgba(255,255,255,0.08)",
            "steps": [
                {"range": [0,  40], "color": "rgba(16,185,129,0.06)"},
                {"range": [40, 70], "color": "rgba(245,158,11,0.06)"},
                {"range": [70,100], "color": "rgba(239,68,68,0.06)"},
            ],
            "threshold": {
                "line": {"color": color, "width": 3},
                "thickness": 0.85,
                "value": pct,
            },
        },
    ))

    fig.update_layout(
        height=230,
        margin=dict(l=20, r=20, t=60, b=10),
        paper_bgcolor=_BG,
        plot_bgcolor=_PLOT,
        font={"color": "#f1f5f9", "family": "Inter, sans-serif"},
    )
    return fig
