<script setup lang="ts">
import { onMounted } from "vue";
import AppHeader from "./components/AppHeader.vue";
import CommandHero from "./components/CommandHero.vue";
import WorkspaceControls from "./components/WorkspaceControls.vue";
import CategoryNavigator from "./components/CategoryNavigator.vue";
import LinkWorkspace from "./components/LinkWorkspace.vue";
import QuickPanel from "./components/QuickPanel.vue";
import OperationsMap from "./components/OperationsMap.vue";
import MaintenanceAdmin from "./components/MaintenanceAdmin.vue";
import CommandPalette from "./components/CommandPalette.vue";
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
    <WorkspaceControls />

    <div class="shell">
      <OperationsMap />

      <div class="shell__grid">
        <div class="shell__nav">
          <CategoryNavigator />
        </div>
        <div class="shell__center">
          <LinkWorkspace />
        </div>
        <div class="shell__panel">
          <QuickPanel />
        </div>
      </div>
    </div>

    <MaintenanceAdmin />
  </main>

  <CommandPalette />
</template>

<style lang="scss">
main {
  position: relative;
  background: var(--grad-cosmos);
  background-attachment: fixed;
}

.shell {
  max-width: 1440px;
  margin: 0 auto;
  padding: var(--space-lg) var(--space-outer) var(--space-xxl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.shell__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

.shell__nav {
  z-index: 5;
}

.shell__center {
  min-width: 0;
}

.shell__panel {
  display: none;
}

@include mq(lg) {
  .shell__grid {
    grid-template-columns: 236px minmax(0, 1fr) 300px;
    align-items: start;
  }

  .shell__nav {
    position: sticky;
    top: calc(var(--height-header) + 104px);
  }

  .shell__panel {
    display: block;
    position: sticky;
    top: calc(var(--height-header) + 104px);
  }
}
</style>
