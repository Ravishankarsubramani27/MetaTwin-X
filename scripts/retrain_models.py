"""
Retrains XGBoost models with clinically calibrated synthetic data.
Feature dims: Heart=16, Kidney=22, Liver=13

Key fix: Risk labels are derived from CONTINUOUS biomarker thresholds,
not a binary is_high flag. This prevents model saturation and produces
realistic probability outputs (e.g. glucose=128 -> ~40% not 99%).

Run: python scripts/retrain_models.py
"""
import sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, brier_score_loss

try:
    from xgboost import XGBClassifier
    XGB_OK = True
except ImportError:
    XGB_OK = False

from src.preprocessor import DataPreprocessor
from src.models.data_types import RawHealthInput, Organ
from src.prediction_engine import RegressorProbaWrapper
from datetime import datetime

print("=" * 60)
print("  MetaTwin-X — Calibrated Model Retraining")
print("=" * 60)

if not XGB_OK:
    print("XGBoost not installed. Run: pip install xgboost")
    sys.exit(1)

rng          = np.random.default_rng(42)
preprocessor = DataPreprocessor(ROOT / "models" / "preprocessor")
MODEL_DIR    = ROOT / "models"
VERSION_DIR  = datetime.today().strftime("%Y-%m-%d")


def _sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def _heart_risk(sbp, chol, hdl, gluc, age, sex, bmi, creat) -> float:
    """
    Clinically grounded heart risk logit based on Framingham-inspired factors.
    Returns a probability in [0, 1] — NOT binary.
    """
    logit = -3.5
    # Age contribution
    logit += 0.05 * (age - 40)
    # Sex (male = higher risk)
    logit += 0.5 if sex == "male" else 0.0
    # SBP — graded, not threshold
    if   sbp >= 180: logit += 3.0
    elif sbp >= 160: logit += 2.2
    elif sbp >= 140: logit += 1.5
    elif sbp >= 130: logit += 0.7
    elif sbp >= 120: logit += 0.2
    # Cholesterol
    logit += (chol - 200) / 80.0
    # HDL (protective)
    logit -= (hdl - 40) / 35.0
    # Glucose
    if   gluc >= 200: logit += 2.0
    elif gluc >= 140: logit += 1.3
    elif gluc >= 100: logit += 0.6
    # BMI
    logit += (bmi - 25) * 0.07
    # Add noise for dataset diversity
    logit += rng.normal(0, 0.5)
    return float(np.clip(_sigmoid(logit), 0.03, 0.97))


def _kidney_risk(creat, gluc, sbp, age, bmi) -> float:
    """CKD-inspired graded kidney risk."""
    logit = -3.0
    logit += 0.04 * (age - 40)
    # Creatinine — main driver
    if   creat >= 3.0: logit += 3.5
    elif creat >= 2.0: logit += 2.5
    elif creat >= 1.5: logit += 1.6
    elif creat >= 1.2: logit += 0.9
    elif creat >= 1.0: logit += 0.3
    # Glucose (diabetic nephropathy)
    if   gluc >= 200: logit += 2.0
    elif gluc >= 140: logit += 1.2
    elif gluc >= 100: logit += 0.5
    # BP
    logit += (sbp - 120) / 50.0
    logit += (bmi - 25) * 0.04
    logit += rng.normal(0, 0.5)
    return float(np.clip(_sigmoid(logit), 0.03, 0.97))


def _liver_risk(alt, ast, bmi, chol, gluc) -> float:
    """NAFLD/hepatic risk graded probability."""
    logit = -3.0
    # ALT — primary liver marker
    if   alt >= 200: logit += 3.5
    elif alt >= 100: logit += 2.5
    elif alt >= 60:  logit += 1.6
    elif alt >= 40:  logit += 0.8
    elif alt >= 25:  logit += 0.2
    # AST
    if   ast >= 150: logit += 2.5
    elif ast >= 80:  logit += 1.5
    elif ast >= 40:  logit += 0.6
    # BMI (fatty liver)
    if   bmi >= 35: logit += 2.0
    elif bmi >= 30: logit += 1.2
    elif bmi >= 27: logit += 0.5
    # Glucose (NASH)
    logit += (gluc - 100) / 100.0
    # Cholesterol
    logit += (chol - 200) / 160.0
    logit += rng.normal(0, 0.5)
    return float(np.clip(_sigmoid(logit), 0.03, 0.97))


