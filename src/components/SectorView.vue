<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import { sectors } from "../data/sectors";
import type { CategoryId, LinkStatus } from "../types/links";
import VaultCard from "./VaultCard.vue";
import SkeletonCard from "./SkeletonCard.vue";
import Icon from "./Icon.vue";

const { scope, workspaceLinks, categories, filters, criticalOnly, isLoading, openSector, goHome } = useLinks();

const activeSector = computed(() => sectors.find((s) => s.categoryId === scope.value) ?? null);

const iconByCategory = computed(() => {
  const map = new Map<CategoryId, string>();
  for (const c of categories.value) map.set(c.id, c.icon);
  return map;
});
const colorByCategory = computed(() => {
  const map = new Map<CategoryId, string>();
  for (const c of categories.value) map.set(c.id, c.color);
  return map;
});

function iconFor(categoryId: CategoryId) {
  return iconByCategory.value.get(categoryId) ?? "folder";
}
function accentFor(categoryId: CategoryId) {
  return activeSector.value?.accent ?? colorByCategory.value.get(categoryId) ?? "var(--accent-cyan)";
}

const title = computed(() => {
  if (activeSector.value) return `${activeSector.value.name} Sector`;
  if (scope.value === "critical") return "Critical Vault";
  if (scope.value === "recent") return "Recently Updated";
  return "All Vaults";
});

const intro = computed(() => activeSector.value?.tip ?? "Every protected asset across the value-protection universe.");
const code = computed(() => activeSector.value?.code ?? "ALL");
const archLabel = computed(() => activeSector.value?.archLabel ?? "FULL ARCHIVE");
const accent = computed(() => activeSector.value?.accent ?? "#B794F6");

const criticalCount = computed(() => workspaceLinks.value.filter((l) => l.criticality === "High").length);

const statuses: (LinkStatus | "all")[] = ["all", "Active", "Review", "Blocked", "Archived"];

const dock = computed(() => [
  { scope: "all" as const, label: "All Vaults", accent: "#B794F6" },
  ...sectors.map((s) => ({ scope: s.categoryId, label: s.name, accent: s.accent })),
]);
</script>

<template>
  <section class="sector">
    <div class="sector__top">
      <nav class="sector__crumb mono">
        <button type="button" @click="goHome">Intrepid</button>
        <span>›</span>
        <span class="sector__crumb-here">{{ title }}</span>
      </nav>

      <header class="sector__header" :style="{ '--accent': accent }">
        <span class="sector__blob"></span>
        <div class="sector__header-main">
          <div class="sector__tag mono">
            <span class="sector__tag-dot"></span>
            SECTOR {{ code }} · {{ archLabel }}
          </div>
          <h1 class="sector__title">{{ title }}</h1>
          <p class="sector__intro">{{ intro }}</p>
        </div>
        <div class="sector__stats">
          <div class="sector__stat">
            <div class="sector__stat-num mono">{{ workspaceLinks.length }}</div>
            <div class="sector__stat-label mono">ASSETS</div>
          </div>
          <div class="sector__stat">
            <div class="sector__stat-num sector__stat-num--crit mono">{{ criticalCount }}</div>
            <div class="sector__stat-label mono">CRITICAL</div>
          </div>
        </div>
      </header>

      <div class="sector__controls">
        <label class="sector__search">
          <Icon name="search" :size="16" />
          <input v-model="filters.query" type="search" placeholder="Filter assets in this vault…" aria-label="Filter assets" />
        </label>
        <div class="sector__chips">
          <button
            v-for="s in statuses"
            :key="s"
            type="button"
            class="sector__chip"
            :class="{ 'is-on': filters.status === s }"
            @click="filters.status = s"
          >
            {{ s === "all" ? "All status" : s }}
          </button>
          <button
            type="button"
            class="sector__chip sector__chip--crit"
            :class="{ 'is-on': criticalOnly }"
            @click="criticalOnly = !criticalOnly"
          >
            <Icon name="spark" :size="13" /> Critical only
          </button>
        </div>
      </div>
    </div>

    <div class="sector__scroll vph-scroll">
      <div v-if="isLoading" class="sector__grid">
        <SkeletonCard v-for="n in 6" :key="n" />
      </div>
      <div v-else-if="workspaceLinks.length === 0" class="sector__empty">
        <Icon name="search" :size="26" />
        <p>No assets found in this vault. Try clearing the filter or scanning another sector.</p>
      </div>
      <div v-else class="sector__grid">
        <VaultCard
          v-for="link in workspaceLinks"
          :key="link.id"
          :link="link"
          :accent="accentFor(link.category)"
          :icon="iconFor(link.category)"
        />
      </div>
    </div>

    <!-- fleet dock -->
    <div class="sector__dock vph-dock">
      <button
        v-for="d in dock"
        :key="d.scope"
        type="button"
        class="sector__dock-pill"
        :class="{ 'is-on': scope === d.scope }"
        :style="{ '--accent': d.accent }"
        @click="openSector(d.scope)"
      >
        <span class="sector__dock-dot"></span>
        {{ d.label }}
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.sector {
  position: relative;
  z-index: 1;
  height: calc(100svh - var(--height-header));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sector__top {
  flex: none;
  width: 100%;
  max-width: 1420px;
  margin: 0 auto;
  padding: clamp(16px, 2.5vh, 24px) clamp(20px, 4vw, 52px) 0;
}

.sector__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  width: 100%;
  max-width: 1420px;
  margin: 0 auto;
  padding: 4px clamp(20px, 4vw, 52px) 28px;
}

