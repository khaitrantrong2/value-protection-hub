<script setup lang="ts">
import { computed } from "vue";
import type { AtlasStage, AtlasStageId, AtlasReference } from "../../types/atlas";
import AtlasStatus from "./AtlasStatus.vue";
const props = defineProps<{ stage: AtlasStage; chapters: AtlasStage[]; references: AtlasReference[] }>();
const emit = defineEmits<{ chapter: [id: AtlasStageId]; detail: [id: AtlasStageId] }>();
const index = computed(() => props.chapters.findIndex(item => item.id === props.stage.id));
const branches = computed(() => ["BRANCH-05A", "BRANCH-05B"].flatMap(id => {
  const reference = props.references.find(item => item.stageId === props.stage.id && item.id === id);
  return reference ? [reference] : [];
}));
function step(delta: number) { const stage = props.chapters[index.value + delta]; if (stage) emit("chapter", stage.id); }
</script>
<template>
  <article class="atlas-story" aria-labelledby="atlas-story-title" aria-live="polite">
    <div class="atlas-story-count">CHAPTER {{ stage.id }} / {{ String(chapters.length).padStart(2,'0') }}<AtlasStatus :state="stage.practiceState" /></div>
    <h2 id="atlas-story-title" tabindex="-1">{{ stage.title }}</h2><p class="atlas-story-question">{{ stage.businessQuestion }}</p><p class="atlas-story-narrative">{{ stage.narrative }}</p>
    <div v-if="stage.fork === 'parallel' && branches.length" class="atlas-story-branches">
      <section v-for="branch in branches" :key="branch.id"><AtlasStatus :state="branch.practiceState" /><h3>{{ branch.title }}</h3><p>{{ branch.body }}</p><small v-if="branch.applicability">{{ branch.applicability }}</small></section>
    </div>
    <div class="atlas-story-io"><section><h3>Input</h3><p>{{ stage.sipoc.input }}</p></section><section><h3>Output / handoff</h3><p>{{ stage.sipoc.output }}</p></section></div>
    <p class="atlas-story-caution">{{ stage.caution }}</p>
    <div class="atlas-story-owner"><span>{{ stage.roleTag }}</span><span>A: {{ stage.raci.accountable }}</span></div>
    <button type="button" class="atlas-story-detail" @click="emit('detail', stage.id)">Ownership, controls & evidence →</button>
    <div class="atlas-story-navigation"><button type="button" :disabled="index <= 0" @click="step(-1)">← Previous</button><span>{{ index + 1 }} / {{ chapters.length }}</span><button type="button" :disabled="index >= chapters.length - 1" @click="step(1)">Next →</button></div>
  </article>
</template>
<style scoped>
.atlas-story { min-width: 0; flex: 1; padding: 32px; background: var(--space-deep); }
.atlas-story-count { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 20px; color: var(--color-text-300); font-size: 12px; letter-spacing: .04em; }
h2 { max-width: 800px; color: var(--color-text-400); font-size: clamp(28px,3vw,44px); font-weight: 500; line-height: 1.1; }
p { color: var(--color-text-300); font-size: 15px; line-height: 1.6; white-space: pre-line; overflow-wrap: anywhere; }
.atlas-story-question { color: var(--color-text-400); margin-top: 16px; font-size: 18px; }
.atlas-story-narrative { max-width: 880px; margin-top: 20px; }
.atlas-story-io,.atlas-story-branches { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; margin-top: 24px; }
.atlas-story-io section { border-top: 1px solid var(--color-card-border); padding-top: 16px; }
h3 { font-size: 15px; font-weight: 500; color: var(--color-cyan-400); margin-bottom: 8px; }
.atlas-story-branches section { border: 1px solid var(--color-card-border); border-radius: var(--radius-md); padding: 16px; background: var(--space-navy); }
.atlas-story-branches section:first-child { border-color: var(--color-orange-400); }
.atlas-story-branches span { font-size: 12px; color: var(--color-text-300); }
.atlas-story-branches h3 { margin-top: 12px; color: var(--color-text-400); font-size: 20px; }
.atlas-story-branches small { display: block; font-size: 12px; color: var(--color-text-300); margin-top: 12px; }
.atlas-story-caution { margin-top: 24px; padding: 16px; background: var(--color-orange-muted); border-left: 2px solid var(--color-orange-400); }
.atlas-story-owner { display: flex; flex-wrap: wrap; gap: 8px 16px; color: var(--color-text-300); font-size: 13px; margin-top: 20px; }
button { border: 1px solid var(--color-card-border); border-radius: 8px; padding: 10px 16px; min-height: 44px; background: var(--space-navy); color: var(--color-text-400); }
button:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
button:disabled { opacity: .5; }
.atlas-story-detail { margin-top: 20px; color: var(--color-cyan-400); }
.atlas-story-navigation { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--color-card-border); }
.atlas-story-navigation span { font-size: 13px; color: var(--color-text-300); }
@media(max-width:840px) { .atlas-story { padding: 20px; } .atlas-story-io,.atlas-story-branches { grid-template-columns: minmax(0,1fr); } }
@media(max-width:400px) { .atlas-story { padding: 16px; } .atlas-story-navigation { gap: 8px; } .atlas-story-navigation button { padding: 8px 10px; } }
</style>
