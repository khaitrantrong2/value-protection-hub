<script setup lang="ts">
import { computed } from "vue";
import type { AtlasReference, AtlasReferenceGroup } from "../../types/atlas";
import AtlasStatus from "./AtlasStatus.vue";
const props = defineProps<{ references: AtlasReference[]; compact?: boolean }>();
const groupNames: Record<AtlasReferenceGroup, string> = {
  "reason-code": "Change reasons", "document-step": "Document sequence", "settlement-route": "Settlement routes", escalation: "Escalation", kpi: "KPI definitions", record: "Records & evidence", "pipeline-step": "Automation handoffs", guidance: "Process guidance",
};
const groups = computed(() => Object.entries(groupNames).map(([key, title]) => ({ key, title,
  items: props.references.filter(reference => reference.group === key).sort((a, b) => a.order - b.order),
})).filter(group => group.items.length));
function publicLink(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
</script>
<template>
  <div class="atlas-references" :class="{ 'is-compact': compact }">
    <details v-for="group in groups" :key="group.key" class="atlas-reference-group">
      <summary>{{ group.title }} <span>{{ group.items.length }}</span></summary>
      <ol>
        <li v-for="item in group.items" :key="item.id">
          <div class="atlas-reference-heading"><strong>{{ item.title }}</strong><AtlasStatus :state="item.practiceState" /></div>
          <p>{{ item.body }}</p><small v-if="item.applicability">{{ item.applicability }}</small>
          <a v-if="publicLink(item.url)" :href="publicLink(item.url)" target="_blank" rel="noopener noreferrer">Public reference ↗</a>
        </li>
      </ol>
    </details>
  </div>
</template>
<style scoped>
.atlas-references { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
.atlas-reference-group { border: 1px solid var(--color-card-border); background: var(--space-navy); border-radius: var(--radius-md); min-width: 0; }
summary { padding: 16px; font-size: 15px; color: var(--color-text-400); cursor: pointer; }
summary span { float: right; color: var(--color-text-300); font-size: 12px; }
li { border-top: 1px solid var(--color-card-border); padding: 16px; overflow-wrap: anywhere; }
.atlas-reference-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-bottom: 8px; }
strong { font-size: 14px; color: var(--color-text-400); }
p { font-size: 14px; color: var(--color-text-300); line-height: 1.5; white-space: pre-line; }
small { display: block; margin-top: 8px; font-size: 12px; color: var(--color-text-300); }
a { display: inline-block; margin-top: 8px; color: var(--color-cyan-400); font-size: 13px; text-decoration: underline; }
summary:focus-visible,a:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
.is-compact { grid-template-columns: minmax(0,1fr); }
@media(max-width:840px) { .atlas-references { grid-template-columns: minmax(0,1fr); } }
</style>
