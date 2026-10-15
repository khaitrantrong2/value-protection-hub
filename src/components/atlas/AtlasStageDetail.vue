<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { AtlasStage, AtlasControl, AtlasReference } from "../../types/atlas";
import AtlasStatus from "./AtlasStatus.vue";
import AtlasReferences from "./AtlasReferences.vue";
import Icon from "../Icon.vue";
const props = defineProps<{ stage: AtlasStage; controls: AtlasControl[]; references: AtlasReference[] }>();
const emit = defineEmits<{ close: [] }>();
const closeButton = ref<HTMLButtonElement | null>(null);
const sipoc = computed(() => [["Supplier", props.stage.sipoc.supplier], ["Input", props.stage.sipoc.input], ["Process / handoff", props.stage.sipoc.process], ["Output", props.stage.sipoc.output], ["Customer", props.stage.sipoc.customer]]);
const raci = computed(() => [["A · Accountable", props.stage.raci.accountable], ["R · Responsible", props.stage.raci.responsible.join(" · ")], ["C · Consulted", props.stage.raci.consulted.join(" · ")], ["I · Informed", props.stage.raci.informed.join(" · ")]]);
onMounted(() => closeButton.value?.focus({ preventScroll: true }));
</script>
<template>
  <aside class="atlas-detail" aria-labelledby="atlas-detail-title" data-lenis-prevent>
    <div class="atlas-detail-head"><span>STAGE {{ stage.id }} / {{ stage.kind === 'supporting' ? 'SUPPORTING PROCESS' : 'DETAIL' }}</span><button ref="closeButton" type="button" aria-label="Close stage detail" @click="emit('close')"><Icon name="close" :size="18" /></button></div>
    <div class="atlas-detail-body">
      <AtlasStatus :state="stage.practiceState" /><h2 id="atlas-detail-title">{{ stage.title }}</h2><p class="atlas-question">{{ stage.businessQuestion }}</p>
      <p class="atlas-caution">{{ stage.caution }}</p>
      <section><h3>Supplier → customer</h3><dl><template v-for="[name, value] in sipoc" :key="name"><dt>{{ name }}</dt><dd>{{ value || 'Not specified' }}</dd></template></dl></section>
      <section><h3>Ownership</h3><dl><template v-for="[name, value] in raci" :key="name"><dt>{{ name }}</dt><dd>{{ value || '—' }}</dd></template></dl><p class="atlas-small">{{ stage.applicability }}</p></section>
      <section><h3>Risk, control & evidence</h3><p class="atlas-small">Reported activity and located evidence do not establish operating effectiveness.</p>
        <p v-if="!controls.length" class="atlas-small">No control record published for this stage.</p>
        <details v-for="control in controls" :key="control.id" class="atlas-control">
          <summary><strong>{{ control.title }}</strong><AtlasStatus :state="control.practiceState" control /></summary>
          <dl><dt>What could go wrong</dt><dd>{{ control.wcgw }}</dd><dt>Assertion</dt><dd>{{ control.assertions.join(' · ') }}</dd><dt>Control activity</dt><dd>{{ control.nature }} · {{ control.frequency }}<br>{{ control.ownerRole }}</dd><dt>Evidence</dt><dd><AtlasStatus :state="control.evidenceState" /><p>{{ control.evidenceLocation }}</p></dd><dt>Limitation</dt><dd>{{ control.limitation }}</dd></dl>
          <p class="atlas-small">Source basis: {{ control.sourceBasis }} · {{ control.contentVersion }}</p>
        </details>
      </section>
      <section v-if="stage.pipeline.length"><h3>Automation handoffs</h3><p class="atlas-small">Technical handoff labels; this is not a claim that every step is automated.</p><ol class="atlas-pipeline"><li v-for="(step,index) in stage.pipeline" :key="index">{{ step }}</li></ol></section>
      <section v-if="references.length"><h3>Related process references</h3><AtlasReferences :references="references" compact /></section>
      <footer class="atlas-detail-source"><p>Source basis: {{ stage.sourceBasis }}</p><p>{{ stage.contentVersion }} · Effective: {{ stage.effectiveFrom || 'Not yet approved' }}</p><p v-if="stage.updatedAt">Updated: {{ stage.updatedAt }}</p></footer>
    </div>
  </aside>
</template>
<style scoped>
.atlas-detail { width: 360px; flex: 0 0 360px; min-width: 0; max-height: calc(min(62vh,640px) + 88px); min-height: 460px; overflow-y: auto; background: var(--space-navy); border-left: 1px solid var(--color-card-border); scrollbar-width: thin; }
.atlas-detail-head { position: sticky; top: 0; z-index: 2; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; background: var(--space-navy); border-bottom: 1px solid var(--color-card-border); }
.atlas-detail-head span { font-size: 12px; color: var(--color-text-300); }
button { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-deep); color: var(--color-text-400); }
.atlas-detail-body { padding: 20px; }
h2 { font-size: 25px; line-height: 1.2; color: var(--color-text-400); margin: 12px 0; }
h3 { font-size: 16px; color: var(--color-text-400); margin-bottom: 12px; }
p,dd { font-size: 14px; line-height: 1.5; color: var(--color-text-300); white-space: pre-line; overflow-wrap: anywhere; }
.atlas-caution { padding: 12px; margin-top: 16px; border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); }
section { margin-top: 24px; }
dl { display: grid; gap: 6px; }
dt { margin-top: 8px; font-size: 12px; color: var(--color-cyan-400); }
.atlas-small,.atlas-detail-source p { margin-top: 8px; font-size: 12px; }
.atlas-control { margin-top: 12px; border: 1px solid var(--color-card-border); border-radius: 8px; padding: 12px; }
summary { cursor: pointer; color: var(--color-text-400); }
summary strong { display: inline; font-size: 14px; margin-right: 8px; }
summary .atlas-status { margin-top: 8px; }
.atlas-pipeline { list-style: decimal; padding-left: 20px; margin-top: 12px; }
.atlas-pipeline li { font-size: 14px; line-height: 1.5; color: var(--color-text-300); margin-bottom: 8px; }
.atlas-detail-source { border-top: 1px solid var(--color-card-border); margin-top: 24px; padding-top: 12px; }
button:focus-visible,summary:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
@media(max-width:1100px) { .atlas-detail { width: 320px; flex-basis: 320px; } }
@media(max-width:840px) { .atlas-detail { width: 100%; flex-basis: auto; max-height: none; min-height: 0; border-left: 0; border-top: 1px solid var(--color-card-border); } }
</style>
