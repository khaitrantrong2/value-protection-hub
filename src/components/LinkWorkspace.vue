<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import type { CategoryId } from "../types/links";
import LinkRow from "./LinkRow.vue";
import LinkCard from "./LinkCard.vue";
import SkeletonCard from "./SkeletonCard.vue";
import Icon from "./Icon.vue";

const { isLoading, error, viewMode, workspaceLinks, scopeLabel, activeCategory, categories, clearFilters } = useLinks();

const accentByCategory = computed(() => {
  const map = new Map<CategoryId, string>();
  for (const c of categories.value) map.set(c.id, c.color);
  return map;
});

function accent(categoryId: CategoryId) {
  return accentByCategory.value.get(categoryId) ?? "var(--accent-gray)";
}
</script>

<template>
  <section id="link-directory" class="workspace" aria-label="Link workspace">
    <header class="workspace__head">
      <div>
        <p class="workspace__eyebrow mono">Showing</p>
        <h2 class="workspace__title">{{ scopeLabel }}</h2>
        <p v-if="activeCategory" class="workspace__desc">{{ activeCategory.description }}</p>
      </div>
    </header>

    <p v-if="error" class="workspace__banner">{{ error }}</p>

    <div v-if="isLoading" class="workspace__grid workspace__grid--cards">
      <SkeletonCard v-for="n in 6" :key="n" />
    </div>

    <div v-else-if="workspaceLinks.length === 0" class="workspace__empty">
      <Icon name="search" :size="28" />
      <p>No links found. Try clearing filters or searching another keyword.</p>
      <button type="button" @click="clearFilters">Clear filters</button>
    </div>

    <div
      v-else
      class="workspace__grid"
      :class="viewMode === 'cards' ? 'workspace__grid--cards' : 'workspace__grid--rows'"
    >
      <template v-if="viewMode === 'cards'">
        <LinkCard v-for="link in workspaceLinks" :key="link.id" :link="link" :accent-color="accent(link.category)" />
      </template>
      <template v-else>
        <LinkRow v-for="link in workspaceLinks" :key="link.id" :link="link" :accent-color="accent(link.category)" />
      </template>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.workspace {
  min-width: 0;
}

.workspace__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.workspace__eyebrow {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-200);
}

.workspace__title {
  font-size: var(--font-size-title-xs);
  font-weight: 800;
  line-height: 1.1;
}

.workspace__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-300);
  margin-top: 2px;
  max-width: 60ch;
}

.workspace__banner {
  background: var(--color-orange-muted);
  color: var(--color-text-400);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
  font-size: var(--font-size-xs);
}

.workspace__grid {
  display: grid;
  gap: var(--space-sm);
}

.workspace__grid--rows {
  grid-template-columns: 1fr;
}

.workspace__grid--cards {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-md);
}

.workspace__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xxxl) var(--space-md);
  color: var(--color-text-200);
  text-align: center;

  button {
    margin-top: var(--space-xs);
    padding: 8px var(--space-lg);
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-card-border-hover);
    background: var(--color-white-400);
    color: var(--color-text-400);
    font-weight: 600;
    font-size: var(--font-size-xs);
    cursor: pointer;
  }
}
</style>
