<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import { useLocale } from "../i18n";
import CrewSourceNotice from "./CrewSourceNotice.vue";
import MemberPortfolio from "./MemberPortfolio.vue";
import StarfighterIcon from "./StarfighterIcon.vue";
import Icon from "./Icon.vue";
import { fleetHullFor } from "../services/fleetMotion";

const { selectedMember, openCrew, memberScope, source, isLoading } = useLinks();
const { t, text } = useLocale();
const member = computed(() => selectedMember.value);
const scope = computed(() => member.value ? memberScope(member.value) : []);
const emptyTitle = computed(() => isLoading.value ? "loading" : source.value === "stale" ? "staleEmptyTitle" : source.value === "live" ? "emptyTitle" : "unavailableTitle");
const emptyBody = computed(() => source.value === "stale" ? "staleEmptyBody" : source.value === "live" ? "emptyBody" : source.value === "mock" ? "demoEmpty" : "unavailableBody");
</script>

<template>
  <section class="member">
    <div class="member__content">
      <div class="member__top"><nav class="member__breadcrumb" :aria-label="t('crew.member.back')"><button type="button" @click="openCrew"><Icon name="chevronRight" :size="15" class="member__back-icon" />{{ t('crew.member.back') }}</button></nav><CrewSourceNotice v-if="member" /></div>
      <template v-if="member">
        <header class="member__header">
          <div class="member__ship" aria-hidden="true"><StarfighterIcon :arch="fleetHullFor(member)" :color="member.accent" /></div>
          <div class="member__identity"><p class="member__eyebrow">{{ text('VALUE PROTECTOR', 'VALUE PROTECTOR') }}</p><h1>{{ member.name }}</h1><p class="member__role">{{ t('crew.profiles.' + member.profileKey + '.role') }}</p></div>
          <div class="member__labels"><span><Icon name="globe" :size="14" />{{ t('crew.markets.' + (member.country || member.market)) }}</span><span>{{ t('crew.functions.' + member.function) }}</span></div>
        </header>
        <MemberPortfolio v-if="scope.length" :key="member.id" :rows="scope" :member-id="member.id" />
        <div v-else class="member__empty vph-scroll" :aria-busy="isLoading"><h2>{{ t('crew.member.' + emptyTitle) }}</h2><template v-if="!isLoading"><p>{{ t('crew.member.' + emptyBody) }}</p><p v-if="member.group === 'regional' && source === 'live'">{{ t('crew.member.emptyRegional') }}</p></template><div v-else class="member__skeleton" aria-hidden="true"><span></span><span></span><span></span></div></div>
      </template>
      <div v-else class="member__empty"><h1>{{ t('crew.member.noSelection') }}</h1><p>{{ t('crew.member.noSelectionBody') }}</p><button type="button" @click="openCrew">{{ t('crew.member.back') }}</button></div>
    </div>
  </section>
</template>

<style scoped>
.member { position:relative; z-index:1; height:100%; min-height:0; overflow:hidden; padding:12px clamp(16px,3vw,40px) 16px; }
.member__content { display:flex; flex-direction:column; height:100%; min-height:0; max-width:1280px; margin:auto; }
.member__top { flex:none; display:flex; align-items:flex-start; justify-content:space-between; gap:16px; min-height:36px; }
.member__top :deep(.crew-source) { max-width:540px; align-self:center; }
.member__breadcrumb { font-size:11px; color:var(--color-text-300); }
button { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:36px; padding:6px 9px; border:1px solid var(--color-card-border); border-radius:5px; background:var(--space-navy); color:var(--color-text-400); font:inherit; font-size:11px; cursor:pointer; }
.member__breadcrumb button { background:transparent; border-color:transparent; padding-left:0; color:var(--color-text-300); }
.member__back-icon { transform:rotate(180deg); }
button:hover { border-color:var(--color-card-border-hover); }
button:focus-visible { outline:2px solid var(--color-orange-400); outline-offset:3px; }
.member__header { flex:none; display:flex; align-items:center; gap:18px; padding:14px 0 18px; border-bottom:1px solid var(--color-card-border); }
.member__ship { flex:none; width:68px; height:68px; display:grid; place-items:center; color:var(--color-cyan-400); border:1px solid var(--color-card-border); border-radius:50%; background:radial-gradient(circle,var(--color-cyan-muted),transparent 75%); }
.member__ship :deep(.flame) { animation:none; }
.member__identity { min-width:0; }
.member__eyebrow { color:var(--color-text-200); font-size:9px; letter-spacing:.15em; line-height:1.5; }
h1 { font-size:clamp(26px,3vw,34px); font-weight:500; line-height:1.2; letter-spacing:-.025em; margin:4px 0 5px; overflow-wrap:anywhere; }
.member__role { color:var(--color-text-300); font-size:12px; line-height:1.5; }
.member__labels { display:flex; flex-wrap:wrap; justify-content:flex-end; align-items:center; gap:8px; margin-left:auto; color:var(--color-text-300); font-size:10px; }
.member__labels>span { display:inline-flex; align-items:center; gap:6px; padding:5px 8px; border:1px solid var(--color-card-border); border-radius:5px; }
.member__empty { flex:1; min-height:0; overflow:auto; margin-top:16px; padding:24px; border:1px solid var(--color-card-border); border-radius:8px; background:var(--space-navy); }
.member__empty h2 { font-size:20px; font-weight:500; line-height:1.4; }
.member__empty p { max-width:70ch; color:var(--color-text-300); font-size:13px; line-height:1.7; margin-top:10px; }
.member__empty button { margin-top:16px; }
.member__skeleton { display:grid; gap:10px; margin-top:16px; }
.member__skeleton span { height:28px; border-radius:5px; background:var(--color-command-bg-soft); }
@media(max-width:760px) { .member { padding-top:8px; }.member__top { gap:8px; }.member__top :deep(.crew-source) { max-width:58%; }.member__top :deep(.crew-source p) { font-size:10px; } .member__header { gap:12px; padding:12px 0; }.member__ship { width:56px; height:56px; }.member__labels { flex-direction:column; align-items:flex-end; gap:5px; }.member__labels>span { border:0; padding:0; }.member__breadcrumb button { min-height:44px; } }
@media(max-width:540px) { .member { padding-inline:12px; }.member__header { flex-wrap:wrap; }.member__ship { width:48px; height:48px; }.member__ship :deep(svg) { width:32px; height:36px; }.member__identity { flex:1; min-width:150px; }h1 { font-size:27px; }.member__labels { flex-direction:row; width:100%; margin-left:60px; justify-content:flex-start; font-size:9px; gap:12px; }.member__empty { padding:18px 14px; }.member__top :deep(.crew-source strong) { font-size:9px; } }
@media(max-height:600px) and (min-width:761px) { .member__header { padding-block:8px; }.member__ship { width:52px; height:52px; }h1 { font-size:28px; } }
</style>
