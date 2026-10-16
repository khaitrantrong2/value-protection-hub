<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { AtlasPayload } from "../../types/atlas";
import Icon from "../Icon.vue";

const props = defineProps<{ source: "live" | "demo" | "unavailable"; meta?: AtlasPayload["meta"]; error?: string; refreshedAt?: string; isLoading: boolean }>();
const emit = defineEmits<{ refresh: [] }>();
const details = ref<HTMLDetailsElement | null>(null);
const summary = ref<HTMLElement | null>(null);
const label = computed(() => props.source === "live" ? props.error ? "Google Sheets · retained copy" : "Google Sheets · live source" : props.source === "demo" ? "Bundled demo · not live source" : props.isLoading ? "Loading source" : "Source unavailable");
function close() { if (details.value) details.value.open = false; summary.value?.focus({ preventScroll: true }); }
function outside(event: PointerEvent) { if (details.value?.open && !details.value.contains(event.target as Node)) details.value.open = false; }
onMounted(() => window.addEventListener("pointerdown", outside));
onBeforeUnmount(() => window.removeEventListener("pointerdown", outside));
</script>

<template>
  <details ref="details" class="atlas-source-info" @keydown.esc.stop.prevent="close">
    <summary ref="summary" :aria-label="`Source Info: ${label}`"><span aria-hidden="true">ⓘ</span><span class="source-info-text">Source Info</span><span v-if="source !== 'live' || error" class="source-signal" aria-hidden="true">!</span></summary>
    <section class="atlas-source-popover" aria-label="Source and map information" data-lenis-prevent>
      <header><h2>Source Info</h2><button type="button" aria-label="Close Source Info" @click="close"><Icon name="close" :size="16" /></button></header>
      <p class="source-label" role="status">{{ label }}</p>
      <dl><dt>Publication</dt><dd>{{ meta?.processStatus || 'Draft' }}</dd><dt>Content version</dt><dd>{{ meta?.contentVersion || 'D0' }}</dd><dt>Effective from</dt><dd>{{ meta?.effectiveFrom || 'Pending approval' }}</dd><dt>Content updated</dt><dd>{{ meta?.updatedAt || 'Not specified' }}</dd><dt>Fetched</dt><dd>{{ refreshedAt || 'No live-source fetch timestamp' }}</dd></dl>
      <p v-if="error" class="source-warning" role="alert">{{ error }}</p>
      <p class="source-limit">Reported practice is process-owner context, not tested operating effectiveness or an approved SOP.</p>
      <details class="atlas-map-help"><summary>Map controls & notation</summary><p>Drag / scroll to pan. Ctrl/⌘ + scroll or +/− to zoom. Fit restores the overview. Click a stage to read its guide.</p><p>Arrow keys pan; F fits; 1–8 opens the chapter guide. Dashed arrow: rework. Data lane connectors show supporting dependencies, not extra business stages.</p></details>
      <button type="button" class="source-refresh" :disabled="isLoading" @click="emit('refresh')"><Icon name="clock" :size="16" />{{ isLoading ? 'Loading source…' : 'Refresh source' }}</button>
    </section>
  </details>
</template>

<style scoped>
.atlas-source-info { position: relative; flex: none; font-size: 12px; }
.atlas-source-info>summary { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 8px; list-style: none; cursor: pointer; background: var(--space-navy); color: var(--color-text-400); white-space: nowrap; }
.atlas-source-info>summary::-webkit-details-marker { display: none; }
.source-signal { color: var(--color-orange-400); font-weight: 600; }
.atlas-source-popover { position: absolute; top: calc(100% + 8px); right: 0; z-index: var(--z-index-cards); width: min(390px,calc(100vw - 32px)); max-height: calc(100dvh - var(--height-header) - 128px); overflow: auto; overscroll-behavior: contain; padding: 16px; border: 1px solid var(--color-card-border-hover); border-radius: var(--radius-md); background: var(--space-navy); box-shadow: 0 16px 48px var(--space-abyss); scrollbar-width: thin; }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h2 { font-size: 16px; font-weight: 500; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 6px; color: var(--color-text-400); background: var(--space-deep); cursor: pointer; }
header button { width: 44px; padding: 8px; }
.source-label { margin-top: 12px; color: var(--color-cyan-400); font-size: 13px; }
dl { display: grid; grid-template-columns: 100px minmax(0,1fr); gap: 8px 12px; padding: 16px 0; margin: 16px 0; border-block: 1px solid var(--color-card-border); font-size: 11px; line-height: 1.5; }
dt { color: var(--color-text-300); } dd { margin: 0; color: var(--color-text-400); overflow-wrap: anywhere; }
p { font-size: 12px; line-height: 1.6; color: var(--color-text-300); overflow-wrap: anywhere; }
.source-warning { padding: 8px; border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); margin-bottom: 12px; }
.atlas-map-help { margin-top: 16px; font-size: 12px; color: var(--color-text-300); }
.atlas-map-help summary { cursor: pointer; min-height: 44px; padding: 12px 0; color: var(--color-text-400); }
.atlas-map-help p+p { margin-top: 8px; }
.source-refresh { margin-top: 16px; width: 100%; font-size: 12px; }
summary:focus-visible,button:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
@media(max-width:540px) { .atlas-source-info>summary { position: relative; width: 44px; padding: 8px; justify-content: center; } .source-info-text { display: none; } .source-signal { position: absolute; right: 4px; top: 3px; font-size: 10px; } }
</style>
