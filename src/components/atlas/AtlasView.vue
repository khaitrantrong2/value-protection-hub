<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { AtlasPayload, AtlasReference, AtlasStageId } from "../../types/atlas";
import AtlasCanvas from "./AtlasCanvas.vue";
import AtlasStageDetail from "./AtlasStageDetail.vue";
import AtlasStory from "./AtlasStory.vue";
import AtlasReferenceLibrary from "./AtlasReferenceLibrary.vue";
import Icon from "../Icon.vue";
import { useAtlasRouteState } from "../../composables/useAtlasRouteState";

const props = defineProps<{ data: AtlasPayload | null; source: "live" | "demo" | "unavailable"; isLoading: boolean; error?: string; refreshedAt?: string }>();
const emit = defineEmits<{ refresh: []; preview: [] }>();
const route = useAtlasRouteState();
const { state } = route;
const compactScreen = ref(false);
const selectionKey = ref<string | null>(null);
const canvas = ref<InstanceType<typeof AtlasCanvas> | null>(null);
const storyScroll = ref<HTMLElement | null>(null);
const stagePicker = ref<HTMLSelectElement | null>(null);
let mediaQuery: MediaQueryList | undefined;
let detailOrigin: HTMLElement | null = null;

const chapters = computed(() => props.data?.stages.filter(stage => stage.kind === "chapter").sort((a, b) => a.order - b.order) ?? []);
const chapter = computed(() => chapters.value.find(stage => stage.id === state.chapterId) ?? chapters.value[0]);
const selected = computed(() => props.data?.stages.find(stage => stage.id === state.stageId));
const mobileInspectorOpen = computed(() => compactScreen.value && !!selected.value);
const controls = computed(() => props.data?.controls.filter(control => control.stageId === state.stageId) ?? []);
const references = computed(() => props.data?.references.filter(reference => reference.stageId === state.stageId || selected.value?.referenceIds.includes(reference.id)) ?? []);
const storySupports = computed(() => props.data?.stages.filter(stage => stage.kind === "supporting" && stage.supports.includes(state.chapterId)) ?? []);
const storyMode = computed(() => state.mode === "story" || compactScreen.value);
const sourceLabel = computed(() => props.source === "live" ? "Google Sheets source" : props.source === "demo" ? "Demo content · not live source" : "Source unavailable");
const sourceState = computed(() => props.source === "live" && props.error ? "stale" : props.source);
const version = computed(() => props.data?.meta.contentVersion || "D0");

function select(id: AtlasStageId, nodeKey?: string) {
  const active = document.activeElement as HTMLElement | null;
  if (active && !active.closest(".atlas-detail, dialog")) detailOrigin = active;
  selectionKey.value = nodeKey ?? null;
  route.selectStage(id);
}
async function closeDetail() {
  route.closeStage();
  selectionKey.value = null;
  await nextTick();
  const originVisible = detailOrigin?.isConnected && detailOrigin.getClientRects().length && detailOrigin.tabIndex >= 0;
  (originVisible ? detailOrigin : stagePicker.value)?.focus({ preventScroll: true });
  detailOrigin = null;
}
async function chooseChapter(id: AtlasStageId) {
  if (!storyMode.value) { select(id); return; }
  route.setChapter(id);
  await nextTick();
  if (storyScroll.value) storyScroll.value.scrollTop = 0;
  storyScroll.value?.querySelector<HTMLElement>("#atlas-story-title")?.focus({ preventScroll: true });
}
function changeChapter(event: Event) { void chooseChapter((event.target as HTMLSelectElement).value as AtlasStageId); }
function openReference(reference: AtlasReference) {
  route.openLibrary({ group: reference.group, stageId: state.stageId ?? "", referenceId: reference.id });
}
function selectFromLibrary(id: AtlasStageId) { route.closeLibrary(); select(id); }
function keydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (state.libraryGroup !== null || target.matches("input,textarea,select") || target.isContentEditable || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "Escape" && state.stageId) { event.stopPropagation(); event.preventDefault(); void closeDetail(); }
  if (!target.closest(".atlas-detail") && /^[1-8]$/.test(event.key)) {
    const item = chapters.value[Number(event.key) - 1];
    if (item) { event.stopPropagation(); event.preventDefault(); void chooseChapter(item.id); }
  }
}
function updateMedia(event: MediaQueryListEvent | MediaQueryList) { compactScreen.value = event.matches; }
onMounted(() => { mediaQuery = window.matchMedia("(max-width: 840px)"); updateMedia(mediaQuery); mediaQuery.addEventListener("change", updateMedia); });
onBeforeUnmount(() => mediaQuery?.removeEventListener("change", updateMedia));
watch(() => props.data, () => { if (state.stageId && props.data && !selected.value) route.closeStage(); });
</script>

