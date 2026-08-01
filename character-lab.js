import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODELS = {
  khai: { path: 'public/models/crew/khai.glb', label: 'Khải', accent: '#35D6FF' },
  lan:  { path: 'public/models/crew/lan.glb',  label: 'Lan',  accent: '#B388FF' },
};
const REQUIRED_CLIPS = ['Idle', 'Wave', 'Salute', 'Point'];
// Meshy exports use descriptive names — map them onto our required roles.
const CLIP_ALIASES = {
  Idle:   ['Idle', 'Idle_11', 'Idle_', 'Breathing'],
  Wave:   ['Wave', 'Wave_for_Help_4', 'Waving', 'Hello'],
  Salute: ['Salute', 'Agree_Gesture', 'Confident_Strut', 'Saluting'],
  Point:  ['Point', 'Pointing', 'Backflip_Jump', 'Running'],
};
function resolveClip(names, role) {
  for (const cand of CLIP_ALIASES[role] || [role]) { const i = names.indexOf(cand); if (i >= 0) return i; }
  return -1;
}
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (s) => document.querySelector(s);
const overlay = $('#overlay');

/* ---------- scene ---------- */
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
camera.position.set(0, 1.1, 3.2);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0.9, 0);

scene.add(new THREE.HemisphereLight(0x9fd4ff, 0x101830, 0.9));
const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(2.5, 4, 3); key.castShadow = true; scene.add(key);
const fill = new THREE.DirectionalLight(0x9fd4ff, 0.7); fill.position.set(-3, 1.5, -2); scene.add(fill);
const rim = new THREE.DirectionalLight(0xbfe6ff, 1.1); rim.position.set(-1, 3, -4); scene.add(rim);

let grid = new THREE.GridHelper(6, 24, 0x2a3f6e, 0x18233f);
grid.material.transparent = true; grid.material.opacity = 0.5; scene.add(grid);
const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ opacity: 0.28 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

function resize() {
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);
resize();

const clock = new THREE.Clock();
let mixer = null, current = null, skelHelper = null, wire = false;
(function loop() {
  requestAnimationFrame(loop);
  const dt = clock.getDelta();
  if (mixer && !reduced) mixer.update(dt);
  controls.update();
  renderer.render(scene, camera);
})();

/* ---------- overlay states ---------- */
function showLoading() {
  overlay.innerHTML = `<div class="card"><div class="spin"></div><h3>Loading asset…</h3><p>Fetching and parsing the GLB.</p></div>`;
}
function showMissing(path) {
  overlay.innerHTML = `<div class="card">
    <div class="em"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M9.5 12l1.8 1.8L15 10"/></svg></div>
    <h3>Approved character asset not supplied yet.</h3>
    <p>CharacterLab is ready. Drop the approved binary glTF at the path below and it will load automatically on this tab.</p>
    <div class="path">${path}</div>
    <p style="margin-top:14px"><a class="link" href="ASSET_CONTRACT.md" target="_blank">Read the full GLB asset contract ↗</a></p>
  </div>`;
}
function showError(path, msg) {
  overlay.innerHTML = `<div class="card">
    <div class="em" style="color:#ED6A88;border-color:rgba(237,106,136,.4)"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.01"/></svg></div>
    <h3>Could not load asset</h3>
    <p>${msg}</p><div class="path">${path}</div></div>`;
}
function clearOverlay() { overlay.innerHTML = ''; }

/* ---------- disposal ---------- */
function disposeCurrent() {
  if (mixer) { mixer.stopAllAction(); mixer.uncacheRoot(mixer.getRoot()); mixer = null; }
  if (skelHelper) { scene.remove(skelHelper); skelHelper.dispose && skelHelper.dispose(); skelHelper = null; }
  if (current) {
    scene.remove(current);
    current.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => {
        Object.values(m).forEach((v) => { if (v && v.isTexture) v.dispose(); });
        m.dispose();
      });
    });
    current = null;
  }
  $('#tg-skel').setAttribute('aria-checked', 'false');
}

/* ---------- inspection ---------- */
function inspect(root, gltf, bytes) {
  let tris = 0, meshes = 0; const mats = new Set(), texs = new Set(); let texMax = 0;
  root.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) {
      meshes++;
      const g = o.geometry;
      tris += g.index ? g.index.count / 3 : (g.attributes.position ? g.attributes.position.count / 3 : 0);
      [].concat(o.material).forEach((m) => {
        if (!m) return; mats.add(m);
        Object.values(m).forEach((v) => {
          if (v && v.isTexture && v.image) { texs.add(v); const w = v.image.width || 0, h = v.image.height || 0; texMax = Math.max(texMax, w, h); }
        });
      });
    }
  });
  $('#m-tris').textContent = Math.round(tris).toLocaleString();
  $('#m-meshes').textContent = meshes;
  $('#m-mats').textContent = mats.size;
  $('#m-texs').textContent = texs.size;
  $('#m-texmax').textContent = texMax ? texMax + 'px' : '—';
  $('#m-size').textContent = bytes ? (bytes / 1048576).toFixed(2) + ' MB' : '—';

  const matNames = [...mats].map((m) => m.name || m.type);
  $('#matReport').innerHTML = matNames.length ? matNames.map((n) => `<span class="chip">${n}</span>`).join('') : '<span class="chip">—</span>';

  const clipNames = (gltf.animations || []).map((a) => a.name);
  $('#clipReport').innerHTML = REQUIRED_CLIPS.map((role) => {
    const i = resolveClip(clipNames, role); const ok = i >= 0;
    return `<span class="chip ${ok ? 'ok' : 'miss'}">${ok ? '✓ ' : '✕ '}${role}${ok && clipNames[i] !== role ? ' ← ' + clipNames[i] : ''}</span>`;
  }).join('');
}

