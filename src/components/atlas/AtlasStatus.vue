<script setup lang="ts">
import { computed } from "vue";
import type { AtlasPracticeState, AtlasEvidenceState } from "../../types/atlas";
const props = defineProps<{ state: AtlasPracticeState | AtlasEvidenceState; control?: boolean }>();
const label = computed(() => ({ reported: props.control ? "Reported control" : "Reported practice", proposed: "Proposed", develop: "In development", "to-locate": "Evidence to locate", located: "Evidence located" }[props.state]));
</script>
<template><span class="atlas-status" :class="`atlas-status--${state}`">{{ label }}</span></template>
<style scoped>
.atlas-status { display: inline-block; border: 1px solid var(--color-card-border); border-radius: 6px; padding: 3px 7px; font-size: 12px; line-height: 1.3; color: var(--color-text-300); background: var(--space-navy); }
.atlas-status--proposed,.atlas-status--develop { color: var(--color-orange-400); }
.atlas-status--to-locate { border-style: dashed; }
</style>
