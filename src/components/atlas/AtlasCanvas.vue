<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { AtlasStage, AtlasStageId, AtlasReference } from "../../types/atlas";
import { useAtlasCamera, type AtlasBounds } from "../../composables/useAtlasCamera";

const props = defineProps<{ stages: AtlasStage[]; references: AtlasReference[]; selectedId: AtlasStageId | null }>();
const emit = defineEmits<{ select: [id: AtlasStageId]; fit: [] }>();
const viewport = ref<HTMLElement | null>(null);
const miniature = ref<SVGSVGElement | null>(null);
const bounds = { x: 32, y: 80, width: 3136, height: 820 };
const { camera, viewportSize, dragging, focus, fit, zoom, wheel, pointerDown, pointerMove, pointerUp, centerAt, onResize } =
  useAtlasCamera(viewport, bounds, () => ({ top: 24, right: 24, bottom: 104, left: 24 }));
const shortLabels: Record<string, string> = { "01": "Contract", "02": "Inputs", "03": "Engine", "04": "VP review", "05": "Workstreams", "06": "Billing", "07": "Settle", "08": "Completion" };
const branchReferences = computed(() => props.references.filter(reference => reference.stageId === "05" && (reference.id === "BRANCH-05A" || reference.id === "BRANCH-05B")));
const parallelLegend = computed(() => branchReferences.value.length === 2 ? branchReferences.value.map(reference => reference.title).join(" ∥ ") : "Parallel workstreams");
const nodes = computed(() => props.stages.filter(stage => stage.kind === "chapter").flatMap(stage => {
  const x = 64 + (Number(stage.id) - 1) * 380;
  if (stage.id === "05") return ["A", "B"].map((suffix, index) => {
    const reference = branchReferences.value.find(item => item.id === `BRANCH-05${suffix}`);
    return { key: `05${suffix}`, stage, x, y: index === 0 ? 150 : 630, width: 300, height: 220,
      title: reference?.title || stage.shortTitle, body: reference?.body || stage.businessQuestion,
      role: reference?.applicability || stage.roleTag, short: suffix, branch: `05 ${suffix}` };
  });
  return [{ key: stage.id, stage, x, y: 390, width: 300, height: 220, title: stage.shortTitle, body: stage.businessQuestion,
    role: stage.roleTag, short: shortLabels[stage.id] ?? stage.shortTitle, branch: stage.id }];
}));
const compact = computed(() => camera.scale < 0.52);
const detailed = computed(() => camera.scale >= 0.9);
const screenNodes = computed(() => nodes.value.map(node => ({ ...node,
  cx: camera.x + (node.x + node.width / 2) * camera.scale,
  cy: camera.y + (node.y + node.height / 2) * camera.scale,
  screenWidth: Math.max(52, Math.min(320, node.width * camera.scale)),
  screenHeight: compact.value ? 64 : Math.max(128, Math.min(224, node.height * camera.scale)),
})));
const connections = computed(() => {
  const byKey = new Map(screenNodes.value.map(node => [node.key, node]));
  const edges = [["01", "02"], ["02", "03"], ["03", "04"], ["04", "05A"], ["04", "05B"], ["05A", "06"], ["05B", "06"], ["06", "07"], ["07", "08"]];
  return edges.flatMap(([from, to]) => {
    const start = byKey.get(from), end = byKey.get(to);
    if (!start || !end) return [];
    const x1 = start.cx + start.screenWidth / 2, x2 = end.cx - end.screenWidth / 2;
    const middle = (x1 + x2) / 2;
    return [{ key: `${from}-${to}`, warm: from === "05A" || to === "05A", path: `M${x1} ${start.cy} H${middle} V${end.cy} H${x2}` }];
  });
});
const discrepancy = computed(() => {
  const from = screenNodes.value.find(node => node.key === "05B"), to = screenNodes.value.find(node => node.key === "04");
  if (!from || !to) return "";
  const y = Math.max(from.cy + from.screenHeight / 2, to.cy + to.screenHeight / 2) + 24;
  return `M${from.cx} ${from.cy + from.screenHeight / 2} V${y} H${to.cx} V${to.cy + to.screenHeight / 2}`;
});
const miniWindow = computed(() => ({ x: -camera.x / camera.scale, y: -camera.y / camera.scale,
  width: viewportSize.width / camera.scale, height: viewportSize.height / camera.scale }));
