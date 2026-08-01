<script setup lang="ts">
import { useLinks } from "../composables/useLinks";
import Icon from "./Icon.vue";

const { config, paletteOpen, goHome, openSector, openCrew } = useLinks();
</script>

<template>
  <header class="hdr">
    <a class="hdr__brand" href="#" @click.prevent="goHome">
      <span class="hdr__mark">
        <span class="hdr__mark-glow"></span>
        <img src="/brand/intrepid-mark.png" alt="Intrepid" />
      </span>
      <span class="hdr__brand-text">
        <span class="hdr__name">{{ config?.portalName || "Value Protection Hub" }}</span>
        <span class="hdr__sub mono">VALUE PROTECTION · COMMAND CENTER</span>
      </span>
    </a>

    <nav class="hdr__nav">
      <a class="hdr__link" href="#" @click.prevent="goHome">Universe</a>
      <a class="hdr__link" href="#" @click.prevent="openSector('all')">Directory</a>
      <a class="hdr__link" href="#" @click.prevent="openCrew">Crew</a>

      <a
        v-if="config?.adminSheetUrl"
        class="hdr__link hdr__link--source"
        :href="config.adminSheetUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="external" :size="14" /> Source
      </a>

      <button type="button" class="hdr__scan" @click="paletteOpen = true">
        <Icon name="search" :size="15" />
        <span class="hdr__scan-label">Scan</span>
        <kbd class="mono">Ctrl K</kbd>
      </button>
    </nav>
  </header>
</template>

<style lang="scss" scoped>
.hdr {
  position: relative;
  z-index: var(--z-index-header);
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: var(--height-header);
  padding: 0 clamp(20px, 4vw, 52px);
  background: linear-gradient(180deg, rgba(21, 10, 48, 0.82), rgba(21, 10, 48, 0.42));
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(176, 160, 210, 0.1);
}

.hdr__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-400);
}

.hdr__mark {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 34px;
  flex: none;
}

.hdr__mark-glow {
  position: absolute;
  inset: -6px -3px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(168, 132, 246, 0.28), transparent 70%);
}

.hdr__mark img {
  position: relative;
  width: 40px;
  height: auto;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
}

.hdr__brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.hdr__name {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.01em;
}

.hdr__sub {
  font-size: 9px;
  letter-spacing: 0.28em;
  color: var(--color-text-200);
  margin-top: 5px;

  @include mq(sm, max) {
    display: none;
  }
}

.hdr__nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hdr__link {
  font-size: 14px;
  color: rgba(219, 228, 247, 0.82);
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  transition: color 0.2s;

  @include hover {
    &:hover {
      color: #fff;
    }
  }

  @include mq(md, max) {
    display: none;
  }
}

.hdr__link--source {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  @include mq(lg, max) {
    display: none;
  }
}

.hdr__scan {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 9px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(168, 132, 246, 0.3);
  background: rgba(168, 132, 246, 0.07);
  color: #e4d7ff;
  font-size: 13.5px;
  transition: background 0.2s var(--ease-power2-out);

  @include hover {
    &:hover {
      background: rgba(168, 132, 246, 0.13);
    }
  }

  kbd {
    font-size: 10px;
    color: var(--color-text-200);
    border: 1px solid var(--color-command-border);
    border-radius: 6px;
    padding: 2px 6px;
  }
}

.hdr__scan-label {
  @include mq(sm, max) {
    display: none;
  }
}
</style>
