<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import type { LinkItem } from "../types/links";
import { getLinkDestination } from "../services/linkSafety";
import { useLocale } from "../i18n";
import Icon from "./Icon.vue";
const props = defineProps<{ link: LinkItem; accent: string; icon: string; compact?: boolean }>();
const { t } = useLocale();
const destination = computed(() => getLinkDestination(props.link));
const expanded = ref(false);
const copyState = ref<"idle" | "copied" | "failed">("idle");
let copyTimer: ReturnType<typeof setTimeout> | undefined;
async function copyLink() {
  if (!destination.value.href) return;
  try { await navigator.clipboard.writeText(destination.value.href); copyState.value = "copied"; }
  catch { copyState.value = "failed"; }
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => copyState.value = "idle", 3000);
}
onBeforeUnmount(() => { if (copyTimer) clearTimeout(copyTimer); });
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
    <footer class="vault__actions"><a v-if="destination.href" class="vault__open" :href="destination.href" target="_blank" rel="noopener noreferrer" :aria-label="t('directory.openNamed', { title: link.title })">{{ t('directory.open') }}<Icon name="external" :size="14" /></a><span v-else class="vault__disabled" aria-disabled="true">{{ t('directory.noDestination') }}</span><button v-if="destination.href" class="vault__copy" type="button" :aria-label="t('directory.copyNamed', { title: link.title })" @click="copyLink"><Icon name="copy" :size="15" /><span>{{ t(copyState === 'copied' ? 'directory.copied' : 'directory.copy') }}</span></button><button class="vault__details" type="button" :aria-expanded="expanded" @click="expanded = !expanded">{{ t(expanded ? 'directory.less' : 'directory.more') }}</button></footer>
    <p v-if="copyState !== 'idle'" class="vault__feedback" role="status">{{ t(copyState === 'copied' ? 'directory.copied' : 'directory.copyFailed') }}</p>
  </article>
</template>

<style lang="scss" scoped>
.vault { min-width: 0; display: flex; flex-direction: column; gap: 16px; padding: 20px; border: 1px solid var(--color-card-border); border-top: 2px solid var(--accent); border-radius: var(--radius-md); background: var(--color-card-bg); transition: border-color .18s, background .18s; }
.vault:hover { border-color: var(--color-card-border-hover); background: var(--color-card-bg-hover); }
.vault__head { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
.vault__icon { color: var(--accent); flex: none; padding-top: 2px; }
.vault__title { flex: 1; min-width: 100px; font-size: 16px; line-height: 1.4; font-weight: 650; overflow-wrap: anywhere; }
.vault__status { flex: none; font-size: 11px; line-height: 1.5; padding: 3px 8px; border-radius: 5px; border: 1px solid var(--color-card-border); color: var(--color-text-300); background: var(--color-beige-600); }
.vault__status--blocked { color: var(--color-orange-400); border-color: var(--color-orange-400); }
.vault__status--review { color: var(--color-yellow-400, #f5c542); }
.vault__body { display: flex; flex-direction: column; gap: 14px; flex: 1; min-width: 0; }
.vault__desc { color: var(--color-text-300); font-size: 14px; line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.vault__desc.is-expanded { display: block; }
.vault__meta { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
.vault__meta dt { color: var(--color-text-200); font-size: 11px; margin-bottom: 4px; }
.vault__meta dd { color: var(--color-text-400); font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
.vault__meta dd.vault__crit--high { color: var(--color-orange-400); }
.vault__tags { display: flex; flex-wrap: wrap; gap: 5px; }
.vault__tags li { font-size: 11px; color: var(--color-text-300); padding: 3px 7px; border-radius: 4px; background: var(--color-beige-600); overflow-wrap: anywhere; }
.vault__note { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; line-height: 1.55; color: var(--color-text-200); overflow-wrap: anywhere; }
.vault__note :deep(svg) { flex: none; margin-top: 2px; }
.vault__note--warning { color: var(--color-orange-400); }
.vault__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--color-card-border); }
.vault__open,.vault__copy,.vault__details,.vault__disabled { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; border-radius: 6px; font-size: 12px; line-height: 1.4; padding: 8px 10px; }
.vault__open { background: var(--grad-cta); color: white; }
.vault__copy,.vault__details { color: var(--color-text-300); border: 1px solid var(--color-card-border); background: transparent; cursor: pointer; }
.vault__details { margin-left: auto; }
.vault__disabled { color: var(--color-text-200); border: 1px dashed var(--color-card-border); }
.vault__feedback { font-size: 12px; line-height: 1.5; color: var(--color-text-300); }
.vault--compact { gap: 10px; padding: 16px 20px; }
.vault--compact .vault__body { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: start; column-gap: 24px; }
.vault--compact .vault__desc { -webkit-line-clamp: 2; line-clamp: 2; }
.vault--compact .vault__tags,.vault--compact .vault__note { grid-column: 1 / -1; }
@media(max-width:540px) { .vault,.vault--compact { padding: 16px; } .vault--compact .vault__body { display: flex; } .vault__actions>* { min-height: 44px; } .vault__details { margin-left: 0; } }
</style>
