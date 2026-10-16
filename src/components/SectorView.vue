<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import { useLocale } from "../i18n";
import { CATEGORY_IDS, type CategoryId, type DirectoryQuickView } from "../types/links";
import VaultCard from "./VaultCard.vue";
import VaultTable from "./VaultTable.vue";
import SkeletonCard from "./SkeletonCard.vue";
import Icon from "./Icon.vue";
const { t, locale, text } = useLocale();
const { scope, workspaceLinks, categories, filters, viewMode, directoryQuickView, countryCounts, criticalOnly, isLoading, source, error, refreshedAt, previewDirectory, hasActiveFilters, clearFilters, goHome } = useLinks();
const countries = ["all", "Regional", "VN", "TH", "MY", "SG", "PH", "ID"] as const;
const quickViews: { id: DirectoryQuickView; en: string; vi: string }[] = [
  { id: "all", en: "All resources", vi: "Tất cả tài nguyên" },
  { id: "ar-trackers", en: "AR Trackers", vi: "Theo dõi công nợ" },
  { id: "netsuite-links", en: "NetSuite Links", vi: "Liên kết NetSuite" },
  { id: "analytics-automation", en: "Analytics & Automation", vi: "Phân tích & Tự động hóa" },
  { id: "review-cockpits", en: "Review Cockpits", vi: "Rà soát vận hành" },
  { id: "project-workspace", en: "Project Workspace", vi: "Phát triển dự án" },
  { id: "process-documents", en: "Process Documents", vi: "Tài liệu quy trình" },
];
const categoryMap = computed(() => new Map(categories.value.map(category => [category.id, category])));
function categoryLabel(id: CategoryId) { return CATEGORY_IDS.includes(id) ? t(`directory.categories.${id}`) : categoryMap.value.get(id)?.name ?? id; }
const sourceKey = computed(() => source.value ?? "loading");
const fetchedLabel = computed(() => {
  const date = refreshedAt.value ? new Date(refreshedAt.value) : null;
  return date && !Number.isNaN(date.getTime()) ? `${t("directory.fetched")} ${new Intl.DateTimeFormat(locale.value === "vi" ? "vi-VN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date)}` : t("directory.notFetched");
});
</script>

