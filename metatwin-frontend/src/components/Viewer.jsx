/**
 * Viewer.jsx — React Three Fiber canvas with:
 * - Full 3D model with organ highlighting
 * - Click organ → popup via OrganPopup
 * - Orbit controls (rotate, zoom, pan)
 * - Loading overlay
 */
import { Suspense, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import HumanModel  from "./HumanModel";
import OrganPopup  from "./OrganPopup";

function ModelLoader() {
  return (
    <mesh>
      <capsuleGeometry args={[0.3, 1.2, 8, 16]} />
      <meshStandardMaterial color="#1e293b" wireframe />
    </mesh>
  );
}

export default function Viewer({ risks, loading = false }) {
  const safeRisks = risks ?? { heart: 0, kidney: 0, liver: 0 };
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [selectedRisk,  setSelectedRisk]  = useState(0);

  const handleOrganClick = useCallback((organ, riskPct) => {
    setSelectedOrgan(organ);
    setSelectedRisk(riskPct);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedOrgan(null);
  }, []);

  return (
    <div style={{
      width:"100%", height:540,
      background:"radial-gradient(ellipse at 50% 30%, #0a1628 0%, #020810 100%)",
      borderRadius:12, overflow:"hidden",
      position:"relative",
      border:"1px solid rgba(56,189,248,0.12)",
    }}>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position:"absolute", inset:0, zIndex:10,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          background:"rgba(2,8,16,0.85)", backdropFilter:"blur(4px)",
          gap:12,
        }}>
          <div style={{ width:32, height:32,
            border:"3px solid rgba(56,189,248,0.2)",
            borderTop:"3px solid #38bdf8",
            borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
          <div style={{ color:"#64748b", fontSize:12, fontFamily:"var(--font,Inter)" }}>
            Updating 3D model…
          </div>
        </div>
      )}

      {/* Instruction hint */}
      <div style={{
        position:"absolute", bottom:12, left:12, zIndex:5,
        fontSize:10, color:"rgba(148,163,184,0.7)",
        fontFamily:"Inter,sans-serif",
        pointerEvents:"none",
        background:"rgba(0,0,0,0.4)", borderRadius:6, padding:"4px 8px",
      }}>
        🖱 Drag to rotate · Scroll to zoom · Click organ for details
      </div>

      {/* Organ popup */}
      <OrganPopup
        organ={selectedOrgan}
        riskPct={selectedRisk}
        onClose={handleClose}
      />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 48 }}
        gl={{ antialias: true, alpha: false }}
        shadows
      >
        <color attach="background" args={["#020810"]} />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[3, 5, 3]} intensity={1.6}
          castShadow shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-2, 2, -2]} intensity={0.5} color="#38bdf8" />
        <pointLight position={[0, 2, 1]} intensity={0.8} color="#a78bfa" />

        <Suspense fallback={<ModelLoader />}>
          <HumanModel risks={safeRisks} onOrganClick={handleOrganClick} />
        </Suspense>

        <OrbitControls
          enableZoom
          enableRotate
          enablePan={false}
          minDistance={2.5}
          maxDistance={9}
          maxPolarAngle={Math.PI * 0.85}
          minPolarAngle={Math.PI * 0.1}
          autoRotate={!selectedOrgan}
          autoRotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
}
