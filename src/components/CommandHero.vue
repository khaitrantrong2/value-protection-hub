<script setup lang="ts">
import { onMounted, ref } from "vue";
import { gsap, VPH_EASE } from "../motion";
import UniverseStage from "./UniverseStage.vue";
import Icon from "./Icon.vue";
import { useLinks } from "../composables/useLinks";
import { useReducedMotion } from "../composables/useReducedMotion";

const { config, openSector, openCrew } = useLinks();
const { prefersReducedMotion } = useReducedMotion();

const heroRef = ref<HTMLElement | null>(null);
const driveQuery = ref("");

function searchDrive() {
  const q = driveQuery.value.trim();
  const url = q
    ? `https://drive.google.com/drive/search?q=${encodeURIComponent(q)}`
    : "https://drive.google.com/drive/my-drive";
  window.open(url, "_blank", "noopener");
}

function scanVaults() {
  // "The vaults" = the Claimback control assets.
  openSector("claimback-trackers");
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
        A galactic command center for the trackers, dashboards, SOPs, and control assets that protect value across
        Intrepid.
      </p>

      <form class="hero__scan" data-reveal @submit.prevent="searchDrive">
        <span class="hero__scan-sweep"></span>
        <Icon name="search" :size="18" class="hero__scan-icon" />
        <input
          v-model="driveQuery"
          type="search"
          class="hero__scan-input"
          placeholder="Search Google Drive — files, folders, shared docs…"
          aria-label="Search Google Drive"
        />
        <button type="submit" class="hero__scan-go" aria-label="Search Google Drive">
          <Icon name="arrowRight" :size="16" />
        </button>
      </form>

      <div class="hero__actions" data-reveal>
        <button type="button" class="hero__cta hero__cta--primary" @click="scanVaults">
          Scan the vaults
          <Icon name="arrowRight" :size="16" />
        </button>
        <button type="button" class="hero__cta hero__cta--ghost" @click="openCrew">Meet the crew</button>
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
  border: 1px solid rgba(168, 132, 246, 0.28);
  background: rgba(168, 132, 246, 0.06);
  margin-bottom: 24px;
}

.hero__status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #b794f6;
  box-shadow: 0 0 10px #b794f6;
}

.hero__status-text {
  font-size: 11px;
  letter-spacing: 0.24em;
  color: #d4c2f5;
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
  color: #d8cdf0;
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
  gap: 12px;
  padding: 7px 8px 7px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(168, 132, 246, 0.3);
  background: linear-gradient(180deg, rgba(30, 16, 66, 0.55), rgba(21, 10, 48, 0.35));
  box-shadow:
    0 0 0 1px rgba(168, 132, 246, 0.05),
    0 20px 50px -22px rgba(0, 0, 0, 0.8);

  &:focus-within {
    border-color: rgba(183, 148, 246, 0.6);
  }
}

.hero__scan-sweep {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 34%;
  background: linear-gradient(90deg, transparent, rgba(168, 132, 246, 0.14), transparent);
  animation: hero-scan 4.2s var(--ease-power2-in) infinite;
  pointer-events: none;
}

.hero__scan-icon {
  color: #b794f6;
  flex: none;
}

.hero__scan-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: none;
  font-size: 14px;
  color: var(--color-text-400);

  &::placeholder {
    color: #9d92c0;
  }
}

.hero__scan-go {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: none;
  background: var(--grad-cta);
  color: #fff;
  cursor: pointer;
  transition: filter 0.2s var(--ease-power2-out);

  @include hover {
    &:hover {
      filter: brightness(1.08);
    }
  }
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
    color: #fff;
    box-shadow: 0 12px 30px -12px rgba(155, 109, 255, 0.7);

    @include hover {
      &:hover {
        filter: brightness(1.06);
        transform: translateY(-1px);
      }
    }
  }

  &--ghost {
    border: 1px solid rgba(176, 160, 210, 0.3);
    background: transparent;
    color: #e8e0ff;

    @include hover {
      &:hover {
        border-color: rgba(183, 148, 246, 0.5);
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
