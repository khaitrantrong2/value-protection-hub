<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import GalaxyCore from './GalaxyCore.vue';
import GalaxyPlanet from './GalaxyPlanet.vue';
import StarfighterIcon from './StarfighterIcon.vue';
import { sectors } from '../data/sectors';
import { crew } from '../data/crew';
import { useLinks } from '../composables/useLinks';
import { useLocale } from '../i18n';
import type { FleetHull } from '../services/fleetMotion';

const { openSector, openCrew, openAtlas } = useLinks();
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

const paths = [
  { code: '01', icon: '🛰', titleEn: 'Understand the process', titleVi: 'Hiểu quy trình', bodyEn: 'Walk the eight-stage claimback journey, end to end, in the Process Atlas and Guide.', bodyVi: 'Đi hết hành trình claimback tám giai đoạn trong Process Atlas và Guide.', ctaEn: 'Open Process Atlas', ctaVi: 'Mở Process Atlas', action: () => openAtlas('01') },
  { code: '02', icon: '✦', titleEn: 'Meet the crew', titleVi: 'Gặp đội ngũ', bodyEn: 'See every active protector, the market they defend and what each vault is for.', bodyVi: 'Xem từng Value Protector, thị trường phụ trách và vai trò mỗi vault.', ctaEn: 'Meet the crew', ctaVi: 'Gặp đội ngũ', action: openCrew },
  { code: '03', icon: '◉', titleEn: 'Begin daily work', titleVi: 'Bắt đầu công việc', bodyEn: 'Open the trackers, SOPs, templates and cockpits you need today, filtered by your market.', bodyVi: 'Mở tracker, SOP, template và cockpit cần dùng, lọc theo thị trường của bạn.', ctaEn: 'Open Directory', ctaVi: 'Mở Directory', action: () => openSector('all') },
];

const root = ref<HTMLElement | null>(null);
const inner = ref<HTMLElement | null>(null);
const links = ref<SVGSVGElement | null>(null);
let lenis: Lenis | undefined;
const triggers: ScrollTrigger[] = [];
let tickerFn: ((t: number) => void) | undefined;

function squadStyle(s: Squad) { return { left: s.x + '%', top: s.y + '%', '--lv': s.color }; }

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

function settleAll() {
  if (!inner.value) return;
  inner.value.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
  inner.value.querySelectorAll<HTMLElement>('[data-rule]').forEach(el => { el.style.width = '220px'; });
  inner.value.querySelectorAll<HTMLElement>('.lh-ship').forEach(el => { el.style.opacity = '1'; });
  inner.value.querySelectorAll<HTMLElement>('.lh-node').forEach(el => { el.style.opacity = '.7'; });
  links.value?.querySelectorAll<SVGLineElement>('line').forEach(ln => { ln.dataset.drawn = '1'; ln.style.strokeDashoffset = '0'; });
}

function setVH() { if (root.value) root.value.style.setProperty('--lh-vh', root.value.clientHeight + 'px'); }

onMounted(() => {
  setVH();
  layoutLines();
  window.addEventListener('resize', setVH);
  window.addEventListener('resize', layoutLines);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !root.value || !inner.value) { settleAll(); return; }

  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ wrapper: root.value, content: inner.value, duration: 1.35, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  tickerFn = (t: number) => lenis!.raf(t * 1000);
  gsap.ticker.add(tickerFn);
  gsap.ticker.lagSmoothing(0);
  const scroller = root.value;
  const add = (t: ScrollTrigger) => { triggers.push(t); return t; };

  // Hero intro
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.lh-ring', { opacity: 0, duration: 1.3 }, 0.2)
    .from('.lh-corelogo', { opacity: 0, scale: .8, duration: 1 }, 0.35)
    .from('.lh-hero-cap', { opacity: 0, y: 16, duration: 1, stagger: .12 }, 0.5);

  // Section reveals
  inner.value.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => {
    add(ScrollTrigger.create({ scroller, trigger: el, start: 'top 86%', once: true,
      onEnter: () => gsap.from(el, { opacity: 0, y: 42, duration: 1.1, ease: 'power3.out' }) }));
    gsap.set(el, { opacity: 1 });
  });
  inner.value.querySelectorAll<HTMLElement>('[data-rule]').forEach(el => {
    add(ScrollTrigger.create({ scroller, trigger: el, start: 'top 86%', once: true,
      onEnter: () => gsap.fromTo(el, { width: 0 }, { width: 220, duration: 1, ease: 'power2.out' }) }));
  });

  // Vault planets pop in
  add(ScrollTrigger.create({ scroller, trigger: '.lh-vaults', start: 'top 72%', once: true,
    onEnter: () => gsap.from('.lh-vault', { opacity: 0, scale: .3, duration: 1, ease: 'back.out(1.6)', stagger: { each: .1, from: 'random' } }) }));

  // Crew constellation muster
  const ships = gsap.utils.toArray<HTMLElement>('.lh-ship');
  const nodes = gsap.utils.toArray<HTMLElement>('.lh-node');
  const lineEls = links.value ? Array.from(links.value.querySelectorAll<SVGLineElement>('line')) : [];
  add(ScrollTrigger.create({ scroller, trigger: '.lh-fleet', start: 'top 74%', once: true, onEnter: () => {
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
    tl.add(() => {
      gsap.to('.lh-ship .lh-hull', { y: '+=7', duration: 3.8, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: { each: .3, from: 'random' } });
      gsap.to('.lh-node', { scale: 1.12, opacity: .85, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: { each: .35, from: 'random' } });
    });
  } }));
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', setVH);
  window.removeEventListener('resize', layoutLines);
  triggers.forEach(t => t.kill());
  if (tickerFn) gsap.ticker.remove(tickerFn);
  lenis?.destroy();
});
</script>

