<script setup lang="ts">
import { crew } from "../data/crew";
</script>

<template>
  <section id="crew" class="crew">
    <div class="crew__head">
      <span class="crew__rule"></span>
      <span class="crew__eyebrow mono">GUARDIAN FLEET CREW</span>
      <span class="crew__rule"></span>
    </div>
    <p class="crew__lead">The value-protection crew — commanders, sector leads, and market guardians across the universe.</p>

    <div class="crew__grid">
      <article v-for="member in crew" :key="member.name" class="crew__card" :style="{ '--accent': member.accent }">
        <div class="crew__avatar">
          <span class="crew__avatar-glow"></span>
          <span class="crew__avatar-initial">{{ member.name.charAt(0) }}</span>
          <span class="crew__rank" :class="`crew__rank--${member.rank}`"></span>
        </div>
        <div class="crew__name">{{ member.name }}</div>
        <div class="crew__role mono">{{ member.roleShort }}</div>
        <div class="crew__market mono">{{ member.clearance }}</div>
      </article>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.crew {
  position: relative;
  z-index: 1;
  max-width: 1520px;
  margin: 0 auto;
  padding: 0 clamp(20px, 4vw, 52px) 72px;
}

.crew__head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.crew__rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(176, 160, 210, 0.4), transparent);
}

.crew__eyebrow {
  font-size: 10px;
  letter-spacing: 0.24em;
  color: var(--color-text-200);
}

.crew__lead {
  text-align: center;
  font-size: 14px;
  color: var(--color-text-200);
  max-width: 60ch;
  margin: 0 auto 28px;
}

.crew__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 560px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.crew__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 20px 12px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-card-border);
  background: linear-gradient(180deg, rgba(30, 16, 66, 0.34), rgba(21, 10, 48, 0.14));
  transition:
    transform 0.22s var(--ease-power2-out),
    border-color 0.22s var(--ease-power2-out);

  @include hover {
    &:hover {
      transform: translateY(-3px);
      border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    }
  }
}

.crew__avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  margin-bottom: 10px;
  border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
  background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--accent) 30%, transparent), rgba(21, 10, 48, 0.6) 70%);
}

.crew__avatar-glow {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 40%, transparent), transparent 70%);
  opacity: 0.5;
}

.crew__avatar-initial {
  position: relative;
  font-family: var(--font-display, "Outfit");
  font-weight: 700;
  font-size: 24px;
  color: #fff;
}

.crew__rank {
  position: absolute;
  bottom: 2px;
  right: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #150a30;
  background: var(--accent);

  &--commander {
    box-shadow: 0 0 8px var(--accent);
  }
  &--cadet {
    opacity: 0.6;
  }
}

.crew__name {
  font-weight: 600;
  font-size: 15px;
}

.crew__role {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--accent);
}

.crew__market {
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--color-text-200);
}
</style>
