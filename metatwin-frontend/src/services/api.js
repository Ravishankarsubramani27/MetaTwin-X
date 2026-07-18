import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";
const api = axios.create({ baseURL: BASE_URL, headers: { "Content-Type": "application/json" } });

// ── Core ──────────────────────────────────────────────────────────────
export const predictRisk        = async (data)   => (await api.post("/predict/",   data)).data;
export const simulateRisk       = async (scores) => (await api.post("/simulate/",  scores)).data;
export const getRecommendations = async (scores) => (await api.post("/recommend/", scores)).data;

/** Convert API scores (0–1 fractions) to 0–100 risks for the 3D viewer. */
export function normalizeRisks(scores) {
  if (!scores) return { heart: 0, kidney: 0, liver: 0 };

  const toPct = (value) => {
    const n = Number(value) || 0;
    return n <= 1 ? Math.round(n * 1000) / 10 : Math.round(n * 10) / 10;
  };

  return {
    heart: toPct(scores.heart),
    kidney: toPct(scores.kidney),
    liver: toPct(scores.liver),
  };
}

/** Extract organ scores from POST /predict/ response. */
export function extractScoresFromPredict(response) {
  return response?.adjusted_scores ?? response ?? {};
}

// ── Advanced AI ───────────────────────────────────────────────────────
export const predictAdaptive = async (scores, biomarkers, patientId = "default") =>
  (await api.post("/predict/adaptive", { scores, biomarkers, patient_id: patientId })).data;

export const simulateODE = async (scores, horizon = 180, interventions = {}, stochastic = true) =>
  (await api.post("/simulate/ode", { scores, horizon_days: horizon,
    interventions, stochastic, n_samples: 50 })).data;

// ── XAI ───────────────────────────────────────────────────────────────
export const getCausalAnalysis  = async (scores, biomarkers, organ) =>
  (await api.post("/xai/causal", { scores, biomarkers, target_organ: organ })).data;

export const getCounterfactuals = async (scores, biomarkers, organ, reduction = 0.10) =>
  (await api.post("/xai/counterfactuals", {
    scores, biomarkers, target_organ: organ, target_reduction: reduction })).data;

export const askQuery = async (query, scores, biomarkers, auditLog = []) =>
  (await api.post("/xai/query", { query, scores, biomarkers, audit_log: auditLog })).data;

// ── RL Agent ──────────────────────────────────────────────────────────
export const getRLInterventions = async (scores, age = 50, sex = "male", wearable = null) =>
  (await api.post("/rl/interventions", { scores, age, sex, wearable })).data;

// ── Digital Twin ──────────────────────────────────────────────────────
export const updateTwin = async (patientId, scores, biomarkers = null, wearable = null) =>
  (await api.post(`/twin/${patientId}/update`, { scores, biomarkers, wearable })).data;

export const getTwin = async (patientId) =>
  (await api.get(`/twin/${patientId}`)).data;

// ── Patients ──────────────────────────────────────────────────────────
export const getPatientHistory = async (patientId, limit = 20) =>
  (await api.get(`/patients/${patientId}/history?limit=${limit}`)).data;

export const getAllPatients = async () =>
  (await api.get("/patients/all")).data;

export const checkHealth = async () => (await api.get("/health")).data;

// ── Patient Report ────────────────────────────────────────────────────
export const generateReport = async (patientId, patientName, scores, biomarkers, auditLog=[]) =>
  (await api.post("/report/generate", {
    patient_id: patientId, patient_name: patientName,
    scores, biomarkers, audit_log: auditLog,
  })).data;

export const generateReportFromUpload = async (file, patientId="P001", patientName="Patient") => {
  const fd = new FormData();
  fd.append("file", file);
  return (await api.post(
    `/report/from-upload?patient_id=${encodeURIComponent(patientId)}&patient_name=${encodeURIComponent(patientName)}`,
    fd, { timeout: 60000 }
  )).data;
};

export const generateReportFromScores = async (patientId, patientName, scores, biomarkers, auditLog=[]) =>
  (await api.post("/report/from-scores", {
    patient_id: patientId, patient_name: patientName,
    scores, biomarkers, audit_log: auditLog,
  })).data;

export const getReportHtmlUrl = (patientId) =>
  `http://127.0.0.1:8000/report/html/${encodeURIComponent(patientId)}`;
