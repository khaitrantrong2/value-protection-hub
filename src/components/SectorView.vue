<script setup lang="ts">
import { computed, ref } from "vue";
import { useLinks } from "../composables/useLinks";
import { useLocale } from "../i18n";
import { CATEGORY_IDS, type CategoryId } from "../types/links";
import VaultCard from "./VaultCard.vue";
import SkeletonCard from "./SkeletonCard.vue";
import Icon from "./Icon.vue";
const { t, locale } = useLocale();
const { scope, workspaceLinks, categories, filters, viewMode, criticalOnly, isLoading, source, error, refreshedAt, refreshLinks, previewDirectory, availableCountries, hasActiveFilters, clearFilters, goHome } = useLinks();
const filterOpen = ref(false);
const statusValues = ["Active", "Review", "Blocked", "Archived"] as const;
const priorityValues = ["High", "Medium", "Low"] as const;
const categoryMap = computed(() => new Map(categories.value.map((category) => [category.id, category])));
function categoryLabel(id: CategoryId) { return CATEGORY_IDS.includes(id) ? t(`directory.categories.${id}`) : categoryMap.value.get(id)?.name ?? id; }
const scopeLabel = computed(() => ["all", "critical", "recent"].includes(scope.value) ? t(`directory.${scope.value}`) : categoryLabel(scope.value as CategoryId));
const activeFilterCount = computed(() => Number(scope.value !== "all") + Number(filters.country !== "all") + Number(filters.status !== "all") + Number(filters.criticality !== "all" || criticalOnly.value));
const fetchedLabel = computed(() => refreshedAt.value ? `${t("directory.fetched")} ${new Intl.DateTimeFormat(locale.value === "vi" ? "vi-VN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(refreshedAt.value))}` : t("directory.notFetched"));
const sourceKey = computed(() => source.value ?? "loading");
</script>

