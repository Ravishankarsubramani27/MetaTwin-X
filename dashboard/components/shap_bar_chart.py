"""SHAP bar chart — Premium Dark Design System."""
import plotly.graph_objects as go
from src.models.data_types import ExplanationResult

_BG   = "rgba(0,0,0,0)"
_PLOT = "rgba(13,21,38,0.8)"


def shap_bar_chart(explanation: ExplanationResult) -> go.Figure:
    """Render a dark-theme SHAP feature importance bar chart."""
    features  = [fc.feature_name.replace("_", " ").title() for fc in explanation.top_features]
    shap_vals = [fc.shap_value for fc in explanation.top_features]

    colors = []
    for v in shap_vals:
        if v > 0:
            intensity = min(1.0, abs(v) * 8)
            r = int(239 * intensity + 100 * (1 - intensity))
            g = int(68  * intensity + 50  * (1 - intensity))
            b = int(68  * intensity + 50  * (1 - intensity))
            colors.append(f"rgba({r},{g},{b},0.9)")
        else:
            intensity = min(1.0, abs(v) * 8)
            r = int(59  * intensity + 30  * (1 - intensity))
            g = int(130 * intensity + 80  * (1 - intensity))
            b = int(246 * intensity + 150 * (1 - intensity))
            colors.append(f"rgba({r},{g},{b},0.9)")

    max_abs    = max(abs(v) for v in shap_vals) if shap_vals else 1
    pct_labels = [f"{v:+.3f} ({abs(v)/max_abs*100:.0f}%)" for v in shap_vals]
    organ_name = explanation.organ.value.capitalize()

    fig = go.Figure(go.Bar(
        x=shap_vals,
        y=features,
        orientation="h",
        marker=dict(
            color=colors,
            line=dict(color="rgba(0,0,0,0.2)", width=0.5),
        ),
        text=pct_labels,
        textposition="outside",
        textfont=dict(color="#64748b", size=10, family="Inter, sans-serif"),
        hovertemplate=(
            "<b>%{y}</b><br>"
            "SHAP value: %{x:+.4f}<br>"
            "<extra></extra>"
        ),
    ))

    fig.add_vline(x=0, line_color="rgba(255,255,255,0.12)", line_width=1.5)

    fig.update_layout(
        title=dict(
            text=f"{organ_name} — Feature Contributions",
            font=dict(color="#f1f5f9", size=13, family="Inter, sans-serif"),
            x=0.02,
        ),
        xaxis=dict(
            title="SHAP Value (impact on risk)",
            title_font=dict(color="#64748b", size=11, family="Inter, sans-serif"),
            tickfont=dict(color="#64748b", size=10, family="Inter, sans-serif"),
            gridcolor="rgba(255,255,255,0.05)",
            linecolor="rgba(255,255,255,0.08)",
            zeroline=False,
        ),
        yaxis=dict(
            autorange="reversed",
            tickfont=dict(color="#f1f5f9", size=11, family="Inter, sans-serif"),
            gridcolor="rgba(255,255,255,0.03)",
            linecolor="rgba(255,255,255,0.08)",
        ),
        height=300,
        margin=dict(l=10, r=90, t=45, b=40),
        paper_bgcolor=_BG,
        plot_bgcolor=_PLOT,
        font=dict(color="#f1f5f9", family="Inter, sans-serif"),
        hoverlabel=dict(
            bgcolor="#0f1629",
            bordercolor="rgba(255,255,255,0.1)",
            font=dict(color="#f1f5f9", family="Inter, sans-serif"),
        ),
    )
    return fig
