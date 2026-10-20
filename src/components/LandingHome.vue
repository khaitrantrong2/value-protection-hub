<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import LandingPlanet from './LandingPlanet.vue';
import GalaxyPlanet from './GalaxyPlanet.vue';
import StarfighterIcon from './StarfighterIcon.vue';
import StartHere from './StartHere.vue';
import { sectors } from '../data/sectors';
import { crew } from '../data/crew';
import { useLinks } from '../composables/useLinks';
import { useLocale } from '../i18n';
import type { FleetHull } from '../services/fleetMotion';

const { openSector, openCrew } = useLinks();
const { text } = useLocale();

const activeCrew = crew.filter(member => member.active !== false).length;
const stageCount = 8;

/** Vault planets — the real resource sectors, laid out as a drifting constellation. */
const VAULT_POS = [
  { x: 22, y: 30, r: 72, surface: 'terrain' }, { x: 50, y: 17, r: 60, surface: 'bands' },
  { x: 78, y: 27, r: 74, surface: 'craters' }, { x: 66, y: 52, r: 54, surface: 'terrain' },
  { x: 86, y: 68, r: 64, surface: 'bands' }, { x: 30, y: 60, r: 58, surface: 'craters' },
  { x: 14, y: 54, r: 48, surface: 'terrain' }, { x: 46, y: 80, r: 46, surface: 'bands' },
  { x: 70, y: 84, r: 52, surface: 'craters' }, { x: 90, y: 44, r: 48, surface: 'terrain' },
] as const;
const vaults = sectors.slice(0, VAULT_POS.length).map((sector, i) => ({ sector, ...VAULT_POS[i] }));

/** Crew squadrons — one representative ship per market/cell; livery is identity, not rank. */
interface Squad { arch: FleetHull; color: string; label: string; x: number; y: number }
const SQUADS: Squad[] = [
  { arch: 'commander', color: '#F5B342', label: 'Regional', x: 50, y: 27 },
  { arch: 'automation', color: '#7DD3FC', label: 'Automation', x: 42, y: 48 },
  { arch: 'guardian', color: '#34D399', label: 'VN', x: 18, y: 30 },
  { arch: 'interceptor', color: '#F59E0B', label: 'TH', x: 28, y: 64 },
  { arch: 'sentinel', color: '#F97316', label: 'ID', x: 52, y: 74 },
  { arch: 'guardian', color: '#38BDF8', label: 'PH', x: 64, y: 46 },
  { arch: 'guardian', color: '#60A5FA', label: 'SG', x: 74, y: 64 },
  { arch: 'battlecruiser', color: '#A78BFA', label: 'MY', x: 82, y: 30 },
];
const SQUAD_EDGES: [number, number][] = [[0, 1], [0, 5], [0, 7], [1, 2], [1, 5], [2, 3], [3, 4], [4, 6], [6, 7], [5, 3], [5, 4]];

const root = ref<HTMLElement | null>(null);
const inner = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const pin = ref<HTMLElement | null>(null);
const planet = ref<HTMLElement | null>(null);
const heroText = ref<HTMLElement | null>(null);
const missionText = ref<HTMLElement | null>(null);
const links = ref<SVGSVGElement | null>(null);
const enhanced = ref(false);

let lenis: Lenis | undefined;
const triggers: ScrollTrigger[] = [];
let tickerFn: ((t: number) => void) | undefined;
let motionContext: gsap.Context | undefined;
let wideQuery: MediaQueryList | undefined;
let reducedQuery: MediaQueryList | undefined;
let resizeObserver: ResizeObserver | undefined;
let motionReady = Promise.resolve();
let disposed = false, motionGeneration = 0, scrollGeneration = 0, layoutFrame = 0;

function squadStyle(s: Squad) { return { left: s.x + '%', top: s.y + '%', '--lv': s.color }; }
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function setVH() { if (root.value) root.value.style.setProperty('--lh-vh', root.value.clientHeight + 'px'); }

