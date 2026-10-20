<script setup lang="ts">
import { computed } from 'vue';
import { useLinks } from '../composables/useLinks';
import { useReducedMotion } from '../composables/useReducedMotion';
import { useLocale } from '../i18n';
import Icon from './Icon.vue';
defineProps<{ embedded?: boolean }>();
const { openAtlas, openCrew, openSector } = useLinks();
const { t, text } = useLocale();
const { prefersReducedMotion } = useReducedMotion();
const paths = computed(() => [
  { key: 'auditor', icon: 'project', code: '01', accent: 'violet', action: () => openAtlas('01') },
  { key: 'onboarding', icon: 'globe', code: '02', accent: 'gold', action: openCrew },
  { key: 'daily', icon: 'folder', code: '03', accent: 'ice', action: () => openSector('all') },
]);
</script>

<template>
  <section class="start-page" :class="[embedded ? 'start-page--embedded' : 'vph-scroll']">
    <div class="start-page__inner">
      <header class="start-page__heading">
        <div><p class="start-page__eyebrow">VALUE PROTECTION <span aria-hidden="true">/</span> {{ text('FLIGHT PATHS', 'HÀNH TRÌNH') }}</p><component :is="embedded ? 'h2' : 'h1'" class="start-page__title">{{ text('Choose your flight path.', 'Chọn hành trình của bạn.') }}</component><p class="start-page__intro">{{ t('shell.startSubtitle') }}</p></div>
        <svg class="start-page__compass" viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="50" cy="50" r="36"/><ellipse cx="50" cy="50" rx="49" ry="13" transform="rotate(-30 50 50)"/><path d="m50 26 5 20 19 4-19 4-5 20-5-20-19-4 19-4Z"/><circle cx="50" cy="50" r="3"/></svg>
      </header>
      <div class="start-routes">
        <svg class="start-route-line" viewBox="0 0 1200 340" fill="none" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="flight-route-light"><stop stop-color="#c3a1ee" stop-opacity=".06"/><stop offset=".45" stop-color="#d2b98b" stop-opacity=".62"/><stop offset="1" stop-color="#ac9cda" stop-opacity=".1"/></linearGradient></defs>
          <path class="start-route-line__trace" d="M28 248C80 248 65 105 178 102M28 248C165 248 355 10 580 48M28 248C270 320 760 310 1000 128"/>
          <path class="start-route-line__ghost" d="M28 264C290 350 790 337 1138 180"/>
          <circle cx="28" cy="248" r="5" class="start-route-line__origin"/><circle cx="28" cy="248" r="14" class="start-route-line__origin-ring"/>
          <g v-if="!prefersReducedMotion" class="start-route-line__sparks"><circle r="2.5"><animateMotion path="M28 248C80 248 65 105 178 102" dur="2.8s" begin=".2s" repeatCount="1" fill="freeze"/></circle><circle r="2"><animateMotion path="M28 248C165 248 355 10 580 48" dur="3.4s" begin=".35s" repeatCount="1" fill="freeze"/></circle><circle r="2.5"><animateMotion path="M28 248C270 320 760 310 1000 128" dur="3.8s" begin=".5s" repeatCount="1" fill="freeze"/></circle></g>
          <path class="start-route-line__star" d="M371 103v10m-5-5h10M877 269v8m-4-4h8M1077 67v8m-4-4h8"/>
        </svg>
        <article v-for="path in paths" :key="path.key" class="start-station" :class="'start-station--' + path.accent">
          <div class="start-station__orbit" aria-hidden="true"><span class="start-station__halo"></span><span class="start-station__moon"></span><span class="start-station__sphere"><Icon :name="path.icon" :size="26" /></span><span class="start-station__ground"></span></div>
          <div class="start-station__content"><p class="start-station__code">{{ text('FLIGHT PATH', 'HÀNH TRÌNH') }} <span>{{ path.code }}</span></p><h2>{{ t('shell.' + path.key) }}</h2><p class="start-station__body">{{ t('shell.' + path.key + 'Description') }}</p><button type="button" class="start-station__action" @click="path.action"><span>{{ t('shell.' + path.key + 'Action') }}</span><i aria-hidden="true"><Icon name="arrowRight" :size="15" /></i></button></div>
        </article>
      </div>
      <p class="start-page__note"><span aria-hidden="true"></span>{{ text('Choose any route. Each leads into the same connected protection system.', 'Chọn bất kỳ hành trình nào. Mỗi lối vào đều kết nối cùng hệ thống bảo vệ giá trị.') }}</p>
    </div>
  </section>
</template>

