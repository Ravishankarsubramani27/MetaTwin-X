"""MetaTwin-X — Premium Clinical Dashboard Design System (Light Theme)."""

GLOBAL_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* { box-sizing: border-box; }
#MainMenu, footer, header { visibility: hidden; }

.stApp {
    background: #f0f4f8 !important;
    font-family: 'Inter', sans-serif !important;
}
.block-container {
    padding: 0 !important;
    max-width: 100% !important;
}

/* ── Sidebar — WHITE ── */
[data-testid="stSidebar"] {
    background: #ffffff !important;
    border-right: 1px solid #e2e8f0 !important;
    min-width: 220px !important;
    max-width: 220px !important;
}
[data-testid="stSidebar"] > div:first-child { padding: 0 !important; }
[data-testid="collapsedControl"] { display: none !important; }
[data-testid="stMainBlockContainer"] {
    padding: 0 28px 40px 28px !important;
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: #f0f4f8; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* ── Buttons ── */
.stButton > button {
    border-radius: 8px !important;
    font-weight: 600 !important;
    font-size: 0.84rem !important;
    font-family: 'Inter', sans-serif !important;
    border: 1px solid #e2e8f0 !important;
    background: #ffffff !important;
    color: #374151 !important;
    padding: 8px 16px !important;
    transition: all 0.15s !important;
    width: 100% !important;
}
.stButton > button:hover {
    background: #f8fafc !important;
    border-color: #94a3b8 !important;
    color: #0f172a !important;
}
.stButton > button[kind="primary"] {
    background: #2563eb !important;
    color: #ffffff !important;
    border: none !important;
    box-shadow: 0 2px 8px rgba(37,99,235,0.3) !important;
}
.stButton > button[kind="primary"]:hover {
    background: #1d4ed8 !important;
    box-shadow: 0 4px 16px rgba(37,99,235,0.4) !important;
}
.stDownloadButton > button {
    border-radius: 8px !important;
    font-weight: 600 !important;
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    color: #374151 !important;
    width: 100% !important;
}
.stDownloadButton > button:hover {
    background: #f1f5f9 !important;
    border-color: #94a3b8 !important;
}

/* ── Inputs ── */
.stTextInput input, .stNumberInput input {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 8px !important;
    color: #0f172a !important;
    font-size: 0.84rem !important;
    font-family: 'Inter', sans-serif !important;
}
.stTextInput input:focus, .stNumberInput input:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
}
.stSelectbox [data-baseweb="select"] > div {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 8px !important;
    color: #0f172a !important;
}
.stSelectbox [data-baseweb="select"] > div:focus-within {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
}
[data-baseweb="popover"] [data-baseweb="menu"] {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
}
[data-baseweb="popover"] [role="option"] {
    color: #374151 !important;
}
[data-baseweb="popover"] [role="option"]:hover {
    background: #f8fafc !important;
}
.stSlider [data-baseweb="slider"] [role="slider"] {
    background: #2563eb !important;
    border: 2px solid #ffffff !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.2) !important;
}
.stSlider [data-baseweb="slider"] [data-testid="stSliderTrackFill"] {
    background: #2563eb !important;
}
.stSlider [data-baseweb="slider"] div[data-testid="stSliderTrack"] {
    background: #e2e8f0 !important;
}

/* ── Tabs ── */
.stTabs [data-baseweb="tab-list"] {
    background: #f1f5f9 !important;
    border-radius: 8px !important;
    padding: 3px !important;
    gap: 2px !important;
    border: none !important;
}
.stTabs [data-baseweb="tab"] {
    background: transparent !important;
    color: #64748b !important;
    border-radius: 6px !important;
    padding: 7px 16px !important;
    font-size: 0.82rem !important;
    font-weight: 500 !important;
    font-family: 'Inter', sans-serif !important;
    border: none !important;
}
.stTabs [aria-selected="true"] {
    background: #ffffff !important;
    color: #0f172a !important;
    font-weight: 700 !important;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important;
}

/* ── Expander ── */
div[data-testid="stExpander"] {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 10px !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
    margin-bottom: 12px !important;
}
div[data-testid="stExpander"] summary {
    font-size: 0.84rem !important;
    font-weight: 600 !important;
    color: #0f172a !important;
    font-family: 'Inter', sans-serif !important;
}
div[data-testid="stExpander"] summary:hover {
    color: #2563eb !important;
}

/* ── File uploader ── */
[data-testid="stFileUploader"] {
    background: #ffffff !important;
    border: 2px dashed #cbd5e1 !important;
    border-radius: 10px !important;
}
[data-testid="stFileUploader"]:hover {
    border-color: #2563eb !important;
    background: rgba(37,99,235,0.02) !important;
}

/* ── Dataframe ── */
[data-testid="stDataFrame"] {
    border-radius: 8px !important;
    overflow: hidden !important;
    border: 1px solid #e2e8f0 !important;
}
[data-testid="stDataFrame"] th {
    background: #f8fafc !important;
    color: #64748b !important;
}
[data-testid="stDataFrame"] td {
    background: #ffffff !important;
    color: #374151 !important;
}

