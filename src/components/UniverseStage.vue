<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { gsap, VPH_EASE } from '../motion';
import { crew, type CrewMember } from '../data/crew';
import { vaultPlanets, vaultResources, type VaultPlanet } from '../data/galaxy';
import { useLinks } from '../composables/useLinks';
import { useReducedMotion } from '../composables/useReducedMotion';
import { useLocale } from '../i18n';
import GalaxyPlanet from './GalaxyPlanet.vue';
import GalaxyCore from './GalaxyCore.vue';
import GalaxyVaultInspector from './GalaxyVaultInspector.vue';
import ProtectorFleet from './ProtectorFleet.vue';
import MemberScopePanel from './MemberScopePanel.vue';

const { links, source, isLoading, openSector, paletteOpen } = useLinks();
const { t, text } = useLocale();
const { prefersReducedMotion } = useReducedMotion();
const stageRef = ref<HTMLElement | null>(null);
const selectedPlanet = ref<VaultPlanet | null>(null);
const selectedMember = ref<CrewMember | null>(null);
const paused = ref(false);
const activeCrew = crew.filter(member => member.active !== false);
const resources = computed(() => selectedPlanet.value ? vaultResources(links.value, selectedPlanet.value.id) : []);
let returnTarget: HTMLElement | null = null;
let focusTween: ReturnType<typeof gsap.fromTo> | undefined;
let focusedSphere: HTMLElement | null = null;

function resetFocusTween() {
  focusTween?.kill();
  focusTween = undefined;
  focusedSphere?.style.removeProperty('transform');
  focusedSphere = null;
}

function rememberTrigger() {
  const active = document.activeElement;
  returnTarget = active instanceof HTMLElement && stageRef.value?.contains(active) ? active : null;
}
async function inspectPlanet(planet: VaultPlanet) {
  rememberTrigger();
  resetFocusTween();
  selectedMember.value = null;
  selectedPlanet.value = planet;
  if (prefersReducedMotion.value) return;
  await nextTick();
  const sphere = stageRef.value?.querySelector<HTMLElement>(`[data-planet="${planet.id}"] .galaxy__planet-body`);
  if (sphere) {
    focusedSphere = sphere;
    focusTween = gsap.fromTo(sphere, { scale: .94 }, { scale: 1.08, duration: .5, ease: VPH_EASE, clearProps: 'transform' });
  }
}
function inspectMember(member: CrewMember) {
  rememberTrigger();
  resetFocusTween();
  selectedPlanet.value = null;
  selectedMember.value = member;
}
function closeInspector() {
  resetFocusTween();
  selectedPlanet.value = null;
  selectedMember.value = null;
  returnTarget?.focus({ preventScroll: true });
}
function chooseVault(event: Event) {
  const id = (event.target as HTMLSelectElement).value;
  if (id.startsWith('crew:')) {
    const member = activeCrew.find(candidate => candidate.id === id.slice(5));
    if (member) inspectMember(member);
    return;
  }
  const planet = vaultPlanets.find(candidate => candidate.id === id);
  if (planet) void inspectPlanet(planet);
}
function onKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || paletteOpen.value) return;
  if (event.key === 'Escape' && (selectedPlanet.value || selectedMember.value)) {
    event.preventDefault(); event.stopPropagation(); closeInspector(); return;
  }
  const target = event.target as HTMLElement | null;
  if (!target?.matches('.galaxy__planet')) return;
  const buttons = Array.from(stageRef.value?.querySelectorAll<HTMLButtonElement>('.galaxy__planet') ?? []);
  const index = buttons.indexOf(target as HTMLButtonElement);
  const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
  if (direction) {
    event.preventDefault();
    buttons[(index + direction + buttons.length) % buttons.length]?.focus({ preventScroll: true });
  }
}
onBeforeUnmount(resetFocusTween);
</script>

