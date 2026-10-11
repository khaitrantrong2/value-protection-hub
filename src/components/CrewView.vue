<script setup lang="ts">
import { computed } from "vue";
import { crew, type CrewMember } from "../data/crew";
import { useLinks } from "../composables/useLinks";

const { openMember } = useLinks();

/** Only members on active duty appear in the formation (reassigned crew are kept in data but hidden). */
const roster = computed(() => crew.filter((m) => m.active !== false));

const commander = computed(() => roster.value.find((m) => m.rank === "commander") ?? null);
const leads = computed(() => roster.value.filter((m) => m.rank === "lead"));
const guardians = computed(() => roster.value.filter((m) => m.rank === "guardian"));
const cadets = computed(() => roster.value.filter((m) => m.rank === "cadet"));

const COUNTRY_NAME: Record<string, string> = {
  TH: "Thailand",
  VN: "Vietnam",
  SG: "Singapore",
  MY: "Malaysia",
  PH: "Philippines",
  ID: "Indonesia",
};

interface Pod {
  code: string;
  name: string;
  members: CrewMember[];
}

function podsFor(codes: string[]): Pod[] {
  return codes
    .map((code) => ({
      code,
      name: COUNTRY_NAME[code] ?? code,
      members: guardians.value.filter((g) => g.country === code),
    }))
    .filter((p) => p.members.length > 0);
}

// Geographic two-row arrangement: the big twin markets up top, the rest below.
const podsTop = computed(() => podsFor(["TH", "VN"]));
const podsBottom = computed(() => podsFor(["SG", "MY", "PH", "ID"]));

function open(m: CrewMember) {
  openMember(m);
}
</script>

