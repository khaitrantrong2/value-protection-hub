<script setup lang="ts">
import { computed } from "vue";
import { crew, type CrewGroup, type CrewMember } from "../data/crew";
import { CREW_FUNCTIONS, CREW_MARKETS, matchesCrew } from "../data/crewDirectory";
import { useLinks } from "../composables/useLinks";
import { useCrewDirectory } from "../composables/useCrewDirectory";
import { useLocale } from "../i18n";
import { messages } from "../i18n/messages/crew";
import CrewMemberCard from "./CrewMemberCard.vue";
import CrewSourceNotice from "./CrewSourceNotice.vue";
import Icon from "./Icon.vue";

const { openMember, memberScope, source } = useLinks();
const { t } = useLocale();
const filters = useCrewDirectory();
const roster = crew.filter(member => member.active !== false);
const scopes = computed(() => new Map(roster.map(member => [member.id, memberScope(member)])));
function searchCopy(member: CrewMember) {
  const key = member.profileKey as keyof typeof messages.en.crew.profiles;
  return [messages.en.crew.profiles[key], messages.vi.crew.profiles[key]].flatMap(profile => Object.values(profile || {})).join(" ");
}
const visible = computed(() => roster.filter(member => matchesCrew(member, filters.query, filters.market, filters.function, scopes.value.get(member.id) || [], searchCopy(member))));
const groupOrder: CrewGroup[] = ["regional", "market", "flex"];
const groups = computed(() => groupOrder.map(id => ({ id, members: visible.value.filter(member => member.group === id) })).filter(group => group.members.length));
function resetFilters() { filters.query = ""; filters.market = "all"; filters.function = "all"; }
const hasFilters = computed(() => !!filters.query || filters.market !== "all" || filters.function !== "all");
const hasSource = computed(() => source.value === "live" || source.value === "stale");
</script>

<template>
  <section class="crewpage">
    <div class="crewpage__scroll vph-scroll">
      <div class="crewpage__content">
        <header class="crewpage__header"><p class="crewpage__eyebrow mono">{{ t('crew.eyebrow') }}</p><h1>{{ t('crew.title') }}</h1><p>{{ t('crew.intro') }}</p></header>
        <div class="crew-discovery">
          <div class="crew-filters">
            <label class="crew-filters__search"><span>{{ t('crew.search') }}</span><span class="crew-search-input"><Icon name="search" :size="18" /><input v-model="filters.query" type="search" maxlength="200" :placeholder="t('crew.searchPlaceholder')" autocomplete="off"></span></label>
            <label><span>{{ t('crew.market') }}</span><select v-model="filters.market"><option value="all">{{ t('crew.allMarkets') }}</option><option v-for="market in CREW_MARKETS" :key="market" :value="market">{{ t('crew.markets.' + market) }}</option></select></label>
            <label><span>{{ t('crew.function') }}</span><select v-model="filters.function"><option value="all">{{ t('crew.allFunctions') }}</option><option v-for="role in CREW_FUNCTIONS" :key="role" :value="role">{{ t('crew.functions.' + role) }}</option></select></label>
          </div>
          <div class="crew-filter-result"><p role="status" aria-live="polite">{{ t('crew.result', { count: visible.length, total: roster.length }) }}</p><button v-if="hasFilters" type="button" @click="resetFilters"><Icon name="close" :size="14" />{{ t('crew.reset') }}</button></div>
        </div>
        <CrewSourceNotice />
        <p class="crew-boundary">{{ t('crew.boundary') }}</p>
        <div v-if="!visible.length" class="crew-empty"><h2>{{ t('crew.noMatch') }}</h2><p>{{ t('crew.noMatchBody') }}</p><button type="button" @click="resetFilters">{{ t('crew.reset') }}</button></div>
        <section v-for="group in groups" :key="group.id" class="crew-group" :aria-labelledby="'crew-group-' + group.id">
          <header class="crew-group__header"><div><h2 :id="'crew-group-' + group.id">{{ t('crew.groups.' + group.id) }}<span>{{ group.members.length }}</span></h2><p>{{ t('crew.groupNotes.' + group.id) }}</p></div></header>
          <div class="crew-grid"><CrewMemberCard v-for="member in group.members" :key="member.id" :member="member" :scope-count="hasSource ? scopes.get(member.id)?.length : undefined" @open="openMember" /></div>
        </section>
        <footer class="crew-footer">{{ t('crew.rosterSource') }}</footer>
      </div>
    </div>
  </section>
