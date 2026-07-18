/**
 * Human3D.js — Procedural 3D anatomical human with React Three Fiber
 * No external .glb required — built entirely from Three.js primitives
 * Organs: Heart, Liver, Left Kidney, Right Kidney
 * Features: Orbit controls, ambient glow, pulsing organs, click-to-inspect
 */
import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/* ── colour helpers ── */
function riskColor(pct) {
  if (pct <= 20) return new THREE.Color("#10b981");
  if (pct <= 40) return new THREE.Color("#f59e0b");
  if (pct <= 60) return new THREE.Color("#f97316");
  if (pct <= 80) return new THREE.Color("#ef4444");
  return new THREE.Color("#dc2626");
}

/* ── Pulsing organ mesh ── */
function OrganMesh({ position, geometry, color, emissive, scale = 1, pulse = false, onClick, hovered, onHover }) {
  const meshRef = useRef();
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    t.current += delta * (pulse ? 2.5 : 0.8);
    const s = pulse
      ? scale * (1 + Math.sin(t.current) * 0.06)
      : scale * (1 + Math.sin(t.current * 0.5) * 0.015);
    meshRef.current.scale.setScalar(s);
    if (hovered) {
      meshRef.current.material.emissiveIntensity = 0.7 + Math.sin(t.current * 3) * 0.2;
    } else {
      meshRef.current.material.emissiveIntensity = pulse ? 0.4 + Math.sin(t.current) * 0.15 : 0.15;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      geometry={geometry}
      onClick={onClick}
      onPointerOver={e => { e.stopPropagation(); onHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={e => { e.stopPropagation(); onHover(false); document.body.style.cursor = "default"; }}
      castShadow
    >
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.2}
        roughness={0.45}
        metalness={0.1}
        transparent
        opacity={hovered ? 0.95 : 0.85}
      />
    </mesh>
  );
}

/* ── Wireframe body part ── */
function BodyPart({ geometry, position, rotation, opacity = 0.18 }) {
  return (
    <mesh position={position} rotation={rotation} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color="#38bdf8" emissive="#38bdf8"
        emissiveIntensity={0.06} roughness={0.9} metalness={0}
        transparent opacity={opacity} wireframe={false}
      />
    </mesh>
  );
}

/* ── Scene ── */
function HumanScene({ risks, onOrganClick }) {
  const [hoveredOrgan, setHoveredOrgan] = useState(null);

  const hr = risks.heart  || 0;
  const kr = risks.kidney || 0;
  const lr = risks.liver  || 0;

  /* Geometries — built once */
  const geo = useMemo(() => ({
    // Head
    head: new THREE.SphereGeometry(0.32, 24, 20),
    // Neck
    neck: new THREE.CylinderGeometry(0.11, 0.13, 0.22, 16),
    // Torso
    torso: new THREE.CapsuleGeometry(0.38, 1.0, 8, 16),
    // Shoulders
    shoulder: new THREE.SphereGeometry(0.18, 16, 12),
    // Upper arms
    uArm: new THREE.CapsuleGeometry(0.095, 0.52, 6, 12),
    // Forearms
    fArm: new THREE.CapsuleGeometry(0.075, 0.44, 6, 12),
    // Hands
    hand: new THREE.SphereGeometry(0.09, 10, 8),
    // Pelvis
    pelvis: new THREE.SphereGeometry(0.31, 16, 10),
    // Upper legs
    uLeg: new THREE.CapsuleGeometry(0.115, 0.58, 6, 12),
    // Lower legs
    lLeg: new THREE.CapsuleGeometry(0.095, 0.5, 6, 12),
    // Feet
    foot: new THREE.SphereGeometry(0.1, 10, 6),
    // Organs
    heart: new THREE.SphereGeometry(0.11, 14, 12),
    liver: new THREE.SphereGeometry(1, 10, 8).applyMatrix4(new THREE.Matrix4().makeScale(0.19, 0.1, 0.15)),
    kidney: new THREE.SphereGeometry(1, 10, 8).applyMatrix4(new THREE.Matrix4().makeScale(0.075, 0.1, 0.065)),
  }), []);

  const hc = riskColor(hr), lc = riskColor(lr), kc = riskColor(kr);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 3]} intensity={0.9} color="#a0c8ff" castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} color="#7c3aed" />
      <pointLight position={[0, 0, 2]} intensity={0.5} color="#38bdf8" distance={6} />
      <fog attach="fog" args={["#060b14", 6, 18]} />

      {/* ── BODY SILHOUETTE ── */}
      {/* Head */}
      <BodyPart geometry={geo.head} position={[0, 2.48, 0]} opacity={0.22} />
      {/* Neck */}
      <BodyPart geometry={geo.neck} position={[0, 2.08, 0]} opacity={0.2} />
      {/* Torso */}
      <BodyPart geometry={geo.torso} position={[0, 1.18, 0]} opacity={0.18} />
      {/* Pelvis */}
      <BodyPart geometry={geo.pelvis} position={[0, 0.36, 0]} opacity={0.16} />

      {/* Shoulders */}
      <BodyPart geometry={geo.shoulder} position={[ 0.56, 1.72, 0]} opacity={0.2} />
      <BodyPart geometry={geo.shoulder} position={[-0.56, 1.72, 0]} opacity={0.2} />

      {/* Left arm */}
      <BodyPart geometry={geo.uArm}  position={[ 0.72, 1.36, 0]} rotation={[0,0, 0.22]} opacity={0.18} />
      <BodyPart geometry={geo.fArm}  position={[ 0.84, 0.82, 0]} rotation={[0,0, 0.12]} opacity={0.16} />
      <BodyPart geometry={geo.hand}  position={[ 0.9,  0.43, 0]} opacity={0.18} />
      {/* Right arm */}
      <BodyPart geometry={geo.uArm}  position={[-0.72, 1.36, 0]} rotation={[0,0,-0.22]} opacity={0.18} />
      <BodyPart geometry={geo.fArm}  position={[-0.84, 0.82, 0]} rotation={[0,0,-0.12]} opacity={0.16} />
      <BodyPart geometry={geo.hand}  position={[-0.9,  0.43, 0]} opacity={0.18} />

      {/* Left leg */}
      <BodyPart geometry={geo.uLeg}  position={[ 0.22,-0.2, 0]} rotation={[0,0, 0.05]} opacity={0.18} />
      <BodyPart geometry={geo.lLeg}  position={[ 0.22,-0.88, 0]} opacity={0.17} />
      <BodyPart geometry={geo.foot}  position={[ 0.22,-1.24, 0.06]} opacity={0.2} />
      {/* Right leg */}
      <BodyPart geometry={geo.uLeg}  position={[-0.22,-0.2, 0]} rotation={[0,0,-0.05]} opacity={0.18} />
      <BodyPart geometry={geo.lLeg}  position={[-0.22,-0.88, 0]} opacity={0.17} />
      <BodyPart geometry={geo.foot}  position={[-0.22,-1.24, 0.06]} opacity={0.2} />

      {/* ── RIBCAGE WIREFRAME ── */}
      {[0,1,2,3,4].map(i => (
        <mesh key={`rib-${i}`} position={[0, 1.72 - i * 0.16, 0]}>
          <torusGeometry args={[0.31 - i*0.015, 0.014, 6, 24, Math.PI*1.7]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.13} />
        </mesh>
      ))}
      {/* Spine */}
      <mesh position={[0, 1.1, -0.08]}>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 6]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.1} />
      </mesh>

      {/* ── CLICKABLE ORGANS ── */}

      {/* Heart */}
      <OrganMesh
        position={[-0.1, 1.38, 0.26]}
        geometry={geo.heart}
        color={hc}
        emissive={hc}
        scale={1}
        pulse={hr >= 30}
        hovered={hoveredOrgan === "heart"}
        onHover={v => setHoveredOrgan(v ? "heart" : null)}
        onClick={e => { e.stopPropagation(); onOrganClick("heart", hr); }}
      />

      {/* Liver */}
      <OrganMesh
        position={[0.12, 1.12, 0.22]}
        geometry={geo.liver}
        color={lc}
        emissive={lc}
        scale={1}
        pulse={lr >= 50}
        hovered={hoveredOrgan === "liver"}
        onHover={v => setHoveredOrgan(v ? "liver" : null)}
        onClick={e => { e.stopPropagation(); onOrganClick("liver", lr); }}
      />

      {/* Left kidney */}
      <OrganMesh
        position={[0.22, 0.98, -0.14]}
        geometry={geo.kidney}
        color={kc}
        emissive={kc}
        scale={1}
        pulse={kr >= 50}
        hovered={hoveredOrgan === "kidney"}
        onHover={v => setHoveredOrgan(v ? "kidney" : null)}
        onClick={e => { e.stopPropagation(); onOrganClick("kidney", kr); }}
      />
      {/* Right kidney */}
      <OrganMesh
        position={[-0.22, 0.98, -0.14]}
        geometry={geo.kidney}
        color={kc}
        emissive={kc}
        scale={1}
        pulse={false}
        hovered={hoveredOrgan === "kidney"}
        onHover={v => setHoveredOrgan(v ? "kidney" : null)}
        onClick={e => { e.stopPropagation(); onOrganClick("kidney", kr); }}
      />

      {/* Glow halo for heart */}
      {hoveredOrgan === "heart" && (
        <pointLight position={[-0.1, 1.38, 0.26]} intensity={1.2} distance={0.6} color={hc} />
      )}
      {hoveredOrgan === "liver" && (
        <pointLight position={[0.12, 1.12, 0.22]} intensity={1.0} distance={0.55} color={lc} />
      )}
      {hoveredOrgan === "kidney" && (
        <pointLight position={[0, 0.98, -0.14]} intensity={1.0} distance={0.5} color={kc} />
      )}

      {/* Floor grid */}
      <gridHelper args={[6, 20, "#38bdf8", "#0f2040"]} position={[0, -1.45, 0]} />
      <OrbitControls
        enablePan={false} minDistance={2.5} maxDistance={7}
        maxPolarAngle={Math.PI * 0.85}
        target={[0, 0.8, 0]}
      />
    </>
  );
}

