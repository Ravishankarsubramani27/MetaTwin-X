/**
 * MetaTwin-X 3D Organ Viewer — Three.js Scene
 *
 * Uses BoxGeometry/SphereGeometry placeholders for organs.
 * To replace with a real anatomical GLTF model:
 *   1. Place your .glb file at: frontend/public/body_model.glb
 *   2. Load it with THREE.GLTFLoader
 *   3. Traverse the scene to find meshes named:
 *      mesh_heart, mesh_kidney_left, mesh_kidney_right, mesh_liver
 *   4. Apply colorForScore() to each mesh's material.color
 */

// ─── Receive scores from parent (Streamlit) ───────────────────────────────
let SCORES = { heart: 0.0, kidney: 0.0, liver: 0.0 };

// Try to get scores from URL params (for standalone testing)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('scores')) {
  try { SCORES = JSON.parse(decodeURIComponent(urlParams.get('scores'))); } catch(e) {}
}

// ─── Color utilities ──────────────────────────────────────────────────────
function colorForScore(score) {
  if (score < 0.4) return 0x4CAF50;
  if (score < 0.7) return 0xFF9800;
  return 0xF44336;
}

function hexForScore(score) {
  if (score < 0.4) return '#4CAF50';
  if (score < 0.7) return '#FF9800';
  return '#F44336';
}

function riskLabel(score) {
  if (score < 0.4) return 'Low';
  if (score < 0.7) return 'Moderate';
  return 'High';
}

// ─── Scene Setup ─────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const isMobile = window.innerWidth < 768;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
// Mobile: 50% pixel ratio to reduce GPU load (Requirement 8.6)
renderer.setPixelRatio(isMobile ? window.devicePixelRatio * 0.5 : window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
scene.fog = new THREE.Fog(0x0a0a1a, 15, 40);

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(0, 1, 8);
camera.lookAt(0, 0.5, 0);

// ─── Lighting ─────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x4488ff, 0.3);
rimLight.position.set(-5, 2, -5);
scene.add(rimLight);

// ─── Body Silhouette ──────────────────────────────────────────────────────
const torsoGeo = new THREE.CylinderGeometry(0.9, 0.75, 3.5, 16);
const torsoMat = new THREE.MeshPhongMaterial({
  color: 0x1a2a3a,
  transparent: true,
  opacity: 0.35,
});
const torso = new THREE.Mesh(torsoGeo, torsoMat);
scene.add(torso);

const headGeo = new THREE.SphereGeometry(0.55, 16, 16);
const headMat = new THREE.MeshPhongMaterial({ color: 0x1a2a3a, transparent: true, opacity: 0.3 });
const head = new THREE.Mesh(headGeo, headMat);
head.position.set(0, 2.4, 0);
scene.add(head);

// ─── Organ Definitions ────────────────────────────────────────────────────
// These are BoxGeometry/SphereGeometry placeholders.
// Replace with GLTF mesh traversal when a real model is available.
const organDefs = [
  {
    id: 'mesh_heart',
    organKey: 'heart',
    label: 'Heart',
    emoji: '❤️',
    position: new THREE.Vector3(-0.25, 0.8, 0.5),
    geometry: new THREE.SphereGeometry(0.32, 16, 16),
  },
  {
    id: 'mesh_kidney_left',
    organKey: 'kidney',
    label: 'Left Kidney',
    emoji: '🫁',
    position: new THREE.Vector3(-0.55, -0.2, 0.2),
    geometry: new THREE.SphereGeometry(0.22, 12, 12),
  },
  {
    id: 'mesh_kidney_right',
    organKey: 'kidney',
    label: 'Right Kidney',
    emoji: '🫁',
    position: new THREE.Vector3(0.55, -0.2, 0.2),
    geometry: new THREE.SphereGeometry(0.22, 12, 12),
  },
  {
    id: 'mesh_liver',
    organKey: 'liver',
    label: 'Liver',
    emoji: '🟤',
    position: new THREE.Vector3(0.4, 0.35, 0.4),
    geometry: new THREE.BoxGeometry(0.65, 0.4, 0.35),
  },
];

const organMeshes = [];
const clickableObjects = [];

organDefs.forEach(def => {
  const score = SCORES[def.organKey] || 0;
  const color = colorForScore(score);

  const mat = new THREE.MeshPhongMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.25,
    shininess: 80,
  });

  const mesh = new THREE.Mesh(def.geometry, mat);
  mesh.position.copy(def.position);
  mesh.castShadow = true;
  mesh.name = def.id;
  mesh.userData = {
    organKey: def.organKey,
    label: def.label,
    emoji: def.emoji,
    score: score,
  };

  scene.add(mesh);
  organMeshes.push(mesh);
  clickableObjects.push(mesh);
});

// ─── Label Sprites ────────────────────────────────────────────────────────
function makeTextSprite(text, score) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, 56, 10);
  ctx.fill();
  ctx.fillStyle = hexForScore(score);
  ctx.font = 'bold 20px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 38);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.4, 0.35, 1);
  return sprite;
}