function layoutLines() {
  const svg = links.value, host = inner.value?.querySelector('.lh-fleet') as HTMLElement | null;
  if (!svg || !host) return;
  const W = host.clientWidth, H = host.clientHeight;
  svg.querySelectorAll<SVGLineElement>('line').forEach((ln, i) => {
    const [a, b] = SQUAD_EDGES[i];
    const x1 = SQUADS[a].x / 100 * W, y1 = SQUADS[a].y / 100 * H, x2 = SQUADS[b].x / 100 * W, y2 = SQUADS[b].y / 100 * H;
    ln.setAttribute('x1', String(x1)); ln.setAttribute('y1', String(y1)); ln.setAttribute('x2', String(x2)); ln.setAttribute('y2', String(y2));
    const len = Math.hypot(x2 - x1, y2 - y1); ln.dataset.len = String(len); ln.style.strokeDasharray = String(len);
    ln.style.strokeDashoffset = ln.dataset.drawn === '1' ? '0' : String(len);
  });
}

/** Drive the persistent planet from Hero centre to Mission right as the stage scrolls. */
function applyFrame(p: number) {
  const pv = pin.value, pl = planet.value, ht = heroText.value, mt = missionText.value;
  if (!pv || !pl) return;
  const W = pv.clientWidth;
  const e = easeInOut(Math.min(1, p / 0.7));
  const dx = e * (W * 0.26);
  const scale = 1 - e * 0.4;
  pl.style.transform = `translate(${dx}px,0) scale(${scale})`;
  if (ht) {
    const out = Math.min(1, p / 0.4);
    ht.style.opacity = String(1 - out);
    ht.style.transform = `translateY(${-28 * out}px)`;
  }
  if (mt) {
    const mp = Math.max(0, Math.min(1, (p - 0.32) / 0.4));
    mt.style.opacity = String(mp);
    mt.style.transform = `translate(${(1 - mp) * -24}px,-50%)`;
  }
}

function settleStatic() {
  // Reduced-motion / fallback: everything visible, planet at Hero rest.
  if (planet.value) planet.value.style.transform = 'none';
  if (heroText.value) { heroText.value.style.opacity = '1'; heroText.value.style.transform = 'none'; }
  if (missionText.value) { missionText.value.style.opacity = '1'; missionText.value.style.transform = 'none'; }
  inner.value?.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
  inner.value?.querySelectorAll<HTMLElement>('[data-rule]').forEach(el => { el.style.width = '220px'; });
  inner.value?.querySelectorAll<HTMLElement>('.lh-ship').forEach(el => { el.style.opacity = '1'; });
  inner.value?.querySelectorAll<HTMLElement>('.lh-node').forEach(el => { el.style.opacity = '.7'; });
  links.value?.querySelectorAll<SVGLineElement>('line').forEach(ln => { ln.dataset.drawn = '1'; ln.style.strokeDashoffset = '0'; });
}

function scrollToStart() {
  const target = inner.value?.querySelector('#landing-start-here') as HTMLElement | null;
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { offset: -20, immediate: true });
  else root.value?.scrollTo({ top: target.offsetTop - 20, behavior: 'auto' });
}
async function maybeScrollStart() {
  const request = ++scrollGeneration;
  if (window.location.hash !== '#start') return;
  await motionReady;
  await nextTick();
  await document.fonts?.ready;
  if (disposed || request !== scrollGeneration || window.location.hash !== '#start') return;
  lenis?.resize();
  triggers.forEach(trigger => trigger.refresh());
  scrollToStart();
}

function handleLandingHash() {
  if (window.location.hash === '#home') {
    scrollGeneration++;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else root.value?.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }
  void maybeScrollStart();
}

function clearMotion() {
  triggers.splice(0).forEach(trigger => trigger.kill());
  motionContext?.revert();
  motionContext = undefined;
  if (tickerFn) gsap.ticker.remove(tickerFn);
  tickerFn = undefined;
  lenis?.destroy();
  lenis = undefined;
}

