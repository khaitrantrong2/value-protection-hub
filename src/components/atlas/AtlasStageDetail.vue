<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { AtlasStage, AtlasControl, AtlasReference } from "../../types/atlas";
import type { AtlasInspectorTab } from "../../types/atlasUi";
import AtlasStatus from "./AtlasStatus.vue";
import Icon from "../Icon.vue";
const props = defineProps<{ stage: AtlasStage; controls: AtlasControl[]; references: AtlasReference[]; activeTab: AtlasInspectorTab }>();
const emit = defineEmits<{ close: []; tab: [tab: AtlasInspectorTab]; reference: [reference: AtlasReference] }>();
const closeButton = ref<HTMLButtonElement | null>(null);
const body = ref<HTMLElement | null>(null);
const tabs = ref<HTMLElement | null>(null);
const tabItems: { id: AtlasInspectorTab; label: string }[] = [{ id: "summary", label: "Summary" }, { id: "ownership", label: "Ownership" }, { id: "controls", label: "Risks & controls" }];
const sipoc = computed(() => [["Supplier", props.stage.sipoc.supplier], ["Input", props.stage.sipoc.input], ["Process / handoff", props.stage.sipoc.process], ["Output", props.stage.sipoc.output], ["Customer", props.stage.sipoc.customer]]);
const raci = computed(() => [["A · Accountable", props.stage.raci.accountable], ["R · Responsible", props.stage.raci.responsible.join(" · ")], ["C · Consulted", props.stage.raci.consulted.join(" · ")], ["I · Informed", props.stage.raci.informed.join(" · ")]]);
async function moveTab(event: KeyboardEvent, index: number) {
  const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
  if (!offset && event.key !== "Home" && event.key !== "End") return;
  event.preventDefault();
  const target = event.key === "Home" ? 0 : event.key === "End" ? tabItems.length - 1 : (index + offset + tabItems.length) % tabItems.length;
  emit("tab", tabItems[target]!.id);
  await nextTick();
  tabs.value?.querySelectorAll<HTMLButtonElement>("[role=tab]")[target]?.focus({ preventScroll: true });
}
watch(() => [props.stage.id, props.activeTab], () => { if (body.value) body.value.scrollTop = 0; });
watch(() => props.stage.id, async () => { await nextTick(); closeButton.value?.focus({ preventScroll: true }); });
onMounted(() => closeButton.value?.focus({ preventScroll: true }));
</script>
<template>
  <aside class="atlas-detail" aria-labelledby="atlas-detail-title" data-lenis-prevent>
    <header class="atlas-detail-header">
      <div class="atlas-detail-head"><span>{{ stage.kind === 'supporting' ? 'SUPPORTING PROCESS' : 'STAGE INSPECTOR' }} · {{ stage.id }}</span><button ref="closeButton" class="atlas-close" type="button" aria-label="Close stage inspector" @click="emit('close')"><Icon name="close" :size="18" /></button></div>
      <AtlasStatus :state="stage.practiceState" /><h2 id="atlas-detail-title"><span class="atlas-full-title">{{ stage.title }}</span><span class="atlas-short-title">{{ stage.shortTitle }}</span></h2><p class="atlas-detail-role">{{ stage.roleTag }}</p>
    </header>
    <div ref="tabs" class="atlas-detail-tabs" role="tablist" aria-label="Stage details">
      <button v-for="(tab, index) in tabItems" :id="`atlas-inspector-tab-${tab.id}`" :key="tab.id" type="button" role="tab" :aria-selected="activeTab === tab.id" :aria-controls="`atlas-inspector-panel-${tab.id}`" :tabindex="activeTab === tab.id ? 0 : -1" @click="emit('tab', tab.id)" @keydown="moveTab($event, index)">{{ tab.label }}<span v-if="tab.id === 'controls'" class="atlas-tab-count">{{ controls.length }}</span></button>
    </div>
    <div ref="body" class="atlas-detail-body" data-lenis-prevent>
      <div class="atlas-compact-context"><AtlasStatus :state="stage.practiceState" /><p>{{ stage.title }}</p><p class="atlas-small">{{ stage.roleTag }}</p><p class="atlas-small">Effective: {{ stage.effectiveFrom || 'Not yet approved' }}</p></div>
      <section id="atlas-inspector-panel-summary" role="tabpanel" aria-labelledby="atlas-inspector-tab-summary" tabindex="0" :hidden="activeTab !== 'summary'"><template v-if="activeTab === 'summary'">
        <p class="atlas-question">{{ stage.businessQuestion }}</p><p v-if="stage.narrative" class="atlas-narrative">{{ stage.narrative }}</p><p v-if="stage.caution" class="atlas-caution">{{ stage.caution }}</p>
        <section class="atlas-detail-section"><h3>Scope & applicability</h3><p>{{ stage.applicability || 'Not specified' }}</p></section>
        <section class="atlas-detail-section"><h3>Inputs, outputs & handoff</h3><dl><template v-for="[name, value] in sipoc" :key="name"><dt>{{ name }}</dt><dd>{{ value || 'Not specified' }}</dd></template></dl></section>
        <section v-if="stage.pipeline.length" class="atlas-detail-section"><h3>Automation handoffs</h3><p class="atlas-small">Technical handoff labels; this is not a claim that every step is automated.</p><ol class="atlas-pipeline"><li v-for="(step, index) in stage.pipeline" :key="index">{{ step }}</li></ol></section>
        <section class="atlas-detail-section"><h3>Source basis</h3><p class="atlas-small">{{ stage.sourceBasis || 'Not specified' }}</p><p v-if="stage.updatedAt" class="atlas-small">Updated: {{ stage.updatedAt }}</p></section>
      </template></section>
      <section id="atlas-inspector-panel-ownership" role="tabpanel" aria-labelledby="atlas-inspector-tab-ownership" tabindex="0" :hidden="activeTab !== 'ownership'"><template v-if="activeTab === 'ownership'">
        <h3>Who owns this stage</h3><dl class="atlas-raci"><template v-for="[name, value] in raci" :key="name"><dt>{{ name }}</dt><dd>{{ value || 'Not specified' }}</dd></template></dl><p class="atlas-small atlas-raci-note">Accountability and participation describe reported roles, not a conclusion on control effectiveness.</p><p v-if="stage.applicability" class="atlas-small">{{ stage.applicability }}</p>
      </template></section>
      <section id="atlas-inspector-panel-controls" role="tabpanel" aria-labelledby="atlas-inspector-tab-controls" tabindex="0" :hidden="activeTab !== 'controls'"><template v-if="activeTab === 'controls'">
        <h3>Risks, controls & evidence</h3><p class="atlas-control-note">Reported activity and located evidence do not establish operating effectiveness.</p><p v-if="!controls.length" class="atlas-empty">No control record published for this stage.</p>
        <details v-for="control in controls" :key="`${stage.id}-${control.id}`" class="atlas-control"><summary><span class="atlas-control-id">{{ control.id }}</span><strong>{{ control.title }}</strong><AtlasStatus :state="control.practiceState" control /></summary><dl><dt>What could go wrong</dt><dd>{{ control.wcgw || 'Not specified' }}</dd><dt>Assertions</dt><dd>{{ control.assertions.join(' · ') || 'Not specified' }}</dd><dt>Control activity</dt><dd>{{ control.nature }} · {{ control.frequency }}<br>{{ control.ownerRole }}</dd><dt>Evidence</dt><dd><AtlasStatus :state="control.evidenceState" /><p>{{ control.evidenceLocation || 'No evidence location recorded' }}</p></dd><dt>Limitation</dt><dd>{{ control.limitation || 'Not specified' }}</dd></dl><p class="atlas-small">Source basis: {{ control.sourceBasis }} · {{ control.contentVersion }}</p></details>
      </template></section>
      <section v-if="references.length" class="atlas-detail-section atlas-related" aria-label="Related process references"><h3>Related references <span>{{ references.length }}</span></h3><p class="atlas-small">Open an item in the Reference Library.</p><div class="atlas-reference-chips"><button v-for="item in references" :key="item.id" type="button" @click="emit('reference', item)"><span>{{ item.id }}</span>{{ item.title }}<Icon name="arrowRight" :size="14" /></button></div></section>
    </div>
    <footer class="atlas-detail-source"><span>{{ stage.contentVersion || 'Version not specified' }}</span><span>Effective: {{ stage.effectiveFrom || 'Not yet approved' }}</span></footer>
  </aside>