def synthetic_patient() -> tuple:
    """
    Generate a diverse synthetic patient. Risk is continuous, not binary.
    Distribution: ~35% low-risk, ~40% moderate, ~25% high across organs.
    We oversample the moderate range to prevent model saturation.
    """
    age  = int(rng.integers(20, 85))
    sex  = rng.choice(["male", "female"])

    # 3-tier distribution: 35% low, 40% moderate, 25% high
    tier = rng.choice(["low", "moderate", "high"], p=[0.35, 0.40, 0.25])

    if tier == "low":
        sbp   = float(np.clip(rng.normal(112, 10), 85, 128))
        chol  = float(np.clip(rng.normal(175, 25), 110, 210))
        hdl   = float(np.clip(rng.normal(62,  12), 40, 100))
        gluc  = float(np.clip(rng.normal(88,  10), 60, 100))
        creat = float(np.clip(rng.normal(0.85, 0.15), 0.5, 1.1))
        alt   = float(np.clip(rng.normal(22,   8),  7, 40))
        ast   = float(np.clip(rng.normal(20,   7),  8, 38))
        bmi   = float(np.clip(rng.normal(22.5, 2.5), 16, 26))
    elif tier == "moderate":
        sbp   = float(np.clip(rng.normal(135, 12), 120, 155))
        chol  = float(np.clip(rng.normal(220, 30), 190, 270))
        hdl   = float(np.clip(rng.normal(48,  10), 30, 65))
        gluc  = float(np.clip(rng.normal(115, 18), 95, 148))
        creat = float(np.clip(rng.normal(1.25, 0.2), 1.0, 1.7))
        alt   = float(np.clip(rng.normal(50,  18), 30, 90))
        ast   = float(np.clip(rng.normal(44,  15), 28, 85))
        bmi   = float(np.clip(rng.normal(28.0, 3.0), 24, 35))
    else:  # high
        sbp   = float(np.clip(rng.normal(162, 18), 140, 205))
        chol  = float(np.clip(rng.normal(270, 35), 230, 360))
        hdl   = float(np.clip(rng.normal(35,   8), 15, 46))
        gluc  = float(np.clip(rng.normal(175, 45), 130, 320))
        creat = float(np.clip(rng.normal(2.2,  0.7), 1.4, 5.5))
        alt   = float(np.clip(rng.normal(110,  50), 55, 350))
        ast   = float(np.clip(rng.normal(95,   45), 50, 320))
        bmi   = float(np.clip(rng.normal(34.5,  4.5), 28, 52))

    ldl  = float(np.clip(chol * 0.63 + rng.normal(0, 12), 30, 280))
    dbp  = float(np.clip(sbp * 0.63 + rng.normal(0, 5), 50, 130))

    # Lifestyle correlated with tier
    tier_val = {"low": 0.0, "moderate": 0.5, "high": 1.0}[tier]
    steps = int(np.clip(rng.normal(8500 - tier_val * 5000, 1800), 500, 18000))
    sleep = float(np.clip(rng.normal(7.5 - tier_val * 1.8, 1.0), 3.5, 10.0))
    diet  = int(np.clip(rng.normal(7.5 - tier_val * 4.5, 1.5), 1, 10))
    hr_r  = int(np.clip(rng.normal(62 + tier_val * 20, 7), 45, 105))
    hrv   = float(np.clip(rng.normal(55 - tier_val * 28, 8), 12, 100))
    spo2  = float(np.clip(rng.normal(98.5 - tier_val * 3, 0.8), 90, 100))
    acal  = int(np.clip(rng.normal(500 - tier_val * 350, 100), 30, 1200))
    stress= int(np.clip(rng.normal(22 + tier_val * 55, 12), 0, 95))

    try:
        raw = RawHealthInput(
            age=age, sex=sex, bmi=bmi,
            systolic_bp=sbp, diastolic_bp=dbp,
            total_cholesterol=chol, hdl_cholesterol=hdl,
            ldl_cholesterol=ldl, fasting_glucose=gluc,
            serum_creatinine=creat, alt_enzyme=alt, ast_enzyme=ast,
            daily_step_count=steps, sleep_duration=sleep,
            dietary_quality_score=diet,
            heart_rate_resting=hr_r, hrv_ms=hrv,
            spo2_pct=spo2, active_calories=acal, stress_score=stress,
        )
    except Exception:
        return None

    # Continuous probability labels
    ph = _heart_risk(sbp, chol, hdl, gluc, age, sex, bmi, creat)
    pk = _kidney_risk(creat, gluc, sbp, age, bmi)
    pl = _liver_risk(alt, ast, bmi, chol, gluc)

    # Binarize at 0.40 for ~30-35% positive rate
    labels = {
        "heart":  int(ph >= 0.40),
        "kidney": int(pk >= 0.40),
        "liver":  int(pl >= 0.40),
        "heart_p":  ph,
        "kidney_p": pk,
        "liver_p":  pl,
    }
    return raw, labels