<template>
  <div ref="root" class="lh">
    <div ref="inner" class="lh__content">
      <!-- HERO -->
      <section class="lh-hero">
        <div class="lh-corebox">
          <GalaxyCore />
          <span class="lh-halo" aria-hidden="true"></span>
          <svg class="lh-ring" viewBox="0 0 300 300" aria-hidden="true"><defs><path id="lh-ringpath" d="M150,150 m-132,0 a132,132 0 1,1 264,0 a132,132 0 1,1 -264,0" /></defs><text><textPath href="#lh-ringpath">VALUE PROTECTION · INTREPID · VALUE PROTECTION · INTREPID · </textPath></text></svg>
        </div>
        <div class="lh-hero-cap">
          <p class="lh-eyebrow mono">INTREPID UNIVERSE</p>
          <p class="lh-hero-tag">{{ text('Guardians of Intrepid value — across six Southeast-Asian markets.', 'Vệ binh giá trị Intrepid — trên sáu thị trường Đông Nam Á.') }}</p>
        </div>
        <div class="lh-scrollcue" aria-hidden="true">{{ text('SCROLL', 'CUỘN') }}<span></span></div>
      </section>

      <!-- MISSION -->
      <section class="lh-mission lh-gutter">
        <div class="lh-mission__copy">
          <p class="lh-eyebrow mono" data-reveal>{{ text('Our mission', 'Sứ mệnh') }}</p>
          <h2 data-reveal>{{ text('Guardians of Intrepid value', 'Vệ binh giá trị Intrepid') }}</h2>
          <div class="lh-rule" data-rule></div>
          <p data-reveal>{{ text('Across six Southeast-Asian markets, we hold the line on claimback value — from the first commercial obligation to the final settlement.', 'Trên sáu thị trường Đông Nam Á, chúng tôi giữ vững giá trị claimback — từ nghĩa vụ thương mại đầu tiên đến lần tất toán cuối cùng.') }}</p>
          <p data-reveal class="lh-mission__second">{{ text('One end-to-end process. One crew. Every orbit covered, every value protected.', 'Một quy trình end-to-end. Một đội ngũ. Mọi quỹ đạo được bao phủ, mọi giá trị được bảo vệ.') }}</p>
          <div class="lh-stats">
            <div class="lh-stat" data-reveal><b>{{ stageCount }}</b><span>{{ text('E2E STAGES', 'GIAI ĐOẠN E2E') }}</span></div>
            <div class="lh-stat" data-reveal><b>{{ vaults.length }}</b><span>{{ text('RESOURCE VAULTS', 'VAULT TÀI NGUYÊN') }}</span></div>
            <div class="lh-stat" data-reveal><b>{{ activeCrew }}</b><span>{{ text('PROTECTORS', 'VALUE PROTECTOR') }}</span></div>
          </div>
        </div>
        <div class="lh-memblem" aria-hidden="true"><GalaxyCore /></div>
      </section>

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

      <!-- START -->
      <section class="lh-start lh-gutter">
        <p class="lh-eyebrow mono" data-reveal>{{ text('Start here', 'Bắt đầu') }}</p>
        <h2 data-reveal>{{ text('Choose your trajectory', 'Chọn hành trình') }}</h2>
        <p class="lh-sub" data-reveal>{{ text('Three ways into the Hub — understand the process, meet the team, or begin today’s work.', 'Ba lối vào Hub — hiểu quy trình, gặp đội ngũ, hoặc bắt đầu công việc hôm nay.') }}</p>
        <div class="lh-paths">
          <button v-for="path in paths" :key="path.code" type="button" class="lh-path" data-reveal @click="path.action">
            <span class="lh-path__ic" aria-hidden="true">{{ path.icon }}</span>
            <span class="lh-path__code mono">{{ path.code }}</span>
            <strong>{{ text(path.titleEn, path.titleVi) }}</strong>
            <span class="lh-path__body">{{ text(path.bodyEn, path.bodyVi) }}</span>
            <span class="lh-path__go">{{ text(path.ctaEn, path.ctaVi) }} →</span>
          </button>
        </div>
        <p class="lh-foot" data-reveal>{{ text('One crew. Every orbit. Every value protected.', 'Một đội ngũ. Mọi quỹ đạo. Mọi giá trị được bảo vệ.') }}</p>
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

