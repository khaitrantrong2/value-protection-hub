<script setup lang="ts">
import { computed } from "vue";
import type { AtlasControl, AtlasReference, AtlasStage, AtlasStageId } from "../../types/atlas";
import AtlasStatus from "./AtlasStatus.vue";
import Icon from "../Icon.vue";

const props = defineProps<{ stage: AtlasStage; controls: AtlasControl[]; references: AtlasReference[]; supportStages: AtlasStage[] }>();
const emit = defineEmits<{ stage: [id: AtlasStageId]; reference: [reference: AtlasReference] }>();
const branches = computed(() => props.stage.fork === "parallel" ? ["BRANCH-05A", "BRANCH-05B"].flatMap(id => {
  const reference = props.references.find(item => item.id === id && item.stageId === props.stage.id);
  return reference ? [reference] : [];
}) : []);
const raci = computed(() => [["Accountable", props.stage.raci.accountable], ["Responsible", props.stage.raci.responsible.join(" · ")], ["Consulted", props.stage.raci.consulted.join(" · ")], ["Informed", props.stage.raci.informed.join(" · ")]]);
const processSteps = computed(() => [["Input", props.stage.sipoc.input], ["Process", props.stage.sipoc.process], ["Output", props.stage.sipoc.output]]);
</script>

<template>
  <article class="guide-stage" :data-stage-id="stage.id">
    <header class="guide-chapter-heading"><p class="guide-chapter-index">{{ stage.kind === 'chapter' ? 'BUSINESS PROCESS' : 'SUPPORTING CAPABILITY' }} · {{ stage.id }}</p><h2 id="atlas-guide-title" tabindex="-1">{{ stage.title }}</h2><p class="guide-question">{{ stage.businessQuestion }}</p><div class="guide-chapter-meta"><AtlasStatus :state="stage.practiceState" /><span>{{ stage.roleTag }}</span></div></header>

    <section class="guide-section" data-guide-section="summary"><h3><span>01</span> Scope & business purpose</h3><p>{{ stage.narrative || 'No narrative published for this stage.' }}</p><dl class="guide-facts"><dt>Applicability</dt><dd>{{ stage.applicability || 'Not specified' }}</dd></dl></section>

    <section class="guide-section"><h3><span>02</span> Process & handoffs</h3><div class="guide-mini-flow"><section v-for="([label, value], index) in processSteps" :key="label"><h4>{{ label }}</h4><p>{{ value || 'Not specified' }}</p><Icon v-if="index < processSteps.length - 1" class="guide-flow-arrow" name="arrowRight" :size="16" /></section></div><dl class="guide-facts"><dt>Supplier</dt><dd>{{ stage.sipoc.supplier || 'Not specified' }}</dd><dt>Customer / next owner</dt><dd>{{ stage.sipoc.customer || 'Not specified' }}</dd></dl>
      <aside v-if="stage.caution" class="guide-boundary"><strong>Process boundary</strong><p>{{ stage.caution }}</p></aside>
      <div v-if="branches.length" class="guide-parallel"><p class="guide-parallel-label">Parallel workstreams · not sequential gates</p><div class="guide-branch-grid"><section v-for="branch in branches" :key="branch.id"><AtlasStatus :state="branch.practiceState" /><h4>{{ branch.title }}</h4><p>{{ branch.body }}</p><p v-if="branch.applicability" class="guide-small">{{ branch.applicability }}</p></section></div></div>
    </section>

    <section class="guide-section" data-guide-section="ownership" tabindex="-1"><h3><span>03</span> Ownership & responsibilities</h3><dl class="guide-raci"><div v-for="([label, value], index) in raci" :key="label"><dt><span>{{ ['A','R','C','I'][index] }}</span>{{ label }}</dt><dd>{{ value || 'Not specified' }}</dd></div></dl></section>

    <section class="guide-section" data-guide-section="controls" tabindex="-1"><h3><span>04</span> Risks, controls & evidence <small>{{ controls.length }}</small></h3><p class="guide-control-note">Reported controls describe current practice. Located evidence does not, by itself, establish operating effectiveness.</p><p v-if="!controls.length" class="guide-empty">No control record is published for this stage.</p>
      <article v-for="control in controls" :key="control.id" class="guide-control"><header><span class="guide-record-id">{{ control.id }}</span><h4>{{ control.title }}</h4><AtlasStatus :state="control.practiceState" control /></header><dl class="guide-control-facts"><dt>What could go wrong</dt><dd>{{ control.wcgw || 'Not specified' }}</dd><dt>Assertions</dt><dd>{{ control.assertions.join(' · ') || 'Not specified' }}</dd><dt>Control activity</dt><dd>{{ control.nature }} · {{ control.frequency || 'Frequency not specified' }}<br>Owner: {{ control.ownerRole || 'Not specified' }}</dd><dt>Evidence status</dt><dd><AtlasStatus :state="control.evidenceState" /><p>{{ control.evidenceLocation || 'No evidence location recorded' }}</p></dd><dt>Limitation / residual risk</dt><dd>{{ control.limitation || 'Not specified' }}</dd></dl><footer><p>Source basis: {{ control.sourceBasis || 'Not specified' }}</p><span>{{ control.contentVersion || 'Version not specified' }}</span></footer></article>
    </section>

    <section class="guide-section"><h3><span>05</span> Supporting capabilities</h3><template v-if="stage.pipeline.length"><p class="guide-small">Technical handoffs support the business process; these labels do not imply that every step is automated.</p><ol class="guide-pipeline"><li v-for="(step, index) in stage.pipeline" :key="index"><span>{{ String(index + 1).padStart(2,'0') }}</span>{{ step }}</li></ol></template><div v-if="supportStages.length" class="guide-support-links"><button v-for="support in supportStages" :key="support.id" type="button" @click="emit('stage', support.id)"><span>{{ support.id }}</span><span><strong>{{ support.shortTitle }}</strong><small>{{ support.businessQuestion }}</small></span><Icon name="arrowRight" :size="18" /></button></div><p v-if="stage.kind === 'supporting' && stage.supports.length" class="guide-small">Supports business stages: {{ stage.supports.join(' · ') }}</p><p v-if="!stage.pipeline.length && !supportStages.length && !stage.supports.length" class="guide-small">No supporting capability is linked to this chapter in the published source.</p></section>

    <section class="guide-section"><h3><span>06</span> Related references <small>{{ references.length }}</small></h3><p class="guide-small">{{ references.length ? 'Open a definition or document sequence in the reference appendix.' : 'No related reference is linked to this chapter in the published source.' }}</p><div v-if="references.length" class="guide-reference-links"><button v-for="item in references" :key="item.id" type="button" @click="emit('reference', item)"><span>{{ item.id }}</span><strong>{{ item.title }}</strong><Icon name="arrowRight" :size="14" /></button></div></section>

    <footer class="guide-source-basis"><h3>Source & document status</h3><dl class="guide-facts"><dt>Content version</dt><dd>{{ stage.contentVersion || 'Not specified' }}</dd><dt>Effective from</dt><dd>{{ stage.effectiveFrom || 'Pending approval' }}</dd><dt v-if="stage.updatedAt">Content updated</dt><dd v-if="stage.updatedAt">{{ stage.updatedAt }}</dd><dt>Source basis</dt><dd>{{ stage.sourceBasis || 'Not specified' }}</dd></dl></footer>
  </article>
