"""Module 2: Premium Health Input — Step Wizard with live validation."""
from __future__ import annotations
import streamlit as st
from src.models.data_types import RawHealthInput

PRESETS = {
    "healthy":  dict(age=35,sex="male",bmi=23.0,systolic_bp=115,diastolic_bp=75,
                     total_cholesterol=175,hdl_cholesterol=60,ldl_cholesterol=100,
                     fasting_glucose=88,serum_creatinine=0.9,alt_enzyme=20,ast_enzyme=18,
                     daily_step_count=9000,sleep_duration=7.5,dietary_quality_score=8),
    "highrisk": dict(age=58,sex="male",bmi=32.5,systolic_bp=155,diastolic_bp=95,
                     total_cholesterol=265,hdl_cholesterol=35,ldl_cholesterol=180,
                     fasting_glucose=145,serum_creatinine=1.6,alt_enzyme=65,ast_enzyme=58,
                     daily_step_count=2500,sleep_duration=5.5,dietary_quality_score=3),
    "diabetic": dict(age=50,sex="female",bmi=29.0,systolic_bp=135,diastolic_bp=85,
                     total_cholesterol=220,hdl_cholesterol=45,ldl_cholesterol=145,
                     fasting_glucose=168,serum_creatinine=1.1,alt_enzyme=38,ast_enzyme=32,
                     daily_step_count=4000,sleep_duration=6.5,dietary_quality_score=5),
    "elderly":  dict(age=72,sex="female",bmi=26.5,systolic_bp=142,diastolic_bp=82,
                     total_cholesterol=235,hdl_cholesterol=52,ldl_cholesterol=155,
                     fasting_glucose=105,serum_creatinine=1.3,alt_enzyme=28,ast_enzyme=25,
                     daily_step_count=3500,sleep_duration=6.0,dietary_quality_score=6),
}


def _cc(val, lo, hi):
    """Clinical color."""
    if val is None: return "#6b7280"
    if lo <= val <= hi: return "#10b981"
    if val > hi * 1.2 or val < lo * 0.8: return "#ef4444"
    return "#f59e0b"


def _bmi_info(bmi):
    if bmi < 18.5: return "Underweight", "#3b82f6", 8
    if bmi < 25:   return "Normal",      "#10b981", 32
    if bmi < 30:   return "Overweight",  "#f59e0b", 62
    return              "Obese",       "#ef4444", 88


def _egfr(cr, age, sex):
    is_f = sex == "female"
    k = 0.7 if is_f else 0.9
    a = -0.329 if is_f else -0.411
    r = cr / k
    v = 141 * (min(r,1)**a) * (max(r,1)**-1.209) * (0.993**age)
    if is_f: v *= 1.018
    return max(v, 1.0)


