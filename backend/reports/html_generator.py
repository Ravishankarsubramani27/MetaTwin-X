"""
MetaTwin-X — HTML Report Generator
Converts structured report dict → professional print-ready HTML
Designed for browser print-to-PDF or wkhtmltopdf
"""
from __future__ import annotations
from typing import Dict, Any


def generate_html_report(report: dict) -> str:
    p     = report
    s     = p["summary"]
    ra    = p["risk_analysis"]
    tests = p["test_analysis"]
    recs  = p["recommendations"]
    meta  = p["extraction_metadata"]
    hs    = s["health_score"]
    hs_color = "#10b981" if hs >= 70 else "#f59e0b" if hs >= 45 else "#ef4444"

    # ── Test analysis rows ──────────────────────────────────────────────
    test_rows = ""
    for i, row in enumerate(tests):
        bg = "#fff9f9" if row["status"] == "Critical" else \
             "#fffbeb" if row["status"] == "Elevated" else \
             "#f0fdf4" if row["status"] == "Normal" else "#fafafa"
        test_rows += f"""
        <tr style="background:{bg};">
          <td style="padding:10px 12px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">
            {row['flag']} {row['what_tested']}
          </td>
          <td style="padding:10px 12px;font-family:monospace;color:#374151;border-bottom:1px solid #f1f5f9;">
            {row['input']}
          </td>
          <td style="padding:10px 12px;color:#475569;border-bottom:1px solid #f1f5f9;font-size:12px;">
            {row['what_should_happen']}
          </td>
          <td style="padding:10px 12px;color:{row['color']};font-weight:600;border-bottom:1px solid #f1f5f9;font-size:12px;">
            {row['what_actually_happened']}
          </td>
          <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #f1f5f9;">
            <span style="background:{row['color']}18;color:{row['color']};
                         border:1px solid {row['color']}44;border-radius:12px;
                         padding:3px 10px;font-size:11px;font-weight:700;">
              {row['status']}
            </span>
          </td>
        </tr>"""

    # ── Key findings ────────────────────────────────────────────────────
    findings_html = ""
    for f in (p.get("key_findings") or []):
        findings_html += f"""
        <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;
                    background:{f['color']}0d;border-left:4px solid {f['color']};
                    border-radius:0 8px 8px 0;margin-bottom:8px;">
          <span style="color:{f['color']};font-weight:700;font-size:13px;flex-shrink:0;">
            {'🚨' if f['severity']=='Critical' else '⚠️'}
          </span>
          <span style="color:#374151;font-size:13px;line-height:1.6;">{f['finding']}</span>
        </div>"""
    if not findings_html:
        findings_html = '<p style="color:#10b981;font-weight:600;">✅ No critical findings — all values within acceptable range.</p>'

    # ── Recommendations ──────────────────────────────────────────────────
    def rec_items(items, color, icon):
        out = ""
        for item in items:
            out += f'<li style="padding:6px 0;color:#374151;font-size:13px;line-height:1.6;border-bottom:1px solid #f8fafc;">{icon} {item}</li>'
        return out

    # ── Organ risk cards ─────────────────────────────────────────────────
    def organ_card(name, icon, data):
        return f"""
        <div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-top:4px solid {data['color']};
                    border-radius:12px;padding:18px;text-align:center;min-width:140px;">
          <div style="font-size:28px;margin-bottom:6px;">{icon}</div>
          <div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;
                      letter-spacing:0.1em;margin-bottom:8px;">{name} Risk</div>
          <div style="font-size:32px;font-weight:900;color:{data['color']};line-height:1;">{data['score']}%</div>
          <div style="margin-top:8px;">
            <span style="background:{data['color']}18;color:{data['color']};border-radius:20px;
                         padding:4px 12px;font-size:11px;font-weight:700;text-transform:uppercase;">
              {data['label']}
            </span>
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:8px;line-height:1.5;">
            {data['interpretation']}
          </div>
        </div>"""

    confidence_color = "#10b981" if meta["confidence"] >= 0.7 else "#f59e0b" if meta["confidence"] >= 0.4 else "#ef4444"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MetaTwin-X Patient Report — {p['patient_id']}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    * {{ box-sizing:border-box; margin:0; padding:0; }}
    body {{
      font-family:'Inter',-apple-system,sans-serif;
      background:#f8fafc; color:#0f172a;
      padding:40px 32px;
    }}
    @media print {{
      body {{ padding:0; background:#fff; }}
      .no-print {{ display:none !important; }}
      .page-break {{ page-break-before:always; }}
      @page {{ margin:20mm 15mm; }}
    }}
    .section {{
      background:#fff; border:1px solid #e2e8f0; border-radius:14px;
      padding:24px 28px; margin-bottom:24px;
      box-shadow:0 1px 6px rgba(0,0,0,0.05);
    }}
    .section-title {{
      font-size:16px; font-weight:800; color:#0f172a;
      margin-bottom:16px; padding-bottom:10px;
      border-bottom:2px solid #f1f5f9;
      display:flex; align-items:center; gap:8px;
    }}
    .section-title::before {{
      content:''; display:inline-block; width:4px; height:20px;
      background:#2563eb; border-radius:2px;
    }}
    table {{ width:100%; border-collapse:collapse; }}
    th {{
      background:#f8fafc; padding:10px 12px; text-align:left;
      font-size:11px; font-weight:700; text-transform:uppercase;
      letter-spacing:0.08em; color:#64748b;
      border-bottom:2px solid #e2e8f0;
    }}
    h1,h2,h3 {{ font-family:'Inter',sans-serif; }}
  </style>
</head>
<body>

<!-- ══ PRINT BUTTON ══ -->
<div class="no-print" style="text-align:right;margin-bottom:20px;">
  <button onclick="window.print()" style="
    background:#2563eb;color:#fff;border:none;border-radius:8px;
    padding:12px 28px;font-size:14px;font-weight:700;cursor:pointer;
    box-shadow:0 4px 12px rgba(37,99,235,0.3);font-family:'Inter',sans-serif;">
    🖨️ Print / Save as PDF
  </button>
</div>

<!-- ══ HEADER ══ -->
<div class="section" style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%);border:none;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
    <div>
      <div style="color:rgba(255,255,255,0.6);font-size:10px;font-weight:700;
                  text-transform:uppercase;letter-spacing:0.15em;margin-bottom:6px;">
        MetaTwin-X · AI Health Twin Platform
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:900;margin-bottom:4px;letter-spacing:-0.02em;">
        {p['report_title']}
      </h1>
      <div style="color:rgba(255,255,255,0.65);font-size:13px;">
        Patient: <strong style="color:#fff;">{p['patient_name']}</strong> &nbsp;·&nbsp;
        ID: <strong style="color:#38bdf8;font-family:monospace;">{p['patient_id']}</strong>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="color:rgba(255,255,255,0.5);font-size:10px;margin-bottom:4px;">Generated</div>
      <div style="color:#fff;font-size:12px;font-weight:600;">{p['generated_at']}</div>
      <div style="margin-top:12px;">
        <span style="background:rgba(255,255,255,0.1);color:#fff;border-radius:8px;
                     padding:6px 14px;font-size:11px;font-weight:700;">
          Extraction Confidence: <span style="color:{confidence_color};">{meta['confidence']*100:.0f}%</span>
        </span>
      </div>
    </div>
  </div>
</div>

<!-- ══ SECTION A: SUMMARY ══ -->
<div class="section">
  <div class="section-title">A. Patient Summary</div>
  <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;">
    <div style="text-align:center;min-width:120px;">
      <div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;
                  letter-spacing:0.1em;margin-bottom:6px;">Overall Health Score</div>
      <div style="font-size:56px;font-weight:900;line-height:1;color:{hs_color};">{hs}</div>
      <div style="color:#64748b;font-size:12px;">out of 100</div>
      <div style="margin-top:8px;">
        <span style="background:{hs_color}18;color:{hs_color};border-radius:20px;
                     padding:4px 14px;font-size:12px;font-weight:700;">{s['health_status']}</span>
      </div>
    </div>
    <div style="flex:1;min-width:250px;">
      <p style="color:#374151;font-size:14px;line-height:1.8;">{s['overall']}</p>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
        {'<span style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;">🚨 ' + str(s['abnormal_count']) + ' Abnormal Finding' + ('s' if s['abnormal_count']!=1 else '') + '</span>' if s['abnormal_count'] > 0 else '<span style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;">✅ All values normal</span>'}
        <span style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;border-radius:8px;
                     padding:6px 12px;font-size:12px;font-weight:600;">
          📋 {len(meta['extracted_fields'])} biomarkers extracted
        </span>
      </div>
    </div>
  </div>
</div>

<!-- ══ SECTION B: RISK ANALYSIS ══ -->
<div class="section">
  <div class="section-title">B. Multi-Organ Risk Analysis</div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
    {organ_card("Heart",  "❤️", ra["heart"])}
    {organ_card("Kidney", "🫘", ra["kidney"])}
    {organ_card("Liver",  "🟤", ra["liver"])}
  </div>
  <div style="background:#f8fafc;border-radius:8px;padding:14px 16px;font-size:12px;color:#64748b;line-height:1.7;">
    <strong style="color:#0f172a;">AI Interpretation:</strong> The multi-organ risk model uses
    XGBoost regression trained on 3,000 calibrated patients (AUC 0.986–0.991).
    Scores reflect the probability of organ dysfunction based on provided biomarkers.
    Cross-organ interaction rules (cardiorenal syndrome, diabetic nephropathy, NAFLD-CVD axis)
    are applied to reflect real-world organ interdependencies.
  </div>
</div>

<!-- ══ SECTION C: TEST ANALYSIS TABLE ══ -->
<div class="section">
  <div class="section-title">C. Structured Test Analysis</div>
  <div style="overflow-x:auto;">
    <table>
      <thead>
        <tr>
          <th style="width:18%;">What You Tested</th>
          <th style="width:14%;">Input Value</th>
          <th style="width:28%;">What Should Happen</th>
          <th style="width:30%;">What Actually Happened</th>
          <th style="width:10%;text-align:center;">Status</th>
        </tr>
      </thead>
      <tbody>
        {test_rows}
      </tbody>
    </table>
  </div>
</div>

<!-- ══ SECTION D: KEY FINDINGS ══ -->
<div class="section">
  <div class="section-title">D. Key Findings</div>
  {findings_html}
</div>

<!-- ══ SECTION E: RECOMMENDATIONS ══ -->
<div class="section">
  <div class="section-title">E. AI-Generated Recommendations</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex-wrap:wrap;">
    <div>
      <div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:10px;
                  display:flex;align-items:center;gap:6px;">
        🏥 Clinical Recommendations
      </div>
      <ul style="list-style:none;padding:0;background:#fef2f2;border-radius:8px;
                 padding:12px 14px;border:1px solid #fecaca;">
        {rec_items(recs['clinical'], '#dc2626', '→')}
      </ul>
    </div>
    <div>
      <div style="font-size:13px;font-weight:700;color:#059669;margin-bottom:10px;
                  display:flex;align-items:center;gap:6px;">
        🌿 Lifestyle Recommendations
      </div>
      <ul style="list-style:none;padding:0;background:#f0fdf4;border-radius:8px;
                 padding:12px 14px;border:1px solid #bbf7d0;">
        {rec_items(recs['lifestyle'], '#059669', '✓')}
      </ul>
    </div>
  </div>
</div>

<!-- ══ SECTION F: CONCLUSION ══ -->
<div class="section">
  <div class="section-title">F. Conclusion</div>
  <p style="color:#374151;font-size:14px;line-height:1.8;">{p['conclusion']}</p>
  {'<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-top:14px;color:#dc2626;font-size:13px;font-weight:600;">⚠️ High-risk findings detected. Please consult a healthcare professional immediately.</div>' if hs < 40 else ''}
</div>

<!-- ══ FOOTER ══ -->
<div style="text-align:center;padding:20px;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;">
  <strong style="color:#2563eb;">MetaTwin-X</strong> — AI-Powered Digital Health Twin Platform &nbsp;|&nbsp;
  Report ID: {p['patient_id']}-{p['generated_at'].replace(' ','').replace(',','').replace(':','')} &nbsp;|&nbsp;
  <em>This report is AI-generated for informational purposes. Always consult a qualified physician.</em>
</div>

</body>
</html>"""
    return html
