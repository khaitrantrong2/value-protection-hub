<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { CrewMember } from '../data/crew';
import { fleetHullFor } from '../services/fleetMotion';
import { useLinks } from '../composables/useLinks';
import { useLocale } from '../i18n';
import StarfighterIcon from './StarfighterIcon.vue';
import CrewMemberCard from './CrewMemberCard.vue';
import Icon from './Icon.vue';

const props = withDefaults(defineProps<{ members: CrewMember[]; paused?: boolean }>(), { paused: false });
const emit = defineEmits<{ select: [member: CrewMember] }>();
const { memberScope } = useLinks();
const { t, text } = useLocale();

/** Fixed constellation nodes — one squadron per market plus the regional command and automation cells.
 *  Positions are visual only; they encode no rank, workload or ownership. */
const SQUAD_DEFS = [
  { key: 'command', node: { x: 50, y: 17 } },
  { key: 'automation', node: { x: 23, y: 31 } },
  { key: 'MY', node: { x: 77, y: 31 } },
  { key: 'VN', node: { x: 13, y: 56 } },
  { key: 'PH', node: { x: 50, y: 48 } },
  { key: 'SG', node: { x: 87, y: 56 } },
  { key: 'TH', node: { x: 31, y: 80 } },
  { key: 'ID', node: { x: 69, y: 80 } },
  { key: 'flex', node: { x: 50, y: 90 } },
] as const;

const EDGE_KEYS: [string, string][] = [
  ['command', 'automation'], ['command', 'PH'], ['command', 'MY'],
  ['automation', 'VN'], ['automation', 'PH'],
  ['VN', 'TH'], ['TH', 'flex'], ['flex', 'ID'], ['ID', 'SG'], ['SG', 'MY'],
  ['PH', 'TH'], ['PH', 'ID'],
];

function squadKeyFor(member: CrewMember): string {
  if (member.group === 'flex') return 'flex';
  if (member.function === 'automation') return 'automation';
  if (member.group === 'regional') return 'command';
  return member.country ?? 'command';
}

function squadLabel(key: string): string {
  if (key === 'command') return text('Regional Command', 'Chỉ huy khu vực');
  if (key === 'automation') return text('Automation', 'Tự động hóa');
  if (key === 'flex') return t('crew.markets.Rotational');
  return t(`crew.markets.${key}`);
}

interface PlacedMember { member: CrewMember; x: number; y: number; squad: string }

const RX = 8, RY = 11;
const clampX = (v: number) => Math.max(6, Math.min(94, v));
const clampY = (v: number) => Math.max(9, Math.min(93, v));

const squads = computed(() => SQUAD_DEFS.map(def => ({
  key: def.key,
  label: squadLabel(def.key),
  node: def.node,
  members: props.members.filter(member => squadKeyFor(member) === def.key),
})).filter(squad => squad.members.length > 0));

const placed = computed<PlacedMember[]>(() => squads.value.flatMap(squad => {
  const k = squad.members.length;
  return squad.members.map((member, i) => {
    if (k === 1) return { member, x: squad.node.x, y: squad.node.y, squad: squad.key };
    // Centre an empty gap at the top of the ring so the squadron label never sits under a ship.
    const theta = (3 * Math.PI / 2 - Math.PI / k) + (i * 2 * Math.PI) / k;
    return {
      member,
      x: clampX(squad.node.x + (squad.key === 'command' ? 10 : RX) * Math.cos(theta)),
      y: clampY(squad.node.y + RY * Math.sin(theta)),
      squad: squad.key,
    };
  });
}));

const positionOf = computed(() => new Map(placed.value.map(p => [p.member.id, p])));

const edges = computed(() => {
  const nodeFor = new Map<string, { x: number; y: number }>(squads.value.map(s => [s.key, s.node]));
  return EDGE_KEYS.flatMap(([a, b]) => {
    const na = nodeFor.get(a), nb = nodeFor.get(b);
    return na && nb ? [{ key: `${a}-${b}`, x1: na.x, y1: na.y, x2: nb.x, y2: nb.y }] : [];
  });
});

const scopeCountFor = computed(() => new Map(props.members.map(m => [m.id, memberScope(m).length])));

const rankLabel = (rank: string) => ({
  commander: text('Commander', 'Chỉ huy'),
  lead: text('Lead', 'Trưởng nhóm'),
  guardian: text('Guardian', 'Vệ binh'),
  cadet: text('Cadet', 'Học viên'),
}[rank] ?? rank);

// Squadron filter chips
const activeSquad = ref('all');
const chips = computed(() => [
  { key: 'all', label: text('All squadrons', 'Tất cả') },
  ...squads.value.map(s => ({ key: s.key, label: s.label })),
]);
const isDimmed = (squad: string) => activeSquad.value !== 'all' && activeSquad.value !== squad;

// Hover / focus popover
const hovered = ref('');
const focused = ref('');
const activeId = computed(() => hovered.value || focused.value);
const activeMember = computed(() => props.members.find(m => m.id === activeId.value));
const tip = computed(() => {
  const p = activeId.value ? positionOf.value.get(activeId.value) : undefined;
  if (!p) return null;
  return {
    left: `${Math.max(14, Math.min(86, p.x))}%`,
    top: `${p.y}%`,
    above: p.y > 42,
  };
});

