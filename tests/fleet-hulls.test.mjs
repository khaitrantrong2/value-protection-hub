import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { compileScript, parse } from '@vue/compiler-sfc';
import { transform } from 'esbuild';

const require = createRequire(import.meta.url), Vue = require('vue'), { renderToString } = require('vue/server-renderer');
const source = readFileSync(new URL('../src/components/StarfighterIcon.vue', import.meta.url), 'utf8');
const script = compileScript(parse(source, { filename: 'StarfighterIcon.vue' }).descriptor, { id: 'fleet-hull', inlineTemplate: true }).content;
const compiled = await transform(script, { loader: 'ts', format: 'cjs', target: 'es2022' });
const context = vm.createContext({ module: { exports: {} }, require(name) { assert.equal(name, 'vue'); return Vue; } });
vm.runInContext(compiled.code, context);
const Hull = context.module.exports.default;

test('Nine distinct SVG hull designs each contain multicolor armor, metallic panels, glass and engine detail', async () => {
  const hulls = ['scout', 'interceptor', 'cruiser', 'shuttle', 'lancer', 'twinwing', 'nova', 'falcon', 'aegis'];
  const markup = [];
  for (const arch of hulls) {
    const html = await renderToString(Vue.createSSRApp(Hull, { arch, livery: 2 }));
    assert.match(html, new RegExp(`data-hull="${arch}"`));
    const colors = new Set([...html.matchAll(/(?:fill|stroke|stop-color)="(#[0-9a-f]{6})"/gi)].map(match => match[1]));
    assert.ok(colors.size >= 7, `${arch} must have more than a monochrome outer glow`);
    assert.match(html, /class="flame"/);
    assert.match(html, /linearGradient/);
    assert.match(html, /aria-hidden="true"/);
    markup.push(html);
  }
  assert.equal(new Set(markup).size, 9);
  assert.match(markup.at(-1), /data-special-hull="true"/);
});

test('Repeated hulls have unique gradient IDs in the same fleet and deterministic per-person liveries', async () => {
  const html = await renderToString(Vue.createSSRApp({ setup: () => () => Vue.h('div', [Vue.h(Hull, { arch: 'scout', livery: 0 }), Vue.h(Hull, { arch: 'scout', livery: 1 })]) }));
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, 4); assert.equal(new Set(ids).size, 4);
  assert.match(html, /#9F8AF0/); assert.match(html, /#6599CF/);
});

test('Individual ship liveries do not collapse into four repeated accent palettes', async () => {
  const colors = [];
  for (const livery of [172319, 244987, 730194, 199403, 951267]) {
    const html = await renderToString(Vue.createSSRApp(Hull, { arch: 'scout', livery }));
    const accents = [...html.matchAll(/(?:fill|stroke|stop-color)="(hsl\([^"]+\))"/g)].map(match => match[1]);
    assert.ok(new Set(accents).size >= 4);
    colors.push(accents.join('|'));
  }
  assert.equal(new Set(colors).size, colors.length);
});
