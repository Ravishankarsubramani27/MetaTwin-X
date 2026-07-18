# MetaTwin-X — Complete Project Documentation

> AI-Powered Multi-Organ Digital Health Twin Platform  
> Version 2.0.0 | June 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Backend Modules](#6-backend-modules)
7. [Frontend Modules](#7-frontend-modules)
8. [AI & ML Pipeline](#8-ai--ml-pipeline)
9. [Database Design](#9-database-design)
10. [Feature Inventory](#10-feature-inventory)
11. [API Reference](#11-api-reference)
12. [Security](#12-security)
13. [Deployment](#13-deployment)
14. [Testing](#14-testing)
15. [Known Limitations](#15-known-limitations)

---

## 1. Project Overview

MetaTwin-X is a production-quality web application that creates an AI-powered
digital twin of a patient's physiology. It predicts multi-organ disease risk,
simulates future health trajectories, and provides explainable AI insights — all
through a real-time interactive 3D interface.

The platform is designed for:
- Individual patients monitoring their own health longitudinally
- Clinical staff managing multiple patients from a doctor dashboard
- Researchers studying cross-organ interaction patterns
- Healthcare educators demonstrating disease progression visually


---

## 2. Problem Statement

Chronic diseases — cardiovascular disease, chronic kidney disease, and
non-alcoholic fatty liver disease — are the leading causes of global mortality.
They share risk factors and interact with each other through complex biological
pathways.

Current clinical tools:
- Assess organs in isolation (separate cardiology, nephrology, hepatology)
- Provide static snapshots rather than longitudinal trajectories
- Offer predictions without explanation (black-box AI)
- Do not simulate "what if" scenarios for patient education

MetaTwin-X addresses all four gaps by creating a unified multi-organ digital
twin with explainable AI, temporal simulation, and interactive visualisation.

---

## 3. Objectives

| # | Objective | Status |
|---|-----------|--------|
| 1 | Predict Heart, Kidney, Liver risk from biomarker input | ✅ Done |
| 2 | Model cross-organ interactions (cardiorenal, NAFLD-CVD) | ✅ Done |
| 3 | Simulate 12-month risk trajectories (ODE + ML hybrid) | ✅ Done |
| 4 | Provide explainable AI (SHAP, causal inference) | ✅ Done |
| 5 | 3D interactive body visualisation | ✅ Done |
| 6 | Upload medical reports → auto-extract patient data | ✅ Done |
| 7 | Persistent digital twin per patient in database | ✅ Done |
| 8 | Doctor multi-patient dashboard with real DB records | ✅ Done |
| 9 | Real-time IoT vitals via WebSocket | ✅ Done |
| 10 | PIN-based access control | ✅ Done |


---

## 4. Technology Stack

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Framework | FastAPI 0.110 | REST + WebSocket endpoints |
| ML Models | XGBoost 2.x | Heart/Kidney/Liver risk prediction |
| Feature Engineering | scikit-learn | Preprocessing, scaling, encoding |
| ODE Simulation | SciPy (solve_ivp) | 12-month trajectory simulation |
| XAI | SHAP, custom causal engine | Explainability |
| RL Agent | Q-Learning (NumPy) | Intervention recommendations |
| OCR | pdfplumber, pytesseract, Pillow | Lab report text extraction |
| Database | SQLite + SQLAlchemy | Patient records, digital twin state |
| Validation | Pydantic v2 | Request/response schemas |
| Server | Uvicorn (ASGI) | Production-grade async server |

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| UI Framework | React 18 | Component-based UI |
| 3D Rendering | Three.js + React Three Fiber | Procedural 3D human body |
| 3D Helpers | @react-three/drei | Orbit controls, suspense |
| Charts | Recharts | Area charts, radial bar gauge |
| HTTP Client | Axios | API calls |
| Styling | CSS variables + inline styles | Dark futuristic theme |
| Build | Webpack (react-scripts) | Module bundling |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| OS | Windows / Linux / macOS |
| Python | 3.10+ |
| Node.js | 18+ |
| Database file | data/metatwin.db (SQLite) |
| Model files | models/ (XGBoost .json + preprocessor) |


---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (localhost:3000)                  │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ AuthGate │  │   TopBar Nav │  │    14 View Sections   │ │
│  │ PIN Lock │  │  (14 routes) │  │ Dashboard/Report/etc. │ │
│  └──────────┘  └──────────────┘  └───────────────────────┘ │
│                                                             │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │  LeftPanel  │ │  CenterPanel │ │     RightPanel      │  │
│  │ Organ Cards │ │ 3D / SVG     │ │ ECG + Live Vitals   │  │
│  │ Risk Gauges │ │ Compare Mode │ │ Recommendations     │  │
│  └─────────────┘ └──────────────┘ └─────────────────────┘  │
│           │              │WS                │               │
└───────────┼──────────────┼──────────────────┼───────────────┘
            │ HTTP/REST    │WebSocket         │ HTTP/REST
            ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI (localhost:8000)                    │
│                                                             │
│  /predict     /simulate    /recommend    /xai               │
│  /twin        /patients    /report       /rl                │
│  /ws/vitals   /stream      /health                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   ML Pipeline                        │   │
│  │  Input → Preprocess → XGBoost × 3 → Interaction     │   │
│  │  Engine → Adjusted Scores → SHAP → Causal → RL      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │  SQLite DB   │  │  ODE Engine  │  │  Report Parser │    │
│  │  Patients    │  │  SciPy ODE   │  │  OCR + NLP     │    │
│  │  Records     │  │  12M sim     │  │  Identity ext. │    │
│  │  Twin State  │  └──────────────┘  └────────────────┘    │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow — Standard Prediction

```
User fills Health Input form
         │
         ▼
POST /predict/adaptive
         │
         ▼
DataPreprocessor.validate_and_transform()
  - Range clamping
  - Missing value imputation
  - Feature engineering (BMI category, BP ratio, etc.)
         │
         ▼
PredictionEngine.predict_all()
  - Heart model  → raw_heart_score  (0–1)
  - Kidney model → raw_kidney_score (0–1)
  - Liver model  → raw_liver_score  (0–1)
         │
         ▼
AdaptiveInteractionEngine.apply()
  - Cardiorenal syndrome rule
  - Diabetic nephropathy rule
  - NAFLD-CVD axis rule
  - Hypertensive nephropathy rule
  - Audit log of all adjustments
         │
         ▼
Adjusted scores saved to SQLite
Digital twin state updated
Recommendations generated
SHAP explanations computed
         │
         ▼
JSON response → React frontend → Dashboard updates
3D organs recolour to match risk level
```

### Data Flow — Document Upload

```
User drops PDF / PNG / JPG / TXT
         │
         ▼
POST /report/from-upload
         │
         ▼
extract_text() — pdfplumber / pytesseract OCR
         │
         ▼
structure_report() — NLP/Regex extraction
  - Patient name, ID, report date, doctor
  - All biomarker values from lab tables
  - Confidence scoring
         │
         ▼
to_raw_health_input() — map to model features
         │
         ▼
_run_pipeline() — same ML pipeline as above
         │
         ▼
Auto-save to DB (upsert_patient + save_health_record)
         │
         ▼
generate_report() — 6-section structured report
         │
         ▼
Doctor Dashboard now shows this patient
Printable HTML report available
```


---

## 6. Backend Modules

### 6.1 backend/main.py
Entry point. Registers all routers, CORS middleware, health endpoints,
and the `/ws/vitals` WebSocket broadcast for live IoT vitals.

### 6.2 src/prediction_engine.py
Loads three XGBoost models from `models/` directory.
`predict_all(bundle)` returns raw scores for all three organs.
Models trained on synthetic clinical dataset with AUC 0.986–0.991.

### 6.3 src/interaction_engine.py
Rule-based cross-organ adjustment engine.
Rules applied in priority order:
- **Cardiorenal Syndrome**: elevated creatinine + systolic BP > 140 → +8–12% kidney risk
- **Diabetic Nephropathy**: glucose > 126 + HbA1c > 6.5 → +10–15% kidney risk
- **NAFLD-CVD Axis**: ALT > 80 + BMI > 30 → +6–10% heart risk
- **Hypertensive Nephropathy**: systolic > 160 → +5–8% kidney risk
Each rule produces an audit log entry with original score, delta, adjusted score.

### 6.4 backend/core/adaptive_interaction.py
Extends the interaction engine with online weight learning.
Stores learned weights per patient in JSON files under `data/memory/`.
Weights update after each prediction using gradient-free update rule.

### 6.5 backend/simulation/ode_engine.py
Hybrid ODE + ML simulation over 180 days (configurable).
Uses `scipy.integrate.solve_ivp` with a system of coupled differential equations
modelling organ risk evolution. Supports stochastic uncertainty bands via
Monte Carlo sampling (50 trajectories by default).

### 6.6 backend/xai/
- **causal_engine.py**: Estimates causal effect of each biomarker on organ risk
  using intervention calculus grounded in RCT/meta-analysis evidence.
- **counterfactuals.py**: Generates "what if" scenarios —
  "If BMI decreases by 3 → heart risk drops by X%".
- **llm_reasoning.py**: Natural language clinical Q&A using template-based
  reasoning engine. Answers queries like "Why is my kidney risk high?".

### 6.7 backend/rl/agent.py
Q-Learning reinforcement learning agent.
State: organ risks + patient demographics.
Action space: 12 lifestyle/clinical interventions.
Recommends top-5 interventions ranked by expected risk reduction.

### 6.8 backend/twin/digital_twin.py
Persistent living digital twin per patient.
State includes: current scores, historical trajectory, wearable data,
calibration status, update count. Stored as JSON in `data/twins/`.

### 6.9 src/report_parser.py
Full OCR + NLP pipeline for lab report processing.
- Text extraction: pdfplumber (PDF), pytesseract (images)
- Patient identity extraction: name, ID, date, doctor
- Biomarker extraction: 30+ patterns per field, handles multiple report formats
- Derives missing values (glucose from HbA1c, BMI from height/weight)
- Auto-generates patient ID hash if not found in document
- Confidence scoring based on fraction of required fields found

### 6.10 backend/reports/report_generator.py
Generates 6-section structured patient report:
- A: Patient summary + health score
- B: Multi-organ risk analysis with interpretation
- C: Test-by-test analysis table
- D: Key findings (abnormal values)
- E: AI clinical + lifestyle recommendations
- F: Conclusion and next steps

### 6.11 backend/db/database.py
SQLAlchemy ORM with SQLite backend.
Tables: `patients`, `health_records`, `simulation_logs`, `alert_logs`.
Key functions: `upsert_patient`, `save_health_record`, `get_patient_history`.


---

## 7. Frontend Modules

### 7.1 Pages
| File | Purpose |
|------|---------|
| `pages/Home.js` | Root layout, state management, view routing, emergency alerts |

### 7.2 Core Dashboard Components
| File | Purpose |
|------|---------|
| `components/TopBar.js` | Navigation bar with scrollable nav, lock button |
| `components/LeftPanel.js` | Organ risk cards, biological age, emergency detector |
| `components/CenterPanel.js` | 3D/SVG body viewer, 3-way compare mode |
| `components/RightPanel.js` | ECG, live vitals, WebSocket IoT feed, history |
| `components/BottomSection.js` | 12-month simulation, lifestyle sliders, timeline |

### 7.3 3D Visualisation
| File | Purpose |
|------|---------|
| `components/three/Human3D.js` | Procedural 3D body (React Three Fiber) |
| `components/HumanBody3D.js` | SVG anatomical fallback |

### 7.4 Feature Sections
| File | Purpose |
|------|---------|
| `components/HealthForm.js` | 40+ biomarker input form |
| `components/PatientReport.js` | AI report upload + display |
| `components/PrintReport.js` | A4 printable HTML report generator |
| `components/AIAssistant.js` | Chat + SHAP + What-If + Voice input |
| `components/AdvancedPanel.js` | Causal inference, counterfactuals, ODE sim |
| `components/DiseaseProgression.js` | Animated progression, heatmap, playback |
| `components/ClinicalIndices.js` | Biological age, clinical risk indices |
| `components/DoctorDashboard.js` | Multi-patient table from real DB records |
| `components/MedicationTracker.js` | Drug library, interaction detection |
| `components/OrganInteractionGraph.js` | SVG force-layout dependency graph |
| `components/RiskHeatmapCalendar.js` | 90-day GitHub-style health calendar |
| `components/SleepRecovery.js` | Sleep analysis, recovery score |
| `components/ECGWaveform.js` | Canvas-based animated ECG |
| `components/ConfettiCelebration.js` | Particle burst on health improvement |
| `components/SettingsPage.js` | Theme, light mode, notifications, export |
| `components/AuthGate.js` | PIN-based authentication with session |

### 7.5 Utilities
| File | Purpose |
|------|---------|
| `services/api.js` | All Axios API calls, normalizeRisks() helper |
| `utils/exportCsv.js` | One-click CSV download of all patient data |


---

## 8. AI & ML Pipeline

### 8.1 Models

Three independent XGBoost regression models:

| Model | Input Features | Output | AUC |
|-------|--------------|--------|-----|
| Heart Risk | BP, cholesterol, glucose, BMI, age, sex, smoking, exercise | 0–1 risk score | 0.991 |
| Kidney Risk | Creatinine, eGFR, glucose, BP, urea, age, sex, BMI | 0–1 risk score | 0.988 |
| Liver Risk | ALT, AST, BMI, alcohol, glucose, cholesterol, age | 0–1 risk score | 0.986 |

### 8.2 Health Score Formula

```
HealthScore = (1 - (0.4×Heart + 0.3×Kidney + 0.3×Liver + 0.1×Heart×Kidney)) × 100
```

The interaction term `0.1 × Heart × Kidney` captures the cardiorenal syndrome
penalty — patients with both elevated heart and kidney risk score lower than
the simple weighted sum.

### 8.3 Cross-Organ Interaction Rules

```
IF systolic_bp > 140 AND serum_creatinine > 1.3:
    kidney_risk += 0.08–0.12  (Cardiorenal Syndrome)

IF fasting_glucose > 126 AND hba1c > 6.5:
    kidney_risk += 0.10–0.15  (Diabetic Nephropathy)

IF alt > 80 AND bmi > 30:
    heart_risk += 0.06–0.10   (NAFLD-CVD Axis)

IF systolic_bp > 160:
    kidney_risk += 0.05–0.08  (Hypertensive Nephropathy)
```

### 8.4 ODE Simulation System

```
d(heart)/dt  = α_h × heart  × (1 - heart)  × lifestyle_factor
d(kidney)/dt = α_k × kidney × (1 - kidney) × interaction(heart)
d(liver)/dt  = α_l × liver  × (1 - liver)  × metabolic_factor
```

Solved with `scipy.integrate.solve_ivp` (RK45 method) over 180-day horizon.
Stochastic variant adds Gaussian noise per timestep.
Monte Carlo: 50 trajectories → 10th/50th/90th percentile bands.

### 8.5 SHAP Explainability

SHAP TreeExplainer applied to each model.
Top contributing features returned per prediction.
Displayed as bar charts in the Advanced AI panel.

### 8.6 Causal Inference Engine

Uses intervention calculus to estimate causal effects:
- "Reducing systolic BP by 20 mmHg CAUSES ~14% heart risk reduction"
- Evidence grounded in published RCT/meta-analysis effect sizes
- Separates correlation from causation

### 8.7 RL Intervention Agent

Q-Learning with:
- State: discretised risk scores × age group × sex
- Actions: 12 interventions (exercise, diet, medication, etc.)
- Reward: weighted sum of risk reductions
- Exploration: ε-greedy (ε=0.1)
- Trained offline, inference-only at runtime

### 8.8 Biological Age Calculation

```
BioAge = ChronologicalAge
       + (BMI - 22) × 0.4
       + (systolic_bp - 120) × 0.06
       + (total_cholesterol - 180) × 0.02
       + (fasting_glucose - 90) × 0.04
       - (exercise_hours × 0.8)
       - (sleep_hours - 6) × 0.5
       + (smoking ? 5 : 0)
```


---

## 9. Database Design

### Tables

#### patients
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| patient_id | STRING UNIQUE | e.g. MT-ABC123 |
| name | STRING | Extracted from document or entered |
| age | INTEGER | Patient age |
| sex | STRING | male / female |
| created_at | DATETIME | First record timestamp |
| updated_at | DATETIME | Last update timestamp |

#### health_records
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| patient_id | STRING FK | Links to patients table |
| timestamp | DATETIME | When prediction was made |
| age / bmi / systolic_bp | FLOAT | Key biomarkers |
| fasting_glucose / serum_creatinine | FLOAT | Metabolic markers |
| alt_enzyme / ast_enzyme | FLOAT | Liver enzymes |
| heart_risk / kidney_risk / liver_risk | FLOAT | Model output (0–1) |
| hr_resting / hrv_ms / spo2_pct | FLOAT | Wearable data (nullable) |
| snapshot_json | TEXT | Full biomarker snapshot as JSON |

#### simulation_logs
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| patient_id | STRING FK | Links to patients |
| scenario | STRING | "Baseline", "Optimised", etc. |
| horizon_days | INTEGER | Simulation length |
| peak_heart / peak_kidney / peak_liver | FLOAT | Peak projected risk |
| trajectory_json | TEXT | First 30 trajectory points |

#### alert_logs
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| patient_id | STRING | Patient reference |
| organ | STRING | heart / kidney / liver |
| risk_level | STRING | moderate / high / critical |
| risk_score | FLOAT | Score that triggered alert |
| resolved | BOOLEAN | Dismissed by clinician |
| message | TEXT | Alert description |


---

## 10. Feature Inventory

| # | Feature | Location | Description |
|---|---------|----------|-------------|
| 1 | Health Input Form | Health Input | 40+ biomarker fields with validation |
| 2 | Multi-Organ Prediction | All views | XGBoost Heart/Kidney/Liver risk |
| 3 | Cross-Organ Interactions | Dashboard | 4 clinical interaction rules |
| 4 | 3D Digital Twin | Dashboard | Procedural R3F human body |
| 5 | SVG Anatomical View | Dashboard | Clickable SVG fallback |
| 6 | 3-Way Compare Mode | Dashboard | Current / Best / Worst case |
| 7 | Health Score Gauge | Dashboard | Weighted formula with interaction penalty |
| 8 | Live ECG Waveform | Right Panel | Canvas PQRST animation |
| 9 | WebSocket Vitals | Right Panel | Real-time IoT feed / simulation fallback |
| 10 | Clinical Protocols | Right Panel | RL-generated recommendations |
| 11 | Patient History | Right Panel | Real DB records timeline |
| 12 | 12-Month Simulation | Bottom | ODE hybrid + lifestyle sliders |
| 13 | Disease Progression | Progression | Animated organ state over time |
| 14 | Body Heatmap | Progression | Whole-body risk colour map |
| 15 | Digital Twin Playback | Progression | Timeline playback controls |
| 16 | Future Me | Progression | Three future scenario visualisations |
| 17 | AI Assistant Chat | AI Assistant | Natural language Q&A |
| 18 | SHAP Explainability | AI Assistant | Feature importance bar charts |
| 19 | What-If Simulator | AI Assistant | Slider-driven scenario engine |
| 20 | Voice Input | AI Assistant | Browser SpeechRecognition API |
| 21 | Causal Inference | Advanced AI | RCT-grounded causal effects |
| 22 | Counterfactuals | Advanced AI | "If X changes → risk changes by Y" |
| 23 | ODE Simulation | Advanced AI | SciPy coupled ODE with uncertainty |
| 24 | Biological Age | Clinical | Age equivalent from biomarkers |
| 25 | Clinical Indices | Clinical | Cardiac/Renal/Liver/Metabolic index |
| 26 | Emergency Detection | Clinical / Auto | Multi-condition alert system |
| 27 | Doctor Dashboard | Doctor View | Multi-patient real DB table |
| 28 | Medication Tracker | Medications | 12 drugs, interaction detection |
| 29 | Organ Interaction Graph | Organ Graph | SVG force-layout network |
| 30 | Risk Heatmap Calendar | Heatmap | 90-day GitHub-style grid |
| 31 | Sleep & Recovery | Sleep | Sleep analysis, recovery score |
| 32 | Lab Report Upload | AI Report | OCR → biomarkers → auto-save |
| 33 | Patient Identity Extraction | AI Report | Name/ID/date auto-extracted |
| 34 | Printable PDF Report | AI Report | A4 HTML → browser print |
| 35 | Report Upload Mode | Report Upload | Quick upload for existing reports |
| 36 | Settings Page | Settings | Theme, light mode, notifications |
| 37 | 4 Colour Themes | Settings | Dark Navy/Purple/Forest/Midnight |
| 38 | Light Mode | Settings | White clinical interface CSS |
| 39 | Export CSV | Dashboard | Full patient data download |
| 40 | Confetti Animation | Auto | Health score improvement celebration |
| 41 | Emergency Alert Banner | Auto | Fixed red banner on critical risk |
| 42 | PIN Authentication | App-wide | Session-based access control |
| 43 | Keyboard Shortcuts | App-wide | D/I/A/S/R/C/P/M/H/G/Z/O |
| 44 | Digital Twin Persistence | Backend | JSON twin state per patient |
| 45 | Session Restore | Auto | Last prediction restored on reload |

---

## 11. API Reference

### Core Prediction
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /predict/ | Standard prediction |
| POST | /predict/adaptive | Adaptive cross-organ prediction |
| POST | /simulate/ | Basic trajectory simulation |
| POST | /simulate/ode | Hybrid ODE simulation |
| POST | /recommend/ | Clinical recommendations |

### Explainable AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /xai/causal | Causal effect analysis |
| POST | /xai/counterfactuals | What-if scenarios |
| POST | /xai/sensitivity | Feature sensitivity |
| POST | /xai/query | Natural language Q&A |

### Digital Twin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /twin/{id}/update | Update patient twin state |
| GET | /twin/{id} | Get current twin state |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /patients/all | All patients with latest records |
| GET | /patients/{id}/history | Patient visit history |
| POST | /patients/{id} | Create/update patient |
| POST | /patients/{id}/records | Save health record |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /report/from-upload | Upload doc → full pipeline |
| POST | /report/from-scores | Report from existing scores |
| POST | /report/generate | Report from body JSON |
| GET | /report/html/{id} | Cached HTML report |

### RL Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /rl/interventions | Top-5 RL interventions |

### Streaming
| Protocol | Endpoint | Description |
|----------|----------|-------------|
| WebSocket | /ws/vitals | Live vitals broadcast (2.2s) |
| WebSocket | /stream/{id} | Per-patient wearable stream |


---

## 12. Security

### Authentication
- PIN-based access gate on every page load
- PIN stored as MD5-variant hash in localStorage (not plaintext)
- 8-hour session TTL — auto-locks after inactivity
- Lock button in TopBar for manual logout
- Default PIN: `1234` — users set their own on first launch

### Data Storage
- All patient data stored locally in SQLite (no cloud transmission)
- Digital twin state in local JSON files
- No external API calls (no patient data leaves the machine)

### Limitations
- No multi-user role separation (doctor vs patient view is UI-only)
- No HTTPS in local dev mode (add reverse proxy for production)
- PIN hash not cryptographically strong — suitable for local/research use

---

## 13. Deployment

### Local Development

```bash
# Terminal 1 — Backend
cd e:\TARP\metatwin-x
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd e:\TARP\metatwin-x\metatwin-frontend
npm start
```

Access at: `http://localhost:3000`
API docs at: `http://localhost:8000/docs`

### Docker

```bash
docker-compose up --build
```

Frontend: port 3000 | Backend: port 8000

### Production (cloud)

Backend → Railway / Render / AWS EC2:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Frontend → Vercel / Netlify:
```bash
npm run build
# Deploy the build/ folder
```

Update `BASE_URL` in `src/services/api.js` to point to the deployed backend URL.

---

## 14. Testing

### Backend
```bash
cd e:\TARP\metatwin-x
pytest tests/ -v
```

Key test areas:
- Prediction pipeline (valid input, edge cases, missing values)
- Interaction engine (each rule individually)
- Report parser (name/ID/biomarker extraction)
- API endpoints (status codes, response shape)

### Frontend
```bash
cd metatwin-frontend
npm test
```

### Manual Test Checklist
- [ ] Health Input → all fields → Analyse → Dashboard updates
- [ ] Upload lab report PDF → name auto-extracted → Doctor Dashboard shows patient
- [ ] AI Assistant chat → ask "Why is heart risk high?"
- [ ] Compare Mode → 3 bodies visible with correct colours
- [ ] Emergency alerts fire when risk > 80%
- [ ] PIN lock → logout → PIN required to re-enter
- [ ] CSV export → file downloads with all data
- [ ] Doctor Dashboard Refresh → new patient appears after upload

---

## 15. Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| XGBoost trained on synthetic data | Scores are indicative, not clinical-grade | Clearly labelled as AI estimates |
| OCR quality depends on document clarity | Blurry scans may miss values | Confidence score shown to user |
| No real wearable device integration | Vitals simulated when no device connected | Shows "Simulated" label clearly |
| Single-user PIN (no role separation) | All users see all patients | Suitable for research/demo context |
| SQLite not suitable for high concurrency | Fine for local/small clinic use | Swap to PostgreSQL for production |
| No HTTPS in local mode | Data in transit not encrypted locally | Add nginx + Let's Encrypt for deployment |
| LLM reasoning is template-based | Fixed response patterns | Upgrade to GPT/local LLM API for richer answers |

---

*MetaTwin-X — AI-Powered Multi-Organ Digital Health Twin*  
*Built with FastAPI · XGBoost · React · Three.js · SQLite*  
*Version 2.0.0 | June 2026*
