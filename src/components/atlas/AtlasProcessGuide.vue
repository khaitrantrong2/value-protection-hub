<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { AtlasPayload, AtlasReference, AtlasReferenceGroup, AtlasStageId } from "../../types/atlas";
import type { AtlasInspectorTab, AtlasLibraryGroup } from "../../types/atlasUi";
import AtlasGuideStage from "./AtlasGuideStage.vue";
import AtlasGuideReferences from "./AtlasGuideReferences.vue";
import ProcessGlossary from "./ProcessGlossary.vue";
import Icon from "../Icon.vue";
import { useLocale } from "../../i18n";
const { t, text } = useLocale();

const props = defineProps<{ data: AtlasPayload; stageId: AtlasStageId; activeTab: AtlasInspectorTab; referenceGroup: AtlasLibraryGroup | null; referenceId?: string | null; sourceLabel: string; sourceWarning?: string; version: string; translatedKeys?: Set<string> }>();
const emit = defineEmits<{ stage: [id: AtlasStageId]; reference: [reference: AtlasReference]; references: [group: AtlasLibraryGroup]; map: [] }>();
const documentPane = ref<HTMLElement | null>(null);
const groupNames = computed<Record<AtlasReferenceGroup, string>>(() => ({ "document-step": t("atlas.documentStep"), "reason-code": t("atlas.reasonCode"), kpi: t("atlas.kpi"), "pipeline-step": t("atlas.pipelineStep"), "settlement-route": t("atlas.settlementRoute"), escalation: t("atlas.escalation"), record: t("atlas.record"), guidance: t("atlas.guidance") }));
function printChapter() { window.print(); }
const chapters = computed(() => props.data.stages.filter(stage => stage.kind === "chapter").sort((a, b) => a.order - b.order));
const supporting = computed(() => props.data.stages.filter(stage => stage.kind === "supporting").sort((a, b) => a.order - b.order));
const selected = computed(() => props.data.stages.find(stage => stage.id === props.stageId));
const controls = computed(() => props.data.controls.filter(control => control.stageId === selected.value?.id));
const references = computed(() => props.data.references.filter(reference => reference.stageId === selected.value?.id || selected.value?.referenceIds.includes(reference.id)));
const supports = computed(() => supporting.value.filter(stage => selected.value && stage.supports.includes(selected.value.id)));
const supportedChapters = computed(() => chapters.value.filter(stage => selected.value?.supports.includes(stage.id)));
const chapterIndex = computed(() => chapters.value.findIndex(stage => stage.id === selected.value?.id));
const previous = computed(() => chapterIndex.value > 0 ? chapters.value[chapterIndex.value - 1] : undefined);
const next = computed(() => chapterIndex.value >= 0 ? chapters.value[chapterIndex.value + 1] : undefined);
const groups = computed(() => Object.entries(groupNames.value).map(([id, title]) => ({ id: id as AtlasReferenceGroup, title, count: props.data.references.filter(reference => reference.group === id).length })).filter(group => group.count));
const mobileValue = computed(() => props.referenceGroup === null ? `stage:${selected.value?.id ?? props.stageId}` : `references:${props.referenceGroup}`);
function changeMobile(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value.startsWith("stage:")) emit("stage", value.slice(6) as AtlasStageId);
  else emit("references", value.slice(11) as AtlasLibraryGroup);
}
async function focusDocument() {
  await nextTick();
  const pane = documentPane.value;
  if (!pane) return;
  const reference = props.referenceGroup !== null && props.referenceId ? [...pane.querySelectorAll<HTMLElement>("[data-guide-reference]")].find(item => item.dataset.guideReference === props.referenceId) : undefined;
  const section = props.referenceGroup === null && props.activeTab !== "summary" ? pane.querySelector<HTMLElement>(`[data-guide-section=${props.activeTab}]`) : null;
  const target = reference ?? section ?? pane.querySelector<HTMLElement>("#atlas-guide-title");
  if (!target) { pane.scrollTop = 0; return; }
  if (reference || section) pane.scrollTop += target.getBoundingClientRect().top - pane.getBoundingClientRect().top - 24;
  else pane.scrollTop = 0;
  target.focus({ preventScroll: true });
}
watch(() => [props.stageId, props.activeTab, props.referenceGroup, props.referenceId], focusDocument);
onMounted(focusDocument);
</script>

