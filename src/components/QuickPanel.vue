<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import Icon from "./Icon.vue";

const { criticalLinks, recentLinks, config, source, links, selectScope } = useLinks();

const topCritical = computed(() => criticalLinks.value.slice(0, 4));
const topRecent = computed(() => recentLinks.value.slice(0, 4));

const lastUpdated = computed(() => {
  if (config.value?.lastUpdatedNote) return config.value.lastUpdatedNote;
  const dates = links.value
    .map((l) => l.lastUpdated)
    .filter(Boolean)
    .sort();
  return dates.length ? dates[dates.length - 1] : "—";
});
</script>

<template>
  <aside class="quick-panel" aria-label="Quick panel">
    <section class="quick-panel__card">
      <header class="quick-panel__head">
        <Icon name="spark" :size="15" />
        <h3>Critical files</h3>
        <button type="button" class="quick-panel__more" @click="selectScope('critical')">View all</button>
      </header>
      <ul class="quick-panel__list">
        <li v-for="link in topCritical" :key="link.id">
          <a :href="link.url" target="_blank" rel="noopener noreferrer">
            <span class="quick-panel__link-title">{{ link.title }}</span>
            <span class="quick-panel__link-meta mono">{{ link.country || "Regional" }}</span>
          </a>
        </li>
        <li v-if="topCritical.length === 0" class="quick-panel__empty">No critical files.</li>
      </ul>
    </section>

    <section class="quick-panel__card">
      <header class="quick-panel__head">
        <Icon name="clock" :size="15" />
        <h3>Recently updated</h3>
        <button type="button" class="quick-panel__more" @click="selectScope('recent')">View all</button>
      </header>
      <ul class="quick-panel__list">
        <li v-for="link in topRecent" :key="link.id">
          <a :href="link.url" target="_blank" rel="noopener noreferrer">
            <span class="quick-panel__link-title">{{ link.title }}</span>
            <span class="quick-panel__link-meta mono">{{ link.lastUpdated }}</span>
          </a>
        </li>
      </ul>
    </section>

    <section class="quick-panel__card quick-panel__card--muted">
      <p class="quick-panel__label mono">Workspace status</p>
      <dl class="quick-panel__status">
        <div>
          <dt>Data source</dt>
          <dd>
            <span class="quick-panel__source-dot" :class="source === 'live' ? 'is-live' : 'is-mock'"></span>
            {{ source === "live" ? "Live sheet" : "Mock data" }}
          </dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd class="mono">{{ lastUpdated }}</dd>
        </div>
        <div>
          <dt>Maintained by</dt>
          <dd>{{ config?.maintainer || "Value Protection / Claimback Team" }}</dd>
        </div>
      </dl>
      <div class="quick-panel__actions">
        <a
          v-if="config?.requestLinkUrl"
          class="quick-panel__btn quick-panel__btn--primary"
          :href="config.requestLinkUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="spark" :size="14" /> Request new link
        </a>
        <a
          v-if="config?.adminSheetUrl"
          class="quick-panel__btn"
          :href="config.adminSheetUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="external" :size="14" /> Source sheet
        </a>
      </div>
    </section>
  </aside>
</template>

<style lang="scss" scoped>
.quick-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.quick-panel__card {
  border-radius: var(--radius-card);
  border: 1px solid var(--color-card-border);
  background: var(--color-card-bg);
  padding: var(--space-md);
  box-shadow: var(--shadow-card), inset 0 1px 0 rgba(255, 255, 255, 0.5);

  &--muted {
    background: var(--color-command-bg);
    color: var(--color-command-text);
    border-color: transparent;
    box-shadow: var(--shadow-card), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }
}

.quick-panel__head {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
  color: var(--color-text-400);

  h3 {
    font-size: var(--font-size-sm);
    font-weight: 700;
    flex: 1;
  }
}

.quick-panel__more {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-cyan-500);
  background: none;
  border: none;
  cursor: pointer;

  @include hover {
    &:hover {
      text-decoration: underline;
    }
  }
}

.quick-panel__list {
  display: flex;
  flex-direction: column;
  gap: 2px;

  a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: 7px var(--space-xs);
    border-radius: var(--radius-sm);
    transition: background 0.16s var(--ease-power2-out);

    @include hover {
      &:hover {
        background: var(--color-beige-600);
      }
    }
  }
}

.quick-panel__link-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-400);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-panel__link-meta {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--color-text-200);
}

.quick-panel__empty {
  font-size: var(--font-size-xs);
  color: var(--color-text-200);
  padding: var(--space-xs);
}

.quick-panel__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-command-text-muted);
}

.quick-panel__status {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-top: var(--space-sm);

  div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  dt {
    font-size: 11px;
    color: var(--color-command-text-muted);
  }

  dd {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: #fff;
    text-align: right;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.quick-panel__source-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;

  &.is-live {
    background: var(--status-active);
  }
  &.is-mock {
    background: var(--color-cyan-400);
  }
}

.quick-panel__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
}

.quick-panel__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 8px var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-command-border);
  color: #fff;
  transition: all 0.18s var(--ease-power2-out);

  @include hover {
    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }

  &--primary {
    background: var(--color-orange-400);
    border-color: transparent;

    @include hover {
      &:hover {
        filter: brightness(1.08);
        background: var(--color-orange-400);
      }
    }
  }
}
</style>
