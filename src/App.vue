<script setup lang="ts">
import { onMounted } from "vue";
import AppHeader from "./components/AppHeader.vue";
import CommandHero from "./components/CommandHero.vue";
import QuickAccess from "./components/QuickAccess.vue";
import LinkDirectory from "./components/LinkDirectory.vue";
import OperationsMap from "./components/OperationsMap.vue";
import MaintenanceAdmin from "./components/MaintenanceAdmin.vue";
import { useReducedMotion } from "./composables/useReducedMotion";
import { useLenisScroll } from "./composables/useLenisScroll";

const { prefersReducedMotion } = useReducedMotion();
useLenisScroll(() => prefersReducedMotion.value);

onMounted(() => {
  document.body.classList.remove("is-loading");
});
</script>

<template>
  <AppHeader />
  <main>
    <CommandHero />
    <div class="app__body">
      <QuickAccess />
      <LinkDirectory />
      <OperationsMap />
    </div>
    <MaintenanceAdmin />
  </main>
</template>

<style lang="scss">
.app__body {
  background: var(--color-background-400);
}
</style>