/* HERO */
.lh-hero { position: relative; min-height: var(--lh-vh, 100dvh); display: grid; place-items: center; }
.lh-corebox { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(62vmin, 460px); height: min(62vmin, 460px); }
.lh-halo { position: absolute; inset: -12%; border-radius: 50%; background: radial-gradient(circle, transparent 54%, rgba(170,130,255,.16) 66%, transparent 76%); animation: lh-halo 6s ease-in-out infinite; }
@keyframes lh-halo { 0%,100% { transform: scale(1); opacity: .8; } 50% { transform: scale(1.05); opacity: 1; } }
.lh-ring { position: absolute; inset: -6%; width: 112%; height: 112%; animation: lh-spin 46s linear infinite; }
.lh-ring text { fill: rgba(217,205,245,.5); font-size: 11px; letter-spacing: .36em; font-family: var(--font-mono, monospace); }
@keyframes lh-spin { to { transform: rotate(360deg); } }
.lh-corelogo { display: none; }
.lh-hero-cap { position: absolute; top: 74%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: min(90%, 440px); pointer-events: none; }
.lh-hero-tag { margin-top: 12px; color: var(--color-text-300); font-size: 13.5px; line-height: 1.6; }
.lh-scrollcue { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--color-text-200); font-size: 9px; letter-spacing: .3em; }
.lh-scrollcue span { width: 1px; height: 26px; background: linear-gradient(var(--color-cyan-400), transparent); animation: lh-cue 1.8s ease-in-out infinite; }
@keyframes lh-cue { 0%,100% { opacity: .3; transform: scaleY(.6); } 50% { opacity: 1; transform: scaleY(1); } }

/* MISSION */
.lh-mission { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, .8fr); gap: 40px; align-items: center; }
.lh-mission p { color: var(--color-text-300); font-size: 15px; line-height: 1.75; max-width: 52ch; }
.lh-mission__second { margin-top: 14px; }
.lh-stats { display: flex; gap: 36px; margin-top: 30px; }
.lh-stat b { display: block; font-size: 34px; font-weight: 600; color: var(--color-text-400); font-family: var(--font-display, 'Outfit'); }
.lh-stat span { font-size: 9px; letter-spacing: .14em; color: var(--color-text-200); }
.lh-memblem { position: relative; aspect-ratio: 1; width: 100%; max-width: 230px; margin: 0 auto; opacity: .85; }

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

/* START */
.lh-paths { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 30px; }
.lh-path { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 24px; border: 1px solid var(--color-card-border); border-radius: 14px; background: linear-gradient(160deg, color-mix(in srgb, var(--space-navy) 70%, transparent), rgba(16,9,34,.5)); color: var(--color-text-400); text-align: left; cursor: pointer; transition: border-color .25s, transform .25s, background .25s; }
.lh-path:hover { border-color: var(--color-cyan-400); transform: translateY(-4px); background: var(--color-command-bg-soft); }
.lh-path:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 3px; }
.lh-path__ic { font-size: 22px; }
.lh-path__code { font-size: 10px; letter-spacing: .14em; color: var(--color-cyan-400); }
.lh-path strong { font-size: 18px; font-weight: 600; line-height: 1.25; }
.lh-path__body { color: var(--color-text-300); font-size: 13px; line-height: 1.6; }
.lh-path__go { margin-top: 6px; color: var(--color-cyan-400); font-size: 12px; }
.lh-foot { margin-top: 28px; color: var(--color-text-200); font-size: 12px; letter-spacing: .02em; }

@media (max-width: 900px) {
  .lh-mission { grid-template-columns: 1fr; gap: 24px; }
  .lh-memblem { max-width: 160px; order: -1; }
  .lh-paths { grid-template-columns: 1fr; }
  .lh-constellation { height: 460px; }
  .lh-fleet { height: 440px; }
}
@media (max-width: 540px) {
  .lh-stats { gap: 22px; flex-wrap: wrap; }
  .lh-constellation { height: 420px; }
}
@media (prefers-reduced-motion: reduce) {
  .lh-halo, .lh-ring, .lh-scrollcue span, .lh-vault__orb { animation: none; }
}
</style>
