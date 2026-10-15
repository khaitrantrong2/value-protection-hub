<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { AtlasPayload, AtlasStageId } from "../../types/atlas";
import AtlasCanvas from "./AtlasCanvas.vue";
import AtlasStageDetail from "./AtlasStageDetail.vue";
import AtlasStory from "./AtlasStory.vue";
import AtlasReferences from "./AtlasReferences.vue";
import AtlasStatus from "./AtlasStatus.vue";
import Icon from "../Icon.vue";
import { useReducedMotion } from "../../composables/useReducedMotion";

const props = defineProps<{ data: AtlasPayload | null; source: "live" | "demo" | "unavailable"; isLoading: boolean; error?: string; refreshedAt?: string }>();
const emit = defineEmits<{ refresh: []; preview: [] }>();
const mode = ref<"explore" | "story">("explore");
const compactScreen = ref(false);
const chapterId = ref<AtlasStageId>("01");
const selectedId = ref<AtlasStageId | null>(null);
const canvas = ref<InstanceType<typeof AtlasCanvas> | null>(null);
const page = ref<HTMLElement | null>(null);
const { prefersReducedMotion } = useReducedMotion();
let mediaQuery: MediaQueryList | undefined;
let detailOrigin: HTMLElement | null = null;
const chapters = computed(() => props.data?.stages.filter(stage => stage.kind === "chapter").sort((a,b) => a.order - b.order) ?? []);
const supporting = computed(() => props.data?.stages.filter(stage => stage.kind === "supporting").sort((a,b) => a.order - b.order) ?? []);
const chapter = computed(() => chapters.value.find(stage => stage.id === chapterId.value) ?? chapters.value[0]);
const selected = computed(() => props.data?.stages.find(stage => stage.id === selectedId.value));
const controls = computed(() => props.data?.controls.filter(control => control.stageId === selectedId.value) ?? []);
const references = computed(() => props.data?.references.filter(reference => reference.stageId === selectedId.value || selected.value?.referenceIds.includes(reference.id)) ?? []);
const storyMode = computed(() => mode.value === "story" || compactScreen.value);
const sourceLabel = computed(() => props.source === "live" ? "Google Sheets source" : props.source === "demo" ? "Demo content · not live source" : "Source unavailable");
function select(id: AtlasStageId) {
  const active = document.activeElement as HTMLElement | null;
  if (active && !active.closest(".atlas-detail")) detailOrigin = active;
  selectedId.value = id;
  if (/^0[1-8]$/.test(id)) chapterId.value = id;
  if (compactScreen.value) nextTick(() => page.value?.querySelector(".atlas-detail")?.scrollIntoView({ block: "start", behavior: "instant" }));
}
function closeDetail() {
  const closingId = selectedId.value;
  selectedId.value = null;
  if (!closingId) { detailOrigin = null; return; }
  const hiddenMapOrigin = detailOrigin?.matches(".atlas-node") && detailOrigin.tabIndex < 0;
  if (detailOrigin?.isConnected && !detailOrigin.closest(".atlas-detail") && !hiddenMapOrigin) detailOrigin.focus({ preventScroll: true });
  else {
    const fallbackId = closingId === "A" || closingId === "B" ? closingId : chapterId.value;
    page.value?.querySelector<HTMLElement>(`button[data-atlas-stage="${fallbackId}"]`)?.focus({ preventScroll: true });
  }
  detailOrigin = null;
}
async function fit() { closeDetail(); await nextTick(); canvas.value?.fit(); }
async function chooseChapter(id: AtlasStageId) {
  const changed = chapterId.value !== id;
  chapterId.value = id;
  if (!storyMode.value) { select(id); return; }
  closeDetail();
  if (!changed) return;
  await nextTick();
  const heading = page.value?.querySelector<HTMLElement>("#atlas-story-title");
  heading?.focus({ preventScroll: true });
  heading?.scrollIntoView({ block: "start", behavior: prefersReducedMotion.value ? "instant" : "smooth" });
}
function switchMode(value: "explore" | "story") { mode.value = value; closeDetail(); }
function keydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (target.matches("input,textarea,select") || target.isContentEditable || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "Escape") { event.stopPropagation(); event.preventDefault(); if (selectedId.value) closeDetail(); }
  if (/^[0-8]$/.test(event.key)) {
    event.stopPropagation();
    if (event.key !== "0") { const item = chapters.value[Number(event.key) - 1]; if (item) { event.preventDefault(); chooseChapter(item.id); } }
  }
}
function updateMedia(event: MediaQueryListEvent | MediaQueryList) { compactScreen.value = event.matches; }
onMounted(() => { mediaQuery = window.matchMedia("(max-width: 840px)"); updateMedia(mediaQuery); mediaQuery.addEventListener("change", updateMedia); });
onBeforeUnmount(() => mediaQuery?.removeEventListener("change", updateMedia));
watch(() => props.data, () => { if (selectedId.value && !selected.value) selectedId.value = null; }, { deep: false });
</script>

