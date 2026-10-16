<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { crew } from '../data/crew';
import { useLinks } from '../composables/useLinks';
import { useLocale } from '../i18n';
import ProtectorFleet from './ProtectorFleet.vue';

const { openMember } = useLinks();
const { t, text } = useLocale();
const roster = crew.filter(member => member.active !== false);
const paused = ref(false), reduced = ref(false);
const motionLabel = computed(() => reduced.value ? text('Reduced motion', 'Giảm chuyển động') : paused.value ? text('Resume motion', 'Tiếp tục chuyển động') : text('Pause motion', 'Dừng chuyển động'));
let preference: MediaQueryList | undefined;
function readPreference() { reduced.value = preference?.matches || false; }
onMounted(() => { preference = window.matchMedia('(prefers-reduced-motion: reduce)'); preference.addEventListener('change', readPreference); readPreference(); });
onBeforeUnmount(() => preference?.removeEventListener('change', readPreference));
</script>

<template>
  <section class="crewpage" :aria-label="t('crew.title')">
    <header class="crewpage__header"><p class="crewpage__eyebrow mono">INTREPID UNIVERSE</p><h1>Value Protection Crew</h1><p>{{ text('Every ship has a role. Together, protecting value for Intrepid.', 'Mỗi chiến hạm một vai trò. Cùng bảo vệ giá trị cho Intrepid.') }}</p></header>
    <div class="crewpage__space"><ProtectorFleet :members="roster" :paused="paused" @select="openMember" /></div>
    <button type="button" class="fleet-motion" :aria-label="motionLabel" :title="motionLabel" :aria-pressed="paused || reduced" :disabled="reduced" @click="paused = !paused"><span aria-hidden="true">{{ paused || reduced ? '▷' : 'Ⅱ' }}</span></button>
  </section>
</template>

<style scoped>
.crewpage { position:relative; z-index:1; height:100%; min-height:0; display:flex; flex-direction:column; overflow:hidden; padding:28px clamp(12px,3vw,40px) 16px; }
.crewpage__header { flex:none; text-align:center; padding-bottom:20px; }
.crewpage__eyebrow { color:var(--color-cyan-400); font-size:10px; letter-spacing:.24em; line-height:1.5; }
h1 { margin:10px 0; color:var(--color-text-400); font-size:clamp(28px,4vw,48px); font-weight:600; letter-spacing:-.035em; line-height:1.15; text-wrap:balance; }
.crewpage__header>p:last-child { color:var(--color-text-300); font-size:14px; line-height:1.6; }
.crewpage__space { position:relative; flex:1; min-height:0; isolation:isolate; }
.fleet-motion { position:absolute; z-index:6; right:16px; bottom:12px; display:grid; place-items:center; width:44px; height:44px; border:1px solid var(--color-card-border); border-radius:50%; background:color-mix(in srgb,var(--space-deep) 80%,transparent); color:var(--color-text-300); font:inherit; font-size:16px; cursor:pointer; opacity:.65; transition:opacity .2s; }
.fleet-motion:hover,.fleet-motion:focus-visible { opacity:1; border-color:var(--color-cyan-400); }
.fleet-motion:focus-visible { outline:2px solid var(--color-orange-400); outline-offset:3px; }
.fleet-motion:disabled { cursor:default; }
@media(max-width:760px) { .crewpage { padding-top:20px; } .crewpage__header { padding-bottom:12px; } h1 { font-size:32px; margin:8px 0; } .crewpage__header>p:last-child { font-size:12px; } }
@media(max-width:420px) { .crewpage { padding-top:16px; } .crewpage__header>p:last-child { max-width:280px; margin:auto; } h1 { font-size:28px; } }
@media(max-height:650px) and (min-width:761px) { .crewpage { padding-top:12px; } h1 { font-size:34px; margin:6px 0; } .crewpage__header>p:last-child { font-size:12px; } }
@media(prefers-reduced-motion:reduce) { .fleet-motion { transition:none; } }
</style>
