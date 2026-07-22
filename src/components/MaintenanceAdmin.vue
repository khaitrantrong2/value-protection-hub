<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import Icon from "./Icon.vue";

const { config, source, links } = useLinks();

const lastUpdated = computed(() => {
  if (config.value?.lastUpdatedNote) return config.value.lastUpdatedNote;
  const dates = links.value.map((l) => l.lastUpdated).filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : "—";
});
</script>

<template>
  <section class="maintenance" aria-label="Maintenance and admin">
    <div class="maintenance__inner">
      <div class="maintenance__info">
        <p class="maintenance__label">Maintained by</p>
        <p class="maintenance__maintainer">{{ config?.maintainer || "Value Protection / Claimback Team" }}</p>
        <p class="maintenance__meta">
          Last updated {{ lastUpdated }} ·
          <span class="maintenance__source">{{ source === "live" ? "Live data" : "Mock data" }}</span>
        </p>
      </div>

      <div class="maintenance__actions">
        <a v-if="config?.adminSheetUrl" class="maintenance__btn maintenance__btn--ghost" :href="config.adminSheetUrl" target="_blank" rel="noopener noreferrer">
          <Icon name="external" :size="16" />
          Open source sheet
        </a>
        <a v-if="config?.requestLinkUrl" class="maintenance__btn maintenance__btn--primary" :href="config.requestLinkUrl" target="_blank" rel="noopener noreferrer">
          <Icon name="spark" :size="16" />
          Request new link
        </a>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.maintenance {
  padding: var(--space-lg) var(--space-outer);
  background: var(--color-command-bg);
  color: var(--color-command-text);
  border-top: 1px solid var(--color-command-border);
}

.maintenance__inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  align-items: center;
  justify-content: space-between;
}

.maintenance__label {
  font-size: var(--font-size-xxs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-command-text-muted);
}

.maintenance__maintainer {
  font-size: var(--font-size-md);
  font-weight: 700;
}

.maintenance__meta {
  font-size: var(--font-size-xs);
  color: var(--color-command-text-muted);
  margin-top: var(--space-xxs);
}

.maintenance__source {
  color: var(--color-cyan-400);
}

.maintenance__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.maintenance__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--font-size-sm);
  font-weight: 600;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-pill);
  transition: all 0.2s var(--ease-power2-out);

  &--ghost {
    border: 1px solid var(--color-command-border);
    color: #fff;

    @include hover {
      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }
    }
  }

  &--primary {
    background: var(--color-orange-400);
    color: #fff;

    @include hover {
      &:hover {
        filter: brightness(1.08);
      }
    }
  }
}
</style>
