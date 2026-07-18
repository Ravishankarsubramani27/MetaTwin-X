/**
 * HumanBody3D.js — MetaTwin-X Clinical Anatomical Body
 *
 * Proper medical-grade SVG anatomical model:
 * - Detailed human silhouette with proportional body
 * - Internal organ visualization: heart, liver, kidneys, lungs, stomach
 * - Skeletal ribcage, spine, collarbone
 * - Risk-based organ glow (green/amber/red)
 * - Heartbeat pulse animation on heart
 * - Scan-line animation
 * - Click organ → clinical detail popup
 * - Hover highlight
 */
import React, { useState, useRef, useEffect } from "react";

/* ── colour helpers ──────────────────────────────────────────────── */
function rc(p) {
  return p >= 60 ? "#ef4444" : p >= 30 ? "#f59e0b" : "#10b981";
}
function rg(p, a = 0.55) {
  const [r, g, b] = p >= 60 ? [239, 68, 68] : p >= 30 ? [245, 158, 11] : [16, 185, 129];
  return `rgba(${r},${g},${b},${a})`;
}

/* ── clinical organ data ─────────────────────────────────────────── */
const INFO = {
  heart: {
    icon: "❤️", name: "Heart  —  Cardiovascular",
    desc: {
      low:  "Heart function normal. Annual ECG screening recommended.",
      mod:  "Moderate CVD risk. Monitor BP and lipid profile closely.",
      high: "High cardiovascular risk. Urgent cardiology evaluation required.",
    },
    markers: ["Systolic BP", "Total Cholesterol", "HDL/LDL", "Fasting Glucose"],
  },
  liver: {
    icon: "🟤", name: "Liver  —  Hepatic System",
    desc: {
      low:  "Liver enzymes within normal limits. No intervention needed.",
      mod:  "Mild hepatic stress. Reduce alcohol and refined carbohydrates.",
      high: "High liver risk. Hepatology evaluation and ultrasound required.",
    },
    markers: ["ALT", "AST", "Bilirubin", "BMI", "GGT"],
  },
  kidney: {
    icon: "🫘", name: "Kidneys  —  Renal System",
    desc: {
      low:  "Renal function within normal range. Stay well hydrated.",
      mod:  "Moderate renal risk. Monitor creatinine and eGFR regularly.",
      high: "High kidney risk. Nephrology referral urgently required.",
    },
    markers: ["Serum Creatinine", "eGFR", "Urea", "Blood Pressure"],
  },
};