<template>
  <section class="directory" aria-labelledby="directory-title">
    <div class="directory__tools">
      <header class="directory__header"><div><nav class="directory__breadcrumb" :aria-label="t('directory.title')"><button type="button" @click="goHome">{{ t('directory.home') }}</button><span aria-hidden="true">/</span><span>{{ text('VAULT LIBRARY', 'THƯ VIỆN VAULT') }}</span></nav><h1 id="directory-title">{{ text('Vault Library', 'Thư viện Vault') }}</h1></div><p class="directory__count" role="status"><strong>{{ workspaceLinks.length }}</strong> {{ t('directory.assets') }}</p></header>
      <div class="directory__search-row">
        <label class="directory__search"><Icon name="search" :size="17" /><span class="visually-hidden">{{ t('directory.search') }}</span><input v-model="filters.query" type="search" :placeholder="t('directory.searchHint')" maxlength="200" /></label>
        <span class="directory__source" :class="`is-${sourceKey}`" tabindex="0" :aria-describedby="'directory-source-time'">{{ t(`directory.source.${sourceKey}`) }}<span id="directory-source-time" class="directory__source-tooltip" role="tooltip">{{ fetchedLabel }}</span></span>
      </div>
      <p v-if="error" class="directory__notice" role="status">{{ t(error) }}</p><p v-else-if="source === 'mock'" class="directory__notice" role="status">{{ t('directory.demoWarning') }}</p>
      <div class="directory__toolbar">
        <label><span>{{ t('directory.country') }}</span><select v-model="filters.country" :aria-label="t('directory.country')"><option v-for="country in countries" :key="country" :value="country">{{ country === 'all' ? text('All', 'Tất cả') : country === 'Regional' ? t('directory.region') : country }} · {{ countryCounts.get(country) ?? 0 }}</option></select></label>
        <label class="directory__type"><span>{{ text('View', 'Loại') }}</span><select v-model="directoryQuickView" :aria-label="text('Resource type', 'Loại tài nguyên')"><option v-for="quick in quickViews" :key="quick.id" :value="quick.id">{{ text(quick.en, quick.vi) }}</option></select></label>
        <label class="directory__category"><span>{{ t('directory.category') }}</span><select v-model="scope" :aria-label="t('directory.category')"><option value="all">{{ t('directory.all') }}</option><option value="critical">{{ t('directory.critical') }}</option><option value="recent">{{ t('directory.recent') }}</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ categoryLabel(category.id) }}</option></select></label>
        <div class="directory__view-toggle" role="group" :aria-label="t('directory.display')"><button type="button" :aria-pressed="viewMode === 'compact'" @click="viewMode = 'compact'">{{ t('directory.list') }}</button><button type="button" :aria-pressed="viewMode === 'cards'" @click="viewMode = 'cards'">{{ t('directory.cards') }}</button></div>
        <button v-if="hasActiveFilters" type="button" class="directory__clear" :aria-label="t('directory.clear')" :title="t('directory.clear')" @click="clearFilters"><Icon name="close" :size="15" /><span>{{ t('directory.clear') }}</span></button>
      </div>
      <div v-if="filters.status !== 'all' || filters.criticality !== 'all' || criticalOnly" class="directory__legacy-filters" :aria-label="text('Active URL filters', 'Bộ lọc đang áp dụng từ liên kết')"><button v-if="filters.status !== 'all'" type="button" @click="filters.status = 'all'">{{ t('directory.status') }}: {{ t(`directory.statusValues.${filters.status}`) }} <span aria-hidden="true">×</span></button><button v-if="filters.criticality !== 'all' || criticalOnly" type="button" @click="filters.criticality = 'all'; criticalOnly = false">{{ t('directory.criticality') }}: {{ t(`directory.criticalityValues.${criticalOnly ? 'High' : filters.criticality}`) }} <span aria-hidden="true">×</span></button></div>
    </div>
    <div class="directory__results vph-scroll" :aria-busy="isLoading" tabindex="0" :aria-label="t('directory.title')"><div v-if="isLoading && !workspaceLinks.length" class="directory__grid"><SkeletonCard v-for="n in 4" :key="n" /></div><div v-else-if="source === 'unavailable'" class="directory__empty"><Icon name="shield" :size="28" /><h2>{{ t('directory.unavailableTitle') }}</h2><p>{{ t('directory.unavailableWarning') }}</p><button type="button" @click="previewDirectory">{{ t('directory.preview') }}</button></div><div v-else-if="workspaceLinks.length === 0" class="directory__empty"><Icon name="search" :size="28" /><h2>{{ t('directory.emptyTitle') }}</h2><p>{{ t('directory.empty') }}</p><button v-if="hasActiveFilters" type="button" @click="clearFilters">{{ t('directory.clear') }}</button></div><VaultTable v-else-if="viewMode === 'compact'" :links="workspaceLinks" /><div v-else class="directory__grid"><VaultCard v-for="link in workspaceLinks" :key="link.id" :link="link" :accent="categoryMap.get(link.category)?.color || 'var(--color-cyan-400)'" :icon="categoryMap.get(link.category)?.icon || 'folder'" /></div><p class="directory__content-note">{{ t('directory.contentNote') }}</p></div>
  </section>
</template>

