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
  <article class="link-row" :style="{ '--row-accent': accentColor || 'var(--accent-gray)' }">
    <span class="link-row__rail" aria-hidden="true"></span>

    <div class="link-row__main">
      <div class="link-row__top">
        <h4 class="link-row__title">{{ link.title }}</h4>
        <span class="link-row__status" :class="`link-row__status--${link.status.toLowerCase()}`">{{ link.status }}</span>
      </div>
      <p class="link-row__desc">{{ link.description }}</p>
      <div class="link-row__meta mono">
        <span v-if="link.owner">{{ link.owner }}</span>
        <span v-if="link.country" class="link-row__dot">{{ link.country }}</span>
        <span class="link-row__crit" :class="`link-row__crit--${link.criticality.toLowerCase()}`">{{ link.criticality }}</span>
        <span v-for="tag in link.tags.slice(0, 3)" :key="tag" class="link-row__tag">#{{ tag }}</span>
        <span v-if="link.accessNote" class="link-row__lock"><Icon name="shield" :size="12" /> restricted</span>
      </div>
    </div>

    <div class="link-row__actions">
      <a class="link-row__btn link-row__btn--open" :href="link.url" target="_blank" rel="noopener noreferrer" :title="`Open ${link.title}`">
        <Icon name="external" :size="15" />
        <span class="link-row__btn-label">Open</span>
      </a>
      <button v-if="canCopy" class="link-row__btn" type="button" :title="copied ? 'Copied' : 'Copy link'" @click="copyLink">
        <Icon name="copy" :size="15" />
        <span class="link-row__btn-label">{{ copied ? "Copied" : "Copy" }}</span>
      </button>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.link-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md) var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  box-shadow: var(--shadow-card);
  transition:
    transform 0.2s var(--ease-power2-out),
    box-shadow 0.2s var(--ease-power2-out),
    background 0.2s var(--ease-power2-out),
    border-color 0.2s var(--ease-power2-out);

  @include hover {
    &:hover {
      transform: translateY(-1px);
      background: var(--color-card-bg-hover);
      border-color: var(--color-card-border-hover);
      box-shadow: var(--shadow-card-hover);
    }
  }
}

.link-row__rail {
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 3px;
  background: var(--row-accent);
}

.link-row__main {
  min-width: 0;
  flex: 1;
}

.link-row__top {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.link-row__title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-row__status {
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

.link-row__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-300);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-row__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
  font-size: 11px;
  color: var(--color-text-200);
}

.link-row__dot::before {
  content: "·";
  margin-right: var(--space-xs);
}

.link-row__crit {
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

.link-row__tag {
  color: var(--color-text-200);
  opacity: 0.75;
}

.link-row__lock {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--color-text-200);
}

.link-row__actions {
  display: flex;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.link-row__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 6px 10px;
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
    background: var(--color-orange-muted);
    border-color: transparent;

    @include hover {
      &:hover {
        background: var(--color-orange-400);
        color: #fff;
      }
    }
  }
}

@include mq(md, max) {
  .link-row__btn-label {
    display: none;
  }
}
</style>
