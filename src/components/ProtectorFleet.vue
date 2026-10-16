<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { gsap } from 'gsap';
import { crew, type CrewMember } from '../data/crew';
import type { ShipArch } from '../data/sectors';
import { advancePatrol, fleetMetrics, fleetPoint, fleetSeed, type FleetPoint, type FleetVariant } from '../services/fleetMotion';
import { useLocale } from '../i18n';
import StarfighterIcon from './StarfighterIcon.vue';

const props = withDefaults(defineProps<{ members: CrewMember[]; selectedId?: string; paused?: boolean; variant?: FleetVariant }>(), { variant: 'crew', paused: false });
const emit = defineEmits<{ select: [member: CrewMember, anchor: FleetPoint] }>();
const { t, text } = useLocale();
const host = ref<HTMLElement | null>(null);
const hovered = ref(''), focused = ref(''), reduced = ref(false), hidden = ref(false);
const active = crew.filter(member => member.active !== false);
const slots = new Map(active.map((member, index) => [member.id, index]));
const phases = new Map(active.map(member => [member.id, 0]));
const buttons = new Map<string, HTMLElement>();
const points = new Map<string, FleetPoint>();
const compactHome = ref(false);
const tipMember = computed(() => compactHome.value ? undefined : props.members.find(member => member.id !== props.selectedId && member.id === (hovered.value || focused.value)));
const tipPosition = ref({ left: '50%', top: '50%' });
const layout = ref(fleetMetrics(active.length, 1200, 500, props.variant));
const arches: ShipArch[] = ['scout', 'interceptor', 'cruiser', 'shuttle'];
let width = 1, height = 1, resize: ResizeObserver | undefined, preference: MediaQueryList | undefined, ticking = false;
const held = (id: string) => hovered.value === id || focused.value === id || props.selectedId === id;
const arch = (member: CrewMember) => arches[fleetSeed(member.id) % arches.length];
function setButton(id: string, element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLElement) buttons.set(id, element); else buttons.delete(id);
}
function place(deltaSeconds = 0) {
  for (const member of active) {
    const phase = advancePatrol(phases.get(member.id) || 0, deltaSeconds, props.paused || reduced.value || hidden.value || held(member.id));
    phases.set(member.id, phase);
    const point = fleetPoint(slots.get(member.id)!, active.length, width, height, phase, props.variant);
    points.set(member.id, point);
    const element = buttons.get(member.id);
    if (element) element.style.transform = layout.value.picker ? '' : `translate(${point.x}px,${point.y}px) translate(-50%,-50%)`;
  }
  const point = points.get(hovered.value || focused.value);
  if (point) {
    const left = `${Math.max(116, Math.min(width - 116, point.x))}px`, top = `${Math.max(88, point.y - 42)}px`;
    if (tipPosition.value.left !== left || tipPosition.value.top !== top) tipPosition.value = { left, top };
  }
}
function tick(_time: number, deltaMs: number) { place(Math.min(deltaMs, 100) / 1000); }
function syncMotion() {
  const shouldTick = !props.paused && !reduced.value && !hidden.value && !layout.value.picker;
  if (shouldTick && !ticking) { gsap.ticker.add(tick); ticking = true; }
  else if (!shouldTick && ticking) { gsap.ticker.remove(tick); ticking = false; }
}
function readVisibility() { hidden.value = document.hidden; syncMotion(); }
function readPreference() { reduced.value = preference?.matches || false; syncMotion(); }
function select(member: CrewMember) {
  if (compactHome.value) return;
  if (layout.value.picker) { emit('select', member, { x: 50, y: 50 }); return; }
  const point = points.get(member.id) || { x: width / 2, y: height / 2 };
  emit('select', member, { x: point.x / width * 100, y: point.y / height * 100 });
}
watch(() => props.paused, syncMotion);
watch(() => props.members, () => place(), { flush: 'post' });
onMounted(() => {
  preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  preference.addEventListener('change', readPreference); readPreference();
  document.addEventListener('visibilitychange', readVisibility); readVisibility();
  resize = new ResizeObserver(entries => {
    width = entries[0].contentRect.width; height = entries[0].contentRect.height;
    compactHome.value = props.variant === 'home' && width <= 500;
    if (compactHome.value) { hovered.value = ''; focused.value = ''; }
    layout.value = fleetMetrics(active.length, width, height, props.variant); place(); syncMotion();
  });
  if (host.value) resize.observe(host.value);
});
onBeforeUnmount(() => { gsap.ticker.remove(tick); resize?.disconnect(); preference?.removeEventListener('change', readPreference); document.removeEventListener('visibilitychange', readVisibility); });
</script>

