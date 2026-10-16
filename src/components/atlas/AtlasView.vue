<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { AtlasPayload, AtlasReference, AtlasStageId } from "../../types/atlas";
import type { AtlasLibraryGroup } from "../../types/atlasUi";
import AtlasCanvas from "./AtlasCanvas.vue";
import AtlasProcessGuide from "./AtlasProcessGuide.vue";
import AtlasSourceInfo from "./AtlasSourceInfo.vue";
import Icon from "../Icon.vue";
import { useAtlasRouteState } from "../../composables/useAtlasRouteState";

const props = defineProps<{ data: AtlasPayload | null; source: "live" | "demo" | "unavailable"; isLoading: boolean; error?: string; refreshedAt?: string }>();
const emit = defineEmits<{ refresh: []; preview: [] }>();
const route = useAtlasRouteState();
const { state } = route;
const canvas = ref<InstanceType<typeof AtlasCanvas> | null>(null);
const exploreButton = ref<HTMLButtonElement | null>(null);
const showDataPipeline = ref(true);
let mapOrigin: HTMLElement | null = null;
const chapters = computed(() => props.data?.stages.filter(stage => stage.kind === "chapter").sort((a,b) => a.order - b.order) ?? []);
const guideMode = computed(() => state.mode === "guide");
const sourceLabel = computed(() => props.source === "live" ? props.error ? "Google Sheets source · retained copy" : "Google Sheets source" : props.source === "demo" ? "Demo content · not live source" : "Source unavailable");
const version = computed(() => props.data?.meta.contentVersion || "D0");
const guideStageId = computed(() => state.stageId ?? state.chapterId);

function openGuide(id?: AtlasStageId) {
  const active = document.activeElement as HTMLElement | null;
  if (!guideMode.value && active?.isConnected) mapOrigin = active;
  route.openGuide(id);
}
async function returnToMap() {
  route.setMode("explore");
  await nextTick();
  if (mapOrigin?.isConnected && mapOrigin.getClientRects().length && mapOrigin.tabIndex >= 0) mapOrigin.focus({ preventScroll: true });
  else exploreButton.value?.focus({ preventScroll: true });
  mapOrigin = null;
}
function openReference(reference: AtlasReference) { route.openLibrary({ group: reference.group, stageId: guideStageId.value, referenceId: reference.id }); }
function openReferences(group: AtlasLibraryGroup) { route.openLibrary({ group }); }
function keydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (event.defaultPrevented || target.matches("input,textarea,select") || target.isContentEditable || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "Escape" && guideMode.value) { event.preventDefault(); event.stopPropagation(); void returnToMap(); }
  if (/^[1-8]$/.test(event.key)) {
    const stage = chapters.value[Number(event.key)-1];
    if (stage) { event.preventDefault(); event.stopPropagation(); openGuide(stage.id); }
  }
}
watch(() => props.data, () => { if (props.data && state.stageId && !props.data.stages.some(stage => stage.id === state.stageId)) route.closeStage(); });
</script>

<template>
  <section class="atlas-view" aria-label="Value Protection Process Atlas" @keydown="keydown">
    <header class="atlas-toolbar">
      <div class="atlas-title"><h1>Process Atlas</h1><span v-if="source === 'demo'" class="atlas-data-badge" role="status">Demo · not live</span><span v-else-if="source === 'live' && error" class="atlas-data-badge" role="status">Retained copy</span></div>
      <div class="atlas-toolbar-actions">
        <nav class="atlas-view-modes" aria-label="Atlas pages"><button ref="exploreButton" type="button" :aria-pressed="!guideMode" @click="returnToMap"><Icon name="project" :size="16" />Explore</button><button type="button" :aria-pressed="guideMode" @click="openGuide()"><Icon name="template" :size="16" />Process Guide</button></nav>
        <label v-show="!guideMode" class="atlas-data-toggle"><input v-model="showDataPipeline" type="checkbox"><span>Show Data Pipeline</span></label>
        <AtlasSourceInfo :source="source" :meta="data?.meta" :error="error" :refreshed-at="refreshedAt" :is-loading="isLoading" @refresh="emit('refresh')" />
      </div>
    </header>
    <p v-if="error" class="atlas-source-warning" role="alert">{{ source === 'live' ? 'Showing the last successful source copy.' : source === 'demo' ? 'Bundled draft, not the live source.' : 'The process source could not be loaded.' }} <span>Details in Source Info.</span></p>
    <div v-if="isLoading && !data" class="atlas-loading" aria-busy="true"><p>Loading the process source…</p><div v-for="index in 4" :key="index"></div></div>
    <div v-else-if="!data || !chapters.length" class="atlas-empty"><h2>No process content available</h2><p>Check the configured source or published content, then refresh. No control conclusion is inferred from this empty state.</p><button type="button" @click="emit('refresh')">Try again</button><button v-if="source === 'unavailable'" type="button" @click="emit('preview')">Preview bundled draft · not live</button></div>
    <div v-else class="atlas-workspace" :class="{ 'is-guide': guideMode }">
      <div v-show="!guideMode" class="atlas-canvas-slot"><AtlasCanvas ref="canvas" :stages="data.stages" :references="data.references" :selected-id="null" :active="!guideMode" :show-data-pipeline="showDataPipeline" @select="openGuide" @fit="canvas?.fit()" /></div>
      <AtlasProcessGuide v-if="guideMode" :data="data" :stage-id="guideStageId" :active-tab="state.inspectorTab" :reference-group="state.libraryGroup" :reference-id="state.referenceId" :source-label="sourceLabel" :source-warning="error" :version="version" @stage="route.setGuideStage" @reference="openReference" @references="openReferences" @map="returnToMap" />
    </div>
  </section>
