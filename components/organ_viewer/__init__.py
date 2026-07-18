"""MetaTwin-X — Realistic Medical-Grade 3D Organ Viewer."""
from __future__ import annotations
import json
import streamlit.components.v1 as components


def render_organ_viewer(scores=None, height=580, key="organ_viewer"):
    if scores is None:
        scores = {"heart": 0.0, "kidney": 0.0, "liver": 0.0}
    html = _build_html(scores)
    return components.html(html, height=height, scrolling=False)


def _build_html(scores: dict) -> str:
    s = json.dumps(scores)
    return _HTML_TEMPLATE.replace("__SCORES__", s)


_HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;
  font-family:'Segoe UI',system-ui,sans-serif}
#wrap{
  width:100%;height:100%;
  display:flex;align-items:center;justify-content:center;
  position:relative;
  background:radial-gradient(ellipse at 50% 20%,#0a1628 0%,#050c18 60%,#020810 100%);
}
/* Scan line */
#scan{
  position:absolute;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent 0%,rgba(56,189,248,0.0) 10%,
    rgba(56,189,248,0.6) 50%,rgba(56,189,248,0.0) 90%,transparent 100%);
  animation:scanline 4s linear infinite;
  pointer-events:none;z-index:50;
}
@keyframes scanline{
  0%{top:-2px;opacity:0}
  5%{opacity:1}
  95%{opacity:0.8}
  100%{top:100%;opacity:0}
}
/* Grid overlay */
#grid{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(56,189,248,0.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(56,189,248,0.04) 1px,transparent 1px);
  background-size:40px 40px;
  pointer-events:none;z-index:1;
}
/* Badge top-left */
#badge{
  position:absolute;top:10px;left:12px;
  background:rgba(56,189,248,0.12);
  border:1px solid rgba(56,189,248,0.35);
  border-radius:6px;padding:4px 10px;
  font-size:10px;font-weight:700;
  letter-spacing:0.12em;color:#38bdf8;
  text-transform:uppercase;z-index:20;
}
/* Status panel top-right */
#status-panel{
  position:absolute;top:10px;right:10px;
  display:flex;flex-direction:column;gap:5px;
  z-index:20;
}
.status-badge{
  display:flex;align-items:center;gap:6px;
  background:rgba(5,12,24,0.85);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:8px;padding:5px 10px;
  font-size:11px;font-weight:600;
  color:#e2e8f0;cursor:pointer;
  transition:border-color 0.2s,background 0.2s;
  backdrop-filter:blur(4px);
}
.status-badge:hover{
  background:rgba(15,25,50,0.95);
  border-color:rgba(255,255,255,0.25);
}
.status-dot{
  width:9px;height:9px;border-radius:50%;
  flex-shrink:0;
}
/* Tooltip */
#tip{
  position:absolute;display:none;
  background:rgba(5,12,24,0.96);
  border:1px solid rgba(255,255,255,0.15);
  border-radius:12px;padding:12px 16px;
  font-size:12px;color:#e2e8f0;
  pointer-events:none;min-width:180px;
  box-shadow:0 8px 32px rgba(0,0,0,0.6);
  z-index:100;backdrop-filter:blur(8px);
}
#tip-title{
  font-size:14px;font-weight:700;
  margin-bottom:4px;
}
#tip-score{
  font-size:22px;font-weight:800;
  line-height:1;margin-bottom:4px;
}
#tip-label{
  font-size:11px;color:#94a3b8;
  text-transform:uppercase;letter-spacing:0.08em;
}
#tip-desc{
  font-size:11px;color:#64748b;
  margin-top:6px;line-height:1.5;
  border-top:1px solid rgba(255,255,255,0.08);
  padding-top:6px;
}
/* Organ animations */
@keyframes heartbeat{
  0%,100%{transform:scale(1)}
  10%{transform:scale(1.12)}
  20%{transform:scale(1.04)}
  30%{transform:scale(1.10)}
  50%{transform:scale(1)}
}
@keyframes breathe{
  0%,100%{transform:scale(1)}
  50%{transform:scale(1.03)}
}
@keyframes pulse-glow{
  0%,100%{filter:drop-shadow(0 0 4px currentColor)}
  50%{filter:drop-shadow(0 0 12px currentColor)}
}
.organ{cursor:pointer;transition:opacity 0.2s;}
.organ:hover{opacity:0.85;}
#heart-g{
  animation:heartbeat 1.0s ease-in-out infinite;
  transform-box:fill-box;transform-origin:center;
}
#lung-l,#lung-r{
  animation:breathe 3.5s ease-in-out infinite;
  transform-box:fill-box;transform-origin:center;
}
#liver-g{
  animation:breathe 4.2s ease-in-out infinite 0.5s;
  transform-box:fill-box;transform-origin:center;
}
#kidney-l-g{
  animation:breathe 4.0s ease-in-out infinite 0.3s;
  transform-box:fill-box;transform-origin:center;
}
#kidney-r-g{
  animation:breathe 4.0s ease-in-out infinite 0.8s;
  transform-box:fill-box;transform-origin:center;
}
.high-risk{animation:pulse-glow 1.5s ease-in-out infinite;}
</style>
</head>
<body>
<div id="wrap">
  <div id="grid"></div>
  <div id="scan"></div>
  <div id="badge">MetaTwin&#8209;X &middot; Digital Twin</div>
  <div id="status-panel">
    <div class="status-badge" id="sb-heart" onclick="selectOrgan('heart')">
      <span class="status-dot" id="dot-heart"></span>
      <span id="lbl-heart">Heart: —</span>
    </div>
    <div class="status-badge" id="sb-liver" onclick="selectOrgan('liver')">
      <span class="status-dot" id="dot-liver"></span>
      <span id="lbl-liver">Liver: —</span>
    </div>
    <div class="status-badge" id="sb-kidney" onclick="selectOrgan('kidney')">
      <span class="status-dot" id="dot-kidney"></span>
      <span id="lbl-kidney">Kidney: —</span>
    </div>
  </div>
  <div id="tip">
    <div id="tip-title"></div>
    <div id="tip-score"></div>
    <div id="tip-label"></div>
    <div id="tip-desc"></div>
  </div>

  <svg id="svg" viewBox="0 0 420 700"
       xmlns="http://www.w3.org/2000/svg"
       style="height:100%;max-height:560px;width:auto;z-index:10;position:relative;">
    <defs>
      <!-- Body gradient -->
      <radialGradient id="bodyGrad" cx="50%" cy="35%" r="55%">
        <stop offset="0%" stop-color="#0d2040" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#020810" stop-opacity="0.3"/>
      </radialGradient>
      <!-- Skin tone gradient -->
      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0e2a4a"/>
        <stop offset="100%" stop-color="#071525"/>
      </linearGradient>
      <!-- Glow filters -->
      <filter id="glow-low" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="glow-mod" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="glow-high" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="body-glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- ── BODY SILHOUETTE ─────────────────────────────────────── -->
    <!-- Outer body glow -->
    <path d="M210,18 C185,18 165,30 158,52 C152,68 154,82 156,92
             C148,96 138,100 128,108 C112,120 100,138 96,162
             C92,186 94,210 96,240 C98,270 100,300 102,330
             C104,355 106,375 108,395 C110,415 114,430 118,445
             L122,480 C124,500 126,520 128,545
             C130,565 132,580 136,595 C140,608 146,618 154,622
             C162,626 170,624 176,618 C182,612 184,600 184,585
             C184,565 182,540 180,515 L178,490
             C182,492 186,494 190,494 C194,494 198,492 202,490
             L200,515 C198,540 196,565 196,585
             C196,600 198,612 204,618 C210,624 218,626 226,622
             C234,618 240,608 244,595 C248,580 250,565 252,545
             C254,520 256,500 258,480 L262,445
             C266,430 270,415 272,395 C274,375 276,355 278,330
             C280,300 282,270 284,240 C286,210 288,186 284,162
             C280,138 268,120 252,108 C242,100 232,96 224,92
             C226,82 228,68 222,52 C215,30 235,18 210,18 Z"
          fill="url(#bodyGrad)" stroke="rgba(56,189,248,0.25)"
          stroke-width="1.5" filter="url(#body-glow)"/>

    <!-- ── HEAD ──────────────────────────────────────────────── -->
    <ellipse cx="210" cy="52" rx="46" ry="50"
             fill="url(#skinGrad)" stroke="rgba(56,189,248,0.3)"
             stroke-width="1.2"/>
    <!-- Neck -->
    <path d="M192,98 L192,118 Q192,122 196,124 L224,124 Q228,122 228,118 L228,98"
          fill="url(#skinGrad)" stroke="rgba(56,189,248,0.2)" stroke-width="1"/>
    <!-- Face features -->
    <ellipse cx="197" cy="48" rx="7" ry="5"
             fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.4)" stroke-width="0.8"/>
    <ellipse cx="223" cy="48" rx="7" ry="5"
             fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.4)" stroke-width="0.8"/>
    <path d="M200,68 Q210,74 220,68"
          stroke="rgba(56,189,248,0.3)" stroke-width="1.2" fill="none"/>
    <!-- Nose -->
    <path d="M208,56 Q210,62 212,56"
          stroke="rgba(56,189,248,0.2)" stroke-width="0.8" fill="none"/>

    <!-- ── SHOULDERS & ARMS ────────────────────────────────── -->
    <!-- Left shoulder -->
    <path d="M128,124 Q104,128 88,148 Q74,168 74,196
             Q74,228 76,264 Q78,296 80,324 Q82,348 86,368
             Q90,384 96,386 Q104,388 106,368 Q108,344 108,312
             Q108,280 108,252 L116,200 Q118,162 128,140 Z"
          fill="url(#skinGrad)" stroke="rgba(56,189,248,0.2)" stroke-width="1"/>
    <!-- Right shoulder -->
    <path d="M292,124 Q316,128 332,148 Q346,168 346,196
             Q346,228 344,264 Q342,296 340,324 Q338,348 334,368
             Q330,384 324,386 Q316,388 314,368 Q312,344 312,312
             Q312,280 312,252 L304,200 Q302,162 292,140 Z"
          fill="url(#skinGrad)" stroke="rgba(56,189,248,0.2)" stroke-width="1"/>

    <!-- ── TORSO ──────────────────────────────────────────── -->
    <path d="M128,124 Q128,130 128,140 L128,420
             Q128,440 140,450 L280,450 Q292,440 292,420
             L292,140 Q292,130 292,124 Z"
          fill="url(#bodyGrad)" stroke="rgba(56,189,248,0.15)" stroke-width="1"/>

    <!-- ── PELVIS ─────────────────────────────────────────── -->
    <path d="M140,450 Q118,462 114,484 Q110,504 124,516
             Q148,528 210,528 Q272,528 296,516
             Q310,504 306,484 Q302,462 280,450 Z"
          fill="url(#skinGrad)" stroke="rgba(56,189,248,0.2)" stroke-width="1"/>

    <!-- ── LEGS ───────────────────────────────────────────── -->
    <!-- Left leg -->
    <path d="M152,522 Q144,560 142,604 Q140,640 144,668
             Q148,684 160,686 Q172,688 176,670
             Q180,648 178,608 Q176,568 172,530 Z"
          fill="url(#skinGrad)" stroke="rgba(56,189,248,0.15)" stroke-width="1"/>
    <!-- Right leg -->
    <path d="M268,522 Q276,560 278,604 Q280,640 276,668
             Q272,684 260,686 Q248,688 244,670
             Q240,648 242,608 Q244,568 248,530 Z"
          fill="url(#skinGrad)" stroke="rgba(56,189,248,0.15)" stroke-width="1"/>

    <!-- ── RIBCAGE ────────────────────────────────────────── -->
    <g stroke="rgba(56,189,248,0.28)" stroke-width="1.2" fill="none">
      <!-- Sternum -->
      <line x1="210" y1="148" x2="210" y2="310" stroke-width="2" stroke="rgba(56,189,248,0.35)"/>
      <!-- Left ribs -->
      <path d="M210,158 Q186,162 174,172 Q164,182 162,196"/>
      <path d="M210,174 Q184,178 170,190 Q158,202 156,218"/>
      <path d="M210,190 Q182,196 166,210 Q152,224 150,242"/>
      <path d="M210,206 Q180,214 162,230 Q148,246 146,266"/>
      <path d="M210,222 Q180,232 162,250 Q148,268 148,288"/>
      <path d="M210,238 Q182,250 166,268 Q154,286 154,306"/>
      <path d="M210,254 Q186,266 172,282 Q162,298 162,316"/>
      <!-- Right ribs -->
      <path d="M210,158 Q234,162 246,172 Q256,182 258,196"/>
      <path d="M210,174 Q236,178 250,190 Q262,202 264,218"/>
      <path d="M210,190 Q238,196 254,210 Q268,224 270,242"/>
      <path d="M210,206 Q240,214 258,230 Q272,246 274,266"/>
      <path d="M210,222 Q240,232 258,250 Q272,268 272,288"/>
      <path d="M210,238 Q238,250 254,268 Q266,286 266,306"/>
      <path d="M210,254 Q234,266 248,282 Q258,298 258,316"/>
      <!-- Costal cartilage -->
      <path d="M162,196 Q158,210 160,224 Q162,238 168,248" stroke-width="0.8"/>
      <path d="M258,196 Q262,210 260,224 Q258,238 252,248" stroke-width="0.8"/>
    </g>

    <!-- ── SPINE ───────────────────────────────────────────── -->
    <g fill="rgba(56,189,248,0.22)" stroke="rgba(56,189,248,0.15)" stroke-width="0.5">
      <rect x="205" y="152" width="10" height="8" rx="2"/>
      <rect x="205" y="164" width="10" height="8" rx="2"/>
      <rect x="205" y="176" width="10" height="8" rx="2"/>
      <rect x="205" y="188" width="10" height="8" rx="2"/>
      <rect x="205" y="200" width="10" height="8" rx="2"/>
      <rect x="205" y="212" width="10" height="8" rx="2"/>
      <rect x="205" y="224" width="10" height="8" rx="2"/>
      <rect x="205" y="236" width="10" height="8" rx="2"/>
      <rect x="205" y="248" width="10" height="8" rx="2"/>
      <rect x="205" y="260" width="10" height="8" rx="2"/>
      <rect x="205" y="272" width="10" height="8" rx="2"/>
      <rect x="205" y="284" width="10" height="8" rx="2"/>
      <rect x="205" y="296" width="10" height="8" rx="2"/>
      <rect x="205" y="308" width="10" height="8" rx="2"/>
    </g>

    <!-- ── DIAPHRAGM ───────────────────────────────────────── -->
    <path d="M148,318 Q180,308 210,310 Q240,308 272,318"
          stroke="rgba(56,189,248,0.3)" stroke-width="1.5" fill="none" stroke-dasharray="4,3"/>

    <!-- ── AORTA & VENA CAVA ──────────────────────────────── -->
    <path d="M210,220 Q206,240 204,270 Q202,300 202,340 Q202,380 204,420"
          stroke="rgba(239,68,68,0.4)" stroke-width="3" fill="none"/>
    <path d="M210,220 Q214,240 216,270 Q218,300 218,340 Q218,380 216,420"
          stroke="rgba(59,130,246,0.4)" stroke-width="3" fill="none"/>

    <!-- ── LUNGS ───────────────────────────────────────────── -->
    <g id="lung-l" opacity="0.55">
      <path d="M148,152 Q130,162 126,188 Q122,214 124,244
               Q126,270 132,292 Q138,310 148,316
               Q158,320 164,308 Q170,292 172,268
               Q174,240 172,212 Q170,182 160,162 Z"
            fill="rgba(56,189,248,0.18)" stroke="rgba(56,189,248,0.35)" stroke-width="1.2"/>
      <!-- Bronchial hints -->
      <path d="M160,162 Q156,180 154,200 Q152,220 154,240"
            stroke="rgba(56,189,248,0.25)" stroke-width="0.8" fill="none"/>
      <path d="M154,200 Q148,210 146,224"
            stroke="rgba(56,189,248,0.2)" stroke-width="0.6" fill="none"/>
    </g>
    <g id="lung-r" opacity="0.55">
      <path d="M272,152 Q290,162 294,188 Q298,214 296,244
               Q294,270 288,292 Q282,310 272,316
               Q262,320 256,308 Q250,292 248,268
               Q246,240 248,212 Q250,182 260,162 Z"
            fill="rgba(56,189,248,0.18)" stroke="rgba(56,189,248,0.35)" stroke-width="1.2"/>
      <path d="M260,162 Q264,180 266,200 Q268,220 266,240"
            stroke="rgba(56,189,248,0.25)" stroke-width="0.8" fill="none"/>
      <path d="M266,200 Q272,210 274,224"
            stroke="rgba(56,189,248,0.2)" stroke-width="0.6" fill="none"/>
    </g>

    <!-- ── ORGANS LAYER (dynamic) ─────────────────────────── -->
    <g id="org"></g>
    <!-- ── LABELS LAYER ────────────────────────────────────── -->
    <g id="lbl"></g>

  </svg>
