<script setup lang="ts">
import { computed, useId } from 'vue';
import type { FleetHull } from '../services/fleetMotion';

const props = withDefaults(defineProps<{ arch: FleetHull; livery?: number }>(), { livery: 0 });
const instance = useId().replace(/[^a-z0-9-]/gi, '');
const metalId = instance + '-metal', engineId = instance + '-engine';
const liveries = [
  { armor: '#9F8AF0', trim: '#EFC577', glass: '#87E2DF', inset: '#D373A6' },
  { armor: '#6599CF', trim: '#F0B584', glass: '#B7F0E8', inset: '#B294E6' },
  { armor: '#69B4A6', trim: '#E9CB80', glass: '#A5C9F8', inset: '#D18BA9' },
  { armor: '#C37E92', trim: '#F3D79E', glass: '#8DE5E7', inset: '#A799E5' },
];
const paint = computed(() => {
  const seed = Math.abs(Math.trunc(props.livery));
  if (seed < liveries.length) return liveries[seed]!;
  const hue = (seed * 137.508) % 360;
  const color = (offset: number, lightness: number) => `hsl(${(hue + offset) % 360} 56% ${lightness}%)`;
  return { armor: color(0, 65), trim: color(70, 74), glass: color(165, 79), inset: color(265, 65) };
});
const designs: Record<FleetHull, { wings: string; body: string; glass: string; stripe: string; engines: number[] }> = {
  scout: { wings: 'M25 25 4 53 24 45ZM39 25 60 53 40 45Z', body: 'M32 3 42 52 32 60 22 52Z', glass: 'M32 16 37 34 27 34Z', stripe: 'M12 47 24 38M40 38 52 47', engines: [32] },
  interceptor: { wings: 'M24 28 3 14 9 44 23 51ZM40 28 61 14 55 44 41 51Z', body: 'M32 3 39 30 37 57 27 57 25 30Z', glass: 'M32 13 35 30 29 30Z', stripe: 'M8 26 20 40M56 26 44 40', engines: [32] },
  cruiser: { wings: 'M20 24 3 40 5 51 21 48ZM44 24 61 40 59 51 43 48Z', body: 'M32 4C44 12 47 37 43 56L21 56C17 37 20 12 32 4Z', glass: 'M32 15C38 18 39 26 37 31L27 31C25 26 26 18 32 15Z', stripe: 'M8 44 19 39M56 44 45 39', engines: [24, 40] },
  shuttle: { wings: 'M19 29 4 43 5 52 19 48ZM45 29 60 43 59 52 45 48Z', body: 'M23 8 41 8 47 56 17 56Z', glass: 'M25 13 39 13 41 25 23 25Z', stripe: 'M23 34H41M22 41H42', engines: [24, 40] },
  lancer: { wings: 'M27 30 11 18 8 54 25 48ZM37 30 53 18 56 54 39 48Z', body: 'M32 1 38 42 35 61 29 61 26 42Z', glass: 'M32 16 34 35 30 35Z', stripe: 'M13 34 12 48M51 34 52 48', engines: [16, 32, 48] },
  twinwing: { wings: 'M21 15 6 7 4 54 20 48ZM43 15 58 7 60 54 44 48Z', body: 'M32 8 42 38 39 57 25 57 22 38Z', glass: 'M32 20 37 37 27 37Z', stripe: 'M10 18V45M54 18V45M18 34H46', engines: [12, 32, 52] },
  nova: { wings: 'M27 23 3 35 11 53 25 46ZM37 23 61 35 53 53 39 46Z', body: 'M32 3 45 34 41 55 32 62 23 55 19 34Z', glass: 'M32 16 38 32 32 39 26 32Z', stripe: 'M9 37 19 43M55 37 45 43', engines: [22, 42] },
  falcon: { wings: 'M25 21 3 31 12 57 26 43ZM39 21 61 31 52 57 38 43Z', body: 'M32 5 42 38 38 58 26 58 22 38Z', glass: 'M32 17 37 31 32 36 27 31Z', stripe: 'M9 33 17 47M55 33 47 47', engines: [20, 32, 44] },
  aegis: { wings: 'M24 18 3 31 6 48 23 43ZM40 18 61 31 58 48 41 43ZM24 37 9 53 18 59 29 49ZM40 37 55 53 46 59 35 49Z', body: 'M32 2 46 26 41 50 32 62 23 50 18 26Z', glass: 'M32 12 39 27 32 36 25 27Z', stripe: 'M8 33 19 28M56 33 45 28M15 53 23 47M49 53 41 47', engines: [19, 32, 45] },
};
const hull = computed(() => designs[props.arch]);
</script>

