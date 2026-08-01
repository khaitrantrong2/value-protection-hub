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
import { useReducedMotion } from "./composables/useReducedMotion";
import { useLenisScroll } from "./composables/useLenisScroll";

const { view } = useLinks();
const { prefersReducedMotion } = useReducedMotion();
useLenisScroll(() => prefersReducedMotion.value);

onMounted(() => document.body.classList.remove("is-loading"));
</script>

<template>
  <Starfield />
  <AppHeader />

  <main>
    <template v-if="view === 'home'">
      <CommandHero />
      <MissionStrip />
    </template>
    <CrewView v-else-if="view === 'crew'" />
    <SectorView v-else />
  </main>

  <CommandPalette />
</template>

<style lang="scss">
main {
  position: relative;
  z-index: 1;
  background: var(--grad-cosmos);
  background-attachment: fixed;
  min-height: 100svh;
}
</style>
