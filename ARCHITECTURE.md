# MetaTwin-X — System Architecture

> Version 2.0.0 | June 2026

---

## 1. High-Level Architecture

MetaTwin-X follows a **client-server architecture** with a clear separation
between the React frontend (port 3000) and the FastAPI backend (port 8000).
Communication uses REST for request-response operations and WebSocket for
real-time streaming.

```
┌───────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                               │
│                    React SPA (port 3000)                          │
│                                                                   │
│  AuthGate ─► Home ─► TopBar (14 nav items)                       │
│                  │                                                │
│         ┌────────┼────────┐                                       │
│         ▼        ▼        ▼                                       │
│     LeftPanel  Center  RightPanel                                 │
│     (Organs)   Panel   (ECG+IoT)                                  │
│                (3D)                                               │
│         └────────┼────────┘                                       │
│                  │                                                │
│     14 Feature Views (report, doctor, meds, graph, etc.)         │
└──────────────────┼───────────────────────────────────────────────┘
                   │  HTTP REST + WebSocket
┌──────────────────▼───────────────────────────────────────────────┐
│                      API GATEWAY LAYER                            │
│                   FastAPI (port 8000)                             │
│                                                                   │
│  CORS Middleware → Router Registry → Dependency Injection         │
│                                                                   │
│  /predict   /simulate  /recommend  /xai  /rl  /twin              │
│  /patients  /report    /health     /ws/vitals  /stream            │
└──────────────────┬───────────────────────────────────────────────┘
                   │
       ┌───────────┼───────────────┐
       ▼           ▼               ▼
┌──────────┐  ┌─────────┐  ┌──────────────┐
│ ML Layer │  │ DB Layer│  │ Report Layer │
│          │  │         │  │              │
│ XGBoost  │  │ SQLite  │  │ OCR + NLP    │
│ XGB×3    │  │ SQLAlch │  │ PDF/Image    │
│ SHAP     │  │ 4 tables│  │ Identity ext │
│ ODE Sim  │  │         │  │ HTML gen     │
│ Causal   │  └─────────┘  └──────────────┘
│ RL Agent │
└──────────┘
```

---

## 2. Frontend Architecture

### 2.1 Component Hierarchy

```
App.js
└── AuthGate.js          ← PIN session check
    └── Home.js          ← Root state container
        ├── TopBar.js    ← Scrollable nav, lock button
        ├── Emergency Banner (inline)
        ├── Confetti (ConfettiCelebration.js)
        └── Main Content Area
            ├── view="dashboard"
            │   ├── LeftPanel.js
            │   ├── CenterPanel.js
            │   │   ├── Human3D.js       (R3F 3D)
            │   │   └── HumanBody3D.js   (SVG fallback)
            │   ├── RightPanel.js
            │   │   └── ECGWaveform.js
            │   └── BottomSection.js
            ├── view="input"    → HealthForm.js
            ├── view="report"   → PatientReport.js → PrintReport.js
            ├── view="advanced" → AdvancedPanel.js
            ├── view="assistant"→ AIAssistant.js
            ├── view="clinical" → ClinicalIndices.js
            ├── view="progression"→ DiseaseProgression.js
            ├── view="doctor"   → DoctorDashboard.js
            ├── view="meds"     → MedicationTracker.js
            ├── view="graph"    → OrganInteractionGraph.js
            ├── view="heatmap"  → RiskHeatmapCalendar.js
            ├── view="sleep"    → SleepRecovery.js
            ├── view="upload"   → ReportUpload.js
            └── view="settings" → SettingsPage.js
```

### 2.2 State Management

All global state lives in `Home.js` and flows down via props:

| State Variable | Type | Purpose |
|---------------|------|---------|
| risk | object | Current organ risk scores {heart, kidney, liver} |
| recs | object | Recommendation items from API |
| formData | object | Last submitted biomarker values |
| auditLog | array | Interaction rule audit entries |
| twinState | object | Digital twin metadata |
| patientId | string | Persistent ID from localStorage |
| view | string | Active navigation section |
| emergency | object/null | Active emergency alert reasons |
| confetti | boolean | Triggers particle celebration |
| liveVitals | object | WebSocket vitals feed data |

### 2.3 API Service Layer

`services/api.js` centralises all HTTP calls:
- Axios instance with `baseURL = http://127.0.0.1:8000`
- `normalizeRisks()` converts 0–1 fractions to 0–100 percentages
- `extractScoresFromPredict()` handles both response shapes
- All functions are async, return data directly

### 2.4 WebSocket Integration

