<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import type { AtlasStage, AtlasStageId, AtlasReference } from "../../types/atlas";
import { useAtlasCamera, type AtlasBounds } from "../../composables/useAtlasCamera";
import AtlasStatus from "./AtlasStatus.vue";
import { ATLAS_SEQUENCE_EDGES, atlasOverviewBounds, buildAtlasNodes, buildSupportCapabilities, projectAtlasNodes, projectSupportCapabilities } from "./atlasTopology";

const props = defineProps<{ stages: AtlasStage[]; references: AtlasReference[]; selectedId: AtlasStageId | null; selectionKey?: string | null }>();
const emit = defineEmits<{ select: [id: AtlasStageId, nodeKey?: string]; fit: [] }>();
const viewport = ref<HTMLElement | null>(null);
const miniature = ref<SVGSVGElement | null>(null);
const { camera, viewportSize, dragging, fit, ensureVisible, panBy, measureViewport, zoom, wheel, pointerDown, pointerMove, pointerUp, centerAt } =
  useAtlasCamera(viewport, (size, padding) => atlasOverviewBounds(nodes.value, capabilities.value, size, padding), () => ({ top: 16, right: 16, bottom: 16, left: 16 }));
const branchReferences = computed(() => props.references.filter(reference => reference.stageId === "05" && (reference.id === "BRANCH-05A" || reference.id === "BRANCH-05B")));
const parallelLegend = computed(() => branchReferences.value.length === 2 ? branchReferences.value.map(reference => reference.title).join(" ∥ ") : "Parallel workstreams");
const nodes = computed(() => buildAtlasNodes(props.stages, props.references));
const capabilities = computed(() => buildSupportCapabilities(props.stages, nodes.value));
const compact = computed(() => camera.scale < 0.52);
const micro = computed(() => camera.scale < 0.25);
const detailed = computed(() => camera.scale >= 0.9);
const microLabels: Record<string, string> = { "01": "Terms", "02": "Inputs", "03": "Engine", "04": "Review", "05A": "Acctg", "05B": "Brand", "06": "Billing", "07": "Settle", "08": "Close" };
const screenNodes = computed(() => projectAtlasNodes(nodes.value, camera));
const supportProjection = computed(() => projectSupportCapabilities(capabilities.value, camera,
  Math.max(...screenNodes.value.map(node => node.cy + node.screenHeight / 2))));
const screenCapabilities = computed(() => supportProjection.value.items);
const supportLaneStyle = computed(() => Object.fromEntries(Object.entries(supportProjection.value.lane).map(([key, value]) => [key, `${value}px`])));
const supportedIds = computed(() => capabilities.value.find(item => item.stage.id === props.selectedId)?.stage.supports ?? []);
const connections = computed(() => {
  const byKey = new Map(screenNodes.value.map(node => [node.key, node]));
  return ATLAS_SEQUENCE_EDGES.flatMap(([from, to]) => {
    const start = byKey.get(from), end = byKey.get(to);
    if (!start || !end) return [];
    const x1 = start.cx + start.screenWidth / 2, x2 = end.cx - end.screenWidth / 2;
    const middle = (x1 + x2) / 2;
    return [{ key: `${from}-${to}`, warm: from === "05A" || to === "05A", path: `M${x1} ${start.cy} H${middle} V${end.cy} H${x2}` }];
  });
});
const dependencies = computed(() => screenCapabilities.value.flatMap(capability => {
  const selectedCapability = capability.stage.id === props.selectedId;
  const consumers = screenNodes.value.filter(node => capability.stage.supports.includes(node.stage.id)
    && (selectedCapability || node.stage.id === props.selectedId));
  return consumers.map(node => ({ key: `${capability.key}-${node.key}`,
    path: `M${node.cx} ${node.cy + node.screenHeight / 2} V${capability.cy - capability.screenHeight / 2}` }));
}));
const discrepancy = computed(() => {
  const from = screenNodes.value.find(node => node.key === "05B"), to = screenNodes.value.find(node => node.key === "04");
  if (!from || !to) return "";
  const y = Math.max(from.cy + from.screenHeight / 2, to.cy + to.screenHeight / 2) + 6;
  return `M${from.cx} ${from.cy + from.screenHeight / 2} V${y} H${to.cx} V${to.cy + to.screenHeight / 2}`;
});
const miniWindow = computed(() => ({ x: -camera.x / camera.scale, y: -camera.y / camera.scale,
  width: viewportSize.width / camera.scale, height: viewportSize.height / camera.scale }));