<template>
  <section ref="page" class="atlas-view vph-scroll" aria-label="Value Protection Process Atlas" @keydown="keydown">
    <div class="atlas-page-head"><div><span class="atlas-eyebrow">BUSINESS UNDERSTANDING / ONBOARDING</span><h1>Claimback <em>to realization.</em></h1><p>{{ data?.meta.subtitle || 'Follow the commercial obligation through calculation, accounting and settlement.' }}</p></div><div class="atlas-head-actions"><span class="atlas-version">{{ data?.meta.processStatus || 'Draft' }} · {{ data?.meta.contentVersion || 'D0' }}</span><button type="button" :disabled="isLoading" @click="emit('refresh')"><Icon name="clock" :size="16" />{{ isLoading ? 'Loading…' : 'Refresh source' }}</button></div></div>
    <div class="atlas-source-state" role="status"><span>{{ sourceLabel }}</span><span v-if="refreshedAt">Fetched: {{ refreshedAt }}</span><span v-if="data?.meta.updatedAt">Content updated: {{ data.meta.updatedAt }}</span><span>Source availability ≠ control effectiveness</span></div>
    <p v-if="error" class="atlas-source-warning" role="alert">{{ error }}</p>
    <div v-if="isLoading && !data" class="atlas-loading" aria-busy="true"><p>Loading the process source…</p><div v-for="index in 4" :key="index"></div></div>
    <div v-else-if="!data || !chapters.length" class="atlas-empty"><h2>No process content available</h2><p>Check the configured source or published content, then refresh. No control conclusion is inferred from this empty state.</p><button type="button" @click="emit('refresh')">Try again</button><button v-if="source === 'unavailable'" type="button" @click="emit('preview')">Preview bundled draft · not live</button></div>
    <template v-else>
      <div class="atlas-view-bar"><div class="atlas-view-modes" aria-label="Process view"><button type="button" :aria-pressed="!storyMode" :disabled="compactScreen" @click="switchMode('explore')"><Icon name="project" :size="16" />Explore</button><button type="button" :aria-pressed="storyMode" @click="switchMode('story')"><Icon name="list" :size="16" />Walkthrough</button></div><p>{{ compactScreen ? 'Linear walkthrough for smaller screens.' : 'One source · overview, story and shared stage detail.' }}</p></div>
      <nav class="atlas-chapters" aria-label="Process chapters"><button v-for="stage in chapters" :key="stage.id" type="button" :data-atlas-stage="stage.id" :aria-current="chapterId === stage.id ? 'step' : undefined" @click="chooseChapter(stage.id)"><span>{{ stage.id }}</span>{{ stage.shortTitle }}</button></nav>
      <div class="atlas-supporting" aria-label="Supporting processes"><button v-for="stage in supporting" :key="stage.id" type="button" :data-atlas-stage="stage.id" :aria-expanded="selectedId === stage.id" @click="selectedId === stage.id ? closeDetail() : select(stage.id)"><span class="atlas-support-id">{{ stage.id }}</span><span><strong>{{ stage.shortTitle }}</strong><small>Supports {{ stage.supports.join(' / ') || 'the core process' }}</small></span><AtlasStatus :state="stage.practiceState" /><Icon name="chevronRight" :size="16" /></button></div>
      <div class="atlas-workspace" :class="{ 'is-story': storyMode }">
        <AtlasStory v-if="storyMode && chapter" :stage="chapter" :chapters="chapters" :references="data.references" @chapter="chooseChapter" @detail="select" />
        <AtlasCanvas v-else ref="canvas" :stages="data.stages" :references="data.references" :selected-id="selectedId" @select="select" @fit="fit" />
        <AtlasStageDetail v-if="selected" :key="selected.id" :stage="selected" :controls="controls" :references="references" @close="closeDetail" />
      </div>
      <section class="atlas-page-references" aria-labelledby="atlas-references-title"><div><span class="atlas-eyebrow">REFERENCE LAYER / DETAILS ON DEMAND</span><h2 id="atlas-references-title">Rules, routes & review references</h2><p>Definitions and reported activities; proposed items remain labelled separately.</p></div><AtlasReferences :references="data.references" /></section>
      <footer class="atlas-page-footer"><span>Read-only process material · {{ data.meta.contentVersion }}</span><span>Effective from: {{ data.meta.effectiveFrom || 'Pending approval' }}</span><span>1–8 chapters · Escape closes detail</span></footer>
    </template>
  </section>