<template>
  <div ref="host" class="protector-fleet" data-protector-fleet :class="[`protector-fleet--${variant}`, { 'protector-fleet--still': paused || reduced || hidden || layout.picker, 'protector-fleet--picker': layout.picker, 'protector-fleet--ambient': compactHome }]" role="group" :aria-label="text('Value Protector fleet', 'Hạm đội Value Protector')">
    <button v-for="member in members" :key="member.id" :ref="element => setButton(member.id, element)" type="button" class="fleet-ship" :class="{ 'fleet-ship--held': held(member.id), 'fleet-ship--selected': selectedId === member.id }" :style="layout.picker ? undefined : { width: layout.buttonWidth + 'px', height: layout.buttonHeight + 'px' }" :data-protector-id="member.id" :disabled="compactHome" :aria-hidden="compactHome ? 'true' : undefined" :tabindex="compactHome ? -1 : 0" :aria-label="`${member.name} · ${t('crew.profiles.' + member.profileKey + '.role')} · ${member.country || member.market}`" :aria-pressed="selectedId === member.id" :aria-describedby="!layout.picker && tipMember?.id === member.id ? 'fleet-hover-tip-' + variant : undefined" @pointerenter="hovered = member.id; place()" @pointerleave="hovered = ''" @focus="focused = member.id; place()" @blur="focused = ''" @click="select(member)">
      <span class="fleet-ship__hull" aria-hidden="true" :style="{ '--ship-tilt': `${fleetSeed(member.id) % 42 - 21}deg` }"><StarfighterIcon :arch="arch(member)" /></span>
      <span class="fleet-ship__name">{{ member.name }}</span>
    </button>
    <div v-if="tipMember && tipMember.id !== selectedId && !layout.picker" :id="'fleet-hover-tip-' + variant" class="fleet-tooltip" role="tooltip" :style="tipPosition"><strong>{{ tipMember.name }}</strong><span>{{ t('crew.profiles.' + tipMember.profileKey + '.role') }} · {{ tipMember.country || tipMember.market }}</span></div>
  </div>
</template>

<style scoped>
.protector-fleet { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
.fleet-ship { position:absolute; top:0; left:0; width:88px; height:78px; padding:4px; border:1px solid transparent; border-radius:50%; background:transparent; color:var(--color-cyan-400); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; pointer-events:auto; touch-action:manipulation; font:inherit; }
.fleet-ship__hull { width:44px; height:50px; display:grid; place-items:center; transform:rotate(var(--ship-tilt)); filter:drop-shadow(0 0 7px color-mix(in srgb,var(--color-cyan-400) 25%,transparent)); }
.fleet-ship__name { flex:none; width:max-content; max-width:120px; margin-top:2px; padding:2px 5px; border-radius:4px; color:var(--color-text-400); background:color-mix(in srgb,var(--space-deep) 85%,transparent); font-size:12px; line-height:1.4; white-space:normal; text-align:center; }
.fleet-ship:hover,.fleet-ship:focus-visible,.fleet-ship--selected { border-color:var(--color-cyan-400); background:color-mix(in srgb,var(--color-cyan-400) 8%,transparent); z-index:4; }
.fleet-ship:focus-visible { outline:2px solid var(--color-orange-400); outline-offset:3px; }
.fleet-ship--selected { color:var(--color-orange-400); border-color:var(--color-orange-400); }
.fleet-ship--held :deep(.flame),.protector-fleet--still :deep(.flame) { animation-play-state:paused; }
.fleet-tooltip { position:absolute; z-index:5; transform:translate(-50%,-100%); width:224px; padding:10px 12px; border:1px solid var(--color-card-border-hover); background:var(--space-deep); border-radius:8px; box-shadow:0 12px 30px #0005; text-align:center; pointer-events:none; }
.fleet-tooltip strong { display:block; color:var(--color-text-400); font-size:13px; font-weight:500; }
.fleet-tooltip span { display:block; margin-top:4px; color:var(--color-text-300); font-size:11px; line-height:1.5; }
.protector-fleet--home .fleet-ship { width:52px; height:52px; }
.protector-fleet--home .fleet-ship__hull { transform:rotate(var(--ship-tilt)) scale(.7); }
.protector-fleet--home .fleet-ship__name { position:absolute; top:100%; visibility:hidden; max-width:100px; }
.protector-fleet--home .fleet-ship--held .fleet-ship__name { visibility:visible; }
.protector-fleet--ambient .fleet-ship { pointer-events:none; cursor:default; }
.protector-fleet--picker { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); align-content:start; gap:6px; padding:4px; overflow:auto; overscroll-behavior:contain; pointer-events:auto; }
.protector-fleet--picker .fleet-ship { position:relative; inset:auto; width:100%; height:auto; min-height:44px; padding:6px; flex-direction:row; gap:8px; border-radius:8px; border-color:var(--color-card-border); background:var(--space-deep); }
.protector-fleet--picker .fleet-ship__name { position:static; visibility:visible; max-width:none; width:auto; background:transparent; }
@media(max-width:600px) { .fleet-ship { width:64px; height:44px; padding:2px; } .fleet-ship__hull { flex:none; width:22px; height:18px; transform:rotate(var(--ship-tilt)); } .fleet-ship__hull :deep(svg) { width:22px; height:22px; } .fleet-ship__name { max-width:72px; margin-top:0; padding:0 1px; font-size:10px; line-height:1.1; } .protector-fleet--home .fleet-ship { width:44px; height:44px; } .protector-fleet--home .fleet-ship__hull { transform:rotate(var(--ship-tilt)); } }
</style>
