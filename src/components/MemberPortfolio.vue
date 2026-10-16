<script setup lang="ts">
import { computed, ref } from "vue";
import type { PortfolioRow } from "../data/memberPortfolios";
import { filterPortfolio, portfolioPlatforms, portfolioSummary } from "../data/crewDirectory";
import { useMemberPortfolioFilters } from "../composables/useCrewDirectory";
import { useLocale } from "../i18n";
import PortfolioColumnFilter from "./PortfolioColumnFilter.vue";
import Icon from "./Icon.vue";

const props = defineProps<{ rows: PortfolioRow[]; memberId: string }>();
const { locale, t, text } = useLocale();
const filters = useMemberPortfolioFilters(props.memberId);
const model = ref("all");
const summary = computed(() => portfolioSummary(props.rows));
const countries = computed(() => [...new Set(props.rows.map(row => row.country).filter(Boolean))].sort());
const complexities = computed(() => [...new Set(props.rows.map(row => row.complexity).filter(Boolean))].sort());
const models = computed(() => [...new Set(props.rows.map(row => row.class).filter(Boolean))].sort());
const platforms = computed(() => portfolioPlatforms(props.rows));
const shown = computed(() => filterPortfolio(props.rows, filters, locale.value).filter(row => model.value === "all" || row.class === model.value));
function clear() { filters.query = ""; filters.country = "all"; filters.platform = "all"; filters.complexity = "all"; filters.sort = "brand"; model.value = "all"; }
const hasFilters = computed(() => !!filters.query || filters.country !== "all" || filters.platform !== "all" || filters.complexity !== "all" || filters.sort !== "brand" || model.value !== "all");
</script>

<template>
  <section class="portfolio" aria-labelledby="member-portfolio-title">
    <header class="portfolio-header"><h2 id="member-portfolio-title">{{ t('crew.member.portfolio') }}</h2><dl class="portfolio-summary" :title="t('crew.member.metricNote')"><div><dt>{{ t('crew.member.uniqueBrands') }}</dt><dd>{{ summary.brands }}</dd></div><div><dt>{{ t('crew.member.rows') }}</dt><dd>{{ summary.rows }}</dd></div><div><dt>{{ t('crew.member.platforms') }}</dt><dd>{{ summary.platforms }}</dd></div></dl></header>
    <div class="portfolio-result"><p role="status" aria-live="polite">{{ t('crew.member.shown', { count: shown.length, total: rows.length }) }}</p><button v-if="hasFilters" type="button" @click="clear"><Icon name="close" :size="13" />{{ t('crew.reset') }}</button></div>
    <div class="portfolio-table-wrap vph-scroll" tabindex="0" :aria-label="t('crew.member.portfolio')">
      <table class="portfolio-table">
        <caption class="sr-only">{{ t('crew.member.sourceRows') }}</caption>
        <thead><tr>
          <th scope="col"><PortfolioColumnFilter :label="t('crew.member.country')" :active="filters.country !== 'all'"><label>{{ t('crew.market') }}<select v-model="filters.country"><option value="all">{{ t('crew.allMarkets') }}</option><option v-for="country in countries" :key="country" :value="country">{{ country }}</option></select></label></PortfolioColumnFilter></th>
          <th scope="col"><PortfolioColumnFilter :label="t('crew.member.brand')" :active="!!filters.query || filters.sort !== 'brand'"><label>{{ t('crew.member.search') }}<input v-model="filters.query" type="search" maxlength="200" :placeholder="t('crew.member.searchPlaceholder')" autocomplete="off"></label><label>{{ t('crew.member.sort') }}<select v-model="filters.sort"><option value="brand">{{ t('crew.member.sortBrand') }}</option><option value="brand-desc">{{ t('crew.member.sortBrandDesc') }}</option><option value="country">{{ t('crew.member.sortCountry') }}</option></select></label></PortfolioColumnFilter></th>
          <th scope="col"><PortfolioColumnFilter :label="text('Model / class', 'Model / class')" :active="model !== 'all'"><label>{{ t('crew.member.model') }}<select v-model="model"><option value="all">{{ t('crew.member.allComplexities') }}</option><option v-for="value in models" :key="value" :value="value">{{ value }}</option></select></label></PortfolioColumnFilter></th>
          <th scope="col"><PortfolioColumnFilter :label="text('Complexity', 'Complexity')" :active="filters.complexity !== 'all'"><label>{{ t('crew.member.complexity') }}<select v-model="filters.complexity"><option value="all">{{ t('crew.member.allComplexities') }}</option><option v-for="complexity in complexities" :key="complexity" :value="complexity">{{ complexity }}</option></select></label></PortfolioColumnFilter></th>
          <th scope="col"><PortfolioColumnFilter :label="t('crew.member.platforms')" :active="filters.platform !== 'all'"><label>{{ t('crew.member.platforms') }}<select v-model="filters.platform"><option value="all">{{ t('crew.member.allPlatforms') }}</option><option v-for="platform in platforms" :key="platform" :value="platform">{{ platform }}</option></select></label></PortfolioColumnFilter></th>
        </tr></thead>
        <tbody><tr v-for="(row,index) in shown" :key="index"><td class="portfolio-country" :data-label="t('crew.member.country')">{{ row.country || t('crew.member.notSpecified') }}</td><td class="portfolio-brand" :data-label="t('crew.member.brand')">{{ row.brand || t('crew.member.unnamedBrand') }}</td><td :data-label="t('crew.member.model')">{{ row.class || t('crew.member.notSpecified') }}</td><td :data-label="t('crew.member.complexity')">{{ row.complexity || t('crew.member.notSpecified') }}</td><td :data-label="t('crew.member.platforms')"><span class="portfolio-platforms"><span v-for="platform in portfolioPlatforms([row])" :key="platform">{{ platform }}</span><span v-if="!portfolioPlatforms([row]).length">{{ t('crew.member.notSpecified') }}</span></span></td></tr><tr v-if="!shown.length" class="portfolio-empty"><td colspan="5"><h3>{{ t('crew.member.noMatch') }}</h3><p>{{ t('crew.member.noMatchBody') }}</p><button type="button" @click="clear">{{ t('crew.reset') }}</button></td></tr></tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.portfolio { display:flex; flex-direction:column; flex:1; min-height:0; margin-top:14px; }