<style scoped>
.start-page { height:100%; overflow:auto; overscroll-behavior:contain; background:radial-gradient(ellipse at 66% 47%,rgb(109 67 158 / .1),transparent 63%); }
.start-page--embedded { height:auto; overflow:visible; }
.start-page--embedded .start-page__inner { padding-top:0; padding-bottom:0; }
.start-page__inner { width:100%; max-width:1380px; margin:auto; padding:28px clamp(24px,4.4vw,64px) 24px; }
.start-page__heading { display:flex; justify-content:space-between; align-items:center; gap:36px; }
.start-page__heading>div { max-width:720px; }
.start-page__eyebrow { display:flex; align-items:center; flex-wrap:wrap; gap:9px; color:var(--color-cyan-400); font-size:9px; line-height:1.5; letter-spacing:.2em; margin-bottom:12px; }
.start-page__eyebrow>span { color:var(--color-text-200); opacity:.5; }
.start-page__title { margin:0; color:var(--color-text-400); font-size:clamp(29px,3.1vw,43px); font-weight:600; line-height:1.15; letter-spacing:-.04em; text-wrap:balance; }
.start-page__intro { max-width:61ch; margin-top:12px; color:var(--color-text-300); font-size:14px; line-height:1.65; }
.start-page__compass { width:90px; height:90px; margin-right:18px; flex:none; stroke:#b79bd8; stroke-width:.65; opacity:.46; transform:rotate(8deg); }.start-page__compass path { fill:rgb(187 155 216 / .1); }.start-page__compass>circle:last-child { fill:#d6be80; stroke:none; }
.start-routes { position:relative; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:clamp(18px,3vw,42px); align-items:start; padding:10px 12px 0 34px; margin-top:18px; }
.start-route-line { position:absolute; inset:0; width:100%; height:340px; pointer-events:none; overflow:visible; }
.start-route-line__trace { stroke:url(#flight-route-light); stroke-width:1.15; }.start-route-line__ghost { stroke:#bca0dd; stroke-width:.65; stroke-opacity:.13; stroke-dasharray:2 8; }.start-route-line__origin { fill:#bea0dd; }.start-route-line__origin-ring { stroke:#b79bda; stroke-opacity:.23; }.start-route-line__sparks { fill:#e4c78c; filter:drop-shadow(0 0 4px #cfae83); }.start-route-line__star { stroke:#baa1dc; stroke-opacity:.42; stroke-width:.7; }
.start-station { --station-accent:#bfa0ed; position:relative; min-width:0; margin-top:48px; padding:0 20px 20px; border-radius:12px; }
.start-station:before { content:''; position:absolute; inset:58px 0 0; border:1px solid color-mix(in srgb,var(--station-accent) 18%,transparent); border-top-color:color-mix(in srgb,var(--station-accent) 36%,transparent); border-radius:10px; background:linear-gradient(145deg,color-mix(in srgb,var(--station-accent) 7%,transparent),rgb(16 9 34 / .75) 66%); box-shadow:inset 0 1px rgb(255 255 255 / .035),0 16px 40px -30px #05020d; transform:perspective(1000px) rotateY(-5deg); transform-origin:left center; transition:transform .45s cubic-bezier(.22,.7,.2,1),border-color .45s cubic-bezier(.22,.7,.2,1); }
.start-station--gold { --station-accent:#d9bd83; margin-top:0; }.start-station--gold:before { transform:perspective(1000px) rotateY(4deg); }.start-station--ice { --station-accent:#a5b9da; margin-top:78px; }.start-station--ice:before { transform:perspective(1000px) rotateY(-5deg); }
.start-station__orbit { position:relative; width:90px; height:92px; margin:0 0 10px 4px; display:grid; place-items:center; color:var(--station-accent); }
.start-station__sphere { position:relative; width:64px; height:64px; display:grid; place-items:center; border-radius:50%; border:1px solid color-mix(in srgb,var(--station-accent) 55%,transparent); color:#efe7ff; background:radial-gradient(circle at 29% 22%,color-mix(in srgb,var(--station-accent) 49%,#27213a),#302344 47%,#100b20 82%); box-shadow:inset -9px -10px 16px rgb(4 3 12 / .65),inset 1px 2px 6px color-mix(in srgb,var(--station-accent) 30%,transparent),0 0 22px color-mix(in srgb,var(--station-accent) 10%,transparent); transform:translateY(-2px); transition:transform .45s cubic-bezier(.22,.7,.2,1); }
.start-station__sphere:before { content:''; position:absolute; inset:6px; border:1px solid color-mix(in srgb,var(--station-accent) 14%,transparent); border-radius:50%; }.start-station__sphere :deep(svg) { filter:drop-shadow(0 1px 3px rgb(0 0 0 / .4)); opacity:.9; }
.start-station__halo { position:absolute; inset:16px -4px; border:1px solid color-mix(in srgb,var(--station-accent) 28%,transparent); border-radius:50%; transform:rotate(-28deg); }
.start-station__moon { position:absolute; top:10px; right:7px; width:6px; height:6px; border-radius:50%; background:var(--station-accent); box-shadow:0 0 11px color-mix(in srgb,var(--station-accent) 55%,transparent); }
.start-station__ground { position:absolute; bottom:1px; left:4px; right:4px; height:12px; border-radius:50%; border:1px solid color-mix(in srgb,var(--station-accent) 16%,transparent); background:radial-gradient(ellipse,color-mix(in srgb,var(--station-accent) 16%,transparent),transparent 69%); }
.start-station__content { position:relative; display:flex; flex-direction:column; align-items:flex-start; min-height:208px; }
.start-station__code { display:flex; align-items:center; gap:7px; margin-bottom:10px; color:var(--station-accent); font-size:8px; letter-spacing:.18em; line-height:1.5; }.start-station__code>span { opacity:.55; font-variant-numeric:tabular-nums; }
h2 { margin:0 0 10px; color:var(--color-text-400); font-size:21px; font-weight:500; line-height:1.3; letter-spacing:-.035em; text-wrap:balance; }
.start-station__body { flex:1; margin-bottom:18px; color:var(--color-text-300); font-size:14px; line-height:1.65; max-width:40ch; }
.start-station__action { width:100%; min-height:44px; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 0 0; border:0; border-top:1px solid color-mix(in srgb,var(--station-accent) 18%,transparent); background:transparent; color:var(--color-text-400); font-size:12px; line-height:1.5; text-align:left; cursor:pointer; }.start-station__action>span { max-width:25ch; }.start-station__action>i { width:28px; height:28px; display:grid; place-items:center; flex:none; color:var(--station-accent); border:1px solid color-mix(in srgb,var(--station-accent) 25%,transparent); border-radius:50%; transition:transform .3s cubic-bezier(.22,.7,.2,1),background .3s; }
.start-station__action:hover>i { transform:translateX(3px); background:color-mix(in srgb,var(--station-accent) 12%,transparent); }.start-station__action:active>i { transform:translateX(3px) scale(.94); }.start-station__action:focus-visible { outline:2px solid #d9bd83; outline-offset:5px; border-radius:3px; }
.start-page__note { display:flex; align-items:center; gap:8px; color:var(--color-text-200); font-size:10px; line-height:1.6; margin:20px 0 0 34px; }.start-page__note>span { width:4px; height:4px; border-radius:50%; background:#b79bd8; flex:none; }
@media(hover:hover) { .start-station:hover:before { transform:perspective(1000px) rotateY(0deg) translateY(-3px); border-color:color-mix(in srgb,var(--station-accent) 38%,transparent); }.start-station:hover .start-station__sphere { transform:translateY(-7px); } }
@media(max-width:1100px) { .start-page__inner { padding:24px 28px; }.start-routes { gap:20px; padding-left:12px; }.start-station { padding-left:16px; padding-right:16px; }.start-station__body { font-size:13px; }.start-station__content { min-height:228px; }h2 { font-size:19px; }.start-page__note { margin-left:12px; } }
@media(max-width:900px) { .start-page__heading { gap:20px; }.start-page__compass { width:64px; height:64px; margin-right:0; }.start-routes { grid-template-columns:minmax(0,1fr); gap:22px; margin-top:26px; padding:0; }.start-route-line { display:none; }.start-station,.start-station--gold,.start-station--ice { display:grid; grid-template-columns:82px minmax(0,1fr); gap:18px; margin-top:0; padding:16px 20px 16px 8px; }.start-station:before { inset:0 0 0 44px; transform:none; }.start-station__orbit { margin:0; width:82px; height:92px; align-self:start; }.start-station__content { min-height:0; }.start-station__body { max-width:64ch; margin-bottom:12px; font-size:14px; }.start-station__code { margin-bottom:7px; }.start-station__action { width:auto; gap:20px; padding-top:8px; }.start-page__note { margin-left:0; margin-top:20px; } }
@media(max-width:540px) { .start-page__inner { padding:20px 18px; }.start-page__compass { display:none; }.start-page__eyebrow { font-size:8px; gap:7px; letter-spacing:.14em; }h1 { font-size:29px; }.start-page__intro { font-size:13px; }.start-station,.start-station--gold,.start-station--ice { grid-template-columns:58px minmax(0,1fr); gap:14px; padding:14px 14px 14px 0; }.start-station:before { left:24px; }.start-station__orbit { width:58px; height:72px; }.start-station__sphere { width:46px; height:46px; }.start-station__sphere :deep(svg) { width:20px; height:20px; }.start-station__halo { inset:15px -1px; }.start-station__ground { height:8px; bottom:2px; }.start-station__moon { width:4px; height:4px; top:9px; right:0; }.start-station__body { font-size:13px; line-height:1.65; }h2 { font-size:18px; }.start-page__note { font-size:10px; align-items:flex-start; }.start-page__note>span { margin-top:6px; } }
@media(prefers-reduced-motion:reduce) { .start-station:before,.start-station__sphere,.start-station__action>i { transition:none; }.start-route-line__sparks { display:none; } }
</style>