<template>
  <section class="directory" aria-labelledby="directory-title">
    <div class="directory__tools">
      <nav class="directory__breadcrumb" :aria-label="t('directory.title')"><button type="button" @click="goHome">{{ t('directory.home') }}</button><span aria-hidden="true">/</span><span>{{ t('directory.title') }}</span></nav>
      <header class="directory__header"><h1 id="directory-title">{{ scope === 'all' ? t('directory.title') : scopeLabel }}</h1><p class="directory__count" role="status"><strong>{{ workspaceLinks.length }}</strong> {{ t('directory.assets') }}</p></header>
      <div class="directory__source"><span class="directory__source-label" :class="`is-${sourceKey}`">{{ t(`directory.source.${sourceKey}`) }}</span><span class="directory__fetch-time">{{ fetchedLabel }}</span><button type="button" class="directory__refresh" :disabled="isLoading" @click="refreshLinks"><Icon name="clock" :size="14" />{{ t(isLoading ? 'directory.refreshing' : 'directory.refresh') }}</button></div>
      <p v-if="error" class="directory__notice" role="status">{{ t(error) }}</p><p v-else-if="source === 'mock'" class="directory__notice" role="status">{{ t('directory.demoWarning') }}</p>
      <div class="directory__toolbar"><label class="directory__search"><Icon name="search" :size="18" /><span class="visually-hidden">{{ t('directory.search') }}</span><input v-model="filters.query" type="search" :placeholder="t('directory.searchHint')" maxlength="200" /></label><button type="button" class="directory__filter-button" :aria-expanded="filterOpen" aria-controls="directory-filters" @click="filterOpen = !filterOpen">{{ t('directory.filters') }}<span v-if="activeFilterCount">{{ activeFilterCount }}</span></button><div class="directory__view-toggle" role="group" :aria-label="t('directory.display')"><button type="button" :aria-pressed="viewMode === 'cards'" @click="viewMode = 'cards'">{{ t('directory.cards') }}</button><button type="button" :aria-pressed="viewMode === 'compact'" @click="viewMode = 'compact'">{{ t('directory.list') }}</button></div><button v-if="hasActiveFilters" type="button" class="directory__clear" @click="clearFilters">{{ t('directory.clear') }}</button></div>
      <div v-show="filterOpen" id="directory-filters" class="directory__filters"><label>{{ t('directory.category') }}<select v-model="scope"><option value="all">{{ t('directory.all') }}</option><option value="critical">{{ t('directory.critical') }}</option><option value="recent">{{ t('directory.recent') }}</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ categoryLabel(category.id) }}</option></select></label><label>{{ t('directory.country') }}<select v-model="filters.country"><option value="all">{{ t('directory.allCountries') }}</option><option v-for="country in availableCountries" :key="country" :value="country">{{ country === 'Regional' ? t('directory.region') : country }}</option></select></label><label>{{ t('directory.status') }}<select v-model="filters.status"><option value="all">{{ t('directory.allStatuses') }}</option><option v-for="status in statusValues" :key="status" :value="status">{{ t(`directory.statusValues.${status}`) }}</option></select></label><label>{{ t('directory.criticality') }}<select v-model="filters.criticality" @change="criticalOnly = false"><option value="all">{{ t('directory.allCriticalities') }}</option><option v-for="priority in priorityValues" :key="priority" :value="priority">{{ t(`directory.criticalityValues.${priority}`) }}</option></select></label></div>
    </div>
    <div class="directory__results vph-scroll" :aria-busy="isLoading" tabindex="0" :aria-label="t('directory.title')"><div v-if="isLoading && !workspaceLinks.length" class="directory__grid"><SkeletonCard v-for="n in 4" :key="n" /></div><div v-else-if="source === 'unavailable'" class="directory__empty"><Icon name="shield" :size="28" /><h2>{{ t('directory.unavailableTitle') }}</h2><p>{{ t('directory.unavailableWarning') }}</p><button type="button" @click="previewDirectory">{{ t('directory.preview') }}</button></div><div v-else-if="workspaceLinks.length === 0" class="directory__empty"><Icon name="search" :size="28" /><h2>{{ t('directory.emptyTitle') }}</h2><p>{{ t('directory.empty') }}</p><button v-if="hasActiveFilters" type="button" @click="clearFilters">{{ t('directory.clear') }}</button></div><div v-else class="directory__grid" :class="{ 'directory__grid--list': viewMode === 'compact' }"><VaultCard v-for="link in workspaceLinks" :key="link.id" :link="link" :accent="categoryMap.get(link.category)?.color || 'var(--color-purple-400)'" :icon="categoryMap.get(link.category)?.icon || 'folder'" :compact="viewMode === 'compact'" /></div><p class="directory__content-note">{{ t('directory.contentNote') }}</p></div>
  </section>
</template>

