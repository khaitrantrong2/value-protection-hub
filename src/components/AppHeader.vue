<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useLinks } from '../composables/useLinks';
import { useLocale } from '../i18n';
import Icon from './Icon.vue';
import { containDialogFocus } from '../services/focusScope';

const { config, paletteOpen, view, goHome, openSector, openCrew, openAtlas, openStart } = useLinks();
const { t } = useLocale();
const menu = ref<HTMLDialogElement | null>(null);
const menuOpen = ref(false);
const items = computed(() => [
  { id: 'home', label: t('shell.home'), href: '#', action: goHome },
  { id: 'start', label: t('shell.start'), href: '#start', action: openStart },
  { id: 'sector', label: t('shell.directory'), href: '#directory', action: () => openSector('all') },
  { id: 'crew', label: t('shell.crew'), href: '#crew', action: openCrew },
  { id: 'atlas', label: t('shell.atlas'), href: '#atlas', action: () => openAtlas() },
]);
const current = (id: string) => view.value === id || (id === 'crew' && view.value === 'member');
function closeMenu() { menu.value?.close(); menuOpen.value = false; }
function navigate(action: () => void) { closeMenu(); action(); }
function showMenu() { menu.value?.showModal(); menuOpen.value = true; }
function skipToMain() { document.getElementById('main-content')?.focus({ preventScroll: true }); }
onBeforeUnmount(closeMenu);
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="skipToMain">{{ t('shell.skip') }}</a>
  <header class="hdr">
    <a class="hdr__brand" href="#" @click.prevent="goHome">
      <img src="/brand/intrepid-mark.png" alt="Intrepid" width="36" height="32" />
      <span class="hdr__identity"><span class="hdr__name">{{ config?.portalName || 'Value Protection Hub' }}</span><span class="hdr__tagline">{{ t('shell.tagline') }}</span></span>
    </a>
    <nav class="hdr__desktop" :aria-label="t('shell.navigation')">
      <a v-for="item in items" :key="item.id" :href="item.href" :aria-current="current(item.id) ? 'page' : undefined" @click.prevent="item.action">{{ item.label }}</a>
    </nav>
    <div class="hdr__tools">
      <button class="hdr__search" type="button" :aria-label="t('shell.searchLabel')" @click="paletteOpen = true"><Icon name="search" :size="18" /><span>{{ t('shell.search') }}</span><kbd>⌘ / Ctrl K</kbd></button>
      <button class="hdr__menu" type="button" :aria-label="t('shell.menu')" :aria-expanded="menuOpen" aria-controls="hub-mobile-menu" @click="showMenu"><Icon name="list" :size="22" /></button>
    </div>
  </header>
  <dialog id="hub-mobile-menu" ref="menu" class="mobile-menu" :aria-label="t('shell.navigation')" @keydown="containDialogFocus($event, menu)" @close="menuOpen = false" @click="($event.target === menu) && closeMenu()">
    <div class="mobile-menu__heading"><span>{{ t('shell.navigation') }}</span><button type="button" class="vph-icon-button" :aria-label="t('shell.closeMenu')" @click="closeMenu"><Icon name="close" /></button></div>
    <nav :aria-label="t('shell.navigation')"><a v-for="item in items" :key="item.id" :href="item.href" :aria-current="current(item.id) ? 'page' : undefined" @click.prevent="navigate(item.action)">{{ item.label }}<Icon name="arrowRight" :size="18" /></a></nav>
  </dialog>
</template>

<style scoped lang="scss">
.hdr { flex: none; min-height: var(--height-header); position: relative; z-index: var(--z-index-header); display: flex; align-items: center; gap: 20px; padding: 12px clamp(16px, 3vw, 44px); background: rgba(21, 10, 48, .86); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-card-border); }
.hdr__brand { display: flex; align-items: center; gap: 10px; min-width: 0; margin-right: auto; }
.hdr__brand img { flex: none; object-fit: contain; }
.hdr__identity { display: flex; flex-direction: column; min-width: 0; gap: 4px; }
.hdr__name { font-size: 15px; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hdr__tagline { font-size: 9px; letter-spacing: .16em; color: var(--color-text-200); }
.hdr__desktop { display: flex; align-items: center; gap: 2px; }
.hdr__desktop a { display: flex; align-items: center; min-height: 44px; padding: 0 11px; font-size: 13px; border-radius: var(--radius-md); color: var(--color-text-300); white-space: nowrap; transition: background .18s, color .18s; }
.hdr__desktop a:hover, .hdr__desktop a[aria-current] { background: var(--color-beige-600); color: var(--color-text-400); }
.hdr__tools { display: flex; align-items: center; gap: 10px; flex: none; }
.hdr__search, .hdr__menu { display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 44px; min-height: 44px; border: 1px solid var(--color-card-border); border-radius: var(--radius-md); background: var(--color-beige-500); color: var(--color-text-300); }
.hdr__search { padding: 0 12px; font-size: 13px; }
.hdr__search kbd { color: var(--color-text-200); font-size: 9px; }
.hdr__menu { display: none; }
.mobile-menu { position: fixed; inset: 12px 12px auto auto; margin: 0; padding: 18px; width: min(360px, calc(100vw - 24px)); border: 1px solid var(--color-card-border-hover); border-radius: var(--radius-lg); color: var(--color-text-400); background: var(--space-navy); box-shadow: var(--shadow-card); max-height: calc(100dvh - 24px); overflow-y: auto; }
.mobile-menu::backdrop { background: rgba(7,3,17,.76); }
.mobile-menu__heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; font-size: 14px; color: var(--color-text-200); }
.mobile-menu nav { display: grid; gap: 5px; }
.mobile-menu nav a { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; padding: 12px; border-radius: var(--radius-md); }
.mobile-menu nav a[aria-current] { background: var(--color-beige-700); }
@media (max-width: 1170px) { .hdr__search span, .hdr__search kbd { display: none; } .hdr__search { padding: 0; } .hdr { gap: 12px; } }
@media (max-width: 980px) { .hdr__desktop { display: none; } .hdr__menu { display: flex; } }
@media (max-width: 480px) { .hdr { padding: 10px 12px; gap: 6px; } .hdr__brand { gap: 7px; } .hdr__brand img { width: 28px; height: 28px; } .hdr__name { font-size: 12px; } .hdr__tagline { display: none; } .hdr__tools { gap: 5px; } }
</style>