/* ── Widget labels ── */
label[data-testid="stWidgetLabel"] {
    font-family: 'Inter', sans-serif !important;
    font-size: 0.82rem !important;
    font-weight: 600 !important;
    color: #374151 !important;
}
.stCheckbox label {
    font-family: 'Inter', sans-serif !important;
    font-size: 0.82rem !important;
    color: #374151 !important;
}
.stMarkdown p {
    font-family: 'Inter', sans-serif;
    color: #374151;
    font-size: 0.84rem;
}
.stMarkdown h1, .stMarkdown h2, .stMarkdown h3 {
    color: #0f172a !important;
    font-family: 'Inter', sans-serif !important;
}

/* ── Number input arrows ── */
.stNumberInput button {
    background: #f8fafc !important;
    border-color: #e2e8f0 !important;
    color: #374151 !important;
}

/* ── Spinner ── */
.stSpinner > div {
    border-top-color: #2563eb !important;
}

/* ── Alert/info boxes ── */
.stAlert {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    color: #374151 !important;
    border-radius: 8px !important;
}

/* ── Animations ── */
@keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
}
@keyframes slide-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

/* ── PREMIUM CARD ── */
.pcard {
    background: #ffffff;
    border: 1px solid #e8edf4;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    margin-bottom: 16px;
    animation: slide-up 0.2s ease forwards;
}
.pcard-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px;
    font-family: 'Inter', sans-serif;
}
.pcard-sub {
    font-size: 0.75rem;
    color: #64748b;
    margin: 0 0 14px;
    font-family: 'Inter', sans-serif;
}

/* ── TOP BAR ── */
.topbar {
    background: #ffffff;
    border-bottom: 1px solid #e8edf4;
    padding: 0 28px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    position: sticky;
    top: 0;
    z-index: 100;
}
.topbar-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #0f172a;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.02em;
}
.topbar-sub {
    font-size: 0.72rem;
    color: #64748b;
    font-family: 'Inter', sans-serif;
}

/* ── SESSION BADGE ── */
.session-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 3px 10px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #2563eb;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-family: 'Inter', sans-serif;
}

