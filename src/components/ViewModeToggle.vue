<script setup lang="ts">
import type { ViewMode } from "../types/links";
import Icon from "./Icon.vue";

defineProps<{ modelValue: ViewMode }>();
const emit = defineEmits<{ "update:modelValue": [value: ViewMode] }>();
</script>

<template>
  <div class="view-toggle" role="group" aria-label="View mode">
    <button
      type="button"
      class="view-toggle__btn"
      :class="{ 'is-active': modelValue === 'compact' }"
      :aria-pressed="modelValue === 'compact'"
      title="Compact rows"
      @click="emit('update:modelValue', 'compact')"
    >
      <Icon name="list" :size="16" />
      <span>Compact</span>
    </button>
    <button
      type="button"
      class="view-toggle__btn"
      :class="{ 'is-active': modelValue === 'cards' }"
      :aria-pressed="modelValue === 'cards'"
      title="Cards"
      @click="emit('update:modelValue', 'cards')"
    >
      <Icon name="grid" :size="16" />
      <span>Cards</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.view-toggle {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: var(--radius-md);
  background: var(--color-beige-600);
  border: 1px solid var(--color-card-border);
}

.view-toggle__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-300);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s var(--ease-power2-out);

  span {
    @include mq(sm, max) {
      display: none;
    }
  }

  &.is-active {
    background: var(--color-white-400);
    color: var(--color-text-400);
    box-shadow: var(--shadow-card);
  }
}
</style>
