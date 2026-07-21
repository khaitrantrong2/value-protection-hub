<script setup lang="ts">
defineProps<{ label: string; value: number | string }>();
</script>

<template>
  <div class="stat-tile">
    <span class="stat-tile__value mono">{{ value }}</span>
    <span class="stat-tile__label">{{ label }}</span>
  </div>
</template>

<style lang="scss" scoped>
.stat-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-command-border);
  background: rgba(255, 255, 255, 0.04);
  min-width: 96px;
}

.stat-tile__value {
  font-size: var(--font-size-xxl);
  font-weight: 700;
  color: var(--color-cyan-400);
  line-height: 1;
}

.stat-tile__label {
  font-size: var(--font-size-xxs);
  color: var(--color-command-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
</style>