async function configureMotion() {
  const generation = ++motionGeneration;
  clearMotion();
  setVH();
  layoutLines();
  enhanced.value = !!wideQuery?.matches && !reducedQuery?.matches;
  await nextTick(); // Sticky-stage geometry must exist before ScrollTrigger measures it.
  if (disposed || generation !== motionGeneration) return;
  if (!enhanced.value || !root.value || !inner.value) { settleStatic(); return; }
  const scroller = root.value, content = inner.value;

  motionContext = gsap.context(() => {
  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ wrapper: scroller, content, duration: 1.3, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  tickerFn = (t: number) => lenis!.raf(t * 1000);
  gsap.ticker.add(tickerFn);
  const add = (t: ScrollTrigger) => { triggers.push(t); return t; };

  // Hero intro
  if (heroText.value) gsap.from(heroText.value.children, { opacity: 0, y: 18, duration: 1, stagger: .12, ease: 'power3.out' });

  // Persistent planet: Hero → Mission scrubbed transition
  if (stage.value && missionText.value) {
    missionText.value.style.opacity = '0';
    const transition = add(ScrollTrigger.create({ scroller, trigger: stage.value, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: self => applyFrame(self.progress) }));
    applyFrame(transition.progress);
  }

  // Section reveals
  content.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => {
    add(ScrollTrigger.create({ scroller, trigger: el, start: 'top 86%', once: true, onEnter: () => motionContext?.add(() => gsap.from(el, { opacity: 0, y: 42, duration: 1.1, ease: 'power3.out' })) }));
  });
  content.querySelectorAll<HTMLElement>('[data-rule]').forEach(el => {
    add(ScrollTrigger.create({ scroller, trigger: el, start: 'top 90%', once: true, onEnter: () => motionContext?.add(() => gsap.fromTo(el, { width: 0 }, { width: 220, duration: 1, ease: 'power2.out' })) }));
  });
  add(ScrollTrigger.create({ scroller, trigger: '.lh-vaults', start: 'top 72%', once: true,
    onEnter: () => motionContext?.add(() => gsap.from('.lh-vault', { opacity: 0, scale: .3, duration: 1, ease: 'back.out(1.6)', stagger: { each: .1, from: 'random' } })) }));

  // Crew constellation muster
  const ships = gsap.utils.toArray<HTMLElement>('.lh-ship');
  const nodes = gsap.utils.toArray<HTMLElement>('.lh-node');
  const lineEls = links.value ? Array.from(links.value.querySelectorAll<SVGLineElement>('line')) : [];
  add(ScrollTrigger.create({ scroller, trigger: '.lh-fleet', start: 'top 74%', once: true, onEnter: () => motionContext?.add(() => {
    layoutLines();
    ships.forEach(el => {
      const nx = +el.dataset.x!, ny = +el.dataset.y!;
      gsap.set(el, { left: (50 + (nx - 50) * 1.8) + '%', top: (50 + (ny - 50) * 1.8) + '%', opacity: 0, scale: .55 });
    });
    gsap.set(nodes, { opacity: 0, scale: .4 });
    lineEls.forEach(ln => gsap.set(ln, { strokeDashoffset: Number(ln.dataset.len) }));
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    ships.forEach((el, i) => {
      const at = i * .24;
      tl.to(el, { opacity: 1, duration: .6 }, at)
        .to(el, { left: el.dataset.x + '%', top: el.dataset.y + '%', scale: 1, duration: 1.6, ease: 'power3.out' }, at);
      tl.to(nodes[i], { opacity: 1, scale: 1, duration: 1, ease: 'sine.out' }, at + 1.05);
    });
    const linesAt = SQUADS.length * .24 + .2;
    tl.to(lineEls, { strokeDashoffset: 0, duration: 1.5, ease: 'power1.inOut', stagger: .13, onComplete: () => lineEls.forEach(ln => ln.dataset.drawn = '1') }, linesAt);
    tl.add(() => motionContext?.add(() => {
      gsap.to('.lh-ship .lh-hull', { y: '+=7', duration: 3.8, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: { each: .3, from: 'random' } });
      gsap.to('.lh-node', { scale: 1.12, opacity: .85, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: { each: .35, from: 'random' } });
    }));
  }) }));

  }, scroller);
}

function refreshLayout() {
  setVH();
  layoutLines();
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(() => {
    if (disposed) return;
    lenis?.resize();
    triggers.forEach(trigger => trigger.refresh());
  });
}

function reconfigureMotion() {
  motionReady = configureMotion();
  void motionReady.then(maybeScrollStart);
}

onMounted(async () => {
  wideQuery = window.matchMedia('(min-width: 901px)');
  reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  wideQuery.addEventListener('change', reconfigureMotion);
  reducedQuery.addEventListener('change', reconfigureMotion);
  window.addEventListener('resize', refreshLayout);
  window.addEventListener('hashchange', handleLandingHash);
  resizeObserver = new ResizeObserver(refreshLayout);
  if (root.value) resizeObserver.observe(root.value);
  motionReady = configureMotion();
  await motionReady;
  void maybeScrollStart();
});