</template>

<style scoped>
.atlas-view { height: 100%; overflow: auto; padding: 28px 32px 40px; color: var(--color-text-400); scrollbar-width: thin; }
.atlas-page-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.atlas-eyebrow { color: var(--color-text-300); font-size: 12px; letter-spacing: .1em; }
h1 { font-size: clamp(32px,3vw,44px); font-weight: 500; line-height: 1.08; margin-top: 12px; }
h1 em { font-style: normal; color: var(--color-cyan-400); }
.atlas-page-head p { margin-top: 12px; color: var(--color-text-300); font-size: 15px; max-width: 780px; }
.atlas-head-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.atlas-version { padding: 6px 10px; border: 1px solid var(--color-card-border); border-radius: 6px; color: var(--color-orange-400); font-size: 12px; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 12px; min-height: 44px; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); color: var(--color-text-400); }
button:hover { background: var(--color-command-bg-soft); }
button:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
button:disabled { opacity: .5; }
.atlas-source-state { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 20px 0; color: var(--color-text-300); font-size: 12px; }
.atlas-source-warning { border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); padding: 12px 16px; font-size: 14px; margin-bottom: 16px; overflow-wrap: anywhere; }
.atlas-view-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.atlas-view-bar p { color: var(--color-text-300); font-size: 12px; }
.atlas-view-modes { display: flex; gap: 8px; }
.atlas-view-modes button[aria-pressed=true] { border-color: var(--color-cyan-400); color: var(--color-cyan-400); }
.atlas-chapters { display: grid; grid-template-columns: repeat(8,minmax(0,1fr)); gap: 6px; margin-bottom: 16px; }
.atlas-chapters button { display: block; min-width: 0; padding: 10px 8px; text-align: left; font-size: 12px; line-height: 1.35; overflow-wrap: anywhere; }
.atlas-chapters button span { display: block; margin-bottom: 4px; color: var(--color-cyan-400); }
.atlas-chapters button[aria-current=step] { border-color: var(--color-cyan-400); background: var(--color-command-bg-soft); }
.atlas-supporting { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin-bottom: 16px; }
.atlas-supporting button { justify-content: flex-start; text-align: left; padding: 12px 16px; min-width: 0; }
.atlas-supporting button>span:nth-child(2) { flex: 1; min-width: 0; }
.atlas-support-id { color: var(--color-cyan-400); font-size: 16px; }
.atlas-supporting strong { font-size: 14px; font-weight: 500; }
.atlas-supporting small { display: block; margin-top: 4px; font-size: 12px; color: var(--color-text-300); }
.atlas-workspace { display: flex; align-items: stretch; border: 1px solid var(--color-card-border); border-radius: var(--radius-lg); background: var(--space-deep); overflow: hidden; min-width: 0; }
.atlas-page-references { display: grid; gap: 20px; margin-top: 32px; }
.atlas-page-references h2 { font-size: 24px; font-weight: 500; line-height: 1.2; margin-top: 8px; }
.atlas-page-references p { color: var(--color-text-300); font-size: 14px; margin-top: 8px; }
.atlas-page-footer { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-card-border); font-size: 12px; color: var(--color-text-300); }
.atlas-empty,.atlas-loading { padding: 32px; background: var(--space-navy); border: 1px solid var(--color-card-border); border-radius: var(--radius-md); }
.atlas-empty h2 { font-size: 24px; }
.atlas-empty p { margin: 16px 0; color: var(--color-text-300); line-height: 1.5; }
.atlas-empty button { margin: 0 8px 8px 0; }
.atlas-loading>div { height: 40px; background: var(--color-beige-500); border-radius: 8px; margin-top: 12px; }
@media(max-width:1100px) { .atlas-view { padding: 24px; } .atlas-supporting .atlas-status { display: none; } }
@media(max-width:840px) { .atlas-view { padding: 20px 16px 32px; } .atlas-chapters { grid-template-columns: repeat(4,minmax(0,1fr)); } .atlas-workspace { flex-direction: column; } .atlas-supporting { grid-template-columns: minmax(0,1fr); } .atlas-supporting .atlas-status { display: inline-block; } }
@media(max-width:400px) { .atlas-view { padding: 16px 12px 24px; } .atlas-chapters { gap: 4px; } .atlas-chapters button { padding: 8px 6px; } .atlas-supporting button { padding: 12px; } .atlas-supporting .atlas-status { display: none; } .atlas-view-bar p { display: none; } .atlas-head-actions button { font-size: 13px; } }
</style>
