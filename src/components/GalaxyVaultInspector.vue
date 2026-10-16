<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { DirectorySource, LinkItem } from '../types/links';
import type { VaultPlanet } from '../data/galaxy';
import { vaultOwners } from '../data/galaxy';
import { getLinkDestination } from '../services/linkSafety';
import { useLocale } from '../i18n';
import Icon from './Icon.vue';

const props = defineProps<{ planet: VaultPlanet; resources: LinkItem[]; source: DirectorySource | null; loading: boolean }>();
const emit = defineEmits<{ close: []; open: [] }>();
const { locale, text, t } = useLocale();
const closeButton = ref<HTMLButtonElement | null>(null);
const owners = computed(() => vaultOwners(props.resources));
const rows = computed(() => props.resources.map(link => ({ link, destination: getLinkDestination(link) })));
const sourceLabel = computed(() => t(props.source === 'live' ? 'shell.sourceLive' : props.source === 'stale' ? 'shell.sourceStale' : props.source === 'mock' ? 'shell.sourceDemo' : props.source === 'unavailable' ? 'shell.sourceUnavailable' : 'shell.sourceLoading'));
const feedback = ref('');
let copyTimer: ReturnType<typeof setTimeout> | undefined;
async function copy(href: string) {
  try { await navigator.clipboard.writeText(href); feedback.value = t('directory.copied'); }
  catch { feedback.value = t('directory.copyFailed'); }
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { feedback.value = ''; }, 3000);
}
onBeforeUnmount(() => { if (copyTimer) clearTimeout(copyTimer); });
onMounted(() => { void nextTick(() => closeButton.value?.focus({ preventScroll: true })); });
</script>

<template>
  <aside class="galaxy-vault" data-hub-inspector :aria-label="text('Vault scope', 'Phạm vi vault')" @keydown.stop @keydown.esc.prevent="emit('close')">
    <header class="galaxy-vault__head"><span class="galaxy-vault__eyebrow">{{ text('RESOURCE PLANET', 'HÀNH TINH TÀI NGUYÊN') }}</span><button ref="closeButton" type="button" class="galaxy-vault__close" :aria-label="t('shell.close')" @click="emit('close')"><Icon name="close" :size="18" /></button></header>
    <div class="galaxy-vault__body vph-scroll" tabindex="0">
      <h2>{{ t('shell.categories.' + planet.id) }}</h2>
      <p class="galaxy-vault__scope">{{ planet.scope[locale] }}</p>
      <p class="galaxy-vault__source" role="status">{{ sourceLabel }}</p>
      <section><h3>{{ text('Published resource owners', 'Người phụ trách theo nguồn') }}</h3><p>{{ owners.length ? owners.join(' · ') : source === 'unavailable' || loading ? text('Owner information unavailable.', 'Chưa tải được thông tin người phụ trách.') : text('No owner published for this vault.', 'Chưa có người phụ trách được công bố cho vault này.') }}</p></section>
      <section>
        <h3>{{ text('Resources', 'Tài nguyên') }} <span v-if="source && source !== 'unavailable'">{{ resources.length }}</span></h3>
        <p v-if="loading && !resources.length" role="status">{{ text('Loading source…', 'Đang tải nguồn…') }}</p>
        <p v-else-if="!resources.length">{{ source === 'unavailable' ? text('Source unavailable. An empty view does not establish that this vault has no resources.', 'Không tải được nguồn. Màn hình trống không có nghĩa vault không có tài nguyên.') : text('No active resource published in the current source.', 'Chưa có tài nguyên đang sử dụng được công bố trong nguồn hiện tại.') }}</p>
        <ul v-else class="galaxy-vault__resources">
          <li v-for="{ link, destination } in rows" :key="link.id">
            <div class="galaxy-vault__resource-head"><h4>{{ link.title }}</h4><span>{{ t('directory.statusValues.' + link.status) }}</span></div>
            <p v-if="link.description" class="galaxy-vault__description">{{ link.description }}</p>
            <p class="galaxy-vault__meta">{{ link.country || '—' }} · {{ link.owner || t('directory.unassigned') }}</p>
            <p v-if="link.accessNote" class="galaxy-vault__access">{{ t('directory.access') }}: {{ link.accessNote }}</p>
            <p v-if="destination.reason" class="galaxy-vault__access">{{ t(destination.reason) }}</p>
            <div class="galaxy-vault__actions"><template v-if="destination.href"><a :href="destination.href" target="_blank" rel="noopener noreferrer" :aria-label="t('directory.openNamed', { title: link.title })">{{ t('directory.open') }}<Icon name="external" :size="13" /></a><button type="button" :aria-label="t('directory.copyNamed', { title: link.title })" @click="copy(destination.href)"><Icon name="copy" :size="13" />{{ t('directory.copy') }}</button></template><span v-else>{{ t('directory.noDestination') }}</span></div>
          </li>
        </ul>
      </section>
    </div>
    <footer class="galaxy-vault__footer"><button class="galaxy-vault__open" type="button" @click="emit('open')">{{ text('Open vault library', 'Mở thư viện vault') }}<Icon name="arrowRight" :size="16" /></button><p v-if="feedback" role="status">{{ feedback }}</p><p v-else>{{ text('Owners reflect source entries, not new approval authority.', 'Người phụ trách theo dữ liệu nguồn, không tạo thêm thẩm quyền phê duyệt.') }}</p></footer>
  </aside>