<style lang="scss" scoped>
.directory { position: relative; height: 100%; display: flex; flex-direction: column; min-height: 0; max-width: 1440px; margin-inline: auto; padding: 20px clamp(16px, 3vw, 40px) 0; gap: 20px; }
.directory__tools { flex: none; min-width: 0; }
.directory__breadcrumb { display: flex; gap: 10px; font-size: 12px; color: var(--color-text-200); margin-bottom: 16px; }
.directory__breadcrumb button { color: var(--color-text-300); border: 0; padding: 0; background: none; cursor: pointer; }
.directory__header { display: flex; gap: 16px; align-items: center; justify-content: space-between; }
.directory__header h1 { font-size: clamp(24px, 3vw, 34px); font-weight: 650; line-height: 1.15; }
.directory__count { flex: none; font-size: 12px; color: var(--color-text-200); white-space: nowrap; }
.directory__count strong { color: var(--color-text-400); font-size: 20px; margin-right: 4px; }
.directory__source { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; font-size: 11px; line-height: 1.5; color: var(--color-text-200); margin-top: 14px; }
.directory__source-label { color: var(--color-text-300); border: 1px solid var(--color-card-border); padding: 3px 8px; border-radius: 5px; }
.directory__source-label.is-stale,.directory__source-label.is-unavailable,.directory__source-label.is-mock { color: var(--color-orange-400); }
.directory__refresh { margin-left: auto; display: inline-flex; gap: 6px; align-items: center; min-height: 36px; padding: 6px; color: var(--color-text-300); border: 0; background: none; cursor: pointer; }
.directory__refresh:disabled { cursor: wait; opacity: .6; }
.directory__notice { padding: 8px 12px; margin-top: 8px; border-left: 2px solid var(--color-orange-400); color: var(--color-text-300); background: var(--color-orange-muted); font-size: 12px; line-height: 1.5; }
.directory__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 16px; }
.directory__search { flex: 1; min-width: min(100%, 220px); display: flex; align-items: center; gap: 10px; min-height: 44px; border: 1px solid var(--color-card-border-hover); border-radius: 7px; padding: 8px 12px; color: var(--color-text-200); background: var(--color-card-bg); }
.directory__search input { width: 100%; min-width: 0; font-size: 14px; color: var(--color-text-400); border: 0; background: none; }
.directory__filter-button,.directory__clear,.directory__view-toggle button,.directory__empty button { min-height: 44px; padding: 8px 12px; font-size: 12px; line-height: 1.4; border: 1px solid var(--color-card-border); border-radius: 6px; background: var(--color-card-bg); color: var(--color-text-300); cursor: pointer; }
.directory__filter-button { display: inline-flex; align-items: center; gap: 8px; }
.directory__filter-button span { border-radius: 4px; padding: 1px 6px; background: var(--color-beige-600); }
.directory__view-toggle { display: flex; }
.directory__view-toggle button { border-radius: 0; }
.directory__view-toggle button:first-child { border-radius: 6px 0 0 6px; }
.directory__view-toggle button:last-child { border-radius: 0 6px 6px 0; border-left: 0; }
.directory__view-toggle button[aria-pressed="true"] { color: var(--color-text-400); background: var(--color-beige-600); border-color: var(--color-card-border-hover); }
.directory__clear { border-color: transparent; background: none; }
.directory__filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 12px; padding: 16px; border-radius: 8px; border: 1px solid var(--color-card-border); background: var(--color-card-bg); max-height: min(34dvh, 260px); overflow-y: auto; }
.directory__filters label { min-width: 0; display: flex; flex-direction: column; gap: 6px; color: var(--color-text-200); font-size: 12px; }
.directory__filters select { min-width: 0; width: 100%; min-height: 44px; padding: 6px 8px; border: 1px solid var(--color-card-border-hover); border-radius: 5px; background: var(--space-navy); color: var(--color-text-400); font: inherit; }
.directory__results { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding-bottom: 28px; overscroll-behavior: contain; }
.directory__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr)); gap: 16px; }
.directory__grid--list { grid-template-columns: 1fr; }
.directory__empty { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; max-width: 600px; padding: clamp(24px, 5vw, 56px) 0; color: var(--color-text-300); }
.directory__empty h2 { font-size: 20px; color: var(--color-text-400); }
.directory__empty p { font-size: 14px; line-height: 1.65; }
.directory__content-note { color: var(--color-text-200); font-size: 11px; line-height: 1.5; margin-top: 20px; }
@media(max-width:760px) { .directory__filters { grid-template-columns: repeat(2,minmax(0,1fr)); } }
@media(max-width:540px) { .directory { padding: 12px 12px 0; gap: 12px; } .directory__breadcrumb,.directory__fetch-time { display: none; } .directory__header h1 { font-size: 23px; } .directory__count { font-size: 11px; } .directory__count strong { font-size: 17px; } .directory__source { margin-top: 8px; } .directory__refresh { min-height: 44px; } .directory__toolbar { margin-top: 8px; } .directory__search { flex-basis: 100%; } .directory__filter-button,.directory__view-toggle button,.directory__clear { padding-inline: 10px; } .directory__filters { max-height: 180px; padding: 12px; gap: 8px; } }
</style>