// Narrow screens fall back to a grouped roster list.
const narrow = ref(false);
let mq: MediaQueryList | undefined;
const readNarrow = () => { narrow.value = mq?.matches ?? false; };
onMounted(() => { mq = window.matchMedia('(max-width: 680px)'); mq.addEventListener('change', readNarrow); readNarrow(); });
onBeforeUnmount(() => mq?.removeEventListener('change', readNarrow));
</script>

<template>
  <div class="crewc" :class="{ 'crewc--still': paused }">
    <div class="crewc__chips" role="group" :aria-label="text('Filter by squadron', 'Lọc theo đội')">
      <button v-for="chip in chips" :key="chip.key" type="button" class="crewc__chip" :class="{ 'is-on': activeSquad === chip.key }" :aria-pressed="activeSquad === chip.key" @click="activeSquad = chip.key">{{ chip.label }}</button>
    </div>

    <!-- Constellation (wide) -->
    <div v-if="!narrow" class="crewc__stage" data-protector-fleet>
      <svg class="crewc__links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line v-for="edge in edges" :key="edge.key" class="crewc__link" :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2" />
      </svg>

      <div v-for="squad in squads" :key="squad.key" class="crewc__node" :class="[{ 'is-dim': isDimmed(squad.key) }, 'crewc__node--' + squad.key]" :style="{ left: squad.node.x + '%', top: squad.node.y + '%' }">
        <span class="crewc__node-glow" aria-hidden="true"></span>
        <span class="crewc__node-label mono">{{ squad.label }}</span>
      </div>

      <button
        v-for="p in placed"
        :key="p.member.id"
        type="button"
        class="crewc__ship"
        :class="{ 'is-dim': isDimmed(p.squad), 'is-active': activeId === p.member.id }"
        :style="{ left: p.x + '%', top: p.y + '%', '--accent': p.member.accent }"
        :data-protector-id="p.member.id"
        :aria-label="`${p.member.name} · ${t('crew.profiles.' + p.member.profileKey + '.role')} · ${t('crew.markets.' + (p.member.country || p.member.market))}`"
        :aria-describedby="activeId === p.member.id ? 'crewc-tip' : undefined"
        @pointerenter="hovered = p.member.id"
        @pointerleave="hovered = ''"
        @focus="focused = p.member.id"
        @blur="focused = ''"
        @click="emit('select', p.member)"
      >
        <span class="crewc__hull" aria-hidden="true"><StarfighterIcon :arch="fleetHullFor(p.member)" :color="p.member.accent" /></span>
        <span class="crewc__name">{{ p.member.name }}</span>
      </button>

      <div v-if="activeMember && tip" id="crewc-tip" class="crewc__tip" :class="{ 'crewc__tip--below': !tip.above }" role="tooltip" :style="{ left: tip.left, top: tip.top }">
        <div class="crewc__tip-head">
          <strong>{{ activeMember.name }}</strong>
          <span class="crewc__tip-rank mono" :style="{ '--accent': activeMember.accent }">{{ rankLabel(activeMember.rank) }}</span>
        </div>
        <span class="crewc__tip-role">{{ t('crew.profiles.' + activeMember.profileKey + '.role') }}</span>
        <span class="crewc__tip-meta">{{ t('crew.markets.' + (activeMember.country || activeMember.market)) }} · {{ t('crew.functions.' + activeMember.function) }}</span>
        <span class="crewc__tip-scope">{{ (scopeCountFor.get(activeMember.id) || 0) > 0 ? t('crew.scopeRows', { count: scopeCountFor.get(activeMember.id) || 0 }) : t('crew.openProfile') }}<Icon name="arrowRight" :size="14" /></span>
      </div>
    </div>

    <!-- Grouped roster list (narrow) -->
    <div v-else class="crewc__list vph-scroll">
      <section v-for="squad in squads" :key="squad.key" v-show="!isDimmed(squad.key)" class="crewc__listgroup">
        <h2 class="crewc__listhead mono">{{ squad.label }}</h2>
        <div class="crewc__listgrid">
          <CrewMemberCard v-for="member in squad.members" :key="member.id" :member="member" :scope-count="scopeCountFor.get(member.id)" @open="emit('select', $event)" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.crewc { position:absolute; inset:0; display:flex; flex-direction:column; min-height:0; }
.crewc__chips { flex:none; display:flex; flex-wrap:wrap; gap:7px; justify-content:center; padding:0 8px 12px; }
.crewc__chip { padding:5px 12px; border:1px solid var(--color-card-border); border-radius:999px; background:color-mix(in srgb,var(--space-deep) 70%,transparent); color:var(--color-text-300); font:inherit; font-size:11px; letter-spacing:.02em; cursor:pointer; transition:border-color .18s,color .18s,background .18s; }
.crewc__chip:hover { border-color:var(--color-card-border-hover); color:var(--color-text-400); }
.crewc__chip.is-on { border-color:var(--color-cyan-400); color:var(--color-text-400); background:color-mix(in srgb,var(--color-cyan-400) 12%,transparent); }
.crewc__chip:focus-visible { outline:2px solid var(--color-orange-400); outline-offset:3px; }

