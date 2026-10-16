<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import { useLocale } from "../i18n";
import CrewSourceNotice from "./CrewSourceNotice.vue";
import MemberPortfolio from "./MemberPortfolio.vue";
import Icon from "./Icon.vue";

const { selectedMember, openCrew, memberScope, source, isLoading } = useLinks();
const { t } = useLocale();
const member = computed(() => selectedMember.value);
const scope = computed(() => member.value ? memberScope(member.value) : []);
const emptyTitle = computed(() => isLoading.value ? "loading" : source.value === "stale" ? "staleEmptyTitle" : source.value === "live" ? "emptyTitle" : "unavailableTitle");
const emptyBody = computed(() => source.value === "stale" ? "staleEmptyBody" : source.value === "live" ? "emptyBody" : source.value === "mock" ? "demoEmpty" : "unavailableBody");
</script>

<template>
  <section class="member">
    <div class="member__scroll vph-scroll"><div class="member__content">
      <nav class="member__breadcrumb" :aria-label="t('crew.member.back')"><button type="button" @click="openCrew"><Icon name="chevronRight" :size="16" class="member__back-icon" />{{ t('crew.member.back') }}</button><span v-if="member" aria-hidden="true">/</span><span v-if="member">{{ member.name }}</span></nav>
      <template v-if="member">
        <header class="member__header" :style="{ '--member-accent': member.accent }">
          <div class="member__avatar" aria-hidden="true">{{ member.name.charAt(0) }}</div>
          <div class="member__identity"><p class="member__eyebrow mono">{{ t('crew.member.eyebrow') }}</p><h1>{{ member.name }}</h1><p class="member__role">{{ t('crew.profiles.' + member.profileKey + '.role') }}</p><p class="member__summary">{{ t('crew.profiles.' + member.profileKey + '.summary') }}</p><div class="member__labels"><span><Icon name="globe" :size="15" />{{ t('crew.markets.' + (member.country || member.market)) }}</span><span>{{ t('crew.functions.' + member.function) }}</span></div></div>
        </header>
        <CrewSourceNotice />
        <MemberPortfolio v-if="scope.length" :key="member.id" :rows="scope" :member-id="member.id" />
        <div v-else class="member__empty" :aria-busy="isLoading"><h2>{{ t('crew.member.' + emptyTitle) }}</h2><template v-if="!isLoading"><p>{{ t('crew.member.' + emptyBody) }}</p><p v-if="member.group === 'regional' && source === 'live'">{{ t('crew.member.emptyRegional') }}</p></template><div v-else class="member__skeleton" aria-hidden="true"><span></span><span></span><span></span></div></div>
        <p class="member__boundary">{{ t('crew.boundary') }}</p>
      </template>
      <div v-else class="member__empty"><h1>{{ t('crew.member.noSelection') }}</h1><p>{{ t('crew.member.noSelectionBody') }}</p><button type="button" @click="openCrew">{{ t('crew.member.back') }}</button></div>
    </div></div>
  </section>
</template>

<style scoped>
.member { position: relative; z-index: 1; height: 100%; min-height: 0; overflow: hidden; }
.member__scroll { height: 100%; overflow-y: auto; padding: 24px clamp(16px,4vw,52px) 64px; }
.member__content { max-width: 1160px; margin: 0 auto; }
.member__breadcrumb { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; margin-bottom: 20px; font-size: 12px; color: var(--color-text-300); }
button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 6px; background: var(--space-navy); color: var(--color-text-400); font: inherit; font-size: 12px; cursor: pointer; }
.member__breadcrumb button { background: transparent; border-color: transparent; padding-left: 0; color: var(--color-cyan-400); }
.member__back-icon { transform: rotate(180deg); }
button:hover { border-color: var(--color-card-border-hover); background: var(--color-command-bg-soft); }
button:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 3px; }
.member__header { display: flex; align-items: flex-start; gap: 24px; padding: 28px 0; margin-bottom: 24px; border-top: 1px solid var(--color-card-border); border-bottom: 1px solid var(--color-card-border); }
.member__avatar { flex: none; display: grid; place-items: center; width: 72px; height: 72px; border-radius: 20px; background: color-mix(in srgb,var(--member-accent) 10%,var(--space-navy)); border: 1px solid color-mix(in srgb,var(--member-accent) 35%,var(--color-card-border)); font-size: 30px; font-weight: 500; }
.member__identity { min-width: 0; }
.member__eyebrow { font-size: 10px; letter-spacing: .12em; color: var(--color-cyan-400); line-height: 1.5; }
h1 { font-size: clamp(30px,4vw,42px); font-weight: 500; line-height: 1.2; letter-spacing: -.025em; margin: 8px 0 10px; overflow-wrap: anywhere; }
.member__role { font-size: 15px; color: var(--color-text-400); line-height: 1.6; font-weight: 500; }
.member__summary { color: var(--color-text-300); font-size: 14px; line-height: 1.75; max-width: 65ch; margin-top: 12px; }
.member__labels { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 24px; margin-top: 16px; color: var(--color-text-300); font-size: 12px; line-height: 1.6; }
.member__labels>span { display: inline-flex; gap: 8px; align-items: center; }
.member__empty { margin-top: 28px; padding: 24px; border: 1px solid var(--color-card-border); border-radius: var(--radius-md); background: var(--space-navy); }
.member__empty h2 { font-size: 22px; font-weight: 500; line-height: 1.4; }
.member__empty p { max-width: 70ch; color: var(--color-text-300); font-size: 14px; line-height: 1.75; margin-top: 12px; }
.member__empty button { margin-top: 20px; }
.member__skeleton { display: grid; gap: 12px; margin-top: 20px; }
.member__skeleton span { height: 32px; border-radius: 6px; background: var(--color-command-bg-soft); }
.member__boundary { max-width: 90ch; color: var(--color-text-300); font-size: 12px; line-height: 1.7; margin-top: 24px; }
@media(max-width:540px) { .member__header { gap: 16px; flex-wrap: wrap; padding-top: 20px; } .member__avatar { width: 52px; height: 52px; border-radius: 14px; font-size: 24px; } .member__identity { flex: 1; min-width: 160px; } .member__empty { padding: 20px 16px; } }
</style>
