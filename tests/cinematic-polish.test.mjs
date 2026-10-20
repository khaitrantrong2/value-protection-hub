import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { compileScript, parse } from '@vue/compiler-sfc';
import { transform } from 'esbuild';
import * as Vue from 'vue';

const compiled = {};
for (const name of ['StartHere', 'CrewConstellation']) {
  const descriptor = parse(readFileSync(new URL(`../src/components/${name}.vue`, import.meta.url), 'utf8')).descriptor;
  compiled[name] = (await transform(compileScript(descriptor, { id: `cinematic-${name}` }).content, { loader: 'ts', format: 'cjs', target: 'es2022' })).code;
}
const settle = async () => { await Vue.nextTick(); await Vue.nextTick(); };

function runtime(t, name, { reduced = false, wide = true, paused = false, smil = true, observer = true } = {}) {
  const mounted = [], disposed = [], observers = [], begins = [], tweens = [], contexts = [];
  const preference = Vue.ref(reduced), props = Vue.reactive({ paused, members: [
    { id: 'regional', name: 'Regional', group: 'regional', function: 'finance' },
    { id: 'vn', name: 'VN', country: 'VN', function: 'finance' },
    { id: 'my', name: 'MY', country: 'MY', function: 'finance' },
  ] });
  const hulls = [0, 1, 2].map(i => ({ id: `artwork-${i}` }));
  const stage = Vue.markRaw({ querySelectorAll(selector) { assert.equal(selector, '.crewc__arrival'); return hulls; } });
  const gsap = {
    fromTo(targets, from, to) { tweens.push({ targets, from, to }); },
    context(fn, target) { const context = { target, reverted: false, revert() { this.reverted = true; } }; contexts.push(context); fn(); return context; },
  };
  const stubs = {
    vue: { ...Vue, onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => disposed.push(fn) },
    gsap: { gsap },
    '../composables/useReducedMotion': { useReducedMotion: () => ({ prefersReducedMotion: preference }) },
    '../composables/useLinks': { useLinks: () => ({ openAtlas() {}, openCrew() {}, openSector() {}, memberScope: () => [] }) },
    '../services/fleetMotion': { fleetHullFor: () => 'guardian' },
    '../i18n': { useLocale: () => ({ text: en => en, t: key => key }) },
  };
  class IntersectionObserver {
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  }
  const context = vm.createContext({ module: { exports: {} },
    ...(observer ? { IntersectionObserver } : {}),
    window: { matchMedia: query => ({ matches: query.includes('min-width') ? wide : !wide, addEventListener() {}, removeEventListener() {} }) },
    require(name) { if (name.endsWith('.vue')) return {}; assert.ok(stubs[name], name); return stubs[name]; },
  });
  vm.runInContext(compiled[name], context);
  const effect = Vue.effectScope();
  const api = effect.run(() => context.module.exports.default.setup(props, { expose() {}, emit() {} }));
  if (name === 'StartHere') {
    api.routes.value = Vue.markRaw({});
    api.routeLine.value = Vue.markRaw({ querySelectorAll: () => [0, 1, 2].map(i => smil ? { beginElement() { begins.push(i); } } : {}) });
  } else api.fleetStage.value = stage;
  const cleanup = () => { disposed.splice(0).forEach(fn => fn()); effect.stop(); };
  t.after(cleanup);
  return { api, preference, props, observers, begins, tweens, contexts, stage, hulls, cleanup,
    mount: async () => { for (const fn of mounted) await fn(); await settle(); },
    enter: ratio => observers[0].callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]),
  };
}

test('Flight sparks wait for visible routes, start all paths once, and detach the observer', async t => {
  const r = runtime(t, 'StartHere'); await r.mount();
  assert.equal(r.api.sparksPlaying.value, false); assert.equal(r.begins.length, 0);
  r.enter(.1); await settle(); assert.equal(r.begins.length, 0);
  r.enter(.2); await settle();
  assert.equal(r.begins.length, 3); assert.equal(r.observers[0].disconnected, true);
  r.enter(.8); await settle(); assert.equal(r.begins.length, 3);
});

