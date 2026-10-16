<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useLinks } from '../composables/useLinks';
import { useLocale } from '../i18n';
import { crew } from '../data/crew';
import { messages as crewMessages } from '../i18n/messages/crew';
import { messages as shellMessages } from '../i18n/messages/shell';
import { matchesSearch } from '../services/search';
import { getLinkDestination } from '../services/linkSafety';
import { containDialogFocus } from '../services/focusScope';
import Icon from './Icon.vue';

const { links, paletteOpen, openSector, openCrew, openAtlas, openStart, openMember, source, isLoading } = useLinks();
const { t, locale } = useLocale();
const query = ref('');
const scope = ref('all');
const activeIndex = ref(0);
const dialog = ref<HTMLDialogElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const list = ref<HTMLElement | null>(null);
type SearchResult = { id: string; label: string; detail: string; kind: string; disabled?: boolean; hint?: string; run: () => void };
const results = computed<SearchResult[]>(() => {
  const q = query.value.trim();
  const items: SearchResult[] = [];
  if (!q && scope.value === 'all') items.push(
    { id: 'start', kind: 'shortcuts', label: t('shell.start'), detail: t('shell.startSubtitle'), run: openStart },
    { id: 'directory', kind: 'shortcuts', label: t('shell.directory'), detail: t('shell.findAsset'), run: () => openSector('all') },
    { id: 'team', kind: 'shortcuts', label: t('shell.crew'), detail: t('shell.ownershipTitle'), run: openCrew },
  );
  if (scope.value === 'all' || scope.value === 'process') {
    for (const id of ['01','02','03','04','05','06','07','08'] as const) {
      if (!matchesSearch(q, [shellMessages.en.shell.chapterTitles[id], shellMessages.vi.shell.chapterTitles[id], id, 'process quy trình'])) continue;
      items.push({ id: 'stage-' + id, kind: 'process', label: id + ' · ' + t('shell.chapterTitles.' + id), detail: t('shell.atlas'), run: () => openAtlas(id) });
      if (!q && items.filter(item => item.kind === 'process').length >= 3) break;
    }
  }
  if (scope.value === 'all' || scope.value === 'assets') {
    let count = 0;
    for (const link of links.value) {
      if (!matchesSearch(q, [link.title, link.description, link.owner, link.category, link.country, ...link.tags])) continue;
      const destination = getLinkDestination(link);
      items.push({ id: 'asset-' + link.id, kind: 'assets', label: link.title, detail: [link.country, link.owner].filter(Boolean).join(' · '), disabled: !destination.href,
        hint: destination.reason ? t(destination.reason) : undefined,
        run: () => { if (destination.href) window.open(destination.href, '_blank', 'noopener,noreferrer'); } });
      if (++count >= (q ? 8 : 3)) break;
    }
  }
  if (scope.value === 'all' || scope.value === 'people') {
    let count = 0;
    for (const member of crew.filter(item => item.active !== false)) {
      const profile = member.profileKey as keyof typeof crewMessages.en.crew.profiles;
      const en = crewMessages.en.crew.profiles[profile], vi = crewMessages.vi.crew.profiles[profile];
      if (!matchesSearch(q, [member.name, ...(member.aliases || []), member.market, member.role, en.role, vi.role, en.summary, vi.summary])) continue;
      items.push({ id: 'person-' + member.id, kind: 'people', label: member.name, detail: (locale.value === 'vi' ? vi : en).role + ' · ' + member.market, run: () => openMember(member) });
      if (++count >= (q ? 6 : 3)) break;
    }
  }
  return items;
});
watch([query, scope], () => activeIndex.value = Math.max(0, results.value.findIndex(item => !item.disabled)));
watch(results, next => {
  if (!next[activeIndex.value] || next[activeIndex.value].disabled) activeIndex.value = Math.max(0, next.findIndex(item => !item.disabled));
});
const sourceLabel = computed(() => t(source.value === 'live' ? 'shell.sourceLive' : source.value === 'stale' ? 'shell.sourceStale' : source.value === 'mock' ? 'shell.sourceDemo' : isLoading.value ? 'shell.sourceLoading' : 'shell.sourceUnavailable'));
function close() { paletteOpen.value = false; }
function onClosed() { paletteOpen.value = false; query.value = ''; }
function activate(item: SearchResult) { if (!item.disabled) { close(); item.run(); } }
function navigate(direction: number) {
  let next = activeIndex.value;
  for (let i = 0; i < results.value.length; i++) {
    next = (next + direction + results.value.length) % results.value.length;
    if (!results.value[next].disabled) { activeIndex.value = next; break; }
  }
  nextTick(() => list.value?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }));
}
function keydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault(); paletteOpen.value = !paletteOpen.value; return;
  }
  if (!paletteOpen.value || !dialog.value?.contains(event.target as Node)) return;
  containDialogFocus(event, dialog.value);
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); navigate(event.key === 'ArrowDown' ? 1 : -1); }
  if (event.key === 'Enter' && event.target === input.value) { event.preventDefault(); const item = results.value[activeIndex.value]; if (item) activate(item); }
}
watch(paletteOpen, async open => {
  await nextTick();
  if (!dialog.value) return;
  if (open && !dialog.value.open) { dialog.value.showModal(); input.value?.focus({ preventScroll: true }); }
  else if (!open && dialog.value.open) dialog.value.close();
}, { flush: 'post' });
onMounted(() => document.addEventListener('keydown', keydown));
onBeforeUnmount(() => { document.removeEventListener('keydown', keydown); dialog.value?.close(); });
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="palette" :aria-label="t('shell.searchLabel')" @close="onClosed" @cancel="close" @click="($event.target === dialog) && close()">
      <div class="palette__heading"><Icon name="search" :size="20" /><input ref="input" v-model="query" type="search" maxlength="200" :placeholder="t('shell.searchPlaceholder')" :aria-label="t('shell.searchLabel')" autocomplete="off" aria-controls="hub-search-results"><button type="button" class="vph-icon-button" :aria-label="t('shell.close')" @click="close"><Icon name="close" :size="18" /></button></div>
      <div class="palette__scopes" role="group" :aria-label="t('shell.searchScope')"><button v-for="kind in ['all','assets','process','people']" :key="kind" type="button" :aria-pressed="scope === kind" @click="scope = kind">{{ t('shell.' + kind) }}</button></div>
      <div id="hub-search-results" ref="list" class="palette__results">
        <p class="visually-hidden" aria-live="polite" role="status">{{ results[activeIndex]?.label }}</p>
        <p v-if="!results.length" class="palette__empty" role="status">{{ t('shell.noResults') }}</p>
        <template v-for="(item, index) in results" :key="item.id"><p v-if="index === 0 || results[index-1].kind !== item.kind" class="palette__group">{{ t('shell.' + item.kind) }}</p><button type="button" class="palette__item" :disabled="item.disabled" :data-active="activeIndex === index" @pointerenter="activeIndex = index" @focus="activeIndex = index" @click="activate(item)"><span><strong>{{ item.label }}</strong><small>{{ item.detail }}</small><small v-if="item.hint" class="palette__hint">{{ item.hint }}</small></span><Icon :name="item.disabled ? 'shield' : 'arrowRight'" :size="16" /></button></template>
      </div>
      <footer class="palette__footer"><span>↑ ↓ {{ t('shell.navigate') }} · ↵ {{ t('shell.open') }}</span><span :title="t('shell.sourceNote')">{{ sourceLabel }}</span></footer>
    </dialog>
  </Teleport>