`RightPanel.js` opens a WebSocket to `/ws/vitals` on mount:
```
ws://127.0.0.1:8000/ws/vitals
→ receives {heart_rate, spo2, systolic, diastolic, hrv, stress, steps}
→ every 2.2 seconds
→ auto-reconnect every 5s on disconnect
→ falls back to simulated data if WS unavailable
```


---

## 3. Backend Architecture

### 3.1 Request Pipeline

```
HTTP Request
    │
    ▼
Uvicorn ASGI Server
    │
    ▼
FastAPI Application
    │
    ├── CORS Middleware (allow_origins=["*"])
    │
    ▼
Route Matching
    │
    ├── /predict*   → backend/routes/predict.py
    ├── /simulate*  → backend/routes/simulate.py
    ├── /recommend* → backend/routes/recommend.py
    ├── /report*    → backend/routes/report.py
    ├── /xai*       → backend/api/advanced.py
    ├── /rl*        → backend/api/advanced.py
    ├── /twin*      → backend/api/advanced.py
    ├── /patients*  → backend/api/advanced.py
    ├── /stream*    → backend/api/advanced.py
    └── /ws/vitals  → backend/main.py
```

### 3.2 Prediction Pipeline (detailed)

```
POST /predict/adaptive
        │
        ▼
AdaptivePredict schema validation (Pydantic)
        │
        ▼
AdaptiveInteractionEngine(patient_id)
  ├── Load learned weights from data/memory/{patient_id}.json
  ├── Apply interaction rules with learned weight multipliers
  └── Update weights after observation
        │
        ▼
PredictionEngine.predict_all(bundle)
  ├── Heart:  XGBoost model → raw score
  ├── Kidney: XGBoost model → raw score
  └── Liver:  XGBoost model → raw score
        │
        ▼
InteractionEngine.apply_rules(raw_scores, raw_input)
  ├── Check each rule condition
  ├── Apply delta adjustments
  └── Generate audit_log entries
        │
        ▼
uncertainty_estimate(adjusted_scores)
  └── Returns confidence intervals per organ
        │
        ▼
Response: {adjusted_scores, uncertainty, audit_log, learned_weights}
```

### 3.3 Report Upload Pipeline

```
POST /report/from-upload
  multipart/form-data: file
        │
        ▼
extract_text(bytes, filename)
  ├── .pdf  → pdfplumber (text + tables)
  │         → fallback: pdf2image + pytesseract
  ├── .png/.jpg → pytesseract OCR
  └── .txt  → decode UTF-8
        │
        ▼
structure_report(raw_text)
  ├── _extract_patient_name()   → regex 4 patterns
  ├── _extract_patient_id()     → regex 5 patterns
  ├── _extract_report_date()    → regex 4 patterns
  ├── _extract_doctor_name()    → regex 2 patterns
  ├── _extract_sex()            → regex 4 patterns
  ├── FIELD_PATTERNS[30+]       → numeric biomarkers
  ├── Derived: BMI from weight+height
  ├── Derived: glucose from HbA1c (ADAG formula)
  └── Confidence = found_required / 12
        │
        ▼
to_raw_health_input()
  └── Map extraction → RawHealthInput (fills defaults for missing)
        │
        ▼
_run_pipeline(raw) → scores, audit_log
        │
        ▼
upsert_patient() + save_health_record() → SQLite
        │
        ▼
generate_report() → 6-section JSON
generate_html_report() → A4 HTML cached
        │
        ▼
Response: {report, patient, extraction, saved_to_db: true}
```

---

## 4. Database Architecture

### 4.1 Entity Relationship

```
patients (1) ──── (many) health_records
    │
    └──── (many) simulation_logs

alert_logs (standalone, patient_id string ref)
```

### 4.2 Data Access Patterns

| Operation | Function | Frequency |
|-----------|----------|-----------|
| Save prediction | save_health_record() | Every prediction |
| Get patient history | get_patient_history() | History tab, Doctor view |
| List all patients | db.query(Patient).all() | Doctor dashboard |
| Update twin | LivingDigitalTwin.update() | Every prediction |
| Log alert | log_alert() | When risk ≥ 0.70 |

### 4.3 Storage Locations

```
e:\TARP\metatwin-x\
├── data\
│   ├── metatwin.db          ← SQLite database
│   ├── memory\              ← Learned interaction weights per patient
│   │   └── {patient_id}.json
│   └── twins\               ← Digital twin state per patient
│       └── {patient_id}.json
└── models\                  ← XGBoost model files
    ├── heart_model.json
    ├── kidney_model.json
    ├── liver_model.json
    └── preprocessor\        ← Scaler, encoder objects
```

---

## 5. 3D Visualisation Architecture

### 5.1 React Three Fiber Scene Graph

