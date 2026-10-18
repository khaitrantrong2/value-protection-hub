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
const context = vm.createContext({ module: { exports: {} }, require(name) { if (name === 'vue') return Vue; return {}; } });
vm.runInContext(compiled.code, context);
const Hull = context.module.exports.default;

const HULLS = ['commander', 'lead', 'automation', 'guardian', 'interceptor', 'battlecruiser', 'sentinel', 'cadet'];

test('Eight distinct Aegis Wing hulls render with hull gradient, engine flame, livery colour and are decorative', async () => {
  const markup = [];
  for (const arch of HULLS) {
    const html = await renderToString(Vue.createSSRApp(Hull, { arch, color: '#34d399' }));
    assert.match(html, new RegExp(`data-hull="${arch}"`));
    assert.match(html, /class="flame"/);
    assert.match(html, /linearGradient/);
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /#34d399/i, `${arch} must paint the livery colour`);
    markup.push(html);
  }
  assert.equal(new Set(markup).size, HULLS.length);
});

test('Commander flies the flagship crown + halo; automation carries its own signature ring', async () => {
  const commander = await renderToString(Vue.createSSRApp(Hull, { arch: 'commander', color: '#f5b342' }));
  assert.match(commander, /data-special-hull="true"/);
  assert.match(commander, /class="spin"/); // orbital halo
  assert.match(commander, /#f5b342/i); // gold crown star
  const automation = await renderToString(Vue.createSSRApp(Hull, { arch: 'automation', color: '#7dd3fc' }));
  assert.match(automation, /class="spin"/); // hex signal aura
});

test('Repeated hulls get unique gradient IDs and independent liveries within one fleet', async () => {
  const html = await renderToString(Vue.createSSRApp({ setup: () => () => Vue.h('div', [Vue.h(Hull, { arch: 'guardian', color: '#60a5fa' }), Vue.h(Hull, { arch: 'guardian', color: '#f59e0b' })]) }));
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  assert.match(html, /#60a5fa/i); assert.match(html, /#f59e0b/i);
});

test('Default livery falls back to amethyst when no colour is supplied', async () => {
  const html = await renderToString(Vue.createSSRApp(Hull, { arch: 'guardian' }));
  assert.match(html, /#b794f6/i);
});
