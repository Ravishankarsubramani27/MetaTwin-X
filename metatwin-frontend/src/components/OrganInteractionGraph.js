/**
 * OrganInteractionGraph.js
 * SVG force-layout organ dependency graph with animated interaction arrows.
 */
import React, { useEffect, useRef, useState } from "react";

const NODES = [
  { id:"heart",  label:"Heart",  icon:"❤️", x:300, y:100, color:"#ef4444" },
  { id:"kidney", label:"Kidney", icon:"🫘", x:140, y:280, color:"#38bdf8" },
  { id:"liver",  label:"Liver",  icon:"🟤", x:460, y:280, color:"#10b981" },
  { id:"bp",     label:"Blood\nPressure", icon:"🩸", x:220, y:190, color:"#f59e0b", small:true },
  { id:"gfr",    label:"eGFR",   icon:"🔬", x:180, y:350, color:"#a78bfa", small:true },
  { id:"alt",    label:"ALT",    icon:"🧪", x:420, y:350, color:"#06b6d4", small:true },
];

const EDGES = [
  { from:"heart",  to:"bp",     label:"drives",     strength:0.9, color:"#f59e0b" },
  { from:"bp",     to:"kidney", label:"damages",    strength:0.8, color:"#38bdf8" },
  { from:"bp",     to:"heart",  label:"loads",      strength:0.7, color:"#ef4444" },
  { from:"kidney", to:"gfr",    label:"reflects",   strength:0.9, color:"#a78bfa" },
  { from:"gfr",    to:"heart",  label:"cardiac risk",strength:0.6,color:"#ef4444" },
  { from:"liver",  to:"alt",    label:"releases",   strength:0.9, color:"#06b6d4" },
  { from:"liver",  to:"heart",  label:"NAFLD-CVD",  strength:0.5, color:"#ef4444" },
  { from:"heart",  to:"liver",  label:"congestion", strength:0.4, color:"#10b981" },
  { from:"kidney", to:"liver",  label:"toxins",     strength:0.3, color:"#10b981" },
];

function riskColor(pct) {
  if (pct <= 20) return "#10b981";
  if (pct <= 40) return "#f59e0b";
  if (pct <= 60) return "#f97316";
  if (pct <= 80) return "#ef4444";
  return "#dc2626";
}

function nodeRisk(id, risks) {
  if (id === "heart")  return risks.heart;
  if (id === "kidney") return risks.kidney;
  if (id === "liver")  return risks.liver;
  return null;
}

// Arrow marker for SVG
function Defs({ edges }) {
  const colors = [...new Set(edges.map(e => e.color))];
  return (
    <defs>
      {colors.map(c => (
        <marker key={c} id={`arrow-${c.replace("#","")}`}
          markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={c} opacity="0.8"/>
        </marker>
      ))}
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  );
}