<template>
  <div class="atlas-process-guide">
    <aside class="guide-toc" :aria-label="text('Process Guide contents', 'Mục lục tài liệu quy trình')" data-lenis-prevent>
      <header><span>{{ text("READING GUIDE", "TÀI LIỆU QUY TRÌNH") }}</span><h2>{{ t("atlas.contents") }}</h2></header>
      <nav class="guide-toc-nav" :aria-label="text('Guide chapters', 'Các chương tài liệu')">
        <h3>{{ t("atlas.process") }}</h3><button v-for="stage in chapters" :key="stage.id" type="button" :aria-current="referenceGroup === null && selected?.id === stage.id ? 'page' : undefined" @click="emit('stage', stage.id)"><span>{{ stage.id }}</span><strong>{{ stage.shortTitle }}</strong></button>
        <template v-if="supporting.length"><h3>{{ t("atlas.supporting") }}</h3><button v-for="stage in supporting" :key="stage.id" type="button" :aria-current="referenceGroup === null && selected?.id === stage.id ? 'page' : undefined" @click="emit('stage', stage.id)"><span>{{ stage.id }}</span><strong>{{ stage.shortTitle }}</strong></button></template>
        <h3>{{ t("atlas.appendix") }}</h3><button type="button" :aria-current="referenceGroup === 'all' ? 'page' : undefined" @click="emit('references', 'all')"><Icon name="list" :size="16" /><strong>{{ t("atlas.allReferences") }}</strong><small>{{ data.references.length }}</small></button>
        <div v-if="referenceGroup !== null" class="guide-toc-reference-types"><button v-for="group in groups" :key="group.id" type="button" :aria-current="referenceGroup === group.id ? 'page' : undefined" @click="emit('references', group.id)"><strong>{{ group.title }}</strong><small>{{ group.count }}</small></button></div>
      </nav>
    </aside>

    <div class="guide-document-column">
      <div class="guide-mobile-toc"><label for="atlas-guide-mobile-chapter">{{ t("atlas.contents") }}</label><select id="atlas-guide-mobile-chapter" :value="mobileValue" @change="changeMobile"><optgroup :label="t('atlas.process')"><option v-for="stage in chapters" :key="stage.id" :value="`stage:${stage.id}`">{{ stage.id }} · {{ stage.shortTitle }}</option></optgroup><optgroup v-if="supporting.length" :label="t('atlas.supporting')"><option v-for="stage in supporting" :key="stage.id" :value="`stage:${stage.id}`">{{ stage.id }} · {{ stage.shortTitle }}</option></optgroup><optgroup :label="t('atlas.appendix')"><option value="references:all">{{ t("atlas.allReferences") }} ({{ data.references.length }})</option><option v-for="group in groups" :key="group.id" :value="`references:${group.id}`">{{ group.title }} ({{ group.count }})</option></optgroup></select></div>
      <div ref="documentPane" class="guide-document-scroll" :aria-label="text('Process Guide document', 'Nội dung tài liệu quy trình')" tabindex="0" data-lenis-prevent>
        <div class="guide-document">
          <header class="guide-document-context"><div class="guide-document-label"><span>{{ text("CLAIMBACK · PROCESS GUIDE", "CLAIMBACK · TÀI LIỆU QUY TRÌNH") }}</span><button type="button" @click="emit('map')"><Icon name="project" :size="16" />{{ t("atlas.backToMap") }}</button><button type="button" class="guide-print" @click="printChapter">{{ t("atlas.print") }}</button></div><p v-if="sourceWarning" class="guide-document-warning" role="status">{{ sourceWarning }}</p></header>
          <AtlasGuideStage v-if="referenceGroup === null && selected" :stage="selected" :controls="controls" :references="references" :support-stages="supports" @stage="emit('stage', $event)" @reference="emit('reference', $event)" />
          <AtlasGuideReferences v-else-if="referenceGroup !== null" :references="data.references" :stages="data.stages" :group="referenceGroup" :group-names="groupNames" :reference-id="referenceId" @group="emit('references', $event)" @stage="emit('stage', $event)" />
          <div v-else class="guide-no-chapter"><h2 id="atlas-guide-title" tabindex="-1">{{ text("No published chapter", "Chưa có chương được xuất bản") }}</h2><p>{{ text("Choose another chapter or refresh the process source.", "Chọn chương khác hoặc tải lại nguồn nội dung.") }}</p></div>
          <footer v-if="referenceGroup === null && selected" class="guide-chapter-navigation"><template v-if="selected.kind === 'chapter'"><button type="button" :disabled="!previous" @click="previous && emit('stage', previous.id)"><span>← {{ text("Previous chapter", "Chương trước") }}</span><strong>{{ previous ? `${previous.id} · ${previous.shortTitle}` : text('Start of process', 'Bắt đầu quy trình') }}</strong></button><button type="button" :disabled="!next" @click="next && emit('stage', next.id)"><span>{{ text("Next chapter", "Chương tiếp") }} →</span><strong>{{ next ? `${next.id} · ${next.shortTitle}` : text('End of business flow', 'Kết thúc luồng nghiệp vụ') }}</strong></button></template><div v-else-if="supportedChapters.length" class="guide-return-chapters"><p>{{ text("Return to a supported business stage", "Về giai đoạn nghiệp vụ được hỗ trợ") }}</p><button v-for="stage in supportedChapters" :key="stage.id" type="button" @click="emit('stage', stage.id)">{{ stage.id }} · {{ stage.shortTitle }}<Icon name="arrowRight" :size="14" /></button></div></footer>
          <ProcessGlossary />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.atlas-process-guide { display: grid; grid-template-columns: 216px minmax(0,1fr); width: 100%; height: 100%; min-height: 0; min-width: 0; overflow: hidden; color: var(--color-text-400); background: var(--space-deep); }
