<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CrewMember } from '../data/crew';
import type { FleetPoint } from '../services/fleetMotion';
import { useLinks } from '../composables/useLinks';
import { useLocale } from '../i18n';
import CrewSourceNotice from './CrewSourceNotice.vue';
import MemberPortfolio from './MemberPortfolio.vue';
import Icon from './Icon.vue';

const props = defineProps<{ member: CrewMember; anchor?: FleetPoint }>();
const emit = defineEmits<{ close: [] }>();
const { memberScope, source, isLoading } = useLinks();
const { t, text } = useLocale();
const panel = ref<HTMLElement | null>(null), closeButton = ref<HTMLButtonElement | null>(null);
const scope = computed(() => memberScope(props.member));
const emptyTitle = computed(() => isLoading.value ? 'loading' : source.value === 'stale' ? 'staleEmptyTitle' : source.value === 'live' ? 'emptyTitle' : 'unavailableTitle');
const emptyBody = computed(() => source.value === 'stale' ? 'staleEmptyBody' : source.value === 'live' ? 'emptyBody' : source.value === 'mock' ? 'demoEmpty' : 'unavailableBody');
let trigger: HTMLElement | null = null;
function focusPanel() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && !panel.value?.contains(active)) trigger = active;
  void nextTick(() => closeButton.value?.focus({ preventScroll: true }));
}
function close() { emit('close'); }
function keydown(event: KeyboardEvent) {
  // Inspector inputs own their shortcuts; the fixed galaxy must not navigate underneath.
  event.stopPropagation();
  if (event.key === 'Escape') { event.preventDefault(); close(); return; }
  if (event.key !== 'Tab' || !panel.value) return;
  const items = [...panel.value.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]')].filter(element => !element.matches(':disabled') && element.tabIndex >= 0 && element.getClientRects().length);
  const first = items[0], last = items.at(-1);
  if (event.shiftKey && event.target === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
  else if (!event.shiftKey && event.target === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
}
watch(() => props.member.id, focusPanel);
onMounted(focusPanel);
onBeforeUnmount(() => { if (trigger?.isConnected && panel.value?.contains(document.activeElement)) trigger.focus({ preventScroll: true }); });
</script>

<template>
  <aside ref="panel" class="member-scope-panel" :class="{ 'member-scope-panel--left': anchor && anchor.x > 65 }" data-hub-inspector role="dialog" aria-modal="false" aria-labelledby="fleet-member-name" @keydown="keydown">
    <header class="scope-panel-header"><div><p class="mono">{{ text('VALUE PROTECTOR', 'VALUE PROTECTOR') }}</p><h2 id="fleet-member-name">{{ member.name }}</h2></div><button ref="closeButton" type="button" class="scope-panel-close" :aria-label="text('Close portfolio', 'Đóng danh mục phụ trách')" @click="close"><Icon name="close" :size="18" /></button></header>
    <div class="scope-panel-scroll vph-scroll" tabindex="0" :aria-label="text('Portfolio details', 'Chi tiết danh mục phụ trách')">
      <div class="scope-panel-intro"><p class="scope-panel-role">{{ t('crew.profiles.' + member.profileKey + '.role') }}</p><p>{{ t('crew.profiles.' + member.profileKey + '.summary') }}</p><div class="scope-panel-labels"><span>{{ t('crew.markets.' + (member.country || member.market)) }}</span><span>{{ t('crew.functions.' + member.function) }}</span></div></div>
      <CrewSourceNotice />
      <MemberPortfolio v-if="scope.length" :key="member.id" :rows="scope" :member-id="member.id" />
      <section v-else class="scope-panel-empty" :aria-busy="isLoading"><h3>{{ t('crew.member.' + emptyTitle) }}</h3><template v-if="!isLoading"><p>{{ t('crew.member.' + emptyBody) }}</p><p v-if="member.group === 'regional' && source === 'live'">{{ t('crew.member.emptyRegional') }}</p></template></section>
      <p class="scope-panel-boundary">{{ t('crew.boundary') }}</p>
    </div>
  </aside>
</template>

<style scoped>
.member-scope-panel { position:absolute; z-index:30; top:16px; right:16px; bottom:16px; width:min(440px,calc(100% - 32px)); display:flex; flex-direction:column; min-height:0; overflow:hidden; border:1px solid var(--color-card-border-hover); border-radius:12px; background:color-mix(in srgb,var(--space-deep) 94%,transparent); box-shadow:0 16px 60px #0007; backdrop-filter:blur(18px); }
.member-scope-panel--left { right:auto; left:16px; }
.scope-panel-header { flex:none; display:flex; justify-content:space-between; gap:16px; align-items:flex-start; padding:16px 20px; border-bottom:1px solid var(--color-card-border); background:color-mix(in srgb,var(--space-navy) 80%,transparent); }
.scope-panel-header p { color:var(--color-cyan-400); font-size:10px; letter-spacing:.13em; }
.scope-panel-header h2 { margin-top:6px; font-size:24px; font-weight:500; line-height:1.25; color:var(--color-text-400); }
.scope-panel-close { display:grid; place-items:center; flex:none; width:44px; height:44px; border:1px solid var(--color-card-border); border-radius:8px; color:var(--color-text-400); background:var(--space-navy); cursor:pointer; }
.scope-panel-close:hover { border-color:var(--color-cyan-400); }
.scope-panel-close:focus-visible,.scope-panel-scroll:focus-visible { outline:2px solid var(--color-orange-400); outline-offset:-3px; }
.scope-panel-scroll { flex:1; min-height:0; overflow:auto; overscroll-behavior:contain; padding:20px; scrollbar-gutter:stable; }
.scope-panel-intro>p { font-size:13px; line-height:1.65; color:var(--color-text-300); }
.scope-panel-intro>.scope-panel-role { color:var(--color-text-400); font-weight:500; font-size:14px; margin-bottom:8px; }
.scope-panel-labels { display:flex; flex-wrap:wrap; gap:6px; margin:12px 0 20px; }
.scope-panel-labels span { padding:4px 8px; border:1px solid var(--color-card-border); border-radius:4px; color:var(--color-text-300); font-size:11px; }
.scope-panel-empty { margin-top:20px; padding:16px; border:1px solid var(--color-card-border); border-radius:8px; background:var(--space-navy); }
.scope-panel-empty h3 { font-size:15px; font-weight:500; line-height:1.5; }
.scope-panel-empty p,.scope-panel-boundary { color:var(--color-text-300); font-size:12px; line-height:1.65; margin-top:12px; }
.scope-panel-boundary { margin-top:24px; padding-top:16px; border-top:1px solid var(--color-card-border); }
.member-scope-panel :deep(.portfolio) { margin-top:20px; }
.member-scope-panel :deep(.portfolio>header h2) { font-size:19px; }
.member-scope-panel :deep(.portfolio-summary) { margin-top:16px; }
.member-scope-panel :deep(.portfolio-summary>div) { padding:12px 8px; }
.member-scope-panel :deep(.portfolio-summary dd) { font-size:22px; }
.member-scope-panel :deep(.portfolio-filters) { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:16px; }
.member-scope-panel :deep(.portfolio-search) { grid-column:1/-1; }
.member-scope-panel :deep(.portfolio-table) { font-size:12px; }
.member-scope-panel :deep(.portfolio-table th),.member-scope-panel :deep(.portfolio-table td) { padding:10px 8px; }
@media(max-width:640px) { .member-scope-panel,.member-scope-panel--left { top:auto; left:8px; right:8px; bottom:8px; width:auto; height:min(78%,600px); } .scope-panel-header { padding:12px 16px; } .scope-panel-scroll { padding:16px; } }
@media(prefers-reduced-transparency:reduce) { .member-scope-panel { background:var(--space-deep); backdrop-filter:none; } }
</style>