</div>

<script>
const SC = __SCORES__;
const NS = 'http://www.w3.org/2000/svg';

function riskColor(v){
  return v < 0.4 ? '#10b981' : v < 0.7 ? '#f59e0b' : '#ef4444';
}
function riskLabel(v){
  return v < 0.4 ? 'Normal' : v < 0.7 ? 'Elevated' : 'Critical';
}
function riskFilter(v){
  return v < 0.4 ? 'url(#glow-low)' : v < 0.7 ? 'url(#glow-mod)' : 'url(#glow-high)';
}
function riskDesc(organ, v){
  const level = riskLabel(v);
  const descs = {
    heart: {
      Normal: 'Cardiovascular markers within healthy range. Continue preventive care.',
      Elevated: 'Moderate cardiac risk detected. Monitor BP and cholesterol closely.',
      Critical: 'High cardiovascular risk. Immediate cardiology consultation advised.'
    },
    kidney: {
      Normal: 'Renal function indicators normal. Maintain hydration.',
      Elevated: 'Moderate renal stress. Monitor creatinine and eGFR regularly.',
      Critical: 'Significant kidney impairment detected. Nephrology referral required.'
    },
    liver: {
      Normal: 'Hepatic enzymes within normal limits. Liver function healthy.',
      Elevated: 'Mild hepatic stress. Reduce alcohol and monitor ALT/AST.',
      Critical: 'Severe hepatic dysfunction. Urgent hepatology evaluation needed.'
    }
  };
  return descs[organ]?.[level] || '';
}

