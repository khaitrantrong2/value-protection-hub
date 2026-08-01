<script setup lang="ts">
import type { ShipArch } from "../data/sectors";
defineProps<{ arch: ShipArch }>();
</script>

<template>
  <svg v-if="arch === 'scout'" width="44" height="50" viewBox="0 0 48 56" fill="none" style="overflow: visible">
    <path d="M24 50 L20 60 L24 57 L28 60 Z" fill="currentColor" opacity="0.5" class="flame" />
    <path d="M16 30 L4 44 L16 38 Z" fill="currentColor" opacity="0.85" />
    <path d="M32 30 L44 44 L32 38 Z" fill="currentColor" opacity="0.85" />
    <path d="M24 4 L31 40 L24 46 L17 40 Z" fill="#0e1f4d" stroke="currentColor" stroke-width="1.6" />
    <circle cx="24" cy="22" r="4.4" fill="#bfeaff" />
    <ellipse cx="24" cy="46" rx="4" ry="2.4" fill="currentColor" />
  </svg>

  <svg v-else-if="arch === 'interceptor'" width="44" height="50" viewBox="0 0 48 56" fill="none" style="overflow: visible">
    <path d="M24 48 L21 59 L24 56 L27 59 Z" fill="currentColor" opacity="0.5" class="flame" />
    <path d="M18 26 L2 20 L14 34 L18 40 Z" fill="currentColor" opacity="0.9" />
    <path d="M30 26 L46 20 L34 34 L30 40 Z" fill="currentColor" opacity="0.9" />
    <path d="M24 3 L29 30 L27 46 L21 46 L19 30 Z" fill="#0e1f4d" stroke="currentColor" stroke-width="1.6" />
    <path d="M24 12 L26 26 L22 26 Z" fill="#bfeaff" />
    <rect x="21" y="44" width="6" height="4" rx="1.5" fill="currentColor" />
  </svg>

  <svg v-else-if="arch === 'cruiser'" width="46" height="50" viewBox="0 0 48 56" fill="none" style="overflow: visible">
    <path d="M15 48 L13 58 L15 55 L17 58 Z" fill="currentColor" opacity="0.5" class="flame" />
    <path d="M33 48 L31 58 L33 55 L35 58 Z" fill="currentColor" opacity="0.5" class="flame" />
    <path d="M14 24 L2 34 L14 34 Z" fill="currentColor" opacity="0.85" />
    <path d="M34 24 L46 34 L34 34 Z" fill="currentColor" opacity="0.85" />
    <path d="M24 4 C32 10 34 26 32 44 L16 44 C14 26 16 10 24 4 Z" fill="#0e1f4d" stroke="currentColor" stroke-width="1.6" />
    <rect x="18" y="46" width="6" height="4" rx="1.5" fill="currentColor" />
    <rect x="24" y="46" width="6" height="4" rx="1.5" fill="currentColor" />
    <ellipse cx="24" cy="20" rx="5" ry="6" fill="#bfeaff" />
    <circle cx="24" cy="34" r="2.4" fill="currentColor" />
  </svg>

  <svg v-else width="46" height="50" viewBox="0 0 48 56" fill="none" style="overflow: visible">
    <path d="M24 50 L20 60 L24 57 L28 60 Z" fill="currentColor" opacity="0.5" class="flame" />
    <path d="M13 32 L3 40 L13 40 Z" fill="currentColor" opacity="0.85" />
    <path d="M35 32 L45 40 L35 40 Z" fill="currentColor" opacity="0.85" />
    <path d="M18 8 L30 8 L34 46 L14 46 Z" fill="#0e1f4d" stroke="currentColor" stroke-width="1.6" />
    <path d="M20 6 L28 6 L30 14 L18 14 Z" fill="#bfeaff" />
    <rect x="18" y="22" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.8" />
    <rect x="18" y="28" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.6" />
    <rect x="17" y="46" width="6" height="4" rx="1.5" fill="currentColor" />
    <rect x="25" y="46" width="6" height="4" rx="1.5" fill="currentColor" />
  </svg>
</template>

<style scoped>
.flame {
  transform-origin: center bottom;
  animation: flame 0.5s ease-in-out infinite;
}
@keyframes flame {
  0%,
  100% {
    transform: scaleY(0.7);
    opacity: 0.55;
  }
  50% {
    transform: scaleY(1.3);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .flame {
    animation: none;
  }
}
</style>
