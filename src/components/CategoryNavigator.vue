<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import type { CategoryDef, Scope } from "../types/links";
import Icon from "./Icon.vue";

const { categories, scope, selectScope, baseLinks, criticalLinks, recentCount, categoryCounts } = useLinks();

/** Shorter labels for the narrow nav column; full names stay in the title attribute + workspace heading. */
const SHORT_LABELS: Partial<Record<string, string>> = {
  "netsuite-saved-searches": "NetSuite",
  "templates-upload-files": "Templates",
  "sop-policy-training": "SOP & Training",
  "country-working-files": "Country Files",
  "admin-access": "Admin",
};

function navLabel(category: CategoryDef): string {
  return SHORT_LABELS[category.id] ?? category.name;
}

const specials = computed(() => [
  { id: "all" as Scope, name: "All links", icon: "list", count: baseLinks.value.length },
  { id: "critical" as Scope, name: "Critical", icon: "spark", count: criticalLinks.value.length },
  { id: "recent" as Scope, name: "Recently updated", icon: "clock", count: recentCount.value },
]);

function pick(id: Scope) {
  selectScope(id);
}
</script>

<template>
  <nav class="cat-nav" aria-label="Category navigator">
    <ul class="cat-nav__group">
      <li v-for="item in specials" :key="item.id">
        <button type="button" class="cat-nav__item" :class="{ 'is-active': scope === item.id }" @click="pick(item.id)">
          <Icon :name="item.icon" :size="16" class="cat-nav__icon" />
          <span class="cat-nav__label">{{ item.name }}</span>
          <span class="cat-nav__count">{{ item.count }}</span>
        </button>
      </li>
    </ul>

    <p class="cat-nav__heading mono">Categories</p>
    <ul class="cat-nav__group">
      <li v-for="category in categories" :key="category.id">
        <button
          type="button"
          class="cat-nav__item"
          :class="{ 'is-active': scope === category.id }"
          :style="{ '--nav-accent': category.color }"
          :title="category.name"
          @click="pick(category.id)"
        >
          <span class="cat-nav__swatch" aria-hidden="true"></span>
          <span class="cat-nav__label">{{ navLabel(category) }}</span>
          <span class="cat-nav__count">{{ categoryCounts.get(category.id) ?? 0 }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style lang="scss" scoped>
.cat-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.cat-nav__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cat-nav__heading {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-200);
  padding: var(--space-sm) var(--space-sm) var(--space-xxs);
}

.cat-nav__item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: 8px var(--space-sm);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-300);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all 0.16s var(--ease-power2-out);

  @include hover {
    &:hover {
      background: var(--color-beige-600);
      color: var(--color-text-400);
    }
  }

  &.is-active {
    background: rgba(79, 217, 255, 0.1);
    color: var(--color-text-400);
    border-color: rgba(79, 217, 255, 0.4);
  }
}

.cat-nav__icon {
  color: var(--color-text-200);
  flex-shrink: 0;
}

.cat-nav__swatch {
  width: 9px;
  height: 9px;
  border-radius: 3px;
  background: var(--nav-accent, var(--accent-gray));
  flex-shrink: 0;
}

.cat-nav__label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-nav__count {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-200);
  background: var(--color-beige-600);
  border-radius: var(--radius-pill);
  padding: 1px 8px;
  min-width: 24px;
  text-align: center;
}

.cat-nav__item.is-active .cat-nav__count {
  background: var(--color-orange-muted);
  color: var(--color-orange-400);
}

/* Horizontal scroll variant on tablet/mobile */
@include mq(lg, max) {
  .cat-nav {
    flex-direction: row;
    align-items: center;
    gap: var(--space-xs);
    overflow-x: auto;
    padding-bottom: var(--space-xxs);
    scrollbar-width: thin;
  }

  .cat-nav__group {
    flex-direction: row;
    gap: var(--space-xs);
  }

  .cat-nav__heading {
    display: none;
  }

  .cat-nav__item {
    width: auto;
    white-space: nowrap;
    border: 1px solid var(--color-card-border);
    background: var(--color-field-bg);
    border-radius: var(--radius-pill);
  }

  .cat-nav__label {
    overflow: visible;
  }
}
</style>