<template>
  <section class="crewpage">
    <div class="crewpage__scroll vph-scroll">
      <header class="crewpage__header">
        <p class="crewpage__eyebrow mono">INTREPID UNIVERSE</p>
        <h1 class="crewpage__title">Value Protection Crew</h1>
        <p class="crewpage__lead">
          One commander at the core, the control &amp; data leads who power the engine, and the market guardians
          holding every sector line. Select a protector to open their portfolio.
        </p>
      </header>

      <div class="crewpage__spine">
        <!-- Control & Data leads (HQ row) -->
        <div class="tier">
          <span class="tier__label mono">CONTROL · DATA · AR</span>
          <div class="leads-row">
            <button
              v-for="m in leads"
              :key="m.name"
              type="button"
              class="crew-card crew-card--lead"
              :style="{ '--accent': m.accent }"
              @click="open(m)"
            >
              <div class="crew-card__avatar">
                <span class="crew-card__halo"></span>
                <span class="crew-card__body"><span class="crew-card__visor">{{ m.name.charAt(0) }}</span></span>
                <span class="crew-card__rank"></span>
              </div>
              <div class="crew-card__name">{{ m.name }}</div>
              <div class="crew-card__role mono">{{ m.roleShort }}</div>
              <p class="crew-card__blurb">{{ m.blurb }}</p>
              <div class="crew-card__meta mono"><span>{{ m.station }}</span><span>{{ m.clearance }}</span></div>
            </button>
          </div>
        </div>

        <!-- Commander — the core everyone orbits -->
        <div v-if="commander" class="tier tier--commander">
          <span class="tier__label mono">COMMANDER</span>
          <div class="commander-wrap">
            <button
              type="button"
              class="hero-card"
              :style="{ '--accent': commander.accent }"
              @click="open(commander)"
            >
              <div class="hero-card__avatar">
                <span class="hero-card__halo"></span>
                <span class="hero-card__ring"></span>
                <span class="hero-card__body"><span class="hero-card__visor">{{ commander.name.charAt(0) }}</span></span>
                <span class="hero-card__star">★</span>
              </div>
              <div class="hero-card__name">{{ commander.name }}</div>
              <div class="hero-card__role mono">{{ commander.roleShort }} · {{ commander.clearance }}</div>
              <p class="hero-card__blurb">{{ commander.blurb }}</p>
              <div class="hero-card__station mono">{{ commander.station }}</div>
            </button>
          </div>
        </div>

        <!-- Market guardians, grouped into country pods -->
        <div class="tier">
          <span class="tier__label mono">MARKET GUARDIANS</span>

          <div class="pods">
            <div v-for="pod in podsTop" :key="pod.code" class="pod">
              <div class="pod__head mono"><span class="pod__code">{{ pod.code }}</span>{{ pod.name }}</div>
              <div class="pod__cards">
                <button
                  v-for="m in pod.members"
                  :key="m.name"
                  type="button"
                  class="crew-card"
                  :style="{ '--accent': m.accent }"
                  @click="open(m)"
                >
                  <div class="crew-card__avatar">
                    <span class="crew-card__halo"></span>
                    <span class="crew-card__body"><span class="crew-card__visor">{{ m.name.charAt(0) }}</span></span>
                    <span class="crew-card__rank"></span>
                  </div>
                  <div class="crew-card__name">{{ m.name }}</div>
                  <div class="crew-card__role mono">{{ m.roleShort }}</div>
                  <div class="crew-card__meta mono"><span>{{ m.market }}</span><span>{{ m.clearance }}</span></div>
                </button>
              </div>
            </div>
          </div>

          <div class="pods">
            <div v-for="pod in podsBottom" :key="pod.code" class="pod">
              <div class="pod__head mono"><span class="pod__code">{{ pod.code }}</span>{{ pod.name }}</div>
              <div class="pod__cards">
                <button
                  v-for="m in pod.members"
                  :key="m.name"
                  type="button"
                  class="crew-card"
                  :style="{ '--accent': m.accent }"
                  @click="open(m)"
                >
                  <div class="crew-card__avatar">
                    <span class="crew-card__halo"></span>
                    <span class="crew-card__body"><span class="crew-card__visor">{{ m.name.charAt(0) }}</span></span>
                    <span class="crew-card__rank"></span>
                  </div>
                  <div class="crew-card__name">{{ m.name }}</div>
                  <div class="crew-card__role mono">{{ m.roleShort }}</div>
                  <div class="crew-card__meta mono"><span>{{ m.market }}</span><span>{{ m.clearance }}</span></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Flex support -->
        <div v-if="cadets.length" class="tier tier--cadet">
          <span class="tier__label mono">FLEX SUPPORT</span>
          <div class="tier__row">
            <button
              v-for="m in cadets"
              :key="m.name"
              type="button"
              class="crew-card crew-card--cadet"
              :style="{ '--accent': m.accent }"
              @click="open(m)"
            >
              <div class="crew-card__avatar">
                <span class="crew-card__halo"></span>
                <span class="crew-card__body"><span class="crew-card__visor">{{ m.name.charAt(0) }}</span></span>
                <span class="crew-card__rank crew-card__rank--cadet"></span>
              </div>
              <div class="crew-card__name">{{ m.name }}</div>
              <div class="crew-card__role mono">{{ m.roleShort }}</div>
              <p class="crew-card__blurb">{{ m.blurb }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.crewpage {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: hidden;
}

.crewpage__scroll {
  height: 100%;
  overflow-y: auto;
  padding: clamp(24px, 4vh, 48px) clamp(20px, 4vw, 52px) 80px;
}

.crewpage__header {
  text-align: center;
  margin-bottom: 20px;
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
  max-width: 64ch;
  margin: 0 auto;
  text-wrap: pretty;
}

.crewpage__spine {
  position: relative;
  max-width: 1160px;
  margin: 0 auto;
  padding-top: 20px;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 60px;
    left: 50%;
    width: 1px;
    transform: translateX(-50%);
    background: linear-gradient(180deg, transparent, rgba(183, 148, 246, 0.4) 10%, rgba(183, 148, 246, 0.12) 88%, transparent);
    pointer-events: none;
  }
}

.tier {
  position: relative;
  margin-bottom: 46px;
}

.tier--commander {
  margin-bottom: 52px;
}

.tier__label {
  display: block;
  text-align: center;
  font-size: 10px;
  letter-spacing: 0.28em;
  color: var(--color-text-300);
  margin-bottom: 22px;
  position: relative;
  z-index: 1;

  &::before {
    content: "";
    position: absolute;
    left: 50%;
    top: -10px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    transform: translateX(-50%);
    background: var(--color-cyan-400);
    box-shadow: 0 0 10px var(--color-cyan-400);
  }
}

.tier__row {
  display: flex;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
}

/* HQ leads row — 4 across on desktop, 2×2 on tablet, stacked on phones */
.leads-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(12px, 1.6vw, 20px);
  max-width: 1040px;
  margin: 0 auto;

  @media (max-width: 940px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 560px;
  }
  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);
    max-width: 320px;
  }
}

/* Commander, centered under the leads */
.commander-wrap {
  display: flex;
  justify-content: center;
}

/* Country pods — two geographic rows */
.pods {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: clamp(20px, 3vw, 44px);

  & + .pods {
    margin-top: 30px;
  }
}

.pod {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pod__head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--color-text-200);
}

.pod__code {
  font-size: 9.5px;
  letter-spacing: 0.1em;
  color: var(--color-cyan-400);
  padding: 2px 8px;
  border: 1px solid color-mix(in srgb, var(--color-cyan-400) 40%, transparent);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-cyan-400) 10%, transparent);
}

