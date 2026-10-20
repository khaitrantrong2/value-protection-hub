<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useReducedMotion } from '../composables/useReducedMotion';

/** Landing planet — a spherical latitude/longitude wireframe with a restrained amethyst glow,
 *  faint orbital rings and the real Intrepid mark at its centre. Distinct from GalaxyCore's
 *  geodesic mesh (which UniverseStage keeps). Drawn on canvas so one instance can persist and
 *  scale across the Hero → Mission transition. */
const canvas = ref<HTMLCanvasElement | null>(null);
const WIRE = '233,221,255';
const { prefersReducedMotion } = useReducedMotion();

let raf = 0;
let resize: ResizeObserver | undefined;
let stopMotionWatch: (() => void) | undefined;

function sphere(theta: number, phi: number, tilt: number) {
  const cp = Math.cos(phi), x = cp * Math.cos(theta), y = Math.sin(phi), z = cp * Math.sin(theta);
  const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
  return { x, y: y2, z: z2 };
}

onMounted(() => {
  const cv = canvas.value;
  if (!cv) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const tilt = 0.42;
  const MERIDIANS = 14, PARALLELS = 7;
  let W = 1, H = 1, ry = 0;

  function fit() {
    W = Math.max(1, cv!.clientWidth); H = Math.max(1, cv!.clientHeight);
    cv!.width = Math.round(W * dpr); cv!.height = Math.round(H * dpr);
  }

  function strokePath(points: { x: number; y: number; z: number }[], cx: number, cy: number, R: number) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      const za = (a.z + b.z) / 2, al = 0.10 + 0.42 * ((za + 1) / 2);
      ctx!.strokeStyle = `rgba(${WIRE},${al.toFixed(3)})`;
      ctx!.lineWidth = za > 0 ? 1 : 0.55;
      ctx!.beginPath(); ctx!.moveTo(cx + a.x * R, cy - a.y * R); ctx!.lineTo(cx + b.x * R, cy - b.y * R); ctx!.stroke();
    }
  }

  function ring(cx: number, cy: number, R: number, rot: number, squash: number) {
    ctx!.save();
    ctx!.translate(cx, cy); ctx!.rotate(rot);
    ctx!.strokeStyle = `rgba(190,160,240,.14)`; ctx!.lineWidth = 1;
    ctx!.beginPath(); ctx!.ellipse(0, 0, R, R * squash, 0, 0, Math.PI * 2); ctx!.stroke();
    ctx!.restore();
  }

  function glint(cx: number, cy: number, R: number, angle: number, rot: number, squash: number) {
    ctx!.save();
    ctx!.translate(cx, cy); ctx!.rotate(rot);
    const x = Math.cos(angle) * R, y = Math.sin(angle) * R * squash;
    const light = ctx!.createRadialGradient(x, y, 0, x, y, 7);
    light.addColorStop(0, 'rgba(245,227,193,.65)');
    light.addColorStop(.25, 'rgba(207,181,240,.25)');
    light.addColorStop(1, 'rgba(207,181,240,0)');
    ctx!.fillStyle = light;
    ctx!.fillRect(x - 7, y - 7, 14, 14);
    ctx!.restore();
  }

  function frame() {
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.34;

    // restrained glow
    const g = ctx!.createRadialGradient(cx, cy, R * 0.08, cx, cy, R * 1.5);
    g.addColorStop(0, 'rgba(180,120,255,.5)'); g.addColorStop(.5, 'rgba(124,58,237,.18)'); g.addColorStop(1, 'rgba(20,10,50,0)');
    ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(cx, cy, R * 1.5, 0, 7); ctx!.fill();

    // A narrow atmosphere, not a filled surface: preserve the approved wireframe.
    const rim = ctx!.createRadialGradient(cx, cy, R * .94, cx, cy, R * 1.09);
    rim.addColorStop(0, 'rgba(183,148,246,0)');
    rim.addColorStop(.4, 'rgba(183,148,246,.13)');
    rim.addColorStop(1, 'rgba(183,148,246,0)');
    ctx!.fillStyle = rim; ctx!.beginPath(); ctx!.arc(cx, cy, R * 1.09, 0, Math.PI * 2); ctx!.fill();
    ctx!.strokeStyle = 'rgba(220,204,250,.32)'; ctx!.lineWidth = .8;
    ctx!.beginPath(); ctx!.arc(cx, cy, R * 1.005, Math.PI * 1.03, Math.PI * 1.72); ctx!.stroke();

    // faint orbital rings
    ring(cx, cy, R * 1.32, -0.5, 0.26);
    ring(cx, cy, R * 1.18, 0.7, 0.2);
    glint(cx, cy, R * 1.32, ry * .7 + .4, -.5, .26);
    glint(cx, cy, R * 1.32, ry * .7 + 3.8, -.5, .26);
    glint(cx, cy, R * 1.18, -ry * .5 + 2.2, .7, .2);

    // latitude/longitude wireframe
    for (let m = 0; m < MERIDIANS; m++) {
      const theta0 = (m / MERIDIANS) * Math.PI * 2 + ry;
      const pts = [];
      for (let p = 0; p <= 24; p++) { const phi = -Math.PI / 2 + (p / 24) * Math.PI; pts.push(sphere(theta0, phi, tilt)); }
      strokePath(pts, cx, cy, R);
    }
    for (let p = 1; p < PARALLELS; p++) {
      const phi = -Math.PI / 2 + (p / PARALLELS) * Math.PI;
      const pts = [];
      for (let t = 0; t <= 48; t++) { const theta = (t / 48) * Math.PI * 2 + ry; pts.push(sphere(theta, phi, tilt)); }
      strokePath(pts, cx, cy, R);
    }
  }

  fit();
  resize = new ResizeObserver(() => { fit(); if (prefersReducedMotion.value) frame(); });
  resize.observe(cv);
  let last = 0;
  const loop = (now: number) => { const dt = last ? Math.min(now - last, 100) / 1000 : 0; last = now; if (!document.hidden) { ry += 0.1 * dt; frame(); } raf = requestAnimationFrame(loop); };
  stopMotionWatch = watch(prefersReducedMotion, reduced => {
    cancelAnimationFrame(raf);
    last = 0;
    if (reduced) frame();
    else raf = requestAnimationFrame(loop);
  }, { immediate: true });
});

onBeforeUnmount(() => { stopMotionWatch?.(); if (raf) cancelAnimationFrame(raf); resize?.disconnect(); });
</script>

<template>
  <div class="landing-planet">
    <canvas ref="canvas" class="landing-planet__canvas" aria-hidden="true" />
    <img class="landing-planet__mark" src="/brand/intrepid-mark.png" alt="" aria-hidden="true" />
  </div>
</template>

<style scoped>
.landing-planet { position: absolute; inset: 0; display: block; }
.landing-planet__canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.landing-planet__mark { position: absolute; top: 50%; left: 50%; width: 26%; transform: translate(-50%, -50%); filter: drop-shadow(0 4px 18px rgba(0,0,0,.45)); pointer-events: none; }
</style>