<template>
  <section class="atlas-view" aria-label="Value Protection Process Atlas" @keydown="keydown">
    <header class="atlas-toolbar" :inert="mobileInspectorOpen || undefined">
      <div class="atlas-title"><span class="atlas-eyebrow">BUSINESS UNDERSTANDING / ONBOARDING</span><h1>Process Atlas <span>Claimback to realization</span></h1></div>
      <div class="atlas-toolbar-actions">
        <div class="atlas-view-modes" aria-label="Process view"><button type="button" :aria-pressed="!storyMode" :disabled="compactScreen" @click="route.setMode('explore')"><Icon name="project" :size="16" />Explore</button><button type="button" :aria-pressed="storyMode" @click="route.setMode('story')"><Icon name="list" :size="16" />Walkthrough</button></div>
        <button type="button" class="atlas-refresh" :aria-label="isLoading ? 'Loading source' : 'Refresh source'" :disabled="isLoading" @click="emit('refresh')"><Icon name="clock" :size="16" /><span>{{ isLoading ? 'Loading…' : 'Refresh source' }}</span></button>
      </div>
    </header>
    <div class="atlas-source-strip" :data-source="sourceState" role="status" :inert="mobileInspectorOpen || undefined">
      <span class="atlas-source-label">{{ sourceLabel }}<span v-if="sourceState === 'stale'"> · retained copy</span></span><span>{{ data?.meta.processStatus || 'Draft' }} · {{ version }}</span><span class="atlas-control-disclaimer">Reported practice ≠ tested operating effectiveness</span>
      <details class="atlas-source-info"><summary>Source details</summary><div><span v-if="refreshedAt">Fetched: {{ refreshedAt }}</span><span v-if="data?.meta.updatedAt">Content updated: {{ data.meta.updatedAt }}</span><span>Effective from: {{ data?.meta.effectiveFrom || 'Pending approval' }}</span><span>Read-only process material; source availability is not a control conclusion.</span></div></details>
    </div>
    <p v-if="error" class="atlas-source-warning" role="alert">{{ error }}</p>
    <div v-if="isLoading && !data" class="atlas-loading" aria-busy="true"><p>Loading the process source…</p><div v-for="index in 4" :key="index"></div></div>
    <div v-else-if="!data || !chapters.length" class="atlas-empty"><h2>No process content available</h2><p>Check the configured source or published content, then refresh. No control conclusion is inferred from this empty state.</p><button type="button" @click="emit('refresh')">Try again</button><button v-if="source === 'unavailable'" type="button" @click="emit('preview')">Preview bundled draft · not live</button></div>
    <template v-else>
      <div class="atlas-workspace-toolbar" :inert="mobileInspectorOpen || undefined"><label for="atlas-stage-picker">{{ storyMode ? 'Chapter' : 'Go to stage' }}</label><select id="atlas-stage-picker" ref="stagePicker" :value="state.chapterId" @change="changeChapter"><option v-for="stage in chapters" :key="stage.id" :value="stage.id">{{ stage.id }} · {{ stage.shortTitle }}</option></select><span>{{ storyMode ? 'Follow the business story, one stage at a time.' : 'Drag / scroll to pan · Ctrl/⌘ + scroll to zoom · click to inspect' }}</span></div>
      <div class="atlas-workspace" :class="{ 'has-inspector': selected, 'is-compact': compactScreen }">
        <div class="atlas-primary" :inert="compactScreen && selected ? true : undefined">
          <div v-show="!storyMode" class="atlas-canvas-slot"><AtlasCanvas ref="canvas" :stages="data.stages" :references="data.references" :selected-id="state.stageId" :selection-key="selectionKey" @select="select" @fit="canvas?.fit()" /></div>
          <div v-show="storyMode" ref="storyScroll" class="atlas-story-scroll vph-scroll"><AtlasStory v-if="chapter" :stage="chapter" :chapters="chapters" :references="data.references" @chapter="chooseChapter" @detail="select" /><section v-if="storySupports.length" class="atlas-story-support" aria-label="Capabilities supporting this chapter"><h3>Supporting this stage</h3><p>Capabilities that support the business flow, not additional sequential stages.</p><button v-for="stage in storySupports" :key="stage.id" type="button" @click="select(stage.id)">{{ stage.id }} · {{ stage.shortTitle }} <span>Inspect →</span></button></section></div>
        </div>
        <div v-if="selected" class="atlas-inspector-slot"><div v-if="compactScreen" class="atlas-mobile-source"><span>{{ sourceLabel }} · {{ version }}</span><p v-if="error" role="status">{{ error }}</p></div><AtlasStageDetail :stage="selected" :controls="controls" :references="references" :active-tab="state.inspectorTab" @close="closeDetail" @tab="route.setInspectorTab" @reference="openReference" /></div>
      </div>
      <footer class="atlas-bottom-bar" :inert="mobileInspectorOpen || undefined"><button type="button" class="atlas-library-launcher" :aria-expanded="state.libraryGroup !== null" @click="route.openLibrary()"><Icon name="list" :size="16" /><strong>Reference Library</strong><span>{{ data.references.length }} references</span><span aria-hidden="true">↗</span></button><span class="atlas-bottom-hint">{{ compactScreen ? 'Linear view · stage details on demand' : '1–8 to inspect a stage · Esc to close details · Fit is manual' }}</span></footer>
      <AtlasReferenceLibrary v-if="state.libraryGroup !== null" :references="data.references" :stages="data.stages" :group="state.libraryGroup" :stage-id="state.libraryStage" :reference-id="state.referenceId" :source-label="sourceLabel" :source-warning="error" :version="version" @close="route.closeLibrary" @group="route.setLibraryGroup" @stage="route.setLibraryStage" @select-stage="selectFromLibrary" />
    </template>
  </section>
