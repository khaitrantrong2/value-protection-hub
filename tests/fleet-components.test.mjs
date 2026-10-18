import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { compileScript, parse } from '@vue/compiler-sfc';
import { transform } from 'esbuild';

const require = createRequire(import.meta.url), Vue = require('vue');
async function load(path, stubs = {}, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = path.endsWith('.vue') ? compileScript(parse(source, { filename: path }).descriptor, { id: path, inlineTemplate: true }).content : source;
  const result = await transform(compiled, { loader: 'ts', format: 'cjs', target: 'es2022' });
  const context = vm.createContext({ module: { exports: {} }, Intl, Date, Math, Number, ...globals, require(path) { assert.ok(stubs[path], `Unexpected import ${path}`); return stubs[path]; } });
  vm.runInContext(result.code, context);
  return context.module.exports;
}
const { crew } = await load('../src/data/crew.ts');
const motion = await load('../src/services/fleetMotion.ts');
const { messages } = await load('../src/i18n/messages/crew.ts');

async function runtime(componentName, scope = [], source = 'live') {
  const locale = Vue.ref('en'), callbacks = new Set(), listeners = new Map(), mediaListeners = new Set();
  const doc = { hidden: false, activeElement: null, addEventListener(key, fn) { listeners.set(key, fn); }, removeEventListener(key, fn) { if (listeners.get(key) === fn) listeners.delete(key); } };
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.props = {}; this.style = { setProperty(key, value) { this[key] = value; } }; this.parent = null; this.isConnected = true; this.tabIndex = 0; Vue.markRaw(this); }
    focus() { doc.activeElement = this; }
    contains(item) { return item === this || this.children.some(child => child.contains(item)); }
    matches(selector) { return selector === ':disabled' && !!this.props.disabled; }
    getClientRects() { return [1]; }
    querySelectorAll() { return descendants(this).filter(item => ['button', 'input', 'select', 'textarea', 'a'].includes(item.tag) || item.props.tabindex !== undefined); }
  }
  const descendants = root => root.children.flatMap(child => [child, ...descendants(child)]);
  let observer, disconnected = false;
  class ResizeObserver { constructor(callback) { this.callback = callback; observer = this; } observe() { this.callback([{ contentRect: { width: 1200, height: 500 } }]); } disconnect() { disconnected = true; } }
  const preference = { matches: false, addEventListener(_key, fn) { mediaListeners.add(fn); }, removeEventListener(_key, fn) { mediaListeners.delete(fn); } };
  const state = { source: Vue.ref(source), isLoading: Vue.ref(false), memberScope: () => scope };
  const stubs = {
    vue: Vue, gsap: { gsap: { ticker: { add(fn) { callbacks.add(fn); }, remove(fn) { callbacks.delete(fn); } } } },
    '../data/crew': { crew }, '../services/fleetMotion': motion,
    '../i18n': { useLocale: () => ({ locale, text: (en, vi) => locale.value === 'vi' ? vi : en, t(key, params = {}) { const value = key.split('.').reduce((item, part) => item?.[part], messages[locale.value]); assert.equal(typeof value, 'string', key); return value.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? ''); } }) },
    '../composables/useLinks': { useLinks: () => state },
    './StarfighterIcon.vue': Vue.defineComponent({ props: ['arch', 'color'], setup: props => () => Vue.h('svg', { 'data-hull': props.arch, 'data-accent': props.color }) }),
    './CrewSourceNotice.vue': Vue.defineComponent({ setup: () => () => Vue.h('div', 'Source status') }),
    './MemberPortfolio.vue': Vue.defineComponent({ props: ['rows', 'memberId'], setup: props => () => Vue.h('div', { 'data-portfolio-member': props.memberId }, `${props.rows.length} published rows`) }),
    './Icon.vue': Vue.defineComponent({ setup: () => () => Vue.h('i') }),
  };
  const component = (await load(`../src/components/${componentName}.vue`, stubs, { document: doc, window: { matchMedia: () => preference }, HTMLElement: Element, ResizeObserver, requestAnimationFrame: fn => fn() })).default;
  const renderer = Vue.createRenderer({
    createElement: tag => new Element(tag), createText: text => Object.assign(new Element('#text'), { text }), createComment: text => Object.assign(new Element('#comment'), { text }),
    setText: (node, text) => { node.text = text; }, setElementText: (node, text) => { node.text = text; node.children = []; },
    patchProp: (node, key, _previous, value) => { if (key === 'style') Object.assign(node.style, value); else node.props[key] = value; },
    insert(node, parent, anchor) { node.parent = parent; const index = anchor ? parent.children.indexOf(anchor) : -1; if (index < 0) parent.children.push(node); else parent.children.splice(index, 0, node); },
    remove(node) { if (node.parent) node.parent.children = node.parent.children.filter(child => child !== node); node.isConnected = false; },
    parentNode: node => node.parent, nextSibling(node) { const siblings = node.parent?.children || []; return siblings[siblings.indexOf(node) + 1] || null; },
  });
  const root = new Element('root'), props = Vue.reactive({ members: crew.filter(member => member.active !== false), variant: 'crew', paused: false });
  const selected = [];
  if (componentName === 'MemberScopePanel') { props.member = crew[0]; props.onClose = () => selected.push('closed'); }
  else props.onSelect = (member, anchor) => selected.push([member.id, anchor]);
  const app = renderer.createApp({ setup: () => () => Vue.h(component, props) });
  const trigger = new Element('button'); trigger.focus(); app.mount(root); await Vue.nextTick();
  const all = () => descendants(root), ships = () => all().filter(item => item.props['data-protector-id']);
  return { app, props, selected, state, locale, root, doc, trigger, all, ships, callbacks, listeners, mediaListeners, preference, tick(seconds = 1) { for (const fn of callbacks) fn(0, seconds * 1000); }, resized(width, height) { observer.callback([{ contentRect: { width, height } }]); }, disconnected: () => disconnected };
}

