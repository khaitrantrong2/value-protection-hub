import { readFileSync } from 'node:fs';
import { transform } from 'esbuild';
import { ref } from 'vue';

const modules = await Promise.all(['shell', 'crew', 'directory', 'atlas'].map(async name => {
  const result = await transform(readFileSync(new URL(`../src/i18n/messages/${name}.ts`, import.meta.url), 'utf8'), { loader: 'ts', format: 'esm' });
  return (await import(`data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`)).messages;
}));
export const catalogs = { en: Object.assign({}, ...modules.map(item => item.en)), vi: Object.assign({}, ...modules.map(item => item.vi)) };
const searchCode = await transform(readFileSync(new URL('../src/services/search.ts', import.meta.url), 'utf8'), { loader: 'ts', format: 'esm' });
export const searchHelpers = await import(`data:text/javascript;base64,${Buffer.from(searchCode.code).toString('base64')}`);
export function createLocaleHarness(initial = 'en') {
  const locale = ref(initial);
  const t = (key, params = {}) => {
    const value = key.split('.').reduce((node, part) => node?.[part], catalogs[locale.value]);
    if (typeof value !== 'string') throw new Error(`Missing ${locale.value} UI message: ${key}`);
    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
  };
  return { locale, t, text: (en, vi) => locale.value === 'vi' ? vi : en, setLocale(value) { locale.value = value; } };
}
