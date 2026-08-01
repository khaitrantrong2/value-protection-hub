<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { RING_GEOMETRY, sectors, type Sector } from "../data/sectors";
import { useLinks } from "../composables/useLinks";
import { useReducedMotion } from "../composables/useReducedMotion";
import StarfighterIcon from "./StarfighterIcon.vue";
import CommanderModel from "./CommanderModel.vue";

const { openSector } = useLinks();
const { prefersReducedMotion } = useReducedMotion();

const stageRef = ref<HTMLElement | null>(null);
const hoveredIndex = ref<number | null>(null);

const hoveredSector = computed(() => (hoveredIndex.value === null ? null : sectors[hoveredIndex.value]));
const hoveredShip = computed(() => (hoveredIndex.value === null ? null : ships[hoveredIndex.value]));

interface ShipState {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  z: number;
  front: boolean;
}

const angles = sectors.map((s) => s.ang);
const ships = reactive<ShipState[]>(sectors.map(() => ({ x: 0, y: 0, scale: 1, opacity: 1, z: 10, front: true })));

let size = { w: 0, h: 0 };
let frameId = 0;
let running = false;
let resizeObserver: ResizeObserver | null = null;

function measure() {
  const el = stageRef.value;
  if (!el) return;
  size = { w: el.clientWidth, h: el.clientHeight };
}

function positionShips() {
  const cx = size.w * 0.5;
  const cy = size.h * 0.46;
  for (let i = 0; i < sectors.length; i++) {
    const s = sectors[i];
    const ring = RING_GEOMETRY[s.ring];
    const rx = ring.rx * size.w;
    const ry = ring.ry * size.h;
    const a = angles[i];
    const depth = (Math.sin(a) + 1) / 2; // 0 = behind planet (top), 1 = front (bottom)
    ships[i].x = cx + rx * Math.cos(a);
    ships[i].y = cy + ry * Math.sin(a);
    ships[i].scale = 0.7 + depth * 0.4;
    ships[i].opacity = 0.5 + depth * 0.5;
    ships[i].front = depth > 0.42;
    ships[i].z = ships[i].front ? 20 : 6;
  }
}

function tick() {
  if (!running) return;
  if (hoveredIndex.value === null) {
    for (let i = 0; i < angles.length; i++) angles[i] += sectors[i].spd;
  } else {
    // keep the fleet drifting slowly, but ease the hovered ship almost to a stop
    for (let i = 0; i < angles.length; i++) angles[i] += sectors[i].spd * (i === hoveredIndex.value ? 0.06 : 0.4);
  }
  positionShips();
  frameId = requestAnimationFrame(tick);
}

function launch(s: Sector) {
  openSector(s.categoryId);
}

onMounted(() => {
  measure();
  positionShips();
  resizeObserver = new ResizeObserver(() => {
    measure();
    positionShips();
  });
  if (stageRef.value) resizeObserver.observe(stageRef.value);

  if (!prefersReducedMotion.value) {
    running = true;
    frameId = requestAnimationFrame(tick);
  }
});

onBeforeUnmount(() => {
  running = false;
  cancelAnimationFrame(frameId);
  resizeObserver?.disconnect();
});
</script>

<template>
  <div ref="stageRef" class="stage" aria-hidden="true">
    <!-- ambient planet glow -->
    <div class="stage__glow"></div>

    <!-- orbit rings -->
    <svg class="stage__orbits" viewBox="0 0 100 100" preserveAspectRatio="none">
      <ellipse
        v-for="(ring, r) in RING_GEOMETRY"
        :key="r"
        cx="50"
        :cy="46"
        :rx="ring.rx * 100"
        :ry="ring.ry * 100"
        class="stage__orbit"
      />
    </svg>

    <!-- glowing wireframe planet -->
    <div class="stage__planet">
      <div class="stage__planet-core"></div>
      <svg class="stage__globe" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="planetFill" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stop-color="#7fe8ff" stop-opacity="0.55" />
            <stop offset="45%" stop-color="#1f9cd5" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#0b1d4a" stop-opacity="0.05" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="82" fill="url(#planetFill)" stroke="rgba(79,217,255,.55)" stroke-width="1" />
        <g class="stage__wire">
          <ellipse cx="100" cy="100" rx="82" ry="26" />
          <ellipse cx="100" cy="100" rx="82" ry="52" />
          <ellipse cx="100" cy="100" rx="82" ry="74" />
          <ellipse cx="100" cy="100" rx="26" ry="82" />
          <ellipse cx="100" cy="100" rx="52" ry="82" />
          <ellipse cx="100" cy="100" rx="74" ry="82" />
        </g>
      </svg>
    </div>

    <!-- fleet -->
    <button
      v-for="(s, i) in sectors"
      :key="s.slug"
      class="stage__ship"
      :class="{ 'is-hovered': hoveredIndex === i }"
      :style="{
        transform: `translate(${ships[i].x}px, ${ships[i].y}px) translate(-50%, -50%) scale(${ships[i].scale})`,
        opacity: ships[i].opacity,
        zIndex: ships[i].z,
        color: s.accent,
      }"
      :aria-label="`${s.name} sector`"
      @mouseenter="hoveredIndex = i"
      @mouseleave="hoveredIndex = null"
      @focus="hoveredIndex = i"
      @blur="hoveredIndex = null"
      @click="launch(s)"
    >
      <span class="stage__ship-glow"></span>
      <StarfighterIcon :arch="s.arch" />
      <span class="stage__ship-label">{{ s.name }}</span>
    </button>

    <!-- hover tooltip -->
    <div
      v-if="hoveredSector && hoveredShip"
      class="stage__tip"
      :style="{
        transform: `translate(${hoveredShip.x}px, ${hoveredShip.y - 78}px) translate(-50%, -100%)`,
      }"
    >
      <div class="stage__tip-head">
        <span class="stage__tip-dot" :style="{ background: hoveredSector.accent }"></span>
        <span class="stage__tip-name">{{ hoveredSector.name }}</span>
        <span class="stage__tip-arch">{{ hoveredSector.archLabel }}</span>
      </div>
      <p class="stage__tip-body">{{ hoveredSector.tip }}</p>
      <div class="stage__tip-foot">
        <span>SECTOR {{ hoveredSector.code }}</span>
        <span :style="{ color: hoveredSector.accent }">NAVIGATE →</span>
      </div>
    </div>

    <!-- commander -->
    <div class="stage__commander">
      <div class="stage__commander-model">
        <CommanderModel />
      </div>
      <div class="stage__platform">
        <span class="stage__platform-ring"></span>
        <span class="stage__platform-ring stage__platform-ring--gold"></span>
        <span class="stage__platform-core"></span>
      </div>
      <div class="stage__commander-name">Commander Khải</div>
      <div class="stage__commander-role mono">VALUE PROTECTION TEAM LEAD</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stage {
  position: relative;
  width: 100%;
  height: min(72vh, 620px);
  min-height: 400px;
}

