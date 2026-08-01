<script setup lang="ts">
import { ref } from "vue";
import type { LinkItem } from "../types/links";
import Icon from "./Icon.vue";

const props = defineProps<{ link: LinkItem; accent: string; icon: string }>();

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
  <article class="vault" :style="{ '--accent': accent }">
    <span class="vault__bar"></span>

    <div class="vault__head">
      <span class="vault__icon"><Icon :name="icon" :size="18" /></span>
      <h4 class="vault__title">{{ link.title }}</h4>
      <span class="vault__status" :class="`vault__status--${link.status.toLowerCase()}`">
        <span class="vault__status-dot"></span>{{ link.status }}
      </span>
    </div>

    <p class="vault__desc">{{ link.description }}</p>

    <ul v-if="link.tags.length" class="vault__tags">
      <li v-for="tag in link.tags.slice(0, 3)" :key="tag" class="mono">{{ tag }}</li>
      <li v-if="link.tags.length > 3" class="mono vault__tags-more">+{{ link.tags.length - 3 }}</li>
    </ul>

    <div class="vault__meta">
      <div><span class="vault__k">Owner</span><span class="vault__v">{{ link.owner || "—" }}</span></div>
      <div><span class="vault__k">Country</span><span class="vault__v">{{ link.country || "Regional" }}</span></div>
      <div>
        <span class="vault__k">Criticality</span>
        <span class="vault__v" :class="`vault__crit--${link.criticality.toLowerCase()}`">{{ link.criticality }}</span>
      </div>
    </div>

    <p v-if="link.accessNote" class="vault__note"><Icon name="shield" :size="12" /> {{ link.accessNote }}</p>

    <div class="vault__actions">
      <a class="vault__open" :href="link.url" target="_blank" rel="noopener noreferrer">Open<Icon name="arrowRight" :size="15" /></a>
      <button v-if="canCopy" class="vault__copy" type="button" @click="copyLink">
        <Icon name="copy" :size="15" />{{ copied ? "Copied" : "Copy" }}
      </button>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.vault {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid rgba(176, 160, 210, 0.18);
  background: linear-gradient(180deg, rgba(30, 16, 66, 0.42), rgba(21, 10, 48, 0.24));
  transition:
    transform 0.22s var(--ease-power2-out),
    border-color 0.22s var(--ease-power2-out),
    box-shadow 0.22s var(--ease-power2-out);

  @include hover {
    &:hover {
      transform: translateY(-3px);
      border-color: rgba(168, 132, 246, 0.4);
      box-shadow: 0 22px 50px -24px rgba(0, 0, 0, 0.85);
    }
  }
}

.vault__bar {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent);
}

.vault__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vault__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: 11px;
  border: 1px solid var(--color-command-border);
  background: rgba(168, 132, 246, 0.06);
  color: var(--accent);
}

.vault__title {
  flex: 1;
  min-width: 0;
  font-size: 15.5px;
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vault__status {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  border: 1px solid var(--color-command-border);
  color: var(--color-text-300);

  &--active {
    color: #7ff0c0;
    border-color: rgba(55, 211, 154, 0.4);
  }
  &--review {
    color: #ffd479;
    border-color: rgba(254, 188, 16, 0.4);
  }
  &--blocked {
    color: #ff8f88;
    border-color: rgba(242, 90, 81, 0.45);
  }
  &--archived {
    color: var(--color-text-200);
  }
}

.vault__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.vault__desc {
  font-size: 13px;
  line-height: 1.5;
  color: #b8acd8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.vault__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  li {
    font-size: 10px;
    letter-spacing: 0.04em;
    color: #b0a4cc;
    padding: 3px 9px;
    border-radius: 6px;
    background: rgba(176, 160, 210, 0.1);
  }
}

.vault__tags-more {
  background: transparent !important;
}

.vault__meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  font-size: 12px;

  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}

.vault__k {
  color: var(--color-text-200);
  font-size: 11px;
}

.vault__v {
  color: #e8e0ff;
  font-weight: 600;
}

.vault__crit {
  &--high {
    color: var(--criticality-high);
  }
  &--medium {
    color: var(--criticality-medium);
  }
  &--low {
    color: var(--color-text-300);
  }
}

.vault__note {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--color-text-200);
}

.vault__actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 4px;
}

.vault__open,
.vault__copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.vault__open {
  flex: 1;
  border: none;
  background: var(--grad-cta);
  color: #ffffff;

  @include hover {
    &:hover {
      filter: brightness(1.06);
    }
  }
}

.vault__copy {
  border: 1px solid var(--color-command-border);
  background: transparent;
  color: #dcd2f0;

  @include hover {
    &:hover {
      border-color: rgba(168, 132, 246, 0.4);
      color: #fff;
    }
  }
}
</style>
