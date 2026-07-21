<script setup lang="ts">
import { ref } from "vue";
import type { LinkItem } from "../types/links";
import Icon from "./Icon.vue";

const props = defineProps<{ link: LinkItem; accentColor: string }>();

const copied = ref(false);
const canCopy = props.link.status !== "Blocked";

async function copyLink() {
  if (!canCopy) return;
  try {
    await navigator.clipboard.writeText(props.link.url);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch {
    // Clipboard API unavailable — silently ignore, Open still works.
  }
}
</script>

<template>
  <article class="link-card" :style="{ '--card-accent': accentColor }">
    <header class="link-card__header">
      <h4 class="link-card__title">{{ link.title }}</h4>
      <span class="link-card__status" :class="`link-card__status--${link.status.toLowerCase()}`">{{ link.status }}</span>
    </header>

    <p class="link-card__description">{{ link.description }}</p>

    <ul v-if="link.tags.length" class="link-card__tags">
      <li v-for="tag in link.tags" :key="tag" class="link-card__tag">{{ tag }}</li>
    </ul>

    <dl class="link-card__meta">
      <div v-if="link.owner" class="link-card__meta-item">
        <dt>Owner</dt>
        <dd>{{ link.owner }}</dd>
      </div>
      <div v-if="link.country" class="link-card__meta-item">
        <dt>Country</dt>
        <dd>{{ link.country }}</dd>
      </div>
      <div class="link-card__meta-item">
        <dt>Criticality</dt>
        <dd :class="`link-card__criticality--${link.criticality.toLowerCase()}`">{{ link.criticality }}</dd>
      </div>
    </dl>

    <p v-if="link.accessNote" class="link-card__access-note">
      <Icon name="shield" :size="14" />
      {{ link.accessNote }}
    </p>

    <footer class="link-card__actions">
      <a class="link-card__open" :href="link.url" target="_blank" rel="noopener noreferrer">
        <Icon name="external" :size="16" />
        Open
      </a>
      <button v-if="canCopy" class="link-card__copy" type="button" @click="copyLink">
        <Icon name="copy" :size="16" />
        {{ copied ? "Copied" : "Copy link" }}
      </button>
    </footer>
  </article>
</template>

<style lang="scss" scoped>
.link-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  padding: var(--space-md);
  box-shadow: var(--shadow-card);
  transition:
    transform 0.25s var(--ease-power2-out),
    box-shadow 0.25s var(--ease-power2-out),
    background 0.25s var(--ease-power2-out);

  &::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    border-radius: var(--radius-card) 0 0 var(--radius-card);
    background: var(--card-accent);
  }

  @include hover {
    &:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-card-hover);
      background: var(--color-card-bg-hover);
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
  line-height: var(--line-height-title);
}

.link-card__status {
  flex-shrink: 0;
  font-size: var(--font-size-xxs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px var(--space-xs);
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

.link-card__description {
  font-size: var(--font-size-sm);
  color: var(--color-text-300);
}

.link-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xxs);
}

.link-card__tag {
  font-size: var(--font-size-xxs);
  padding: 2px var(--space-xs);
  border-radius: var(--radius-pill);
  background: var(--color-beige-600);
  color: var(--color-text-300);
}

.link-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  font-size: var(--font-size-xs);

  dt {
    color: var(--color-text-200);
  }
  dd {
    font-weight: 600;
  }
}

.link-card__criticality {
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

.link-card__access-note {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--font-size-xxs);
  color: var(--color-text-200);
}

.link-card__actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: auto;
  padding-top: var(--space-xs);
}

.link-card__open,
.link-card__copy {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: var(--radius-pill);
  padding: var(--space-xxs) var(--space-sm);
  border: 1px solid var(--color-card-border-hover);
  background: transparent;
  color: var(--color-text-400);
  cursor: pointer;
  transition: all 0.2s var(--ease-power2-out);

  @include hover {
    &:hover {
      background: var(--color-navy-700);
      color: #fff;
      border-color: var(--color-navy-700);
    }
  }
}

.link-card__open {
  background: var(--color-orange-muted);
  border-color: transparent;

  @include hover {
    &:hover {
      background: var(--color-orange-400);
      color: #fff;
    }
  }
}
</style>