function selectedBounds(): AtlasBounds | undefined {
  const matching = [...screenNodes.value, ...screenCapabilities.value].filter(node => node.stage.id === props.selectedId);
  const node = matching.find(item => item.key === props.selectionKey) ?? matching[0];
  if (!node) return;
  // Rendered labels keep a readable screen-space size at low zoom.
  const width = Math.min(node.screenWidth, 320), height = node.screenHeight;
  return { x: (node.cx - width / 2 - camera.x) / camera.scale, y: (node.cy - height / 2 - camera.y) / camera.scale,
    width: width / camera.scale, height: height / camera.scale };
}
function ensureSelectionVisible(animate = true) { const target = selectedBounds(); if (target) ensureVisible(target, animate); }
let selectionFrame = 0, selectionRevision = 0;
watch(() => [props.selectedId, props.selectionKey], async ([id]) => {
  const revision = ++selectionRevision;
  cancelAnimationFrame(selectionFrame);
  if (!id) return;
  await nextTick();
  if (revision !== selectionRevision) return;
  selectionFrame = requestAnimationFrame(() => {
    if (revision !== selectionRevision) return;
    measureViewport();
    ensureSelectionVisible();
    selectionFrame = 0;
  });
}, { immediate: true });
onBeforeUnmount(() => { selectionRevision++; cancelAnimationFrame(selectionFrame); });
function nodeStyle(node: { cx: number; cy: number; screenWidth: number; screenHeight: number }) {
  return { left: `${node.cx}px`, top: `${node.cy}px`, width: `${node.screenWidth}px`, height: `${node.screenHeight}px` };
}
function nodeVisible(node: { cx: number; cy: number; screenWidth: number; screenHeight: number }) {
  return node.cx - node.screenWidth / 2 >= 0 && node.cx + node.screenWidth / 2 <= viewportSize.width
    && node.cy - node.screenHeight / 2 >= 0 && node.cy + node.screenHeight / 2 <= viewportSize.height;
}
function capabilityVisible(node: typeof screenCapabilities.value[number]) {
  return node.cx + node.screenWidth / 2 > 0 && node.cx - node.screenWidth / 2 < viewportSize.width
    && node.cy - node.screenHeight / 2 >= 0 && node.cy + node.screenHeight / 2 <= viewportSize.height;
}
function minimapClick(event: MouseEvent) {
  if (event.detail === 0) { emit("fit"); return; }
  const rect = miniature.value!.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { emit("fit"); return; }
  centerAt((event.clientX - rect.left) / rect.width * 3200, (event.clientY - rect.top) / rect.height * 640);
}
function keydown(event: KeyboardEvent) {
  if (event.target !== viewport.value) return;
  if (event.key === "+" || event.key === "=") { event.preventDefault(); zoom(1.2); }
  else if (event.key === "-") { event.preventDefault(); zoom(1 / 1.2); }
  else if (event.key.toLowerCase() === "f") { event.preventDefault(); emit("fit"); }
  else if (event.key.startsWith("Arrow")) {
    event.preventDefault();
    if (event.key === "ArrowLeft") panBy(72, 0);
    if (event.key === "ArrowRight") panBy(-72, 0);
    if (event.key === "ArrowUp") panBy(0, 72);
    if (event.key === "ArrowDown") panBy(0, -72);
  }
}
defineExpose({ fit, ensureSelectionVisible });
</script>

