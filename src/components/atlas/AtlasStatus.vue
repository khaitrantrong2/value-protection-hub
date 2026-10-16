<script setup lang="ts">
import { computed } from "vue";
import { useLocale } from "../../i18n";
import type { AtlasPracticeState, AtlasEvidenceState } from "../../types/atlas";
const { t } = useLocale();
const props = defineProps<{ state: AtlasPracticeState | AtlasEvidenceState; control?: boolean; compact?: boolean }>();
const label = computed(() => ({ reported: t(props.compact ? "atlas.reported" : props.control ? "atlas.reportedControl" : "atlas.reportedPractice"), proposed: t("atlas.proposed"), develop: t(props.compact ? "atlas.developing" : "atlas.inDevelopment"), "to-locate": t("atlas.evidenceToLocate"), located: t("atlas.evidenceLocated") }[props.state]));
</script>
<template><span v-if="state !== 'to-locate'" class="atlas-status" :class="[`atlas-status--${state}`, { 'is-compact': compact }]">{{ label }}</span></template>
<style scoped>
.atlas-status { display: inline-block; border: 1px solid var(--color-card-border); border-radius: 6px; padding: 3px 7px; font-size: 12px; line-height: 1.3; color: var(--color-text-300); background: var(--space-navy); }
.atlas-status--proposed,.atlas-status--develop { color: var(--color-orange-400); }
.atlas-status.is-compact { font-size: 9px; line-height: 1.25; padding: 1px 4px; white-space: nowrap; border-radius: 3px; }
</style>