function svgEl(tag, attrs, parent){
  const e = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, String(v)));
  if(parent) parent.appendChild(e);
  return e;
}

const orgLayer = document.getElementById('org');
const lblLayer = document.getElementById('lbl');

const ORGANS = [
  {
    key: 'heart', label: 'Heart', score: SC.heart || 0,
    id: 'heart-g', lx: 175, ly: 205,
    draw(layer, col, filt){
      const g = svgEl('g', {id:this.id, filter:filt, class:'organ',
        'data-key':this.key, 'data-label':this.label, 'data-score':this.score}, layer);
      // Left ventricle
      svgEl('path', {
        d:'M192,222 Q182,218 178,228 Q174,240 178,254 Q182,266 192,270 Q200,272 204,262 Q208,250 206,236 Q204,224 192,222 Z',
        fill:col, opacity:'0.92'
      }, g);
      // Right ventricle
      svgEl('path', {
        d:'M210,220 Q220,216 226,224 Q232,234 230,248 Q228,260 220,266 Q212,270 208,260 Q204,248 206,234 Q208,224 210,220 Z',
        fill:col, opacity:'0.85'
      }, g);
      // Left atrium
      svgEl('ellipse', {cx:'192', cy:'218', rx:'12', ry:'8', fill:col, opacity:'0.75'}, g);
      // Right atrium
      svgEl('ellipse', {cx:'222', cy:'216', rx:'10', ry:'7', fill:col, opacity:'0.70'}, g);
      // Aortic arch
      svgEl('path', {
        d:'M210,218 Q210,208 216,202 Q222,196 228,198',
        stroke:col, 'stroke-width':'4', fill:'none', opacity:'0.8'
      }, g);
      // Pulmonary artery
      svgEl('path', {
        d:'M206,218 Q200,208 194,204 Q188,200 182,202',
        stroke:col, 'stroke-width':'3', fill:'none', opacity:'0.65'
      }, g);
      // Highlight
      svgEl('ellipse', {cx:'194', cy:'232', rx:'7', ry:'5',
        fill:'white', opacity:'0.18'}, g);
    }
  },
  {
    key: 'liver', label: 'Liver', score: SC.liver || 0,
    id: 'liver-g', lx: 218, ly: 248,
    draw(layer, col, filt){
      const g = svgEl('g', {id:this.id, filter:filt, class:'organ',
        'data-key':this.key, 'data-label':this.label, 'data-score':this.score}, layer);
      // Right lobe (larger)
      svgEl('path', {
        d:'M218,248 Q248,240 264,252 Q276,264 274,282 Q272,298 260,308 Q248,316 234,314 Q222,312 216,300 Q210,286 212,268 Q214,254 218,248 Z',
        fill:col, opacity:'0.90'
      }, g);
      // Left lobe
      svgEl('path', {
        d:'M218,248 Q208,244 198,250 Q188,258 188,272 Q188,284 196,292 Q204,298 214,296 Q220,294 222,284 Q224,272 220,260 Z',
        fill:col, opacity:'0.78'
      }, g);
      // Gallbladder
      svgEl('ellipse', {cx:'240', cy:'318', rx:'8', ry:'6',
        fill:col, opacity:'0.55'}, g);
      // Hepatic vein hint
      svgEl('path', {
        d:'M236,260 Q232,270 230,282 Q228,292 232,300',
        stroke:'rgba(0,0,0,0.3)', 'stroke-width':'1.5', fill:'none'
      }, g);
      // Highlight
      svgEl('ellipse', {cx:'244', cy:'264', rx:'14', ry:'9',
        fill:'white', opacity:'0.14'}, g);
    }
  },
  {
    key: 'kidney', label: 'L. Kidney', score: SC.kidney || 0,
    id: 'kidney-l-g', lx: 136, ly: 278,
    draw(layer, col, filt){
      const g = svgEl('g', {id:this.id, filter:filt, class:'organ',
        'data-key':this.key, 'data-label':this.label, 'data-score':this.score}, layer);
      // Bean shape
      svgEl('path', {
        d:'M158,278 Q144,272 138,284 Q132,298 134,314 Q136,328 148,336 Q160,342 168,334 Q176,324 176,308 Q176,292 168,282 Q164,276 158,278 Z',
        fill:col, opacity:'0.92'
      }, g);
      // Renal pelvis (inner notch)
      svgEl('path', {
        d:'M168,300 Q164,296 160,298 Q156,302 158,308 Q160,314 164,314 Q168,312 168,308 Z',
        fill:'rgba(0,0,0,0.25)'
      }, g);
      // Ureter
      svgEl('path', {
        d:'M158,336 Q156,352 158,372',
        stroke:col, 'stroke-width':'2', fill:'none', opacity:'0.5'
      }, g);
      svgEl('ellipse', {cx:'152', cy:'304', rx:'6', ry:'9',
        fill:'white', opacity:'0.12'}, g);
    }
  },
  {
    key: 'kidney', label: 'R. Kidney', score: SC.kidney || 0,
    id: 'kidney-r-g', lx: 252, ly: 278,
    draw(layer, col, filt){
      const g = svgEl('g', {id:this.id, filter:filt, class:'organ',
        'data-key':this.key, 'data-label':this.label, 'data-score':this.score}, layer);
      svgEl('path', {
        d:'M262,278 Q276,272 282,284 Q288,298 286,314 Q284,328 272,336 Q260,342 252,334 Q244,324 244,308 Q244,292 252,282 Q256,276 262,278 Z',
        fill:col, opacity:'0.92'
      }, g);
      svgEl('path', {
        d:'M252,300 Q256,296 260,298 Q264,302 262,308 Q260,314 256,314 Q252,312 252,308 Z',
        fill:'rgba(0,0,0,0.25)'
      }, g);
      svgEl('path', {
        d:'M262,336 Q264,352 262,372',
        stroke:col, 'stroke-width':'2', fill:'none', opacity:'0.5'
      }, g);
      svgEl('ellipse', {cx:'268', cy:'304', rx:'6', ry:'9',
        fill:'white', opacity:'0.12'}, g);
    }
  }
];

