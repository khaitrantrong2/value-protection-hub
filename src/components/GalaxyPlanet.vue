<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(defineProps<{ id: string; color: string; surface?: 'terrain' | 'bands' | 'craters'; rings?: boolean }>(), { surface: 'terrain', rings: false });
const uid = computed(() => `galaxy-${props.id}`);
</script>

<template>
  <svg class="galaxy-planet" viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <defs>
      <radialGradient :id="uid + '-sphere'" cx="31%" cy="25%" r="78%"><stop stop-color="#f1eaff"/><stop offset=".24" :stop-color="color"/><stop offset=".72" stop-color="#302447"/><stop offset="1" stop-color="#090b1b"/></radialGradient>
      <radialGradient :id="uid + '-shadow'" cx="26%" cy="18%" r="91%"><stop offset=".3" stop-color="#03040b" stop-opacity="0"/><stop offset="1" stop-color="#03040b" stop-opacity=".9"/></radialGradient>
      <clipPath :id="uid + '-clip'"><circle cx="60" cy="60" r="39"/></clipPath>
    </defs>
    <ellipse v-if="rings" cx="60" cy="63" rx="57" ry="15" transform="rotate(-24 60 63)" :stroke="color" stroke-opacity=".36" stroke-width="4"/>
    <circle cx="60" cy="60" r="41" :stroke="color" stroke-opacity=".17" stroke-width="3"/>
    <circle cx="60" cy="60" r="39" :fill="`url(#${uid}-sphere)`"/>
    <g :clip-path="`url(#${uid}-clip)`" stroke="#eae0ff" stroke-opacity=".19">
      <g v-if="surface === 'terrain'" fill="#eadbff" fill-opacity=".15" stroke-width=".5"><path d="M23 41 35 31 48 34 50 44 65 47 62 56 48 58 45 69 35 72 30 62Z"/><path d="m79 27-9 11 4 10 14 2 11 14 7-17Z"/><path d="m61 73 11-5 17 7-2 16-15 12-13-10Z"/><path d="m33 23 13 14 11-6 5 8 17-4M25 83l17-9 10 9 8-4 5 18" fill="none"/></g>
      <g v-else-if="surface === 'bands'" stroke-width="6"><path d="M14 38q45 22 92-3M10 54q52 18 103-5M12 73q48 18 98-9M22 91q44 11 81-8"/><path d="M14 43q45 22 92-3M10 61q52 18 103-5" stroke="#0b0b20" stroke-opacity=".25" stroke-width="3"/></g>
      <g v-else fill="#120e25" fill-opacity=".2" stroke-width="1"><circle cx="44" cy="43" r="10"/><circle cx="74" cy="57" r="13"/><circle cx="45" cy="80" r="7"/><circle cx="79" cy="29" r="5"/><circle cx="32" cy="62" r="4"/></g>
      <circle cx="60" cy="60" r="39" :fill="`url(#${uid}-shadow)`" stroke="none"/>
    </g>
    <path v-if="rings" d="M10 84c2 6 27 2 53-9s46-26 43-31" :stroke="color" stroke-opacity=".68" stroke-width="3"/>
    <path d="M27 44a39 39 0 0 1 46-21" stroke="#efe7ff" stroke-opacity=".55" stroke-width=".7"/>
  </svg>
</template>

<style scoped>
.galaxy-planet { display: block; width: 100%; height: 100%; overflow: visible; }
</style>