```
<Canvas camera={position:[0,1.2,4.5]} shadows>
  ├── <ambientLight/>
  ├── <directionalLight/> × 2
  ├── <pointLight/> (cyan body glow)
  ├── <fog/> (depth atmosphere)
  │
  ├── Body Silhouette (BodyPart components)
  │   ├── Head, Neck, Torso, Pelvis
  │   ├── Shoulders, Upper Arms, Forearms, Hands
  │   └── Upper Legs, Lower Legs, Feet
  │
  ├── Ribcage (5 torus rings + spine cylinder)
  │
  ├── Clickable Organs (OrganMesh components)
  │   ├── Heart   → color = riskColor(heart_pct)
  │   ├── Liver   → color = riskColor(liver_pct)
  │   ├── Kidney L → color = riskColor(kidney_pct)
  │   └── Kidney R → color = riskColor(kidney_pct)
  │       Each: pulse animation when risk > 30%
  │             glow pointLight when hovered
  │
  ├── Floor gridHelper
  └── <OrbitControls/> pan=false, zoom 2.5–7
</Canvas>
```

### 5.2 Risk Colour Mapping

| Risk % | Colour | Hex |
|--------|--------|-----|
| 0–20 | Green | #10b981 |
| 20–40 | Amber | #f59e0b |
| 40–60 | Orange | #f97316 |
| 60–80 | Red | #ef4444 |
| 80–100 | Deep Red | #dc2626 |

### 5.3 Compare Mode Architecture

```
compareMode = true
        │
        ▼
┌──────────┬──────────┬──────────┐
│ Current  │ Best     │ Worst    │
│ risks    │ improved │ worst    │
│ (actual) │ (×0.75)  │ (×1.45)  │
└──────────┴──────────┴──────────┘
     ↓            ↓          ↓
  BodyViewer  BodyViewer  BodyViewer
  (3D or SVG) (green org) (red organs)
        │
        ▼
Delta summary: Best − Current − Worst score range
```

---

## 6. Authentication Architecture

```
App.js
  └── AuthGate.js
        │
        ├── Check localStorage["mt_auth_session"]
        │     → {expires: timestamp}
        │     → if Date.now() < expires: render children (app)
        │
        ├── If no session: show PIN screen
        │     ├── First time: PIN setup flow
        │     │     → store hashPin(pin) in localStorage["mt_auth_pin"]
        │     └── Returning: PIN entry + numeric pad
        │           → compare hashPin(entered) === stored
        │           → if match: createSession() → expires = now + 8h
        │
        └── Lock button in TopBar → clearSession() → AuthGate re-renders
```

PIN hashing:
```javascript
function hashPin(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}
```

---

## 7. Real-Time Architecture

### 7.1 WebSocket Vitals Stream

```
Backend: /ws/vitals
  └── ws.accept()
  └── loop every 2.2s:
        generate {heart_rate, spo2, systolic, diastolic, hrv, stress, steps}
        with realistic drift (base × 0.98 + new × 0.02)
        ws.send_text(json)

Frontend: RightPanel.js
  └── useEffect → new WebSocket("ws://127.0.0.1:8000/ws/vitals")
  └── ws.onmessage → setLiveData(prev => {...prev, ...data})
  └── ws.onclose → setTimeout(connect, 5000)  // auto-reconnect
  └── Status badge: "IoT Live" (green) | "Simulated" (amber)
```

### 7.2 Per-Patient Stream

```
WebSocket: /stream/{patient_id}?heart=X&kidney=Y&liver=Z
  └── Streams wearable updates + score drift
  └── Emits critical alerts when any risk ≥ 0.80
```

---

## 8. Cross-Cutting Concerns

### 8.1 Error Handling
- Backend: HTTPException with status codes + detail messages
- Frontend: try/catch on all API calls, error state displayed inline
- Report upload: graceful degradation (OCR fails → user-friendly message)

### 8.2 Session Persistence
- Last prediction saved to `localStorage["mt_last"]` as JSON
- Restored on app reload — user returns to last state
- Patient ID persisted in `localStorage["mt_pid"]`

### 8.3 Performance
- 3D Canvas lazy-loaded via React Suspense
- Risk normalisation cached with useMemo
- Chart data computed on demand, not stored in state
- WebSocket reconnect uses exponential backoff

### 8.4 Theming
- CSS variables on `:root` for all colours
- `body.light-mode` overrides for white theme
- 4 dark themes via JS: sets `--bg-base` and `--neon-blue` CSS vars
- All components consume `var(--text-primary)` etc. — no hardcoded colours

---

*MetaTwin-X System Architecture v2.0.0*  
*FastAPI + XGBoost + React + Three.js + SQLite + WebSocket*
