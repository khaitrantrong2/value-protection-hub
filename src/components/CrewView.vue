<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { crew, type CrewMember } from '../data/crew';
import { CREW_FUNCTIONS, CREW_MARKETS, matchesCrew } from '../data/crewDirectory';
import { useLinks } from '../composables/useLinks';
import { useCrewDirectory } from '../composables/useCrewDirectory';
import { useLocale } from '../i18n';
import { messages } from '../i18n/messages/crew';
import type { FleetPoint } from '../services/fleetMotion';
import ProtectorFleet from './ProtectorFleet.vue';
import MemberScopePanel from './MemberScopePanel.vue';
import Icon from './Icon.vue';

const { memberScope } = useLinks();
const { t, text } = useLocale();
const filters = useCrewDirectory();
const roster = crew.filter(member => member.active !== false);
const scopes = computed(() => new Map(roster.map(member => [member.id, memberScope(member)])));
function searchCopy(member: CrewMember) {
  const key = member.profileKey as keyof typeof messages.en.crew.profiles;
  return [messages.en.crew.profiles[key], messages.vi.crew.profiles[key]].flatMap(profile => Object.values(profile || {})).join(' ');
}
const visible = computed(() => roster.filter(member => matchesCrew(member, filters.query, filters.market, filters.function, scopes.value.get(member.id) || [], searchCopy(member))));
const selected = ref<CrewMember | null>(null), anchor = ref<FleetPoint>();
const paused = ref(false), reduced = ref(false);
const motionLabel = computed(() => reduced.value ? text('Reduced motion', 'Giảm chuyển động') : paused.value ? text('Resume motion', 'Tiếp tục chuyển động') : text('Pause motion', 'Dừng chuyển động'));
let preference: MediaQueryList | undefined;
function readPreference() { reduced.value = preference?.matches || false; }
onMounted(() => { preference = window.matchMedia('(prefers-reduced-motion: reduce)'); preference.addEventListener('change', readPreference); readPreference(); });
onBeforeUnmount(() => preference?.removeEventListener('change', readPreference));
function select(member: CrewMember, point: FleetPoint) { selected.value = member; anchor.value = point; }
function resetFilters() { filters.query = ''; filters.market = 'all'; filters.function = 'all'; }
const hasFilters = computed(() => !!filters.query || filters.market !== 'all' || filters.function !== 'all');
</script>

<template>
  <section class="crewpage" :aria-label="t('crew.title')">
    <header class="crewpage__header"><p class="crewpage__eyebrow mono">INTREPID UNIVERSE</p><h1>Value Protection Crew</h1><p>{{ text('Every ship has a role. Together, protecting value for Intrepid.', 'Mỗi chiến hạm một vai trò. Cùng bảo vệ giá trị cho Intrepid.') }}</p></header>
    <div class="fleet-toolbar">
      <label class="fleet-search"><Icon name="search" :size="16" /><span class="sr-only">{{ t('crew.search') }}</span><input v-model="filters.query" type="search" maxlength="200" :placeholder="t('crew.searchPlaceholder')" autocomplete="off"></label>
      <label><span class="sr-only">{{ t('crew.market') }}</span><select v-model="filters.market" :aria-label="t('crew.market')"><option value="all">{{ t('crew.allMarkets') }}</option><option v-for="market in CREW_MARKETS" :key="market" :value="market">{{ t('crew.markets.' + market) }}</option></select></label>
      <label class="fleet-function"><span class="sr-only">{{ t('crew.function') }}</span><select v-model="filters.function" :aria-label="t('crew.function')"><option value="all">{{ t('crew.allFunctions') }}</option><option v-for="role in CREW_FUNCTIONS" :key="role" :value="role">{{ t('crew.functions.' + role) }}</option></select></label>
      <button type="button" class="fleet-motion" :aria-label="motionLabel" :title="motionLabel" :aria-pressed="paused || reduced" :disabled="reduced" @click="paused = !paused"><span aria-hidden="true">{{ paused || reduced ? '▷' : 'Ⅱ' }}</span><span class="fleet-motion__label">{{ motionLabel }}</span></button>
    </div>
    <div class="fleet-status"><p role="status" aria-live="polite">{{ t('crew.result', { count: visible.length, total: roster.length }) }}</p><button v-if="hasFilters" type="button" @click="resetFilters">{{ t('crew.reset') }}</button></div>
    <div class="crewpage__space">
      <svg class="fleet-trails" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="600" cy="230" rx="545" ry="145" /><ellipse cx="600" cy="270" rx="445" ry="195" /><path d="M40 400 Q600 40 1160 400" /></svg>
      <ProtectorFleet :members="visible" :selected-id="selected?.id" :paused="paused" @select="select" />
      <div v-if="!visible.length" class="fleet-empty"><h2>{{ t('crew.noMatch') }}</h2><p>{{ t('crew.noMatchBody') }}</p><button type="button" @click="resetFilters">{{ t('crew.reset') }}</button></div>
    </div>
    <MemberScopePanel v-if="selected" :member="selected" :anchor="anchor" @close="selected = null" />
    <footer>{{ text('Ships represent teammates, not reporting lines or a ranking.', 'Chiến hạm đại diện cho thành viên, không thể hiện cấp bậc hay tuyến báo cáo.') }}</footer>
  </section>
