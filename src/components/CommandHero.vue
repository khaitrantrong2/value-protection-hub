<script setup lang="ts">
import { onMounted, ref } from "vue";
import { gsap, VPH_EASE } from "../motion";
import CommandScene from "./CommandScene.vue";
import StatTile from "./StatTile.vue";
import Icon from "./Icon.vue";
import { useLinks } from "../composables/useLinks";
import { useReducedMotion } from "../composables/useReducedMotion";

const { config, stats, filters, selectScope } = useLinks();
const { prefersReducedMotion } = useReducedMotion();

const heroRef = ref<HTMLElement | null>(null);
const searchRef = ref<HTMLInputElement | null>(null);

function goToWorkspace() {
  document.getElementById("link-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusSearch() {
  selectScope("all");
  goToWorkspace();
}

function viewCritical() {
  selectScope("critical");
  goToWorkspace();
}

onMounted(() => {
  if (!heroRef.value || prefersReducedMotion.value) return;
  const targets = heroRef.value.querySelectorAll("[data-reveal]");
  gsap.from(targets, {
    opacity: 0,
    y: 20,
    duration: 0.7,
    ease: VPH_EASE,
    stagger: 0.07,
  });
});
</script>

<template>
  <section ref="heroRef" class="command-hero">
    <CommandScene />

    <div class="command-hero__content">
      <p class="command-hero__eyebrow mono" data-reveal>Internal · Finance Control Workspace</p>
      <h1 class="command-hero__title" data-reveal>{{ config?.portalName || "Value Protection Hub" }}</h1>
      <p class="command-hero__subtitle" data-reveal>
        {{ config?.subtitle || "Claimback, AR & Finance Control Workspace" }}
      </p>
      <p class="command-hero__description" data-reveal>
        Search trackers, dashboards, SOPs, templates, review files and project workspaces in one place.
      </p>

      <div class="command-hero__search" data-reveal>
        <Icon name="search" :size="18" class="command-hero__search-icon" />
        <input
          ref="searchRef"
          v-model="filters.query"
          type="search"
          class="command-hero__search-input"
          placeholder="Search links, owners, tags, countries…"
          aria-label="Search links"
          @keyup.enter="focusSearch"
        />
        <button type="button" class="command-hero__search-go" @click="focusSearch">
          <Icon name="arrowRight" :size="16" />
        </button>
      </div>

      <div class="command-hero__actions" data-reveal>
        <button type="button" class="command-hero__btn command-hero__btn--ghost" @click="viewCritical">
          <Icon name="spark" :size="15" />
          View critical files
        </button>
        <a
          v-if="config?.adminSheetUrl"
          class="command-hero__btn command-hero__btn--ghost"
          :href="config.adminSheetUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="external" :size="15" />
          Open source sheet
        </a>
      </div>

      <div class="command-hero__stats" data-reveal>
        <StatTile label="Active Links" :value="stats.activeLinks" />
        <StatTile label="Categories" :value="stats.categories" />
        <StatTile label="Critical Files" :value="stats.criticalFiles" />
        <StatTile label="Restricted" :value="stats.restrictedItems" />
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.command-hero {
  position: relative;
  min-height: 78svh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 72% 40%, #0e2352, transparent 52%),
    linear-gradient(160deg, #071431 0%, #0b1c42 100%);
  color: var(--color-command-text);
  padding: calc(var(--height-header) + var(--space-md)) var(--space-outer) var(--space-lg);

  @include mq(md) {
    min-height: 62vh;
  }
}

.command-hero__content {
  position: relative;
  z-index: var(--z-index-cards);
  max-width: 600px;
  width: 100%;
}

.command-hero__eyebrow {
  font-size: var(--font-size-xs);
  color: var(--color-cyan-400);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: var(--space-sm);
}

.command-hero__title {
  font-size: var(--font-size-title-md);
  font-weight: 900;
  line-height: var(--line-height-title);
  letter-spacing: -0.01em;

  @include mq(md) {
    font-size: var(--font-size-title-lg);
  }
}

.command-hero__subtitle {
  font-size: var(--font-size-md);
  color: var(--color-cyan-400);
  margin-top: var(--space-xs);
  font-weight: 600;
}

.command-hero__description {
  font-size: var(--font-size-sm);
  color: var(--color-command-text-muted);
  margin-top: var(--space-xs);
  max-width: 46ch;
}

.command-hero__search {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  padding: var(--space-xs) var(--space-xs) var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--color-command-border);
  backdrop-filter: blur(8px);
  transition: border-color 0.2s var(--ease-power2-out);
  max-width: 480px;

  &:focus-within {
    border-color: var(--color-cyan-400);
  }
}

.command-hero__search-icon {
  color: var(--color-command-text-muted);
  flex-shrink: 0;
}

.command-hero__search-input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  outline: none;
  color: #fff;
  font-size: var(--font-size-sm);

  &::placeholder {
    color: var(--color-command-text-muted);
  }
}

.command-hero__search-go {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--color-orange-400);
  color: #fff;
  cursor: pointer;
  transition: filter 0.2s var(--ease-power2-out);

  @include hover {
    &:hover {
      filter: brightness(1.08);
    }
  }
}

.command-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.command-hero__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.2s var(--ease-power2-out);

  &--ghost {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    border: 1px solid var(--color-command-border);

    @include hover {
      &:hover {
        background: rgba(255, 255, 255, 0.12);
      }
    }
  }
}

.command-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-lg);
}
</style>
