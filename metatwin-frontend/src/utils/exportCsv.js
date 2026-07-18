/**
 * exportCsv.js
 * Download patient data + risk scores as CSV.
 */

export function exportToCsv(patientId, risk, formData, auditLog = []) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  // Normalize risks to percentage
  const toPct = v => {
    const n = Number(v) || 0;
    return n <= 1 ? (n * 100).toFixed(1) : n.toFixed(1);
  };

  const heart  = toPct(risk?.heart);
  const kidney = toPct(risk?.kidney);
  const liver  = toPct(risk?.liver);
  const health = (100 - (0.4 * +heart + 0.3 * +kidney + 0.3 * +liver)).toFixed(1);

  const rows = [
    ["MetaTwin-X Patient Export"],
    ["Generated", new Date().toLocaleString()],
    ["Patient ID", patientId],
    [],
    ["=== RISK SCORES ==="],
    ["Organ", "Risk (%)", "Status"],
    ["Heart",  heart,  +heart  >= 60 ? "High" : +heart  >= 30 ? "Moderate" : "Normal"],
    ["Kidney", kidney, +kidney >= 60 ? "High" : +kidney >= 30 ? "Moderate" : "Normal"],
    ["Liver",  liver,  +liver  >= 60 ? "High" : +liver  >= 30 ? "Moderate" : "Normal"],
    ["Health Score", health, +health >= 70 ? "Good" : +health >= 40 ? "Needs Attention" : "Critical"],
    [],
    ["=== BIOMARKERS ==="],
    ["Field", "Value"],
  ];

  // Add form data fields
  if (formData) {
    const FIELD_LABELS = {
      age: "Age (years)", sex: "Sex", bmi: "BMI (kg/m²)",
      systolic_bp: "Systolic BP (mmHg)", diastolic_bp: "Diastolic BP (mmHg)",
      fasting_glucose: "Fasting Glucose (mg/dL)", hba1c: "HbA1c (%)",
      serum_creatinine: "Serum Creatinine (mg/dL)", egfr: "eGFR (mL/min)",
      alt_enzyme: "ALT (U/L)", ast_enzyme: "AST (U/L)",
      total_cholesterol: "Total Cholesterol (mg/dL)", ldl_cholesterol: "LDL (mg/dL)",
      hdl_cholesterol: "HDL (mg/dL)", triglycerides: "Triglycerides (mg/dL)",
      exercise_hours_per_week: "Exercise (h/week)", smoking_status: "Smoking",
      alcohol_units_per_week: "Alcohol (units/week)", sleep_hours: "Sleep (h/night)",
    };
    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      if (formData[key] !== undefined && formData[key] !== "") {
        rows.push([label, formData[key]]);
      }
    }
  }

  // Audit log
  if (auditLog?.length > 0) {
    rows.push([], ["=== AI AUDIT LOG ==="], ["Rule", "Effect", "Organ"]);
    for (const entry of auditLog) {
      rows.push([entry.rule || entry, entry.delta || "", entry.organ || ""]);
    }
  }

  // Serialize
  const csv = rows.map(row =>
    row.map(cell => {
      const s = String(cell ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  ).join("\n");

  // Trigger download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `metatwin-${patientId}-${ts}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
