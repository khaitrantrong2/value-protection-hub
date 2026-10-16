import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transform } from 'esbuild';
import test from 'node:test';
import vm from 'node:vm';
import { compileScript, parse } from '@vue/compiler-sfc';
import * as Vue from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createLocaleHarness } from './localeHarness.mjs';

const code = (await transform(readFileSync(new URL('../src/data/galaxy.ts', import.meta.url), 'utf8'), { loader: 'ts', format: 'cjs', target: 'es2022' })).code;
const context = vm.createContext({ module: { exports: {} } });
vm.runInContext(code, context);
const { vaultPlanets, vaultOwners, vaultResources } = context.module.exports;

test('Galaxy vaults have stable distinct category identities, legible fixed geography and bilingual scope', () => {
  assert.equal(vaultPlanets.length, 10);
  assert.equal(new Set(vaultPlanets.map(planet => planet.id)).size, 10);
  for (const planet of vaultPlanets) {
    assert.ok(planet.x >= 12 && planet.x <= 86);
    assert.ok(planet.y >= 14 && planet.y <= 82);
    assert.ok(planet.scope.en.length && planet.scope.vi.length);
  }
  assert.match(vaultPlanets.find(planet => planet.id === 'review-cockpits').scope.en, /separate from development/);
  assert.match(vaultPlanets.find(planet => planet.id === 'project-workspace').scope.en, /Development projects/);
});

test('Vault scope preserves published owners and active resource identity without invented crew mapping', () => {
  const rows = [
    { id: 'one', category: 'ar-collection', title: 'First', sortOrder: 1, isActive: true, owner: ' Country Finance ' },
    { id: 'two', category: 'ar-collection', title: 'Second', sortOrder: 2, isActive: true, owner: 'Country Finance' },
    { id: 'old', category: 'ar-collection', title: 'Old', sortOrder: 0, isActive: false, owner: 'Old person' },
    { id: 'other', category: 'project-workspace', title: 'Project', sortOrder: 0, isActive: true, owner: 'DA' },
  ];
  const snapshot = JSON.stringify(rows);
  const resources = vaultResources(rows, 'ar-collection');
  assert.deepEqual(Array.from(resources, row => row.id), ['one', 'two']);
  assert.deepEqual(Array.from(vaultOwners(resources)), ['Country Finance']);
  assert.equal(JSON.stringify(rows), snapshot);
  assert.deepEqual(Array.from(vaultOwners([{ owner: ' ' }])), []);
});

test('Rapid planet inspection clears interrupted target transforms and closing cannot leave a zoomed sphere', async () => {
  const descriptor = parse(readFileSync(new URL('../src/components/UniverseStage.vue', import.meta.url), 'utf8')).descriptor;
  const compiled = (await transform(compileScript(descriptor, { id: 'galaxy-focus' }).content, { loader: 'ts', format: 'cjs', target: 'es2022' })).code;
  const tweens = [], spheres = new Map(), disposed = [];
  class Element {}
  const stubs = {
    vue: { ...Vue, onBeforeUnmount: callback => disposed.push(callback) },
    '../motion': { VPH_EASE: 'none', gsap: { fromTo(target) { target.style.transform = 'scale(0.97)'; const tween = { killed: 0, kill() { this.killed++; } }; tweens.push(tween); return tween; } } },
    '../data/crew': { crew: [] }, '../data/galaxy': context.module.exports,
    '../composables/useLinks': { useLinks: () => ({ links: Vue.ref([]), source: Vue.ref('live'), isLoading: Vue.ref(false), openSector() {}, paletteOpen: Vue.ref(false) }) },
    '../composables/useReducedMotion': { useReducedMotion: () => ({ prefersReducedMotion: Vue.ref(false) }) },
    '../i18n': { useLocale: () => ({ t: key => key, text: en => en }) },
  };
  const runtime = vm.createContext({ module: { exports: {} }, document: { activeElement: null }, HTMLElement: Element, require(path) { if (path.endsWith('.vue')) return {}; assert.ok(stubs[path], path); return stubs[path]; } });
  vm.runInContext(compiled, runtime);
  const effect = Vue.effectScope();
  const universe = effect.run(() => runtime.module.exports.default.setup({}, { expose() {} }));
  for (const planet of vaultPlanets.slice(0, 2)) spheres.set(planet.id, Vue.markRaw({ style: { transform: '', removeProperty(key) { this[key] = ''; } } }));
  universe.stageRef.value = Vue.markRaw({ querySelector(selector) { return [...spheres.entries()].find(([id]) => selector.includes(id))?.[1]; } });
  try {
    await universe.inspectPlanet(vaultPlanets[0]);
    assert.equal(spheres.get(vaultPlanets[0].id).style.transform, 'scale(0.97)');
    await universe.inspectPlanet(vaultPlanets[1]);
    assert.equal(tweens[0].killed, 1);
    assert.equal(spheres.get(vaultPlanets[0].id).style.transform, '');
    universe.closeInspector();
    assert.equal(tweens[1].killed, 1);
    assert.equal(spheres.get(vaultPlanets[1].id).style.transform, '');
    disposed.forEach(callback => callback());
    assert.equal(tweens[1].killed, 1, 'Unmount cleanup is idempotent');
  } finally { effect.stop(); }
});

test('Source availability stays inside the vault inspector and never turns missing evidence into an empty-owner conclusion', async () => {
  const descriptor = parse(readFileSync(new URL('../src/components/GalaxyVaultInspector.vue', import.meta.url), 'utf8')).descriptor;
  const compiled = (await transform(compileScript(descriptor, { id: 'galaxy-vault-source', inlineTemplate: true }).content, { loader: 'ts', format: 'cjs', target: 'es2022' })).code;
  const safetyCode = (await transform(readFileSync(new URL('../src/services/linkSafety.ts', import.meta.url), 'utf8'), { loader: 'ts', format: 'cjs', target: 'es2022' })).code;
  const safety = vm.createContext({ module: { exports: {} }, URL });
  vm.runInContext(safetyCode, safety);
  const stubs = {
    vue: Vue, '../i18n': { useLocale: () => createLocaleHarness('en') }, '../data/galaxy': context.module.exports,
    '../services/linkSafety': safety.module.exports,
    './Icon.vue': Vue.defineComponent({ setup: () => () => Vue.h('i') }),
  };
  const runtime = vm.createContext({ module: { exports: {} }, setTimeout, clearTimeout, require(path) { assert.ok(stubs[path], path); return stubs[path]; } });
  vm.runInContext(compiled, runtime);
  const props = { planet: vaultPlanets[0], resources: [], source: 'unavailable', loading: false };
  const unavailable = await renderToString(Vue.createSSRApp(runtime.module.exports.default, props));
  assert.match(unavailable, /Source unavailable/);
  assert.match(unavailable, /Owner information unavailable/);
  assert.doesNotMatch(unavailable, /No owner published for this vault/);
  assert.match(unavailable, /empty view does not establish/);
  const demo = await renderToString(Vue.createSSRApp(runtime.module.exports.default, { ...props, source: 'mock' }));
  assert.match(demo, /Demo · not live/);
  const stale = await renderToString(Vue.createSSRApp(runtime.module.exports.default, { ...props, source: 'stale' }));
  assert.match(stale, /Retained source · refresh failed/);
  assert.match(stale, /not new approval authority/);
});