</template>

<style scoped>
.atlas-view { height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: 18px 24px 12px; color: var(--color-text-400); }
.atlas-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex: none; }
.atlas-title { min-width: 0; }
.atlas-eyebrow { color: var(--color-text-300); font-size: 10px; letter-spacing: .1em; }
h1 { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px 16px; margin-top: 5px; font-size: 25px; font-weight: 500; line-height: 1.2; letter-spacing: -.02em; }
h1 span { color: var(--color-text-300); font-size: 14px; font-weight: 400; letter-spacing: 0; }
.atlas-toolbar-actions,.atlas-view-modes { display: flex; align-items: center; gap: 8px; flex: none; }
button,select { min-height: 44px; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); color: var(--color-text-400); font: inherit; font-size: 13px; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 12px; cursor: pointer; }
button:hover { background: var(--color-command-bg-soft); border-color: var(--color-card-border-hover); }
button:focus-visible,select:focus-visible,summary:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
button:disabled { opacity: .5; cursor: default; }
.atlas-view-modes { gap: 0; border: 1px solid var(--color-card-border); border-radius: 8px; padding: 2px; background: var(--space-deep); }
.atlas-view-modes button { min-height: 36px; border: 1px solid transparent; background: transparent; }
.atlas-view-modes button[aria-pressed=true] { border-color: var(--color-card-border-hover); background: var(--space-navy); color: var(--color-cyan-400); }
.atlas-source-strip { position: relative; display: flex; align-items: center; flex-wrap: wrap; gap: 6px 16px; padding: 10px 0 12px; font-size: 11px; color: var(--color-text-300); flex: none; }
.atlas-source-label { color: var(--color-cyan-400); }
[data-source=demo] .atlas-source-label,[data-source=stale] .atlas-source-label,[data-source=unavailable] .atlas-source-label { color: var(--color-orange-400); }
.atlas-source-info { margin-left: auto; }
.atlas-source-info summary { cursor: pointer; min-height: 28px; display: flex; align-items: center; text-decoration: underline; text-underline-offset: 3px; }
.atlas-source-info>div { position: absolute; z-index: 2; right: 0; top: calc(100% - 4px); display: grid; gap: 8px; max-width: min(390px,100%); padding: 16px; border: 1px solid var(--color-card-border-hover); border-radius: 8px; background: var(--space-navy); box-shadow: 0 12px 32px var(--space-abyss); overflow-wrap: anywhere; }
.atlas-source-warning { flex: none; max-height: 90px; overflow: auto; border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); padding: 8px 12px; font-size: 12px; line-height: 1.5; margin-bottom: 8px; overflow-wrap: anywhere; }
.atlas-workspace-toolbar { display: flex; align-items: center; gap: 10px; flex: none; padding: 8px 12px; border: 1px solid var(--color-card-border); border-bottom: 0; border-radius: 10px 10px 0 0; background: var(--space-navy); }
.atlas-workspace-toolbar label { font-size: 12px; color: var(--color-text-300); }
.atlas-workspace-toolbar select { min-height: 32px; padding: 4px 24px 4px 8px; max-width: 290px; min-width: 0; }
.atlas-workspace-toolbar>span { margin-left: auto; font-size: 11px; color: var(--color-text-300); }
.atlas-workspace { position: relative; display: grid; grid-template-columns: minmax(0,1fr); flex: 1; min-height: 0; min-width: 0; overflow: hidden; border: 1px solid var(--color-card-border); border-radius: 0 0 10px 10px; background: var(--space-deep); }
.atlas-workspace.has-inspector { grid-template-columns: minmax(0,1fr) minmax(340px,400px); }
.atlas-primary,.atlas-canvas-slot { min-height: 0; min-width: 0; height: 100%; overflow: hidden; }
.atlas-inspector-slot { display: grid; grid-template-rows: minmax(0,1fr); min-height: 0; min-width: 0; overflow: hidden; }
.atlas-mobile-source { min-width: 0; padding: 8px 16px; border-bottom: 1px solid var(--color-card-border); color: var(--color-text-300); font-size: 11px; overflow-wrap: anywhere; }
.atlas-mobile-source p { max-height: 60px; overflow: auto; margin-top: 6px; color: var(--color-orange-400); line-height: 1.4; }
.atlas-story-scroll { height: 100%; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; }
.atlas-story-support { margin: 0 32px 32px; padding-top: 24px; border-top: 1px solid var(--color-card-border); }
.atlas-story-support h3 { font-size: 14px; font-weight: 500; }
.atlas-story-support p { font-size: 12px; color: var(--color-text-300); line-height: 1.5; margin: 8px 0 12px; }
.atlas-story-support button { display: flex; justify-content: space-between; width: 100%; margin-top: 8px; text-align: left; }
.atlas-story-support button span { color: var(--color-cyan-400); font-size: 12px; }
.atlas-bottom-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 10px; flex: none; }
.atlas-library-launcher { background: var(--space-navy); gap: 10px; }
.atlas-library-launcher strong { font-size: 12px; font-weight: 500; }
.atlas-library-launcher span,.atlas-bottom-hint { font-size: 11px; color: var(--color-text-300); }
.atlas-empty,.atlas-loading { min-height: 0; flex: 1; overflow: auto; padding: 32px; background: var(--space-navy); border: 1px solid var(--color-card-border); border-radius: 10px; }
.atlas-empty h2 { font-size: 24px; }
.atlas-empty p { margin: 16px 0; max-width: 650px; color: var(--color-text-300); line-height: 1.5; }
.atlas-empty button { margin: 0 8px 8px 0; }
.atlas-loading>div { height: 40px; background: var(--color-beige-500); border-radius: 8px; margin-top: 12px; }
@media(max-width:1100px) { .atlas-view { padding: 14px 16px 10px; } h1 span,.atlas-control-disclaimer { display: none; } .atlas-workspace-toolbar>span { display: none; } .atlas-workspace.has-inspector { grid-template-columns: minmax(0,1fr) minmax(340px,38%); } }
@media(max-width:840px) { .atlas-view { padding: 12px; } .atlas-toolbar { align-items: flex-start; flex-wrap: wrap; gap: 10px; } .atlas-toolbar-actions { flex: 1; } .atlas-refresh { margin-left: auto; } .atlas-eyebrow { font-size: 9px; } h1 { font-size: 22px; } .atlas-source-strip { gap: 4px 12px; padding: 8px 0; } .atlas-source-info { margin-left: 0; } .atlas-workspace.has-inspector { grid-template-columns: minmax(0,1fr); } .atlas-inspector-slot { position: fixed; inset: var(--height-header) 0 0; grid-template-rows: auto minmax(0,1fr); z-index: var(--z-index-layout); background: var(--space-deep); } .atlas-bottom-hint { display: none; } .atlas-library-launcher { width: 100%; justify-content: flex-start; } .atlas-library-launcher>span:last-child { margin-left: auto; } .atlas-workspace-toolbar { padding: 6px 10px; } .atlas-workspace-toolbar select { flex: 1; max-width: none; min-height: 44px; } .atlas-story-support { margin: 0 20px 24px; } }
@media(max-width:400px) { .atlas-view { padding: 10px; } .atlas-refresh { padding: 8px; } .atlas-refresh span { display: none; } .atlas-toolbar-actions { justify-content: space-between; } .atlas-story-support { margin: 0 16px 20px; } }
</style>