onBeforeUnmount(() => {
  disposed = true;
  motionGeneration++;
  scrollGeneration++;
  cancelAnimationFrame(layoutFrame);
  resizeObserver?.disconnect();
  wideQuery?.removeEventListener('change', reconfigureMotion);
  reducedQuery?.removeEventListener('change', reconfigureMotion);
  window.removeEventListener('resize', refreshLayout);
  window.removeEventListener('hashchange', handleLandingHash);
  clearMotion();
});
</script>

<template>
  <div ref="root" class="lh">
    <div ref="inner" class="lh__content">
      <!-- HERO + MISSION share one persistent planet -->
      <div ref="stage" class="lh-stage" :class="{ 'is-pinned': enhanced }">
        <div ref="pin" class="lh-pin">
          <div ref="planet" class="lh-planet"><LandingPlanet /></div>

          <div ref="heroText" class="lh-hero-text">
            <p class="lh-eyebrow mono">INTREPID UNIVERSE</p>
            <div class="lh-hero-foot">
              <p class="lh-hero-kicker mono">INTREPID</p>
              <h1>Value Protection</h1>
              <p class="lh-hero-tag">{{ text('Guardians of Intrepid value — across six Southeast-Asian markets.', 'Vệ binh giá trị Intrepid — trên sáu thị trường Đông Nam Á.') }}</p>
              <div class="lh-scrollcue" aria-hidden="true">{{ text('SCROLL TO EXPLORE', 'CUỘN ĐỂ KHÁM PHÁ') }}<span></span></div>
            </div>
          </div>

          <div ref="missionText" class="lh-mission-text">
            <p class="lh-eyebrow mono">{{ text('Our mission', 'Sứ mệnh') }}</p>
            <h2>{{ text('Guardians of Intrepid value', 'Vệ binh giá trị Intrepid') }}</h2>
            <div class="lh-rule"></div>
            <p>{{ text('Across six Southeast-Asian markets, we hold the line on claimback value — from the first commercial obligation to the final settlement.', 'Trên sáu thị trường Đông Nam Á, chúng tôi giữ vững giá trị claimback — từ nghĩa vụ thương mại đầu tiên đến lần tất toán cuối cùng.') }}</p>
            <p class="lh-mission__second">{{ text('One end-to-end process. One crew. Every orbit covered, every value protected.', 'Một quy trình end-to-end. Một đội ngũ. Mọi quỹ đạo được bao phủ, mọi giá trị được bảo vệ.') }}</p>
            <div class="lh-stats">
              <div class="lh-stat"><b>{{ stageCount }}</b><span>{{ text('E2E STAGES', 'GIAI ĐOẠN E2E') }}</span></div>
              <div class="lh-stat"><b>{{ vaults.length }}</b><span>{{ text('RESOURCE VAULTS', 'VAULT TÀI NGUYÊN') }}</span></div>
              <div class="lh-stat"><b>{{ activeCrew }}</b><span>{{ text('PROTECTORS', 'VALUE PROTECTOR') }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- VAULTS -->
      <section class="lh-vaults lh-gutter">
        <p class="lh-eyebrow mono" data-reveal>{{ text('Resource vaults', 'Vault tài nguyên') }}</p>
        <h2 data-reveal>{{ text('Vaults to protect', 'Những vault cần bảo vệ') }}</h2>
        <p class="lh-sub" data-reveal>{{ text('Each vault holds the working files, systems and records that keep claimback accurate, recoverable and auditable.', 'Mỗi vault chứa các file làm việc, hệ thống và hồ sơ giữ cho claimback chính xác, thu hồi được và kiểm toán được.') }}</p>
        <div class="lh-constellation">
          <button v-for="vault in vaults" :key="vault.sector.slug" type="button" class="lh-vault" :style="{ left: vault.x + '%', top: vault.y + '%' }" @click="openSector(vault.sector.categoryId)">
            <span class="lh-vault__orb" :style="{ width: vault.r + 'px', height: vault.r + 'px' }"><GalaxyPlanet :id="vault.sector.slug" :color="vault.sector.accent" :surface="vault.surface" /></span>
            <span class="lh-vault__label">{{ vault.sector.name }}<span class="mono">{{ vault.sector.code }}</span></span>
          </button>
        </div>
      </section>

      <!-- CREW -->
      <section class="lh-crew lh-gutter">
        <p class="lh-eyebrow mono" data-reveal>{{ text('The crew', 'Đội ngũ') }}</p>
        <h2 data-reveal>{{ text('Every protector a ship', 'Mỗi protector một chiến hạm') }}</h2>
        <p class="lh-sub" data-reveal>{{ text('Value Protectors muster from across the region and lock into formation — one squadron per market, every ship linked into a single connected crew.', 'Các Value Protector tập hợp từ khắp khu vực và vào đội hình — mỗi thị trường một đội, mọi chiến hạm nối thành một crew thống nhất.') }}</p>
        <div class="lh-fleet">
          <svg ref="links" class="lh-flines" aria-hidden="true"><line v-for="(edge, i) in SQUAD_EDGES" :key="i" class="lh-fline" :data-edge="edge.join('-')" /></svg>
          <div v-for="(s, i) in SQUADS" :key="'n' + i" class="lh-node" :style="{ left: s.x + '%', top: s.y + '%', '--lv': s.color }" aria-hidden="true"></div>
          <div v-for="(s, i) in SQUADS" :key="'s' + i" class="lh-ship" :data-x="s.x" :data-y="s.y" :style="squadStyle(s)">
            <span class="lh-hull"><StarfighterIcon :arch="s.arch" :color="s.color" /></span>
            <span class="lh-ship__label mono">{{ s.label }}</span>
          </div>
        </div>
        <button type="button" class="lh-crew-cta" data-reveal @click="openCrew">{{ text('Meet the full crew', 'Xem toàn đội') }} →</button>
      </section>

      <!-- START HERE (original station design, embedded once) -->
      <section id="landing-start-here" class="lh-start-embed">
        <StartHere embedded />
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.lh { position: relative; height: 100%; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; }
.lh__content { position: relative; }
.mono { font-family: var(--font-mono, ui-monospace, monospace); }
.lh-eyebrow { color: var(--color-cyan-400); font-size: 10px; letter-spacing: .26em; text-transform: uppercase; }
.lh h2 { font-size: clamp(26px, 4.4vw, 46px); font-weight: 600; letter-spacing: -.035em; line-height: 1.12; color: var(--color-text-400); margin: 10px 0; text-wrap: balance; }
.lh-sub { max-width: 56ch; margin: 8px 0 0; color: var(--color-text-300); font-size: 14.5px; line-height: 1.7; }
.lh-rule { width: 0; height: 2px; margin: 14px 0; background: linear-gradient(90deg, var(--color-cyan-400), transparent); }
.lh-gutter { padding: clamp(60px, 10vh, 120px) clamp(24px, 6vw, 96px); max-width: 1320px; margin: 0 auto; }

/* STAGE — linear (fallback) layout by default */
.lh-stage { position: relative; }
.lh-pin { position: relative; }
.lh-planet { position: relative; width: min(46vmin, 400px); height: min(46vmin, 400px); margin: clamp(24px, 6vh, 64px) auto 0; }
.lh-hero-text { text-align: center; padding: 20px clamp(24px, 6vw, 64px) 8px; }
.lh-eyebrow + .lh-hero-foot { margin-top: 10px; }
.lh-hero-kicker { color: var(--color-text-200); font-size: 10px; letter-spacing: .3em; }
.lh-hero-text h1 { font-size: clamp(40px, 7vw, 92px); font-weight: 700; letter-spacing: -.045em; line-height: 1; margin: 10px 0 0; color: var(--color-text-400); }
.lh-hero-tag { margin-top: 14px; color: var(--color-text-300); font-size: 15px; line-height: 1.6; }
.lh-scrollcue { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 26px; color: var(--color-text-200); font-size: 9px; letter-spacing: .3em; }
.lh-scrollcue span { width: 1px; height: 26px; background: linear-gradient(var(--color-cyan-400), transparent); animation: lh-cue 1.8s ease-in-out infinite; }
@keyframes lh-cue { 0%,100% { opacity: .3; transform: scaleY(.6); } 50% { opacity: 1; transform: scaleY(1); } }
.lh-mission-text { max-width: 640px; margin: clamp(40px, 7vh, 90px) auto 0; padding: 0 clamp(24px, 6vw, 64px); }
.lh-mission-text p { color: var(--color-text-300); font-size: 15px; line-height: 1.75; max-width: 52ch; }
.lh-mission__second { margin-top: 14px; }
.lh-stats { display: flex; gap: 36px; margin-top: 30px; }
.lh-stat b { display: block; font-size: 34px; font-weight: 600; color: var(--color-text-400); font-family: var(--font-display, 'Outfit'); }
.lh-stat span { font-size: 9px; letter-spacing: .14em; color: var(--color-text-200); }

/* STAGE — pinned (enhanced) layout */
.lh-stage.is-pinned { height: calc(var(--lh-vh, 100dvh) * 2.25); }
.lh-stage.is-pinned .lh-pin { position: sticky; top: 0; height: var(--lh-vh, 100dvh); overflow: hidden; }
.lh-stage.is-pinned .lh-planet { position: absolute; inset: 0; margin: auto; width: min(42vh, 44vmin, 440px); height: min(42vh, 44vmin, 440px); transform-origin: center; will-change: transform; top: -16%; }
.lh-stage.is-pinned .lh-hero-text { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: clamp(22px, 5vh, 54px) 24px clamp(18px, 4vh, 40px); text-align: center; }
.lh-stage.is-pinned .lh-hero-foot { width: 100%; }
.lh-stage.is-pinned .lh-mission-text { position: absolute; top: 50%; left: clamp(24px, 6vw, 96px); transform: translateY(-50%); width: min(46%, 520px); max-width: none; margin: 0; padding: 0; }
.lh-stage.is-pinned .lh-mission-text p { font-size: 14.5px; }

/* VAULTS */
.lh-constellation { position: relative; height: 520px; margin-top: 30px; }
.lh-vault { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 6px; border: 0; background: transparent; color: inherit; cursor: pointer; }
.lh-vault__orb { display: grid; place-items: center; transition: transform .3s; filter: drop-shadow(0 0 20px rgba(120,80,200,.3)); animation: lh-float 7s ease-in-out infinite; }
.lh-vault:nth-child(even) .lh-vault__orb { animation-delay: -3s; }
@keyframes lh-float { 0%,100% { transform: translateY(-5px); } 50% { transform: translateY(6px); } }
.lh-vault:hover .lh-vault__orb { transform: scale(1.08); }
.lh-vault__label { display: flex; flex-direction: column; align-items: center; gap: 1px; color: var(--color-text-400); font-size: 12.5px; font-weight: 500; text-shadow: 0 2px 6px #000; }
.lh-vault__label span { font-size: 8px; letter-spacing: .14em; color: var(--color-text-200); }
.lh-vault:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 4px; border-radius: 8px; }

/* CREW */
.lh-fleet { position: relative; height: 500px; margin-top: 30px; }
.lh-flines { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.lh-fline { stroke: #8f7ad0; stroke-width: 1.3; stroke-linecap: round; opacity: .5; filter: drop-shadow(0 0 3px rgba(168,140,230,.4)); }
.lh-node { position: absolute; transform: translate(-50%, -50%); width: 58px; height: 58px; border-radius: 50%; opacity: 0; pointer-events: none; background: radial-gradient(circle, color-mix(in srgb, var(--lv) 45%, transparent) 0%, transparent 68%); }
.lh-ship { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 2px; filter: drop-shadow(0 0 9px color-mix(in srgb, var(--lv) 40%, transparent)); }
.lh-hull { width: 46px; height: 52px; display: grid; place-items: center; }
.lh-ship__label { font-size: 9px; letter-spacing: .12em; color: var(--color-text-200); text-shadow: 0 2px 6px #000; }
.lh-crew-cta { margin-top: 18px; min-height: 40px; padding: 8px 16px; border: 1px solid var(--color-cyan-400); border-radius: 8px; background: color-mix(in srgb, var(--color-cyan-400) 10%, transparent); color: var(--color-cyan-400); font: inherit; font-size: 13px; cursor: pointer; }
.lh-crew-cta:hover { background: color-mix(in srgb, var(--color-cyan-400) 18%, transparent); }

/* START embed */
.lh-start-embed { position: relative; }

@media (max-width: 900px) {
  .lh-constellation { height: 460px; }
  .lh-fleet { height: 440px; }
  .lh-stats { gap: 24px; flex-wrap: wrap; }
}
@media (max-width: 540px) {
  .lh-stats { gap: 22px; }
  .lh-constellation { height: 420px; }
}
@media (prefers-reduced-motion: reduce) {
  .lh-scrollcue span, .lh-vault__orb { animation: none; }
}
</style>
