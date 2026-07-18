"""Color mapping utility for risk scores."""


def color_for_score(score: float) -> str:
    """Return hex color based on risk score thresholds."""
    if score < 0.4:
        return "#4CAF50"   # green
    elif score < 0.7:
        return "#FF9800"   # amber
    else:
        return "#F44336"   # red


def risk_label(score: float) -> str:
    if score < 0.4:
        return "Low"
    elif score < 0.7:
        return "Moderate"
    else:
        return "High"