.guide-toc { display: flex; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden; border-right: 1px solid var(--color-card-border); background: var(--space-navy); }
.guide-toc>header { flex: none; padding: 16px 16px 12px; }
.guide-toc>header>span { color: var(--color-cyan-400); font-size: 10px; letter-spacing: .08em; }
.guide-toc h2 { font-size: 20px; line-height: 1.2; font-weight: 500; margin-top: 4px; }
.guide-toc-nav { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 0 12px 20px; scrollbar-width: thin; }
.guide-toc-nav h3 { padding: 0 8px; margin: 16px 0 6px; color: var(--color-text-300); font-size: 11px; font-weight: 400; }
.guide-toc-nav h3:first-child { margin-top: 0; }
button { cursor: pointer; color: var(--color-text-400); min-height: 44px; border: 1px solid var(--color-card-border); border-radius: 6px; background: var(--space-navy); padding: 8px 12px; }
.guide-toc-nav button { display: flex; gap: 10px; align-items: baseline; width: 100%; border-color: transparent; text-align: left; padding: 10px 8px; }
.guide-toc-nav button>span { flex: 0 0 22px; color: var(--color-cyan-400); font-size: 11px; font-variant-numeric: tabular-nums; }
.guide-toc-nav strong { flex: 1; font-size: 12px; line-height: 1.5; font-weight: 400; overflow-wrap: anywhere; }
.guide-toc-nav small { color: var(--color-text-300); font-size: 11px; }
.guide-toc-nav svg { color: var(--color-cyan-400); align-self: center; }
.guide-toc-nav button[aria-current=page] { border-color: var(--color-card-border-hover); background: var(--color-command-bg-soft); }
.guide-toc-nav button[aria-current=page] strong { color: var(--color-cyan-400); }
.guide-toc-reference-types { margin: 4px 0 0 20px; border-left: 1px solid var(--color-card-border); padding-left: 8px; }
.guide-toc-reference-types button { gap: 8px; }
.guide-document-column { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
.guide-document-scroll { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-gutter: stable; }
.guide-document { max-width: 1120px; padding: 12px clamp(20px,3vw,44px) 32px; margin: 0 auto; }
.guide-document-context { padding-bottom: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--color-card-border); }
.guide-document-label { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; }
.guide-document-label>span { flex: 1 1 180px; }
.guide-print { font-size: 11px !important; }
@media print {
  .atlas-process-guide { display: block; height: auto; overflow: visible; background: #fff; color: #111; }
  .guide-toc,.guide-mobile-toc,.guide-chapter-navigation,.guide-document-label button { display: none !important; }
  .guide-document-column,.guide-document-scroll { display: block; height: auto; overflow: visible; }
  .guide-document { max-width: none; margin: 0; padding: 0; }
  .guide-document-context { break-inside: avoid; border-color: #bbb; }
  .guide-document-label>span { color: #222; }
  .guide-document :deep(*) { color: #111 !important; background: transparent !important; box-shadow: none !important; }
  .guide-document :deep(.guide-control),.guide-document :deep(.guide-mini-flow),.guide-document :deep(.guide-reference-record) { break-inside: avoid; border-color: #aaa; }
  .guide-document :deep(button) { border-color: #aaa; }
  .guide-document :deep(h2),.guide-document :deep(h3),.guide-document :deep(h4) { break-after: avoid; }
  .guide-document :deep(a[href]::after) { content: " (" attr(href) ")"; font-size: 9pt; overflow-wrap: anywhere; }
}
.guide-document-label>span { color: var(--color-text-300); font-size: 10px; letter-spacing: .06em; line-height: 1.5; }
.guide-document-label button { display: inline-flex; align-items: center; gap: 8px; flex: none; font-size: 12px; }
.guide-document-warning { margin-top: 20px; padding: 12px 16px; border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); color: var(--color-text-300); font-size: 13px; line-height: 1.6; white-space: pre-line; overflow-wrap: anywhere; }
.guide-chapter-navigation { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--color-card-border); }
.guide-chapter-navigation>button { display: grid; align-content: start; gap: 8px; text-align: left; padding: 16px; }
.guide-chapter-navigation>button>span { color: var(--color-text-300); font-size: 11px; }
.guide-chapter-navigation>button>strong { font-size: 13px; line-height: 1.5; font-weight: 400; overflow-wrap: anywhere; }
button:disabled { opacity: .45; cursor: default; }
button:not(:disabled):hover { border-color: var(--color-card-border-hover); background: var(--color-command-bg-soft); }
.guide-return-chapters { grid-column: 1/-1; display: flex; flex-wrap: wrap; gap: 8px; }
.guide-return-chapters p { flex: 0 0 100%; font-size: 12px; color: var(--color-text-300); margin-bottom: 8px; }
.guide-return-chapters button { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }
.guide-no-chapter h2 { font-size: 26px; }
.guide-no-chapter p { margin-top: 16px; color: var(--color-text-300); font-size: 14px; }
.guide-mobile-toc { display: none; }
button:focus-visible,select:focus-visible,.guide-document-scroll:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: -2px; }
@media(max-width:1100px) { .atlas-process-guide { grid-template-columns: 200px minmax(0,1fr); } .guide-document { padding: 12px 24px 32px; } }
@media(max-width:840px) { .atlas-process-guide { grid-template-columns: minmax(0,1fr); } .guide-toc { display: none; } .guide-mobile-toc { display: flex; flex: none; align-items: center; gap: 12px; padding: 12px 16px; background: var(--space-navy); border-bottom: 1px solid var(--color-card-border); } .guide-mobile-toc label { font-size: 12px; color: var(--color-text-300); } .guide-mobile-toc select { min-width: 0; flex: 1; min-height: 44px; padding: 8px 24px 8px 12px; border: 1px solid var(--color-card-border); border-radius: 6px; background: var(--space-deep); color: var(--color-text-400); font: inherit; font-size: 16px; } .guide-document { padding: 20px 20px 32px; } .guide-document-label { align-items: flex-start; } .guide-document-label>span { max-width: 160px; } .guide-document-label button { padding: 8px; } }
@media(max-width:400px) { .guide-document { padding-right: 16px; padding-left: 16px; } .guide-chapter-navigation { gap: 8px; } .guide-chapter-navigation>button { padding: 12px; } .guide-mobile-toc { padding: 8px 12px; gap: 8px; } }
@media(max-height:480px) { .guide-toc>header { padding-top: 12px; padding-bottom: 12px; } .guide-toc>header p,.guide-toc>footer { display: none; } .guide-mobile-toc { padding-top: 8px; padding-bottom: 8px; } }
</style>
