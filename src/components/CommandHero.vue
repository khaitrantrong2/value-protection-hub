<script setup lang="ts">
import { onMounted, ref } from "vue";
import { gsap, VPH_EASE } from "../motion";
import UniverseStage from "./UniverseStage.vue";
import Icon from "./Icon.vue";
import { useLinks } from "../composables/useLinks";
import { useReducedMotion } from "../composables/useReducedMotion";

const { config, paletteOpen } = useLinks();
const { prefersReducedMotion } = useReducedMotion();

const heroRef = ref<HTMLElement | null>(null);

function openPalette() {
  paletteOpen.value = true;
}

function viewMission() {
  document.getElementById("link-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

onMounted(() => {
  if (!heroRef.value || prefersReducedMotion.value) return;
  const targets = heroRef.value.querySelectorAll("[data-reveal]");
  gsap.from(targets, { opacity: 0, y: 22, duration: 0.7, ease: VPH_EASE, stagger: 0.08 });
});
</script>

<template>
  <section ref="heroRef" class="hero">
    <div class="hero__copy">
      <div class="hero__status" data-reveal>
        <span class="hero__status-dot"></span>
        <span class="hero__status-text mono">SYSTEM ONLINE</span>
      </div>

      <h1 class="hero__title" data-reveal>Value<br />Protection Hub</h1>

      <p class="hero__subtitle" data-reveal>
        {{ config?.subtitle || "Claimback, AR & Finance Control Workspace" }}
      </p>
      <p class="hero__desc" data-reveal>
        A galactic command center for the tools, trackers, and control assets that protect value across Intrepid.
      </p>

      <button type="button" class="hero__scan" data-reveal @click="openPalette">
        <span class="hero__scan-sweep"></span>
        <Icon name="search" :size="18" class="hero__scan-icon" />
        <span class="hero__scan-text">Scan the universe for trackers, SOPs, templates, dashboards…</span>
        <kbd class="mono">Ctrl K</kbd>
      </button>

      <div class="hero__actions" data-reveal>
        <button type="button" class="hero__cta hero__cta--primary" @click="openPalette">
          Scan the vaults
          <Icon name="arrowRight" :size="16" />
        </button>
        <button type="button" class="hero__cta hero__cta--ghost" @click="viewMission">View mission map</button>
      </div>
    </div>

    <div class="hero__stage" data-reveal>
      <UniverseStage />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.hero {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  align-items: center;
  gap: clamp(20px, 3vw, 56px);
  max-width: 1520px;
  margin: 0 auto;
  width: 100%;
  padding: clamp(14px, 2.4vh, 30px) var(--space-outer) 0;
  min-height: calc(100svh - var(--height-header));

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
    min-height: 0;
    padding-top: var(--space-lg);
    gap: var(--space-md);
  }
}

.hero__copy {
  max-width: 560px;

  @media (max-width: 920px) {
    order: 1;
  }
}

.hero__stage {
  @media (max-width: 920px) {
    order: 2;
  }
}

.hero__status {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(79, 217, 255, 0.28);
  background: rgba(79, 217, 255, 0.06);
  margin-bottom: 24px;
}

.hero__status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4fd9ff;
  box-shadow: 0 0 10px #4fd9ff;
}

.hero__status-text {
  font-size: 11px;
  letter-spacing: 0.24em;
  color: #bfe6f5;
}

.hero__title {
  font-size: clamp(38px, 5.2vw, 64px);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.025em;
  margin: 0 0 16px;
}

.hero__subtitle {
  font-size: clamp(16px, 1.4vw, 19px);
  color: #c6d3ee;
  font-weight: 500;
  margin: 0 0 6px;
}

.hero__desc {
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-200);
  margin: 0 0 26px;
  max-width: 440px;
  text-wrap: pretty;
}

.hero__scan {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 460px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: text;
  text-align: left;
  padding: 15px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(79, 217, 255, 0.3);
  background: linear-gradient(180deg, rgba(11, 29, 74, 0.55), rgba(7, 22, 51, 0.35));
  box-shadow:
    0 0 0 1px rgba(79, 217, 255, 0.05),
    0 20px 50px -22px rgba(0, 0, 0, 0.8);
  color: inherit;
}

.hero__scan-sweep {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 34%;
  background: linear-gradient(90deg, transparent, rgba(79, 217, 255, 0.14), transparent);
  animation: hero-scan 4.2s var(--ease-power2-in) infinite;
}

.hero__scan-icon {
  color: #4fd9ff;
  flex: none;
}

.hero__scan-text {
  flex: 1;
  font-size: 14px;
  color: #8ea3c9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero__scan kbd {
  flex: none;
  font-size: 10.5px;
  color: var(--color-text-200);
  border: 1px solid var(--color-command-border);
  border-radius: 7px;
  padding: 4px 8px;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 12px 22px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 14.5px;
  cursor: pointer;
  transition:
    filter 0.2s var(--ease-power2-out),
    transform 0.2s var(--ease-power2-out);

  &--primary {
    border: none;
    background: var(--grad-cta);
    color: #04122b;
    box-shadow: 0 12px 30px -12px rgba(79, 217, 255, 0.7);

    @include hover {
      &:hover {
        filter: brightness(1.06);
        transform: translateY(-1px);
      }
    }
  }

  &--ghost {
    border: 1px solid rgba(146, 163, 199, 0.3);
    background: transparent;
    color: #dbe4f7;

    @include hover {
      &:hover {
        border-color: rgba(79, 217, 255, 0.5);
      }
    }
  }
}

@keyframes hero-scan {
  0%,
  100% {
    transform: translateX(-30%);
    opacity: 0;
  }
  12% {
    opacity: 0.9;
  }
  50% {
    transform: translateX(130%);
    opacity: 0.9;
  }
  62% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__scan-sweep {
    animation: none;
  }
}
</style>
