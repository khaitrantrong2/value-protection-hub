<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import { useLocale } from "../i18n";
import Icon from "./Icon.vue";

const { source, isLoading, refreshedAt, refreshLinks } = useLinks();
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
    <div><strong :title="t(`crew.source.${state}Body`)">{{ t(`crew.source.${state}`) }}</strong><span v-if="isLoading && source">{{ t('crew.source.refreshing') }}</span><small v-if="fetched">{{ t('crew.source.fetched', { time: fetched }) }}</small><p v-if="state !== 'live'">{{ t(`crew.source.${state}Body`) }}</p></div>
    <button type="button" :disabled="isLoading" @click="refreshLinks"><Icon name="clock" :size="15" />{{ t('crew.source.refresh') }}</button>
  </div>
</template>

<style scoped>
.crew-source { display: flex; justify-content: space-between; align-items: center; gap: 16px; border: 1px solid var(--color-card-border); border-radius: var(--radius-md); padding: 14px 16px; background: var(--space-navy); }
.crew-source>div { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 16px; min-width: 0; }
.crew-source strong { font-size: 12px; color: var(--color-cyan-400); font-weight: 500; }
.crew-source small,.crew-source span { font-size: 11px; color: var(--color-text-300); }
.crew-source p { flex-basis: 100%; color: var(--color-text-300); font-size: 12px; line-height: 1.6; max-width: 85ch; }
.crew-source--stale strong,.crew-source--unavailable strong,.crew-source--mock strong { color: var(--color-orange-400); }
.crew-source--live { border: 0; background: transparent; padding: 0; }
button { display: inline-flex; flex: none; gap: 8px; align-items: center; min-height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 6px; background: transparent; color: var(--color-text-400); font: inherit; font-size: 12px; cursor: pointer; }
button:not(:disabled):hover { border-color: var(--color-cyan-400); background: var(--color-command-bg-soft); }
button:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 3px; }
button:disabled { opacity: .5; cursor: default; }
@media(max-width:600px) { .crew-source { flex-wrap: wrap; gap: 8px; } button { padding-left: 0; border-color: transparent; } }
</style>
