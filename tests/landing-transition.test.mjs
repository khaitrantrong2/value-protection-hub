import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { compileScript, parse } from '@vue/compiler-sfc';
import { transform } from 'esbuild';
import * as Vue from 'vue';
import { renderToString } from 'vue/server-renderer';

const descriptor = parse(readFileSync(new URL('../src/components/LandingHome.vue', import.meta.url), 'utf8')).descriptor;
const compiled = (await transform(compileScript(descriptor, { id: 'landing-test' }).content, { loader: 'ts', format: 'cjs', target: 'es2022' })).code;
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function runtime(t, hash = '#home') {
  const mounted = [], disposed = [], listeners = new Map(), tickers = new Set(), triggers = [], contexts = [], scrolls = [];
  const wide = { matches: true, listeners: new Set(), addEventListener(_type, fn) { this.listeners.add(fn); }, removeEventListener(_type, fn) { this.listeners.delete(fn); } };
  const reduced = { ...wide, matches: false, listeners: new Set() };
  let finishFonts;
  const fonts = new Promise(resolve => { finishFonts = resolve; });
  const styles = () => ({ setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } });
  const element = (extra = {}) => Vue.markRaw({ style: styles(), children: [], setAttribute() {}, removeAttribute() {}, querySelectorAll: () => [], ...extra });
  const target = element({ offsetTop: 3200 });
  const root = element({ clientWidth: 1200, clientHeight: 700, scrollTop: 0, scrollTo(value) { this.scrollTop = value.top; scrolls.push(value); } });
  const inner = element({ querySelector: selector => selector === '#landing-start-here' ? target : null });
  const makeTween = () => ({ to() { return this; }, add() { return this; }, kill() {} });
  const gsap = {
    registerPlugin() {}, from: makeTween, to: makeTween, fromTo: makeTween, set() {}, timeline: makeTween,
    ticker: { add: fn => tickers.add(fn), remove: fn => tickers.delete(fn), lagSmoothing() {} },
    utils: { toArray: () => [] },
    context(fn) { const ctx = { reverted: false, add(cb) { cb(); }, revert() { this.reverted = true; } }; contexts.push(ctx); fn(); return ctx; },
  };
  class Lenis {
    on() {} raf() {} resize() {} destroy() { this.destroyed = true; }
    scrollTo(value, options) { scrolls.push({ value, ...options }); }
  }
  const ScrollTrigger = { update() {}, refresh() {}, create(options) {
    const trigger = { ...options, progress: 0, killed: false, refresh() {}, kill() { this.killed = true; } };
    triggers.push(trigger); return trigger;
  } };
  const window = {
    innerWidth: 1200, location: { hash }, matchMedia: query => query.includes('reduced-motion') ? reduced : wide,
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
  };
  class ResizeObserver { observe() {} disconnect() { this.disconnected = true; } }
  const stubs = {
    vue: { ...Vue, onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => disposed.push(fn) }, gsap: { gsap },
    'gsap/ScrollTrigger': ScrollTrigger, lenis: Lenis,
    '../data/sectors': { sectors: [] }, '../data/crew': { crew: [] },
    '../composables/useLinks': { useLinks: () => ({ openSector() {}, openCrew() {} }) },
    '../i18n': { useLocale: () => ({ text: en => en }) },
  };
  const context = vm.createContext({ module: { exports: {} }, window, document: { fonts: { ready: fonts } }, ResizeObserver,
    requestAnimationFrame: fn => { Promise.resolve().then(() => fn(0)); return 1; }, cancelAnimationFrame() {},
    setTimeout() { return 1; }, clearTimeout() {},
    require(name) { if (name.endsWith('.vue')) return {}; assert.ok(stubs[name], name); return stubs[name]; },
  });
  vm.runInContext(compiled, context);
  const effect = Vue.effectScope();
  const api = effect.run(() => context.module.exports.default.setup({}, { expose() {} }));
  for (const [key, value] of Object.entries({ root, inner, stage: element(), pin: element({ clientWidth: 1200 }), planet: element(), heroText: element(), missionText: element() })) api[key].value = value;
  t.after(() => { disposed.forEach(fn => fn()); effect.stop(); });
  return { api, root, target, window, wide, reduced, mounted, disposed, contexts, tickers, triggers, scrolls, finishFonts,
    mount: async () => { for (const fn of mounted) await fn(); await settle(); },
    emit: async type => { for (const fn of listeners.get(type) ?? []) fn(); await settle(); },
  };
}

test('Mission scroll transform retains its vertical centering and reverses without replacing the planet', t => {
  const r = runtime(t), samePlanet = r.api.planet.value;
  r.api.applyFrame(1);
  assert.match(r.api.missionText.value.style.transform, /-50%/);
  assert.equal(r.api.missionText.value.style.opacity, '1');
  r.api.applyFrame(0);
  assert.equal(r.api.planet.value, samePlanet);
  assert.match(r.api.planet.value.style.transform, /translate\(0px,0\) scale\(1\)/);
});

test('Motion reconfigures on a breakpoint change and releases its owned context and ticker', async t => {
  const r = runtime(t); r.finishFonts(); await r.mount();
  assert.equal(r.api.enhanced.value, true); assert.equal(r.tickers.size, 1);
  r.wide.matches = false; r.window.innerWidth = 600;
  for (const fn of r.wide.listeners) fn(); await settle();
  assert.equal(r.api.enhanced.value, false); assert.equal(r.tickers.size, 0);
  assert.ok(r.contexts.length > 0); assert.ok(r.contexts.every(ctx => ctx.reverted));
  assert.equal(r.api.missionText.value.style.opacity, '1');
});