function renderOrgans(){
  orgLayer.innerHTML = '';
  lblLayer.innerHTML = '';

  ORGANS.forEach(od => {
    const col  = riskColor(od.score);
    const filt = riskFilter(od.score);
    od.draw(orgLayer, col, filt);

    // Add high-risk pulsing class
    const el = document.getElementById(od.id);
    if(el && od.score >= 0.7) el.classList.add('high-risk');

    // Floating label badge
    const g = svgEl('g', {}, lblLayer);
    const shortLabel = od.label.replace('L. ','').replace('R. ','');
    const txt = shortLabel + '  ' + (od.score * 100).toFixed(0) + '%';
    const bw  = txt.length * 6.5 + 14;
    svgEl('rect', {
      x: od.lx - 2, y: od.ly - 14,
      width: bw, height: 18, rx: 6,
      fill: 'rgba(5,12,24,0.88)',
      stroke: col, 'stroke-width': '1.2'
    }, g);
    const t = svgEl('text', {
      x: od.lx + 5, y: od.ly - 2,
      fill: col, 'font-size': '10',
      'font-weight': '700',
      'font-family': 'Segoe UI,system-ui,sans-serif'
    }, g);
    t.textContent = txt;
  });

  updateStatusPanel();
  attachHandlers();
}

function updateStatusPanel(){
  const organs = {
    heart:  SC.heart  || 0,
    liver:  SC.liver  || 0,
    kidney: SC.kidney || 0
  };
  Object.entries(organs).forEach(([key, score]) => {
    const dot = document.getElementById('dot-' + key);
    const lbl = document.getElementById('lbl-' + key);
    const col = riskColor(score);
    if(dot){
      dot.style.background = col;
      dot.style.boxShadow  = '0 0 6px ' + col;
    }
    if(lbl){
      const name = key.charAt(0).toUpperCase() + key.slice(1);
      lbl.textContent = name + ': ' + riskLabel(score);
      lbl.style.color = col;
    }
  });
}

