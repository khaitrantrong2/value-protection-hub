<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useReducedMotion } from "../composables/useReducedMotion";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const { prefersReducedMotion } = useReducedMotion();

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  tw: number;
}

let ctx: CanvasRenderingContext2D | null = null;
let stars: Star[] = [];
let frameId = 0;
let running = false;
let w = 0;
let h = 0;
let t = 0;

function seed() {
  const count = Math.min(160, Math.round((w * h) / 9000));
  stars = Array.from({ length: count }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.3 + 0.2,
    a: Math.random() * 0.5 + 0.2,
    tw: (i % 7) * 0.4 + Math.random() * 2,
  }));
}

function resize() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  seed();
}

function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  for (const s of stars) {
    const alpha = prefersReducedMotion.value ? s.a : s.a * (0.55 + 0.45 * Math.sin(t * 0.02 + s.tw));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 226, 255, ${alpha})`;
    ctx.fill();
  }
}

function loop() {
  if (!running) return;
  t += 1;
  draw();
  frameId = requestAnimationFrame(loop);
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize, { passive: true });
  if (prefersReducedMotion.value) {
    draw();
  } else {
    running = true;
    frameId = requestAnimationFrame(loop);
  }
});

onBeforeUnmount(() => {
  running = false;
  cancelAnimationFrame(frameId);
  window.removeEventListener("resize", resize);
});
</script>

<template>
  <canvas ref="canvasRef" class="starfield" aria-hidden="true"></canvas>
</template>

<style scoped>
.starfield {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>
