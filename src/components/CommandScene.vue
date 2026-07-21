<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { CommandSceneHandle, ProjectedCard } from "../three/createCommandScene";
import { useReducedMotion } from "../composables/useReducedMotion";

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const cards = ref<ProjectedCard[]>([]);
const isReady = ref(false);
const hasFailed = ref(false);

const { prefersReducedMotion } = useReducedMotion();

let handle: CommandSceneHandle | null = null;
let resizeObserver: ResizeObserver | null = null;

function handleFrame(projected: ProjectedCard[]) {
  cards.value = projected;
}

async function init() {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  if (!container || !canvas) return;

  try {
    const supportsWebGl = (() => {
      try {
        const test = document.createElement("canvas");
        return Boolean(test.getContext("webgl2") || test.getContext("webgl"));
      } catch {
        return false;
      }
    })();
    if (!supportsWebGl) throw new Error("WebGL unavailable");

    const { createCommandScene } = await import("../three/createCommandScene");

    handle = createCommandScene({
      canvas,
      container,
      reducedMotion: prefersReducedMotion.value,
      onFrame: handleFrame,
    });

    handle.start();
    isReady.value = true;

    resizeObserver = new ResizeObserver(() => handle?.resize());
    resizeObserver.observe(container);

    document.addEventListener("visibilitychange", handleVisibility);
  } catch {
    hasFailed.value = true;
  }
}

function handleVisibility() {
  if (!handle) return;
  if (document.hidden) {
    handle.stop();
  } else if (!prefersReducedMotion.value) {
    handle.start();
  }
}

onMounted(() => {
  // Defer 3D init so it never competes with first-paint / link search interactivity.
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => init());
  } else {
    setTimeout(() => init(), 200);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  document.removeEventListener("visibilitychange", handleVisibility);
  handle?.dispose();
});
</script>

<template>
  <div ref="containerRef" class="command-scene">
    <canvas v-show="!hasFailed" ref="canvasRef" class="command-scene__canvas" aria-hidden="true"></canvas>

    <div v-if="hasFailed" class="command-scene__fallback" aria-hidden="true"></div>

    <div class="command-scene__cards">
      <div
        v-for="card in cards"
        :key="card.label"
        class="command-scene__card"
        :class="{ 'command-scene__card--visible': isReady && card.visible }"
        :style="{
          transform: `translate3d(${card.x}px, ${card.y}px, 0) translate(-50%, -50%) scale(${card.scale})`,
        }"
      >
        {{ card.label }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.command-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.command-scene__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.command-scene__fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 40%, rgba(52, 191, 255, 0.35), transparent 60%),
    radial-gradient(circle at 20% 80%, rgba(255, 132, 0, 0.15), transparent 55%);
}

.command-scene__cards {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.command-scene__card {
  position: absolute;
  top: 0;
  left: 0;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--color-command-border);
  color: var(--color-command-text);
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  backdrop-filter: blur(6px);
  opacity: 0;
  transition:
    opacity 0.5s var(--ease-power2-out),
    transform 0.12s linear;

  &--visible {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .command-scene__card {
    transition: none;
  }
}
</style>
