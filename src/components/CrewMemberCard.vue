<script setup lang="ts">
import type { CrewMember } from "../data/crew";
import { useLocale } from "../i18n";
import Icon from "./Icon.vue";
defineProps<{ member: CrewMember; scopeCount?: number }>();
defineEmits<{ open: [member: CrewMember] }>();
const { t } = useLocale();
</script>

<template>
  <button type="button" class="teammate" :style="{ '--member-accent': member.accent }" :data-crew-member="member.id" @click="$emit('open', member)">
    <span class="teammate__identity"><span class="teammate__avatar" aria-hidden="true">{{ member.name.charAt(0) }}</span><span><strong>{{ member.name }}</strong><span class="teammate__market">{{ t(`crew.markets.${member.country || member.market}`) }}</span></span></span>
    <span class="teammate__role">{{ t(`crew.profiles.${member.profileKey}.role`) }}</span>
    <span class="teammate__summary">{{ t(`crew.profiles.${member.profileKey}.summary`) }}</span>
    <span class="teammate__footer"><span>{{ scopeCount !== undefined && scopeCount > 0 ? t('crew.scopeRows', { count: scopeCount }) : t(`crew.functions.${member.function}`) }}</span><Icon name="arrowRight" :size="17" /><span class="sr-only">{{ t('crew.openProfile') }}</span></span>
  </button>
</template>

<style scoped>
.teammate { display: flex; flex-direction: column; align-items: stretch; text-align: left; gap: 12px; min-width: 0; min-height: 232px; width: 100%; padding: 20px; border: 1px solid var(--color-card-border); border-radius: var(--radius-md); background: var(--space-navy); color: var(--color-text-400); font: inherit; cursor: pointer; transition: border-color .18s,background .18s,transform .18s; }
.teammate:hover { border-color: var(--color-card-border-hover); background: var(--color-command-bg-soft); transform: translateY(-2px); }
.teammate:active { transform: translateY(0); }
.teammate:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 3px; }
.teammate__identity { display: flex; align-items: center; gap: 12px; }
.teammate__avatar { flex: none; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: color-mix(in srgb,var(--member-accent) 10%,var(--space-deep)); border: 1px solid color-mix(in srgb,var(--member-accent) 35%,var(--color-card-border)); font-size: 20px; font-weight: 500; }
.teammate__identity strong { display: block; font-size: 19px; line-height: 1.3; font-weight: 500; overflow-wrap: anywhere; }
.teammate__market { display: block; font-size: 12px; margin-top: 4px; color: var(--color-text-300); }
.teammate__role { font-size: 13px; font-weight: 500; line-height: 1.5; }
.teammate__summary { font-size: 13px; line-height: 1.65; color: var(--color-text-300); }
.teammate__footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--color-card-border); font-size: 11px; line-height: 1.5; color: var(--color-cyan-400); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media(prefers-reduced-motion:reduce) { .teammate { transition: none; } .teammate:hover { transform: none; } }
@media(max-width:540px) { .teammate { min-height: 0; padding: 16px; gap: 12px; } }
</style>
