<script setup lang="ts">
import { useLinks } from "../composables/useLinks";
import ViewModeToggle from "./ViewModeToggle.vue";
import Icon from "./Icon.vue";

const {
  filters,
  viewMode,
  criticalOnly,
  availableCountries,
  workspaceLinks,
  scopeLabel,
  hasActiveFilters,
  clearFilters,
  paletteOpen,
} = useLinks();

const statuses = ["Active", "Review", "Blocked", "Archived"] as const;
const criticalities = ["High", "Medium", "Low"] as const;
</script>

<template>
  <div class="controls">
    <div class="controls__inner">
      <div class="controls__row controls__row--primary">
        <label class="controls__search">
          <Icon name="search" :size="16" class="controls__search-icon" />
          <input v-model="filters.query" type="search" placeholder="Search this workspace…" aria-label="Search links" />
        </label>

        <button type="button" class="controls__palette" title="Command palette" @click="paletteOpen = true">
          <Icon name="command" :size="15" />
          <kbd class="mono">Ctrl K</kbd>
        </button>

        <ViewModeToggle v-model="viewMode" />
      </div>

      <div class="controls__row controls__row--filters">
        <span class="controls__summary">
          <strong>{{ workspaceLinks.length }}</strong> in <span class="controls__scope">{{ scopeLabel }}</span>
        </span>

        <span class="controls__spacer"></span>

        <label class="controls__select">
          <select v-model="filters.country" aria-label="Country">
            <option value="all">All countries</option>
            <option v-for="country in availableCountries" :key="country" :value="country">{{ country }}</option>
          </select>
        </label>
        <label class="controls__select">
          <select v-model="filters.status" aria-label="Status">
            <option value="all">All statuses</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>
        <label class="controls__select">
          <select v-model="filters.criticality" aria-label="Criticality">
            <option value="all">All criticality</option>
            <option v-for="c in criticalities" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>

        <button
          type="button"
          class="controls__toggle"
          :class="{ 'is-on': criticalOnly }"
          :aria-pressed="criticalOnly"
          @click="criticalOnly = !criticalOnly"
        >
          <Icon name="spark" :size="14" />
          Critical only
        </button>

        <button v-if="hasActiveFilters" type="button" class="controls__clear" @click="clearFilters">
          <Icon name="close" :size="13" />
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.controls {
  position: sticky;
  top: var(--height-header);
  z-index: var(--z-index-layout);
  background: rgba(21, 10, 48, 0.78);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-command-border);
}

.controls__inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: var(--space-sm) var(--space-outer);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.controls__row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.controls__row--filters {
  flex-wrap: wrap;
}

.controls__search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 8px var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--color-field-bg);
  border: 1px solid var(--color-card-border-hover);

  &:focus-within {
    border-color: var(--color-cyan-500);
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: none;
    font-size: var(--font-size-sm);
  }
}

.controls__search-icon {
  color: var(--color-text-200);
  flex-shrink: 0;
}

.controls__palette {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 8px var(--space-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-card-border-hover);
  background: var(--color-field-bg);
  color: var(--color-text-300);
  cursor: pointer;
  transition: all 0.18s var(--ease-power2-out);

  kbd {
    font-size: 10px;
    color: var(--color-text-200);
  }

  @include hover {
    &:hover {
      border-color: var(--color-navy-400);
      color: var(--color-text-400);
    }
  }

  @include mq(sm, max) {
    display: none;
  }
}

.controls__summary {
  font-size: var(--font-size-xs);
  color: var(--color-text-300);

  strong {
    color: var(--color-text-400);
  }
}

.controls__scope {
  color: var(--color-orange-400);
  font-weight: 700;
}

.controls__spacer {
  flex: 1;
}

.controls__select select {
  padding: 6px var(--space-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-card-border-hover);
  background: var(--color-field-bg);
  font-size: var(--font-size-xs);
  font-family: inherit;
  cursor: pointer;
}

.controls__toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px var(--space-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-card-border-hover);
  background: var(--color-field-bg);
  color: var(--color-text-300);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s var(--ease-power2-out);

  &.is-on {
    background: var(--color-orange-400);
    border-color: transparent;
    color: #fff;
  }
}

.controls__clear {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px var(--space-sm);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-card-border-hover);
  background: transparent;
  color: var(--color-text-300);
  font-size: var(--font-size-xs);
  cursor: pointer;

  @include hover {
    &:hover {
      color: var(--color-text-400);
      border-color: var(--color-text-300);
    }
  }
}
</style>