function selectOrgan(key){
  const score = SC[key] || 0;
  const col   = riskColor(score);
  const tip   = document.getElementById('tip');
  const name  = key.charAt(0).toUpperCase() + key.slice(1);
  document.getElementById('tip-title').textContent = name + ' Risk';
  document.getElementById('tip-title').style.color = col;
  document.getElementById('tip-score').textContent = (score * 100).toFixed(1) + '%';
  document.getElementById('tip-score').style.color = col;
  document.getElementById('tip-label').textContent = riskLabel(score) + ' Risk';
  document.getElementById('tip-desc').textContent  = riskDesc(key, score);
  tip.style.display = 'block';
  tip.style.left = '12px';
  tip.style.bottom = '12px';
  tip.style.top = 'auto';
  setTimeout(() => { tip.style.display = 'none'; }, 5000);
  if(window.Streamlit) window.Streamlit.setComponentValue(key);
}

function attachHandlers(){
  const tip = document.getElementById('tip');
  document.querySelectorAll('.organ').forEach(el => {
    el.addEventListener('click', e => {
      const key   = el.getAttribute('data-key');
      const score = parseFloat(el.getAttribute('data-score'));
      const col   = riskColor(score);
      const name  = el.getAttribute('data-label');
      document.getElementById('tip-title').textContent = name + ' Risk';
      document.getElementById('tip-title').style.color = col;
      document.getElementById('tip-score').textContent = (score * 100).toFixed(1) + '%';
      document.getElementById('tip-score').style.color = col;
      document.getElementById('tip-label').textContent = riskLabel(score) + ' Risk';
      document.getElementById('tip-desc').textContent  = riskDesc(key, score);
      tip.style.display = 'block';
      tip.style.left = (e.clientX + 16) + 'px';
      tip.style.top  = (e.clientY - 60) + 'px';
      tip.style.bottom = 'auto';
      setTimeout(() => { tip.style.display = 'none'; }, 5000);
      if(window.Streamlit) window.Streamlit.setComponentValue(key);
      e.stopPropagation();
    });
  });
  document.addEventListener('click', () => { tip.style.display = 'none'; });
}

renderOrgans();

window.addEventListener('message', e => {
  if(!e.data || !e.data.scores) return;
  Object.keys(e.data.scores).forEach(k => {
    if(SC[k] !== undefined) SC[k] = e.data.scores[k];
  });
  renderOrgans();
});
</script>
</body>
</html>
"""
