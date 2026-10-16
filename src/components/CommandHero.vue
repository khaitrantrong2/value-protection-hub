<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { gsap, VPH_EASE } from "../motion";
import UniverseStage from "./UniverseStage.vue";
import Icon from "./Icon.vue";
import { useLinks } from "../composables/useLinks";
import { useReducedMotion } from "../composables/useReducedMotion";
import { useLocale } from '../i18n';

const { openSector, openCrew, openAtlas, source, paletteOpen } = useLinks();
const { t } = useLocale();
const { prefersReducedMotion } = useReducedMotion();

const heroRef = ref<HTMLElement | null>(null);
const driveQuery = ref("");
const searchMode = ref<'hub' | 'drive'>('hub');
const sourceLabel = computed(() => t(source.value === 'live' ? 'shell.sourceLive' : source.value === 'stale' ? 'shell.sourceStale' : source.value === 'mock' ? 'shell.sourceDemo' : source.value === 'unavailable' ? 'shell.sourceUnavailable' : 'shell.sourceLoading'));
let motionContext: ReturnType<typeof gsap.context> | undefined;

function searchDrive() {
  const q = driveQuery.value.trim();
  const url = q
    ? `https://drive.google.com/drive/search?q=${encodeURIComponent(q)}`
    : "https://drive.google.com/drive/my-drive";
  window.open(url, "_blank", "noopener");
}

function scanVaults() {
  openSector('all');
}

onMounted(() => {
  if (!heroRef.value || prefersReducedMotion.value) return;
  motionContext = gsap.context(() => {
    gsap.from('[data-reveal]', { opacity: 0, y: 14, duration: 0.45, ease: VPH_EASE, stagger: 0.045 });
  }, heroRef.value);
});
onBeforeUnmount(() => motionContext?.revert());
</script>

<template>
  <section ref="heroRef" class="hero">
    <div class="hero__copy">
      <div class="hero__status" data-reveal :title="t('shell.sourceNote')" role="status">
        <span class="hero__status-dot"></span>
        <span class="hero__status-text">{{ sourceLabel }}</span>
      </div>

      <h1 class="hero__title" data-reveal>Value<br />Protection Hub</h1>

      <p class="hero__subtitle" data-reveal>
        {{ t('shell.heroSubtitle') }}
      </p>
      <p class="hero__desc" data-reveal>
        {{ t('shell.heroDescription') }}
      </p>

      <div class="hero__search-scope" role="group" :aria-label="t('shell.searchScope')" data-reveal><button type="button" :aria-pressed="searchMode === 'hub'" @click="searchMode = 'hub'">{{ t('shell.search') }}</button><button type="button" :aria-pressed="searchMode === 'drive'" @click="searchMode = 'drive'">{{ t('shell.drive') }}<Icon name="external" :size="12" /></button></div>
      <button v-if="searchMode === 'hub'" type="button" class="hero__hub-search" data-reveal @click="paletteOpen = true"><Icon name="search" :size="18" /><span>{{ t('shell.searchPlaceholder') }}</span><Icon name="arrowRight" :size="18" /></button>
      <form v-else class="hero__scan" data-reveal @submit.prevent="searchDrive">
        <span class="hero__scan-sweep"></span>
        <Icon name="search" :size="18" class="hero__scan-icon" />
        <input
          v-model="driveQuery"
          type="search"
          class="hero__scan-input"
          :placeholder="t('shell.driveSearch')"
          :aria-label="t('shell.driveSearch')"
        />
        <button type="submit" class="hero__scan-go" :aria-label="t('shell.driveSearch')">
          <Icon name="arrowRight" :size="16" />
        </button>
      </form>
      <p class="hero__search-hint">{{ t(searchMode === 'hub' ? 'shell.searchHint' : 'shell.driveHint') }}</p>

      <div class="hero__actions" data-reveal>
        <button type="button" class="hero__cta hero__cta--primary" @click="scanVaults">
          {{ t('shell.findAsset') }}
          <Icon name="arrowRight" :size="16" />
        </button>
        <button type="button" class="hero__cta hero__cta--ghost" @click="openAtlas('01')">{{ t('shell.understandProcess') }}</button>
        <button type="button" class="hero__team-link" @click="openCrew">{{ t('shell.meetTeam') }}<Icon name="arrowRight" :size="14" /></button>
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
  min-height: 100%;

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
  letter-spacing: 0.02em;
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
  font-size: 16px;
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

.hero__search-scope { display: flex; gap: 6px; margin-bottom: 10px; }
.hero__search-scope button { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; border: 1px solid transparent; border-radius: var(--radius-md); padding: 8px 10px; background: transparent; color: var(--color-text-200); font-size: 12px; }
.hero__search-scope button[aria-pressed=true] { color: var(--color-text-400); background: var(--color-beige-600); border-color: var(--color-card-border); }
.hero__hub-search { width: 100%; max-width: 500px; min-height: 56px; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid var(--color-card-border-hover); border-radius: var(--radius-lg); background: var(--color-field-bg); color: var(--color-text-300); text-align: start; font-size: 15px; }
.hero__hub-search span { flex: 1; }
.hero__search-hint { max-width: 500px; font-size: 12px; line-height: 1.6; color: var(--color-text-200); margin-top: 10px; }
.hero__team-link { min-height: 44px; display: inline-flex; gap: 8px; align-items: center; background: transparent; border: 0; font-size: 14px; color: var(--color-text-300); padding: 6px; }
@media (max-width: 540px) { .hero__copy { max-width: 100%; } .hero__actions { gap: 8px; } .hero__hub-search { font-size: 16px; } }

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