test('Actual fleet renders 17 equal ship buttons with original SVG designs and accessible names', async () => {
  const app = await runtime('ProtectorFleet');
  assert.equal(app.ships().length, 17);
  assert.equal(new Set(app.ships().map(ship => ship.props.class.replace(/fleet-ship--\w+/g, ''))).size, 1);
  assert.ok(app.ships().every(ship => ship.props['aria-label'].includes(' · ')));
  assert.ok(app.all().some(item => item.tag === 'svg'));
  const hulls = app.all().filter(item => item.props['data-hull'] !== undefined);
  // Khải flies the flagship (commander) hull in his own accent.
  assert.equal(app.all().find(item => item.props['data-hull'] === 'commander').props['data-accent'], crew.find(member => member.id === 'khai').accent);
  // Every hull carries a real livery colour, and the whole Aegis Wing class set is represented.
  assert.ok(hulls.every(item => typeof item.props['data-accent'] === 'string' && item.props['data-accent'].startsWith('#')));
  const classes = new Set(hulls.map(item => item.props['data-hull']));
  for (const hull of ['commander', 'lead', 'automation', 'guardian', 'interceptor', 'battlecruiser', 'sentinel', 'cadet']) assert.ok(classes.has(hull), hull);
  assert.ok(!app.ships().some(ship => ship.props['data-protector-id'] === 'andriani'));
  app.app.unmount();
});

test('Hover and selected ships stop while other actual ship transforms continue without camera motion', async () => {
  const app = await runtime('ProtectorFleet'), [first, second] = app.ships();
  first.props.onPointerenter(); await Vue.nextTick();
  const held = first.style.transform, moving = second.style.transform;
  app.tick(.08);
  assert.equal(first.style.transform, held);
  assert.notEqual(second.style.transform, moving);
  first.props.onPointerleave(); app.props.selectedId = second.props['data-protector-id']; await Vue.nextTick();
  const selected = second.style.transform;
  app.tick(.08);
  assert.notEqual(first.style.transform, held);
  assert.equal(second.style.transform, selected);
  app.app.unmount();
});