</template>

<style scoped lang="scss">
.galaxy-vault { position:absolute; inset:12px 12px 12px auto; z-index:35; width:min(388px, calc(100% - 24px)); display:flex; flex-direction:column; overflow:hidden; border:1px solid rgba(198,174,241,.32); border-radius:14px; background:linear-gradient(145deg,rgba(31,22,55,.97),rgba(12,10,27,.97)); box-shadow:inset 0 1px rgba(255,255,255,.07),-18px 0 64px rgba(3,2,12,.35); backdrop-filter:blur(18px); }
.galaxy-vault__head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px 0 20px; }
.galaxy-vault__eyebrow { font-size:9px; letter-spacing:.16em; color:var(--color-cyan-400); }
.galaxy-vault__close { width:36px; height:36px; display:grid; place-items:center; flex:none; border:1px solid var(--color-card-border); border-radius:50%; background:transparent; color:var(--color-text-400); cursor:pointer; }
.galaxy-vault__body { flex:1; min-height:0; overflow-y:auto; overflow-x:hidden; overscroll-behavior:contain; scrollbar-gutter:stable; padding:8px 20px 16px; }
.galaxy-vault h2 { font-size:26px; line-height:1.15; letter-spacing:-.03em; margin:0 0 10px; }
.galaxy-vault__scope,.galaxy-vault section>p { font-size:13px; line-height:1.65; color:var(--color-text-300); }
.galaxy-vault__source { font-size:10px; line-height:1.5; color:var(--color-text-200); margin-top:10px; }
.galaxy-vault section { margin-top:22px; }
.galaxy-vault h3 { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; color:var(--color-text-200); margin:0 0 9px; }
.galaxy-vault h3 span { color:var(--color-text-400); border:1px solid var(--color-card-border); padding:1px 5px; border-radius:4px; }
.galaxy-vault__resources { display:flex; flex-direction:column; gap:0; }
.galaxy-vault__resources li { padding:13px 0; border-bottom:1px solid var(--color-card-border); }
.galaxy-vault__resource-head { display:flex; gap:8px; align-items:flex-start; }
.galaxy-vault h4 { flex:1; min-width:0; font-size:13px; line-height:1.45; font-weight:600; overflow-wrap:anywhere; }
.galaxy-vault__resource-head>span { font-size:9px; padding:2px 5px; border:1px solid var(--color-card-border); border-radius:4px; color:var(--color-text-200); }
.galaxy-vault__description { font-size:12px; line-height:1.55; color:var(--color-text-300); margin-top:5px; }
.galaxy-vault__meta,.galaxy-vault__access { font-size:11px; line-height:1.5; color:var(--color-text-200); margin-top:6px; overflow-wrap:anywhere; }
.galaxy-vault__actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
.galaxy-vault__actions>a,.galaxy-vault__actions>button { min-height:36px; display:inline-flex; align-items:center; gap:6px; padding:6px 9px; border:1px solid var(--color-card-border); border-radius:5px; background:transparent; color:var(--color-text-400); font-size:11px; cursor:pointer; }
.galaxy-vault__actions>span { font-size:11px; color:var(--color-text-200); }
.galaxy-vault__footer { border-top:1px solid var(--color-card-border); padding:12px 20px; }
.galaxy-vault__open { min-height:40px; display:flex; align-items:center; justify-content:space-between; gap:16px; width:100%; padding:8px 12px; border:1px solid rgba(196,167,255,.42); border-radius:6px; background:rgba(171,130,241,.15); color:var(--color-text-400); font-size:12px; cursor:pointer; }
.galaxy-vault__footer p { margin-top:8px; color:var(--color-text-200); font-size:10px; line-height:1.5; }
@media(max-width:640px) { .galaxy-vault { inset:auto 8px 8px; width:auto; height:min(78%,600px); }.galaxy-vault__close,.galaxy-vault__actions>a,.galaxy-vault__actions>button,.galaxy-vault__open { min-height:44px; }.galaxy-vault__close { width:44px; } }
@supports not (backdrop-filter:blur(18px)) { .galaxy-vault { background:#151024; } }
</style>