</template>

<style scoped>
.crewpage { position:relative; z-index:1; height:100%; min-height:0; display:flex; flex-direction:column; overflow:hidden; padding:24px clamp(12px,3vw,40px) 10px; }
.crewpage__header { flex:none; text-align:center; padding-bottom:20px; }
.crewpage__eyebrow { color:var(--color-cyan-400); font-size:10px; letter-spacing:.24em; line-height:1.5; }
h1 { margin:10px 0; color:var(--color-text-400); font-size:clamp(28px,4vw,48px); font-weight:600; letter-spacing:-.035em; line-height:1.15; text-wrap:balance; }
.crewpage__header>p:last-child { color:var(--color-text-300); font-size:14px; line-height:1.6; }
.fleet-toolbar { flex:none; display:flex; align-items:center; justify-content:center; gap:8px; width:min(100%,1040px); margin:0 auto; }
label { min-width:0; }
.fleet-search { flex:1; display:flex; align-items:center; gap:8px; max-width:350px; padding-left:12px; border:1px solid var(--color-card-border); border-radius:8px; background:color-mix(in srgb,var(--space-deep) 85%,transparent); color:var(--color-text-300); }
input,select,button { font:inherit; font-size:12px; line-height:1.4; color:var(--color-text-400); }
input,select { width:100%; min-width:0; min-height:44px; padding:8px 10px; background:var(--space-deep); border:1px solid var(--color-card-border); border-radius:8px; }
input { background:transparent; border:0; }
select { max-width:185px; }
input::placeholder { color:var(--color-text-300); opacity:.8; }
button { cursor:pointer; min-height:44px; border:1px solid var(--color-card-border); border-radius:8px; background:var(--space-deep); padding:8px 12px; }
button:hover { border-color:var(--color-cyan-400); }
button:focus-visible,input:focus-visible,select:focus-visible { outline:2px solid var(--color-orange-400); outline-offset:3px; }
button:disabled { cursor:default; opacity:.7; }
.fleet-motion { display:flex; align-items:center; gap:8px; flex:none; white-space:nowrap; }
.fleet-motion>span[aria-hidden] { color:var(--color-cyan-400); font-size:16px; }
.fleet-status { flex:none; height:32px; display:flex; justify-content:center; align-items:center; gap:12px; color:var(--color-text-300); font-size:11px; }
.fleet-status button { min-height:28px; padding:2px 6px; border:0; background:transparent; text-decoration:underline; font-size:11px; }
.crewpage__space { position:relative; flex:1; min-height:0; isolation:isolate; }
.fleet-trails { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; fill:none; stroke:var(--color-cyan-400); stroke-width:.6; stroke-dasharray:2 10; opacity:.12; }
.fleet-empty { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:min(420px,90%); padding:24px; text-align:center; border:1px solid var(--color-card-border); border-radius:12px; background:var(--space-deep); }
.fleet-empty h2 { font-size:20px; font-weight:500; }
.fleet-empty p { margin:12px 0; color:var(--color-text-300); font-size:13px; line-height:1.6; }
footer { flex:none; text-align:center; color:var(--color-text-300); font-size:10px; line-height:1.5; padding-top:8px; }
.sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
@media(max-width:760px) { .crewpage { padding-top:16px; } .crewpage__header { padding-bottom:12px; } h1 { font-size:32px; margin:8px 0; } .crewpage__header>p:last-child { font-size:12px; } .fleet-toolbar { flex-wrap:wrap; gap:6px; } .fleet-search { flex-basis:calc(100% - 150px); } .fleet-toolbar>label { flex:1; } .fleet-toolbar>.fleet-search { flex:1 1 calc(100% - 170px); max-width:none; } .fleet-motion { font-size:11px; padding:8px; } .fleet-function { order:2; } .fleet-toolbar select { max-width:none; } input,select { font-size:14px; } .fleet-status { height:26px; } }
@media(max-width:420px) { .crewpage { padding-top:12px; } .crewpage__header>p:last-child { max-width:280px; margin:auto; } h1 { font-size:28px; } .fleet-toolbar>.fleet-search { flex:1 1 100%; } .fleet-toolbar .fleet-function { flex:1; order:0; } .fleet-motion { flex:none; width:44px; height:44px; padding:0; gap:0; justify-content:center; } .fleet-motion__label { display:none; } select { font-size:11px; padding:8px 6px; } footer { font-size:9px; } }
@media(max-height:650px) and (min-width:761px) { .crewpage { padding-top:12px; } .crewpage__header { padding-bottom:12px; } h1 { font-size:34px; margin:6px 0; } .crewpage__header>p:last-child { font-size:12px; } }
</style>
