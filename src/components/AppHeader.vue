<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useLinks } from "../composables/useLinks";
import Icon from "./Icon.vue";

const { config, paletteOpen } = useLinks();
const scrolled = ref(false);

function handleScroll() {
  scrolled.value = window.scrollY > 40;
}

onMounted(() => window.addEventListener("scroll", handleScroll, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", handleScroll));
</script>

<template>
  <header class="app-header" :class="{ 'app-header--scrolled': scrolled }">
    <div class="app-header__inner">
      <div class="app-header__brand">
        <span class="app-header__mark" aria-hidden="true"></span>
        <span class="app-header__name">{{ config?.portalName || "Value Protection Hub" }}</span>
      </div>

      <nav class="app-header__nav">
        <a href="#link-directory">Directory</a>
        <a href="#operations">Operations</a>
      </nav>

      <div class="app-header__actions">
        <a
          v-if="config?.adminSheetUrl"
          class="app-header__source"
          :href="config.adminSheetUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="external" :size="14" />
          Source Sheet
        </a>
        <button type="button" class="app-header__cmd" @click="paletteOpen = true">
          <Icon name="search" :size="14" />
          <span>Search</span>
          <kbd class="mono">Ctrl K</kbd>
        </button>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-index-header);
  height: var(--height-header);
  display: flex;
  align-items: center;
  transition:
    background 0.3s var(--ease-power2-out),
    backdrop-filter 0.3s var(--ease-power2-out),
    border-color 0.3s var(--ease-power2-out);
  border-bottom: 1px solid transparent;

  &--scrolled {
    background: rgba(7, 20, 49, 0.82);
    backdrop-filter: blur(12px);
    border-bottom-color: var(--color-command-border);
  }
}

.app-header__inner {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--space-outer);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: #fff;
  font-weight: 700;
}

.app-header__mark {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--color-cyan-400), var(--color-orange-400));
}

.app-header__name {
  font-size: var(--font-size-sm);
}

.app-header__nav {
  display: none;
  gap: var(--space-lg);

  a {
    font-size: var(--font-size-xs);
    color: rgba(255, 255, 255, 0.75);
    transition: color 0.2s;

    @include hover {
      &:hover {
        color: #fff;
      }
    }
  }

  @include mq(md) {
    display: flex;
  }
}

.app-header__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.app-header__source {
  display: none;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  padding: 6px var(--space-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-command-border);

  @include hover {
    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
  }

  @include mq(md) {
    display: inline-flex;
  }
}

.app-header__cmd {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  padding: 6px var(--space-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-command-border);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.2s var(--ease-power2-out);

  span {
    @include mq(sm, max) {
      display: none;
    }
  }

  kbd {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid var(--color-command-border);
    border-radius: var(--radius-sm);
    padding: 1px 5px;
  }

  @include hover {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  }
}
</style>
