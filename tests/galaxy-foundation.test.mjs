import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { parse, compileScript } from '@vue/compiler-sfc';
import { transform } from 'esbuild';
import { createLocaleHarness } from './localeHarness.mjs';
const require = createRequire(import.meta.url);
const Vue = require('vue');
const { renderToString } = require('vue/server-renderer');
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('UI self-hosts the complete font subsets at actual weights instead of preloading incomplete fallback fonts', () => {
  const main = read('src/main.ts'), styles = read('src/assets/styles/index.scss');
  const samples = 'Khải · Thạch · Huệ · Nguyễn · Đội ngũ · Đối soát · Trách nhiệm'.normalize('NFC');
  for (const weight of [400, 500, 600, 700]) {
    assert.ok(main.includes(`@fontsource/be-vietnam-pro/${weight}.css`));
    const css = read(`node_modules/@fontsource/be-vietnam-pro/${weight}.css`);
    const ranges = [...css.matchAll(/U\+([0-9A-F]+)(?:-([0-9A-F]+))?/g)].map(([, start, end]) => [parseInt(start, 16), parseInt(end || start, 16)]);
    for (const char of samples) assert.ok(ranges.some(([start, end]) => char.codePointAt(0) >= start && char.codePointAt(0) <= end), `${weight}: ${char}`);
    assert.doesNotMatch(css, /url\(https?:/);
  }
  assert.match(styles, /font-family:\s*"Be Vietnam Pro"/);
  assert.doesNotMatch(read('index.html'), /preload[^>]+urbanist/);
  assert.match(read('public/fonts/OFL-BeVietnamPro.txt'), /SIL OPEN FONT LICENSE Version 1.1/);
});

test('Financial glossary remains available in the Process Guide in both languages, not the Start landing', async () => {
  const { descriptor } = parse(read('src/components/atlas/ProcessGlossary.vue'));
  const code = (await transform(compileScript(descriptor, { id: 'process-glossary', inlineTemplate: true }).content, { loader: 'ts', format: 'cjs' })).code;
  for (const lang of ['en', 'vi']) {
    const locale = createLocaleHarness(lang);
    const context = vm.createContext({ module: { exports: {} }, require(name) { if (name === 'vue') return Vue; if (name === '../../i18n') return { useLocale: () => locale }; throw new Error(name); } });
    vm.runInContext(code, context);
    const html = await renderToString(Vue.createSSRApp(context.module.exports.default));
    assert.equal((html.match(/<dt>/g) || []).length, 4);
    assert.match(html, lang === 'en' ? /Settled does not always mean cash collected/ : /Tất toán không mặc định là đã thu tiền/);
    assert.match(html, lang === 'en' ? /not a conclusion on operating effectiveness/ : /không phải kết luận về hiệu quả vận hành/);
  }
  assert.match(read('src/components/atlas/AtlasProcessGuide.vue'), /<ProcessGlossary\s*\/>/);
  assert.doesNotMatch(read('src/components/StartHere.vue'), /start-glossary|start-ownership/);
});

test('Galaxy remains the only Home body and fleet exposes the actual keyboard guard boundary', () => {
  assert.doesNotMatch(read('src/App.vue'), /<MissionStrip/);
  assert.match(read('src/components/ProtectorFleet.vue'), /data-protector-fleet/);
  assert.match(read('src/components/MemberScopePanel.vue'), /data-hub-inspector/);
  assert.match(read('src/components/MemberScopePanel.vue'), /overscroll-behavior:contain/);
});