<template>
  <div class="atlas-map-wrap">
    <div class="atlas-map-legend" aria-label="Map legend"><span>Business process · 01–08</span><span>{{ parallelLegend }}</span><span>Support links ≠ sequence</span></div>
    <div ref="viewport" class="atlas-map" :class="{ 'is-dragging': dragging, 'is-compact': compact, 'is-micro': micro, 'is-detailed': detailed }" tabindex="0" role="region" aria-label="Process map. Drag or scroll to pan. Control plus scroll to zoom. Arrow keys pan, F fits the map."
      data-lenis-prevent @wheel="wheel" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp" @keydown="keydown">
      <div class="atlas-support-lane" :style="supportLaneStyle" aria-hidden="true"><span>Supporting capabilities</span></div>
      <svg class="atlas-paths" :viewBox="`0 0 ${viewportSize.width || 1} ${viewportSize.height || 1}`" aria-hidden="true">
        <defs><marker id="atlas-path-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1 L7 4 L1 7" /></marker></defs>
        <path v-for="edge in connections" :key="edge.key" :d="edge.path" :class="{ 'is-accounting': edge.warm }" marker-end="url(#atlas-path-arrow)" />
        <path :d="discrepancy" class="atlas-discrepancy" marker-end="url(#atlas-path-arrow)" />
        <path v-for="dependency in dependencies" :key="dependency.key" :d="dependency.path" class="atlas-support-path" />
      </svg>
      <button v-for="node in screenNodes" :key="node.key" type="button" class="atlas-node" :class="{ 'is-selected': selectedId === node.stage.id && (!selectionKey || selectionKey === node.key), 'is-accounting': node.key === '05A', 'is-supported': supportedIds.includes(node.stage.id) }" :style="nodeStyle(node)"
        :data-atlas-node-stage="node.stage.id" :data-atlas-node-key="node.key" :title="`${node.branch}: ${node.title}`" :aria-label="`${node.branch}: ${node.title}. ${node.body}`" :aria-pressed="selectedId === node.stage.id && (!selectionKey || selectionKey === node.key)" :tabindex="nodeVisible(node) ? 0 : -1" @click="emit('select', node.stage.id, node.key)">
        <span class="atlas-node-index">{{ node.branch }}<AtlasStatus v-if="camera.scale >= 0.3" :state="node.stage.practiceState" compact /></span><strong>{{ micro ? microLabels[node.key] : compact ? node.short : node.title }}</strong>
        <span v-if="detailed" class="atlas-node-question">{{ node.body }}</span>
        <span v-if="detailed" class="atlas-node-role">{{ node.role }}</span>
      </button>
      <button v-for="capability in screenCapabilities" :key="capability.key" type="button" class="atlas-capability" :class="{ 'is-selected': selectedId === capability.stage.id, 'is-linked': !!selectedId && capability.stage.supports.includes(selectedId) }" :style="nodeStyle(capability)"
        :data-atlas-node-stage="capability.stage.id" :data-atlas-node-key="capability.key" :aria-label="`${capability.stage.shortTitle}. Supports stages ${capability.stage.supports.join(', ')}. Open supporting process detail.`" :aria-pressed="selectedId === capability.stage.id" :tabindex="capabilityVisible(capability) ? 0 : -1" @click="emit('select', capability.stage.id, capability.key)">
        <strong>{{ capability.stage.shortTitle }}</strong><span>supports {{ capability.stage.supports.join(' · ') }}</span>
      </button>
    </div>
    <div class="atlas-map-foot">
      <div class="atlas-map-tools"><button type="button" aria-label="Zoom out" @click="zoom(1 / 1.2)">−</button><span aria-live="polite">{{ Math.round(camera.scale * 100) }}%</span><button type="button" aria-label="Zoom in" @click="zoom(1.2)">+</button><button type="button" @click="emit('fit')">Fit</button></div>
      <span class="atlas-map-help">Drag / scroll to pan · Ctrl/⌘ + scroll to zoom<br>Dashed: rework · dotted: support</span>
      <button type="button" class="atlas-minimap" aria-label="Move map to clicked location; press Enter to fit" @click="minimapClick">
        <svg ref="miniature" viewBox="0 0 3200 640" preserveAspectRatio="none" aria-hidden="true"><rect v-for="node in [...nodes, ...capabilities]" :key="node.key" :x="node.x" :y="node.y" :width="node.width" :height="node.height" rx="12" :class="{ 'is-selected': selectedId === node.stage.id }" /><rect class="atlas-mini-window" v-bind="miniWindow" /></svg><span>Overview</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.atlas-map-wrap { min-width: 0; min-height: 0; flex: 1; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.atlas-map-legend,.atlas-map-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--color-text-300); font-size: 12px; }