test('Reduced-motion and narrow layouts retain static routes without launching hidden sparks', async t => {
  for (const options of [{ reduced: true }, { wide: false }]) {
    const r = runtime(t, 'StartHere', options); await r.mount(); r.enter(.5); await settle();
    assert.equal(r.api.sparksPlaying.value, false); assert.equal(r.begins.length, 0);
    assert.equal(r.api.paths.value.length, 3);
  }
});

test('Flight paths fail quietly without optional observer/SMIL support, leaving all route actions intact', async t => {
  for (const options of [{ observer: false }, { smil: false }]) {
    const r = runtime(t, 'StartHere', options); await r.mount();
    if (r.observers.length) r.enter(.5);
    await settle(); assert.equal(r.begins.length, 0); assert.equal(r.api.sparksPlaying.value, false);
    assert.ok(r.api.paths.value.every(route => typeof route.action === 'function'));
  }
});

test('Leaving Start Here during its entry cancels pending motion; reduced-motion changes cannot replay it', async t => {
  const leaving = runtime(t, 'StartHere'); await leaving.mount(); leaving.enter(.5); leaving.cleanup();
  await settle(); assert.equal(leaving.begins.length, 0);
  const r = runtime(t, 'StartHere'); await r.mount(); r.enter(.5); await settle();
  r.preference.value = true; await settle(); assert.equal(r.api.sparksPlaying.value, false);
  r.preference.value = false; r.enter(.5); await settle();
  assert.equal(r.api.sparksPlaying.value, false); assert.equal(r.begins.length, 3);
});

test('Crew arrival animates only artwork, finishes within .84 seconds and preserves formation/tooltip anchors', async t => {
  const r = runtime(t, 'CrewConstellation');
  const positions = JSON.stringify(r.api.placed.value);
  await r.mount();
  assert.equal(r.tweens.length, 1); assert.equal(r.tweens[0].targets, r.hulls);
  assert.equal(r.contexts[0].target, r.stage);
  const { from, to } = r.tweens[0];
  assert.ok(to.duration + to.stagger.amount <= .85);
  assert.equal(to.x, 0); assert.equal(to.y, 0); assert.equal(to.autoAlpha, 1);
  assert.ok(Math.abs(from.x(0)) <= 25); assert.ok(Math.abs(from.y(0)) <= 20);
  r.api.focused.value = 'vn'; assert.equal(r.api.activeMember.value.id, 'vn');
  assert.ok(r.api.tip.value.left.endsWith('%'));
  r.api.activeSquad.value = 'VN'; await settle();
  assert.equal(JSON.stringify(r.api.placed.value), positions); assert.equal(r.tweens.length, 1);
});

test('Pause settles arrival and resize/unpause does not replay it; unmount releases the owned context', async t => {
  const r = runtime(t, 'CrewConstellation'); await r.mount();
  r.props.paused = true; await settle(); assert.equal(r.contexts[0].reverted, true);
  r.props.paused = false; r.api.fleetStage.value = Vue.markRaw({ querySelectorAll: () => r.hulls });
  await settle(); assert.equal(r.tweens.length, 1);
  const resizing = runtime(t, 'CrewConstellation'); await resizing.mount();
  resizing.api.fleetStage.value = null; await settle(); assert.equal(resizing.contexts[0].reverted, true);
  const leaving = runtime(t, 'CrewConstellation'); await leaving.mount(); leaving.cleanup();
  assert.equal(leaving.contexts[0].reverted, true);
});

test('Paused/reduced-motion crew mounts visibly without an arrival tween; narrow view keeps its roster fallback', async t => {
  const paused = runtime(t, 'CrewConstellation', { paused: true }); await paused.mount();
  assert.equal(paused.tweens.length, 0);
  const narrow = runtime(t, 'CrewConstellation', { wide: false }); narrow.api.fleetStage.value = null;
  await narrow.mount(); assert.equal(narrow.api.narrow.value, true); assert.equal(narrow.tweens.length, 0);
});
