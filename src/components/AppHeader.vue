<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useLinks } from "../composables/useLinks";

const { config } = useLinks();
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
        <a href="#link-directory">Operations</a>
      </nav>
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
    background: rgba(7, 20, 49, 0.72);
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
  justify-content: space-between;
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
</style>
