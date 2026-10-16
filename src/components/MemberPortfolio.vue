<script setup lang="ts">
import { computed } from "vue";
import type { PortfolioRow } from "../data/memberPortfolios";
import { filterPortfolio, portfolioPlatforms, portfolioSummary } from "../data/crewDirectory";
import { useMemberPortfolioFilters } from "../composables/useCrewDirectory";
import { useLocale } from "../i18n";
import Icon from "./Icon.vue";

const props = defineProps<{ rows: PortfolioRow[]; memberId: string }>();
const { locale, t } = useLocale();
const filters = useMemberPortfolioFilters(props.memberId);
const summary = computed(() => portfolioSummary(props.rows));
const countries = computed(() => [...new Set(props.rows.map(row => row.country).filter(Boolean))].sort());
const complexities = computed(() => [...new Set(props.rows.map(row => row.complexity).filter(Boolean))].sort());
const platforms = computed(() => portfolioPlatforms(props.rows));
const shown = computed(() => filterPortfolio(props.rows, filters, locale.value));
function clear() { filters.query = ""; filters.country = "all"; filters.platform = "all"; filters.complexity = "all"; filters.sort = "brand"; }
const hasFilters = computed(() => !!filters.query || filters.country !== "all" || filters.platform !== "all" || filters.complexity !== "all" || filters.sort !== "brand");
</script>

<template>
  <section class="portfolio" aria-labelledby="member-portfolio-title">
    <header><h2 id="member-portfolio-title">{{ t('crew.member.portfolio') }}</h2><p>{{ t('crew.member.portfolioIntro') }}</p></header>
    <dl class="portfolio-summary"><div><dt>{{ t('crew.member.uniqueBrands') }}</dt><dd>{{ summary.brands }}</dd></div><div><dt>{{ t('crew.member.rows') }}</dt><dd>{{ summary.rows }}</dd></div><div><dt>{{ t('crew.member.platforms') }}</dt><dd>{{ summary.platforms }}</dd></div></dl>
    <p class="portfolio-metric-note">{{ t('crew.member.metricNote') }}</p>
    <div class="portfolio-filters">
      <label class="portfolio-search"><span>{{ t('crew.member.search') }}</span><input v-model="filters.query" type="search" maxlength="200" :placeholder="t('crew.member.searchPlaceholder')" autocomplete="off"></label>
      <label><span>{{ t('crew.member.sort') }}</span><select v-model="filters.sort"><option value="brand">{{ t('crew.member.sortBrand') }}</option><option value="brand-desc">{{ t('crew.member.sortBrandDesc') }}</option><option value="country">{{ t('crew.member.sortCountry') }}</option></select></label>
      <label><span>{{ t('crew.market') }}</span><select v-model="filters.country"><option value="all">{{ t('crew.allMarkets') }}</option><option v-for="country in countries" :key="country" :value="country">{{ country }}</option></select></label>
      <label><span>{{ t('crew.member.platforms') }}</span><select v-model="filters.platform"><option value="all">{{ t('crew.member.allPlatforms') }}</option><option v-for="platform in platforms" :key="platform" :value="platform">{{ platform }}</option></select></label>
      <label><span>{{ t('crew.member.complexity') }}</span><select v-model="filters.complexity"><option value="all">{{ t('crew.member.allComplexities') }}</option><option v-for="complexity in complexities" :key="complexity" :value="complexity">{{ complexity }}</option></select></label>
    </div>
    <div class="portfolio-result"><p role="status" aria-live="polite">{{ t('crew.member.shown', { count: shown.length, total: rows.length }) }}</p><button v-if="hasFilters" type="button" @click="clear"><Icon name="close" :size="14" />{{ t('crew.reset') }}</button></div>
    <div v-if="!shown.length" class="portfolio-empty"><h3>{{ t('crew.member.noMatch') }}</h3><p>{{ t('crew.member.noMatchBody') }}</p><button type="button" @click="clear">{{ t('crew.reset') }}</button></div>
    <div v-else class="portfolio-table-wrap">
      <table class="portfolio-table"><caption class="sr-only">{{ t('crew.member.sourceRows') }}</caption><thead><tr><th scope="col">{{ t('crew.member.country') }}</th><th scope="col">{{ t('crew.member.brand') }}</th><th scope="col">{{ t('crew.member.model') }}</th><th scope="col">{{ t('crew.member.complexity') }}</th><th scope="col">{{ t('crew.member.platforms') }}</th></tr></thead><tbody><tr v-for="(row,index) in shown" :key="index"><td class="portfolio-country" :data-label="t('crew.member.country')">{{ row.country || t('crew.member.notSpecified') }}</td><td class="portfolio-brand" :data-label="t('crew.member.brand')">{{ row.brand || t('crew.member.unnamedBrand') }}</td><td :data-label="t('crew.member.model')">{{ row.class || t('crew.member.notSpecified') }}</td><td :data-label="t('crew.member.complexity')">{{ row.complexity || t('crew.member.notSpecified') }}</td><td :data-label="t('crew.member.platforms')"><span class="portfolio-platforms"><span v-for="platform in portfolioPlatforms([row])" :key="platform">{{ platform }}</span><span v-if="!portfolioPlatforms([row]).length">{{ t('crew.member.notSpecified') }}</span></span></td></tr></tbody></table>
    </div>
    <p class="portfolio-source-note">{{ t('crew.member.sourceNote') }}</p>
  </section>
