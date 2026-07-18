/**
 * Generates a minimal anatomical GLB with named organ meshes for the 3D viewer.
 * Run: node scripts/generate-human-glb.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

// GLTFExporter expects browser FileReader in Node
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      Promise.resolve(blob.arrayBuffer()).then((buffer) => {
        this.result = buffer;
        const event = { target: { result: buffer } };
        this.onload?.(event);
        this.onloadend?.(event);
      });
    }
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "models");
const outFile = path.join(outDir, "human.glb");

fs.mkdirSync(outDir, { recursive: true });

const scene = new THREE.Scene();

const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.65,
  metalness: 0.05,
  transparent: true,
  opacity: 0.85,
});

const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.75, 3.5, 24), bodyMat);
torso.name = "body_torso";
scene.add(torso);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), bodyMat);
head.name = "body_head";
head.position.set(0, 2.4, 0);
scene.add(head);

function addOrgan(name, geometry, position, color) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.1,
      emissive: color,
      emissiveIntensity: 0.15,
    })
  );
  mesh.name = name;
  mesh.position.copy(position);
  scene.add(mesh);
}

addOrgan("mesh_heart", new THREE.SphereGeometry(0.32, 20, 20), new THREE.Vector3(-0.25, 0.8, 0.5), 0x64748b);
addOrgan("mesh_kidney_left", new THREE.SphereGeometry(0.22, 16, 16), new THREE.Vector3(-0.55, -0.2, 0.2), 0x64748b);
addOrgan("mesh_kidney_right", new THREE.SphereGeometry(0.22, 16, 16), new THREE.Vector3(0.55, -0.2, 0.2), 0x64748b);
addOrgan("mesh_liver", new THREE.BoxGeometry(0.65, 0.4, 0.35), new THREE.Vector3(0.4, 0.35, 0.4), 0x64748b);

const exporter = new GLTFExporter();

async function main() {
  const buffer = await exporter.parseAsync(scene, { binary: true });
  fs.writeFileSync(outFile, Buffer.from(buffer));
  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