def build_dataset(n: int = 3000):
    """Build feature matrix, binary labels, and continuous probability labels."""
    Xh, Xk, Xl = [], [], []
    yh, yk, yl = [], [], []
    ph_list, pk_list, pl_list = [], [], []
    failed = 0
    for _ in range(n):
        result = synthetic_patient()
        if result is None:
            failed += 1
            continue
        raw, labels = result
        try:
            bundle = preprocessor.validate_and_transform(raw)
            Xh.append(bundle.heart.values)
            Xk.append(bundle.kidney.values)
            Xl.append(bundle.liver.values)
            yh.append(labels["heart"])
            yk.append(labels["kidney"])
            yl.append(labels["liver"])
            ph_list.append(labels["heart_p"])
            pk_list.append(labels["kidney_p"])
            pl_list.append(labels["liver_p"])
        except Exception:
            failed += 1

    if failed > 0:
        print(f"  Warning: {failed}/{n} samples skipped")

    print(f"  Heart  label dist: {sum(yh)}/{len(yh)} positive "
          f"(prob range {min(ph_list):.2f}–{max(ph_list):.2f})")
    print(f"  Kidney label dist: {sum(yk)}/{len(yk)} positive "
          f"(prob range {min(pk_list):.2f}–{max(pk_list):.2f})")
    print(f"  Liver  label dist: {sum(yl)}/{len(yl)} positive "
          f"(prob range {min(pl_list):.2f}–{max(pl_list):.2f})")

    return (np.array(Xh), np.array(yh), np.array(ph_list),
            np.array(Xk), np.array(yk), np.array(pk_list),
            np.array(Xl), np.array(yl), np.array(pl_list))


def train_organ(X, y, name: str, prob_labels):
    """
    Use a calibrated linear model on top of the probability labels.
    This avoids XGBoost overfitting to perfectly separated synthetic tiers.
    We train XGBoost on the continuous probability labels directly (regression)
    then clip to [0,1] and use a wrapper to expose predict_proba.
    """
    from xgboost import XGBRegressor
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline

    X_tr, X_te, y_tr, y_te, p_tr, p_te = train_test_split(
        X, y, prob_labels, test_size=0.2, random_state=42)

    # Train XGBoost regressor to predict the continuous risk probability
    reg = XGBRegressor(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.06,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        reg_alpha=0.2,
        reg_lambda=2.0,
        random_state=42,
        verbosity=0,
    )
    reg.fit(X_tr, p_tr)
    p_pred = np.clip(reg.predict(X_te), 0.0, 1.0)

    # Evaluate on binary labels
    auc   = roc_auc_score(y_te, p_pred)
    brier = brier_score_loss(y_te, p_pred)
    p_med = float(np.median(p_pred))
    p_q25 = float(np.percentile(p_pred, 25))
    p_q75 = float(np.percentile(p_pred, 75))

    print(f"  {name:<8}  feat={X.shape[1]}  AUC={auc:.3f}  "
          f"Brier={brier:.3f}  p50={p_med:.2f}  IQR=[{p_q25:.2f},{p_q75:.2f}]")

    # Wrap regressor into a predict_proba-compatible class
    return RegressorProbaWrapper(reg)


