<script setup lang="ts">
import { ref } from "vue";
import Icon from "./Icon.vue";

const steps = [
  { label: "Source Data", detail: "POS, contracts & claim submissions" },
  { label: "Review Cockpit", detail: "Exception flags & sign-off" },
  { label: "Accrual / Booking", detail: "JE posting to the ledger" },
  { label: "Invoice / CM / VRA", detail: "Customer-facing settlement docs" },
  { label: "Net-off", detail: "Offset against open AR" },
  { label: "Collection / AR Monitoring", detail: "Cash applied & aging cleared" },
];

const expanded = ref(false);
</script>

<template>
  <section id="operations" class="ops" aria-label="Operations map">
    <button
      type="button"
      class="ops__bar"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="ops__bar-title">
        <Icon name="sliders" :size="16" />
        Operations Map
      </span>

      <span class="ops__chips" aria-hidden="true">
        <template v-for="(step, index) in steps" :key="step.label">
          <span class="ops__chip">{{ step.label }}</span>
          <span v-if="index < steps.length - 1" class="ops__arrow">→</span>
        </template>
      </span>

      <span class="ops__toggle">
        {{ expanded ? "Hide" : "Details" }}
        <Icon name="chevronDown" :size="16" :class="{ 'ops__chevron--up': expanded }" />
      </span>
    </button>

    <Transition name="ops-expand">
      <div v-if="expanded" class="ops__detail">
        <template v-for="(step, index) in steps" :key="step.label">
          <div class="ops__step">
            <span class="ops__index mono">{{ String(index + 1).padStart(2, "0") }}</span>
            <span class="ops__label">{{ step.label }}</span>
            <span class="ops__step-detail">{{ step.detail }}</span>
          </div>
          <div v-if="index < steps.length - 1" class="ops__connector" aria-hidden="true"></div>
        </template>
      </div>
    </Transition>
  </section>
</template>

<style lang="scss" scoped>
.ops {
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  background: var(--color-command-bg);
  color: var(--color-command-text);
  overflow: hidden;
}

.ops__bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.ops__bar-title {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 700;
  font-size: var(--font-size-sm);
  flex-shrink: 0;
  color: #fff;
}

.ops__chips {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  overflow: hidden;
  min-width: 0;

  @include mq(md, max) {
    display: none;
  }
}

.ops__chip {
  font-size: 11px;
  color: var(--color-command-text-muted);
  white-space: nowrap;
}

.ops__arrow {
  color: var(--color-orange-400);
  font-size: 11px;
}

.ops__toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxs);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-cyan-400);
  flex-shrink: 0;
  margin-left: auto;
}

.ops__chevron--up {
  transform: rotate(180deg);
}

.ops__detail {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  gap: var(--space-xs);
  padding: 0 var(--space-md) var(--space-md);
}

.ops__step {
  flex: 1 1 150px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--color-command-bg-soft);
  border: 1px solid var(--color-command-border);
  min-width: 140px;
}

.ops__index {
  color: var(--color-cyan-400);
  font-size: 11px;
}

.ops__label {
  font-weight: 700;
  font-size: var(--font-size-xs);
  color: #fff;
}

.ops__step-detail {
  font-size: 11px;
  color: var(--color-command-text-muted);
}

.ops__connector {
  align-self: center;
  width: 14px;
  height: 2px;
  background: var(--color-command-border);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    right: -3px;
    top: 50%;
    width: 5px;
    height: 5px;
    border-right: 2px solid var(--color-orange-400);
    border-bottom: 2px solid var(--color-orange-400);
    transform: translateY(-50%) rotate(-45deg);
  }

  @include mq(md, max) {
    display: none;
  }
}

.ops-expand-enter-active,
.ops-expand-leave-active {
  transition:
    opacity 0.25s var(--ease-power2-out),
    transform 0.25s var(--ease-power2-out);
}
.ops-expand-enter-from,
.ops-expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