function selectedBounds(): AtlasBounds | undefined {
  const matching = nodes.value.filter(node => node.stage.id === props.selectedId);
  if (!matching.length) return;
  const x = Math.min(...matching.map(node => node.x)), y = Math.min(...matching.map(node => node.y));
  return { x: x - 64, y: y - 32, width: 428, height: Math.max(...matching.map(node => node.y + node.height)) - y + 64 };
}
function frameSelection(animate = true) { const target = selectedBounds(); target ? focus(target, animate) : fit(animate); }
onResize(() => frameSelection(false));
watch(() => props.selectedId, async () => { await nextTick(); frameSelection(); });
function nodeStyle(node: typeof screenNodes.value[number]) {
  return { left: `${node.cx}px`, top: `${node.cy}px`, width: `${node.screenWidth}px`, height: `${node.screenHeight}px` };
}
function nodeVisible(node: typeof screenNodes.value[number]) {
  return node.cx - node.screenWidth / 2 >= 0 && node.cx + node.screenWidth / 2 <= viewportSize.width
    && node.cy - node.screenHeight / 2 >= 0 && node.cy + node.screenHeight / 2 <= viewportSize.height - 88;
}
function minimapClick(event: MouseEvent) {
  if (event.detail === 0) { emit("fit"); return; }
  const rect = miniature.value!.getBoundingClientRect();
  centerAt((event.clientX - rect.left) / rect.width * 3200, (event.clientY - rect.top) / rect.height * 1000);
}
function keydown(event: KeyboardEvent) {
  if (event.target !== viewport.value) return;
  if (event.key === "+" || event.key === "=") { event.preventDefault(); zoom(1.2); }
  else if (event.key === "-") { event.preventDefault(); zoom(1 / 1.2); }
  else if (event.key.toLowerCase() === "f") { event.preventDefault(); emit("fit"); }
  else if (event.key.startsWith("Arrow")) {
    event.preventDefault();
    if (event.key === "ArrowLeft") camera.x += 72;
    if (event.key === "ArrowRight") camera.x -= 72;
    if (event.key === "ArrowUp") camera.y += 72;
    if (event.key === "ArrowDown") camera.y -= 72;
  }
}
defineExpose({ fit, frameSelection });
</script>

<template>
  <div class="atlas-map-wrap">
    <div class="atlas-map-legend" aria-label="Map legend"><span>Process overview</span><span>{{ parallelLegend }}</span><span>Route-specific handoffs</span></div>
    <div ref="viewport" class="atlas-map" :class="{ 'is-dragging': dragging, 'is-compact': compact, 'is-detailed': detailed }" tabindex="0" role="region" aria-label="Process map. Drag or scroll to pan. Control plus scroll to zoom. Arrow keys pan, F fits the map."
      data-lenis-prevent @wheel="wheel" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp" @keydown="keydown">
      <svg class="atlas-paths" :viewBox="`0 0 ${viewportSize.width || 1} ${viewportSize.height || 1}`" aria-hidden="true">
        <defs><marker id="atlas-path-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1 L7 4 L1 7" /></marker></defs>
        <path v-for="edge in connections" :key="edge.key" :d="edge.path" :class="{ 'is-accounting': edge.warm }" marker-end="url(#atlas-path-arrow)" />
        <path :d="discrepancy" class="atlas-discrepancy" marker-end="url(#atlas-path-arrow)" />
      </svg>
      <button v-for="node in screenNodes" :key="node.key" type="button" class="atlas-node" :class="{ 'is-selected': selectedId === node.stage.id, 'is-accounting': node.key === '05A' }" :style="nodeStyle(node)"
        :data-atlas-node-stage="node.stage.id" :aria-label="`${node.branch}: ${node.title}. ${node.body}`" :aria-pressed="selectedId === node.stage.id" :tabindex="nodeVisible(node) ? 0 : -1" @click="emit('select', node.stage.id)">
        <span class="atlas-node-index">{{ node.branch }}</span><strong>{{ compact ? node.short : node.title }}</strong>
        <span v-if="detailed" class="atlas-node-question">{{ node.body }}</span>
        <span v-if="detailed" class="atlas-node-role">{{ node.role }}</span>
      </button>
      <div class="atlas-map-tools"><button type="button" aria-label="Zoom out" @click="zoom(1 / 1.2)">−</button><span aria-live="polite">{{ Math.round(camera.scale * 100) }}%</span><button type="button" aria-label="Zoom in" @click="zoom(1.2)">+</button><button type="button" @click="emit('fit')">Fit</button></div>
      <button type="button" class="atlas-minimap" aria-label="Move map to clicked location; press Enter to fit" @click="minimapClick">
        <svg ref="miniature" viewBox="0 0 3200 1000" preserveAspectRatio="none" aria-hidden="true"><rect v-for="node in nodes" :key="node.key" :x="node.x" :y="node.y" :width="node.width" :height="node.height" rx="12" :class="{ 'is-selected': selectedId === node.stage.id }" /><rect class="atlas-mini-window" v-bind="miniWindow" /></svg><span>Overview</span>
      </button>
    </div>
    <div class="atlas-map-foot"><span>Drag / scroll to pan · Ctrl/⌘ + scroll to zoom</span><span>Dashed arrow: discrepancy → review</span></div>
  </div>
