<script setup lang="ts">
import { computed } from 'vue';
import { useLinks } from '../composables/useLinks';
import { useLocale } from '../i18n';
import Icon from './Icon.vue';

const { openAtlas, openCrew, openSector } = useLinks();
const { t } = useLocale();
const paths = computed(() => [
  { key: 'auditor', icon: 'project', action: () => openAtlas('01') },
  { key: 'onboarding', icon: 'globe', action: openCrew },
  { key: 'daily', icon: 'folder', action: () => openSector('all') },
]);
const terms = ['claimback', 'accrual', 'settlement', 'control'];
</script>

<template>
  <section class="start-page vph-scroll">
    <div class="start-page__inner">
      <header class="start-page__heading"><p class="start-page__eyebrow">VALUE PROTECTION HUB</p><h1>{{ t('shell.startTitle') }}</h1><p>{{ t('shell.startSubtitle') }}</p></header>
      <div class="start-page__paths">
        <article v-for="(path, index) in paths" :key="path.key" class="start-path vph-surface">
          <div class="start-path__top"><Icon :name="path.icon" :size="25" /><span class="mono">0{{ index + 1 }}</span></div>
          <h2>{{ t(`shell.${path.key}`) }}</h2><p>{{ t(`shell.${path.key}Description`) }}</p>
          <button type="button" class="vph-button" @click="path.action">{{ t(`shell.${path.key}Action`) }}<Icon name="arrowRight" :size="16" /></button>
        </article>
      </div>
      <section class="start-ownership vph-surface"><div><h2>{{ t('shell.ownershipTitle') }}</h2><p>{{ t('shell.ownershipDescription') }}</p></div><button type="button" class="vph-button" @click="openCrew">{{ t('shell.ownershipAction') }}<Icon name="arrowRight" :size="16" /></button></section>
      <section class="start-glossary"><header><h2>{{ t('shell.readingTitle') }}</h2><p>{{ t('shell.readingSubtitle') }}</p></header><dl><div v-for="term in terms" :key="term"><dt>{{ t(`shell.${term}Term`) }}</dt><dd>{{ t(`shell.${term}Def`) }}</dd></div></dl></section>
    </div>
  </section>
</template>

<style scoped lang="scss">
.start-page { height: 100%; overflow: auto; }
.start-page__inner { max-width: 1280px; margin: auto; padding: clamp(24px, 4vw, 52px) clamp(16px, 4vw, 48px) 64px; }
.start-page__heading { max-width: 760px; margin-bottom: 32px; }
.start-page__eyebrow { font-size: 11px; letter-spacing: .15em; color: var(--color-cyan-400); margin-bottom: 14px; }
.start-page h1 { font-size: clamp(30px, 4vw, 48px); letter-spacing: -.03em; line-height: 1.15; margin-bottom: 14px; text-wrap: balance; }
.start-page p { color: var(--color-text-300); line-height: 1.65; font-size: 16px; }
.start-page__paths { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.start-path { padding: 24px; display: flex; flex-direction: column; min-width: 0; }
.start-path__top { display: flex; align-items: center; justify-content: space-between; color: var(--color-cyan-400); margin-bottom: 24px; }
.start-path__top span { color: var(--color-text-200); font-size: 12px; }
.start-path h2 { font-size: 23px; line-height: 1.25; margin-bottom: 12px; text-wrap: balance; }
.start-path p { flex: 1; margin-bottom: 28px; }
.start-path button { align-self: flex-start; text-align: start; }
.start-ownership { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 24px; margin-top: 18px; }
.start-ownership h2, .start-glossary h2 { font-size: 23px; margin-bottom: 10px; }
.start-ownership p { max-width: 70ch; }
.start-ownership button { flex: none; }
.start-glossary { padding-top: 40px; }
.start-glossary dl { margin-top: 18px; display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 0 28px; }
.start-glossary dl > div { padding: 22px 0; border-top: 1px solid var(--color-card-border); }
.start-glossary dt { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.start-glossary dd { font-size: 15px; line-height: 1.65; color: var(--color-text-300); }
@media (max-width: 860px) { .start-page__paths { grid-template-columns: 1fr; } .start-path { padding: 22px; } .start-path__top { margin-bottom: 14px; } .start-path p { margin-bottom: 18px; } .start-ownership { flex-direction: column; align-items: flex-start; } }
@media (max-width: 560px) { .start-glossary dl { grid-template-columns: 1fr; } }
</style>