test('Legacy Start Here waits for layout/fonts instead of a fixed timer, and cancelled navigation cannot scroll', async t => {
  const r = runtime(t, '#start'); await r.mount();
  assert.equal(r.scrolls.length, 0);
  r.finishFonts(); await settle();
  assert.equal(r.scrolls.length, 1);
  assert.equal(r.scrolls[0].value, r.target);
  assert.equal(r.scrolls[0].immediate, true, 'Legacy anchors must not leave a resize-interruptible scroll in flight');
  r.window.location.hash = '#start';
  const pending = r.api.maybeScrollStart();
  r.window.location.hash = '#crew'; await r.emit('hashchange');
  await pending; await settle();
  assert.equal(r.scrolls.length, 1, 'No stale scroll after leaving Home');
});

test('Reduced motion keeps content visible and makes the legacy destination scroll immediately', async t => {
  const r = runtime(t, '#start'); r.reduced.matches = true; r.finishFonts(); await r.mount(); await settle();
  assert.equal(r.api.enhanced.value, false); assert.equal(r.tickers.size, 0);
  assert.equal(r.api.missionText.value.style.opacity, '1');
  assert.equal(r.scrolls[0]?.behavior, 'auto');
});

test('Explicit Home navigation returns from embedded Start Here without resetting on unrelated routes', t => {
  const r = runtime(t); r.root.scrollTop = 2500;
  r.api.handleLandingHash();
  assert.equal(r.root.scrollTop, 0); assert.equal(r.scrolls.length, 1);
  r.window.location.hash = '#crew'; r.api.handleLandingHash();
  assert.equal(r.scrolls.length, 1);
});

test('Embedded Start Here retains three CTAs without adding a second page H1', async () => {
  const start = parse(readFileSync(new URL('../src/components/StartHere.vue', import.meta.url), 'utf8')).descriptor;
  const code = (await transform(compileScript(start, { id: 'start-embedded', inlineTemplate: true }).content, { loader: 'ts', format: 'cjs', target: 'es2022' })).code;
  const stubs = {
    vue: Vue, '../composables/useLinks': { useLinks: () => ({ openAtlas() {}, openCrew() {}, openSector() {} }) },
    '../composables/useReducedMotion': { useReducedMotion: () => ({ prefersReducedMotion: Vue.ref(true) }) },
    '../i18n': { useLocale: () => ({ text: en => en, t: key => key }) },
    './Icon.vue': Vue.defineComponent({ setup: () => () => Vue.h('i') }),
  };
  const runtime = vm.createContext({ module: { exports: {} }, require: name => stubs[name] });
  vm.runInContext(code, runtime);
  const component = runtime.module.exports.default;
  const embedded = await renderToString(Vue.createSSRApp(component, { embedded: true }));
  assert.doesNotMatch(embedded, /<h1/);
  assert.match(embedded, /<h2 class="start-page__title"/);
  assert.equal((embedded.match(/class="start-station__action"/g) ?? []).length, 3);
  const standalone = await renderToString(Vue.createSSRApp(component));
  assert.match(standalone, /<h1 class="start-page__title"/);
});

test('Planet uses unscaled layout dimensions and stops/resumes its RAF on reduced-motion changes', async () => {
  const planet = parse(readFileSync(new URL('../src/components/LandingPlanet.vue', import.meta.url), 'utf8')).descriptor;
  const code = (await transform(compileScript(planet, { id: 'planet-motion' }).content, { loader: 'ts', format: 'cjs', target: 'es2022' })).code;
  const mounted = [], disposed = [], frames = new Map(); let nextFrame = 0, draws = 0;
  const reduced = Vue.ref(false);
  const context2d = new Proxy({ createRadialGradient: () => ({ addColorStop() {} }), clearRect() { draws++; } }, { get: (value, key) => key in value ? value[key] : () => {} });
  const stubs = { vue: { ...Vue, onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => disposed.push(fn) }, '../composables/useReducedMotion': { useReducedMotion: () => ({ prefersReducedMotion: reduced }) } };
  const runtime = vm.createContext({ module: { exports: {} }, document: { hidden: false }, window: { devicePixelRatio: 2 },
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: fn => { const id = ++nextFrame; frames.set(id, fn); return id; }, cancelAnimationFrame: id => frames.delete(id),
    require: name => stubs[name],
  });
  vm.runInContext(code, runtime);
  const effect = Vue.effectScope();
  const api = effect.run(() => runtime.module.exports.default.setup({}, { expose() {} }));
  const canvas = Vue.markRaw({ clientWidth: 400, clientHeight: 400, getContext: () => context2d, getBoundingClientRect: () => ({ width: 240, height: 240 }) });
  api.canvas.value = canvas;
  try {
    mounted.forEach(fn => fn()); assert.equal(canvas.width, 800); assert.equal(frames.size, 1);
    reduced.value = true; await Vue.nextTick(); assert.equal(frames.size, 0); assert.equal(draws, 1);
    reduced.value = false; await Vue.nextTick(); assert.equal(frames.size, 1);
    disposed.forEach(fn => fn()); assert.equal(frames.size, 0);
  } finally { effect.stop(); }
});