/* ── organ click popup ───────────────────────────────────────────── */
function Popup({ id, pct, x, y, onClose }) {
  if (!id) return null;
  const info = INFO[id];
  const col  = rc(pct);
  const lvl  = pct >= 60 ? "high" : pct >= 30 ? "mod" : "low";

  const left = x > 240 ? "auto" : x + 12;
  const right = x > 240 ? 8 : "auto";

  return (
    <div style={{
      position: "absolute", top: Math.max(8, y - 60),
      left, right, zIndex: 30,
      width: 248,
      background: "rgba(4,9,18,0.97)",
      border: `1px solid ${col}55`,
      borderTop: `3px solid ${col}`,
      borderRadius: 12,
      boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 24px ${rg(pct, 0.18)}`,
      backdropFilter: "blur(14px)",
      animation: "fadeIn 0.15s ease",
      pointerEvents: "all",
    }}>
      {/* header */}
      <div style={{ padding: "11px 14px", display: "flex",
                    justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#e2e8f0", lineHeight: 1.3 }}>
            {info.icon} {info.name}
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: col,
                        fontFamily: "JetBrains Mono,monospace", marginTop: 2,
                        textShadow: `0 0 10px ${rg(pct, 0.7)}` }}>
            {pct.toFixed(1)}%
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.07)", border: "none",
          color: "#64748b", borderRadius: 6, width: 22, height: 22,
          cursor: "pointer", fontSize: 12, lineHeight: 1,
          display:"flex",alignItems:"center",justifyContent:"center",
          flexShrink: 0, marginTop: 2,
        }}>✕</button>
      </div>

      {/* risk bar */}
      <div style={{ margin: "0 14px 10px",
                    height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`,
                      background: col, borderRadius: 2,
                      boxShadow: `0 0 6px ${col}`,
                      transition: "width 0.8s ease" }}/>
      </div>

      {/* interpretation */}
      <div style={{ padding: "0 14px 10px",
                    fontSize: 11, color: "#cbd5e1", lineHeight: 1.65 }}>
        {info.desc[lvl]}
      </div>

      {/* biomarkers */}
      <div style={{ padding: "8px 14px 12px",
                    borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#475569",
                      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          Key Biomarkers
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {info.markers.map(m => (
            <span key={m} style={{
              background: "rgba(56,189,248,0.08)",
              border: "1px solid rgba(56,189,248,0.2)",
              color: "#7dd3fc", borderRadius: 6,
              padding: "2px 7px", fontSize: 9, fontWeight: 500,
            }}>{m}</span>
          ))}
        </div>
      </div>

      {lvl === "high" && (
        <div style={{ margin: "0 14px 12px",
                      background: "rgba(239,68,68,0.09)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 7, padding: "7px 10px",
                      fontSize: 10, color: "#fca5a5", fontWeight: 600 }}>
          🚨 Immediate medical consultation required
        </div>
      )}
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────── */
export default function HumanBody3D({ risks = { heart: 0, kidney: 0, liver: 0 } }) {
  const h = risks.heart  || 0;
  const k = risks.kidney || 0;
  const l = risks.liver  || 0;

  const [hov, setHov]       = useState(null);
  const [sel, setSel]       = useState(null);
  const [selPct, setSelPct] = useState(0);
  const [popX, setPopX]     = useState(0);
  const [popY, setPopY]     = useState(0);
  const [scanY, setScanY]   = useState(0);
  const raf                 = useRef(null);
  const svgRef              = useRef(null);

  /* scan-line */
  useEffect(() => {
    let y = 0;
    const run = () => { y = (y + 0.5) % 420; setScanY(y); raf.current = requestAnimationFrame(run); };
    raf.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const click = (id, pct, e) => {
    e.stopPropagation();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setPopX(e.clientX - rect.left);
    setPopY(e.clientY - rect.top);
    if (sel === id) { setSel(null); return; }
    setSel(id); setSelPct(pct);
  };

  const glow = (id, pct) => {
    const base = id === sel || id === hov ? 0.95 : 0.75;
    const str  = id === sel || id === hov ? 10 : pct >= 60 ? 8 : pct >= 30 ? 5 : 3;
    return `drop-shadow(0 0 ${str}px ${rg(pct, base)})`;
  };

  /* organ fill opacity */
  const op = (id, pct) => id === sel || id === hov ? 0.92 : pct >= 60 ? 0.82 : pct >= 30 ? 0.72 : 0.62;

  const W = 340, H = 560;

  return (
    <div style={{ position: "relative" }} onClick={() => setSel(null)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onClick={e => e.stopPropagation()}
      >
        <defs>
          <linearGradient id="bg3d" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#020c1b"/>
            <stop offset="100%" stopColor="#010810"/>
          </linearGradient>
          <linearGradient id="body3d" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(56,189,248,0.22)"/>
            <stop offset="100%" stopColor="rgba(56,189,248,0.06)"/>
          </linearGradient>
          <linearGradient id="scan3d" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(56,189,248,0)"/>
            <stop offset="40%"  stopColor="rgba(56,189,248,0.35)"/>
            <stop offset="100%" stopColor="rgba(56,189,248,0)"/>
          </linearGradient>
          {/* radial glow for organs */}
          <radialGradient id="hGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={rc(h)} stopOpacity="0.5"/>
            <stop offset="100%" stopColor={rc(h)} stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="kGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={rc(k)} stopOpacity="0.4"/>
            <stop offset="100%" stopColor={rc(k)} stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="lGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={rc(l)} stopOpacity="0.4"/>
            <stop offset="100%" stopColor={rc(l)} stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* background */}
        <rect width={W} height={H} fill="url(#bg3d)"/>

        {/* subtle grid */}
        {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
          <React.Fragment key={i}>
            <line x1={0} y1={i*56} x2={W} y2={i*56} stroke="rgba(56,189,248,0.04)" strokeWidth={1}/>
            <line x1={i*(W/10)} y1={0} x2={i*(W/10)} y2={H} stroke="rgba(56,189,248,0.03)" strokeWidth={1}/>
          </React.Fragment>
        ))}

        {/* ═══════════════ BODY SILHOUETTE ═══════════════ */}

        {/* Head */}
        <ellipse cx={170} cy={55} rx={34} ry={44}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.55)" strokeWidth={1.4}/>

        {/* Ears */}
        <ellipse cx={136} cy={58} rx={8} ry={12}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.35)" strokeWidth={1}/>
        <ellipse cx={204} cy={58} rx={8} ry={12}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.35)" strokeWidth={1}/>

        {/* Neck */}
        <rect x={154} y={94} width={32} height={20} rx={6}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.4)" strokeWidth={1}/>

        {/* Clavicles */}
        <path d="M 120,118 Q 154,126 170,122 Q 186,126 220,118"
          fill="none" stroke="rgba(56,189,248,0.45)" strokeWidth={1.5}/>

        {/* Shoulders */}
        <ellipse cx={103} cy={130} rx={24} ry={16}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.35)" strokeWidth={1}/>
        <ellipse cx={237} cy={130} rx={24} ry={16}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.35)" strokeWidth={1}/>

        {/* Torso */}
        <path d={`
          M 118,115  Q 95,122 88,148
          L 82,320   Q 82,330 92,330
          L 248,330  Q 258,330 258,320
          L 252,148  Q 245,122 222,115
          Q 196,108 170,108 Q 144,108 118,115 Z
        `}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.55)" strokeWidth={1.6}/>

        {/* Pelvis */}
        <path d={`
          M 90,328 Q 72,336 70,352 Q 72,368 170,372
          Q 268,368 270,352 Q 268,336 250,328 Z
        `}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.4)" strokeWidth={1.2}/>

        {/* Left upper arm */}
        <path d={`M 88,138 Q 66,148 56,172 L 50,222
          Q 48,238 56,240 Q 66,242 70,228
          L 76,180 Q 80,158 88,148 Z`}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.4)" strokeWidth={1}/>

        {/* Left forearm */}
        <path d={`M 50,224 Q 44,240 42,265 L 40,290
          Q 40,302 48,302 Q 58,302 60,290
          L 62,265 Q 64,244 70,232 Z`}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.35)" strokeWidth={1}/>

        {/* Left hand */}
        <ellipse cx={50} cy={306} rx={12} ry={18}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.3)" strokeWidth={1}/>

        {/* Right upper arm */}
        <path d={`M 252,138 Q 274,148 284,172 L 290,222
          Q 292,238 284,240 Q 274,242 270,228
          L 264,180 Q 260,158 252,148 Z`}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.4)" strokeWidth={1}/>

        {/* Right forearm */}
        <path d={`M 290,224 Q 296,240 298,265 L 300,290
          Q 300,302 292,302 Q 282,302 280,290
          L 278,265 Q 276,244 270,232 Z`}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.35)" strokeWidth={1}/>

        {/* Right hand */}
        <ellipse cx={290} cy={306} rx={12} ry={18}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.3)" strokeWidth={1}/>

        {/* Left leg */}
        <path d={`M 115,370 Q 100,384 96,416 L 92,464
          Q 90,482 98,484 Q 110,486 114,476
          L 118,446 Q 122,414 124,382 Z`}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.4)" strokeWidth={1.2}/>

        {/* Right leg */}
        <path d={`M 225,370 Q 240,384 244,416 L 248,464
          Q 250,482 242,484 Q 230,486 226,476
          L 222,446 Q 218,414 216,382 Z`}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.4)" strokeWidth={1.2}/>

        {/* Left foot */}
        <ellipse cx={103} cy={490} rx={16} ry={9}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.3)" strokeWidth={1}/>

        {/* Right foot */}
        <ellipse cx={237} cy={490} rx={16} ry={9}
          fill="url(#body3d)" stroke="rgba(56,189,248,0.3)" strokeWidth={1}/>

        {/* ═══════════════ SKELETON ═══════════════ */}

        {/* Spine */}
        <line x1={170} y1={108} x2={170} y2={330}
          stroke="rgba(56,189,248,0.18)" strokeWidth={1.2} strokeDasharray="5,7"/>

        {/* Ribcage — 6 ribs per side */}
        {[0,1,2,3,4,5].map(i => (
          <React.Fragment key={i}>
            <path d={`M 170,${136+i*18} Q ${148-i*2},${138+i*18} ${122-i*3},${136+i*18}`}
              fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth={0.9}/>
            <path d={`M 170,${136+i*18} Q ${192+i*2},${138+i*18} ${218+i*3},${136+i*18}`}
              fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth={0.9}/>
          </React.Fragment>
        ))}

        {/* Sternum */}
        <line x1={170} y1={122} x2={170} y2={240}
          stroke="rgba(56,189,248,0.25)" strokeWidth={2}/>

        {/* ═══════════════ LUNGS (background) ═══════════════ */}
        <ellipse cx={136} cy={188} rx={26} ry={46}
          fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.18)" strokeWidth={0.8}/>
        <ellipse cx={204} cy={188} rx={26} ry={46}
          fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.18)" strokeWidth={0.8}/>

        {/* ═══════════════ ORGAN GLOW HALOS ═══════════════ */}
        {/* Heart glow */}
        <ellipse cx={158} cy={170} rx={hov==="heart"||sel==="heart"?34:26}
          ry={hov==="heart"||sel==="heart"?30:22}
          fill="url(#hGlow)" style={{transition:"rx 0.2s,ry 0.2s"}}/>
        {/* Liver glow */}
        <ellipse cx={186} cy={224} rx={hov==="liver"||sel==="liver"?34:26}
          ry={hov==="liver"||sel==="liver"?22:16}
          fill="url(#lGlow)" style={{transition:"rx 0.2s,ry 0.2s"}}/>
        {/* Kidney glow */}
        <ellipse cx={136} cy={240} rx={hov==="kidney"||sel==="kidney"?20:14}
          ry={hov==="kidney"||sel==="kidney"?24:18}
          fill="url(#kGlow)" style={{transition:"rx 0.2s,ry 0.2s"}}/>
        <ellipse cx={204} cy={240} rx={hov==="kidney"||sel==="kidney"?20:14}
          ry={hov==="kidney"||sel==="kidney"?24:18}
          fill="url(#kGlow)" style={{transition:"rx 0.2s,ry 0.2s"}}/>

        {/* ═══════════════ CLICKABLE ORGANS ═══════════════ */}

        {/* ── HEART ── */}
        <g cursor="pointer"
          style={{ filter: glow("heart", h) }}
          onMouseEnter={() => setHov("heart")}
          onMouseLeave={() => setHov(null)}
          onClick={e => click("heart", h, e)}>
          {/* Anatomical heart shape */}
          <path d={`
            M 158,185
            C 158,185 132,170 132,153
            C 132,140 141,135 150,138
            C 153,139 156,142 158,146
            C 160,142 163,139 166,138
            C 175,135 184,140 184,153
            C 184,170 158,185 158,185 Z
          `}
            fill={rc(h)} opacity={op("heart", h)}
            style={{ animation: h >= 30 ? "pulse-heart 1.1s ease-in-out infinite" : "pulse-heart 2s ease-in-out infinite" }}/>
          {/* Aortic arch */}
          <path d="M 158,138 Q 162,126 170,122 Q 176,120 178,124"
            fill="none" stroke={rc(h)} strokeWidth={2} strokeOpacity={0.6}
            strokeLinecap="round"/>
          {/* Pulmonary artery */}
          <path d="M 154,138 Q 148,126 142,124"
            fill="none" stroke={rc(h)} strokeWidth={1.5} strokeOpacity={0.5}
            strokeLinecap="round"/>
          {/* Label */}
          <text x={192} y={162} fill={rc(h)} fontSize={9} fontWeight="700"
            fontFamily="Inter,sans-serif" opacity={0.9}>
            ❤ {h.toFixed(0)}%
          </text>
        </g>

        {/* ── LIVER ── */}
        <g cursor="pointer"
          style={{ filter: glow("liver", l) }}
          onMouseEnter={() => setHov("liver")}
          onMouseLeave={() => setHov(null)}
          onClick={e => click("liver", l, e)}>
          {/* Anatomical liver — wedge shape */}
          <path d={`
            M 158,210  Q 178,206 196,210
            Q 212,214 214,228 Q 212,244 196,248
            Q 176,252 160,246 Q 148,240 148,228
            Q 148,216 158,210 Z
          `}
            fill={rc(l)} opacity={op("liver", l)}/>
          {/* Gallbladder */}
          <ellipse cx={172} cy={244} rx={7} ry={5}
            fill={rc(l)} opacity={0.4}/>
          {/* Label */}
          <text x={218} y={230} fill={rc(l)} fontSize={9} fontWeight="700"
            fontFamily="Inter,sans-serif" opacity={0.9}>
            🟤 {l.toFixed(0)}%
          </text>
        </g>

        {/* ── LEFT KIDNEY ── */}
        <g cursor="pointer"
          style={{ filter: glow("kidney", k) }}
          onMouseEnter={() => setHov("kidney")}
          onMouseLeave={() => setHov(null)}
          onClick={e => click("kidney", k, e)}>
          {/* Left kidney */}
          <path d={`
            M 126,226 Q 136,220 144,226
            Q 150,234 148,250 Q 144,264 134,266
            Q 124,264 120,250 Q 118,236 126,226 Z
          `}
            fill={rc(k)} opacity={op("kidney", k)}/>
          {/* Renal pelvis indent */}
          <path d="M 144,240 Q 140,244 136,240"
            fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} strokeLinecap="round"/>
          {/* Right kidney */}
          <path d={`
            M 214,226 Q 204,220 196,226
            Q 190,234 192,250 Q 196,264 206,266
            Q 216,264 220,250 Q 222,236 214,226 Z
          `}
            fill={rc(k)} opacity={op("kidney", k)}/>
          <path d="M 196,240 Q 200,244 204,240"
            fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} strokeLinecap="round"/>
          {/* Ureters */}
          <path d="M 140,264 Q 156,272 164,280"
            fill="none" stroke={rc(k)} strokeWidth={1.2} strokeOpacity={0.5} strokeDasharray="3,3"/>
          <path d="M 200,264 Q 184,272 176,280"
            fill="none" stroke={rc(k)} strokeWidth={1.2} strokeOpacity={0.5} strokeDasharray="3,3"/>
          {/* Label */}
          <text x={96} y={246} fill={rc(k)} fontSize={9} fontWeight="700"
            fontFamily="Inter,sans-serif" opacity={0.9} textAnchor="end">
            🫘 {k.toFixed(0)}%
          </text>
        </g>

        {/* ── STOMACH ── */}
        <path d={`M 152,210 Q 144,216 142,228 Q 144,238 154,240
          Q 164,242 168,234 Q 170,224 164,214 Z`}
          fill="rgba(100,120,160,0.18)" stroke="rgba(100,120,160,0.3)"
          strokeWidth={0.8} style={{ pointerEvents: "none" }}/>

        {/* ═══════════════ SCAN LINE ═══════════════ */}
        <rect x={82} y={108 + scanY * 0.52} width={176} height={24}
          fill="url(#scan3d)" opacity={0.7}
          style={{ pointerEvents: "none" }}/>

        {/* ═══════════════ LABELS ═══════════════ */}
        <text x={116} y={278} fill={rc(k)} fontSize={8}
          fontFamily="Inter,sans-serif" opacity={0.65} textAnchor="middle">
          L. Kidney
        </text>
        <text x={224} y={278} fill={rc(k)} fontSize={8}
          fontFamily="Inter,sans-serif" opacity={0.65} textAnchor="middle">
          R. Kidney
        </text>
        <text x={183} y={256} fill={rc(l)} fontSize={8}
          fontFamily="Inter,sans-serif" opacity={0.65}>
          Liver
        </text>
        <text x={170} y={198} fill={rc(h)} fontSize={8}
          fontFamily="Inter,sans-serif" opacity={0.65} textAnchor="middle">
          Heart
        </text>

        {/* ═══════════════ CORNER INFO ═══════════════ */}
        <text x={8} y={H-10} fill="rgba(71,85,105,0.7)" fontSize={8}
          fontFamily="Inter,sans-serif">
          Click organs for clinical details
        </text>
      </svg>

      {/* popup rendered outside SVG for full CSS support */}
      {sel && (
        <Popup id={sel} pct={selPct} x={popX} y={popY} onClose={() => setSel(null)}/>
      )}
    </div>
  );
}
