import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = readFileSync(new URL('../src/i18n/localeState.ts', import.meta.url), 'utf8');
const compiled = await transform(source, { loader: 'ts', format: 'cjs', target: 'es2022' });
const runtime = vm.createContext({ module: { exports: {} }, URL, URLSearchParams });
vm.runInContext(compiled.code, runtime);
const { resolveLocale, resolveInterfaceLocale, TRANSLATION_ENABLED, localeURL } = runtime.module.exports;

test('Public interface stays English even with legacy VI links or stored preference', () => {
  assert.equal(TRANSLATION_ENABLED, false);
  assert.equal(resolveInterfaceLocale('?lang=vi', 'vi'), 'en');
  assert.equal(resolveInterfaceLocale('', 'vi'), 'en');
  const header = readFileSync(new URL('../src/components/AppHeader.vue', import.meta.url), 'utf8');
  assert.doesNotMatch(header, /language-switch|setLocale\(/);
});

test('Explicit shared language wins over preference; invalid language uses saved preference or English', () => {
  assert.equal(resolveLocale('?lang=vi', 'en'), 'vi');
  assert.equal(resolveLocale('?lang=en', 'vi'), 'en');
  assert.equal(resolveLocale('?lang=invalid', 'vi'), 'vi');
  assert.equal(resolveLocale('', null), 'en');
});

test('Changing language preserves the complete Atlas chapter/reference hash and unrelated query state', () => {
  const hash = '#atlas?mode=guide&stage=04&library=record&ref=DOC-01';
  assert.equal(localeURL(`https://example.com/hub?theme=dark${hash}`, 'vi'), `/hub?theme=dark&lang=vi${hash}`);
  assert.equal(localeURL(`https://example.com/?lang=vi${hash}`, 'en'), `/?lang=en${hash}`);
});

test('Changing language preserves Directory filters, member IDs and navigation instead of reloading', () => {
  for (const hash of ['#directory?scope=all&country=TH&q=AR', '#crew?country=VN', '#member?id=ice', '#start']) {
    assert.equal(localeURL(`https://example.com/?lang=en${hash}`, 'vi'), `/?lang=vi${hash}`);
  }
  const state = readFileSync(new URL('../src/i18n/index.ts', import.meta.url), 'utf8');
  assert.match(state, /history\.replaceState/);
  assert.doesNotMatch(state, /location\.(?:reload|assign)|\.fit\(|:key/);
});
