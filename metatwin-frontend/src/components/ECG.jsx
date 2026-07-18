/**
 * ECG.jsx — Animated ECG/heartbeat line
 * Speed and amplitude scale with heart risk level
 */
import { useEffect, useRef, useState } from "react";

function generateECGPoint(t, heartRisk = 0) {
  const base     = Math.sin(t * 0.5) * 3;
  const noise    = (Math.random() - 0.5) * 4;
  const beat     = Math.sin(t * 8) > 0.96 ? 45 + heartRisk * 0.3 : 0;
  const qrs      = Math.sin(t * 6) > 0.92 ? -18 : 0;
  return base + noise + beat + qrs;
}

export default function ECG({ heartRisk = 0, width = 220, height = 80 }) {
  const [points, setPoints] = useState([]);
  const tRef   = useRef(0);
  const MAX_PTS = 40;

  const speed     = 150 + heartRisk * 2;   // faster at higher risk
  const lineColor = heartRisk >= 70 ? "#ef4444" : heartRisk >= 40 ? "#f59e0b" : "#22c55e";

  useEffect(() => {
    const iv = setInterval(() => {
      tRef.current += 0.18;
      setPoints(prev => [
        ...prev.slice(-(MAX_PTS - 1)),
        generateECGPoint(tRef.current, heartRisk),
      ]);
    }, speed);
    return () => clearInterval(iv);
  }, [heartRisk, speed]);

  const pts = points.map((p, i) => `${(i / MAX_PTS) * width},${height / 2 - p}`).join(" ");

  return (
    <div style={{
      background:"rgba(0,0,0,0.6)", borderRadius:10,
      border:`1px solid ${lineColor}33`,
      padding:"10px 12px",
    }}>
      <div style={{ fontSize:10, fontWeight:700, color:lineColor,
                    textTransform:"uppercase", letterSpacing:"0.12em",
                    marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:lineColor,
                       display:"inline-block", animation:"blink 1s infinite" }}/>
        ECG — Live
      </div>
      <svg width={width} height={height} style={{ display:"block", overflow:"visible" }}>
        {/* Grid lines */}
        {[0, height/4, height/2, height*3/4, height].map(y => (
          <line key={y} x1={0} y1={y} x2={width} y2={y}
            stroke="rgba(255,255,255,0.05)" strokeWidth={0.5}/>
        ))}
        {/* ECG line */}
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke={lineColor}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={pts}
            style={{ filter:`drop-shadow(0 0 3px ${lineColor})` }}
          />
        )}
      </svg>
      <div style={{ fontSize:9, color:"#475569", marginTop:4, textAlign:"right",
                    fontFamily:"monospace" }}>
        HR: {60 + Math.round(heartRisk * 0.6)} bpm
      </div>
    </div>
  );
}