.sector__crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--color-text-200);
  margin-bottom: 16px;

  button {
    background: none;
    border: none;
    color: var(--color-cyan-400);
    cursor: pointer;
    font: inherit;

    @include hover {
      &:hover {
        color: #fff;
      }
    }
  }
}

.sector__crumb-here {
  color: var(--color-text-300);
}

.sector__header {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: clamp(18px, 2.2vw, 26px) clamp(20px, 2.6vw, 32px);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(168, 132, 246, 0.18);
  background: linear-gradient(135deg, rgba(30, 16, 66, 0.55), rgba(21, 10, 48, 0.3));
  margin-bottom: 22px;
}

.sector__blob {
  position: absolute;
  right: -50px;
  top: -60px;
  width: 230px;
  height: 230px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent), transparent 66%);
  opacity: 0.14;
  pointer-events: none;
}

.sector__header-main {
  flex: 1;
  min-width: 0;
}

.sector__tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: #d8cdf0;
  margin-bottom: 10px;
}

.sector__tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}

.sector__title {
  font-size: clamp(26px, 3.4vw, 38px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

.sector__intro {
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-text-200);
  margin-top: 8px;
  max-width: 60ch;
}

.sector__stats {
  display: flex;
  gap: 12px;
  flex: none;
}

.sector__stat {
  text-align: center;
  padding: 12px 18px;
  border-radius: 14px;
  border: 1px solid var(--color-command-border);
  background: rgba(21, 10, 48, 0.4);
}

.sector__stat-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-cyan-400);
  line-height: 1;

  &--crit {
    color: var(--criticality-high);
  }
}

.sector__stat-label {
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--color-text-200);
  margin-top: 6px;
}

.sector__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.sector__search {
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 12px;
  border: 1px solid var(--color-command-border);
  background: rgba(21, 10, 48, 0.5);
  color: var(--color-text-200);

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: none;
    font-size: 14px;
  }
}

.sector__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sector__chip {
  padding: 9px 15px;
  border-radius: var(--radius-pill);
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  border: 1px solid var(--color-command-border);
  background: rgba(21, 10, 48, 0.4);
  color: var(--color-text-300);
  cursor: pointer;
  transition: all 0.16s var(--ease-power2-out);

  &.is-on {
    border-color: rgba(168, 132, 246, 0.5);
    background: rgba(168, 132, 246, 0.12);
    color: #fff;
  }

  &--crit {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &.is-on {
      border-color: transparent;
      background: var(--color-orange-400);
      color: #ffffff;
    }
  }
}

.sector__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.sector__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 20px;
  text-align: center;
  color: var(--color-text-200);
}

.sector__dock {
  flex: none;
  z-index: 40;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 11px clamp(16px, 4vw, 52px);
  border-top: 1px solid var(--color-command-border);
  background: rgba(16, 8, 34, 0.88);
  backdrop-filter: blur(12px);
}

.sector__dock-pill {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid var(--color-command-border);
  background: rgba(21, 10, 48, 0.5);
  color: var(--color-text-300);
  cursor: pointer;
  transition: all 0.16s var(--ease-power2-out);

  &.is-on {
    border-color: var(--accent);
    color: #fff;
    background: rgba(168, 132, 246, 0.1);
  }
}

.sector__dock-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
}
</style>
