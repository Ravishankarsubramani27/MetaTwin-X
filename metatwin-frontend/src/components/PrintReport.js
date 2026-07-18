/**
 * PrintReport.js
 * Standalone printable/PDF report triggered from PatientReport
 * Opens in a new tab with clean A4-ready layout + window.print()
 */

export function printPatientReport(report) {
  if (!report) return;
  const r = report.report;
  if (!r) return;

  const s  = r.summary;
  const ra = r.risk_analysis;
  const hs = s.health_score;
  const hscol = hs >= 70 ? "#0a7c57" : hs >= 45 ? "#b7770d" : "#c0392b";

  const riskCol = (pct) =>
    pct <= 20 ? "#0a7c57" : pct <= 40 ? "#b7770d" : pct <= 60 ? "#d4660a" : pct <= 80 ? "#c0392b" : "#8e1a1a";

  const rowsHtml = (r.test_analysis || []).map((row, i) => `
    <tr style="background:${i%2===0?"#f8fbff":"#fff"}">
      <td>${row.flag || ""} ${row.what_tested || ""}</td>
      <td style="font-family:monospace">${row.input || ""}</td>
      <td>${row.what_should_happen || ""}</td>
      <td style="color:${row.status==="Normal"?"#0a7c57":row.status==="Critical"?"#c0392b":"#b7770d"};font-weight:600">${row.what_actually_happened || ""}</td>
      <td style="text-align:center;font-weight:700;color:${row.status==="Normal"?"#0a7c57":row.status==="Critical"?"#c0392b":"#b7770d"}">${row.status || ""}</td>
    </tr>`).join("");

  const clinicRecs = (r.recommendations?.clinical || []).map(x => `<li>${x}</li>`).join("");
  const lifeRecs   = (r.recommendations?.lifestyle || []).map(x => `<li>${x}</li>`).join("");
  const findings   = (r.key_findings || []).map(f => `<li style="color:${f.color||"#333"}">${f.finding}</li>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>MetaTwin-X Patient Report — ${r.patient_name || "Patient"}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#111;background:#fff;padding:24px}
  h1{font-size:20pt;color:#1e3a5f;margin-bottom:4px}
  h2{font-size:13pt;color:#1e3a5f;margin:18px 0 8px;padding-bottom:4px;border-bottom:2px solid #c8dff0}
  h3{font-size:11pt;color:#2c5282;margin:12px 0 6px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding:16px 20px;background:#eaf3fc;border-radius:8px;border-left:5px solid #1e3a5f}
  .score-box{text-align:center;background:#fff;border:2px solid ${hscol};border-radius:8px;padding:12px 20px}
  .score-num{font-size:36pt;font-weight:900;color:${hscol};line-height:1}
  table{width:100%;border-collapse:collapse;margin:8px 0;font-size:10pt}
  th{background:#dbeafe;color:#1e3a5f;padding:7px 10px;text-align:left;font-weight:700}
  td{padding:6px 10px;border-bottom:1px solid #e2ecf7}
  .risk-bar{height:8px;background:#e2ecf7;border-radius:4px;overflow:hidden;margin-top:4px}
  .risk-fill{height:100%;border-radius:4px}
  .organ-row{display:flex;gap:16px;margin:8px 0}
  .organ-card{flex:1;padding:12px;border:1px solid #ddd;border-radius:8px;border-left:4px solid}
  ul{padding-left:18px;line-height:1.8}
  .footer{margin-top:32px;padding-top:12px;border-top:1px solid #ccc;font-size:9pt;color:#999;display:flex;justify-content:space-between}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:9pt;font-weight:700}
  @media print{
    body{padding:0}
    button{display:none}
    @page{size:A4;margin:18mm 15mm}
  }
</style>
</head>
<body>

<button onclick="window.print()" style="position:fixed;top:16px;right:16px;background:#1e3a5f;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:12pt;cursor:pointer;font-weight:700;z-index:999">
  🖨️ Print / Save PDF
</button>

<!-- Header -->
<div class="header">
  <div>
    <div style="font-size:9pt;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">MetaTwin-X · AI Patient Report</div>
    <h1>${r.report_title || "Health Assessment Report"}</h1>
    <div style="margin-top:6px;color:#475569;font-size:10pt">
      Patient: <strong>${r.patient_name || "—"}</strong> &nbsp;·&nbsp;
      ID: <strong style="font-family:monospace;color:#1e3a5f">${r.patient_id || "—"}</strong> &nbsp;·&nbsp;
      ${r.generated_at || ""}
    </div>
  </div>
  <div class="score-box">
    <div style="font-size:9pt;color:#64748b;margin-bottom:4px">Health Score</div>
    <div class="score-num">${hs}</div>
    <div style="font-size:9pt;color:#888;margin-top:2px">/100</div>
    <div style="margin-top:6px">
      <span class="badge" style="background:${hs>=70?"#dcfce7":hs>=45?"#fef3c7":"#fee2e2"};color:${hscol}">
        ${s.health_status || ""}
      </span>
    </div>
  </div>
</div>

<!-- Section A: Summary -->
<h2>A. Patient Summary</h2>
<p style="line-height:1.7">${s.overall || ""}</p>
<p style="margin-top:8px">
  ${s.abnormal_count > 0
    ? `<span class="badge" style="background:#fee2e2;color:#c0392b">🚨 ${s.abnormal_count} Abnormal Finding${s.abnormal_count!==1?"s":""}</span>`
    : `<span class="badge" style="background:#dcfce7;color:#0a7c57">✅ All values normal</span>`}
  &nbsp;
  <span class="badge" style="background:#dbeafe;color:#1e3a5f">📋 ${(r.extraction_metadata?.extracted_fields||[]).length} biomarkers extracted</span>
</p>

<!-- Section B: Risk Analysis -->
<h2>B. Multi-Organ Risk Analysis</h2>
<div class="organ-row">
  ${["heart","kidney","liver"].map(organ => {
    const d = ra[organ];
    if (!d) return "";
    const ic = organ==="heart"?"❤️":organ==="kidney"?"🫘":"🟤";
    const col = riskCol(d.score);
    return `<div class="organ-card" style="border-left-color:${col}">
      <div style="font-weight:700;font-size:11pt">${ic} ${organ.charAt(0).toUpperCase()+organ.slice(1)}</div>
      <div style="font-size:18pt;font-weight:900;color:${col};font-family:monospace;margin:4px 0">${d.score?.toFixed(1)||"—"}%</div>
      <div class="risk-bar"><div class="risk-fill" style="width:${Math.min(d.score||0,100)}%;background:${col}"></div></div>
      <div style="font-size:9pt;color:#555;margin-top:6px;line-height:1.5">${d.interpretation||""}</div>
    </div>`;
  }).join("")}
</div>

<!-- Section C: Test Analysis -->
<h2>C. Structured Test Analysis</h2>
<table>
  <thead><tr>
    <th>What You Tested</th><th>Input Value</th>
    <th>What Should Happen</th><th>What Actually Happened</th><th>Status</th>
  </tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>

<!-- Section D: Key Findings -->
<h2>D. Key Findings</h2>
${findings ? `<ul>${findings}</ul>` : `<p style="color:#0a7c57;font-weight:600">✅ No critical findings — all values within acceptable range.</p>`}

<!-- Section E: Recommendations -->
<h2>E. AI-Generated Recommendations</h2>
<div style="display:flex;gap:20px">
  <div style="flex:1">
    <h3>🏥 Clinical</h3>
    <ul>${clinicRecs}</ul>
  </div>
  <div style="flex:1">
    <h3>🌿 Lifestyle</h3>
    <ul>${lifeRecs}</ul>
  </div>
</div>

<!-- Section F: Conclusion -->
<h2>F. Conclusion</h2>
<p style="line-height:1.7">${r.conclusion || ""}</p>
${hs < 40 ? `<div style="margin-top:12px;padding:12px 16px;background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;color:#c0392b;font-weight:600">⚠️ High-risk findings detected. Please consult a healthcare professional immediately.</div>` : ""}

<div class="footer">
  <span>MetaTwin-X · AI-Powered Multi-Organ Digital Health Twin</span>
  <span>Generated: ${new Date().toLocaleString()}</span>
  <span>Confidential Medical Report</span>
</div>

</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) { alert("Allow pop-ups to open the printable report."); return; }
  w.document.write(html);
  w.document.close();
  // Auto-trigger print after fonts load
  w.onload = () => setTimeout(() => w.print(), 600);
}