/* ── Organ info popup ── */
const ORGAN_INFO = {
  heart:  {
    name: "Heart — Cardiovascular",
    icon: "❤️",
    markers: ["Systolic BP", "LDL Cholesterol", "Fasting Glucose", "HDL"],
    advice: { low:"Normal. Annual ECG recommended.", mod:"Moderate CVD risk. Monitor lipids and BP.", high:"High risk. Urgent cardiology review needed." },
  },
  liver:  {
    name: "Liver — Hepatic System",
    icon: "🟤",
    markers: ["ALT", "AST", "Bilirubin", "GGT", "BMI"],
    advice: { low:"Enzymes normal. No intervention needed.", mod:"Mild stress. Reduce alcohol and refined carbs.", high:"High risk. Hepatology evaluation required." },
  },
  kidney: {
    name: "Kidneys — Renal System",
    icon: "🫘",
    markers: ["Serum Creatinine", "eGFR", "Urea", "Blood Pressure"],
    advice: { low:"Renal function normal. Stay hydrated.", mod:"Moderate risk. Monitor creatinine and eGFR.", high:"High risk. Nephrology referral urgently needed." },
  },
};

function OrganPopup({ organ, pct, onClose }) {
  if (!organ) return null;
  const info = ORGAN_INFO[organ];
  const col = pct <= 20 ? "#10b981" : pct <= 40 ? "#f59e0b" : pct <= 60 ? "#f97316" : pct <= 80 ? "#ef4444" : "#dc2626";
  const lvl = pct >= 60 ? "high" : pct >= 30 ? "mod" : "low";

  return (
    <div style={{
      position:"absolute", top:16, right:16, zIndex:20,
      width:260,
      background:"rgba(4,9,18,0.97)",
      border:`1px solid ${col}44`,
      borderTop:`3px solid ${col}`,
      borderRadius:12,
      boxShadow:`0 8px 32px rgba(0,0,0,0.7), 0 0 24px ${col}22`,
      backdropFilter:"blur(16px)",
      animation:"fadeIn 0.15s ease",
      padding:"14px 16px",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#e2e8f0" }}>{info.icon} {info.name}</div>
          <div style={{ fontSize:26, fontWeight:900, color:col, fontFamily:"var(--font-mono)", textShadow:`0 0 10px ${col}99` }}>
            {pct.toFixed(1)}%
          </div>
        </div>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.07)", border:"none", color:"#64748b", borderRadius:6, width:22, height:22, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
      </div>

      <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, marginBottom:10 }}>
        <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:col, borderRadius:2, boxShadow:`0 0 6px ${col}` }} />
      </div>

      <div style={{ fontSize:11, color:"#cbd5e1", lineHeight:1.65, marginBottom:10 }}>
        {info.advice[lvl]}
      </div>

      <div style={{ fontSize:8, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Key Biomarkers</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
        {info.markers.map(m => (
          <span key={m} style={{ background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", color:"#7dd3fc", borderRadius:6, padding:"2px 7px", fontSize:9, fontWeight:500 }}>{m}</span>
        ))}
      </div>

      {lvl === "high" && (
        <div style={{ marginTop:10, background:"rgba(239,68,68,0.09)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:7, padding:"7px 10px", fontSize:10, color:"#fca5a5", fontWeight:600 }}>
          🚨 Immediate medical consultation required
        </div>
      )}
    </div>
  );
}

/* ── Main export ── */
export default function Human3D({ risks = { heart:0, kidney:0, liver:0 } }) {
  const [popup, setPopup] = useState(null); // { organ, pct }

  return (
    <div style={{ position:"relative", width:"100%", height:"100%", background:"#020810" }}>
      <Canvas
        camera={{ position:[0, 1.2, 4.5], fov:42 }}
        shadows
        gl={{ antialias:true, alpha:false }}
        style={{ background:"linear-gradient(180deg,#010a1a 0%,#020810 100%)" }}
      >
        <HumanScene
          risks={risks}
          onOrganClick={(organ, pct) => setPopup({ organ, pct })}
        />
      </Canvas>

      <OrganPopup
        organ={popup?.organ}
        pct={popup?.pct}
        onClose={() => setPopup(null)}
      />

      <div style={{ position:"absolute", bottom:8, left:8, fontSize:8, color:"rgba(71,85,105,0.6)" }}>
        Click organs · Drag to orbit · Scroll to zoom
      </div>
    </div>
  );
}
