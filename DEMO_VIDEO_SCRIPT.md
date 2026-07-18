# MetaTwin-X — Demo Video Script
# Duration: 5–7 minutes | Format: Screen Recording + Narration

---

## INTRO (0:00 – 0:30)

**[Show title slide with MetaTwin-X logo]**

**NARRATION:**
"Welcome to MetaTwin-X — a next-generation multi-organ digital health twin platform.
In just 7 minutes, I'll show you how AI can simultaneously predict heart, kidney,
and liver risks, explain why through causal reasoning, simulate future trajectories,
and recommend personalised interventions — all in one unified system."

---

## SCENE 1: WELCOME SCREEN (0:30 – 1:00)

**[Open browser to localhost:3000]**

**NARRATION:**
"This is the MetaTwin-X React dashboard. Notice the dark futuristic design —
glassmorphism panels, neon risk indicators, and a clean navigation bar at the top.

The patient ID is automatically generated and persisted across sessions.
You can start by entering health data, uploading a lab report, or viewing the dashboard."

**[Point to: TopBar, navigation items, patient ID badge]**

---

## SCENE 2: HEALTH INPUT + WEARABLE (1:00 – 2:00)

**[Click Health Input in nav bar]**

**NARRATION:**
"The Health Input form has 5 tabs. Let me walk through them quickly.

Demographics: age 48, male, BMI 28.7.
Cardiovascular: blood pressure 142/88, cholesterol 245.
Metabolic: fasting glucose 128, creatinine 1.4.
Lifestyle: 4,000 steps, 6 hours sleep, diet score 4.

And — the new Wearable tab. This integrates smartwatch data directly into the ML pipeline.
Resting heart rate 82, HRV 28 milliseconds — that's low, indicating cardiac stress.
Stress score 68 — elevated. SpO₂ 96.5%."

**[Adjust sliders — show composite AI features updating in real-time]**

**NARRATION:**
"Watch the AI composite features update in real-time —
the Cardiac Stress Index rises as HRV drops.
These 6 wearable features feed directly into the XGBoost prediction models."

**[Click 'Analyse Digital Twin']**

---

## SCENE 3: DASHBOARD — 3-PANEL VIEW (2:00 – 3:00)

**[Dashboard appears — pan slowly across 3 panels]**

**NARRATION:**
"The analysis is complete. The dashboard shows three panels.

Left panel — organ risk cards with arc gauges:
Heart risk: 82% — HIGH.
Kidney risk: 39% — MODERATE.
Liver risk: 60% — HIGH.

The eGFR is computed automatically using the CKD-EPI formula —
G2 stage, mild kidney function decline.

Center panel — this is the anatomical body view.
Each organ has a clickable marker. The heart is pulsing — indicating high risk.
Click the heart — it shows 82% risk, and gives a clinical summary."

**[Click heart marker — show tooltip]**

**NARRATION:**
"Right panel — live vitals updating every 2 seconds,
and the Clinical Protocols tab with 10 personalised recommendations."

---

## SCENE 4: ADVANCED AI — CAUSAL ANALYSIS (3:00 – 4:00)

**[Click Advanced AI in nav, select Causal tab]**

**NARRATION:**
"Now let's look at the Advanced AI panel. This is where MetaTwin-X goes beyond
other risk tools.

The Causal Inference Engine — select Heart, click Run Causal Analysis."

**[Run analysis — results appear]**

**NARRATION:**
"Unlike SHAP which shows correlation, this engine uses the do-calculus framework:
P(risk | do(feature = X)).

Look at the results:
— Reducing systolic BP from 142 to 115 mmHg CAUSES a 10.8% heart risk reduction.
  Evidence: SPRINT trial — Strong RCT.

— Reducing cholesterol from 245 to 160 CAUSES a 10% reduction.
  Evidence: CTT meta-analysis.

These are causally verified, not just correlated features."

**[Switch to Counterfactual tab]**

**NARRATION:**
"The Counterfactual tab answers: what exactly needs to change and by how much?
Generate for Heart — it shows specific target values for each biomarker."

---

## SCENE 5: RL AGENT + SIMULATION (4:00 – 5:00)

**[Switch to RL Agent tab]**

**NARRATION:**
"The Reinforcement Learning Agent uses a Q-value approach to rank 10 clinical interventions.

For this patient, the top recommendation is Antihypertensive Therapy —
targeting heart AND kidney, with an expected reward of 25.4% risk reduction.

This isn't a generic list — it's personalised to this patient's specific risk profile
and biomarker values."

**[Switch to ODE Sim tab, run simulation]**

**NARRATION:**
"The Hybrid ODE Simulation uses coupled differential equations with stochastic
uncertainty bands. Set horizon to 180 days, run it."

**[Chart appears with 3 trajectories + shaded bands]**

**NARRATION:**
"Here's the 6-month projection for all three organs simultaneously.
The shaded bands represent the 10th to 90th percentile — Monte Carlo uncertainty.
This is clinically meaningful — not just a straight line."

---

## SCENE 6: REPORT UPLOAD (5:00 – 5:45)

**[Navigate to Report Upload, upload sample_lab_report.txt]**

**NARRATION:**
"Now let me show the report upload. MetaTwin-X accepts PDF, JPG, or text files.

I'll upload our sample lab report. Watch the pipeline:"

**[Pipeline steps animate through: File Upload → Text Extraction → Biomarker Parsing → ...]**

**NARRATION:**
"Step 1: file received.
Step 2: text extracted using pdfplumber and OCR.
Step 3: NLP regex parser identifies 8 biomarkers with 67% confidence.
Step 4: interaction rules applied.
Step 5: XGBoost models predict.
Step 6: 10 recommendations generated.

The extracted biomarkers table shows which values came from the report versus defaults —
green badge means extracted, grey means default."

**[Show biomarker table and results]**

---

## SCENE 7: API + DOCS (5:45 – 6:15)

**[Open localhost:8000/docs]**

**NARRATION:**
"Finally — the API. MetaTwin-X has 18 fully documented endpoints in Swagger UI.
Any EHR system, mobile app, or clinical portal can integrate via REST API.

The system is production-ready with Docker support, SQLite patient records,
WebSocket streaming, and session persistence."

---

## OUTRO (6:15 – 6:30)

**[Return to welcome screen]**

**NARRATION:**
"MetaTwin-X is a complete, production-ready digital health twin platform:
- 15/15 functional tests passing
- Clinically calibrated models (AUC 0.986–0.991)
- 6 novel AI components
- All grounded in landmark clinical trial evidence

The system runs locally, requires no GPU, and is ready for primary care deployment.

Thank you."

**[End screen: MetaTwin-X logo + localhost:3000 + GitHub QR code]**

---

## Recording Instructions

1. Use OBS Studio or Camtasia for screen recording
2. Resolution: 1920×1080 (1080p)
3. Frame rate: 30fps
4. Narrate live or record voice separately and sync
5. Add zoom effects on key elements (use OBS zoom plugin)
6. Export as MP4, H.264, 720p–1080p, ~200MB max
7. Add captions/subtitles for accessibility

---
*Demo Video Script v1.0 | MetaTwin-X | June 2026*
