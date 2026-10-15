<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { AtlasReference, AtlasReferenceGroup, AtlasStage, AtlasStageId } from "../../types/atlas";
import type { AtlasLibraryGroup } from "../../types/atlasUi";
import AtlasStatus from "./AtlasStatus.vue";
import Icon from "../Icon.vue";

const props = defineProps<{
  references: AtlasReference[]; stages: AtlasStage[]; group: AtlasLibraryGroup; stageId: AtlasStageId | "";
  referenceId?: string | null; sourceLabel: string; sourceWarning?: string; version: string;
}>();
const emit = defineEmits<{ close: []; group: [group: AtlasLibraryGroup]; stage: [stageId: AtlasStageId | ""]; "select-stage": [stageId: AtlasStageId] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const results = ref<HTMLElement | null>(null);
const search = ref("");
let returnFocus: HTMLElement | null = null;
const groupNames: Record<AtlasReferenceGroup, string> = {
  "document-step": "Document sequence", "reason-code": "Change reasons", kpi: "KPI definitions", "pipeline-step": "Automation handoffs",
  "settlement-route": "Settlement routes", escalation: "Escalation", record: "Records & evidence", guidance: "Process guidance",
};
const orderedStages = computed(() => [...props.stages].sort((a, b) => a.order - b.order));
function belongsToStage(reference: AtlasReference, stage: AtlasStage) { return reference.stageId === stage.id || stage.referenceIds.includes(reference.id); }
const searched = computed(() => {
  const stage = props.stages.find(item => item.id === props.stageId);
  const term = search.value.trim().toLocaleLowerCase();
  return props.references.filter(item => (!stage || belongsToStage(item, stage)) && (!term || [item.id, item.title, item.body, item.applicability, groupNames[item.group]].join(" ").toLocaleLowerCase().includes(term)));
});
const availableGroups = computed(() => Object.entries(groupNames).map(([id, title]) => ({ id: id as AtlasReferenceGroup, title, count: searched.value.filter(item => item.group === id).length })));
const groups = computed(() => availableGroups.value.filter(item => (props.group === "all" || item.id === props.group) && item.count).map(group => ({ ...group, items: searched.value.filter(item => item.group === group.id).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)) })));
const resultCount = computed(() => groups.value.reduce((count, group) => count + group.items.length, 0));
function relatedStages(reference: AtlasReference) { return orderedStages.value.filter(stage => belongsToStage(reference, stage)); }
// The API parser owns the public-host allowlist. Keep the renderer's HTTPS guard as defense in depth.
function publicLink(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
function changeGroup(event: Event) { emit("group", (event.target as HTMLSelectElement).value as AtlasLibraryGroup); }
function changeStage(event: Event) { emit("stage", (event.target as HTMLSelectElement).value as AtlasStageId | ""); }
function cancel(event: Event) { event.preventDefault(); event.stopPropagation(); emit("close"); }
async function revealReference() {
  await nextTick();
  if (!props.referenceId || !results.value) return;
  const item = [...results.value.querySelectorAll<HTMLElement>("[data-reference-id]")].find(node => node.dataset.referenceId === props.referenceId);
  if (!item) return;
  if (item instanceof HTMLDetailsElement) item.open = true;
  item.scrollIntoView({ block: "nearest", behavior: "instant" });
  item.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
}
watch(() => props.referenceId, revealReference);
watch(() => [props.group, props.stageId, search.value], () => { if (results.value) results.value.scrollTop = 0; });
onMounted(async () => {
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  await nextTick();
  dialog.value?.showModal();
  searchInput.value?.focus({ preventScroll: true });
  await revealReference();
});
onBeforeUnmount(() => {
  dialog.value?.close();
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
});
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="atlas-library" aria-labelledby="atlas-library-title" aria-describedby="atlas-library-description" data-lenis-prevent @cancel="cancel" @keydown.esc.stop>
      <header class="atlas-library-header">
        <div class="atlas-library-heading"><div><span class="atlas-library-eyebrow">PROCESS ATLAS · L3</span><h2 id="atlas-library-title">Reference Library</h2><p id="atlas-library-description">Browse definitions and process guidance without leaving your place on the map.</p></div><button class="atlas-library-close" type="button" aria-label="Close Reference Library" @click="emit('close')"><Icon name="close" :size="20" /></button></div>
        <div class="atlas-library-source"><span>{{ sourceLabel }}</span><span>{{ version || 'Version not specified' }}</span></div>
        <p v-if="sourceWarning" class="atlas-library-warning" role="status">{{ sourceWarning }}</p>
      </header>

      <div class="atlas-library-filters">
        <label class="atlas-library-search"><span>Search references</span><div><Icon name="search" :size="18" /><input ref="searchInput" v-model="search" type="search" maxlength="300" placeholder="Title, ID or definition" autocomplete="off"></div></label>
        <label><span>Reference type</span><select :value="group" @change="changeGroup"><option value="all">All types ({{ searched.length }})</option><option v-for="item in availableGroups" :key="item.id" :value="item.id">{{ item.title }} ({{ item.count }})</option></select></label>
        <label><span>Stage context</span><select :value="stageId" @change="changeStage"><option value="">All stages</option><option v-for="item in orderedStages" :key="item.id" :value="item.id">{{ item.id }} · {{ item.shortTitle }}</option></select></label>
      </div>

      <div class="atlas-library-results-bar"><p role="status" aria-live="polite">{{ resultCount }} of {{ references.length }} references<span v-if="stageId"> · Stage {{ stageId }}</span></p><button v-if="search" type="button" @click="search = ''">Clear search</button></div>
      <div ref="results" class="atlas-library-results" data-lenis-prevent>
        <div v-if="!resultCount" class="atlas-library-empty"><Icon name="search" :size="24" /><h3>No matching references</h3><p>Try another search, reference type or stage. Your place on the map is unchanged.</p><button type="button" @click="search = ''; emit('group', 'all'); emit('stage', '')">Reset filters</button></div>
        <section v-for="section in groups" :key="section.id" class="atlas-library-group" :aria-labelledby="`atlas-library-group-${section.id}`">
          <h3 :id="`atlas-library-group-${section.id}`">{{ section.title }} <span>{{ section.items.length }}</span></h3>
          <details v-for="item in section.items" :key="item.id" :data-reference-id="item.id" :open="item.id === referenceId" class="atlas-library-item" :class="{ 'is-selected': item.id === referenceId }">
            <summary><span class="atlas-library-id">{{ item.id }}</span><strong>{{ item.title }}</strong><AtlasStatus :state="item.practiceState" /></summary>
            <div class="atlas-library-item-body"><p>{{ item.body || 'No definition published.' }}</p><p v-if="item.applicability" class="atlas-library-applicability"><span>Applicability</span>{{ item.applicability }}</p>
              <div v-if="relatedStages(item).length" class="atlas-library-stage-links"><span>Used in</span><button v-for="stage in relatedStages(item)" :key="stage.id" type="button" :aria-label="`Open stage ${stage.id}: ${stage.shortTitle}`" @click="emit('select-stage', stage.id)">{{ stage.id }} · {{ stage.shortTitle }}<Icon name="arrowRight" :size="14" /></button></div>
              <a v-if="publicLink(item.url)" :href="publicLink(item.url)" target="_blank" rel="noopener noreferrer">Public reference <Icon name="external" :size="14" /></a><small>{{ item.contentVersion || 'Version not specified' }}</small>
            </div>
          </details>
        </section>
      </div>
      <footer class="atlas-library-footer"><span>Definitions are process context, not evidence of operating effectiveness.</span><span>Esc to close · Return to the same map</span></footer>
    </dialog>
  </Teleport>
</template>

<style scoped>
.atlas-library { width: min(1120px,calc(100vw - 48px)); height: min(840px,calc(100dvh - 48px)); max-width: none; max-height: none; margin: auto; padding: 0; overflow: hidden; border: 1px solid var(--color-card-border-hover); border-radius: var(--radius-lg); background: var(--space-navy); color: var(--color-text-400); box-shadow: 0 20px 80px var(--space-abyss); }
.atlas-library[open] { display: flex; flex-direction: column; }
.atlas-library::backdrop { background: color-mix(in srgb,var(--space-abyss) 82%,transparent); }
.atlas-library-header { flex: none; padding: 20px 24px 16px; border-bottom: 1px solid var(--color-card-border); }
.atlas-library-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
.atlas-library-eyebrow { color: var(--color-cyan-400); font-size: 11px; line-height: 1.4; letter-spacing: .06em; }
h2 { font-size: 26px; line-height: 1.25; margin-top: 8px; }
.atlas-library-heading p { max-width: 680px; margin-top: 8px; font-size: 14px; line-height: 1.5; color: var(--color-text-300); }
button { cursor: pointer; background: var(--space-deep); border: 1px solid var(--color-card-border); border-radius: 6px; color: var(--color-text-400); min-height: 44px; padding: 8px 12px; font-size: 12px; }
button:hover { background: var(--color-command-bg-soft); }
.atlas-library-close { display: grid; place-items: center; flex: 0 0 44px; width: 44px; height: 44px; padding: 0; }
.atlas-library-source { display: flex; gap: 8px 20px; flex-wrap: wrap; margin-top: 16px; color: var(--color-text-300); font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; }
.atlas-library-warning { padding: 12px; margin-top: 12px; border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); font-size: 13px; line-height: 1.5; white-space: pre-line; overflow-wrap: anywhere; }
.atlas-library-filters { display: grid; grid-template-columns: minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr); flex: none; gap: 16px; padding: 16px 24px; border-bottom: 1px solid var(--color-card-border); }
label { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
label>span { color: var(--color-text-300); font-size: 12px; }
input,select { width: 100%; min-width: 0; height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 6px; color: var(--color-text-400); background: var(--space-deep); font: inherit; font-size: 14px; }
input::placeholder { color: var(--color-text-300); opacity: .8; }
select { text-overflow: ellipsis; }
.atlas-library-search>div { position: relative; }
.atlas-library-search svg { position: absolute; left: 12px; top: 13px; pointer-events: none; color: var(--color-text-300); }
.atlas-library-search input { padding-left: 40px; }
.atlas-library-results-bar { display: flex; flex: none; justify-content: space-between; align-items: center; min-height: 48px; gap: 12px; padding: 4px 24px; color: var(--color-text-300); font-size: 12px; }
.atlas-library-results-bar button { min-height: 36px; padding: 4px 8px; background: transparent; border: 0; text-decoration: underline; }
.atlas-library-results { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-gutter: stable; padding: 4px 24px 24px; }
.atlas-library-group+.atlas-library-group { margin-top: 28px; }
h3 { font-size: 16px; line-height: 1.4; margin-bottom: 12px; }
h3>span { margin-left: 8px; color: var(--color-text-300); font-size: 12px; font-weight: 400; }
.atlas-library-item { border-bottom: 1px solid var(--color-card-border); }
.atlas-library-item summary { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; min-height: 56px; padding: 12px 8px; cursor: pointer; list-style: none; }
.atlas-library-item summary::-webkit-details-marker { display: none; }
.atlas-library-item summary::before { content: '+'; flex: 0 0 12px; color: var(--color-cyan-400); }
.atlas-library-item[open] summary::before { content: '−'; }
.atlas-library-item summary strong { flex: 1; min-width: 160px; font-size: 14px; line-height: 1.5; overflow-wrap: anywhere; }
.atlas-library-id { flex: 0 0 auto; max-width: 100%; color: var(--color-cyan-400); font-size: 11px; overflow-wrap: anywhere; }
.atlas-library-item.is-selected { border-left: 2px solid var(--color-cyan-400); background: var(--color-command-bg-soft); }
.atlas-library-item-body { padding: 4px 28px 20px; }
.atlas-library-item-body p { font-size: 14px; line-height: 1.6; color: var(--color-text-300); white-space: pre-line; overflow-wrap: anywhere; }
.atlas-library-applicability { margin-top: 16px; }
.atlas-library-applicability>span,.atlas-library-stage-links>span { display: block; margin-bottom: 8px; color: var(--color-cyan-400); font-size: 12px; }
.atlas-library-stage-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.atlas-library-stage-links>span { flex: 0 0 100%; margin-bottom: 0; }
.atlas-library-stage-links button { display: inline-flex; align-items: center; gap: 8px; text-align: left; font-size: 12px; }
.atlas-library-item-body a { display: inline-flex; align-items: center; gap: 4px; margin-top: 16px; color: var(--color-cyan-400); text-decoration: underline; font-size: 13px; min-height: 44px; }
.atlas-library-item-body small { display: block; margin-top: 12px; color: var(--color-text-300); font-size: 11px; overflow-wrap: anywhere; }
.atlas-library-empty { display: grid; justify-items: start; align-content: start; gap: 16px; padding: 32px 0; }
.atlas-library-empty h3 { margin: 0; }
.atlas-library-empty p { max-width: 440px; color: var(--color-text-300); font-size: 14px; line-height: 1.5; }
.atlas-library-footer { display: flex; justify-content: space-between; flex: none; gap: 8px 24px; padding: 12px 24px; border-top: 1px solid var(--color-card-border); color: var(--color-text-300); font-size: 11px; line-height: 1.4; }
button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible,a:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
@media(max-width:840px) { .atlas-library { width: 100vw; height: 100dvh; margin: 0; border: 0; border-radius: 0; } .atlas-library-header { padding: 12px 16px; } h2 { font-size: 20px; } .atlas-library-heading p { font-size: 12px; } .atlas-library-source { margin-top: 12px; font-size: 11px; } .atlas-library-filters { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; padding: 12px 16px; } .atlas-library-search { grid-column: 1/-1; } input,select { font-size: 16px; } .atlas-library-results-bar { padding-right: 16px; padding-left: 16px; } .atlas-library-results { padding: 4px 16px 20px; } .atlas-library-item-body { padding: 4px 12px 16px; } .atlas-library-item summary .atlas-status { margin-left: 24px; } .atlas-library-footer { flex-direction: column; padding: 8px 16px; } .atlas-library-results-bar button { min-height: 44px; } }
@media(max-height:600px) and (min-width:841px) { .atlas-library { height: calc(100dvh - 16px); } .atlas-library-header { padding-top: 12px; padding-bottom: 12px; } .atlas-library-heading p { display: none; } .atlas-library-source { margin-top: 8px; } .atlas-library-filters { padding-top: 12px; padding-bottom: 12px; } }
@media(max-height:480px) and (min-width:540px) { .atlas-library-header { padding: 8px 16px; } .atlas-library-eyebrow,.atlas-library-heading p,.atlas-library-footer>span+span { display: none; } h2 { margin-top: 4px; font-size: 18px; } .atlas-library-source { margin-top: 4px; } .atlas-library-filters { grid-template-columns: minmax(0,1.2fr) repeat(2,minmax(0,1fr)); gap: 12px; padding: 8px 16px; } .atlas-library-search { grid-column: auto; } label { gap: 4px; } .atlas-library-footer { padding: 8px 16px; } }
</style>
