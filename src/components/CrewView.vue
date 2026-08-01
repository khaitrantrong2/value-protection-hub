<script setup lang="ts">
import { computed } from "vue";
import { crew } from "../data/crew";

const commander = computed(() => crew.find((m) => m.rank === "commander") ?? null);
const leads = computed(() => crew.filter((m) => m.rank === "lead"));
const guardians = computed(() => crew.filter((m) => m.rank === "guardian"));
const cadets = computed(() => crew.filter((m) => m.rank === "cadet"));
</script>

<template>
  <section class="crewpage">
    <div class="crewpage__scroll vph-scroll">
      <header class="crewpage__header">
        <p class="crewpage__eyebrow mono">INTREPID UNIVERSE</p>
        <h1 class="crewpage__title">The Guardian Formation</h1>
        <p class="crewpage__lead">
          The crew protecting value across the Intrepid galaxy — one commander, the control leads, and the market
          guardians holding every sector line.
        </p>
      </header>

      <div class="crewpage__spine">
        <!-- Commander (apex) -->
        <div class="tier tier--apex">
          <span class="tier__label mono">COMMAND</span>
          <article v-if="commander" class="hero-card" :style="{ '--accent': commander.accent }">
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
          </article>
        </div>

        <!-- Control leads -->
        <div class="tier">
          <span class="tier__label mono">CONTROL LEADS</span>
          <div class="tier__row tier__row--leads">
            <article v-for="m in leads" :key="m.name" class="crew-card crew-card--lead" :style="{ '--accent': m.accent }">
              <div class="crew-card__avatar">
                <span class="crew-card__halo"></span>
                <span class="crew-card__body"><span class="crew-card__visor">{{ m.name.charAt(0) }}</span></span>
                <span class="crew-card__rank"></span>
              </div>
              <div class="crew-card__name">{{ m.name }}</div>
              <div class="crew-card__role mono">{{ m.roleShort }}</div>
              <p class="crew-card__blurb">{{ m.blurb }}</p>
              <div class="crew-card__meta mono"><span>{{ m.station }}</span><span>{{ m.clearance }}</span></div>
            </article>
          </div>
        </div>

        <!-- Market guardians -->
        <div class="tier">
          <span class="tier__label mono">MARKET GUARDIANS</span>
          <div class="tier__grid">
            <article v-for="m in guardians" :key="m.name" class="crew-card" :style="{ '--accent': m.accent }">
              <div class="crew-card__avatar">
                <span class="crew-card__halo"></span>
                <span class="crew-card__body"><span class="crew-card__visor">{{ m.name.charAt(0) }}</span></span>
                <span class="crew-card__rank"></span>
              </div>
              <div class="crew-card__name">{{ m.name }}</div>
              <div class="crew-card__role mono">{{ m.roleShort }}</div>
              <div class="crew-card__meta mono"><span>{{ m.market }}</span><span>{{ m.clearance }}</span></div>
            </article>
          </div>
        </div>

        <!-- Cadet -->
        <div v-if="cadets.length" class="tier tier--cadet">
          <span class="tier__label mono">CADET CORPS</span>
          <div class="tier__row">
            <article v-for="m in cadets" :key="m.name" class="crew-card crew-card--cadet" :style="{ '--accent': m.accent }">
              <div class="crew-card__avatar">
                <span class="crew-card__halo"></span>
                <span class="crew-card__body"><span class="crew-card__visor">{{ m.name.charAt(0) }}</span></span>
                <span class="crew-card__rank crew-card__rank--cadet"></span>
              </div>
              <div class="crew-card__name">{{ m.name }}</div>
              <div class="crew-card__role mono">{{ m.roleShort }}</div>
              <p class="crew-card__blurb">{{ m.blurb }}</p>
            </article>
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
  max-width: 62ch;
  margin: 0 auto;
  text-wrap: pretty;
}

/* Command spine — a glowing vertical line the formation hangs from */
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

.tier__row--leads {
  gap: 24px;
}

.tier__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 720px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ---- Featured commander card ---- */
.hero-card {
  width: min(420px, 92vw);
  margin: 0 auto;
  text-align: center;
  padding: 30px 26px 24px;
  border-radius: var(--radius-xl);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  background:
    radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 62%),
    linear-gradient(180deg, rgba(42, 24, 92, 0.5), rgba(21, 10, 48, 0.3));
  box-shadow: 0 30px 70px -30px rgba(0, 0, 0, 0.85);
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

/* ---- Standard crew card ---- */
.crew-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  padding: 24px 16px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-card-border);
  background: linear-gradient(180deg, rgba(42, 24, 92, 0.32), rgba(21, 10, 48, 0.14));
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

.crew-card--lead {
  width: min(320px, 90vw);
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