/* ── PROTOCOL ITEM ── */
.proto-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #f1f5f9;
    font-family: 'Inter', sans-serif;
}
.proto-item:last-child { border-bottom: none; }
.proto-name { font-size: 0.84rem; font-weight: 600; color: #0f172a; }
.proto-sub  { font-size: 0.72rem; color: #64748b; margin-top: 2px; }
.proto-badge {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    font-family: 'Inter', sans-serif;
    flex-shrink: 0;
}
.proto-active   { background: #dcfce7; color: #15803d; }
.proto-moderate { background: #fef9c3; color: #a16207; }

/* ── BIOMARKER TABLE ── */
.bio-table { width: 100%; border-collapse: collapse; }
.bio-table th {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    padding: 10px 14px;
    border-bottom: 1px solid #f1f5f9;
    text-align: left;
    font-family: 'Inter', sans-serif;
}
.bio-table td {
    font-size: 0.84rem;
    color: #374151;
    padding: 12px 14px;
    border-bottom: 1px solid #f8fafc;
    font-family: 'Inter', sans-serif;
}
.bio-table tr:last-child td { border-bottom: none; }
.bio-table tr:hover td { background: #f8fafc; }
.val-high { color: #dc2626 !important; font-weight: 700; }
.val-proj { color: #2563eb !important; font-weight: 700; }
.val-pos  { color: #16a34a !important; font-weight: 600; }
.val-neg  { color: #dc2626 !important; font-weight: 600; }

/* ── SIDEBAR NAV ── */
.snav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 16px;
    border-radius: 8px;
    margin: 2px 8px;
    cursor: pointer;
    font-size: 0.84rem;
    font-weight: 500;
    color: #64748b;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s;
}
.snav-item.active {
    background: #eff6ff;
    color: #2563eb;
    font-weight: 600;
}
.snav-item:hover { background: #f8fafc; color: #0f172a; }

/* ── MISC ── */
.live-dot {
    width: 7px; height: 7px;
    background: #10b981; border-radius: 50%;
    display: inline-block;
    animation: blink 1.5s infinite;
}
.divider { height: 1px; background: #f1f5f9; margin: 12px 0; }
.section-header {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 20px; padding-bottom: 14px;
    border-bottom: 1px solid #e2e8f0;
}
.section-header h2 {
    font-size: 1.1rem; font-weight: 700; color: #0f172a;
    margin: 0 0 2px; font-family: 'Inter', sans-serif;
}
.section-sub { font-size: 0.74rem; color: #64748b; margin: 0; font-family: 'Inter', sans-serif; }
.section-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.alert-critical {
    background: #fef2f2; border: 1px solid #fecaca;
    border-left: 3px solid #ef4444; border-radius: 8px;
    padding: 12px 16px; margin-bottom: 16px;
    font-family: 'Inter', sans-serif; font-size: 0.82rem; color: #dc2626;
}
.alert-warning {
    background: #fffbeb; border: 1px solid #fde68a;
    border-left: 3px solid #f59e0b; border-radius: 8px;
    padding: 10px 14px; margin-bottom: 10px;
    font-family: 'Inter', sans-serif; font-size: 0.82rem; color: #92400e;
}
.pm-card {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 8px; padding: 12px 14px; margin-top: 4px;
}
.c-label {
    font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 6px;
    font-family: 'Inter', sans-serif;
}
.prog-bar { height: 5px; background: #f1f5f9; border-radius: 3px; overflow: hidden; margin-top: 6px; }
.prog-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.chart-card {
    background: #ffffff; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 20px; margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.chart-title { font-size: 0.9rem; font-weight: 700; color: #0f172a; margin-bottom: 3px; font-family: 'Inter', sans-serif; }
.chart-sub { font-size: 0.73rem; color: #64748b; margin-bottom: 12px; font-family: 'Inter', sans-serif; }
.comp-table { width: 100%; border-collapse: collapse; }
.comp-table th {
    font-size: 0.67rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: #94a3b8; padding: 10px 12px;
    border-bottom: 1px solid #f1f5f9; text-align: left;
    background: #f8fafc; font-family: 'Inter', sans-serif;
}
.comp-table td {
    font-size: 0.82rem; color: #374151; padding: 10px 12px;
    border-bottom: 1px solid #f8fafc; font-family: 'Inter', sans-serif;
}
.comp-table tr:last-child td { border-bottom: none; }
.comp-table tr:hover td { background: #f8fafc; }
.impact-box {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 10px; padding: 14px 16px; margin: 14px 0;
}
.impact-box-title {
    font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 10px;
    font-family: 'Inter', sans-serif;
}
.impact-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 6px; font-family: 'Inter', sans-serif;
}
.impact-organ { font-size: 0.82rem; color: #374151; }
.impact-delta-neg { font-size: 0.82rem; font-weight: 700; color: #16a34a; }
.baseline-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 0; border-bottom: 1px solid #f1f5f9;
    font-family: 'Inter', sans-serif;
}
.baseline-row:last-child { border-bottom: none; }
.baseline-label { font-size: 0.82rem; color: #374151; }
.protocol-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid #f1f5f9;
    font-family: 'Inter', sans-serif;
}
.protocol-item:last-child { border-bottom: none; }
.protocol-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 1rem;
}
.protocol-name { font-size: 0.86rem; font-weight: 600; color: #0f172a; }
.protocol-sub  { font-size: 0.74rem; color: #64748b; margin-top: 2px; }
.card-label {
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 8px;
    font-family: 'Inter', sans-serif;
}
.card-badge {
    display: inline-block; padding: 3px 10px; border-radius: 20px;
    font-size: 0.68rem; font-weight: 700; font-family: 'Inter', sans-serif;
    text-transform: uppercase;
}
.badge-low      { background: #dcfce7; color: #15803d; }
.badge-moderate { background: #fef9c3; color: #a16207; }
.badge-high     { background: #fee2e2; color: #dc2626; }
.badge-normal   { background: #dbeafe; color: #1d4ed8; }
.metric-card {
    background: #ffffff; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 18px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.metric-card.general { border-top: 3px solid #2563eb; }

/* ── Page header (light) ── */
.page-header {
    background: #ffffff;
    border-bottom: 1px solid #e8edf4;
    padding: 0 28px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    margin-bottom: 0;
}
.page-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin: 0;
    font-family: 'Inter', sans-serif;
}
.page-subtitle {
    font-size: 0.72rem;
    color: #64748b;
    margin: 0;
    font-family: 'Inter', sans-serif;
}

/* ── Card (light) ── */
.card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    animation: slide-up 0.2s ease forwards;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.card:hover {
    border-color: #bfdbfe;
    box-shadow: 0 4px 16px rgba(37,99,235,0.08);
}
.card-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px;
    font-family: 'Inter', sans-serif;
}
.card-sub {
    font-size: 0.76rem;
    color: #64748b;
    margin: 0 0 14px;
    font-family: 'Inter', sans-serif;
}

/* ── mt-card ── */
.mt-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 18px 20px;
    margin-bottom: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.mt-card-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 10px;
    font-family: 'Inter', sans-serif;
}

/* ── Metric value ── */
.metric-value {
    font-size: 2.2rem;
    font-weight: 800;
    line-height: 1;
    font-family: 'Inter', sans-serif;
    margin: 8px 0;
}
.metric-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    font-family: 'Inter', sans-serif;
}

/* ── Badge ── */
.badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    font-family: 'Inter', sans-serif;
}
.badge-blue { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }

/* ── Progress wrap ── */
.prog-wrap { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; margin-top: 8px; }
.prog-fill-sm { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
</style>
"""
