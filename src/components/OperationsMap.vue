<script setup lang="ts">
import { onMounted, ref } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useReducedMotion } from "../composables/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { label: "Source Data", detail: "POS, contracts & claim submissions" },
  { label: "Review Cockpit", detail: "Exception flags & sign-off" },
  { label: "Accrual / Booking", detail: "JE posting to the ledger" },
  { label: "Invoice / CM / VRA", detail: "Customer-facing settlement docs" },
  { label: "Net-off", detail: "Offset against open AR" },
  { label: "Collection / AR Monitoring", detail: "Cash applied & aging cleared" },
];

const sectionRef = ref<HTMLElement | null>(null);
const { prefersReducedMotion } = useReducedMotion();

onMounted(() => {
  if (!sectionRef.value || prefersReducedMotion.value) return;

  const stepEls = sectionRef.value.querySelectorAll(".operations-map__step");
  gsap.from(stepEls, {
    opacity: 0,
    y: 24,
    duration: 0.6,
    ease: "power2.out",
    stagger: 0.12,
    scrollTrigger: {
      trigger: sectionRef.value,
      start: "top 75%",
    },
  });
});
</script>

<template>
  <section ref="sectionRef" class="operations-map" aria-label="Operations map">
    <div class="operations-map__intro">
      <h2 class="operations-map__title">Operations Map</h2>
      <p class="operations-map__subtitle">How the links in this hub connect across the claimback-to-cash process.</p>
    </div>

    <div class="operations-map__flow">
      <template v-for="(step, index) in steps" :key="step.label">
        <div class="operations-map__step">
          <span class="operations-map__index mono">{{ String(index + 1).padStart(2, "0") }}</span>
          <span class="operations-map__label">{{ step.label }}</span>
          <span class="operations-map__detail">{{ step.detail }}</span>
        </div>
        <div v-if="index < steps.length - 1" class="operations-map__connector" aria-hidden="true">
          <span class="operations-map__dot"></span>
        </div>
      </template>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.operations-map {
  padding: var(--space-xxl) var(--space-outer);
  max-width: 1440px;
  margin: 0 auto;
}

.operations-map__title {
  font-size: var(--font-size-title-sm);
  font-weight: 800;
}

.operations-map__subtitle {
  color: var(--color-text-300);
  margin-top: var(--space-xxs);
  margin-bottom: var(--space-xl);
}

.operations-map__flow {
  display: flex;
  align-items: stretch;
  gap: var(--space-sm);
  overflow-x: auto;
  padding-bottom: var(--space-sm);

  @include mq(md) {
    flex-wrap: wrap;
  }
}

.operations-map__step {
  flex: 1 0 180px;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  padding: var(--space-md);
  border-radius: var(--radius-card);
  background: var(--color-navy-700);
  color: #fff;
  min-width: 180px;
}

.operations-map__index {
  color: var(--color-cyan-400);
  font-size: var(--font-size-xs);
}

.operations-map__label {
  font-weight: 700;
  font-size: var(--font-size-md);
}

.operations-map__detail {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.65);
}

.operations-map__connector {
  flex: 0 0 32px;
  position: relative;
  align-self: center;
  height: 2px;
  background: var(--color-card-border-hover);

  &::after {
    content: "";
    position: absolute;
    right: -4px;
    top: 50%;
    width: 6px;
    height: 6px;
    border-right: 2px solid var(--color-orange-400);
    border-bottom: 2px solid var(--color-orange-400);
    transform: translateY(-50%) rotate(-45deg);
  }
}

.operations-map__dot {
  position: absolute;
  top: 50%;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-orange-400);
  transform: translateY(-50%);
  animation: flow-dot 1.8s linear infinite;
}

@keyframes flow-dot {
  0% {
    left: 0;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    left: 100%;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .operations-map__dot {
    animation: none;
    opacity: 0;
  }
}
</style>