<template>
  <section ref="stageRef" class="galaxy" :aria-label="text('Intrepid Value Protection system map', 'Bản đồ hệ Value Protection của Intrepid')" @keydown="onKeydown">
    <div class="galaxy__toolbar">
      <span class="galaxy__map-label">{{ text('RESOURCE SYSTEM', 'HỆ TÀI NGUYÊN') }}</span>
      <button type="button" class="galaxy__motion" :aria-pressed="paused" :disabled="prefersReducedMotion" @click="paused = !paused"><svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path v-if="paused || prefersReducedMotion" d="m5 3 7 5-7 5Z" fill="currentColor"/><path v-else d="M5 3v10M11 3v10" stroke="currentColor" stroke-width="2"/></svg>{{ prefersReducedMotion ? text('Reduced motion', 'Giảm chuyển động') : paused ? text('Resume fleet', 'Cho tàu di chuyển') : text('Pause fleet', 'Dừng chuyển động') }}</button>
    </div>
    <label class="galaxy__mobile-select"><span>{{ text('Explore vaults & protectors', 'Khám phá vault & protector') }}</span><select :value="selectedPlanet?.id ?? (selectedMember ? 'crew:' + selectedMember.id : '')" @change="chooseVault"><option value="" disabled>{{ text('Select a planet or protector', 'Chọn hành tinh hoặc protector') }}</option><optgroup :label="text('Resource vaults', 'Hành tinh tài nguyên')"><option v-for="planet in vaultPlanets" :key="planet.id" :value="planet.id">{{ t('shell.categories.' + planet.id) }}</option></optgroup><optgroup :label="text('Value Protectors', 'Đội ngũ Value Protector')"><option v-for="member in activeCrew" :key="member.id" :value="'crew:' + member.id">{{ member.name }} · {{ member.country || member.market }}</option></optgroup></select></label>
    <div class="galaxy__space">
      <div class="galaxy__nebula" aria-hidden="true"></div>
      <svg class="galaxy__orbits" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true">
        <g transform="rotate(-15 540 300)"><ellipse cx="540" cy="300" rx="195" ry="124"/><ellipse cx="540" cy="300" rx="331" ry="198"/><ellipse cx="540" cy="300" rx="487" ry="255"/><ellipse cx="540" cy="300" rx="540" ry="292" stroke-dasharray="2 9"/></g>
        <path d="M75 505 1105 70M90 76 1110 516" stroke-dasharray="2 12" opacity=".28"/>
      </svg>
      <div class="galaxy__core" aria-label="Intrepid · Value Protection Core">
        <span class="galaxy__core-halo" aria-hidden="true"></span>
        <GalaxyCore />
        <div class="galaxy__core-identity"><img src="/brand/intrepid-mark.png" alt="" /><strong>INTREPID</strong><span>VALUE PROTECTION CORE</span></div>
      </div>
      <button v-for="planet in vaultPlanets" :key="planet.id" type="button" class="galaxy__planet" :class="{ 'is-selected': selectedPlanet?.id === planet.id }" :style="{ left: planet.x + '%', top: planet.y + '%', '--planet-size': planet.size + 'px', '--planet-accent': planet.color }" :data-planet="planet.id" :aria-label="text('Inspect vault: ', 'Xem vault: ') + t('shell.categories.' + planet.id)" :aria-expanded="selectedPlanet?.id === planet.id" @click="inspectPlanet(planet)">
        <span class="galaxy__planet-body"><GalaxyPlanet :id="planet.id" :color="planet.color" :surface="planet.surface" :rings="planet.rings" /></span>
        <span class="galaxy__planet-label">{{ t('shell.categories.' + planet.id) }}</span>
        <span class="galaxy__planet-state" aria-hidden="true">{{ selectedPlanet?.id === planet.id ? text('EXPLORING', 'ĐANG KHÁM PHÁ') : 'VAULT' }}</span>
      </button>
      <ProtectorFleet :members="activeCrew" :selected-id="selectedMember?.id" :paused="paused" variant="home" @select="inspectMember" />
    </div>
    <div class="galaxy__legend" aria-hidden="true"><span><i class="galaxy__legend-planet"></i>{{ text('Planets · resource vaults', 'Hành tinh · kho tài nguyên') }}</span><span><svg class="galaxy__legend-ship" width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="m10 2 2 7 5 5-6-2-1 6-1-6-6 2 5-5Z" stroke="currentColor" stroke-width=".9"/></svg>{{ text('Ships · Value Protectors', 'Chiến hạm · Value Protectors') }}</span></div>
    <GalaxyVaultInspector v-if="selectedPlanet" :key="selectedPlanet.id" :planet="selectedPlanet" :resources="resources" :source="source" :loading="isLoading" @close="closeInspector" @open="openSector(selectedPlanet.id)" />
    <MemberScopePanel v-else-if="selectedMember" :member="selectedMember" @close="closeInspector" />
  </section>
