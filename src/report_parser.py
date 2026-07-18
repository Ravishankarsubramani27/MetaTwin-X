"""
Medical Report Parser — OCR/Text Extraction + NLP/Regex Data Structuring.
Handles Metatwin Hospital format and standard lab report formats.
"""
from __future__ import annotations
import re
import io
import logging
from dataclasses import dataclass, field
from typing import Optional

log = logging.getLogger("metatwin-x.report_parser")


@dataclass
class ExtractionResult:
    raw_text: str = ""
    # ── Patient identity (auto-extracted from document) ──────────────
    patient_name: Optional[str] = None
    patient_id:   Optional[str] = None
    patient_age_str: Optional[str] = None   # raw string e.g. "48 Years"
    report_date:  Optional[str] = None
    lab_name:     Optional[str] = None
    doctor_name:  Optional[str] = None
    # ── Biomarkers ───────────────────────────────────────────────────
    age:   Optional[float] = None
    sex:   Optional[str]   = None
    bmi:   Optional[float] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    systolic_bp:       Optional[float] = None
    diastolic_bp:      Optional[float] = None
    total_cholesterol: Optional[float] = None
    hdl_cholesterol:   Optional[float] = None
    ldl_cholesterol:   Optional[float] = None
    fasting_glucose:   Optional[float] = None
    hba1c:             Optional[float] = None
    serum_creatinine:  Optional[float] = None
    urea:              Optional[float] = None
    alt_enzyme:        Optional[float] = None
    ast_enzyme:        Optional[float] = None
    ggt:               Optional[float] = None
    bilirubin:         Optional[float] = None
    daily_step_count:      Optional[int]   = None
    sleep_duration:        Optional[float] = None
    dietary_quality_score: Optional[int]   = None
    confidence: float = 0.0
    warnings: list[str] = field(default_factory=list)
    extracted_fields: list[str] = field(default_factory=list)


def _try_float(s: str) -> Optional[float]:
    try:
        return float(str(s).replace(",", ".").strip())
    except (ValueError, AttributeError, TypeError):
        return None


def _first_match(text: str, patterns: list[str]) -> Optional[float]:
    """Try each pattern, return first successful float match."""
    for pat in patterns:
        try:
            m = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
            if m:
                # feet'inches special case
                if len(m.groups()) >= 2 and m.group(2) is not None:
                    try:
                        feet = float(m.group(1))
                        inches = float(m.group(2))
                        return round(feet * 30.48 + inches * 2.54, 1)
                    except Exception:
                        pass
                val = _try_float(m.group(1))
                if val is not None:
                    return val
        except Exception:
            continue
    return None


