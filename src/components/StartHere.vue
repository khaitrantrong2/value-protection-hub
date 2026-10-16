<script setup lang="ts">
import { computed } from 'vue';
import { useLinks } from '../composables/useLinks';
import { useLocale } from '../i18n';
import Icon from './Icon.vue';
const { openAtlas, openCrew, openSector } = useLinks();
const { t, text } = useLocale();
const paths = computed(() => [
  { key: 'auditor', icon: 'project', code: '01', action: () => openAtlas('01') },
  { key: 'onboarding', icon: 'globe', code: '02', action: openCrew },
  { key: 'daily', icon: 'folder', code: '03', action: () => openSector('all') },
]);
</script>

<template>
  <section class="start-page vph-scroll">
    <div class="start-page__inner">
      <header class="start-page__heading">
        <p class="start-page__eyebrow">{{ text('MISSION BRIEFING', 'ĐỊNH HƯỚNG HÀNH TRÌNH') }}</p>
        <h1>{{ text('Choose your flight path.', 'Chọn hành trình của bạn.') }}</h1>
        <p>{{ t('shell.startSubtitle') }}</p>
      </header>
      <div class="start-routes">
        <svg class="start-route-line" viewBox="0 0 1200 180" fill="none" preserveAspectRatio="none" aria-hidden="true"><path d="M20 120C160 120 180 35 330 60S510 175 650 110 900 0 1180 70" /><path d="M20 150C160 150 180 65 330 90S510 205 650 140 900 30 1180 100" /></svg>
        <article v-for="path in paths" :key="path.key" class="start-station">
          <div class="start-station__orbit" aria-hidden="true"><span></span><Icon :name="path.icon" :size="28" /></div>
          <p class="start-station__code">{{ text('FLIGHT PATH', 'HÀNH TRÌNH') }} {{ path.code }}</p>
          <h2>{{ t('shell.' + path.key) }}</h2>
          <p class="start-station__body">{{ t('shell.' + path.key + 'Description') }}</p>
          <button type="button" class="vph-button" @click="path.action">{{ t('shell.' + path.key + 'Action') }}<Icon name="arrowRight" :size="16" /></button>
        </article>
      </div>
      <p class="start-page__note">{{ text('Three entry points. One connected protection system.', 'Ba điểm khởi hành. Một hệ thống bảo vệ giá trị.') }}</p>
    </div>
  </section>
</template>

<style scoped>
.start-page { height: 100%; overflow: auto; overscroll-behavior: contain; background: radial-gradient(ellipse at 70% 45%,rgb(115 73 182 / .1),transparent 65%); }
.start-page__inner { max-width: 1280px; margin: auto; padding: 28px clamp(20px,4vw,48px) 24px; }
.start-page__heading { max-width: 720px; }
.start-page__eyebrow { font-size: 10px; letter-spacing: .16em; color: var(--color-cyan-400); margin-bottom: 10px; }
h1 { font-size: clamp(26px,3vw,40px); line-height: 1.25; font-weight: 600; letter-spacing: -.035em; margin-bottom: 12px; text-wrap: balance; }
.start-page__heading>p:last-child { font-size: 14px; color: var(--color-text-300); line-height: 1.7; max-width: 65ch; }
.start-routes { position: relative; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 24px; padding-top: 20px; margin-top: 16px; }
.start-route-line { position: absolute; inset: 10px 0 auto; width: 100%; height: 150px; pointer-events: none; color: var(--color-cyan-400); }
.start-route-line path { stroke: currentColor; stroke-width: 1; opacity: .3; stroke-dasharray: 3 8; }
.start-route-line path+path { opacity: .08; stroke-dasharray: none; }
.start-station { position: relative; min-width: 0; padding: 16px 20px 20px; border-bottom: 1px solid var(--color-card-border); background: linear-gradient(180deg,transparent,rgb(18 10 38 / .7)); border-radius: 0 0 12px 12px; display: flex; flex-direction: column; align-items: flex-start; }
.start-station:nth-of-type(2) { --station-accent: var(--color-orange-400); }
.start-station__orbit { position: relative; width: 76px; height: 76px; display: grid; place-items: center; color: var(--station-accent,var(--color-cyan-400)); margin-bottom: 16px; border: 1px solid color-mix(in srgb,currentColor 35%,transparent); border-radius: 50%; background: radial-gradient(circle at 35% 25%,color-mix(in srgb,currentColor 20%,transparent),var(--space-navy) 75%); box-shadow: 0 0 32px color-mix(in srgb,currentColor 8%,transparent); }
.start-station__orbit:after { content: ''; position: absolute; inset: -9px -18px; border: 1px solid color-mix(in srgb,currentColor 20%,transparent); border-radius: 50%; transform: rotate(-25deg); }
.start-station__orbit>span { width: 5px; height: 5px; border-radius: 50%; position: absolute; right: -3px; top: 30px; background: currentColor; box-shadow: 0 0 12px currentColor; }
.start-station__code { font-size: 9px; letter-spacing: .12em; color: var(--station-accent,var(--color-cyan-400)); margin-bottom: 10px; }
h2 { font-size: 20px; font-weight: 500; line-height: 1.4; letter-spacing: -.025em; margin-bottom: 10px; text-wrap: balance; }
.start-station__body { flex: 1; font-size: 14px; line-height: 1.75; color: var(--color-text-300); max-width: 40ch; margin-bottom: 20px; }
.start-station .vph-button { min-height: 44px; padding: 8px 12px; font-size: 12px; text-align: left; }
.start-page__note { font-size: 11px; line-height: 1.7; color: var(--color-text-200); margin-top: 20px; }
@media(min-width:1000px) and (min-height:850px) { .start-page__inner { padding-top: 48px; } .start-routes { margin-top: 32px; } }
@media(max-width:900px) { .start-routes { grid-template-columns: minmax(0,1fr); gap: 16px; padding-top: 0; margin-top: 24px; } .start-route-line { display: none; } .start-station { padding: 16px; border: 1px solid var(--color-card-border); border-radius: 12px; } .start-station__orbit { width: 52px; height: 52px; margin-bottom: 12px; } }
</style>