.crewc__stage { position:relative; flex:1; min-height:0; isolation:isolate; }

.crewc__links { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:visible; }
.crewc__link { stroke:#8f7ad0; stroke-width:1; vector-effect:non-scaling-stroke; opacity:.3; filter:drop-shadow(0 0 3px rgba(168,140,230,.4)); animation:crewc-pulse 3.4s ease-in-out infinite; }
@keyframes crewc-pulse { 0%,100% { opacity:.18; } 50% { opacity:.4; } }

.crewc__node { position:absolute; transform:translate(-50%,-50%); display:grid; place-items:center; width:0; height:0; pointer-events:none; transition:opacity .25s; }
.crewc__node-glow { position:absolute; width:120px; height:120px; border-radius:50%; background:radial-gradient(circle, rgba(183,148,246,.14), transparent 68%); animation:crewc-breathe 4.2s ease-in-out infinite; }
.crewc__node-label { position:absolute; top:-58px; white-space:nowrap; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--color-text-200); text-shadow:0 2px 6px #000; }
.crewc__node--command .crewc__node-label { width:62px; white-space:normal; text-align:center; }
.crewc__node--TH .crewc__node-label { top:-110px; }
.crewc__node--PH .crewc__node-label { top:-26px; left:36px; }
.crewc__node--VN .crewc__node-label { left:50px; }
@keyframes crewc-breathe { 0%,100% { transform:scale(.9); opacity:.7; } 50% { transform:scale(1.12); opacity:1; } }

.crewc__ship { position:absolute; transform:translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:2px; width:72px; padding:4px; border:1px solid transparent; border-radius:12px; background:transparent; color:var(--color-cyan-400); font:inherit; cursor:pointer; transition:opacity .25s,border-color .18s,background .18s; z-index:2; }
.crewc__ship.is-dim { opacity:.16; }
.crewc__node.is-dim { opacity:.3; }
.crewc__hull { width:46px; height:52px; display:grid; place-items:center; filter:drop-shadow(0 0 8px color-mix(in srgb,var(--accent) 35%,transparent)); animation:crewc-bob 4s ease-in-out infinite; }
.crewc__ship:nth-child(odd) .crewc__hull { animation-delay:-1.3s; }
.crewc__ship:nth-child(3n) .crewc__hull { animation-delay:-2.4s; }
@keyframes crewc-bob { 0%,100% { transform:translateY(-3px); } 50% { transform:translateY(4px); } }
.crewc__name { max-width:96px; padding:1px 6px; border-radius:4px; background:color-mix(in srgb,var(--space-deep) 82%,transparent); color:var(--color-text-400); font-size:11.5px; line-height:1.4; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.crewc__ship:hover,.crewc__ship:focus-visible,.crewc__ship.is-active { border-color:color-mix(in srgb,var(--accent) 60%,transparent); background:color-mix(in srgb,var(--accent) 8%,transparent); z-index:5; }
.crewc__ship:focus-visible { outline:2px solid var(--color-orange-400); outline-offset:2px; }

.crewc--still .crewc__link,.crewc--still .crewc__node-glow,.crewc--still .crewc__hull { animation-play-state:paused; }

.crewc__tip { position:absolute; z-index:6; transform:translate(-50%,calc(-100% - 36px)); width:248px; padding:12px 14px; border:1px solid var(--color-card-border-hover); background:var(--space-deep); border-radius:10px; box-shadow:0 14px 34px #0007; text-align:left; pointer-events:none; display:flex; flex-direction:column; gap:5px; }
.crewc__tip--below { transform:translate(-50%,36px); }
.crewc__tip-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.crewc__tip-head strong { color:var(--color-text-400); font-size:14px; font-weight:600; }
.crewc__tip-rank { font-size:9px; letter-spacing:.1em; text-transform:uppercase; padding:2px 7px; border-radius:999px; color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 45%,transparent); }
.crewc__tip-role { color:var(--color-text-300); font-size:12px; line-height:1.4; }
.crewc__tip-meta { color:var(--color-text-200); font-size:11px; }
.crewc__tip-scope { display:inline-flex; align-items:center; gap:6px; margin-top:3px; color:var(--color-cyan-400); font-size:11px; }

.crewc__list { flex:1; min-height:0; overflow-y:auto; padding:0 4px 24px; }
.crewc__listgroup { margin-bottom:22px; }
.crewc__listhead { font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--color-text-200); margin:0 0 10px; padding-bottom:6px; border-bottom:1px solid var(--color-card-border); }
.crewc__listgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:12px; }

@media (prefers-reduced-motion:reduce) {
  .crewc__link,.crewc__node-glow,.crewc__hull { animation:none; }
  .crewc__ship,.crewc__node,.crewc__chip { transition:none; }
}
</style>
