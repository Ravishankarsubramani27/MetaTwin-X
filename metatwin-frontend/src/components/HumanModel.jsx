/**
 * HumanModel.jsx — 3D Digital Twin with:
 * - Risk-based organ color/glow (heart=red, kidney=blue, liver=amber)
 * - Click organ → popup with risk %, SHAP-style detail, biomarkers
 * - Pulse animation for high-risk heart
 * - Fallback solid body when mesh names don't match
 */
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const MODEL_PATH = "/models/human.glb";
const IS_DEV = process.env.NODE_ENV === "development";

// ── Organ config ──────────────────────────────────────────────────────
const ORGAN_CONFIG = {
  heart:  { color: "#ef4444", glow: "#ff0000", threshold: 30,  pulse: true  },
  kidney: { color: "#38bdf8", glow: "#00aaff", threshold: 20,  pulse: false },
  liver:  { color: "#f59e0b", glow: "#ffaa00", threshold: 30,  pulse: false },
};

// Name fragments that map to each organ (case-insensitive)
const ORGAN_KEYWORDS = {
  heart:  ["heart","cardiac","cor"],
  kidney: ["kidney","renal","nephro"],
  liver:  ["liver","hepat"],
};

function riskToColor(organKey, riskPct) {
  const cfg = ORGAN_CONFIG[organKey];
  if (!cfg) return "#94a3b8";
  if (riskPct >= 70) return "#ef4444";
  if (riskPct >= 40) return "#f59e0b";
  return "#10b981";
}

function cloneMat(mat) {
  return Array.isArray(mat) ? mat.map(m => m.clone()) : mat.clone();
}

function getMats(mesh) {
  if (!mesh.material) return [];
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function applyColor(mat, hex, emissiveIntensity = 0) {
  if (!mat) return;
  mat.color.set(hex);
  if (mat.emissive) {
    mat.emissive.set(emissiveIntensity > 0 ? hex : "#000000");
    mat.emissiveIntensity = emissiveIntensity;
  }
  mat.needsUpdate = true;
}

function detectOrgan(name) {
  const n = name.toLowerCase();
  for (const [organ, kws] of Object.entries(ORGAN_KEYWORDS)) {
    if (kws.some(k => n.includes(k))) return organ;
  }
  return null;
}

// ── Main component ────────────────────────────────────────────────────
export default function HumanModel({
  risks = { heart: 0, kidney: 0, liver: 0 },
  onOrganClick,
}) {
  const { scene }    = useGLTF(MODEL_PATH);
  const meshLogged   = useRef(false);
  const heartMeshRef = useRef(null);
  const pulseRef     = useRef(0);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(child => {
      if (child.isMesh) child.material = cloneMat(child.material);
    });
    return clone;
  }, [scene]);

  // ── Pulse animation for heart (useFrame) ────────────────────────────
  useFrame((_, delta) => {
    if (!heartMeshRef.current) return;
    const heartRisk = risks.heart || 0;
    if (heartRisk >= 40) {
      pulseRef.current += delta * (heartRisk >= 70 ? 4 : 2.5);
      const pulse = 1 + Math.sin(pulseRef.current) * 0.04;
      heartMeshRef.current.scale.setScalar(pulse);
    } else {
      heartMeshRef.current.scale.setScalar(1);
    }
  });

  // ── Color + interaction on risk change ──────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const foundOrgans = {};

    model.traverse(child => {
      if (!child.isMesh) return;

      const organ = detectOrgan(child.name);

      if (IS_DEV && !meshLogged.current) {
        console.log("[HumanModel] mesh:", child.name, "→ organ:", organ || "body");
      }

      // Reset
      getMats(child).forEach(m => {
        if (m.emissive) m.emissive.set("#000000");
        if (m.emissiveIntensity !== undefined) m.emissiveIntensity = 0;
      });

      if (organ && ORGAN_CONFIG[organ]) {
        foundOrgans[organ] = child;
        const riskPct = risks[organ] || 0;
        const col = riskToColor(organ, riskPct);
        const glow = riskPct >= 40 ? (riskPct >= 70 ? 0.9 : 0.5) : 0.1;

        getMats(child).forEach(m => applyColor(m, col, glow));

        if (organ === "heart") heartMeshRef.current = child;

        // Click handler
        child.userData.organ = organ;
        child.onClick = (e) => {
          e.stopPropagation();
          if (onOrganClick) onOrganClick(organ, riskPct);
        };
      } else {
        // Body mesh — semi-transparent dark
        getMats(child).forEach(m => {
          applyColor(m, "#1e293b", 0);
          m.transparent = true;
          m.opacity = 0.55;
        });
      }
    });

    if (IS_DEV && !meshLogged.current) {
      meshLogged.current = true;
      const missing = Object.keys(ORGAN_KEYWORDS)
        .filter(k => !foundOrgans[k]);
      if (missing.length > 0) {
        console.warn("[HumanModel] Could not find meshes for:", missing);
        console.warn("[HumanModel] Tip: mesh names must contain heart/kidney/liver");
      }
    }
  }, [model, risks.heart, risks.kidney, risks.liver, onOrganClick]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pointer events ───────────────────────────────────────────────────
  const handleClick = (e) => {
    e.stopPropagation();
    const organ = e.object?.userData?.organ;
    if (organ && onOrganClick) {
      onOrganClick(organ, risks[organ] || 0);
    }
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    document.body.style.cursor = e.object?.userData?.organ ? "pointer" : "default";
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "default";
  };

  return (
    <primitive
      object={model}
      scale={1.6}
      position={[0, -0.5, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}

useGLTF.preload(MODEL_PATH);
