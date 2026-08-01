<script setup lang="ts">
import { computed, ref } from "vue";
import type { LinkItem } from "../types/links";
import Icon from "./Icon.vue";

const props = defineProps<{ link: LinkItem; accentColor?: string }>();

const copied = ref(false);
const canCopy = props.link.status !== "Blocked";

const visibleTags = computed(() => props.link.tags.slice(0, 3));
const extraTags = computed(() => Math.max(0, props.link.tags.length - 3));

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
  <article class="row" :style="{ '--row-accent': accentColor || 'var(--accent-gray)' }">
    <span class="row__rail" aria-hidden="true"></span>

    <div class="row__main">
      <div class="row__top">
        <h4 class="row__title">{{ link.title }}</h4>

        <span
          v-if="link.criticality === 'High'"
          class="row__crit-chip"
          title="High criticality"
        >High</span>

        <span v-if="link.status === 'Active'" class="row__status-active">
          <span class="row__dot" aria-hidden="true"></span>Active
        </span>
        <span v-else class="row__status" :class="`row__status--${link.status.toLowerCase()}`">{{ link.status }}</span>
      </div>

      <p class="row__desc">{{ link.description }}</p>

      <div class="row__foot">
        <p class="row__meta">
          <span><span class="row__meta-k">Owner:</span> {{ link.owner || "—" }}</span>
          <span class="row__sep">·</span>
          <span><span class="row__meta-k">Country:</span> {{ link.country || "Regional" }}</span>
          <span class="row__sep">·</span>
          <span>
            <span class="row__meta-k">Criticality:</span>
            <span :class="`row__crit--${link.criticality.toLowerCase()}`">{{ link.criticality }}</span>
          </span>
        </p>

        <ul v-if="visibleTags.length" class="row__tags">
          <li v-for="tag in visibleTags" :key="tag">{{ tag }}</li>
          <li v-if="extraTags" class="row__tags-more">+{{ extraTags }}</li>
        </ul>
      </div>
    </div>

    <div class="row__actions">
      <a class="row__btn row__btn--open" :href="link.url" target="_blank" rel="noopener noreferrer" :title="`Open ${link.title}`">
        <Icon name="external" :size="15" />
        <span class="row__btn-label">Open</span>
      </a>
      <button v-if="canCopy" class="row__btn" type="button" :title="copied ? 'Copied' : 'Copy link'" @click="copyLink">
        <Icon name="copy" :size="15" />
        <span class="row__btn-label">{{ copied ? "Copied" : "Copy" }}</span>
      </button>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.row {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-md) var(--space-md) var(--space-lg);
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

.row__rail {
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 3px;
  background: var(--row-accent);
}

.row__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row__top {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.row__title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row__crit-chip {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  color: #fff;
  background: var(--criticality-high);
}

.row__status-active {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-200);
}

.row__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--status-active);
}

.row__status {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  color: #fff;

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

.row__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-300);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.row__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-300);
  font-variant-numeric: tabular-nums;
}

.row__meta-k {
  color: var(--color-text-200);
}

.row__sep {
  color: var(--color-text-200);
  opacity: 0.6;
}

.row__crit {
  &--high {
    color: var(--criticality-high);
    font-weight: 700;
  }
  &--medium {
    color: var(--criticality-medium);
    font-weight: 700;
  }
  &--low {
    color: var(--color-text-300);
    font-weight: 600;
  }
}

.row__tags {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.row__tags li {
  font-size: 10px;
  color: var(--color-text-300);
  background: var(--color-beige-600);
  border-radius: var(--radius-sm);
  padding: 2px 7px;
}

.row__tags-more {
  color: var(--color-text-200) !important;
  background: transparent !important;
  font-weight: 700;
}

.row__actions {
  display: flex;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.row__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 7px 11px;
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
    color: #ffffff;
    border-color: transparent;
    font-weight: 700;

    @include hover {
      &:hover {
        filter: brightness(1.08);
        color: #ffffff;
      }
    }
  }
}

@include mq(md, max) {
  .row__btn-label {
    display: none;
  }
  .row__actions {
    flex-direction: column;
  }
}
</style>