.portfolio-header { display:flex; flex:none; align-items:center; justify-content:space-between; gap:16px; }
.portfolio-header h2 { font-size:19px; font-weight:500; line-height:1.4; }
.portfolio-summary { display:flex; gap:20px; }
.portfolio-summary>div { display:flex; align-items:baseline; gap:8px; min-width:0; }
dt { color:var(--color-text-200); font-size:10px; line-height:1.5; }
dd { color:var(--color-text-400); font-size:22px; font-weight:500; font-variant-numeric:tabular-nums; }
.portfolio-result { flex:none; display:flex; align-items:center; gap:12px; min-height:36px; margin:6px 0; color:var(--color-text-300); font-size:10px; }
.portfolio-result>p:first-child { white-space:nowrap; }
button { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:32px; padding:5px 8px; border:1px solid var(--color-card-border); border-radius:5px; background:var(--space-navy); color:var(--color-text-400); font:inherit; font-size:10px; cursor:pointer; }
button:focus-visible,.portfolio-table-wrap:focus-visible { outline:2px solid var(--color-orange-400); outline-offset:2px; }
.portfolio-table-wrap { flex:1; min-height:120px; overflow:auto; overscroll-behavior:contain; scrollbar-gutter:stable; border:1px solid var(--color-card-border); border-radius:7px; background:var(--space-deep); }
.portfolio-table { width:100%; border-collapse:separate; border-spacing:0; text-align:left; font-size:12px; table-layout:fixed; }
thead { position:sticky; top:0; z-index:2; }
th { padding:0 6px; background:var(--space-navy); border-bottom:1px solid var(--color-card-border); }
th:first-child { width:11%; }
th:nth-child(2) { width:30%; }
th:nth-child(3) { width:19%; }
th:nth-child(4) { width:18%; }
th:nth-child(5) { width:22%; }
td { border-bottom:1px solid var(--color-card-border); padding:10px 14px; line-height:1.5; color:var(--color-text-300); overflow-wrap:anywhere; }
.portfolio-brand { color:var(--color-text-400); font-weight:500; }
.portfolio-country { font-size:11px; font-variant-numeric:tabular-nums; }
tbody tr:hover { background:var(--color-command-bg-soft); }
.portfolio-platforms { display:flex; flex-wrap:wrap; gap:4px 6px; font-size:10px; }
.portfolio-platforms>span { padding:2px 5px; border-radius:4px; background:var(--space-navy); }
.portfolio-empty td { padding:24px 16px; }
.portfolio-empty h3 { font-size:16px; font-weight:500; }
.portfolio-empty p { margin:8px 0 12px; color:var(--color-text-300); font-size:12px; }
.sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
@media(max-width:760px) { .portfolio-header { align-items:flex-start; flex-wrap:wrap; gap:8px; } .portfolio-header h2 { font-size:17px; } .portfolio-summary { gap:16px; } .portfolio-summary>div { gap:6px; } dd { font-size:20px; } .portfolio-result { flex-wrap:wrap; gap:5px 10px; } .portfolio-metric-note { order:3; flex-basis:100%; margin-left:0; font-size:9px; } .portfolio-result button { margin-left:auto; min-height:44px; } }
@media(max-width:540px) {
  .portfolio { margin-top:10px; }.portfolio-header { display:block; }.portfolio-summary { margin-top:6px; justify-content:space-between; gap:6px; }.portfolio-summary>div { flex-direction:column; gap:0; } dt { font-size:9px; } dd { font-size:20px; }
  .portfolio-table,.portfolio-table thead,.portfolio-table tbody { display:block; }.portfolio-table thead { position:sticky; }.portfolio-table thead tr { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); background:var(--space-navy); padding:3px; border-bottom:1px solid var(--color-card-border); }.portfolio-table th { display:block; width:auto; min-width:0; padding:0; border:0; }
  .portfolio-table tbody tr { display:grid; grid-template-columns:minmax(0,1fr); padding:12px; gap:6px; border-bottom:1px solid var(--color-card-border); }.portfolio-table td { display:grid; grid-template-columns:minmax(80px,.8fr) minmax(0,1.4fr); gap:12px; padding:0; border:0; font-size:11px; min-width:0; }.portfolio-table td::before { content:attr(data-label); color:var(--color-text-200); font-weight:400; font-size:10px; }.portfolio-table .portfolio-brand { font-size:13px; }
  .portfolio-table .portfolio-empty td { display:block; }.portfolio-table .portfolio-empty td::before { display:none; }
}
</style>
