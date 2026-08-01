<script setup lang="ts">
import { onMounted } from "vue";
import Starfield from "./components/Starfield.vue";
import AppHeader from "./components/AppHeader.vue";
import CommandHero from "./components/CommandHero.vue";
import MissionStrip from "./components/MissionStrip.vue";
import CrewView from "./components/CrewView.vue";
import SectorView from "./components/SectorView.vue";
import CommandPalette from "./components/CommandPalette.vue";
import { useLinks } from "./composables/useLinks";

const { view } = useLinks();

onMounted(() => document.body.classList.remove("is-loading"));
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