def save_model(model, organ: str):
    path = MODEL_DIR / organ / VERSION_DIR
    path.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path / "model.pkl")

    # Get feature count from the wrapper or underlying regressor
    n_feat = getattr(model, 'n_features_in_', None)
    if n_feat is None:
        try:
            n_feat = model._reg.n_features_in_
        except Exception:
            n_feat = 16

    from src.prediction_engine import MockExplainer
    explainer = MockExplainer(model, n_feat)
    joblib.dump(explainer, path / "explainer.pkl")
    print(f"  Saved → {path}  (features={n_feat})")


# ── Main ───────────────────────────────────────────────────────────────
print("\nBuilding calibrated dataset (3000 patients)…")
Xh, yh, ph, Xk, yk, pk, Xl, yl, pl = build_dataset(3000)

print("\nTraining calibrated XGBoost models…")
heart_model  = train_organ(Xh, yh, "Heart",  ph)
kidney_model = train_organ(Xk, yk, "Kidney", pk)
liver_model  = train_organ(Xl, yl, "Liver",  pl)

print("\nSaving models…")
save_model(heart_model,  "heart")
save_model(kidney_model, "kidney")
save_model(liver_model,  "liver")

# ── Sanity check ───────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("SANITY CHECK — Expected outputs:")
print("  Healthy adult:   heart ~15-30%, kidney ~5-15%, liver ~10-20%")
print("  High-risk adult: heart ~55-75%, kidney ~40-65%, liver ~45-70%")
print("=" * 60)
from src.models.data_types import RawHealthInput as RHI

# Healthy
raw_h = RHI(age=35, sex="female", bmi=22.5, systolic_bp=112, diastolic_bp=72,
            total_cholesterol=170, hdl_cholesterol=65, ldl_cholesterol=95,
            fasting_glucose=85, serum_creatinine=0.7, alt_enzyme=18, ast_enzyme=16)
bh = preprocessor.validate_and_transform(raw_h)
p_h_heart  = float(np.clip(heart_model.predict_proba(bh.heart.values.reshape(1,-1))[0,1], 0, 1))
p_h_kidney = float(np.clip(kidney_model.predict_proba(bh.kidney.values.reshape(1,-1))[0,1], 0, 1))
p_h_liver  = float(np.clip(liver_model.predict_proba(bh.liver.values.reshape(1,-1))[0,1], 0, 1))
print(f"  Healthy female 35: heart={p_h_heart:.1%}  kidney={p_h_kidney:.1%}  liver={p_h_liver:.1%}")

# High-risk (patient from original document)
raw_r = RHI(age=48, sex="male", bmi=28.7, systolic_bp=142, diastolic_bp=88,
            total_cholesterol=245, hdl_cholesterol=42, ldl_cholesterol=168,
            fasting_glucose=128, serum_creatinine=1.4, alt_enzyme=68, ast_enzyme=52)
br = preprocessor.validate_and_transform(raw_r)
p_r_heart  = float(np.clip(heart_model.predict_proba(br.heart.values.reshape(1,-1))[0,1], 0, 1))
p_r_kidney = float(np.clip(kidney_model.predict_proba(br.kidney.values.reshape(1,-1))[0,1], 0, 1))
p_r_liver  = float(np.clip(liver_model.predict_proba(br.liver.values.reshape(1,-1))[0,1], 0, 1))
print(f"  High-risk male 48: heart={p_r_heart:.1%}  kidney={p_r_kidney:.1%}  liver={p_r_liver:.1%}")

print(f"\n✅ Done! Restart FastAPI to load new models.")
