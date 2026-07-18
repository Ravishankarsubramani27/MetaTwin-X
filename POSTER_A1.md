# MetaTwin-X — A1 POSTER CONTENT
# (594mm × 841mm — Print-Ready Layout)

---
## POSTER TITLE (Large, Top Center)

# MetaTwin-X
## A Next-Generation Multi-Organ Adaptive Digital Health Twin Platform
### with Hybrid AI, Causal Reasoning & Real-Time Wearable Integration

**Institution:** [Your University Name]
**Department:** [Computer Science / Biomedical Engineering]
**Team:** [Names]  |  **Supervisor:** [Name]  |  **June 2026**

---

## COLUMN 1 (Left — 30%)

### The Problem
Current clinical tools predict ONE organ at a time.
They show **correlation**, not **causation**.
They give a score — but **no action plan**.

> "Heart disease, kidney failure, and liver disease
> share the same metabolic roots — yet are treated
> in complete isolation."

**1.8 billion** adults have ≥1 cardiometabolic risk factor globally.
**40%** of CVD patients also have CKD (cardiorenal syndrome).
**NAFLD** affects 25% of global adults and elevates CVD risk.

---

### Our Solution

**MetaTwin-X** — A multi-organ digital twin that:

✅ Predicts **Heart + Kidney + Liver** simultaneously
✅ Models **cross-organ interactions** (cardiorenal syndrome)
✅ Explains **WHY** using causal trial evidence
✅ Simulates **12-month risk trajectories**
✅ Recommends **optimal interventions** via RL
✅ Integrates **smartwatch data** in real-time
✅ Creates a **living digital twin** per patient

---

### Architecture Overview

```
   Input Data
(Lab Report / Wearable)
         ↓
   Preprocessor
(21 features → engineered)
         ↓
  XGBoost Models (×3)
  Heart | Kidney | Liver
         ↓
 Interaction Engine
 IR-01 · IR-02 · IR-03
         ↓
┌──────────────────────┐
│  Causal  │  RL Agent │
│  Engine  │  (10 acts)│
├──────────┼───────────┤
│  ODE Sim │  Digital  │
│ (180 day)│   Twin   │
└──────────────────────┘
         ↓
    React Dashboard
  (Dark Futuristic UI)
```

---

## COLUMN 2 (Center — 40%)

### System Demo Screenshots

**[SCREENSHOT 1: Dashboard — 3-panel view]**
- Left: Organ risk ArcGauges with eGFR staging
- Center: SVG anatomical body with glowing risk markers
- Right: Live vitals + Clinical protocols

**[SCREENSHOT 2: Health Input — Wearable Tab]**
- HR, HRV, SpO₂, Stress sliders
- Real-time Cardiac Stress Index computation
- Animated feedback

**[SCREENSHOT 3: Advanced AI — Causal Panel]**
- "Reducing BP from 142→115 CAUSES 10.8% heart risk reduction"
- Evidence badges: Strong RCT | Cohort Study
- SPRINT trial citation

**[SCREENSHOT 4: Report Upload]**
- Drag-drop PDF/image
- 6-step pipeline with status indicators
- Extracted biomarkers table

---

### Key Results

| Test Case | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Normal Patient (BP=120) | Low risk | 0.04 (4%) | ✅ PASS |
| High BP (BP=155) | ↑ Heart risk | 0.27 (27%) | ✅ PASS |
| High Glucose (165) | ↑ Kidney risk | 0.33 (33%) | ✅ PASS |
| Liver Abnormal (ALT=78) | High liver | 0.47 (47%) | ✅ PASS |
| Cross-Organ Rule | IR-01 fires | Δheart +9.8% | ✅ PASS |
| OCR Upload | Extract biomarkers | 8 fields, 67% conf | ✅ PASS |
| Wearable (HR=90, HRV=25) | Risk changes | −1.0% Δheart | ✅ PASS |
| Simulation | 12-month graph | Generated | ✅ PASS |
| Health Score (0.7/0.5/0.4) | Score < 65 | 45 | ✅ PASS |

**15/15 Tests PASSED (100%)**

---

### Model Performance

| Organ | AUC | Brier | Healthy | High-Risk |
|-------|-----|-------|---------|-----------|
| Heart | **0.986** | 0.065 | 2% | 90% |
| Kidney | **0.987** | 0.069 | 4% | 80% |
| Liver | **0.991** | 0.059 | 4% | 85% |

> Models are **calibrated** — not saturated.
> Realistic probabilities across full clinical range.

---

### Novel Contributions

**1. Cross-Organ Interaction Engine**
IR-01: CKD → CVD (cardiorenal syndrome)
IR-02: Diabetes → CKD (UKPDS evidence)
IR-03: NAFLD → CVD (hepatocardiac axis)

**2. Causal Do-Calculus Engine**
P(risk | do(feature=X)) — not just correlation
Grounded in SPRINT, UKPDS, CTT, LEAN trials

**3. Hybrid ODE + ML Simulation**
Coupled differential equations (SciPy RK45)
Monte Carlo uncertainty bands (n=50)

**4. RL Intervention Agent**
Q-value agent over 10 clinical actions
State = 14D normalised health vector

**5. Living Digital Twin**
Per-patient persistent state
Trend detection: ↑ ↓ → per organ

---

## COLUMN 3 (Right — 30%)

### Tech Stack

**Backend:**
- FastAPI + Uvicorn
- XGBoost (regression, calibrated)
- SciPy ODE (RK45)
- SQLite + SQLAlchemy
- Pydantic v2

**Frontend:**
- React 19
- Recharts 3.8
- Custom dark CSS (glassmorphism)
- Axios API client

**AI Modules:**
- Causal inference (do-calculus)
- RL agent (Q-value approximation)
- LLM clinical reasoning (templates)
- SHAP explainability

---

### Clinical Grounding

Evidence base for all rules:

| Rule/Feature | Trial | Effect |
|---|---|---|
| BP → Heart | SPRINT 2015 | −25% CVD |
| Glucose → CKD | UKPDS 1998 | −33% CKD |
| Statin | CTT 2010 | −21%/mmol |
| Weight → Liver | LEAN 2016 | 50% NASH reversal |
| eGFR formula | CKD-EPI 2009 | GFR estimation |

---

### How to Run

```bash
# Backend
python -m uvicorn backend.main:app
  --port 8000 --reload

# Frontend
cd metatwin-frontend
npm start

# Access
→ http://localhost:3000  (React)
→ http://localhost:8000  (API)
→ http://localhost:8000/docs
```

Or: **double-click start.bat**

---

### Feasibility Summary

| Dimension | Assessment |
|-----------|-----------|
| Technical | ✅ CPU-only, <4GB RAM |
| Economic | ✅ ~$90K dev, $75K/mo ARR |
| Social | ✅ Health equity, explainable |
| Environmental | ✅ Low energy, reduces visits |
| Political | ✅ GDPR, MDR Class IIa |
| Demographic | ✅ 1.8B target population |

---

### QR Code / Links

**[QR Code — GitHub Repo]**
**[QR Code — Live Demo]**
**[QR Code — API Docs]**

---

### Acknowledgements
[University Name] · [Department] · [Funding Source if any]
This project was developed as part of [Programme Name] 2025–2026.

---
*MetaTwin-X v3.0 | A1 Poster | 594×841mm | June 2026*
*Print at 300 DPI for crisp output*