</template>

<style scoped>
.atlas-map-wrap { min-width: 0; flex: 1; }
.atlas-map-legend,.atlas-map-foot { display: flex; justify-content: space-between; gap: 16px; padding: 12px 16px; color: var(--color-text-300); font-size: 12px; }
.atlas-map-legend { border-bottom: 1px solid var(--color-card-border); background: var(--space-navy); flex-wrap: wrap; }
.atlas-map-foot { flex-wrap: wrap; }
.atlas-map { position: relative; height: min(62vh, 640px); min-height: 460px; overflow: hidden; touch-action: none; cursor: grab; background: var(--space-deep); background-image: radial-gradient(var(--color-card-border) 1px, transparent 1px); background-size: 24px 24px; }
.atlas-map.is-dragging { cursor: grabbing; }
.atlas-paths { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.atlas-paths path { fill: none; stroke: var(--color-text-200); stroke-width: 1.5; }
.atlas-paths marker path { stroke: var(--color-text-300); }
.atlas-paths .is-accounting { stroke: var(--color-orange-400); }
.atlas-paths .atlas-discrepancy { stroke-dasharray: 5 5; }
.atlas-node { position: absolute; transform: translate(-50%,-50%); padding: 16px; border: 1px solid var(--color-card-border-hover); border-radius: var(--radius-md); background: var(--space-navy); color: var(--color-text-400); display: flex; flex-direction: column; gap: 8px; align-items: flex-start; text-align: left; overflow: hidden; cursor: pointer; }
.atlas-node:hover,.atlas-node.is-selected { border-color: var(--color-cyan-400); background: var(--color-command-bg-soft); }
.atlas-node.is-accounting { border-color: var(--color-orange-400); }
.atlas-node-index { font-size: 12px; color: var(--color-cyan-400); }
.atlas-node strong { font-size: 16px; line-height: 1.2; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.atlas-node-question { font-size: 13px; line-height: 1.35; color: var(--color-text-300); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.atlas-node-role { margin-top: auto; font-size: 12px; line-height: 1.3; color: var(--color-text-300); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.is-compact .atlas-node { padding: 6px 3px; gap: 4px; align-items: center; justify-content: center; text-align: center; }
.is-compact .atlas-node strong { font-size: 12px; line-height: 1.15; width: 100%; }
.is-detailed .atlas-node strong { font-size: 19px; -webkit-line-clamp: 2; }
.atlas-map-tools { position: absolute; left: 16px; bottom: 16px; display: flex; align-items: center; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); overflow: hidden; }
.atlas-map-tools button { min-width: 44px; height: 44px; border: 0; background: transparent; color: var(--color-text-400); }
.atlas-map-tools span { min-width: 44px; text-align: center; font-size: 12px; }
.atlas-minimap { position: absolute; right: 16px; bottom: 16px; width: 156px; padding: 8px; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); color: var(--color-text-300); font-size: 12px; }
.atlas-minimap svg { width: 100%; height: 44px; }
.atlas-minimap rect { fill: var(--color-navy-400); }
.atlas-minimap rect.is-selected { fill: var(--color-cyan-400); }
.atlas-minimap .atlas-mini-window { fill: none; stroke: var(--color-orange-400); stroke-width: 16; }
button:focus-visible,.atlas-map:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
@media (max-width: 1100px) { .atlas-map-foot span:first-child { display: none; } .atlas-map-legend { gap: 8px; } }
</style>
