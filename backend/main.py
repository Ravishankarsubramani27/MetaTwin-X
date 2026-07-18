"""
MetaTwin-X FastAPI Backend — Next-Generation Architecture v3.0

Novel components:
  1. Adaptive Cross-Organ Intelligence Engine
  2. Hybrid ODE + ML Simulation
  3. Living Digital Twin State
  4. Real-time WebSocket Streaming
  5. RL Intervention Agent
  6. Causal Inference Engine
  7. Uncertainty-Aware AI
  8. LLM Clinical Reasoning
  9. Patient Database
"""
import sys
import asyncio
import json
import random
import logging
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.routes import predict, simulate, recommend
from backend.api.advanced import router as advanced_router
from backend.routes.report import router as report_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger("metatwin-x.api")

app = FastAPI(
    title="MetaTwin-X API",
    version="3.0.0",
    description=(
        "Next-Generation Multi-Organ Digital Health Twin Platform.\n\n"
        "Novel components:\n"
        "- Adaptive Cross-Organ Intelligence Engine (learning interaction weights)\n"
        "- Hybrid ODE+ML Simulation with stochastic uncertainty bands\n"
        "- Living Personalized Digital Twin (persistent patient state)\n"
        "- Real-time WebSocket wearable streaming\n"
        "- RL Intervention Agent\n"
        "- Causal Inference Engine\n"
        "- LLM-based Clinical Reasoning\n"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Core routes (existing) ─────────────────────────────────────────────
app.include_router(predict.router,   prefix="/predict",   tags=["Prediction"])
app.include_router(simulate.router,  prefix="/simulate",  tags=["Simulation"])
app.include_router(recommend.router, prefix="/recommend", tags=["Recommendations"])
app.include_router(report_router,    prefix="/report",    tags=["Report"])

# ── Advanced routes (new) ──────────────────────────────────────────────
app.include_router(advanced_router, prefix="", tags=["Advanced"])


@app.get("/", tags=["Health"])
def root():
    return {
        "status":  "ok",
        "service": "MetaTwin-X API",
        "version": "3.0.0",
        "core_endpoints": ["/predict", "/simulate", "/recommend"],
        "advanced_endpoints": [
            "/simulate/ode",          # Hybrid ODE+ML simulation
            "/xai/counterfactuals",   # Counterfactual explanations
            "/xai/sensitivity",       # Feature sensitivity
            "/xai/causal",            # Causal inference
            "/xai/query",             # Natural language queries
            "/rl/interventions",      # RL intervention agent
            "/twin/{patient_id}",     # Living digital twin
            "/patients/{patient_id}", # Patient management
            "/stream/{patient_id}",   # WebSocket streaming
        ],
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "version": "3.0.0"}


def calculate_health_score(heart: float, kidney: float, liver: float) -> float:
    """
    Weighted health score with cross-organ interaction penalty.
    Weights: Heart=0.4, Kidney=0.3, Liver=0.3
    Interaction: 0.1 × (heart × kidney) / 100  — cardiorenal syndrome penalty
    """
    weighted    = 0.4 * heart + 0.3 * kidney + 0.3 * liver
    interaction = 0.1 * (heart * kidney) / 100
    score       = 100 - (weighted + interaction)
    return round(max(0.0, min(100.0, score)), 2)


@app.get("/health-score", tags=["Health"])
def health_score(heart: float = 0, kidney: float = 0, liver: float = 0):
    """Compute global health score from 0–100 risk percentages."""
    score  = calculate_health_score(heart, kidney, liver)
    status = ("Excellent" if score >= 80 else "Good" if score >= 65
              else "Fair" if score >= 50 else "Moderate Risk" if score >= 35
              else "High Risk")
    return {"health_score": score, "status": status,
            "inputs": {"heart": heart, "kidney": kidney, "liver": liver}}


# ── /ws/vitals — broadcast simulated IoT wearable stream ──────────────
@app.websocket("/ws/vitals")
async def ws_vitals(ws: WebSocket):
    """
    Real-time vitals stream for the RightPanel ECG + live metrics.
    Broadcasts heart_rate, spo2, systolic, diastolic, hrv, stress, steps
    every 2.2 s — matching the frontend's simulation interval.
    In production, swap the random generator with a real device API.
    """
    await ws.accept()
    base = {
        "heart_rate": random.uniform(66, 78),
        "spo2":       random.uniform(96.5, 99.0),
        "systolic":   random.uniform(112, 130),
        "diastolic":  random.uniform(70, 84),
        "hrv":        random.uniform(35, 55),
        "stress":     random.uniform(20, 42),
        "steps":      random.randint(5000, 9000),
    }
    try:
        while True:
            def rand(v, d): return round(v + (random.random() - 0.5) * d * 2, 1)
            payload = {
                "heart_rate": rand(base["heart_rate"], 3),
                "spo2":       round(min(100, rand(base["spo2"], 0.3)), 1),
                "systolic":   rand(base["systolic"],  3),
                "diastolic":  rand(base["diastolic"],  2),
                "hrv":        rand(base["hrv"],        2),
                "stress":     round(max(0, min(100, rand(base["stress"], 4))), 1),
                "steps":      int(base["steps"] + random.randint(-50, 150)),
            }
            # Slowly drift base (realistic wearable behaviour)
            for k in ("heart_rate", "spo2", "systolic", "diastolic", "hrv", "stress"):
                base[k] = base[k] * 0.98 + payload[k] * 0.02
            await ws.send_text(json.dumps(payload))
            await asyncio.sleep(2.2)
    except (WebSocketDisconnect, Exception):
        pass