</template>

<style scoped>
.atlas-view { height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: 12px 20px 16px; color: var(--color-text-400); }
.atlas-toolbar { display: flex; align-items: center; justify-content: space-between; flex: none; gap: 16px; padding-bottom: 12px; }
.atlas-title { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; min-width: 0; }
h1 { font-size: 22px; font-weight: 500; line-height: 1.2; letter-spacing: -.02em; white-space: nowrap; }
.atlas-data-badge { color: var(--color-orange-400); font-size: 11px; }
.atlas-toolbar-actions { display: flex; align-items: center; justify-content: flex-end; gap: 16px; min-width: 0; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); color: var(--color-text-400); font: inherit; font-size: 13px; cursor: pointer; }
button:hover { background: var(--color-command-bg-soft); border-color: var(--color-card-border-hover); }
button:focus-visible,input:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
.atlas-view-modes { display: flex; gap: 0; padding: 2px; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-deep); }
.atlas-view-modes button { min-height: 36px; border: 1px solid transparent; background: transparent; white-space: nowrap; }
.atlas-view-modes button[aria-pressed=true] { border-color: var(--color-card-border-hover); background: var(--space-navy); color: var(--color-cyan-400); }
.atlas-data-toggle { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; color: var(--color-text-300); font-size: 12px; cursor: pointer; white-space: nowrap; }
.atlas-data-toggle input { width: 16px; height: 16px; accent-color: var(--color-cyan-400); }
.atlas-source-warning { flex: none; padding: 6px 12px; border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); color: var(--color-text-300); font-size: 11px; line-height: 1.5; margin-bottom: 8px; overflow-wrap: anywhere; }
.atlas-source-warning span { color: var(--color-text-400); }
.atlas-workspace { flex: 1; min-height: 0; min-width: 0; overflow: hidden; border: 1px solid var(--color-card-border); border-radius: var(--radius-md); background: var(--space-deep); }
.atlas-canvas-slot { height: 100%; min-height: 0; min-width: 0; overflow: hidden; }
.atlas-empty,.atlas-loading { min-height: 0; flex: 1; overflow: auto; padding: 32px; background: var(--space-navy); border: 1px solid var(--color-card-border); border-radius: var(--radius-md); }
.atlas-empty h2 { font-size: 24px; }
.atlas-empty p { margin: 16px 0; max-width: 650px; color: var(--color-text-300); line-height: 1.5; }
.atlas-empty button { margin: 0 8px 8px 0; }
.atlas-loading>div { height: 40px; background: var(--color-beige-500); border-radius: 8px; margin-top: 12px; }
@media(max-width:1100px) { .atlas-view { padding: 12px 16px; } .atlas-toolbar-actions { gap: 12px; } }
@media(max-width:840px) { .atlas-toolbar { flex-wrap: wrap; gap: 8px; } .atlas-toolbar-actions { flex: 1; flex-wrap: wrap; justify-content: flex-start; gap: 8px 12px; } .atlas-data-toggle { order: 3; } h1 { font-size: 20px; } }
@media(max-width:540px) { .atlas-view { padding: 10px; } .atlas-title { width: 100%; } .atlas-toolbar-actions { width: 100%; } .atlas-toolbar-actions :deep(.atlas-source-info) { margin-left: auto; } .atlas-view-modes button { font-size: 12px; padding: 8px; gap: 6px; } .atlas-data-toggle { width: 100%; min-height: 32px; } }
</style>