function frame(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  controls.target.set(center.x, center.y, center.z);
  window.__labState = { center, radius: Math.max(size.x, size.y, size.z) * 0.5 + 0.001 };
  setView('front');
}
function setView(v) {
  const s = window.__labState; if (!s) return;
  const d = s.radius * 3.0, c = s.center;
  const pos = {
    front: [0, 0, d], threequarter: [d * 0.7, d * 0.25, d * 0.7], side: [d, 0, 0], back: [0, 0, -d],
  }[v] || [0, 0, d];
  camera.position.set(c.x + pos[0], c.y + pos[1] * 0.6 + s.radius * 0.3, c.z + pos[2]);
  controls.target.copy(c); controls.update();
  document.querySelectorAll('#presets .btn').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
}

/* ---------- animation binding ---------- */
let clips = [];
function bindAnimations(root, gltf) {
  clips = gltf.animations || [];
  const sel = $('#animSel');
  if (!clips.length) { sel.innerHTML = '<option>— no clips —</option>'; sel.disabled = true; return; }
  mixer = new THREE.AnimationMixer(root);
  sel.innerHTML = clips.map((c, i) => `<option value="${i}">${c.name} · ${c.duration.toFixed(1)}s</option>`).join('');
  sel.disabled = false;
  const idle = resolveClip(clips.map((c) => c.name), 'Idle');
  playClip(idle >= 0 ? idle : 0);
  sel.value = String(idle >= 0 ? idle : 0);
}
function playClip(i) {
  if (!mixer || !clips[i]) return;
  mixer.stopAllAction();
  const action = mixer.clipAction(clips[i]);
  action.reset().play();
  if (reduced) { action.play(); mixer.update(0); action.paused = true; }
}

/* ---------- load ---------- */
const loader = new GLTFLoader();
let loadToken = 0;
async function load(charKey) {
  const token = ++loadToken;
  const { path } = MODELS[charKey];
  disposeCurrent();
  resetInspection();
  showLoading();
  // size probe (also acts as existence check)
  let bytes = 0;
  try {
    const res = await fetch(path);
    if (!res.ok) { if (token === loadToken) showMissing(path); setToolbar(false); return; }
    const buf = await res.arrayBuffer(); bytes = buf.byteLength;
    loader.parse(buf, '', (gltf) => {
      if (token !== loadToken) return;
      const root = gltf.scene; scene.add(root); current = root;
      root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      inspect(root, gltf, bytes);
      bindAnimations(root, gltf);
      frame(root);
      applyWire(); setToolbar(true); clearOverlay();
    }, (err) => { if (token === loadToken) { showError(path, 'The file exists but failed to parse as glTF 2.0.'); setToolbar(false); } });
  } catch (e) {
    if (token === loadToken) showMissing(path);
    setToolbar(false);
  }
}

function resetInspection() {
  ['m-tris', 'm-meshes', 'm-mats', 'm-texs', 'm-texmax', 'm-size'].forEach((id) => { $('#' + id).textContent = '—'; });
  $('#clipReport').innerHTML = REQUIRED_CLIPS.map((n) => `<span class="chip">${n}</span>`).join('');
  $('#matReport').innerHTML = '<span class="chip">—</span>';
  $('#animSel').innerHTML = '<option>— no clips —</option>'; $('#animSel').disabled = true;
}
function setToolbar(on) {
  document.querySelectorAll('#presets .btn').forEach((b) => (b.disabled = !on));
}

/* ---------- display toggles ---------- */
function applyWire() { if (!current) return; current.traverse((o) => { if (o.isMesh) [].concat(o.material).forEach((m) => { if (m) m.wireframe = wire; }); }); }
function toggleSkeleton(on) {
  if (on && current && !skelHelper) { skelHelper = new THREE.SkeletonHelper(current); skelHelper.material.linewidth = 2; scene.add(skelHelper); }
  else if (!on && skelHelper) { scene.remove(skelHelper); skelHelper = null; }
}

/* ---------- UI wiring ---------- */
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.setAttribute('aria-selected', x === t ? 'true' : 'false'));
  load(t.dataset.char);
}));
document.querySelectorAll('#presets .btn').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
$('#animSel').addEventListener('change', (e) => playClip(+e.target.value));

function wireSwitch(id, fn) {
  const el = $('#' + id);
  const flip = () => { const on = el.getAttribute('aria-checked') !== 'true'; el.setAttribute('aria-checked', String(on)); fn(on); };
  el.addEventListener('click', flip);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
}
wireSwitch('tg-wire', (on) => { wire = on; applyWire(); });
wireSwitch('tg-skel', (on) => toggleSkeleton(on));
wireSwitch('tg-grid', (on) => { grid.visible = on; });

load('khai');