</template>

<style scoped>
.portfolio { margin-top: 28px; }
h2 { font-size: 24px; font-weight: 500; line-height: 1.4; }
.portfolio>header p { margin-top: 8px; color: var(--color-text-300); font-size: 14px; line-height: 1.65; }
.portfolio-summary { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); margin: 24px 0 12px; border: 1px solid var(--color-card-border); border-radius: var(--radius-md); background: var(--space-navy); }
.portfolio-summary>div { padding: 16px 20px; min-width: 0; }
.portfolio-summary>div+div { border-left: 1px solid var(--color-card-border); }
dt { font-size: 12px; color: var(--color-text-300); line-height: 1.5; }
dd { margin: 8px 0 0; font-size: 28px; font-weight: 500; color: var(--color-text-400); font-variant-numeric: tabular-nums; }
.portfolio-metric-note,.portfolio-source-note { color: var(--color-text-300); font-size: 12px; line-height: 1.7; max-width: 90ch; }
.portfolio-filters { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; margin-top: 24px; }
.portfolio-search { grid-column: span 2; }
label { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
label>span { color: var(--color-text-300); font-size: 12px; }
input,select { width: 100%; min-width: 0; min-height: 44px; border: 1px solid var(--color-card-border); border-radius: 6px; padding: 8px 12px; background: var(--space-navy); color: var(--color-text-400); font: inherit; font-size: 14px; }
input::placeholder { color: var(--color-text-300); opacity: .8; }
.portfolio-result { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; margin: 12px 0; color: var(--color-text-300); font-size: 12px; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 6px; background: var(--space-navy); color: var(--color-text-400); font: inherit; font-size: 12px; cursor: pointer; }
button:hover { border-color: var(--color-card-border-hover); background: var(--color-command-bg-soft); }
button:focus-visible,input:focus-visible,select:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 3px; }
.portfolio-table-wrap { overflow-x: auto; border: 1px solid var(--color-card-border); border-radius: var(--radius-md); background: var(--space-deep); }
.portfolio-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
th { padding: 14px 16px; background: var(--space-navy); color: var(--color-text-300); font-size: 11px; font-weight: 500; line-height: 1.5; }
td { border-top: 1px solid var(--color-card-border); padding: 14px 16px; line-height: 1.6; color: var(--color-text-300); overflow-wrap: anywhere; }
.portfolio-brand { color: var(--color-text-400); font-weight: 500; min-width: 140px; }
.portfolio-country { font-size: 12px; font-variant-numeric: tabular-nums; }
tbody tr:hover { background: var(--color-command-bg-soft); }
.portfolio-platforms { display: flex; flex-wrap: wrap; gap: 4px 8px; font-size: 11px; }
.portfolio-platforms>span { padding: 2px 6px; border-radius: 4px; background: var(--space-navy); }
.portfolio-source-note { margin-top: 16px; }
.portfolio-empty { padding: 24px 0; }
h3 { font-size: 18px; font-weight: 500; }
.portfolio-empty p { color: var(--color-text-300); margin: 12px 0 20px; font-size: 14px; line-height: 1.7; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media(max-width:700px) { .portfolio-filters { grid-template-columns: repeat(2,minmax(0,1fr)); } .portfolio-search { grid-column: 1/-1; } input,select { font-size: 16px; } .portfolio-summary>div { padding: 14px 12px; } dd { font-size: 24px; } }
@media(max-width:540px) { .portfolio-filters { grid-template-columns: minmax(0,1fr); } .portfolio-search { grid-column: auto; } dt { font-size: 11px; } .portfolio-summary>div { padding: 12px 8px; } .portfolio-table { display: block; } .portfolio-table thead { position: absolute; width: 1px; height: 1px; clip-path: inset(50%); overflow: hidden; } .portfolio-table tbody { display: block; } .portfolio-table tr { display: grid; grid-template-columns: minmax(0,1fr); padding: 16px; gap: 8px; border-top: 1px solid var(--color-card-border); } .portfolio-table tr:first-child { border-top: 0; } .portfolio-table td { display: grid; grid-template-columns: minmax(80px,.8fr) minmax(0,1.4fr); gap: 12px; padding: 0; border: none; font-size: 12px; min-width: 0; } .portfolio-table td::before { content: attr(data-label); color: var(--color-text-300); font-weight: 400; font-size: 11px; } .portfolio-table .portfolio-brand { font-size: 14px; } }
</style>
