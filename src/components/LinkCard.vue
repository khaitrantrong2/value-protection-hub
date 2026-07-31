<script setup lang="ts">
import { ref } from "vue";
import type { LinkItem } from "../types/links";
import Icon from "./Icon.vue";

const props = defineProps<{ link: LinkItem; accentColor?: string }>();

const copied = ref(false);
const canCopy = props.link.status !== "Blocked";

async function copyLink() {
  if (!canCopy) return;
  try {
    await navigator.clipboard.writeText(props.link.url);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch {
    /* clipboard unavailable */
  }
}
</script>

<template>
  <article class="link-card" :style="{ '--card-accent': accentColor || 'var(--accent-gray)' }">
    <header class="link-card__header">
      <h4 class="link-card__title">{{ link.title }}</h4>
      <span class="link-card__status" :class="`link-card__status--${link.status.toLowerCase()}`">{{ link.status }}</span>
    </header>

    <p class="link-card__desc">{{ link.description }}</p>

    <div class="link-card__meta mono">
      <span v-if="link.owner">{{ link.owner }}</span>
      <span v-if="link.country" class="link-card__sep">{{ link.country }}</span>
      <span class="link-card__crit" :class="`link-card__crit--${link.criticality.toLowerCase()}`">{{ link.criticality }}</span>
    </div>

    <ul v-if="link.tags.length" class="link-card__tags">
      <li v-for="tag in link.tags.slice(0, 3)" :key="tag">#{{ tag }}</li>
    </ul>

    <p v-if="link.accessNote" class="link-card__note"><Icon name="shield" :size="13" /> {{ link.accessNote }}</p>

    <footer class="link-card__actions">
      <a class="link-card__btn link-card__btn--open" :href="link.url" target="_blank" rel="noopener noreferrer">
        <Icon name="external" :size="15" /> Open
      </a>
      <button v-if="canCopy" class="link-card__btn" type="button" @click="copyLink">
        <Icon name="copy" :size="15" /> {{ copied ? "Copied" : "Copy" }}
      </button>
    </footer>
  </article>
</template>

<style lang="scss" scoped>
.link-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  padding-left: calc(var(--space-md) + 3px);
  border-radius: var(--radius-card);
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  box-shadow: var(--shadow-card);
  transition:
    transform 0.22s var(--ease-power2-out),
    box-shadow 0.22s var(--ease-power2-out),
    background 0.22s var(--ease-power2-out),
    border-color 0.22s var(--ease-power2-out);

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: var(--space-md);
    bottom: var(--space-md);
    width: 3px;
    border-radius: 3px;
    background: var(--card-accent);
  }

  @include hover {
    &:hover {
      transform: translateY(-3px);
      background: var(--color-card-bg-hover);
      border-color: var(--color-card-border-hover);
      box-shadow: var(--shadow-card-hover);
    }
  }
}

.link-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
}

.link-card__title {
  font-size: var(--font-size-md);
  font-weight: 700;
  line-height: 1.2;
}

.link-card__status {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  color: #fff;
  background: var(--status-archived);

  &--active {
    background: var(--status-active);
  }
  &--review {
    background: var(--status-review);
  }
  &--blocked {
    background: var(--status-blocked);
  }
  &--archived {
    background: var(--status-archived);
  }
}

.link-card__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-300);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.4em;
}

.link-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 11px;
  color: var(--color-text-200);
}

.link-card__sep::before {
  content: "·";
  margin-right: var(--space-xs);
}

.link-card__crit {
  font-weight: 700;
  &--high {
    color: var(--criticality-high);
  }
  &--medium {
    color: var(--criticality-medium);
  }
  &--low {
    color: var(--criticality-low);
  }
}

.link-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xxs);
  font-size: 11px;
  color: var(--color-text-200);

  li {
    background: var(--color-beige-600);
    border-radius: var(--radius-pill);
    padding: 1px var(--space-xs);
  }
}

.link-card__note {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-200);
}

.link-card__actions {
  display: flex;
  gap: var(--space-xs);
  margin-top: auto;
  padding-top: var(--space-xs);
}

.link-card__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-card-border-hover);
  background: transparent;
  color: var(--color-text-400);
  cursor: pointer;
  transition: all 0.18s var(--ease-power2-out);

  @include hover {
    &:hover {
      background: var(--color-navy-700);
      color: #fff;
      border-color: var(--color-navy-700);
    }
  }

  &--open {
    background: var(--grad-cta);
    color: #04122b;
    border-color: transparent;
    font-weight: 700;

    @include hover {
      &:hover {
        filter: brightness(1.08);
        color: #04122b;
      }
    }
  }
}
</style>
