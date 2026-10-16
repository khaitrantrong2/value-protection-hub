<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import { useLocale } from "../i18n";
const { source, isLoading, refreshedAt } = useLinks();
const { locale, t } = useLocale();
const state = computed(() => source.value || "loading");
const fetched = computed(() => {
  if (!refreshedAt.value) return "";
  const date = new Date(refreshedAt.value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(locale.value === "vi" ? "vi-VN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
});
</script>

<template>
  <div class="crew-source" :class="`crew-source--${state}`" role="status" aria-live="polite" :aria-busy="isLoading">
    <div><strong tabindex="0" :title="[t(`crew.source.${state}Body`), fetched ? t('crew.source.fetched', { time: fetched }) : ''].filter(Boolean).join(' ')">{{ t(`crew.source.${state}`) }}</strong><span v-if="isLoading && source">{{ t('crew.source.refreshing') }}</span><p v-if="state !== 'live'">{{ t(`crew.source.${state}Body`) }}</p></div>
  </div>
</template>

<style scoped>
.crew-source { display: flex; align-items: center; border: 1px solid var(--color-card-border); border-radius: 6px; padding: 8px 10px; background: var(--space-navy); }
.crew-source>div { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 16px; min-width: 0; }
.crew-source strong { font-size: 10px; color: var(--color-cyan-400); font-weight: 500; }
.crew-source small,.crew-source span { font-size: 11px; color: var(--color-text-300); }
.crew-source p { flex-basis: 100%; color: var(--color-text-300); font-size: 11px; line-height: 1.5; max-width: 85ch; }
.crew-source--stale strong,.crew-source--unavailable strong,.crew-source--mock strong { color: var(--color-orange-400); }
.crew-source--live { border: 0; background: transparent; padding: 0; }
.crew-source strong:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 3px; }
</style>