.pod__cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

/* ---- Cards (buttons) ---- */
.hero-card,
.crew-card {
  border: 1px solid var(--color-card-border);
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: center;
}

.hero-card {
  width: min(420px, 92vw);
  padding: 30px 26px 24px;
  border-radius: var(--radius-xl);
  border-color: color-mix(in srgb, var(--accent) 42%, transparent);
  background:
    radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 62%),
    linear-gradient(180deg, rgba(46, 26, 100, 0.6), rgba(18, 9, 42, 0.4));
  box-shadow:
    0 30px 70px -30px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(183, 148, 246, 0.14);
  transition:
    transform 0.24s var(--ease-power2-out),
    border-color 0.24s var(--ease-power2-out),
    box-shadow 0.24s var(--ease-power2-out);

  @include hover {
    &:hover {
      transform: translateY(-5px);
      border-color: color-mix(in srgb, var(--accent) 70%, transparent);
      box-shadow:
        0 36px 80px -30px rgba(0, 0, 0, 0.95),
        0 0 30px -6px color-mix(in srgb, var(--accent) 45%, transparent);
    }
  }
}

.hero-card__avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
}

.hero-card__halo {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 50%, transparent), transparent 66%);
  opacity: 0.7;
}

.hero-card__ring {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
}

.hero-card__body {
  position: relative;
  display: grid;
  place-items: center;
  width: 98px;
  height: 98px;
  border-radius: 34px 34px 40px 40px;
  border: 1px solid color-mix(in srgb, var(--accent) 65%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent) 24%, transparent), transparent 70%),
    rgba(21, 10, 48, 0.7);
}

.hero-card__visor {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: radial-gradient(circle at 42% 36%, color-mix(in srgb, var(--accent) 62%, #fff 12%), #1a0f3a 78%);
  color: #fff;
  font-family: "Outfit", sans-serif;
  font-weight: 700;
  font-size: 28px;
}

.hero-card__star {
  position: absolute;
  right: 12px;
  bottom: 8px;
  font-size: 16px;
  color: var(--color-orange-400);
  filter: drop-shadow(0 0 6px var(--color-orange-400));
}

.hero-card__name {
  font-size: 24px;
  font-weight: 700;
}

.hero-card__role {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--accent);
  margin-top: 4px;
}

.hero-card__blurb {
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-text-200);
  margin: 12px auto 12px;
  max-width: 42ch;
}

.hero-card__station {
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--color-text-300);
}

.crew-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 24px 16px 18px;
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(46, 26, 100, 0.4), rgba(18, 9, 42, 0.2));
  box-shadow: inset 0 1px 0 rgba(183, 148, 246, 0.1);
  transition:
    transform 0.22s var(--ease-power2-out),
    border-color 0.22s var(--ease-power2-out),
    box-shadow 0.22s var(--ease-power2-out);

  @include hover {
    &:hover {
      transform: translateY(-4px);
      border-color: color-mix(in srgb, var(--accent) 55%, transparent);
      box-shadow: 0 0 26px -8px color-mix(in srgb, var(--accent) 55%, transparent);
    }
  }
}

/* Guardians inside pods — uniform, compact */
.pod__cards .crew-card {
  width: 152px;
  padding: 20px 12px 16px;
}

.crew-card--lead {
  width: auto;
}

.crew-card--cadet {
  width: min(300px, 90vw);
}

.crew-card__avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 78px;
  height: 78px;
  margin-bottom: 10px;
}

.crew-card__halo {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 42%, transparent), transparent 68%);
  opacity: 0.55;
}

.crew-card__body {
  position: relative;
  display: grid;
  place-items: center;
  width: 66px;
  height: 66px;
  border-radius: 24px 24px 28px 28px;
  border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%),
    rgba(21, 10, 48, 0.7);
}

.crew-card__visor {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: radial-gradient(circle at 42% 36%, color-mix(in srgb, var(--accent) 60%, #fff 10%), #1a0f3a 78%);
  color: #fff;
  font-family: "Outfit", sans-serif;
  font-weight: 700;
  font-size: 18px;
}

.crew-card__rank {
  position: absolute;
  bottom: 4px;
  right: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--space-navy);
  background: var(--accent);

  &--cadet {
    opacity: 0.6;
  }
}

.crew-card__name {
  font-weight: 600;
  font-size: 16px;
}

.crew-card__role {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--accent);
}

.crew-card__blurb {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-200);
  margin: 8px 0 10px;
}

.crew-card__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--color-text-200);
  margin-top: auto;
}
</style>