</template>
<style scoped>
.atlas-detail { display: flex; flex-direction: column; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: hidden; container: atlas-inspector / size; background: var(--space-navy); border-left: 1px solid var(--color-card-border); color: var(--color-text-400); }
.atlas-detail-header { flex: none; padding: 12px 20px 16px; border-bottom: 1px solid var(--color-card-border); }
.atlas-detail-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; }
.atlas-detail-head>span { color: var(--color-cyan-400); font-size: 11px; letter-spacing: .06em; }
button { color: var(--color-text-400); cursor: pointer; }
.atlas-close { display: grid; place-items: center; flex: 0 0 44px; width: 44px; height: 44px; background: var(--space-deep); border: 1px solid var(--color-card-border); border-radius: 8px; }
h2 { font-size: 22px; line-height: 1.25; margin: 12px 0 8px; overflow-wrap: anywhere; }
.atlas-short-title,.atlas-compact-context { display: none; }
.atlas-detail-role { font-size: 12px; line-height: 1.4; color: var(--color-text-300); }
.atlas-detail-tabs { display: flex; flex: none; gap: 4px; padding: 0 12px; border-bottom: 1px solid var(--color-card-border); }
.atlas-detail-tabs button { flex: 1; min-width: 0; min-height: 48px; padding: 8px 4px; background: transparent; border: 0; border-bottom: 2px solid transparent; font-size: 12px; line-height: 1.3; }
.atlas-detail-tabs button[aria-selected=true] { color: var(--color-cyan-400); border-bottom-color: var(--color-cyan-400); }
.atlas-tab-count { margin-left: 4px; font-variant-numeric: tabular-nums; }
.atlas-detail-body { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-gutter: stable; padding: 20px; }
h3 { font-size: 15px; line-height: 1.4; margin-bottom: 12px; }
p,dd { font-size: 14px; line-height: 1.55; color: var(--color-text-300); white-space: pre-line; overflow-wrap: anywhere; }
.atlas-question { font-size: 16px; color: var(--color-text-400); }
.atlas-narrative { margin-top: 16px; }
.atlas-caution,.atlas-control-note { padding: 12px; margin-top: 16px; border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); }
.atlas-detail-section { margin-top: 24px; }
dl { display: grid; gap: 6px; }
dt { margin-top: 8px; font-size: 12px; color: var(--color-cyan-400); }
dd { margin: 0; }
.atlas-small { margin-top: 8px; font-size: 12px; }
.atlas-raci dd { padding-bottom: 12px; border-bottom: 1px solid var(--color-card-border); }
.atlas-raci-note { margin-top: 20px; }
.atlas-empty { padding: 16px 0; }
.atlas-control { margin-top: 12px; border: 1px solid var(--color-card-border); border-radius: 8px; padding: 12px; }
.atlas-control summary { cursor: pointer; color: var(--color-text-400); }
.atlas-control-id { font-size: 11px; color: var(--color-cyan-400); margin-right: 8px; }
.atlas-control strong { font-size: 14px; line-height: 1.5; }
.atlas-control summary .atlas-status { margin: 8px 0 0 16px; }
.atlas-control[open] summary { margin-bottom: 12px; }
.atlas-control dd p { margin-top: 8px; }
.atlas-pipeline { list-style: decimal; padding-left: 20px; margin-top: 12px; }
.atlas-pipeline li { font-size: 14px; line-height: 1.5; color: var(--color-text-300); margin-bottom: 8px; overflow-wrap: anywhere; }
.atlas-related { border-top: 1px solid var(--color-card-border); padding-top: 20px; }
.atlas-related h3 span { color: var(--color-text-300); font-size: 12px; font-weight: 400; }
.atlas-reference-chips { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.atlas-reference-chips button { display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: 8px; align-items: center; width: 100%; min-height: 44px; padding: 8px; text-align: left; font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; background: transparent; border: 1px solid var(--color-card-border); border-radius: 6px; }
.atlas-reference-chips button>span { font-size: 10px; color: var(--color-cyan-400); }
.atlas-reference-chips button:hover,.atlas-close:hover { background: var(--color-command-bg-soft); }
.atlas-detail-source { display: flex; flex-direction: column; flex: none; gap: 4px; padding: 12px 20px; border-top: 1px solid var(--color-card-border); color: var(--color-text-300); font-size: 11px; line-height: 1.4; overflow-wrap: anywhere; }
button:focus-visible,summary:focus-visible,[role=tabpanel]:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: -2px; }
@media(max-width:840px) { .atlas-detail { border-left: 0; } .atlas-detail-header { padding: 8px 16px 12px; } .atlas-detail-body { padding: 16px; } h2 { font-size: 20px; } .atlas-detail-source { padding: 8px 16px; } }
@container atlas-inspector (max-height:400px) { .atlas-detail-header { position: relative; padding: 8px 64px 12px 12px; } .atlas-detail-head { min-height: 0; margin-bottom: 0; } .atlas-detail-head>span { font-size: 10px; line-height: 1.4; } .atlas-close { position: absolute; top: 8px; right: 12px; } .atlas-detail-header>.atlas-status,.atlas-full-title,.atlas-detail-role { display: none; } .atlas-short-title { display: inline; } h2 { font-size: 16px; line-height: 1.3; margin: 6px 0 0; } .atlas-detail-tabs button { min-height: 44px; } .atlas-detail-body { padding: 12px; } .atlas-compact-context { display: block; margin-bottom: 20px; } .atlas-compact-context>p:first-of-type { color: var(--color-text-400); margin-top: 12px; } .atlas-detail-source { padding: 8px 12px; } .atlas-detail-source>span+span { display: none; } }
</style>