.stage__glow {
  position: absolute;
  left: 50%;
  top: 46%;
  width: min(60%, 420px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 217, 255, 0.16), rgba(31, 156, 213, 0.04) 46%, transparent 66%);
  animation: stage-pulse 7s var(--ease-power2-in) infinite;
  pointer-events: none;
}

.stage__orbits {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}

.stage__orbit {
  fill: none;
  stroke: rgba(146, 163, 199, 0.16);
  stroke-width: 0.15;
  vector-effect: non-scaling-stroke;
}

.stage__planet {
  position: absolute;
  left: 50%;
  top: 46%;
  width: min(46%, 320px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  z-index: 12;
  pointer-events: none;
}

.stage__planet-core {
  position: absolute;
  left: 42%;
  top: 40%;
  width: 46%;
  height: 46%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, #cdf3ff 0%, #4fd9ff 30%, rgba(31, 156, 213, 0.2) 62%, transparent 72%);
  filter: blur(2px);
  animation: stage-pulse 5s var(--ease-power2-in) infinite;
}

.stage__globe {
  position: relative;
  width: 100%;
  height: 100%;
  animation: stage-spin 44s linear infinite;
}

.stage__wire ellipse {
  fill: none;
  stroke: rgba(79, 217, 255, 0.28);
  stroke-width: 0.7;
}

.stage__ship {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: none;
  background: none;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    filter 0.2s ease;

  &.is-hovered {
    filter: drop-shadow(0 0 10px currentColor);
  }

  &:hover .stage__ship-label,
  &:focus-visible .stage__ship-label,
  &.is-hovered .stage__ship-label {
    opacity: 1;
  }
}

.stage__ship-glow {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 60%, currentColor, transparent 66%);
  opacity: 0.22;
  filter: blur(4px);
  pointer-events: none;
}

.stage__ship-label {
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  color: #e2ecff;
  white-space: nowrap;
  text-shadow:
    0 1px 6px #04071a,
    0 0 10px rgba(4, 7, 26, 0.9);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.stage__tip {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 80;
  width: 244px;
  pointer-events: none;
  border-radius: 16px;
  border: 1px solid rgba(79, 217, 255, 0.35);
  background: linear-gradient(180deg, rgba(9, 24, 58, 0.97), rgba(6, 16, 40, 0.97));
  backdrop-filter: blur(8px);
  box-shadow: 0 24px 60px -24px #000;
  padding: 14px 16px;
}

.stage__tip-head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 8px;
}

.stage__tip-dot {
  width: 9px;
  height: 9px;
  border-radius: 3px;
}

.stage__tip-name {
  font-weight: 600;
  font-size: 15px;
}

.stage__tip-arch {
  margin-left: auto;
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--color-text-200);
}

.stage__tip-body {
  font-size: 12.5px;
  line-height: 1.5;
  color: #a9b8d8;
  margin: 0 0 11px;
}

.stage__tip-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--color-text-200);
  border-top: 1px solid var(--color-command-border);
  padding-top: 9px;
}

.stage__commander {
  position: absolute;
  left: clamp(-4px, 1vw, 18px);
  bottom: 0;
  z-index: 45;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.stage__commander-model {
  width: 200px;
  height: 236px;
  margin-bottom: -14px;
  pointer-events: none;
}

.stage__platform {
  position: relative;
  width: 150px;
  height: 34px;
}

.stage__platform-ring {
  position: absolute;
  left: 50%;
  top: 6px;
  transform: translateX(-50%);
  width: 150px;
  height: 22px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(79, 217, 255, 0.32), rgba(79, 217, 255, 0.05) 70%, transparent);
  border: 1px solid rgba(79, 217, 255, 0.4);

  &--gold {
    top: 12px;
    height: 18px;
    background: none;
    border-color: rgba(255, 200, 87, 0.26);
  }
}

.stage__platform-core {
  position: absolute;
  left: 50%;
  top: 2px;
  transform: translateX(-50%);
  width: 92px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(79, 217, 255, 0.5), transparent);
  filter: blur(1px);
}

.stage__commander-name {
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
}

.stage__commander-role {
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--color-text-200);
}

@keyframes stage-pulse {
  0%,
  100% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.04);
  }
}

@keyframes stage-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 920px) {
  .stage {
    height: 46vh;
    min-height: 320px;
  }
  .stage__commander {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage__glow,
  .stage__planet-core,
  .stage__globe {
    animation: none;
  }
}
</style>