.atlas-map-legend { padding: 8px 12px; }
.atlas-map-legend { border-bottom: 1px solid var(--color-card-border); background: var(--space-navy); flex-wrap: wrap; flex: none; }
.atlas-map-foot { flex: none; height: 56px; padding: 6px 12px; border-top: 1px solid var(--color-card-border); }
.atlas-map-help { font-size: 11px; line-height: 1.4; }
.atlas-map { position: relative; flex: 1; min-height: 0; overflow: hidden; touch-action: none; cursor: grab; background: var(--space-deep); background-image: radial-gradient(var(--color-card-border) 1px, transparent 1px); background-size: 24px 24px; }
.atlas-map.is-dragging { cursor: grabbing; }
.atlas-paths { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.atlas-paths path { fill: none; stroke: var(--color-text-200); stroke-width: 1.5; }
.atlas-paths marker path { stroke: var(--color-text-300); }
.atlas-paths .is-accounting { stroke: var(--color-orange-400); }
.atlas-paths .atlas-discrepancy { stroke-dasharray: 5 5; }
.atlas-paths .atlas-support-path { stroke: var(--color-cyan-400); stroke-dasharray: 2 5; opacity: .55; }
.atlas-support-lane { position: absolute; border-top: 1px solid var(--color-card-border); background: var(--color-command-bg-soft); pointer-events: none; }
.atlas-support-lane>span { position: absolute; left: 8px; top: 6px; color: var(--color-text-300); font-size: 11px; white-space: nowrap; }
.atlas-capability { position: absolute; transform: translate(-50%,-50%); display: flex; align-items: center; justify-content: center; gap: 10px; padding: 4px 12px; min-height: 36px; border: 1px dashed var(--color-card-border-hover); border-radius: var(--radius-sm,4px); background: var(--space-navy); color: var(--color-text-400); cursor: pointer; overflow: hidden; }
.atlas-capability strong { font-size: 12px; font-weight: 500; white-space: nowrap; }
.atlas-capability>span { color: var(--color-text-300); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.is-compact .atlas-capability>span { display: none; }
.atlas-capability:hover,.atlas-capability.is-selected,.atlas-capability.is-linked { border-color: var(--color-cyan-400); }
.atlas-capability.is-selected { background: var(--color-command-bg-soft); }
.atlas-node.is-supported { border-color: var(--color-cyan-400); }
.atlas-node { position: absolute; transform: translate(-50%,-50%); padding: 16px; border: 1px solid var(--color-card-border-hover); border-radius: var(--radius-md); background: var(--space-navy); color: var(--color-text-400); display: flex; flex-direction: column; gap: 8px; align-items: flex-start; text-align: left; overflow: hidden; cursor: pointer; }
.atlas-node:hover,.atlas-node.is-selected { border-color: var(--color-cyan-400); background: var(--color-command-bg-soft); }
.atlas-node.is-accounting { border-color: var(--color-orange-400); }
.atlas-node-index { display: flex; align-items: center; justify-content: space-between; gap: 4px; width: 100%; font-size: 11px; color: var(--color-cyan-400); }
.atlas-node strong { font-size: 16px; line-height: 1.2; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.atlas-node-question { font-size: 13px; line-height: 1.35; color: var(--color-text-300); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.atlas-node-role { margin-top: auto; font-size: 12px; line-height: 1.3; color: var(--color-text-300); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.is-compact .atlas-node { padding: 6px 3px; gap: 4px; align-items: center; justify-content: center; text-align: center; }
.is-compact .atlas-node strong { font-size: 12px; line-height: 1.15; width: 100%; }
.is-compact .atlas-node strong { overflow-wrap: normal; word-break: normal; }
.is-micro .atlas-node strong { font-size: 11px; white-space: nowrap; }
.is-detailed .atlas-node strong { font-size: 19px; -webkit-line-clamp: 2; }
.atlas-map-tools { display: flex; flex: none; align-items: center; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); overflow: hidden; }
.atlas-map-tools button { min-width: 44px; height: 44px; border: 0; background: transparent; color: var(--color-text-400); }
.atlas-map-tools span { min-width: 44px; text-align: center; font-size: 12px; }
.atlas-minimap { display: flex; align-items: center; gap: 8px; flex: none; height: 44px; width: 156px; padding: 6px 8px; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); color: var(--color-text-300); font-size: 11px; }
.atlas-minimap svg { flex: 1; min-width: 0; height: 30px; }
.atlas-minimap rect { fill: var(--color-navy-400); }
.atlas-minimap rect.is-selected { fill: var(--color-cyan-400); }
.atlas-minimap .atlas-mini-window { fill: none; stroke: var(--color-orange-400); stroke-width: 16; }
button:focus-visible,.atlas-map:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
@media (max-width: 1100px) { .atlas-map-help { display: none; } .atlas-map-legend { gap: 8px; } }
</style>