export default function OrganInteractionGraph({ risk }) {
  const [hovered, setHovered]   = useState(null);
  const [animStep, setAnimStep] = useState(0);
  const timerRef = useRef(null);

  const risks = {
    heart:  risk?.heart  <= 1 ? (risk.heart  || 0) * 100 : (risk?.heart  || 0),
    kidney: risk?.kidney <= 1 ? (risk.kidney || 0) * 100 : (risk?.kidney || 0),
    liver:  risk?.liver  <= 1 ? (risk.liver  || 0) * 100 : (risk?.liver  || 0),
  };

  // Animate flow along edges
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setAnimStep(s => (s + 1) % 100);
    }, 80);
    return () => clearInterval(timerRef.current);
  }, []);

  const W = 600, H = 440;

  // Get midpoint of an edge for label placement
  function edgeMid(e) {
    const fn = NODES.find(n => n.id === e.from);
    const tn = NODES.find(n => n.id === e.to);
    return { x: (fn.x + tn.x) / 2, y: (fn.y + tn.y) / 2 };
  }

  // Compute edge path with slight curve
  function edgePath(e) {
    const fn = NODES.find(n => n.id === e.from);
    const tn = NODES.find(n => n.id === e.to);
    const mx = (fn.x + tn.x) / 2 + (tn.y - fn.y) * 0.15;
    const my = (fn.y + tn.y) / 2 - (tn.x - fn.x) * 0.15;
    return `M${fn.x},${fn.y} Q${mx},${my} ${tn.x},${tn.y}`;
  }

  const hoveredEdges = hovered
    ? EDGES.filter(e => e.from === hovered || e.to === hovered)
    : [];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
          🫀 Organ Interaction Graph
        </h2>
        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
          Live organ dependency network — hover organs to highlight pathways.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>

        {/* Graph */}
        <div className="glass-card" style={{ padding: "16px", overflow: "hidden" }}>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`}
            style={{ display: "block", maxHeight: 420 }}>
            <Defs edges={EDGES} />

            {/* Grid background */}
            <g opacity="0.06">
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={`v${i}`} x1={i*50} y1={0} x2={i*50} y2={H} stroke="#38bdf8" strokeWidth="0.5"/>
              ))}
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`h${i}`} x1={0} y1={i*50} x2={W} y2={i*50} stroke="#38bdf8" strokeWidth="0.5"/>
              ))}
            </g>

            {/* Edges */}
            {EDGES.map((e, i) => {
              const isHighlighted = hoveredEdges.includes(e);
              const opacity = hovered ? (isHighlighted ? 1 : 0.08) : 0.35;
              const path = edgePath(e);
              const mid  = edgeMid(e);
              // Animated dot along path
              const dashOffset = -(animStep * e.strength * 2);
              return (
                <g key={i}>
                  {/* Base edge */}
                  <path d={path} stroke={e.color} strokeWidth={isHighlighted ? 2.5 : 1.5}
                    fill="none" opacity={opacity}
                    strokeDasharray={isHighlighted ? "none" : "4 3"}
                    markerEnd={`url(#arrow-${e.color.replace("#","")})`}/>
                  {/* Animated flow dots */}
                  {isHighlighted && (
                    <path d={path} stroke={e.color} strokeWidth="3" fill="none"
                      strokeDasharray="8 40" strokeDashoffset={dashOffset}
                      opacity="0.9"/>
                  )}
                  {/* Edge label */}
                  {isHighlighted && (
                    <text x={mid.x} y={mid.y - 6} textAnchor="middle"
                      style={{ fontSize: 9, fill: e.color, fontWeight: 700,
                               fontFamily: "var(--font)" }}>
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map(node => {
              const r    = nodeRisk(node.id, risks);
              const col  = r !== null ? riskColor(r) : node.color;
              const isHov = hovered === node.id;
              const size  = node.small ? 24 : 34;
              return (
                <g key={node.id}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}>
                  {/* Pulse ring for high risk */}
                  {r !== null && r > 50 && (
                    <circle cx={node.x} cy={node.y} r={size + 8}
                      fill="none" stroke={col} strokeWidth="1"
                      opacity={0.3 + 0.3 * Math.sin(animStep * 0.1)}>
                    </circle>
                  )}
                  {/* Node circle */}
                  <circle cx={node.x} cy={node.y} r={size}
                    fill={`${col}18`} stroke={col}
                    strokeWidth={isHov ? 3 : 1.5}
                    filter={isHov ? "url(#glow)" : undefined}
                    style={{ transition: "stroke-width 0.15s" }}
                  />
                  {/* Icon */}
                  <text x={node.x} y={node.y - 4} textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fontSize: node.small ? 14 : 20, userSelect: "none" }}>
                    {node.icon}
                  </text>
                  {/* Label */}
                  <text x={node.x} y={node.y + (node.small ? 14 : 18)}
                    textAnchor="middle"
                    style={{ fontSize: 10, fill: col, fontWeight: 700,
                             fontFamily: "var(--font)" }}>
                    {node.label.split("\n")[0]}
                  </text>
                  {/* Risk % */}
                  {r !== null && (
                    <text x={node.x} y={node.y + 30} textAnchor="middle"
                      style={{ fontSize: 11, fill: col, fontWeight: 900,
                               fontFamily: "monospace" }}>
                      {r.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend + selected node info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="glass-card" style={{ padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569",
                          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              How to Read
            </div>
            {[
              ["Solid arrow", "Direct causal pathway"],
              ["Dashed arrow", "Indirect / secondary effect"],
              ["Pulsing ring", "Elevated risk (>50%)"],
              ["Animated flow", "Hover to activate"],
            ].map(([t, d]) => (
              <div key={t} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 600 }}>{t}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{d}</div>
              </div>
            ))}
          </div>

          {hovered && (() => {
            const node = NODES.find(n => n.id === hovered);
            const outEdges = EDGES.filter(e => e.from === hovered);
            const inEdges  = EDGES.filter(e => e.to   === hovered);
            const r = nodeRisk(hovered, risks);
            return (
              <div className="glass-card" style={{ padding: "16px",
                borderColor: node.color + "44" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: node.color, marginBottom: 6 }}>
                  {node.icon} {node.label}
                  {r !== null && <span style={{ fontSize: 18, marginLeft: 8,
                                                fontFamily: "monospace" }}>{r.toFixed(0)}%</span>}
                </div>
                {outEdges.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, marginTop: 8 }}>
                      INFLUENCES →
                    </div>
                    {outEdges.map(e => (
                      <div key={e.to} style={{ fontSize: 11, color: e.color, marginBottom: 3 }}>
                        → {NODES.find(n => n.id === e.to)?.label}: {e.label}
                      </div>
                    ))}
                  </>
                )}
                {inEdges.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, marginTop: 8 }}>
                      ← INFLUENCED BY
                    </div>
                    {inEdges.map(e => (
                      <div key={e.from} style={{ fontSize: 11, color: e.color, marginBottom: 3 }}>
                        ← {NODES.find(n => n.id === e.from)?.label}: {e.label}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })()}

          {/* Risk summary */}
          <div className="glass-card" style={{ padding: "14px" }}>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase",
                          letterSpacing: "0.1em", marginBottom: 10 }}>
              Current Organ Risks
            </div>
            {[["❤️ Heart", risks.heart, "#ef4444"], ["🫘 Kidney", risks.kidney, "#38bdf8"], ["🟤 Liver", risks.liver, "#10b981"]].map(([l, v, c]) => (
              <div key={l} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: riskColor(v),
                                 fontFamily: "monospace" }}>{v.toFixed(0)}%</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${v}%`, background: riskColor(v),
                                borderRadius: 2, boxShadow: `0 0 4px ${riskColor(v)}` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