def render_health_input(serializer=None) -> RawHealthInput | None:
    # Section header
    st.markdown("""
    <div class="section-header">
        <div class="section-icon" style="background:rgba(37,99,235,0.1);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="#2563eb" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
        </div>
        <div>
            <h2>Health Profile Input</h2>
            <p class="section-sub">Enter your biomarkers to generate your personalised digital twin</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Import + Presets row
    imp_col, pre_col = st.columns([1, 2])
    with imp_col:
        with st.expander("Import JSON Profile", expanded=False):
            st.markdown('<div style="color:#6b7280;font-size:0.75rem;margin-bottom:6px;">Upload a previously exported health profile JSON file.</div>', unsafe_allow_html=True)
            uploaded = st.file_uploader("Upload", type=["json"], label_visibility="collapsed", key="json_up")
            if uploaded and serializer:
                try:
                    profile = serializer.import_from_file(uploaded.read())
                    st.session_state["imported_profile"] = profile
                    st.success("Profile imported successfully.")
                    st.rerun()
                except Exception as e:
                    st.error(f"Import failed: {e}")

    with pre_col:
        st.markdown('<div style="color:#6b7280;font-size:0.75rem;margin-bottom:6px;">Quick-fill presets:</div>', unsafe_allow_html=True)
        pc1, pc2, pc3, pc4 = st.columns(4)
        preset = None
        with pc1:
            if st.button("Healthy",   use_container_width=True, key="p_h"): preset="healthy";  st.session_state["imported_profile"]=None
        with pc2:
            if st.button("High Risk", use_container_width=True, key="p_r"): preset="highrisk"; st.session_state["imported_profile"]=None
        with pc3:
            if st.button("Diabetic",  use_container_width=True, key="p_d"): preset="diabetic"; st.session_state["imported_profile"]=None
        with pc4:
            if st.button("Elderly",   use_container_width=True, key="p_e"): preset="elderly";  st.session_state["imported_profile"]=None

    if preset:
        st.session_state["active_preset"] = preset
    active_preset = st.session_state.get("active_preset")
    imported = st.session_state.get("imported_profile")
    base = imported.inputs if imported else None

    def d(f, default):
        if active_preset and f in PRESETS[active_preset]: return PRESETS[active_preset][f]
        if base: return getattr(base, f, default)
        return default

    # ── Tabbed form ────────────────────────────────────────────────────
    t1, t2, t3, t4, t5 = st.tabs([
        "Demographics", "Cardiovascular", "Metabolic & Organs",
        "Lifestyle", "⌚ Smartwatch"
    ])

    with t1:
        st.markdown('<div style="height:10px;"></div>', unsafe_allow_html=True)
        ca, cb, cc = st.columns([1, 1, 1.3])
        with ca:
            age = st.number_input("Age (years)", 1, 120, int(d("age", 45)), key="i_age")
            sex = st.selectbox("Biological Sex", ["male","female"],
                               index=0 if d("sex","male")=="male" else 1, key="i_sex")
        with cb:
            bmi = st.number_input("BMI (kg/m²)", 10.0, 70.0, float(d("bmi", 25.0)), step=0.1, key="i_bmi")
        with cc:
            bmi_cat, bmi_c, bmi_pct = _bmi_info(bmi)
            badge_c = "#34d399" if bmi_cat == "Normal" else "#fbbf24" if bmi_cat in ("Overweight", "Underweight") else "#f87171"
            badge_bg = "rgba(16,185,129,0.12)" if bmi_cat == "Normal" else "rgba(245,158,11,0.12)" if bmi_cat in ("Overweight", "Underweight") else "rgba(239,68,68,0.12)"
            st.markdown(f"""
            <div style="background:#0d1526;border:1px solid rgba(255,255,255,0.06);
                        border-radius:10px;padding:14px 16px;">
                <div style="color:#6b7280;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;
                            text-transform:uppercase;margin-bottom:10px;">BMI Calculator</div>
                <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px;">
                    <span style="color:{bmi_c};font-size:1.9rem;font-weight:800;">{bmi:.1f}</span>
                    <span style="color:#374151;font-size:0.8rem;">kg/m&sup2;</span>
                    <span style="background:{badge_bg};color:{badge_c};border-radius:20px;
                                 padding:2px 8px;font-size:0.65rem;font-weight:700;
                                 text-transform:uppercase;margin-left:auto;">{bmi_cat}</span>
                </div>
                <div style="height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:{bmi_pct}%;background:linear-gradient(90deg,#10b981,{bmi_c});border-radius:3px;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;color:#374151;font-size:0.62rem;margin-top:5px;">
                    <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40+</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

    with t2:
        st.markdown('<div style="height:10px;"></div>', unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        with c1:
            systolic_bp = st.number_input("Systolic BP (mmHg)", 60, 250, int(d("systolic_bp",120)), key="i_sbp")
            sc = _cc(systolic_bp, 90, 120)
            st.markdown(f'<div style="color:{sc};font-size:0.7rem;margin-top:-10px;margin-bottom:8px;">{"✓ Normal" if sc=="#10b981" else "⚠ Borderline" if sc=="#f59e0b" else "✗ High"}</div>', unsafe_allow_html=True)
            total_cholesterol = st.number_input("Total Cholesterol (mg/dL)", 50, 600, int(d("total_cholesterol",190)), key="i_chol")
            cc2 = _cc(total_cholesterol, 0, 200)
            st.markdown(f'<div style="color:{cc2};font-size:0.7rem;margin-top:-10px;margin-bottom:8px;">{"✓ Desirable" if cc2=="#10b981" else "⚠ Borderline" if cc2=="#f59e0b" else "✗ High"}</div>', unsafe_allow_html=True)
            ldl_cholesterol = st.number_input("LDL Cholesterol (mg/dL)", 10, 400, int(d("ldl_cholesterol",110)), key="i_ldl")
        with c2:
            diastolic_bp = st.number_input("Diastolic BP (mmHg)", 40, 150, int(d("diastolic_bp",80)), key="i_dbp")
            dc = _cc(diastolic_bp, 60, 80)
            st.markdown(f'<div style="color:{dc};font-size:0.7rem;margin-top:-10px;margin-bottom:8px;">{"✓ Normal" if dc=="#10b981" else "⚠ Borderline" if dc=="#f59e0b" else "✗ High"}</div>', unsafe_allow_html=True)
            hdl_cholesterol = st.number_input("HDL Cholesterol (mg/dL)", 10, 150, int(d("hdl_cholesterol",55)), key="i_hdl")
            hc = _cc(hdl_cholesterol, 40, 150)
            st.markdown(f'<div style="color:{hc};font-size:0.7rem;margin-top:-10px;margin-bottom:8px;">{"✓ Good" if hc=="#10b981" else "⚠ Low" if hc=="#f59e0b" else "✗ Very Low"}</div>', unsafe_allow_html=True)
            ratio = total_cholesterol / max(hdl_cholesterol, 1)
            rc = "#10b981" if ratio < 4 else "#f59e0b" if ratio < 5 else "#ef4444"
            st.markdown(f"""
            <div class="pm-card" style="padding:10px 12px;margin-top:4px;">
                <div class="c-label">Chol/HDL Ratio</div>
                <div style="color:{rc};font-size:1.4rem;font-weight:700;">{ratio:.1f}</div>
                <div style="color:#6b7280;font-size:0.68rem;">{'Optimal (<4)' if ratio<4 else 'Borderline (4-5)' if ratio<5 else 'High Risk (>5)'}</div>
            </div>
            """, unsafe_allow_html=True)

    with t3:
        st.markdown('<div style="height:10px;"></div>', unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        with c1:
            fasting_glucose = st.number_input("Fasting Glucose (mg/dL)", 40, 600, int(d("fasting_glucose",95)), key="i_gluc")
            gc = _cc(fasting_glucose, 70, 100)
            glbl = "✓ Normal" if fasting_glucose < 100 else "⚠ Pre-diabetic" if fasting_glucose < 126 else "✗ Diabetic range"
            st.markdown(f'<div style="color:{gc};font-size:0.7rem;margin-top:-10px;margin-bottom:8px;">{glbl}</div>', unsafe_allow_html=True)
            alt_enzyme = st.number_input("ALT Enzyme (U/L)", 1, 2000, int(d("alt_enzyme",25)), key="i_alt")
            ac = _cc(alt_enzyme, 7, 40)
            st.markdown(f'<div style="color:{ac};font-size:0.7rem;margin-top:-10px;margin-bottom:8px;">{"✓ Normal (7-40)" if ac=="#10b981" else "⚠ Mildly Elevated" if ac=="#f59e0b" else "✗ Elevated"}</div>', unsafe_allow_html=True)
        with c2:
            serum_creatinine = st.number_input("Serum Creatinine (mg/dL)", 0.1, 20.0, float(d("serum_creatinine",0.9)), step=0.01, key="i_cr")
            crc = _cc(serum_creatinine, 0.6, 1.2)
            st.markdown(f'<div style="color:{crc};font-size:0.7rem;margin-top:-10px;margin-bottom:8px;">{"✓ Normal (0.6-1.2)" if crc=="#10b981" else "⚠ Borderline" if crc=="#f59e0b" else "✗ Elevated"}</div>', unsafe_allow_html=True)
            ast_enzyme = st.number_input("AST Enzyme (U/L)", 1, 2000, int(d("ast_enzyme",22)), key="i_ast")
            asc = _cc(ast_enzyme, 10, 40)
            st.markdown(f'<div style="color:{asc};font-size:0.7rem;margin-top:-10px;margin-bottom:8px;">{"✓ Normal (10-40)" if asc=="#10b981" else "⚠ Mildly Elevated" if asc=="#f59e0b" else "✗ Elevated"}</div>', unsafe_allow_html=True)
            try:
                egfr = _egfr(serum_creatinine, age, sex)
            except Exception:
                egfr = 90.0
            ec = "#10b981" if egfr >= 90 else "#f59e0b" if egfr >= 60 else "#ef4444"
            es = "G1 Normal" if egfr >= 90 else "G2 Mildly Reduced" if egfr >= 60 else "G3 Moderately Reduced" if egfr >= 30 else "G4-5 Severely Reduced"
            st.markdown(f"""
            <div class="pm-card" style="padding:10px 12px;margin-top:4px;">
                <div class="c-label">Estimated eGFR</div>
                <div style="color:{ec};font-size:1.4rem;font-weight:700;">{egfr:.0f} <span style="font-size:0.7rem;color:#6b7280;">mL/min/1.73m²</span></div>
                <div style="color:#6b7280;font-size:0.68rem;">{es}</div>
            </div>
            """, unsafe_allow_html=True)

    with t4:
        st.markdown('<div style="height:10px;"></div>', unsafe_allow_html=True)
        st.markdown('<div style="color:#6b7280;font-size:0.78rem;margin-bottom:12px;">Optional — imputed from population medians if left blank.</div>', unsafe_allow_html=True)
        lc1, lc2, lc3 = st.columns(3)
        with lc1:
            inc_s = st.checkbox("Daily Step Count", value=True, key="cb_s")
            if inc_s:
                daily_step_count = st.number_input("Steps/day", 0, 50000, int(d("daily_step_count",7000)), key="i_steps")
                sc2 = "#10b981" if daily_step_count >= 7500 else "#f59e0b" if daily_step_count >= 5000 else "#ef4444"
                sl = "Active" if daily_step_count >= 7500 else "Moderate" if daily_step_count >= 5000 else "Sedentary"
                st.markdown(f"""
                <div class="pm-card" style="padding:8px 10px;margin-top:4px;">
                    <div class="prog-bar"><div class="prog-fill" style="width:{min(daily_step_count/150,100):.0f}%;background:{sc2};"></div></div>
                    <div style="color:{sc2};font-size:0.72rem;font-weight:600;margin-top:4px;">{sl} · {daily_step_count:,} steps</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                daily_step_count = None
        with lc2:
            inc_sl = st.checkbox("Sleep Duration", value=True, key="cb_sl")
            if inc_sl:
                sleep_duration = st.slider("Hours/night", 0.0, 12.0, float(d("sleep_duration",7.0)), 0.5, key="i_sleep")
                slc = "#10b981" if 7 <= sleep_duration <= 9 else "#f59e0b" if 6 <= sleep_duration <= 10 else "#ef4444"
                sll = "Optimal (7-9h)" if 7 <= sleep_duration <= 9 else "Suboptimal" if 6 <= sleep_duration <= 10 else "Poor"
                st.markdown(f'<div style="color:{slc};font-size:0.72rem;font-weight:600;margin-top:4px;">{sll}</div>', unsafe_allow_html=True)
            else:
                sleep_duration = None
        with lc3:
            inc_d = st.checkbox("Diet Quality Score", value=True, key="cb_d")
            if inc_d:
                dietary_quality_score = st.slider("Score (1-10)", 1, 10, int(d("dietary_quality_score",5)), key="i_diet")
                dc2 = "#10b981" if dietary_quality_score >= 7 else "#f59e0b" if dietary_quality_score >= 4 else "#ef4444"
                dl = "Excellent" if dietary_quality_score >= 8 else "Good" if dietary_quality_score >= 6 else "Fair" if dietary_quality_score >= 4 else "Poor"
                st.markdown(f"""
                <div class="pm-card" style="padding:8px 10px;margin-top:4px;">
                    <div class="prog-bar"><div class="prog-fill" style="width:{dietary_quality_score*10}%;background:{dc2};"></div></div>
                    <div style="color:{dc2};font-size:0.72rem;font-weight:600;margin-top:4px;">{dl} · {dietary_quality_score}/10</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                dietary_quality_score = None

    # ── Smartwatch tab ─────────────────────────────────────────────────
    # Initialise smartwatch variables with defaults (overridden inside tab)
    heart_rate_resting = None
    heart_rate_max     = None
    hrv_ms             = None
    spo2_pct           = None
    active_calories    = None
    stress_score       = None

    with t5:
        st.markdown("""
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;
            padding:14px 18px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;">
    <span style="font-size:1.2rem;">⌚</span>
    <div>
        <div style="color:#1d4ed8;font-size:0.86rem;font-weight:700;
                    font-family:'Inter',sans-serif;">Smartwatch / Wearable Data</div>
        <div style="color:#3b82f6;font-size:0.76rem;font-family:'Inter',sans-serif;margin-top:2px;">
            All fields are optional. If left blank, population medians are used.
            Compatible with Fitbit, Apple Watch, Garmin, Samsung Galaxy Watch.
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

        sw1, sw2, sw3 = st.columns(3)

        with sw1:
            inc_hr = st.checkbox("Heart Rate Data", value=True, key="cb_hr")
            if inc_hr:
                heart_rate_resting = st.number_input(
                    "Resting Heart Rate (bpm)", 30, 200,
                    int(d("heart_rate_resting", 68)), key="i_hr_rest"
                )
                hr_c = "#10b981" if heart_rate_resting < 70 else "#f59e0b" if heart_rate_resting < 85 else "#ef4444"
                hr_l = "Optimal (<70)" if heart_rate_resting < 70 else "Normal (70-85)" if heart_rate_resting < 85 else "Elevated (>85)"
                st.markdown(f'<div style="color:{hr_c};font-size:0.7rem;margin-top:-8px;margin-bottom:8px;">{hr_l}</div>', unsafe_allow_html=True)

                heart_rate_max = st.number_input(
                    "Max Heart Rate (bpm)", 60, 220,
                    int(d("heart_rate_max", 150)), key="i_hr_max"
                )
                hrv_ms = st.number_input(
                    "HRV — RMSSD (ms)", 5, 200,
                    int(d("hrv_ms", 42)), key="i_hrv"
                )
                hrv_c = "#10b981" if hrv_ms >= 50 else "#f59e0b" if hrv_ms >= 25 else "#ef4444"
                hrv_l = "Good (≥50ms)" if hrv_ms >= 50 else "Fair (25-50ms)" if hrv_ms >= 25 else "Low (<25ms)"
                st.markdown(f'<div style="color:{hrv_c};font-size:0.7rem;margin-top:-8px;margin-bottom:8px;">{hrv_l}</div>', unsafe_allow_html=True)
            else:
                heart_rate_resting = None
                heart_rate_max     = None
                hrv_ms             = None

        with sw2:
            inc_spo2 = st.checkbox("Blood Oxygen (SpO₂)", value=True, key="cb_spo2")
            if inc_spo2:
                spo2_pct = st.number_input(
                    "SpO₂ (%)", 80, 100,
                    int(d("spo2_pct", 98)), key="i_spo2"
                )
                spo2_c = "#10b981" if spo2_pct >= 97 else "#f59e0b" if spo2_pct >= 95 else "#ef4444"
                spo2_l = "Normal (≥97%)" if spo2_pct >= 97 else "Borderline (95-97%)" if spo2_pct >= 95 else "Low (<95%)"
                st.markdown(f'<div style="color:{spo2_c};font-size:0.7rem;margin-top:-8px;margin-bottom:8px;">{spo2_l}</div>', unsafe_allow_html=True)
            else:
                spo2_pct = None

            inc_cal = st.checkbox("Active Calories", value=True, key="cb_cal")
            if inc_cal:
                active_calories = st.number_input(
                    "Active Calories (kcal/day)", 0, 5000,
                    int(d("active_calories", 300)), key="i_cal"
                )
                cal_c = "#10b981" if active_calories >= 400 else "#f59e0b" if active_calories >= 200 else "#ef4444"
                cal_l = "Active (≥400)" if active_calories >= 400 else "Moderate (200-400)" if active_calories >= 200 else "Sedentary (<200)"
                st.markdown(f'<div style="color:{cal_c};font-size:0.7rem;margin-top:-8px;margin-bottom:8px;">{cal_l}</div>', unsafe_allow_html=True)
            else:
                active_calories = None

        with sw3:
            inc_stress = st.checkbox("Stress Score", value=True, key="cb_stress")
            if inc_stress:
                stress_score = st.slider(
                    "Stress Score (0–100)", 0, 100,
                    int(d("stress_score", 30)), key="i_stress"
                )
                st_c = "#10b981" if stress_score < 30 else "#f59e0b" if stress_score < 60 else "#ef4444"
                st_l = "Low" if stress_score < 30 else "Moderate" if stress_score < 60 else "High"
                st.markdown(f"""
<div class="pm-card" style="padding:8px 10px;margin-top:4px;">
    <div class="prog-bar">
        <div class="prog-fill" style="width:{stress_score}%;background:{st_c};"></div>
    </div>
    <div style="color:{st_c};font-size:0.72rem;font-weight:600;margin-top:4px;">
        {st_l} Stress · {stress_score}/100
    </div>
</div>
""", unsafe_allow_html=True)
            else:
                stress_score = None

        # Wearable summary card
        if any(v is not None for v in [heart_rate_resting, spo2_pct, hrv_ms]):
            st.markdown("""
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;
            padding:12px 16px;margin-top:12px;">
    <div style="color:#15803d;font-size:0.78rem;font-weight:700;
                font-family:'Inter',sans-serif;margin-bottom:4px;">
        ✅ Wearable data will be integrated into your digital twin prediction
    </div>
    <div style="color:#166534;font-size:0.74rem;font-family:'Inter',sans-serif;">
        Heart rate, HRV, SpO₂ and activity data enhance prediction accuracy
        and enable real-time physiological monitoring.
    </div>
</div>
""", unsafe_allow_html=True)

    # Submit
    st.markdown('<div style="height:14px;"></div>', unsafe_allow_html=True)
    btn_col, info_col = st.columns([1, 2])
    with btn_col:
        submitted = st.button("Analyze My Digital Twin", type="primary", use_container_width=True, key="submit_main")
    with info_col:
        st.markdown("""
<div style="color:#374151;font-size:0.76rem;padding-top:8px;line-height:1.7;
            font-family:'Inter',sans-serif;">
    Data is processed locally and never stored on any server.<br>
    Analysis completes in under 5 seconds.
</div>
""", unsafe_allow_html=True)

    if submitted:
        return RawHealthInput(
            age=int(age), sex=sex, bmi=float(bmi),
            systolic_bp=float(systolic_bp), diastolic_bp=float(diastolic_bp),
            total_cholesterol=float(total_cholesterol), hdl_cholesterol=float(hdl_cholesterol),
            ldl_cholesterol=float(ldl_cholesterol), fasting_glucose=float(fasting_glucose),
            serum_creatinine=float(serum_creatinine), alt_enzyme=float(alt_enzyme),
            ast_enzyme=float(ast_enzyme),
            daily_step_count=int(daily_step_count) if daily_step_count is not None else None,
            sleep_duration=float(sleep_duration) if sleep_duration is not None else None,
            dietary_quality_score=int(dietary_quality_score) if dietary_quality_score is not None else None,
            heart_rate_resting=int(heart_rate_resting) if heart_rate_resting is not None else None,
            heart_rate_max=int(heart_rate_max) if heart_rate_max is not None else None,
            hrv_ms=float(hrv_ms) if hrv_ms is not None else None,
            spo2_pct=float(spo2_pct) if spo2_pct is not None else None,
            active_calories=int(active_calories) if active_calories is not None else None,
            stress_score=int(stress_score) if stress_score is not None else None,
        )
    return None
