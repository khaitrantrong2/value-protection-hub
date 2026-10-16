<script setup lang="ts">
import { computed, ref } from "vue";
import type { LinkItem } from "../types/links";
import { getLinkDestination } from "../services/linkSafety";
import { useLocale } from "../i18n";
import Icon from "./Icon.vue";
import VaultLinkActions from "./VaultLinkActions.vue";
const props = defineProps<{ link: LinkItem; accent: string; icon: string; compact?: boolean }>();
const { t } = useLocale();
const destination = computed(() => getLinkDestination(props.link));
const expanded = ref(false);
</script>

<template>
  <article class="vault" :class="{ 'vault--compact': compact }" :style="{ '--accent': accent }">
    <header class="vault__head"><span class="vault__icon" aria-hidden="true"><Icon :name="icon" :size="18" /></span><h2 class="vault__title">{{ link.title }}</h2><span class="vault__status" :class="`vault__status--${link.status.toLowerCase()}`">{{ t(`directory.statusValues.${link.status}`) }}</span></header>
    <div class="vault__body">
      <p class="vault__desc" :class="{ 'is-expanded': expanded }">{{ link.description || '—' }}</p>
      <dl class="vault__meta"><div><dt>{{ t('directory.owner') }}</dt><dd>{{ link.owner || t('directory.unassigned') }}</dd></div><div><dt>{{ t('directory.country') }}</dt><dd>{{ link.country === 'Regional' ? t('directory.region') : link.country || t('directory.unassigned') }}</dd></div><div><dt>{{ t('directory.criticality') }}</dt><dd :class="`vault__crit--${link.criticality.toLowerCase()}`">{{ t(`directory.criticalityValues.${link.criticality}`) }}</dd></div></dl>
      <ul v-if="link.tags.length" class="vault__tags"><li v-for="tag in (expanded ? link.tags : link.tags.slice(0, 3))" :key="tag">{{ tag }}</li><li v-if="!expanded && link.tags.length > 3">+{{ link.tags.length - 3 }}</li></ul>
      <p v-if="link.accessNote" class="vault__note"><Icon name="shield" :size="14" /><span>{{ t('directory.access') }}: {{ link.accessNote }}</span></p>
      <p v-if="destination.reason" class="vault__note" :class="{ 'vault__note--warning': !destination.href }">{{ t(destination.reason) }}</p>
    </div>
    <footer class="vault__actions"><VaultLinkActions :link="link" /><button class="vault__details" type="button" :aria-expanded="expanded" @click="expanded = !expanded">{{ t(expanded ? 'directory.less' : 'directory.more') }}</button></footer>
  </article>
</template>

<style lang="scss" scoped>
.vault { min-width: 0; display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid var(--color-card-border); border-top: 2px solid var(--accent); border-radius: var(--radius-md); background: var(--color-card-bg); transition: border-color .18s, background .18s; }
.vault:hover { border-color: var(--color-card-border-hover); background: var(--color-card-bg-hover); }
.vault__head { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
.vault__icon { color: var(--accent); flex: none; padding-top: 2px; }
.vault__title { flex: 1; min-width: 100px; font-size: 14px; line-height: 1.4; font-weight: 650; overflow-wrap: anywhere; }
.vault__status { flex: none; font-size: 11px; line-height: 1.5; padding: 3px 8px; border-radius: 5px; border: 1px solid var(--color-card-border); color: var(--color-text-300); background: var(--color-beige-600); }
.vault__status--blocked { color: var(--color-orange-400); border-color: var(--color-orange-400); }
.vault__status--review { color: var(--color-yellow-400, #f5c542); }
.vault__body { display: flex; flex-direction: column; gap: 9px; flex: 1; min-width: 0; }
.vault__desc { color: var(--color-text-300); font-size: 13px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.vault__desc.is-expanded { display: block; }
.vault__meta { display: flex; flex-wrap: wrap; gap: 5px 12px; }
.vault__meta div { display: inline-flex; gap: 4px; align-items: baseline; max-width: 100%; min-width: 0; }
.vault__meta dt { color: var(--color-text-200); font-size: 10px; }
.vault__meta dt::after { content: ':'; }
.vault__meta dd { color: var(--color-text-400); font-size: 11px; line-height: 1.45; overflow-wrap: anywhere; min-width: 0; }
.vault__meta dd.vault__crit--high { color: var(--color-orange-400); }
.vault__tags { display: flex; flex-wrap: wrap; gap: 5px; }
.vault__tags li { font-size: 10px; color: var(--color-text-300); padding: 2px 6px; border-radius: 4px; background: var(--color-beige-600); overflow-wrap: anywhere; }
.vault__note { display: flex; align-items: flex-start; gap: 6px; font-size: 11px; line-height: 1.5; color: var(--color-text-200); overflow-wrap: anywhere; }
.vault__note :deep(svg) { flex: none; margin-top: 2px; }
.vault__note--warning { color: var(--color-orange-400); }
.vault__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: auto; padding-top: 9px; border-top: 1px solid var(--color-card-border); }
.vault__details { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; border-radius: 5px; font-size: 11px; line-height: 1.4; padding: 6px 0; color: var(--color-text-300); border: 0; background: transparent; cursor: pointer; margin-left: auto; }
.vault--compact { gap: 10px; padding: 16px 20px; }
.vault--compact .vault__body { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: start; column-gap: 24px; }
.vault--compact .vault__desc { -webkit-line-clamp: 2; line-clamp: 2; }
.vault--compact .vault__tags,.vault--compact .vault__note { grid-column: 1 / -1; }
@media(max-width:540px) { .vault,.vault--compact { padding: 14px; } .vault--compact .vault__body { display: flex; } .vault__details { min-height: 44px; margin-left: auto; } }
</style>