<style lang="scss" scoped>
.directory { position:relative; height:100%; display:flex; flex-direction:column; min-height:0; max-width:1440px; margin-inline:auto; padding:16px clamp(16px,3vw,40px) 0; gap:14px; }
.directory__tools { flex:none; min-width:0; }
.directory__header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:14px; }
.directory__breadcrumb { display:flex; gap:8px; align-items:center; color:var(--color-text-200); font-size:9px; letter-spacing:.09em; margin-bottom:5px; }
.directory__breadcrumb button { border:0; padding:0; color:var(--color-text-300); background:none; font:inherit; cursor:pointer; letter-spacing:0; }
.directory__header h1 { font-size:clamp(23px,2.6vw,30px); font-weight:600; line-height:1.2; }
.directory__count { font-size:11px; color:var(--color-text-200); white-space:nowrap; }
.directory__count strong { color:var(--color-text-400); font-size:18px; margin-right:4px; }
.directory__search-row { display:flex; align-items:center; gap:12px; }
.directory__search { flex:1; min-width:0; display:flex; align-items:center; gap:10px; min-height:40px; padding:8px 12px; border:1px solid var(--color-card-border-hover); border-radius:6px; background:var(--color-card-bg); color:var(--color-text-200); }
.directory__search input { min-width:0; width:100%; border:0; background:none; color:var(--color-text-400); font:inherit; font-size:13px; }
.directory__source { position:relative; flex:none; display:inline-flex; align-items:center; gap:6px; border:1px solid var(--color-card-border); border-radius:5px; padding:6px 8px; color:var(--color-text-300); font-size:10px; white-space:nowrap; }
.directory__source::before { content:''; width:5px; height:5px; flex:none; border-radius:50%; background:var(--color-cyan-400); }
.directory__source.is-stale,.directory__source.is-unavailable,.directory__source.is-mock { color:var(--color-orange-400); }
.directory__source.is-stale::before,.directory__source.is-unavailable::before,.directory__source.is-mock::before { background:var(--color-orange-400); }
.directory__source-tooltip { display:none; position:absolute; right:0; top:calc(100% + 7px); z-index:10; padding:8px 10px; border:1px solid var(--color-card-border-hover); border-radius:5px; background:var(--space-deep); color:var(--color-text-300); font-size:11px; line-height:1.5; width:max-content; max-width:260px; white-space:normal; box-shadow:0 8px 24px #0005; }
.directory__source:hover .directory__source-tooltip,.directory__source:focus .directory__source-tooltip { display:block; }
.directory__source:focus-visible { outline:2px solid var(--color-orange-400); outline-offset:3px; }
.directory__notice { margin-top:8px; padding:7px 10px; border-left:2px solid var(--color-orange-400); background:var(--color-orange-muted); color:var(--color-text-300); font-size:11px; line-height:1.5; }
.directory__toolbar { display:flex; align-items:center; gap:8px; margin-top:8px; min-width:0; }
.directory__toolbar>label { display:flex; align-items:center; gap:6px; min-width:0; color:var(--color-text-200); font-size:10px; }
.directory__toolbar>label>span { flex:none; }
.directory__toolbar select { min-width:0; width:100%; max-width:230px; min-height:36px; padding:6px 24px 6px 8px; border:1px solid var(--color-card-border); border-radius:5px; background:var(--space-navy); color:var(--color-text-300); font:inherit; font-size:11px; }
.directory__type { flex:1; max-width:270px; }
.directory__category { flex:1; max-width:300px; }
.directory__view-toggle { display:flex; margin-left:auto; flex:none; }
.directory__view-toggle button,.directory__clear,.directory__empty button { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:36px; padding:6px 9px; border:1px solid var(--color-card-border); border-radius:5px; background:var(--color-card-bg); color:var(--color-text-300); font:inherit; font-size:11px; cursor:pointer; }
.directory__view-toggle button:first-child { border-radius:5px 0 0 5px; }
.directory__view-toggle button:last-child { border-radius:0 5px 5px 0; border-left:0; }
.directory__view-toggle button[aria-pressed=true] { color:var(--color-text-400); background:var(--color-beige-600); border-color:var(--color-card-border-hover); }
.directory__clear { border-color:transparent; background:none; }
.directory__legacy-filters { display:flex; flex-wrap:wrap; gap:6px; margin-top:7px; }
.directory__legacy-filters button { min-height:32px; border:1px solid var(--color-card-border); border-radius:5px; padding:4px 8px; background:var(--space-navy); color:var(--color-text-300); font-size:11px; cursor:pointer; }
.directory__results { flex:1; min-height:0; overflow-y:auto; overflow-x:hidden; overscroll-behavior:contain; padding-bottom:20px; }
.directory__grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr)); gap:12px; }
.directory__empty { display:flex; flex-direction:column; align-items:flex-start; gap:12px; max-width:600px; padding:clamp(24px,5vw,56px) 0; color:var(--color-text-300); }
.directory__empty h2 { font-size:20px; color:var(--color-text-400); }
.directory__empty p { font-size:14px; line-height:1.65; }
.directory__content-note { margin-top:16px; color:var(--color-text-200); font-size:10px; line-height:1.5; }
@media(max-width:950px) { .directory__toolbar { flex-wrap:wrap; } .directory__toolbar>label>span { display:none; } .directory__type,.directory__category { max-width:none; } .directory__view-toggle { margin-left:0; } }
@media(max-width:540px) { .directory { padding:12px 12px 0; gap:10px; } .directory__breadcrumb { display:none; } .directory__header { margin-bottom:10px; } .directory__header h1 { font-size:22px; } .directory__count strong { font-size:17px; } .directory__search-row { gap:8px; } .directory__search { min-height:44px; padding:8px; gap:6px; } .directory__search input { font-size:12px; } .directory__source { max-width:115px; font-size:9px; padding:6px; white-space:normal; } .directory__source-tooltip { max-width:220px; } .directory__toolbar { gap:6px; } .directory__toolbar>label { flex:1 1 30%; } .directory__toolbar select { min-height:44px; font-size:11px; padding-left:6px; } .directory__view-toggle { flex:1; } .directory__view-toggle button { flex:1; min-height:44px; } .directory__clear { min-height:44px; width:44px; padding:8px; } .directory__clear>span { display:none; } .directory__legacy-filters button { min-height:44px; } }
</style>
