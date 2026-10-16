<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useLocale } from '../i18n';
defineProps<{ label: string; active?: boolean }>();
const { text } = useLocale();
const menu = ref<HTMLDetailsElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const position = ref({ left: '8px', top: '8px' });
function locate() {
  if (!menu.value?.open || !panel.value) return;
  const trigger = menu.value.querySelector('summary')?.getBoundingClientRect();
  if (!trigger) return;
  const bounds = panel.value.getBoundingClientRect();
  position.value = { left: Math.max(8, Math.min(trigger.left, window.innerWidth - bounds.width - 8)) + 'px', top: Math.max(8, Math.min(trigger.bottom + 4, window.innerHeight - bounds.height - 8)) + 'px' };
}
function outside(event: PointerEvent) { if (menu.value?.open && !menu.value.contains(event.target as Node)) menu.value.open = false; }
function closeOnLayoutChange(event: Event) { if (menu.value?.open && (!(event.target instanceof Node) || !menu.value.contains(event.target))) menu.value.open = false; }
function blur(event: FocusEvent) { if (menu.value?.open && event.relatedTarget instanceof Node && !menu.value.contains(event.relatedTarget)) menu.value.open = false; }
function escape(event: KeyboardEvent) { event.preventDefault(); event.stopPropagation(); if (!menu.value) return; menu.value.open = false; menu.value.querySelector('summary')?.focus({ preventScroll: true }); }
onMounted(() => { document.addEventListener('pointerdown', outside); document.addEventListener('scroll', closeOnLayoutChange, true); window.addEventListener('resize', closeOnLayoutChange); });
onBeforeUnmount(() => { document.removeEventListener('pointerdown', outside); document.removeEventListener('scroll', closeOnLayoutChange, true); window.removeEventListener('resize', closeOnLayoutChange); });
</script>

<template>
  <details ref="menu" class="column-filter" :class="{ 'is-active': active }" @focusout="blur" @keydown.esc="escape" @toggle="locate">
    <summary :aria-label="text('Filter ', 'Lọc ') + label"><span>{{ label }}</span><span class="column-filter__icon" aria-hidden="true">{{ active ? '●' : '⌄' }}</span></summary>
    <div ref="panel" class="column-filter__panel" :style="position"><slot /></div>
  </details>
</template>

<style scoped>
.column-filter { position:relative; min-width:0; }
summary { display:flex; justify-content:space-between; align-items:center; gap:8px; min-height:36px; padding:5px 8px; color:var(--color-text-300); cursor:pointer; list-style:none; border:1px solid transparent; border-radius:4px; font-size:11px; font-weight:500; }
summary::-webkit-details-marker { display:none; }
summary:hover,.column-filter[open]>summary { border-color:var(--color-card-border-hover); background:var(--color-beige-600); }
summary:focus-visible { outline:2px solid var(--color-orange-400); outline-offset:2px; }
.column-filter__icon { color:var(--color-text-200); font-size:10px; flex:none; }
.is-active .column-filter__icon { color:var(--color-cyan-400); }
.column-filter__panel { position:fixed; z-index:80; width:240px; max-width:calc(100vw - 32px); padding:12px; border:1px solid var(--color-card-border-hover); border-radius:6px; background:var(--space-deep); box-shadow:0 12px 28px #0007; text-align:left; }
.column-filter__panel :deep(label) { display:flex; flex-direction:column; gap:5px; color:var(--color-text-300); font-size:11px; font-weight:400; }
.column-filter__panel :deep(label + label) { margin-top:12px; }
.column-filter__panel :deep(input),.column-filter__panel :deep(select) { width:100%; min-width:0; min-height:40px; padding:7px 9px; border:1px solid var(--color-card-border); border-radius:5px; background:var(--space-navy); color:var(--color-text-400); font:inherit; font-size:13px; }
.column-filter__panel :deep(input:focus-visible),.column-filter__panel :deep(select:focus-visible) { outline:2px solid var(--color-orange-400); outline-offset:2px; }
@media(max-width:760px) { summary { min-height:44px; } .column-filter__panel :deep(input),.column-filter__panel :deep(select) { min-height:44px; font-size:16px; } }
</style>