<template>
  <svg width="50" height="58" viewBox="0 0 64 76" fill="none" aria-hidden="true" :data-hull="arch" :data-special-hull="arch === 'aegis' ? 'true' : undefined">
    <defs>
      <linearGradient :id="metalId" x1="18" y1="8" x2="46" y2="57" gradientUnits="userSpaceOnUse"><stop stop-color="#F3F0E9"/><stop offset=".37" stop-color="#BEC7DD"/><stop offset=".48" stop-color="#697B9B"/><stop offset=".65" stop-color="#DCE1EC"/><stop offset="1" stop-color="#53627F"/></linearGradient>
      <linearGradient :id="engineId" x1="0" y1="0" x2="0" y2="1"><stop :stop-color="paint.glass"/><stop offset=".4" stop-color="#B38FF3"/><stop offset="1" :stop-color="paint.inset" stop-opacity="0"/></linearGradient>
    </defs>
    <g v-if="arch === 'aegis'" class="signature-aura"><path d="M32 1 60 27 55 56 32 70 9 56 4 27Z" :stroke="paint.trim" stroke-width=".55" opacity=".5"/><path d="M32 0V5M32 67V73M0 34H6M58 34H64" :stroke="paint.glass" stroke-width="1.3"/></g>
    <g v-for="engine in hull.engines" :key="engine" class="flame"><path :d="`M${engine - 3} 56 Q${engine - 6} 66 ${engine} 75 Q${engine + 6} 66 ${engine + 3} 56Z`" :fill="`url(#${engineId})`" opacity=".85"/><path :d="`M${engine - 1.2} 57 ${engine} 69 ${engine + 1.2} 57Z`" fill="#DDFDFF"/></g>
    <path :d="hull.wings" :fill="paint.armor" stroke="#E1D8F0" stroke-width=".7" stroke-linejoin="round"/>
    <path :d="hull.stripe" :stroke="paint.trim" stroke-width="2.2" stroke-linecap="round"/>
    <path :d="hull.body" :fill="`url(#${metalId})`" stroke="#E0D8ED" stroke-width=".75" stroke-linejoin="round"/>
    <path d="M32 8 35 41 32 54 29 41Z" :fill="paint.armor" opacity=".75"/>
    <path :d="hull.glass" :fill="paint.glass" stroke="#EEE9FF" stroke-width=".55"/>
    <path d="M30 38H34L35 43H29Z" :fill="paint.inset"/>
    <path d="M29 48H35M28 51H36" :stroke="paint.trim" stroke-width="1.4"/>
    <circle cx="17" cy="44" r="1.2" :fill="paint.inset"/><circle cx="47" cy="44" r="1.2" :fill="paint.glass"/>
    <path v-for="engine in hull.engines" :key="'engine-' + engine" :d="`M${engine - 3} 55H${engine + 3}V59H${engine - 3}Z`" fill="#28334D" :stroke="paint.trim" stroke-width=".8"/>
    <path v-if="arch === 'aegis'" d="M32 38 35 42 32 46 29 42Z" fill="#F8DB8D"/>
  </svg>
</template>

<style scoped>
svg { overflow:visible; }
.flame { transform-origin:32px 57px; animation:engine-thrust 1.6s ease-in-out infinite; }
@keyframes engine-thrust { 0%,100% { transform:scaleY(.86); opacity:.75; } 50% { transform:scaleY(1.08); opacity:1; } }
.signature-aura { filter:drop-shadow(0 0 3px #EFC57766); }
@media(prefers-reduced-motion:reduce) { .flame { animation:none; } }
</style>
