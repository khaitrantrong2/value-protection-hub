<script setup lang="ts">
import { computed } from "vue";
import { useLinks } from "../composables/useLinks";
import { portfolioFor } from "../data/memberPortfolios";

const { selectedMember, openCrew } = useLinks();

const member = computed(() => selectedMember.value);
const scope = computed(() => (member.value ? portfolioFor(member.value) : []));

const stats = computed(() => {
  const rows = scope.value;
  const platforms = new Set<string>();
  rows.forEach((r) => r.platforms.forEach((p) => platforms.add(p)));
  return {
    brands: rows.length,
    exceptional: rows.filter((r) => /exceptional/i.test(r.stream)).length,
    platforms: platforms.size,
  };
});
</script>

<template>
  <section class="member">
    <div class="member__scroll vph-scroll">
      <nav class="member__crumb mono">
        <button type="button" @click="openCrew">Crew</button>
        <span>›</span>
        <span class="member__crumb-here">{{ member?.name || "Value Protector" }}</span>
      </nav>

      <template v-if="member">
        <header class="member__header" :style="{ '--accent': member.accent }">
          <span class="member__blob"></span>
          <div class="member__avatar">
            <span class="member__halo"></span>
            <span class="member__body"><span class="member__visor">{{ member.name.charAt(0) }}</span></span>
          </div>
          <div class="member__id">
            <p class="member__role mono">{{ member.roleShort }} · {{ member.clearance }}</p>
            <h1 class="member__name">{{ member.name }}</h1>
            <p class="member__blurb">{{ member.blurb }}</p>
            <div class="member__tags mono">
              <span>{{ member.station }}</span>
              <span class="member__sep">·</span>
              <span>{{ member.market }}</span>
            </div>
          </div>
          <div class="member__stats">
            <div class="member__stat"><div class="member__stat-num mono">{{ stats.brands }}</div><div class="member__stat-label mono">BRANDS</div></div>
            <div class="member__stat"><div class="member__stat-num member__stat-num--exc mono">{{ stats.exceptional }}</div><div class="member__stat-label mono">EXCEPTIONAL</div></div>
            <div class="member__stat"><div class="member__stat-num mono">{{ stats.platforms }}</div><div class="member__stat-label mono">PLATFORMS</div></div>
          </div>
        </header>

        <div class="member__section-head">
          <span class="member__rule"></span>
          <span class="member__section-label mono">ASSIGNED SCOPE · CLAIMBACK PORTFOLIO</span>
          <span class="member__rule"></span>
        </div>

        <div class="member__table-wrap">
          <table class="member__table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Brand</th>
                <th>Class</th>
                <th>Stream</th>
                <th>In-Scope Platforms</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in scope" :key="i">
                <td class="member__td-country mono">{{ row.country }}</td>
                <td class="member__td-brand">{{ row.brand }}</td>
                <td>{{ row.class }}</td>
                <td>
                  <span class="member__stream" :class="/exceptional/i.test(row.stream) ? 'is-exc' : 'is-std'">{{ row.stream }}</span>
                </td>
                <td>
                  <span class="member__plats">
                    <span v-for="p in row.platforms" :key="p" class="member__plat mono">{{ p }}</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="member__note mono">
          Sample scope shown — live per-member data loads from the private Google Sheet once configured.
        </p>
      </template>

      <p v-else class="member__empty">No protector selected. Return to the crew formation.</p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.member {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: hidden;
}

.member__scroll {
  height: 100%;
  overflow-y: auto;
  max-width: 1160px;
  margin: 0 auto;
  padding: clamp(16px, 2.5vh, 28px) clamp(20px, 4vw, 52px) 64px;
}

.member__crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--color-text-200);
  margin-bottom: 18px;

  button {
    background: none;
    border: none;
    color: var(--color-cyan-400);
    cursor: pointer;
    font: inherit;

    @include hover {
      &:hover {
        color: #fff;
      }
    }
  }
}

.member__crumb-here {
  color: var(--color-text-300);
}

.member__header {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: clamp(20px, 2.4vw, 30px) clamp(22px, 2.6vw, 34px);
  border-radius: var(--radius-xl);
  border: 1px solid color-mix(in srgb, var(--accent) 34%, transparent);
  background:
    radial-gradient(120% 90% at 12% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%),
    linear-gradient(135deg, rgba(42, 24, 92, 0.55), rgba(21, 10, 48, 0.32));
  margin-bottom: 30px;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
}

.member__blob {
  position: absolute;
  right: -60px;
  top: -70px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent), transparent 66%);
  opacity: 0.14;
  pointer-events: none;
}

.member__avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  flex: none;
}

.member__halo {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 46%, transparent), transparent 66%);
  opacity: 0.7;
}

.member__body {
  position: relative;
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  border-radius: 30px 30px 36px 36px;
  border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent) 24%, transparent), transparent 70%),
    rgba(21, 10, 48, 0.7);
}

.member__visor {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: radial-gradient(circle at 42% 36%, color-mix(in srgb, var(--accent) 62%, #fff 12%), #1a0f3a 78%);
  color: #fff;
  font-family: "Outfit", sans-serif;
  font-weight: 700;
  font-size: 26px;
}

.member__id {
  flex: 1;
  min-width: 0;
}

.member__role {
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--accent);
}

.member__name {
  font-size: clamp(26px, 3.4vw, 40px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
  margin: 6px 0 8px;
}

.member__blurb {
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-text-200);
  max-width: 64ch;
}

.member__tags {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--color-text-300);
  margin-top: 12px;
}

.member__sep {
  opacity: 0.5;
}

.member__stats {
  display: flex;
  gap: 12px;
  flex: none;
}

.member__stat {
  text-align: center;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid var(--color-command-border);
  background: rgba(21, 10, 48, 0.4);
}

.member__stat-num {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-cyan-400);
  line-height: 1;

  &--exc {
    color: var(--color-orange-400);
  }
}

.member__stat-label {
  font-size: 8.5px;
  letter-spacing: 0.14em;
  color: var(--color-text-200);
  margin-top: 6px;
}

.member__section-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.member__rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(183, 148, 246, 0.32), transparent);
}

.member__section-label {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--color-text-300);
}

.member__table-wrap {
  overflow-x: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-card-border);
  background: linear-gradient(180deg, rgba(42, 24, 92, 0.24), rgba(21, 10, 48, 0.12));
}

.member__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    text-align: left;
    font-family: "Outfit", sans-serif;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.02em;
    color: #efe6ff;
    padding: 12px 16px;
    background: linear-gradient(180deg, rgba(124, 58, 237, 0.35), rgba(109, 40, 217, 0.18));
    border-bottom: 1px solid rgba(183, 148, 246, 0.24);
    white-space: nowrap;
  }

  td {
    padding: 11px 16px;
    color: var(--color-text-300);
    border-bottom: 1px solid rgba(176, 160, 210, 0.1);
  }

  tbody tr:hover td {
    background: rgba(124, 58, 237, 0.08);
  }
}

.member__td-country {
  color: var(--color-text-200);
}

.member__td-brand {
  color: #fff;
  font-weight: 600;
}

.member__stream {
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 10.5px;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-command-border);

  &.is-exc {
    color: #ffd479;
    border-color: rgba(245, 197, 66, 0.4);
  }
  &.is-std {
    color: var(--color-text-200);
  }
}

.member__plats {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 5px;
}

.member__plat {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(176, 160, 210, 0.12);
  color: #d8cdf0;
}

.member__note {
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--color-text-200);
  margin-top: 16px;
}

.member__empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--color-text-200);
}
</style>