</template>
<style scoped>
.palette { position: fixed; inset: min(10vh,80px) 0 auto; margin-inline: auto; width: min(640px,calc(100vw - 24px)); max-height: calc(100dvh - 48px); padding: 0; overflow: hidden; border: 1px solid var(--color-card-border-hover); border-radius: var(--radius-lg); background: var(--space-navy); color: var(--color-text-400); box-shadow: 0 24px 80px rgba(7,3,17,.6); }
.palette[open] { display: flex; flex-direction: column; }
.palette::backdrop { background: rgba(7,3,17,.76); backdrop-filter: blur(3px); }
.palette__heading { display: flex; gap: 12px; align-items: center; padding: 14px 12px 14px 20px; flex: none; border-bottom: 1px solid var(--color-card-border); color: var(--color-text-300); }
.palette__heading input { flex: 1; min-width: 0; min-height: 44px; background: transparent; border: 0; font-size: 16px; color: var(--color-text-400); }
.palette__heading input::placeholder { color: var(--color-text-200); }
.palette__scopes { display: flex; gap: 6px; overflow-x: auto; padding: 12px 16px; flex: none; }
.palette__scopes button { min-height: 40px; padding: 8px 12px; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--color-text-300); white-space: nowrap; font-size: 13px; }
.palette__scopes button[aria-pressed=true] { background: var(--color-beige-700); border-color: var(--color-card-border); color: var(--color-text-400); }
.palette__results { min-height: 0; overflow-y: auto; padding: 0 12px 12px; }
.palette__group { padding: 12px 10px 8px; font-size: 11px; letter-spacing: .04em; color: var(--color-text-200); }
.palette__item { display: flex; width: 100%; align-items: center; gap: 14px; padding: 12px; min-height: 56px; border: 1px solid transparent; border-radius: 8px; text-align: start; color: var(--color-text-400); background: transparent; }
.palette__item > span { flex: 1; min-width: 0; }
.palette__item strong { display: block; font-size: 15px; font-weight: 550; overflow-wrap: anywhere; }
.palette__item small { display: block; color: var(--color-text-300); margin-top: 4px; font-size: 12px; line-height: 1.5; }
.palette__item[data-active=true]:not(:disabled) { border-color: var(--color-card-border); background: var(--color-beige-500); }
.palette__item:disabled { opacity: .65; }
.palette__item .palette__hint { color: var(--color-orange-400); }
.palette__empty { padding: 28px 14px; color: var(--color-text-300); line-height: 1.6; }
.palette__footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; flex: none; border-top: 1px solid var(--color-card-border); padding: 12px 20px; font-size: 11px; color: var(--color-text-200); }
@media(max-width:540px) { .palette { inset: 12px 0 auto; max-height: calc(100dvh - 24px); } .palette__heading { padding-left: 14px; gap: 8px; } .palette__heading > svg { display: none; } .palette__scopes { padding-inline: 10px; } }
</style>
