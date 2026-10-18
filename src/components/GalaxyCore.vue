<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/** Amethyst geodesic core — a subdivided icosphere wireframe with an inner glow, drawn on canvas.
 *  Orbits and the Intrepid identity overlay are owned by UniverseStage, so this draws only the sphere. */
const canvas = ref<HTMLCanvasElement | null>(null);
const AMETHYST = {
  wire: [233, 221, 255] as const,
  glow: ['rgba(190,120,255,.95)', 'rgba(124,58,237,.35)', 'rgba(20,10,50,0)'] as const,
};

interface Geo { v: number[][]; edges: number[][]; faces: number[][] }
function icosphere(sub: number): Geo {
  const t = (1 + Math.sqrt(5)) / 2;
  const v: number[][] = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]]
    .map(p => { const l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l, p[1] / l, p[2] / l]; });
  let f: number[][] = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const cache: Record<string, number> = {};
  const mid = (a: number, b: number) => {
    const k = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (cache[k] != null) return cache[k];
    const p = [(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2];
    const l = Math.hypot(p[0], p[1], p[2]);
    v.push([p[0] / l, p[1] / l, p[2] / l]);
    return (cache[k] = v.length - 1);
  };
  for (let s = 0; s < sub; s++) {
    const nf: number[][] = [];
    f.forEach(tri => {
      const a = mid(tri[0], tri[1]), b = mid(tri[1], tri[2]), c = mid(tri[2], tri[0]);
      nf.push([tri[0], a, c], [tri[1], b, a], [tri[2], c, b], [a, b, c]);
    });
    f = nf;
  }
  const es: Record<string, number> = {}, edges: number[][] = [];
  f.forEach(tri => {
    for (let i = 0; i < 3; i++) {
      const a = tri[i], b = tri[(i + 1) % 3], k = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (!es[k]) { es[k] = 1; edges.push([a, b]); }
    }
  });
  return { v, edges, faces: f };
}

let raf = 0;
let resize: ResizeObserver | undefined;

onMounted(() => {
  const cv = canvas.value;
  if (!cv) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const geo = icosphere(2);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const wire = AMETHYST.wire;
  let W = 1, H = 1, ry = 0;
  const tilt = 0.5;

  function size() {
    const r = cv!.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv!.width = Math.round(W * dpr); cv!.height = Math.round(H * dpr);
  }

  function frame() {
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
    const g = ctx!.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.25);
    g.addColorStop(0, AMETHYST.glow[0]); g.addColorStop(.55, AMETHYST.glow[1]); g.addColorStop(1, AMETHYST.glow[2]);
    ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(cx, cy, R * 1.25, 0, 7); ctx!.fill();

    const cosY = Math.cos(ry), sinY = Math.sin(ry), cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    const P = geo.v.map(p => {
      const x = p[0] * cosY - p[2] * sinY, z = p[0] * sinY + p[2] * cosY, y = p[1];
      const y2 = y * cosT - z * sinT, z2 = y * sinT + z * cosT;
      return [cx + x * R, cy - y2 * R, z2];
    });
    ctx!.globalCompositeOperation = 'lighter';
    geo.faces.forEach(tri => {
      const za = (P[tri[0]][2] + P[tri[1]][2] + P[tri[2]][2]) / 3;
      if (za < 0.15) return;
      ctx!.beginPath();
      ctx!.moveTo(P[tri[0]][0], P[tri[0]][1]); ctx!.lineTo(P[tri[1]][0], P[tri[1]][1]); ctx!.lineTo(P[tri[2]][0], P[tri[2]][1]); ctx!.closePath();
      ctx!.fillStyle = `rgba(${wire[0]},${wire[1]},${wire[2]},${0.035 * za})`; ctx!.fill();
    });
    geo.edges.forEach(e => {
      const a = P[e[0]], b = P[e[1]], za = (a[2] + b[2]) / 2, al = 0.14 + 0.5 * ((za + 1) / 2);
      ctx!.strokeStyle = `rgba(${wire[0]},${wire[1]},${wire[2]},${al.toFixed(3)})`;
      ctx!.lineWidth = za > 0 ? 1 : 0.6;
      ctx!.beginPath(); ctx!.moveTo(a[0], a[1]); ctx!.lineTo(b[0], b[1]); ctx!.stroke();
    });
    ctx!.globalCompositeOperation = 'source-over';
  }

  size();
  resize = new ResizeObserver(() => { size(); if (reduced) frame(); });
  resize.observe(cv);

  if (reduced) { frame(); return; }
  const loop = () => { ry += 0.0035 * 16; frame(); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
});

onBeforeUnmount(() => { if (raf) cancelAnimationFrame(raf); resize?.disconnect(); });
</script>

<template>
  <canvas ref="canvas" class="galaxy-core" aria-hidden="true" />
</template>

<style scoped>
.galaxy-core { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
</style>