</template>

<style lang="scss" scoped>
.galaxy { isolation:isolate; position:relative; width:100%; flex:1; min-height:450px; overflow:hidden; background:radial-gradient(ellipse at 45% 49%,rgba(73,41,114,.16),transparent 66%); }
.galaxy__toolbar { position:absolute; top:12px; left:20px; right:16px; z-index:22; display:flex; align-items:center; justify-content:space-between; gap:16px; pointer-events:none; }
.galaxy__map-label { font-size:8px; letter-spacing:.22em; color:var(--color-text-200); opacity:.8; }
.galaxy__motion { pointer-events:auto; display:inline-flex; align-items:center; gap:7px; min-height:34px; padding:5px 9px; border:1px solid rgba(189,162,231,.2); border-radius:5px; background:rgba(14,10,31,.74); font-size:10px; color:var(--color-text-300); cursor:pointer; }
.galaxy__motion>span { font-size:13px; }.galaxy__motion:disabled { cursor:default; opacity:.75; }
.galaxy__space { position:absolute; inset:0; }
.galaxy__space :deep(.protector-fleet) { z-index:6; }
.galaxy__nebula { position:absolute; width:91%; height:78%; left:1%; top:5%; transform:rotate(-22deg); pointer-events:none; background:radial-gradient(ellipse at 40% 50%,rgba(132,71,166,.18),transparent 58%),radial-gradient(ellipse at 80% 50%,rgba(72,117,143,.12),transparent 54%); }
.galaxy__orbits { position:absolute; inset:3% 5%; width:90%; height:94%; pointer-events:none; overflow:visible; fill:none; stroke:rgba(173,146,219,.21); stroke-width:.8; }
.galaxy__orbits ellipse:nth-child(2) { stroke:rgba(206,191,237,.16); }.galaxy__orbits ellipse:nth-child(3) { stroke:rgba(171,154,216,.12); }
.galaxy__core { position:absolute; left:46%; top:51%; width:clamp(132px,14vw,190px); aspect-ratio:1; transform:translate(-50%,-50%); pointer-events:none; z-index:3; }
.galaxy__core-halo { position:absolute; inset:-24%; border-radius:50%; background:radial-gradient(circle,rgba(173,123,241,.12),transparent 65%); box-shadow:inset 0 0 0 1px rgba(199,177,239,.04); }
.galaxy__core-identity { position:absolute; inset:28% 0 auto; display:flex; flex-direction:column; align-items:center; text-shadow:0 1px 10px #080614; }
.galaxy__core-identity img { width:25%; aspect-ratio:1; object-fit:contain; opacity:.93; margin-bottom:5px; }
.galaxy__core-identity strong { font-size:clamp(12px,1.3vw,18px); letter-spacing:.16em; color:#faf5ff; }
.galaxy__core-identity>span { font-size:6px; letter-spacing:.13em; margin-top:4px; color:#e0d4f2; }
.galaxy__planet { position:absolute; z-index:8; display:flex; flex-direction:column; align-items:center; width:148px; padding:0; border:0; border-radius:10px; background:transparent; color:var(--color-text-400); cursor:pointer; transform:translate(-50%,-50%); }
.galaxy__planet-body { width:var(--planet-size); height:var(--planet-size); display:block; transform-origin:center; transition:transform .45s cubic-bezier(.2,.7,.2,1),filter .45s cubic-bezier(.2,.7,.2,1); filter:drop-shadow(0 0 8px rgba(189,162,231,.12)); }
.galaxy__planet-label { display:block; padding:0 4px; max-width:148px; font-size:12px; line-height:1.35; font-weight:500; text-align:center; text-wrap:balance; text-shadow:0 2px 8px #070512,0 0 16px #070512; transition:color .3s; }
.galaxy__planet-state { display:block; margin-top:4px; font-size:7px; line-height:1.2; letter-spacing:.2em; color:#9286aa; }
.galaxy__planet:hover .galaxy__planet-body,.galaxy__planet:focus-visible .galaxy__planet-body,.galaxy__planet.is-selected .galaxy__planet-body { transform:scale(1.08); filter:drop-shadow(0 0 14px rgba(198,163,255,.48)); }
.galaxy__planet:hover .galaxy__planet-label,.galaxy__planet.is-selected .galaxy__planet-label { color:#e8d194; }
.galaxy__planet.is-selected .galaxy__planet-state { color:#d7bc76; }.galaxy__planet:focus-visible { outline:1px solid #e3c779; outline-offset:6px; }
.galaxy__legend { position:absolute; bottom:13px; left:20px; right:20px; display:flex; flex-wrap:wrap; gap:16px; pointer-events:none; z-index:21; }
.galaxy__legend>span { display:flex; align-items:center; gap:6px; color:var(--color-text-200); font-size:10px; }.galaxy__legend i { display:inline-block; font-style:normal; color:#bca1e5; }.galaxy__legend-planet { width:7px; height:7px; border:1px solid #c8b3e7; border-radius:50%; }.galaxy__legend-ship { font-size:19px; line-height:10px; }
.galaxy__mobile-select { display:none; }
@media(max-width:1024px) { .galaxy__planet { width:122px; }.galaxy__planet-label { font-size:11px; max-width:122px; }.galaxy__planet-body { width:calc(var(--planet-size) * .9); height:calc(var(--planet-size) * .9); } }
@media(max-width:700px) { .galaxy { min-height:430px; }.galaxy__toolbar { top:12px; left:12px; right:12px; }.galaxy__map-label { font-size:8px; }.galaxy__motion { min-height:40px; }.galaxy__planet { width:100px; }.galaxy__planet-label { max-width:100px; font-size:10px; }.galaxy__planet-body { width:calc(var(--planet-size) * .78); height:calc(var(--planet-size) * .78); }.galaxy__legend { left:12px; gap:8px 14px; }.galaxy__legend>span { font-size:9px; } }
@media(max-width:540px) { .galaxy { min-height:420px; }.galaxy__planet { display:none; }.galaxy__core { left:50%; top:52%; width:185px; }.galaxy__core-identity strong { font-size:16px; }.galaxy__mobile-select { position:absolute; top:60px; left:14px; right:14px; display:flex; flex-direction:column; gap:5px; z-index:23; }.galaxy__mobile-select>span { font-size:10px; color:var(--color-text-200); }.galaxy__mobile-select select { width:100%; min-height:44px; padding:8px 10px; border:1px solid rgba(194,168,237,.3); border-radius:6px; background:#171027; color:var(--color-text-400); font-size:14px; }.galaxy__space { top:90px; bottom:30px; }.galaxy__legend { bottom:10px; justify-content:center; }.galaxy__core-identity>span { font-size:6px; } }
@media(prefers-reduced-motion:reduce) { .galaxy__planet-body,.galaxy__planet-label { transition:none; } }
</style>
