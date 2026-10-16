import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build, transform } from 'esbuild';
import { createLocaleHarness } from './localeHarness.mjs';

const require = createRequire(import.meta.url), Vue = require('vue');
const { renderToString } = require('vue/server-renderer');
async function bundled(path) {
  const output = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`);
}
const { crew } = await bundled('../src/data/crew.ts'), helpers = await bundled('../src/data/crewDirectory.ts');
const fleetMotion = await bundled('../src/services/fleetMotion.ts');
const compiled = {};
for (const name of ['SectorView', 'MemberView', 'MemberPortfolio', 'CrewSourceNotice', 'PortfolioColumnFilter']) {
  const { descriptor } = parse(readFileSync(new URL(`../src/components/${name}.vue`, import.meta.url), 'utf8'), { filename: name + '.vue' });
  compiled[name] = (await transform(compileScript(descriptor, { id: name, inlineTemplate: true }).content, { loader: 'ts', format: 'cjs', target: 'es2022' })).code;
}
const rows = [
  { member: 'Huệ', country: 'VN', brand: 'Brand A', class: 'Retail', complexity: 'Standard', platforms: ['Tiktok', 'SHOPEE'] },
  { member: 'Huệ', country: 'TH', brand: 'brand a', class: 'Retail', complexity: 'Exceptional', platforms: ['TikTok Shop', 'Shopee', 'Lazada'] },
  { member: 'Huệ', country: 'VN', brand: 'Brand B', class: 'Agency', complexity: 'Standard', platforms: ['tiktok shop', ' '] },
];
function runtime(portfolioRows = rows) {
  const locale = createLocaleHarness('en'), components = new Map();
  const portfolioFilters = Vue.reactive({ query: '', country: 'all', platform: 'all', complexity: 'all', sort: 'brand' });
  const state = {
    selectedMember: Vue.ref(crew.find(member => member.id === 'hue')), memberScope: () => portfolioRows,
    source: Vue.ref('live'), isLoading: Vue.ref(false), refreshedAt: Vue.ref('2026-10-16T00:00:00Z'),
    scope: Vue.ref('all'), workspaceLinks: Vue.ref([]), categories: Vue.ref([{ id: 'review-cockpits', name: 'Review' }, { id: 'project-workspace', name: 'Projects' }]),
    filters: Vue.reactive({ query: '', country: 'all', status: 'all', criticality: 'all' }),
    viewMode: Vue.ref('compact'), directoryQuickView: Vue.ref('all'), countryCounts: Vue.ref(new Map([['all', 0], ['VN', 0]])), criticalOnly: Vue.ref(false),
    error: Vue.ref(), hasActiveFilters: Vue.ref(false), openCrew() {}, clearFilters() {}, goHome() {}, previewDirectory() {},
  };
  function component(name) {
    if (components.has(name)) return components.get(name);
    const context = vm.createContext({ module: { exports: {} }, Intl, Date, require(path) {
      if (path === 'vue') return Vue;
      if (path === '../i18n') return { useLocale: () => locale };
      if (path === '../data/crewDirectory') return helpers;
      if (path === '../services/fleetMotion') return fleetMotion;
      if (path === '../types/links') return { CATEGORY_IDS: ['review-cockpits', 'project-workspace'] };
      if (path === '../composables/useLinks') return { useLinks: () => state };
      if (path === '../composables/useCrewDirectory') return { useMemberPortfolioFilters: () => portfolioFilters };
      if (path === './Icon.vue' || path === './StarfighterIcon.vue') return Vue.defineComponent({ setup: () => () => Vue.h('i') });
      if (path === './VaultTable.vue' || path === './VaultCard.vue' || path === './SkeletonCard.vue') return Vue.defineComponent({ setup: () => () => Vue.h('div') });
      const child = path.match(/^\.\/(\w+)\.vue$/)?.[1];
      if (child && compiled[child]) return component(child);
      throw new Error('Unexpected polish import ' + path);
    } });
    vm.runInContext(compiled[name], context); components.set(name, context.module.exports.default);
    return context.module.exports.default;
  }
  return { locale, state, portfolioFilters, component, render: (name, props = {}) => renderToString(Vue.createSSRApp(component(name), props)) };
}

test('Directory places source beside search, keeps timestamp in tooltip and removes duplicate filter/refresh controls', async () => {
  const app = runtime();
  let html = await app.render('SectorView');
  assert.match(html, /directory__search-row/); assert.match(html, /directory__source-tooltip[^>]*role="tooltip">Fetched /);
  assert.doesNotMatch(html, /directory__fetch-time|directory__chips|directory__filter-button|directory-filters|Refresh source/);
  for (const label of ['Country', 'View', 'Category', 'Review Cockpits', 'Project Workspace', 'Analytics &amp; Automation']) assert.ok(html.includes(label), label);
  assert.match(html, /value="VN">VN · 0/);
  for (const label of ['Country', 'Resource type', 'Category']) assert.ok(html.includes(`aria-label="${label}"`), `${label} stays accessible when its visible label is hidden on mobile`);
  app.state.filters.status = 'Review'; app.state.filters.criticality = 'High';
  html = await app.render('SectorView');
  assert.match(html, /Status: Review required/); assert.match(html, /Priority: High/);
});

test('Compact member portfolio uses five header filters and accurate source-grain counts with no large filter form', async () => {
  const app = runtime(), html = await app.render('MemberPortfolio', { rows, memberId: 'hue' });
  assert.equal((html.match(/class="column-filter(?:"| )/g) ?? []).length, 5);
  assert.match(html, /Unique brand names<\/dt><dd>2/); assert.match(html, /Scope rows<\/dt><dd>3/); assert.match(html, /Platforms<\/dt><dd>3/);
  assert.match(html, /Neither measures workload, exposure or performance/);
  assert.doesNotMatch(html, /class="portfolio-filters|class="portfolio-search|portfolioIntro/);
  assert.match(html, /portfolio-table-wrap vph-scroll/);
});

function nodes(value) {
  if (Array.isArray(value)) return value.flatMap(nodes);
  return value && typeof value === 'object' ? [value, ...nodes(value.children)] : [];
}

test('Header model filter and other column facets combine, reset, and never change source totals', () => {
  const app = runtime(), render = app.component('MemberPortfolio').setup({ rows, memberId: 'hue' }, { expose() {} });
  const current = () => nodes(render({}, []));
  const modelColumn = () => current().find(node => node.props?.label === 'Model / class');
  const modelSelect = () => nodes(modelColumn().children.default()).find(node => node.type === 'select');
  modelSelect().props['onUpdate:modelValue']('Agency');
  let tree = current();
  assert.equal(modelColumn().props.active, true);
  assert.equal(tree.filter(node => node.type === 'td' && node.props?.['data-label'] === 'Brand').length, 1);
  app.portfolioFilters.country = 'TH';
  tree = current(); assert.ok(tree.some(node => node.props?.class === 'portfolio-empty'));
  const reset = tree.find(node => node.type === 'button' && node.props?.onClick);
  reset.props.onClick();
  assert.equal(modelColumn().props.active, false); assert.equal(app.portfolioFilters.country, 'all');
  assert.equal(current().filter(node => node.type === 'td' && node.props?.['data-label'] === 'Brand').length, 3);
  assert.equal(rows.length, 3); assert.equal(rows[2].class, 'Agency');
});

test('Member page remains wide and source errors are not presented as an empty assignment or successful refresh', async () => {
  const app = runtime([]);
  app.state.source.value = 'unavailable';
  let html = await app.render('MemberView');
  assert.match(html, /Published scope is not available/); assert.match(html, /not an unassigned or zero-workload state/);
  assert.doesNotMatch(html, /Refresh source|member__scroll|member__summary/);
  app.state.source.value = 'stale'; html = await app.render('MemberView');
  assert.match(html, /No rows in the retained copy/); assert.match(html, /current assignments are not confirmed/);
  app.state.source.value = 'live'; html = await app.render('CrewSourceNotice');
  assert.match(html, /title="[^"]*Fetched /); assert.doesNotMatch(html, /<small>|<button/);
});
