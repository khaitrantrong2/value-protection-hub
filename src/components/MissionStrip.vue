<script setup lang="ts">
import { computed } from 'vue';
import { useLocale } from '../i18n';
import { useLinks } from '../composables/useLinks';
import Icon from './Icon.vue';
const { t } = useLocale();
const { openAtlas, openSector, openCrew } = useLinks();
const paths = computed(() => [
  { id: 'Process', code: '01', icon: 'project', action: () => openAtlas('01') },
  { id: 'Resources', code: '02', icon: 'folder', action: () => openSector('all') },
  { id: 'Team', code: '03', icon: 'globe', action: openCrew },
]);
</script>
<template>
  <section class="mission" :aria-label="t('shell.startTitle')">
    <a v-for="path in paths" :key="path.id" :href="path.id === 'Process' ? '#atlas?mode=guide&stage=01' : path.id === 'Resources' ? '#directory' : '#crew'" class="mission__path" @click.prevent="path.action">
      <span class="mission__top"><span class="mono">{{ path.code }}</span><Icon :name="path.icon" :size="20" /></span>
      <h2>{{ t('shell.mission' + path.id) }}</h2><p>{{ t('shell.mission' + path.id + 'Description') }}</p><Icon name="arrowRight" :size="18" />
    </a>
  </section>
</template>
<style scoped>
.mission { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 0; max-width: 1420px; margin: auto; padding: 28px clamp(16px,4vw,52px) 64px; }
.mission__path { padding: 24px; border-top: 1px solid var(--color-card-border); display: flex; flex-direction: column; gap: 14px; min-width: 0; transition: background .2s var(--ease-power2-out); }
.mission__path:hover { background: var(--color-beige-500); }
.mission__path + .mission__path { border-left: 1px solid var(--color-card-border); }
.mission__top { display: flex; justify-content: space-between; color: var(--color-cyan-400); font-size: 12px; }
.mission h2 { font-size: 21px; line-height: 1.3; font-weight: 550; }
.mission p { font-size: 15px; line-height: 1.65; color: var(--color-text-300); max-width: 45ch; flex: 1; }
.mission__path > svg { color: var(--color-cyan-400); }
@media(max-width:780px) { .mission { grid-template-columns: 1fr; padding-top: 24px; } .mission__path { padding: 24px 4px; } .mission__path + .mission__path { border-left: 0; } }
</style>