</template>

<style scoped>
.crewpage { position: relative; z-index: 1; height: 100%; min-height: 0; overflow: hidden; }
.crewpage__scroll { height: 100%; overflow-y: auto; padding: 32px clamp(16px,4vw,52px) 64px; }
.crewpage__content { max-width: 1220px; margin: 0 auto; }
.crewpage__header { margin-bottom: 20px; max-width: 800px; }
.crewpage__eyebrow { font-size: 11px; letter-spacing: .14em; color: var(--color-cyan-400); }
h1 { margin: 10px 0 12px; font-size: clamp(30px,4vw,44px); font-weight: 500; letter-spacing: -.025em; line-height: 1.15; text-wrap: balance; }
.crewpage__header>p:last-child { font-size: 15px; color: var(--color-text-300); line-height: 1.7; max-width: 65ch; }
.crew-discovery { border: 1px solid var(--color-card-border); border-radius: var(--radius-md); background: var(--space-deep); padding: 16px; margin-bottom: 12px; }
.crew-filters { display: grid; grid-template-columns: minmax(0,1.6fr) minmax(160px,.7fr) minmax(190px,.8fr); gap: 16px; }
label { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
label>span:first-child { font-size: 12px; color: var(--color-text-300); }
.crew-search-input { display: flex; align-items: center; gap: 10px; border: 1px solid var(--color-card-border); background: var(--space-navy); border-radius: 6px; padding-left: 12px; color: var(--color-text-300); }
input,select { width: 100%; min-width: 0; min-height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 6px; background: var(--space-navy); color: var(--color-text-400); font: inherit; font-size: 14px; }
input { border: none; background: transparent; }
input::placeholder { color: var(--color-text-300); opacity: .8; }
.crew-filter-result { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 32px; margin-top: 8px; color: var(--color-text-300); font-size: 12px; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 6px; background: var(--space-navy); color: var(--color-text-400); font: inherit; font-size: 12px; cursor: pointer; }
button:hover { border-color: var(--color-card-border-hover); background: var(--color-command-bg-soft); }
button:focus-visible,input:focus-visible,select:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 3px; }
.crew-boundary { margin-top: 12px; color: var(--color-text-300); font-size: 12px; line-height: 1.65; max-width: 90ch; }
.crew-group { margin-top: 32px; }
.crew-group__header { margin-bottom: 16px; }
h2 { display: flex; align-items: baseline; gap: 12px; font-weight: 500; font-size: 22px; line-height: 1.4; }
h2>span { color: var(--color-text-300); font-size: 12px; font-variant-numeric: tabular-nums; }
.crew-group__header p { margin-top: 8px; color: var(--color-text-300); font-size: 13px; line-height: 1.6; max-width: 75ch; }
.crew-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; }
.crew-empty { padding: 32px 0; }
.crew-empty p { margin: 12px 0 20px; color: var(--color-text-300); font-size: 14px; line-height: 1.7; max-width: 65ch; }
.crew-footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--color-card-border); color: var(--color-text-300); font-size: 12px; line-height: 1.7; }
@media(max-width:1000px) { .crew-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } .crew-filters { grid-template-columns: minmax(0,1fr) minmax(0,1fr); } .crew-filters__search { grid-column: 1/-1; } }
@media(max-width:540px) { .crewpage__scroll { padding-top: 24px; } .crew-discovery { padding: 16px; } .crew-grid,.crew-filters { grid-template-columns: minmax(0,1fr); } .crew-filters__search { grid-column: auto; } input,select { font-size: 16px; } h2 { font-size: 20px; } .crew-group { margin-top: 28px; } }
</style>