def _extract_sex(text: str) -> Optional[str]:
    # Metatwin format: "48 Years | Male" or "AGE / SEX 48 Years | Male"
    patterns = [
        r"\|\s*(male|female)",
        r"(?:sex|gender)[:\s/|]+([mf](?:ale)?)",
        r"\b(male|female)\b",
        r"(\d{1,3})\s*(?:yr|year|yrs)[^\n]*\|\s*(male|female)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            # Get last group that has content
            for g in reversed(m.groups()):
                if g:
                    v = g.lower().strip()
                    if v.startswith("m"): return "male"
                    if v.startswith("f"): return "female"
    return None


# ── Patient identity extraction ────────────────────────────────────────────
def _extract_patient_name(text: str) -> Optional[str]:
    """
    Extract patient name from common lab report formats:
    - "Patient Name: John Smith"
    - "Name: Mr. John Smith"
    - "Patient : JOHN SMITH"
    - "PATIENT INFORMATION\nName John Smith"
    - Metatwin: "Patient Name  Rajesh Kumar"
    """
    patterns = [
        r"patient\s*name\s*[:\-|]?\s*([A-Za-z][A-Za-z\s\.]{2,40}?)(?:\n|$|\||\d)",
        r"(?:^|\n)\s*name\s*[:\-|]\s*(?:mr\.?|mrs\.?|ms\.?|dr\.?)?\s*([A-Za-z][A-Za-z\s\.]{2,40}?)(?:\n|$|\||\d)",
        r"patient\s*[:\-]\s*(?:mr\.?|mrs\.?|ms\.?|dr\.?)?\s*([A-Za-z][A-Za-z\s\.]{2,35}?)(?:\n|$|\|)",
        r"(?:name|patient)\s+(?:mr\.?|mrs\.?|ms\.?|dr\.?)?\s*([A-Z][A-Z\s\.]{2,35})(?:\n|$|\s{2,}|\|)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
        if m:
            name = m.group(1).strip()
            # Filter out field names, numbers, known non-name words
            skip = {"date", "age", "sex", "id", "ref", "test", "result",
                    "normal", "value", "unit", "status", "report", "lab"}
            words = name.split()
            if 1 <= len(words) <= 5 and not any(w.lower() in skip for w in words):
                # Title-case the name
                return " ".join(w.capitalize() for w in words)
    return None


def _extract_patient_id(text: str) -> Optional[str]:
    """
    Extract patient/lab ID:
    - "Patient ID: P-2024-001"
    - "Lab No: LAB123456"
    - "Sample ID: S-98765"
    - "PID: MT-001"
    - "Registration No: 2024-REG-001"
    """
    patterns = [
        r"(?:patient\s*id|pid|patient\s*no)[:\s#]+([A-Z0-9][-A-Z0-9_/]{2,20})",
        r"(?:lab\s*(?:no|number|id)|sample\s*(?:id|no))[:\s#]+([A-Z0-9][-A-Z0-9_/]{2,20})",
        r"(?:reg(?:istration)?\s*(?:no|number|id))[:\s#]+([A-Z0-9][-A-Z0-9_/]{2,20})",
        r"(?:accession|specimen|ref)\s*(?:no|id|number)?[:\s#]+([A-Z0-9][-A-Z0-9_/]{2,20})",
        r"(?:uhid|mrn|cr\s*no)[:\s#]+([A-Z0-9][-A-Z0-9_/]{2,20})",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(1).strip().upper()
    return None


def _extract_report_date(text: str) -> Optional[str]:
    """Extract report/collection date."""
    patterns = [
        r"(?:report\s*date|date\s*of\s*report|collected\s*on|date)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
        r"(?:report\s*date|date\s*of\s*report|collected\s*on|date)[:\s]+(\d{1,2}\s+\w+\s+\d{4})",
        r"(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
        r"(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def _extract_doctor_name(text: str) -> Optional[str]:
    """Extract referring/consulting doctor name."""
    patterns = [
        r"(?:ref(?:erring|erred)?\s*(?:by|doctor|physician|dr)|consultant)[:\s]+(?:dr\.?\s+)?([A-Za-z][A-Za-z\s\.]{2,35}?)(?:\n|$|\|)",
        r"(?:dr\.)\s+([A-Za-z][A-Za-z\s\.]{2,30})(?:\n|$|\|)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
        if m:
            name = m.group(1).strip()
            if 1 <= len(name.split()) <= 4:
                return " ".join(w.capitalize() for w in name.split())
    return None


def _generate_patient_id(name: Optional[str], date: Optional[str]) -> str:
    """Generate a deterministic patient ID when none is found in the document."""
    import hashlib, time
    seed = f"{name or 'ANON'}-{date or str(int(time.time()))}"
    h = hashlib.md5(seed.encode()).hexdigest()[:6].upper()
    return f"PT-{h}"


# ── Comprehensive pattern library ─────────────────────────────────────────
# Handles both "PARAM VALUE" table format (Metatwin) and "PARAM: VALUE" format
FIELD_PATTERNS: dict[str, list[str]] = {

    "age": [
        # Metatwin: "48 Years | Male"
        r"(\d{1,3})\s*years?\s*\|",
        r"age\s*/\s*sex[^\n]*?(\d{1,3})\s*years?",
        r"\bage[:\s]+(\d{1,3})\s*(?:yr|year|yrs)?",
        r"(\d{1,3})\s*(?:yr|year|yrs)\b",
    ],

    "bmi": [
        # Metatwin table: "BMI 28.7 18.5 – 24.9 kg/m2 HIGH"
        r"bmi\s+(\d{1,2}\.\d{1,2})\s+\d",
        r"bmi[:\s]+(\d{1,2}(?:\.\d{1,2})?)",
        r"body\s*mass\s*index[:\s]+(\d{1,2}(?:\.\d{1,2})?)",
    ],

    "weight_kg": [
        r"weight\s+(\d{2,3}(?:\.\d)?)\s+[—\-]",
        r"weight[:\s]+(\d{2,3}(?:\.\d{1,2})?)\s*(?:kg|kgs)",
    ],

    "height_cm": [
        r"height\s+(\d{2,3}(?:\.\d)?)\s+[—\-]",
        r"height[:\s]+(\d{2,3}(?:\.\d{1,2})?)\s*(?:cm|cms)",
        r"height[:\s]+(\d)\s*['\u2019]\s*(\d{1,2})\s*[\"''\u201d]?",
    ],

    "systolic_bp": [
        # Metatwin: "Blood Pressure 142 / 88"
        r"blood\s*pressure\s+(\d{2,3})\s*/\s*\d{2,3}",
        r"(?:bp|b\.p\.)[:\s]+(\d{2,3})\s*/\s*\d{2,3}",
        r"systolic[:\s]+(\d{2,3})",
        r"(\d{2,3})\s*/\s*\d{2,3}\s*mmhg",
        r"(\d{2,3})\s*/\s*\d{2,3}\s*<\s*120",
    ],

    "diastolic_bp": [
        r"blood\s*pressure\s+\d{2,3}\s*/\s*(\d{2,3})",
        r"(?:bp|b\.p\.)[:\s]+\d{2,3}\s*/\s*(\d{2,3})",
        r"diastolic[:\s]+(\d{2,3})",
        r"\d{2,3}\s*/\s*(\d{2,3})\s*mmhg",
        r"\d{2,3}\s*/\s*(\d{2,3})\s*<\s*120",
    ],

    "total_cholesterol": [
        # Metatwin: "Total Cholesterol 245 < 200 mg/dL HIGH"
        r"total\s*cholesterol\s+(\d{2,3}(?:\.\d{1,2})?)\s+[<>]",
        r"total\s*cholesterol[:\s]+(\d{2,3}(?:\.\d{1,2})?)",
        r"(?:^|\s)cholesterol\s+(\d{2,3}(?:\.\d{1,2})?)\s+[<>]",
        r"t\.?\s*chol(?:esterol)?[:\s]+(\d{2,3}(?:\.\d{1,2})?)",
    ],

    "hdl_cholesterol": [
        # Metatwin: "HDL Cholesterol 42 > 40 mg/dL NORMAL"
        r"hdl\s*cholesterol\s+(\d{2,3}(?:\.\d{1,2})?)\s+[<>]",
        r"hdl[:\s-]+(?:cholesterol)?[:\s]+(\d{2,3}(?:\.\d{1,2})?)",
        r"hdl\s+(\d{2,3}(?:\.\d{1,2})?)\s+[<>]",
    ],

    "ldl_cholesterol": [
        # Metatwin: "LDL Cholesterol 168 < 100 mg/dL HIGH"
        r"ldl\s*cholesterol\s+(\d{2,3}(?:\.\d{1,2})?)\s+[<>]",
        r"ldl[:\s-]+(?:cholesterol)?[:\s]+(\d{2,3}(?:\.\d{1,2})?)",
        r"ldl\s+(\d{2,3}(?:\.\d{1,2})?)\s+[<>]",
    ],

    "fasting_glucose": [
        # Metatwin: "Blood Glucose (Fasting) 128 70 – 99 mg/dL HIGH"
        r"blood\s*glucose\s*\(?fasting\)?\s+(\d{2,3}(?:\.\d{1,2})?)\s+\d",
        r"fasting\s*(?:blood\s*)?glucose[:\s]+(\d{2,3}(?:\.\d{1,2})?)",
        r"(?:fbs|fbg)[:\s]+(\d{2,3}(?:\.\d{1,2})?)",
        r"glucose\s*\(fasting\)[:\s]+(\d{2,3}(?:\.\d{1,2})?)",
        r"glucose[:\s]+(\d{2,3}(?:\.\d{1,2})?)\s*(?:mg/dl)?",
    ],

    "hba1c": [
        # Metatwin: "HbA1c 6.8 < 5.7 % BORDER"
        r"hba1c\s+(\d{1,2}\.\d{1,2})\s+[<>]",
        r"hba1c[:\s]+(\d{1,2}(?:\.\d{1,2})?)",
        r"a1c[:\s]+(\d{1,2}(?:\.\d{1,2})?)",
        r"glycated\s*h[ae]moglobin[:\s]+(\d{1,2}(?:\.\d{1,2})?)",
    ],

    "serum_creatinine": [
        # Metatwin: "Serum Creatinine 1.4 0.7 – 1.2 mg/dL HIGH"
        r"serum\s*creatinine\s+(\d{1,2}\.\d{1,3})\s+\d",
        r"(?:serum\s*)?creatinine[:\s]+(\d{1,2}(?:\.\d{1,3})?)",
        r"s\.?\s*creat(?:inine)?[:\s]+(\d{1,2}(?:\.\d{1,3})?)",
    ],

    "urea": [
        r"(?:blood\s*)?urea[:\s]+(\d{1,3}(?:\.\d{1,2})?)",
        r"bun[:\s]+(\d{1,3}(?:\.\d{1,2})?)",
    ],

    "alt_enzyme": [
        # Metatwin: "ALT (SGPT) 68 7 – 56 U/L HIGH"
        r"alt\s*\(sgpt\)\s+(\d{1,4}(?:\.\d{1,2})?)\s+\d",
        r"(?:alt|sgpt)[:\s]+(\d{1,4}(?:\.\d{1,2})?)",
        r"alanine[^\n]{0,40}?(\d{1,4}(?:\.\d{1,2})?)\s*(?:u/l|iu/l)",
    ],

    "ast_enzyme": [
        # Metatwin: "AST (SGOT) 52 10 – 40 U/L HIGH"
        r"ast\s*\(sgot\)\s+(\d{1,4}(?:\.\d{1,2})?)\s+\d",
        r"(?:ast|sgot)[:\s]+(\d{1,4}(?:\.\d{1,2})?)",
        r"aspartate[^\n]{0,40}?(\d{1,4}(?:\.\d{1,2})?)\s*(?:u/l|iu/l)",
    ],

    "ggt": [
        r"(?:ggt|gamma\s*gt)[:\s]+(\d{1,4}(?:\.\d{1,2})?)",
    ],

    "bilirubin": [
        # Metatwin: "Total Bilirubin 1.1 0.2 – 1.2 mg/dL NORMAL"
        r"total\s*bilirubin\s+(\d{1,2}\.\d{1,2})\s+\d",
        r"(?:total\s*)?bilirubin[:\s]+(\d{1,2}(?:\.\d{1,2})?)",
    ],
}


def _hba1c_to_glucose(hba1c: float) -> float:
    """ADAG formula: eAG (mg/dL) = 28.7 × A1C − 46.7"""
    return max(40.0, 28.7 * hba1c - 46.7)


def _calc_bmi(weight_kg: float, height_cm: float) -> float:
    h_m = height_cm / 100.0
    return round(weight_kg / (h_m * h_m), 1)


# ── Text extraction ────────────────────────────────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pdfplumber."""
    try:
        import pdfplumber
        parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                # Extract raw text
                t = page.extract_text()
                if t:
                    parts.append(t)
                # Extract tables (catches structured lab report tables)
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row:
                            row_text = "  ".join(str(c).strip() for c in row if c and str(c).strip())
                            if row_text:
                                parts.append(row_text)
        return "\n".join(parts)
    except Exception as e:
        log.warning(f"pdfplumber failed: {e}")
        return ""


def extract_text_from_image(file_bytes: bytes) -> str:
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(file_bytes)).convert("L")
        return pytesseract.image_to_string(img, config="--psm 6")
    except Exception as e:
        log.warning(f"OCR failed: {e}")
        return ""


def extract_text(file_bytes: bytes, filename: str) -> str:
    fname = filename.lower()
    if fname.endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
        if not text.strip():
            try:
                from pdf2image import convert_from_bytes
                import pytesseract
                pages = convert_from_bytes(file_bytes, dpi=200)
                text = "\n".join(pytesseract.image_to_string(p, config="--psm 6") for p in pages)
            except Exception as e:
                log.warning(f"PDF OCR fallback failed: {e}")
        return text
    elif fname.endswith((".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp")):
        return extract_text_from_image(file_bytes)
    else:
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""


# ── Main structuring function ──────────────────────────────────────────────
def structure_report(raw_text: str) -> ExtractionResult:
    """Extract all health values + patient identity from report text."""
    result = ExtractionResult(raw_text=raw_text)
    text = raw_text
    text_lower = raw_text.lower()

    # ── Step 1: Extract patient identity ──────────────────────────────
    result.patient_name  = _extract_patient_name(text)
    result.patient_id    = _extract_patient_id(text)
    result.report_date   = _extract_report_date(text)
    result.doctor_name   = _extract_doctor_name(text)

    # Auto-generate patient ID if not found in document
    if not result.patient_id:
        result.patient_id = _generate_patient_id(result.patient_name, result.report_date)
        result.warnings.append("Patient ID not found in document — auto-generated from name/date hash")

    if result.patient_name:
        result.extracted_fields.append("patient_name")
    if result.patient_id:
        result.extracted_fields.append("patient_id")
    if result.report_date:
        result.extracted_fields.append("report_date")
    if result.doctor_name:
        result.extracted_fields.append("doctor_name")

    # ── Step 2: Extract biomarker values ──────────────────────────────
    for field_name, patterns in FIELD_PATTERNS.items():
        val = _first_match(text, patterns) or _first_match(text_lower, patterns)
        if val is not None:
            setattr(result, field_name, val)
            result.extracted_fields.append(field_name)

    # Extract sex
    result.sex = _extract_sex(text) or _extract_sex(text_lower)
    if result.sex:
        result.extracted_fields.append("sex")

    # Derive BMI from weight/height if not directly found
    if result.bmi is None and result.weight_kg and result.height_cm:
        result.bmi = _calc_bmi(result.weight_kg, result.height_cm)
        result.extracted_fields.append("bmi (calculated)")

    # Derive fasting glucose from HbA1c if not found
    if result.fasting_glucose is None and result.hba1c:
        result.fasting_glucose = _hba1c_to_glucose(result.hba1c)
        result.extracted_fields.append("fasting_glucose (from HbA1c)")
        result.warnings.append(
            f"Fasting glucose estimated from HbA1c ({result.hba1c}%) using ADAG formula"
        )

    # ALT from GGT only if ALT truly missing
    if result.alt_enzyme is None and result.ggt:
        result.alt_enzyme = result.ggt
        result.extracted_fields.append("alt_enzyme (from GGT proxy)")
        result.warnings.append("ALT not found — estimated from GGT")

    # Confidence score
    required = ["age", "sex", "bmi", "systolic_bp", "diastolic_bp",
                "total_cholesterol", "hdl_cholesterol", "ldl_cholesterol",
                "fasting_glucose", "serum_creatinine", "alt_enzyme", "ast_enzyme"]
    found = sum(1 for f in required if getattr(result, f) is not None)
    result.confidence = found / len(required)

    return result


# ── Defaults for missing fields ────────────────────────────────────────────
POPULATION_DEFAULTS = {
    "age": 45, "sex": "male", "bmi": 25.0,
    "systolic_bp": 120, "diastolic_bp": 80,
    "total_cholesterol": 190, "hdl_cholesterol": 55, "ldl_cholesterol": 110,
    "fasting_glucose": 95, "serum_creatinine": 0.9,
    "alt_enzyme": 25, "ast_enzyme": 22,
}


def to_raw_health_input(result: ExtractionResult):
    from src.models.data_types import RawHealthInput

    def get(f, default):
        v = getattr(result, f, None)
        return v if v is not None else default

    missing = [f for f in POPULATION_DEFAULTS if getattr(result, f, None) is None]
    if missing:
        result.warnings.append(f"Missing fields filled with population averages: {', '.join(missing)}")

    return RawHealthInput(
        age=int(get("age", POPULATION_DEFAULTS["age"])),
        sex=get("sex", POPULATION_DEFAULTS["sex"]),
        bmi=float(get("bmi", POPULATION_DEFAULTS["bmi"])),
        systolic_bp=float(get("systolic_bp", POPULATION_DEFAULTS["systolic_bp"])),
        diastolic_bp=float(get("diastolic_bp", POPULATION_DEFAULTS["diastolic_bp"])),
        total_cholesterol=float(get("total_cholesterol", POPULATION_DEFAULTS["total_cholesterol"])),
        hdl_cholesterol=float(get("hdl_cholesterol", POPULATION_DEFAULTS["hdl_cholesterol"])),
        ldl_cholesterol=float(get("ldl_cholesterol", POPULATION_DEFAULTS["ldl_cholesterol"])),
        fasting_glucose=float(get("fasting_glucose", POPULATION_DEFAULTS["fasting_glucose"])),
        serum_creatinine=float(get("serum_creatinine", POPULATION_DEFAULTS["serum_creatinine"])),
        alt_enzyme=float(get("alt_enzyme", POPULATION_DEFAULTS["alt_enzyme"])),
        ast_enzyme=float(get("ast_enzyme", POPULATION_DEFAULTS["ast_enzyme"])),
        daily_step_count=result.daily_step_count,
        sleep_duration=result.sleep_duration,
        dietary_quality_score=result.dietary_quality_score,
    )
