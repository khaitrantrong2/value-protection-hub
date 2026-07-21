<script setup lang="ts">
import { useLinks } from "../composables/useLinks";
import LinkCard from "./LinkCard.vue";
import SkeletonCard from "./SkeletonCard.vue";
import Icon from "./Icon.vue";

const { isLoading, error, groupedByCategory, filteredLinks, filters, availableCountries, clearFilters } = useLinks();

const statuses = ["Active", "Review", "Blocked", "Archived"] as const;
const criticalities = ["High", "Medium", "Low"] as const;
</script>

<template>
  <section id="link-directory" class="link-directory">
    <div class="link-directory__intro">
      <h2 class="link-directory__title">Link Directory</h2>
      <p class="link-directory__subtitle">Every tracker, cockpit and template the team relies on — grouped and ready to open.</p>
    </div>

    <div class="link-directory__filters">
      <label class="link-directory__filter">
        <span class="visually-hidden">Country</span>
        <select v-model="filters.country">
          <option value="all">All countries</option>
          <option v-for="country in availableCountries" :key="country" :value="country">{{ country }}</option>
        </select>
      </label>

      <label class="link-directory__filter">
        <span class="visually-hidden">Status</span>
        <select v-model="filters.status">
          <option value="all">All statuses</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
        </select>
      </label>

      <label class="link-directory__filter">
        <span class="visually-hidden">Criticality</span>
        <select v-model="filters.criticality">
          <option value="all">All criticality</option>
          <option v-for="level in criticalities" :key="level" :value="level">{{ level }}</option>
        </select>
      </label>

      <button type="button" class="link-directory__clear" @click="clearFilters">
        <Icon name="close" :size="14" />
        Clear filters
      </button>
    </div>

    <p v-if="error" class="link-directory__banner">{{ error }}</p>

    <div v-if="isLoading" class="link-directory__skeletons">
      <SkeletonCard v-for="n in 6" :key="n" />
    </div>

    <p v-else-if="filteredLinks.length === 0" class="link-directory__empty">
      No links found. Try clearing filters or searching another keyword.
    </p>

    <div v-else class="link-directory__groups">
      <div v-for="group in groupedByCategory" :key="group.category.id" class="link-directory__group">
        <header class="link-directory__group-header" :style="{ '--card-accent': group.category.color }">
          <h3>{{ group.category.name }}</h3>
          <span class="link-directory__group-count">{{ group.links.length }} active</span>
        </header>
        <p class="link-directory__group-description">{{ group.category.description }}</p>

        <div class="link-directory__grid">
          <LinkCard v-for="link in group.links" :key="link.id" :link="link" :accent-color="group.category.color" />
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.link-directory {
  padding: var(--space-xxl) var(--space-outer);
  max-width: 1440px;
  margin: 0 auto;
}

.link-directory__intro {
  margin-bottom: var(--space-lg);
}

.link-directory__title {
  font-size: var(--font-size-title-sm);
  font-weight: 800;
}

.link-directory__subtitle {
  color: var(--color-text-300);
  margin-top: var(--space-xxs);
}

.link-directory__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.link-directory__filter select {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-card-border-hover);
  background: var(--color-white-400);
  font-size: var(--font-size-xs);
  font-family: inherit;
}

.link-directory__clear {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--font-size-xs);
  color: var(--color-text-300);
  background: none;
  border: 1px dashed var(--color-card-border-hover);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;

  @include hover {
    &:hover {
      color: var(--color-text-400);
      border-color: var(--color-text-300);
    }
  }
}

.link-directory__banner {
  background: var(--color-orange-muted);
  color: var(--color-text-400);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
  font-size: var(--font-size-sm);
}

.link-directory__empty {
  text-align: center;
  padding: var(--space-xxl) 0;
  color: var(--color-text-200);
}

.link-directory__skeletons,
.link-directory__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

.link-directory__groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxl);
}

.link-directory__group-header {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
  border-left: 3px solid var(--card-accent);
  padding-left: var(--space-sm);

  h3 {
    font-size: var(--font-size-xl);
    font-weight: 700;
  }
}

.link-directory__group-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-200);
}

.link-directory__group-description {
  color: var(--color-text-300);
  font-size: var(--font-size-sm);
  margin: var(--space-xxs) 0 var(--space-md);
}
</style>
