<script setup lang="ts">
const missions = [
  {
    code: "01 · CORE",
    title: "Protect the core",
    desc: "Planet Intrepid holds the critical assets, systems, and control knowledge worth securing.",
    accent: "#4FD9FF",
  },
  {
    code: "02 · FLEET",
    title: "Navigate the fleet",
    desc: "Eight guardian starfighters orbit the core — each a work domain you can navigate into.",
    accent: "#FF9D1E",
  },
  {
    code: "03 · SCAN",
    title: "Scan the vaults",
    desc: "The command scanner retrieves any tracker, SOP, template, or dashboard across the universe.",
    accent: "#8EDAB2",
  },
];
</script>

<template>
  <section id="mission" class="mission">
    <div class="mission__head">
      <span class="mission__rule"></span>
      <span class="mission__eyebrow mono">MISSION BRIEF</span>
      <span class="mission__rule"></span>
    </div>
    <div class="mission__grid">
      <article v-for="m in missions" :key="m.code" class="mission__card" :style="{ '--accent': m.accent }">
        <span class="mission__bar"></span>
        <span class="mission__code mono">{{ m.code }}</span>
        <h3 class="mission__title">{{ m.title }}</h3>
        <p class="mission__desc">{{ m.desc }}</p>
      </article>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.mission {
  position: relative;
  z-index: 1;
  max-width: 1520px;
  margin: 0 auto;
  padding: 8px clamp(20px, 4vw, 52px) 64px;
}

.mission__head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.mission__rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(79, 217, 255, 0.28), transparent);
}

.mission__eyebrow {
  font-size: 10px;
  letter-spacing: 0.24em;
  color: var(--color-text-200);
}

.mission__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
}

.mission__card {
  position: relative;
  overflow: hidden;
  padding: 20px 22px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-card-border);
  background: linear-gradient(180deg, rgba(11, 29, 74, 0.34), rgba(7, 22, 51, 0.16));
}

.mission__bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent);
}

.mission__code {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--accent);
}

.mission__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 8px 0 6px;
}

.mission__desc {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--color-text-200);
}
</style>