test('Crew depth animates hulls independently while hover, focus and selection freeze the full vessel', async () => {
  const app = await runtime('ProtectorFleet'), [first, second] = app.ships();
  const hullStyle = ship => ['--ship-heading', '--ship-bank', '--ship-pitch', '--ship-depth-scale', '--hull-brightness'].map(key => ship.style[key]);
  const initial = hullStyle(first), other = hullStyle(second);
  assert.notDeepEqual(initial, other);
  app.tick(.08);
  assert.notDeepEqual(hullStyle(first), initial);
  assert.match(first.style.transform, /^translate\([^)]+\) translate\(-50%,-50%\)$/);
  assert.equal(first.style.width, '88px'); assert.equal(first.style.height, '78px');
  first.props.onPointerenter(); await Vue.nextTick();
  const hovered = hullStyle(first), moving = hullStyle(second);
  app.tick(.08);
  assert.deepEqual(hullStyle(first), hovered); assert.notDeepEqual(hullStyle(second), moving);
  first.props.onPointerleave(); first.props.onFocus(); await Vue.nextTick();
  app.tick(.08); assert.deepEqual(hullStyle(first), hovered);
  first.props.onBlur(); app.props.selectedId = first.props['data-protector-id']; await Vue.nextTick();
  app.tick(.08); assert.deepEqual(hullStyle(first), hovered);
  app.props.selectedId = ''; await Vue.nextTick(); app.tick(.08);
  assert.notDeepEqual(hullStyle(first), hovered);
  app.app.unmount();
});

test('Language changes and filters leave remaining ship positions unchanged and selection emits bounded anchors', async () => {
  const app = await runtime('ProtectorFleet'), ship = app.ships()[0], initial = ship.style.transform;
  app.locale.value = 'vi'; app.props.members = app.props.members.slice(0, 4); await Vue.nextTick();
  assert.equal(app.ships().length, 4);
  assert.equal(app.ships()[0].style.transform, initial);
  app.ships()[0].props.onClick();
  assert.equal(app.selected[0][0], 'khai');
  assert.ok(app.selected[0][1].x > 0 && app.selected[0][1].x < 100);
  app.app.unmount();
});

test('Pause, hidden tabs and reduced-motion stop ticker; unmount removes observers and listeners', async () => {
  const app = await runtime('ProtectorFleet');
  assert.equal(app.callbacks.size, 1);
  app.props.paused = true; await Vue.nextTick(); assert.equal(app.callbacks.size, 0);
  app.props.paused = false; await Vue.nextTick(); assert.equal(app.callbacks.size, 1);
  app.doc.hidden = true; app.listeners.get('visibilitychange')(); assert.equal(app.callbacks.size, 0);
  app.doc.hidden = false; app.listeners.get('visibilitychange')(); assert.equal(app.callbacks.size, 1);
  app.preference.matches = true; for (const fn of app.mediaListeners) fn(); assert.equal(app.callbacks.size, 0);
  app.app.unmount();
  assert.equal(app.listeners.size, 0); assert.equal(app.mediaListeners.size, 0); assert.ok(app.disconnected());
});

