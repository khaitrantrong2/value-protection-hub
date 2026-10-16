<script setup lang="ts">
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import Starfield from "./components/Starfield.vue";
import AppHeader from "./components/AppHeader.vue";
import CommandHero from "./components/CommandHero.vue";
import CommandPalette from "./components/CommandPalette.vue";
import { useLinks } from "./composables/useLinks";
import { sectors } from "./data/sectors";
import { useAtlas } from "./composables/useAtlas";
import { startLocaleSync } from "./i18n";
import StartHere from "./components/StartHere.vue";

const CrewView = defineAsyncComponent(() => import('./components/CrewView.vue'));
const MemberView = defineAsyncComponent(() => import('./components/MemberView.vue'));
const SectorView = defineAsyncComponent(() => import('./components/SectorView.vue'));
const AtlasView = defineAsyncComponent(() => import('./components/atlas/AtlasView.vue'));

const { view, paletteOpen, openSector, goHome } = useLinks();
const { data: atlasData, source: atlasSource, isLoading: atlasLoading, error: atlasError, refreshedAt: atlasRefreshedAt, refresh: refreshAtlas, previewDraft: previewAtlasDraft } = useAtlas();
let atlasRequested = false;
let stopLocaleSync: (() => void) | undefined;
watch(view, (next) => {
  if (next === "atlas" && !atlasRequested) {
    atlasRequested = true;
    void refreshAtlas();
  }
}, { immediate: true });

watch(view, async (next, previous) => {
  if (next === previous || next === 'atlas') return;
  await nextTick();
  document.getElementById('main-content')?.focus({ preventScroll: true });
});

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function onKeydown(e: KeyboardEvent) {
  // Native dialogs own Escape and their focused controls; page shortcuts must not navigate underneath them.
  const target = e.target as HTMLElement | null;
  if (target?.closest?.("dialog[open], [data-hub-inspector], [data-protector-fleet]")) return;
  if (view.value === "atlas" || e.defaultPrevented || paletteOpen.value || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

  // 1–8 → jump straight to that sector
  const n = Number(e.key);
  if (n >= 1 && n <= sectors.length) {
    e.preventDefault();
    openSector(sectors[n - 1].categoryId);
    return;
  }
  // 0 or Escape → back to the universe (home)
  if (e.key === "0" || (e.key === "Escape" && view.value !== "home")) {
    e.preventDefault();
    goHome();
  }
}

onMounted(() => {
  stopLocaleSync = startLocaleSync();
  document.body.classList.remove("is-loading");
  window.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => { window.removeEventListener("keydown", onKeydown); stopLocaleSync?.(); });
</script>

<template>
  <Starfield />

  <div class="app-shell">
    <AppHeader />

    <main id="main-content" class="app-main" tabindex="-1">
      <div v-if="view === 'home'" class="app-view vph-scroll">
        <CommandHero />
      </div>
      <StartHere v-else-if="view === 'start'" />
      <AtlasView v-else-if="view === 'atlas'" :data="atlasData" :source="atlasSource" :is-loading="atlasLoading" :error="atlasError" :refreshed-at="atlasRefreshedAt" @refresh="refreshAtlas" @preview="previewAtlasDraft" />
      <CrewView v-else-if="view === 'crew'" />
      <MemberView v-else-if="view === 'member'" />
      <SectorView v-else />
    </main>
  </div>

  <CommandPalette />
</template>

<style lang="scss">
.app-shell {
  position: relative;
  z-index: 1;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-main {
  flex: 1;
  min-height: 0;
  position: relative;
}

.app-view {
  height: 100%;
  overflow-y: hidden;
  overflow-x: hidden;
}
</style>