</template>

<style scoped>
.guide-chapter-index { color: var(--color-cyan-400); font-size: 11px; letter-spacing: .08em; }
h2 { font-size: clamp(26px,3vw,38px); font-weight: 500; line-height: 1.15; letter-spacing: -.025em; margin-top: 12px; overflow-wrap: anywhere; }
.guide-question { margin-top: 20px; font-size: 18px; line-height: 1.5; color: var(--color-text-400); }
.guide-chapter-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; margin-top: 20px; font-size: 12px; color: var(--color-text-300); }
.guide-section { padding-top: 28px; margin-top: 32px; border-top: 1px solid var(--color-card-border); }
.guide-section>p { max-width: 65ch; }
h3 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; font-size: 18px; line-height: 1.4; font-weight: 500; margin-bottom: 16px; }
h3>span { font-size: 11px; color: var(--color-cyan-400); font-variant-numeric: tabular-nums; }
h3>small { color: var(--color-text-300); font-size: 12px; font-weight: 400; }
p,dd { font-size: 15px; line-height: 1.75; color: var(--color-text-300); white-space: pre-line; overflow-wrap: anywhere; }
.guide-facts { display: grid; grid-template-columns: 140px minmax(0,1fr); gap: 12px 20px; margin-top: 24px; }
dt { color: var(--color-text-400); font-size: 12px; line-height: 1.6; } dd { margin: 0; }
.guide-mini-flow { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); }
.guide-mini-flow section { position: relative; padding: 20px; min-width: 0; }
.guide-mini-flow section+section { border-left: 1px solid var(--color-card-border); }
h4 { font-size: 15px; font-weight: 500; line-height: 1.5; overflow-wrap: anywhere; }
.guide-mini-flow h4 { margin-bottom: 10px; color: var(--color-cyan-400); font-size: 12px; }
.guide-mini-flow p { font-size: 13px; line-height: 1.65; }
.guide-flow-arrow { position: absolute; right: -8px; top: 22px; z-index: 1; color: var(--color-cyan-400); background: var(--space-navy); }
.guide-boundary { margin-top: 24px; padding: 16px 20px; border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); }
.guide-boundary strong { font-size: 12px; font-weight: 500; color: var(--color-orange-400); }
.guide-boundary p { margin-top: 8px; font-size: 14px; }
.guide-parallel { margin-top: 28px; }
.guide-parallel-label { color: var(--color-cyan-400); font-size: 12px; margin-bottom: 12px; }
.guide-branch-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }
.guide-branch-grid section { padding: 20px; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); }
.guide-branch-grid h4 { margin: 12px 0; }
.guide-branch-grid p { font-size: 14px; }
.guide-small { font-size: 12px; line-height: 1.65; margin-top: 10px; }
.guide-raci { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px 32px; }
.guide-raci>div { border-bottom: 1px solid var(--color-card-border); padding-bottom: 16px; }
.guide-raci dt { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.guide-raci dt>span { color: var(--color-cyan-400); font-size: 16px; }
.guide-control-note { font-size: 13px; max-width: 680px; }
.guide-empty { margin-top: 16px; }
.guide-control { margin-top: 24px; border: 1px solid var(--color-card-border); border-radius: 8px; overflow: hidden; }
.guide-control>header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 16px 20px; background: var(--space-navy); border-bottom: 1px solid var(--color-card-border); }
.guide-control>header h4 { flex: 1; min-width: 160px; }
.guide-record-id { color: var(--color-cyan-400); font-size: 11px; font-variant-numeric: tabular-nums; }
.guide-control-facts { display: grid; grid-template-columns: 140px minmax(0,1fr); gap: 16px 20px; padding: 20px; }
.guide-control-facts dd { font-size: 14px; line-height: 1.65; }
.guide-control-facts dd p { font-size: 13px; margin-top: 8px; }
.guide-control>footer { display: grid; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--color-card-border); color: var(--color-text-300); font-size: 11px; }
.guide-control>footer p { font-size: 11px; line-height: 1.6; }
.guide-pipeline { list-style: none; margin-top: 20px; }
.guide-pipeline li { display: grid; grid-template-columns: 24px minmax(0,1fr); gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-card-border); font-size: 14px; line-height: 1.65; color: var(--color-text-300); overflow-wrap: anywhere; }
.guide-pipeline li>span { font-size: 11px; color: var(--color-cyan-400); }
.guide-support-links { margin-top: 20px; }
button { min-height: 44px; color: var(--color-text-400); border: 1px solid var(--color-card-border); border-radius: 6px; background: var(--space-navy); cursor: pointer; text-align: left; }
button:hover { background: var(--color-command-bg-soft); border-color: var(--color-card-border-hover); }
.guide-support-links button { display: grid; grid-template-columns: 28px minmax(0,1fr) 18px; align-items: center; gap: 12px; width: 100%; padding: 16px; margin-top: 12px; }
.guide-support-links button>span:first-child { color: var(--color-cyan-400); font-size: 18px; }
.guide-support-links strong { font-size: 14px; font-weight: 500; }
.guide-support-links small { display: block; color: var(--color-text-300); font-size: 12px; line-height: 1.5; margin-top: 6px; }
.guide-reference-links { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; margin-top: 16px; }
.guide-reference-links button { display: grid; grid-template-columns: auto minmax(0,1fr) 14px; gap: 8px; align-items: center; padding: 12px; }
.guide-reference-links span { font-size: 10px; color: var(--color-cyan-400); }
.guide-reference-links strong { font-size: 12px; font-weight: 400; line-height: 1.5; overflow-wrap: anywhere; }
.guide-source-basis { margin-top: 36px; padding-top: 24px; border-top: 1px solid var(--color-card-border); }
.guide-source-basis h3 { font-size: 14px; }
.guide-source-basis dd { font-size: 12px; line-height: 1.65; }
button:focus-visible,[tabindex='-1']:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 3px; }
@media(max-width:1100px) { .guide-mini-flow { grid-template-columns: minmax(0,1fr); } .guide-mini-flow section+section { border-left: 0; border-top: 1px solid var(--color-card-border); } .guide-flow-arrow { right: 20px; top: auto; bottom: -8px; transform: rotate(90deg); } }
@media(max-width:840px) { .guide-section { margin-top: 28px; padding-top: 24px; } .guide-raci,.guide-reference-links,.guide-branch-grid { grid-template-columns: minmax(0,1fr); } .guide-control-facts,.guide-facts { grid-template-columns: minmax(0,1fr); gap: 8px; } .guide-facts dd+dt,.guide-control-facts dd+dt { margin-top: 8px; } .guide-control>header,.guide-control-facts { padding: 16px; } .guide-control>footer { padding: 12px 16px; } .guide-question { font-size: 16px; } p,dd { font-size: 14px; line-height: 1.75; } }
</style>
