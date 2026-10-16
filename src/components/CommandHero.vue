<script setup lang="ts">
import { computed } from 'vue';
import UniverseStage from './UniverseStage.vue';
import { useLinks } from '../composables/useLinks';
import { useLocale } from '../i18n';

const { source } = useLinks();
const { t, text } = useLocale();
const sourceLabel = computed(() => t(source.value === 'live' ? 'shell.sourceLive' : source.value === 'stale' ? 'shell.sourceStale' : source.value === 'mock' ? 'shell.sourceDemo' : source.value === 'unavailable' ? 'shell.sourceUnavailable' : 'shell.sourceLoading'));
</script>

<template>
  <section class="hero">
    <header class="hero__heading">
      <div class="hero__copy"><h1>Value Protection Universe</h1><p>{{ text('A connected system of resource planets, protected by our people.', 'Hệ hành tinh tài nguyên, được bảo vệ bởi những Value Protector.') }}</p></div>
      <span class="hero__source" :class="{ 'hero__source--warning': source === 'stale' || source === 'unavailable' || source === 'mock' }" :title="t('shell.sourceNote')" role="status"><i aria-hidden="true"></i>{{ sourceLabel }}</span>
    </header>
    <UniverseStage />
  </section>
</template>

<style lang="scss" scoped>
.hero { position:relative; z-index:1; width:100%; max-width:1720px; height:100%; min-height:0; display:flex; flex-direction:column; margin:0 auto; padding:0 var(--space-outer) 12px; }
.hero__heading { display:flex; flex:none; align-items:center; justify-content:space-between; gap:24px; padding:18px 4px 16px; }
.hero__copy { min-width:0; }
.hero__copy h1 { font-size:clamp(22px,2.4vw,32px); font-weight:600; line-height:1.1; letter-spacing:-.035em; margin:0; }
.hero__copy p { margin-top:7px; color:var(--color-text-200); font-size:13px; line-height:1.5; }
.hero__source { display:flex; align-items:center; gap:7px; flex:none; color:var(--color-text-200); font-size:10px; line-height:1.4; text-align:right; }
.hero__source i { width:5px; height:5px; flex:none; border-radius:50%; background:#bba1e9; box-shadow:0 0 8px rgba(187,161,233,.3); }.hero__source--warning i { background:#dbc18a; }
@media(max-width:700px) { .hero { padding:0 12px 8px; }.hero__heading { padding:14px 2px 12px; gap:12px; }.hero__copy p { font-size:12px; max-width:380px; }.hero__source { font-size:9px; max-width:110px; }.hero__copy h1 { font-size:23px; } }
@media(max-width:400px) { .hero__heading { flex-wrap:wrap; gap:7px; }.hero__source { max-width:none; font-size:9px; }.hero__copy h1 { font-size:22px; }.hero__copy p { font-size:11px; } }
</style>
