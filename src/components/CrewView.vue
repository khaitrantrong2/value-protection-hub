<script setup lang="ts">
import { computed } from "vue";
import { crew, type CrewRank } from "../data/crew";

const groups: { label: string; ranks: CrewRank[] }[] = [
  { label: "COMMAND", ranks: ["commander", "lead"] },
  { label: "MARKET GUARDIANS", ranks: ["guardian"] },
  { label: "CADET CORPS", ranks: ["cadet"] },
];

const sections = computed(() =>
  groups
    .map((g) => ({ label: g.label, members: crew.filter((m) => g.ranks.includes(m.rank)) }))
    .filter((s) => s.members.length),
);
</script>

<template>
  <section class="crewpage">
    <div class="crewpage__scroll vph-scroll">
      <header class="crewpage__header">
        <p class="crewpage__eyebrow mono">INTREPID UNIVERSE</p>
        <h1 class="crewpage__title">Value Protection Crew</h1>
        <p class="crewpage__lead">
          The command formation of the guardians protecting value across the Intrepid galaxy — commanders, leads, and
          market guardians on station.
        </p>
      </header>

      <div v-for="section in sections" :key="section.label" class="crewpage__group">
        <div class="crewpage__group-head">
          <span class="crewpage__rule"></span>
          <span class="crewpage__group-label mono">{{ section.label }}</span>
          <span class="crewpage__rule"></span>
        </div>

        <div class="crewpage__grid">
          <article
            v-for="member in section.members"
            :key="member.name"
            class="crewpage__card"
            :style="{ '--accent': member.accent }"
          >
            <div class="crewpage__avatar">
              <span class="crewpage__avatar-halo"></span>
              <span class="crewpage__avatar-body">
                <span class="crewpage__avatar-visor">{{ member.name.charAt(0) }}</span>
              </span>
              <span class="crewpage__rank" :class="`crewpage__rank--${member.rank}`"></span>
            </div>
            <div class="crewpage__name">{{ member.name }}</div>
            <div class="crewpage__role mono">{{ member.roleShort }}</div>
            <p class="crewpage__blurb">{{ member.blurb }}</p>
            <div class="crewpage__meta mono">
              <span>{{ member.station }}</span>
              <span class="crewpage__clearance">{{ member.clearance }}</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.crewpage {
  position: relative;
  z-index: 1;
  height: calc(100svh - var(--height-header));
  overflow: hidden;
}

.crewpage__scroll {
  height: 100%;
  overflow-y: auto;
  max-width: 1320px;
  margin: 0 auto;
  padding: clamp(24px, 4vh, 48px) clamp(20px, 4vw, 52px) 64px;
}

.crewpage__header {
  text-align: center;
  margin-bottom: 40px;
}

.crewpage__eyebrow {
  font-size: 11px;
  letter-spacing: 0.28em;
  color: var(--color-cyan-400);
}

.crewpage__title {
  font-size: clamp(34px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 12px 0 14px;
}

.crewpage__lead {
  font-size: 15px;
  color: var(--color-text-200);
  max-width: 62ch;
  margin: 0 auto;
  text-wrap: pretty;
}

.crewpage__group {
  margin-bottom: 40px;
}

.crewpage__group-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 26px;
}

.crewpage__rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(176, 160, 210, 0.35), transparent);
}

.crewpage__group-label {
  font-size: 11px;
  letter-spacing: 0.26em;
  color: var(--color-text-300);
}

.crewpage__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 760px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.crewpage__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  padding: 26px 18px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-card-border);
  background: linear-gradient(180deg, rgba(42, 24, 92, 0.34), rgba(21, 10, 48, 0.16));
  transition:
    transform 0.22s var(--ease-power2-out),
    border-color 0.22s var(--ease-power2-out);

  @include hover {
    &:hover {
      transform: translateY(-4px);
      border-color: color-mix(in srgb, var(--accent) 50%, transparent);
    }
  }
}

.crewpage__avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  margin-bottom: 12px;
}

.crewpage__avatar-halo {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 45%, transparent), transparent 68%);
  opacity: 0.6;
}

.crewpage__avatar-body {
  position: relative;
  display: grid;
  place-items: center;
  width: 74px;
  height: 74px;
  border-radius: 26px 26px 30px 30px;
  border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%),
    rgba(21, 10, 48, 0.7);
}

.crewpage__avatar-visor {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: radial-gradient(circle at 42% 36%, color-mix(in srgb, var(--accent) 60%, #fff 10%), #1a0f3a 78%);
  color: #fff;
  font-family: "Outfit", sans-serif;
  font-weight: 700;
  font-size: 20px;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.4);
}

.crewpage__rank {
  position: absolute;
  bottom: 6px;
  right: 12px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--space-navy);
  background: var(--accent);

  &--commander {
    box-shadow: 0 0 10px var(--accent);
  }
  &--cadet {
    opacity: 0.6;
  }
}

.crewpage__name {
  font-weight: 600;
  font-size: 17px;
}

.crewpage__role {
  font-size: 9.5px;
  letter-spacing: 0.1em;
  color: var(--accent);
}

.crewpage__blurb {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-200);
  margin: 10px 0 12px;
}

.crewpage__meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--color-text-200);
  margin-top: auto;
}

.crewpage__clearance {
  color: var(--color-text-300);
}
</style>
