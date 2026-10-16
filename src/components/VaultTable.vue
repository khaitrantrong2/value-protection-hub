<script setup lang="ts">
import { reactive } from "vue";
import type { LinkItem } from "../types/links";
import { getLinkDestination } from "../services/linkSafety";
import { useLocale } from "../i18n";
import VaultLinkActions from "./VaultLinkActions.vue";

defineProps<{ links: LinkItem[] }>();
const { t, text } = useLocale();
const expanded = reactive(new Set<string>());
function toggle(id: string) { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); }
</script>

<template>
  <table class="vault-table">
    <caption class="visually-hidden">{{ text('Vault resources. Expand a resource for its full description and tags.', 'Tài nguyên trong vault. Mở chi tiết để đọc đầy đủ mô tả và nhãn.') }}</caption>
    <thead><tr><th scope="col">{{ text('Title & description', 'Tên & mô tả') }}</th><th scope="col">{{ t('directory.country') }}</th><th scope="col">{{ t('directory.owner') }}</th><th scope="col">{{ t('directory.criticality') }}</th><th scope="col">{{ text('Tags', 'Nhãn') }}</th><th scope="col">{{ text('Quick actions', 'Thao tác nhanh') }}</th></tr></thead>
    <tbody>
      <tr v-for="link in links" :key="link.id" :class="{ 'is-expanded': expanded.has(link.id) }" :data-resource="link.id">
        <td class="vault-table__resource">
          <div class="vault-table__heading"><h2>{{ link.title }}</h2><span class="vault-table__status" :class="`is-${link.status.toLowerCase()}`">{{ t(`directory.statusValues.${link.status}`) }}</span><button type="button" class="vault-table__details" :aria-expanded="expanded.has(link.id)" :aria-label="`${t(expanded.has(link.id) ? 'directory.less' : 'directory.more')}: ${link.title}`" @click="toggle(link.id)"><span aria-hidden="true">{{ expanded.has(link.id) ? '−' : '+' }}</span></button></div>
          <p class="vault-table__description">{{ link.description || '—' }}</p>
          <p v-if="link.accessNote" class="vault-table__note">{{ t('directory.access') }}: {{ link.accessNote }}</p>
          <p v-if="getLinkDestination(link).reason" class="vault-table__warning">{{ t(getLinkDestination(link).reason!) }}</p>
        </td>
        <td class="vault-table__country" :data-label="t('directory.country')">{{ link.country === 'Regional' ? t('directory.region') : link.country || t('directory.unassigned') }}</td>
        <td class="vault-table__owner" :data-label="t('directory.owner')">{{ link.owner || t('directory.unassigned') }}</td>
        <td class="vault-table__priority" :data-label="t('directory.criticality')"><span :class="{ 'is-high': link.criticality === 'High' }">{{ t(`directory.criticalityValues.${link.criticality}`) }}</span></td>
        <td class="vault-table__tag-cell" :data-label="text('Tags', 'Nhãn')"><ul v-if="link.tags.length" class="vault-table__tags"><li v-for="tag in expanded.has(link.id) ? link.tags : link.tags.slice(0, 3)" :key="tag">{{ tag }}</li><li v-if="!expanded.has(link.id) && link.tags.length > 3">+{{ link.tags.length - 3 }}</li></ul><span v-else class="vault-table__empty">—</span></td>
        <td class="vault-table__actions" :data-label="text('Actions', 'Thao tác')"><VaultLinkActions :link="link" /></td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped lang="scss">
.vault-table { width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 0; font-size: 12px; text-align: left; color: var(--color-text-300); }
.vault-table thead { position: sticky; top: 0; z-index: 2; }
.vault-table th { padding: 12px 10px; color: var(--color-text-200); background: var(--space-navy); border-block: 1px solid var(--color-card-border); font-size: 11px; font-weight: 500; }
.vault-table th:first-child { width: 34%; padding-left: 14px; border-radius: 7px 0 0 0; }
.vault-table th:nth-child(2) { width: 8%; }
.vault-table th:nth-child(3) { width: 13%; }
.vault-table th:nth-child(4) { width: 8%; }
.vault-table th:nth-child(5) { width: 18%; }
.vault-table th:last-child { width: 19%; border-radius: 0 7px 0 0; }
.vault-table td { padding: 10px; vertical-align: top; border-bottom: 1px solid var(--color-card-border); line-height: 1.5; overflow-wrap: anywhere; background: var(--color-card-bg); }
.vault-table td:first-child { padding-left: 14px; }
.vault-table tr:hover td { background: var(--color-card-bg-hover); }
.vault-table__heading { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 6px 10px; }
.vault-table h2 { flex: 1; min-width: 100px; font-size: 14px; font-weight: 600; line-height: 1.45; color: var(--color-text-400); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.vault-table__status { flex: none; padding: 1px 5px; border: 1px solid var(--color-card-border); border-radius: 3px; font-size: 10px; }
.vault-table__status.is-blocked,.vault-table__status.is-review,.vault-table__priority .is-high { color: var(--color-orange-400); }
.vault-table__description { margin-top: 4px; font-size: 12px; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.vault-table__note { margin-top: 5px; color: var(--color-text-200); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 11px; }
.is-expanded .vault-table__description,.is-expanded .vault-table__note,.is-expanded h2 { display: block; }
.vault-table__warning { margin-top: 5px; color: var(--color-orange-400); font-size: 11px; }
.vault-table__details { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 26px; min-height: 26px; padding: 2px; color: var(--color-text-300); background: transparent; border: 1px solid var(--color-card-border); border-radius: 4px; cursor: pointer; font-size: 15px; line-height: 1; }
.vault-table__tags { display: flex; flex-wrap: wrap; gap: 4px; }
.vault-table__tags li { max-width: 100%; padding: 2px 5px; background: var(--color-beige-600); border-radius: 3px; font-size: 10px; }
.vault-table__empty { color: var(--color-text-200); }
@media(min-width:761px) and (max-width:1023px) { .vault-table th:first-child { width: 32%; } .vault-table th:nth-child(5) { width: 16%; } .vault-table th:last-child { width: 23%; } .vault-table th:nth-child(3) { width: 13%; } }
@media(max-width:760px) {
  .vault-table,.vault-table tbody { display: block; }
  .vault-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .vault-table tr { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); border: 1px solid var(--color-card-border); border-radius: 7px; margin-bottom: 10px; padding: 12px; background: var(--color-card-bg); }
  .vault-table td,.vault-table td:first-child { padding: 0; background: none; border: 0; min-width: 0; }
  .vault-table tr:hover td { background: none; }
  .vault-table__resource { grid-column: 1 / -1; }
  .vault-table__description { font-size: 12px; -webkit-line-clamp: 2; line-clamp: 2; }
  .vault-table__details { min-height: 44px; width: 44px; }
  .vault-table__country,.vault-table__owner,.vault-table__priority { display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
  .vault-table td::before { content: attr(data-label); color: var(--color-text-200); font-size: 10px; }
  .vault-table__owner { padding-left: 10px !important; }
  .vault-table__priority { margin-top: 8px; }
  .vault-table__tag-cell { display: none; grid-column: 1 / -1; margin-top: 10px; }
  .is-expanded .vault-table__tag-cell { display: block; }
  .vault-table__tag-cell::before { display: block; margin-bottom: 4px; }
  .vault-table__actions { grid-column: 1 / -1; margin-top: 12px; padding-top: 10px !important; border-top: 1px solid var(--color-card-border) !important; }
  .vault-table__actions::before { display: none; }
}
</style>
