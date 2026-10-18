<script setup lang="ts">
import { computed, useId } from 'vue';
import type { FleetHull } from '../services/fleetMotion';

/** One cohesive "Aegis Wing" fleet language. `arch` is the hull class, `color` the livery accent. */
const props = withDefaults(defineProps<{ arch: FleetHull; color?: string }>(), { color: '#b794f6' });
const hullId = 'hull-' + useId().replace(/[^a-z0-9-]/gi, '');
const hullUrl = computed(() => `url(#${hullId})`);
</script>

<template>
  <svg width="46" height="52" viewBox="0 0 64 72" fill="none" aria-hidden="true" :data-hull="arch">
    <defs>
      <linearGradient :id="hullId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9e90d8" /><stop offset=".5" stop-color="#4a3a86" /><stop offset="1" stop-color="#241546" />
      </linearGradient>
    </defs>

    <!-- Cadet (scout) -->
    <g v-if="arch === 'cadet'">
      <path class="flame" d="M29 52 Q32 64 35 52 Q32 57 29 52Z" :fill="color" opacity=".8" />
      <path d="M32 40 L22 50 L26 52 L32 47 Z" fill="#241546" :stroke="color" stroke-width="1" />
      <path d="M32 40 L42 50 L38 52 L32 47 Z" fill="#241546" :stroke="color" stroke-width="1" />
      <path d="M32 14 C36 20 37 34 34 48 L32 52 L30 48 C27 34 28 20 32 14Z" :fill="hullUrl" stroke="rgba(224,216,240,.55)" stroke-width=".8" />
      <path d="M32 22 L34 32 L30 32Z" fill="#d8ccff" />
      <circle cx="32" cy="40" r="1.4" :fill="color" />
    </g>

    <!-- Guardian (fighter) -->
    <g v-else-if="arch === 'guardian'">
      <path class="flame" d="M27 54 Q32 68 37 54 Q32 60 27 54Z" :fill="color" opacity=".85" />
      <path d="M32 34 L8 52 L16 56 L32 46 Z" fill="#241546" :stroke="color" stroke-width="1.2" stroke-linejoin="round" />
      <path d="M32 34 L56 52 L48 56 L32 46 Z" fill="#241546" :stroke="color" stroke-width="1.2" stroke-linejoin="round" />
      <path d="M32 6 C39 14 41 30 38 50 L32 56 L26 50 C23 30 25 14 32 6Z" :fill="hullUrl" stroke="rgba(224,216,240,.55)" stroke-width="1" />
      <path d="M32 15 L35 29 L29 29Z" fill="#d8ccff" />
      <path d="M28 40 L32 36 L36 40 L34 44 L32 42 L30 44 Z" :fill="color" opacity=".9" />
      <rect x="29" y="50" width="6" height="5" rx="1" fill="#28334d" :stroke="color" stroke-width=".8" />
    </g>

    <!-- Lead (cruiser) -->
    <g v-else-if="arch === 'lead'">
      <path class="flame" d="M23 56 Q26 68 29 56Z M35 56 Q38 68 41 56Z" :fill="color" opacity=".85" />
      <path d="M32 30 L6 50 L15 56 L32 44 Z" fill="#241546" :stroke="color" stroke-width="1.2" stroke-linejoin="round" />
      <path d="M32 30 L58 50 L49 56 L32 44 Z" fill="#241546" :stroke="color" stroke-width="1.2" stroke-linejoin="round" />
      <circle cx="12" cy="51" r="2.1" :fill="color" /><circle cx="52" cy="51" r="2.1" :fill="color" />
      <path d="M32 4 C40 13 43 30 40 52 L32 58 L24 52 C21 30 24 13 32 4Z" :fill="hullUrl" stroke="rgba(224,216,240,.55)" stroke-width="1" />
      <path d="M32 14 L36 30 L28 30Z" fill="#d8ccff" />
      <path d="M27 37 L32 33 L37 37 M26 44 L32 40 L38 44" fill="none" :stroke="color" stroke-width="2.1" stroke-linecap="round" />
      <rect x="24" y="51" width="6" height="5" rx="1" fill="#28334d" :stroke="color" stroke-width=".8" />
      <rect x="34" y="51" width="6" height="5" rx="1" fill="#28334d" :stroke="color" stroke-width=".8" />
    </g>

    <!-- Automation (engineer/constructor class) -->
    <g v-else-if="arch === 'automation'">
      <path class="spin" d="M32 8 L53 20 L53 44 L32 56 L11 44 L11 20 Z" fill="none" :stroke="color" stroke-width=".7" opacity=".35" />
      <path class="flame" d="M29 54 Q32 64 35 54Z" :fill="color" opacity=".85" />
      <path d="M18 32 H12 M46 32 H52" fill="none" :stroke="color" stroke-width="1.4" />
      <rect x="5" y="25" width="9" height="14" rx="2.5" fill="#241546" :stroke="color" stroke-width="1" />
      <rect x="50" y="25" width="9" height="14" rx="2.5" fill="#241546" :stroke="color" stroke-width="1" />
      <path d="M32 16 V7" fill="none" :stroke="color" stroke-width="1.3" /><circle cx="32" cy="6" r="2.1" fill="#f5b342" />
      <path d="M26 10 a8 8 0 0 1 12 0" fill="none" :stroke="color" stroke-width="1" opacity=".55" />
      <path d="M32 15 L45 23 L45 39 L32 47 L19 39 L19 23 Z" :fill="hullUrl" stroke="rgba(224,216,240,.55)" stroke-width="1" />
      <rect x="28.5" y="22" width="7" height="8" rx="1.2" fill="#d8ccff" />
      <circle cx="26" cy="37" r="1.3" :fill="color" /><circle cx="32" cy="39" r="1.3" :fill="color" /><circle cx="38" cy="37" r="1.3" :fill="color" />
      <rect x="29" y="46" width="6" height="5" rx="1" fill="#28334d" :stroke="color" stroke-width=".8" />
    </g>

    <!-- Commander (flagship) -->
    <g v-else-if="arch === 'commander'" data-special-hull="true">
      <circle cx="32" cy="34" r="30" fill="none" :stroke="color" stroke-width=".7" opacity=".45" class="spin" stroke-dasharray="3 7" />
      <path class="flame" d="M20 58 Q23 70 26 58Z M30 60 Q32 72 34 60Z M38 58 Q41 70 44 58Z" :fill="color" opacity=".9" />
      <path d="M32 26 L3 48 L13 56 L32 42 Z" fill="#241546" :stroke="color" stroke-width="1.3" stroke-linejoin="round" />
      <path d="M32 26 L61 48 L51 56 L32 42 Z" fill="#241546" :stroke="color" stroke-width="1.3" stroke-linejoin="round" />
      <circle cx="9" cy="49" r="2.3" :fill="color" /><circle cx="55" cy="49" r="2.3" :fill="color" />
      <path d="M32 2 C41 12 45 30 42 54 L32 60 L22 54 C19 30 23 12 32 2Z" :fill="hullUrl" stroke="rgba(224,216,240,.55)" stroke-width="1.1" />
      <path d="M32 13 L37 31 L27 31Z" fill="#d8ccff" />
      <path d="M24 40 L32 34 L40 40 M25 46 L32 41 L39 46" fill="none" :stroke="color" stroke-width="2.1" stroke-linecap="round" />
      <path d="M32 19 l2.1 4.3 4.7 .6 -3.4 3.3 .8 4.7 -4.2 -2.2 -4.2 2.2 .8 -4.7 -3.4 -3.3 4.7 -.6Z" fill="#f5b342" />
      <rect x="20" y="52" width="6" height="5" rx="1" fill="#28334d" :stroke="color" stroke-width=".8" />
      <rect x="29" y="54" width="6" height="5" rx="1" fill="#28334d" :stroke="color" stroke-width=".8" />
      <rect x="38" y="52" width="6" height="5" rx="1" fill="#28334d" :stroke="color" stroke-width=".8" />
    </g>

    <!-- Interceptor -->
    <g v-else-if="arch === 'interceptor'">
      <path class="flame" d="M29 54 Q32 66 35 54Z" :fill="color" opacity=".85" />
      <path d="M32 32 L9 50 L17 52 L32 44 Z" fill="#241546" :stroke="color" stroke-width="1.1" stroke-linejoin="round" />
      <path d="M32 32 L55 50 L47 52 L32 44 Z" fill="#241546" :stroke="color" stroke-width="1.1" stroke-linejoin="round" />
      <path d="M31 19 L20 25 L30 27 Z" :fill="color" opacity=".85" />
      <path d="M33 19 L44 25 L34 27 Z" :fill="color" opacity=".85" />
      <path d="M32 3 C35 12 36 42 34 54 L32 58 L30 54 C28 42 29 12 32 3Z" :fill="hullUrl" stroke="rgba(224,216,240,.55)" stroke-width="1" />
      <path d="M32 13 L34 28 L30 28Z" fill="#d8ccff" />
      <rect x="29.5" y="52" width="5" height="4" rx="1" fill="#28334d" :stroke="color" stroke-width=".7" />
    </g>

    <!-- Battlecruiser (heavy) -->
    <g v-else-if="arch === 'battlecruiser'">
      <path class="flame" d="M21 56 Q24 68 27 56Z M30 58 Q32 70 34 58Z M37 56 Q40 68 43 56Z" :fill="color" opacity=".88" />
      <path d="M32 24 L4 42 L9 50 L32 38 Z" fill="#241546" :stroke="color" stroke-width="1.2" stroke-linejoin="round" />
      <path d="M32 24 L60 42 L55 50 L32 38 Z" fill="#241546" :stroke="color" stroke-width="1.2" stroke-linejoin="round" />
      <path d="M30 46 L13 55 L21 57 L30 51 Z" fill="#241546" :stroke="color" stroke-width="1" />
      <path d="M34 46 L51 55 L43 57 L34 51 Z" fill="#241546" :stroke="color" stroke-width="1" />
      <path d="M32 3 C43 12 46 34 43 56 L32 62 L21 56 C18 34 21 12 32 3Z" :fill="hullUrl" stroke="rgba(224,216,240,.55)" stroke-width="1.1" />
      <path d="M32 13 L37 30 L27 30Z" fill="#d8ccff" />
      <path d="M26 38 L32 34 L38 38" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" />
      <path d="M27 44 H37" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" />
      <rect x="21" y="53" width="6" height="5" rx="1" fill="#28334d" :stroke="color" stroke-width=".8" />
      <rect x="29" y="55" width="6" height="5" rx="1" fill="#28334d" :stroke="color" stroke-width=".8" />
      <rect x="37" y="53" width="6" height="5" rx="1" fill="#28334d" :stroke="color" stroke-width=".8" />
    </g>

    <!-- Sentinel (defender) -->
    <g v-else>
      <path class="flame" d="M25 54 Q28 64 31 54Z M33 54 Q36 64 39 54Z" :fill="color" opacity=".85" />
      <path d="M32 36 L10 46 L16 52 L32 46 Z" fill="#241546" :stroke="color" stroke-width="1.1" stroke-linejoin="round" />
      <path d="M32 36 L54 46 L48 52 L32 46 Z" fill="#241546" :stroke="color" stroke-width="1.1" stroke-linejoin="round" />
      <path d="M32 8 C40 16 42 34 39 52 L32 58 L25 52 C22 34 24 16 32 8Z" :fill="hullUrl" stroke="rgba(224,216,240,.55)" stroke-width="1" />
      <path d="M20 23 a12 12 0 0 1 24 0" fill="none" :stroke="color" stroke-width="1.6" opacity=".85" />
      <path d="M24 23 a8 8 0 0 1 16 0" fill="none" :stroke="color" stroke-width="1" opacity=".45" />
      <path d="M32 17 L35 30 L29 30Z" fill="#d8ccff" />
      <path d="M28 40 L32 36 L36 40 L34 44 L32 42 L30 44 Z" :fill="color" opacity=".9" />
      <rect x="26" y="50" width="5" height="4" rx="1" fill="#28334d" :stroke="color" stroke-width=".7" />
      <rect x="33" y="50" width="5" height="4" rx="1" fill="#28334d" :stroke="color" stroke-width=".7" />
    </g>
  </svg>
</template>

<style scoped>
svg { overflow: visible; }
.flame { transform-box: fill-box; transform-origin: center bottom; animation: engine-thrust 1.6s ease-in-out infinite; }
@keyframes engine-thrust { 0%,100% { transform: scaleY(.86); opacity: .8; } 50% { transform: scaleY(1.1); opacity: 1; } }
.spin { transform-box: fill-box; transform-origin: center; animation: hull-spin 26s linear infinite; }
@keyframes hull-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .flame, .spin { animation: none; } }
</style>