const labelPositions = [
  { text: `Heart ${(SCORES.heart * 100).toFixed(0)}%`, score: SCORES.heart, pos: new THREE.Vector3(-0.25, 1.3, 0.5) },
  { text: `Kidney ${(SCORES.kidney * 100).toFixed(0)}%`, score: SCORES.kidney, pos: new THREE.Vector3(0, -0.75, 0.2) },
  { text: `Liver ${(SCORES.liver * 100).toFixed(0)}%`, score: SCORES.liver, pos: new THREE.Vector3(0.4, 0.9, 0.4) },
];

labelPositions.forEach(lp => {
  const sprite = makeTextSprite(lp.text, lp.score);
  sprite.position.copy(lp.pos);
  scene.add(sprite);
});

// ─── Camera Orbit Controls (manual) ──────────────────────────────────────
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
const spherical = { theta: 0, phi: Math.PI / 2, radius: 8 };

function updateCamera() {
  camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
  camera.position.y = spherical.radius * Math.cos(spherical.phi) + 1;
  camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
  camera.lookAt(0, 0.5, 0);
}

// Desktop mouse controls
renderer.domElement.addEventListener('mousedown', e => {
  isDragging = true;
  prevMouse = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const dx = e.clientX - prevMouse.x;
  const dy = e.clientY - prevMouse.y;
  spherical.theta -= dx * 0.01;
  spherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, spherical.phi + dy * 0.01));
  prevMouse = { x: e.clientX, y: e.clientY };
  updateCamera();
});
renderer.domElement.addEventListener('mouseup', () => { isDragging = false; });
renderer.domElement.addEventListener('mouseleave', () => { isDragging = false; });
renderer.domElement.addEventListener('wheel', e => {
  spherical.radius = Math.max(3, Math.min(20, spherical.radius + e.deltaY * 0.01));
  updateCamera();
}, { passive: true });

// Mobile touch controls (Requirement 8.4, 8.5)
let lastTouchDist = 0;
renderer.domElement.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    isDragging = true;
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: true });

renderer.domElement.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - prevMouse.x;
    const dy = e.touches[0].clientY - prevMouse.y;
    spherical.theta -= dx * 0.01;
    spherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, spherical.phi + dy * 0.01));
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    updateCamera();
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    spherical.radius = Math.max(3, Math.min(20, spherical.radius - (dist - lastTouchDist) * 0.02));
    lastTouchDist = dist;
    updateCamera();
  }
}, { passive: true });

renderer.domElement.addEventListener('touchend', () => { isDragging = false; });

// ─── Raycaster (click/tap detection) ─────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse2D = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

function handleClick(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse2D.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse2D.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse2D, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const { organKey, label, emoji, score } = obj.userData;

    // Pulse animation
    const origScale = obj.scale.clone();
    obj.scale.multiplyScalar(1.3);
    setTimeout(() => obj.scale.copy(origScale), 200);

    // Show tooltip
    tooltip.style.display = 'block';
    tooltip.style.left = (clientX + 12) + 'px';
    tooltip.style.top = (clientY - 30) + 'px';
    tooltip.innerHTML = `
      <strong>${emoji} ${label}</strong><br>
      Risk: <span style="color:${hexForScore(score)}">${(score * 100).toFixed(1)}% — ${riskLabel(score)}</span>
    `;
    setTimeout(() => { tooltip.style.display = 'none'; }, 3000);

    // Notify Streamlit (Requirement 8.3)
    if (window.Streamlit) {
      window.Streamlit.setComponentValue(organKey);
    }
    // Also postMessage for iframe communication
    window.parent.postMessage({ type: 'organ_click', organ: organKey }, '*');
  }
}

renderer.domElement.addEventListener('click', e => handleClick(e.clientX, e.clientY));
renderer.domElement.addEventListener('touchend', e => {
  if (e.changedTouches.length === 1) {
    handleClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }
});

// Hover cursor
renderer.domElement.addEventListener('mousemove', e => {
  if (isDragging) return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse2D.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse2D.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse2D, camera);
  const hits = raycaster.intersectObjects(clickableObjects);
  renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
});

// ─── Score update via postMessage (Requirement 8.7) ───────────────────────
window.addEventListener('message', e => {
  if (e.data && e.data.scores) {
    const newScores = e.data.scores;
    organMeshes.forEach(mesh => {
      const key = mesh.userData.organKey;
      const score = newScores[key];
      if (score !== undefined) {
        const color = colorForScore(score);
        mesh.material.color.setHex(color);
        mesh.material.emissive.setHex(color);
        mesh.userData.score = score;
      }
    });
  }
});

// ─── Animation Loop ───────────────────────────────────────────────────────
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.016;

  // Gentle organ pulsing
  organMeshes.forEach((mesh, i) => {
    const pulse = 1 + Math.sin(time * 1.5 + i * 1.2) * 0.03;
    mesh.scale.setScalar(pulse);
  });

  // Slow auto-rotation when idle
  if (!isDragging) {
    spherical.theta += 0.003;
    updateCamera();
  }

  renderer.render(scene, camera);
}

// ─── Resize Handler ───────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const W = container.clientWidth;
  const H = container.clientHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H);
});

// ─── Init ─────────────────────────────────────────────────────────────────
updateCamera();
animate();

if (window.Streamlit) {
  window.Streamlit.setFrameHeight(document.body.scrollHeight);
}
