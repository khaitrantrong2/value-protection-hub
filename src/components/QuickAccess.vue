<script setup lang="ts">
import { useLinks } from "../composables/useLinks";

const { categories, filters } = useLinks();

function select(id: string) {
  filters.categoryId = id as typeof filters.categoryId;
  document.getElementById("link-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <section class="quick-access" aria-label="Quick access categories">
    <div class="quick-access__scroller">
      <button type="button" class="quick-access__chip" :class="{ 'is-active': filters.categoryId === 'all' }" @click="select('all')">
        All
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        class="quick-access__chip"
        :class="{ 'is-active': filters.categoryId === category.id }"
        :style="{ '--chip-accent': category.color }"
        @click="select(category.id)"
      >
        {{ category.name }}
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.quick-access {
  padding: var(--space-md) 0;
}

.quick-access__scroller {
  display: flex;
  gap: var(--space-xs);
  overflow-x: auto;
  padding: 0 var(--space-outer) var(--space-xs);
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 4px;
  }
}

.quick-access__chip {
  flex-shrink: 0;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-card-border-hover);
  background: var(--color-white-400);
  color: var(--color-text-300);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--ease-power2-out);
  white-space: nowrap;

  @include hover {
    &:hover {
      border-color: var(--chip-accent, var(--color-orange-400));
      color: var(--color-text-400);
    }
  }

  &.is-active {
    background: var(--chip-accent, var(--color-orange-400));
    border-color: transparent;
    color: #fff;
  }
}
</style>
