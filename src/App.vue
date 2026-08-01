<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import Starfield from "./components/Starfield.vue";
import AppHeader from "./components/AppHeader.vue";
import CommandHero from "./components/CommandHero.vue";
import MissionStrip from "./components/MissionStrip.vue";
import CrewView from "./components/CrewView.vue";
import MemberView from "./components/MemberView.vue";
import SectorView from "./components/SectorView.vue";
import CommandPalette from "./components/CommandPalette.vue";
import { useLinks } from "./composables/useLinks";
import { sectors } from "./data/sectors";

const { view, paletteOpen, openSector, goHome } = useLinks();

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

function onKeydown(e: KeyboardEvent) {
  if (paletteOpen.value || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

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
  document.body.classList.remove("is-loading");
  window.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Starfield />

  <div class="app-shell">
    <AppHeader />

    <main class="app-main">
      <div v-if="view === 'home'" class="app-view vph-scroll">
        <CommandHero />
        <MissionStrip />
      </div>
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
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