test('Actual narrow fleet buttons keep44px minimum hitboxes without overlapping and short maps switch to static picker', async () => {
  const app = await runtime('ProtectorFleet');
  for (const height of [250, 276, 300]) {
    app.resized(288, height); await Vue.nextTick(); app.tick(.08);
    const rectangles = app.ships().map(ship => {
      const [, x, y] = ship.style.transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\)/);
      const width = parseFloat(ship.style.width), targetHeight = parseFloat(ship.style.height);
      assert.ok(width >= 44 && targetHeight >= 44);
      return { left: Number(x) - width / 2, right: Number(x) + width / 2, top: Number(y) - targetHeight / 2, bottom: Number(y) + targetHeight / 2 };
    });
    for (const [index, rect] of rectangles.entries()) {
      assert.ok(rect.left >= 0 && rect.right <= 288 && rect.top >= 0 && rect.bottom <= height);
      for (const other of rectangles.slice(index + 1)) assert.ok(rect.right <= other.left || rect.left >= other.right || rect.bottom <= other.top || rect.top >= other.bottom);
    }
  }
  app.resized(288, 200); await Vue.nextTick();
  assert.match(app.all().find(item => item.props['data-protector-fleet'] !== undefined).props.class, /protector-fleet--picker/);
  assert.equal(app.ships().length, 17); assert.equal(app.callbacks.size, 0);
  app.app.unmount();
});

test('Small Home fleet is decorative while Crew ships retain accessible44px targets', async () => {
  const app = await runtime('ProtectorFleet');
  app.props.variant = 'home'; await Vue.nextTick();
  for (const width of [288, 320, 500]) {
    app.resized(width, 300); await Vue.nextTick();
    assert.ok(app.ships().every(ship => ship.props.disabled === true && ship.props['aria-hidden'] === 'true' && ship.props.tabindex === -1));
    const before = app.ships()[0].style.transform; app.tick(.08);
    assert.notEqual(app.ships()[0].style.transform, before);
    app.ships()[0].props.onClick(); assert.equal(app.selected.length, 0);
  }
  app.resized(900, 500); await Vue.nextTick();
  assert.ok(app.ships().every(ship => !ship.props.disabled && ship.props.tabindex === 0));
  app.props.variant = 'crew'; await Vue.nextTick(); app.resized(288, 276); await Vue.nextTick();
  assert.ok(app.ships().every(ship => !ship.props.disabled && ship.props['aria-hidden'] === undefined && parseFloat(ship.style.height) >= 44));
  app.app.unmount();
});

test('Portfolio inspector is non-modal, contains its shortcuts and returns focus on Escape close', async () => {
  const app = await runtime('MemberScopePanel');
  const panel = app.all().find(item => item.props['data-hub-inspector'] !== undefined);
  assert.equal(panel.props['aria-modal'], 'false');
  assert.ok(panel.contains(app.doc.activeElement));
  let prevented = false, stopped = false;
  panel.props.onKeydown({ key: 'Escape', preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } });
  assert.ok(prevented && stopped); assert.deepEqual(app.selected, ['closed']);
  app.app.unmount(); assert.equal(app.doc.activeElement, app.trigger);
});

test('Portfolio inspector preserves source-unavailable vs live-published-empty semantics', async () => {
  const app = await runtime('MemberScopePanel', [], 'unavailable');
  const text = () => app.all().map(item => item.text || '').join(' ');
  assert.match(text(), /Published scope is not available/);
  app.state.source.value = 'live'; await Vue.nextTick(); assert.match(text(), /No published portfolio rows/);
  app.locale.value = 'vi'; await Vue.nextTick(); assert.match(text(), /Chưa có dòng danh mục công bố/);
  app.app.unmount();
});

test('Inspector Tab wraps within its interactive scope, and published rows reuse MemberPortfolio', async () => {
  const app = await runtime('MemberScopePanel', [{ brand: 'Brand A' }]);
  assert.ok(app.all().some(item => item.props['data-portfolio-member'] === 'khai'));
  const panel = app.all().find(item => item.props['data-hub-inspector'] !== undefined), items = panel.querySelectorAll();
  let prevented = false;
  panel.props.onKeydown({ key: 'Tab', target: items.at(-1), shiftKey: false, preventDefault() { prevented = true; }, stopPropagation() {} });
  assert.ok(prevented); assert.equal(app.doc.activeElement, items[0]);
  panel.props.onKeydown({ key: 'Tab', target: items[0], shiftKey: true, preventDefault() {}, stopPropagation() {} });
  assert.equal(app.doc.activeElement, items.at(-1));
  app.app.unmount();
});
