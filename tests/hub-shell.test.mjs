import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { compileScript, parse } from "@vue/compiler-sfc";
import { transform } from "esbuild";

const require = createRequire(import.meta.url);
const Vue = require("vue");
const { renderToString } = require("vue/server-renderer");
const files = ["AppHeader", "CommandPalette", "CommandHero", "UniverseStage", "StartHere"];
const compiled = {};
for (const name of files) {
  const source = readFileSync(new URL(`../src/components/${name}.vue`, import.meta.url), "utf8");
  const { descriptor } = parse(source, { filename: `${name}.vue` });
  compiled[name] = {};
  for (const inlineTemplate of [false, true]) compiled[name][inlineTemplate ? "render" : "setup"] = (await transform(compileScript(descriptor, { id: `hub-shell-${name}`, inlineTemplate }).content, { loader: "ts", format: "cjs", target: "es2022" })).code;
}
async function loadModule(path) {
  const code = (await transform(readFileSync(new URL(path, import.meta.url), "utf8"), { loader: "ts", format: "cjs", target: "es2022" })).code;
  const context = vm.createContext({ module: { exports: {} }, URL });
  vm.runInContext(code, context);
  return context.module.exports;
}
const { messages: shellMessages } = await loadModule("../src/i18n/messages/shell.ts");
const { messages: crewMessages } = await loadModule("../src/i18n/messages/crew.ts");
const { messages: directoryMessages } = await loadModule("../src/i18n/messages/directory.ts");
const { crew } = await loadModule("../src/data/crew.ts");
const sectorModule = await loadModule("../src/data/sectors.ts");
const galaxyModule = await loadModule("../src/data/galaxy.ts");
const search = await loadModule("../src/services/search.ts");
const safety = await loadModule("../src/services/linkSafety.ts");
const focusScope = await loadModule("../src/services/focusScope.ts");

function runtime() {
  const locale = Vue.ref("en"), mounted = [], disposed = [], destinations = [], navigation = [];
  const links = Vue.ref([]), paletteOpen = Vue.ref(false), source = Vue.ref("live"), isLoading = Vue.ref(false), view = Vue.ref("home");
  const dictionaries = { en: { ...shellMessages.en, ...directoryMessages.en }, vi: { ...shellMessages.vi, ...directoryMessages.vi } };
  const t = (key, params = {}) => {
    const value = key.split(".").reduce((item, part) => item?.[part], dictionaries[locale.value]);
    assert.equal(typeof value, "string", `Missing ${locale.value}: ${key}`);
    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ""));
  };
  const calls = name => (...args) => navigation.push([name, ...args]);
  const state = { config: Vue.ref(null), links, paletteOpen, source, isLoading, view, openStart: calls("start"), goHome: calls("home"), openCrew: calls("crew"), openAtlas: calls("atlas"), openSector: calls("sector"), openMember: calls("member") };
  const listeners = new Map();
  const document = { hidden: false, addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name), getElementById: () => null };
  const scope = Vue.effectScope();
  const stubs = {
    vue: { ...Vue, onMounted: callback => mounted.push(callback), onBeforeUnmount: callback => disposed.push(callback) },
    "../i18n": { useLocale: () => ({ locale, t, text: (en, vi) => locale.value === 'vi' ? vi : en, setLocale: value => locale.value = value }) },
    "../i18n/messages/crew": { messages: crewMessages }, "../i18n/messages/shell": { messages: shellMessages },
    "../data/crew": { crew }, "../data/sectors": sectorModule, "../data/galaxy": galaxyModule, "../services/search": search, "../services/linkSafety": safety,
    "../services/focusScope": focusScope,
    "../composables/useLinks": { useLinks: () => state }, "../composables/useReducedMotion": { useReducedMotion: () => ({ prefersReducedMotion: Vue.ref(true) }) },
    "../motion": { gsap: { context: () => ({ revert() {} }), fromTo: () => ({ kill() {} }) }, VPH_EASE: "none" },
    "./Icon.vue": Vue.defineComponent({ setup: () => () => Vue.h("i") }), "./UniverseStage.vue": Vue.defineComponent({ setup: () => () => Vue.h("div", "universe") }), "./StarfighterIcon.vue": Vue.defineComponent({ setup: () => () => Vue.h("i") }),
    "./GalaxyPlanet.vue": Vue.defineComponent({ setup: () => () => Vue.h('i', { 'data-planet-art': true }) }),
    "./GalaxyVaultInspector.vue": Vue.defineComponent({ props: ['planet', 'resources', 'source', 'loading'], setup: props => () => Vue.h('aside', { 'data-vault-inspector': props.planet.id }, props.resources.map(link => link.title).join(' · ')) }),
    "./ProtectorFleet.vue": Vue.defineComponent({ props: ['members', 'selectedId', 'paused', 'variant'], setup: props => () => Vue.h('div', { 'data-fleet': props.variant }, props.members.map(member => Vue.h('button', { 'data-protector-id': member.id }, member.name))) }),
    "./MemberScopePanel.vue": Vue.defineComponent({ props: ['member'], setup: props => () => Vue.h('aside', { 'data-member-inspector': props.member.id }, props.member.name) }),
  };
  class FakeElement {}
  function component(name, mode) {
    const context = vm.createContext({ module: { exports: {} }, URL, HTMLElement: FakeElement, document, window: { open: (...args) => destinations.push(args) }, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, require(path) { assert.ok(stubs[path], `Unexpected import ${path}`); return stubs[path]; } });
    vm.runInContext(compiled[name][mode], context);
    return context.module.exports.default;
  }
  function setup(name) { return scope.run(() => component(name, "setup").setup({}, { expose() {} })); }
  async function render(name) { return renderToString(Vue.createSSRApp(component(name, "render"))); }
  return { locale, state, navigation, destinations, mounted, disposed, listeners, setup, render, stop: () => scope.stop() };
}
const asset = (id, url, status = "Active") => ({ id, url, status, title: `Asset ${id}`, description: "", owner: "VP", country: "VN", category: "claimback-trackers", tags: [], accessNote: "" });
const keyEvent = (key, target, extra = {}) => ({ key, target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra });

test("Header exposes all five destinations and current Team state without advertising an incomplete language switch", async () => {
  const app = runtime();
  try {
    app.state.view.value = "member";
    let html = await app.render("AppHeader");
    for (const href of ["#start", "#directory", "#crew", "#atlas"]) assert.ok(html.includes(`href="${href}"`));
    assert.match(html, /href="#crew" aria-current="page"/);
    assert.doesNotMatch(html, /aria-label="English"|aria-label="Tiếng Việt"|hdr__language|hdr__locale/);
    assert.match(html, /aria-controls="hub-mobile-menu"/);
    assert.match(html, /Skip to main content/);
    app.locale.value = "vi";
    html = await app.render("AppHeader");
    assert.doesNotMatch(html, /aria-label="English"|aria-label="Tiếng Việt"/);
    assert.match(html, /Đến nội dung chính/);
  } finally { app.stop(); }
});

test("Start here keeps three distinct routes and merges responsibilities without duplicating glossary or ownership blocks", async () => {
  const app = runtime();
  try {
    const page = app.setup("StartHere");
    page.paths.value.forEach(path => path.action());
    assert.deepEqual(app.navigation, [["atlas", "01"], ["crew"], ["sector", "all"]]);
    for (const lang of ["en", "vi"]) {
      app.locale.value = lang;
      const html = await app.render("StartHere");
      assert.equal((html.match(/<h1>/g) || []).length, 1);
      assert.equal((html.match(/<dt>/g) || []).length, 0);
      assert.equal((html.match(/class="start-station start-station--/g) || []).length, 3);
      assert.doesNotMatch(html, /<animateMotion/, 'Reduced motion suppresses introductory flight sparks');
      assert.doesNotMatch(html, /Who owns this\?|Ai phụ trách\?|A shared vocabulary|Thống nhất cách hiểu/);
      assert.match(html, lang === "en" ? /Explore Team &amp; Responsibilities/ : /Khám phá đội ngũ &amp; trách nhiệm/);
    }
  } finally { app.stop(); }
});

test("Home emphasizes the team identity in an asymmetric composition without global source badges or duplicate launch CTAs", async () => {
  const app = runtime();
  try {
    app.locale.value = "vi";
    const html = await app.render("CommandHero");
    assert.doesNotMatch(html, /SYSTEM ONLINE|Understand the process|Meet the team|Tìm trên Google Drive|hero__actions|hero__hub-search|hero__source|Live source|Retained source/);
    assert.match(html, /<h1><span>VALUE<\/span><span>PROTECTION<\/span><\/h1>/);
    assert.match(html, /class="hero__visual"/);
    assert.match(html, /INTREPID UNIVERSE/);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.deepEqual(app.destinations, []);
    assert.deepEqual(app.navigation, []);
  } finally { app.stop(); }
});

test("Hub search produces typed process/people/assets and rejects blocked, missing and unsafe asset destinations", () => {
  const app = runtime();
  try {
    app.state.links.value = [asset("safe", "https://docs.google.com/spreadsheets/d/test/edit"), asset("blocked", "https://example.com", "Blocked"), asset("missing", ""), asset("unsafe", "javascript:alert(1)")];
    const palette = app.setup("CommandPalette");
    palette.query.value = "Asset"; palette.scope.value = "assets";
    const results = palette.results.value;
    assert.equal(results.length, 4);
    assert.equal(results.filter(item => item.disabled).length, 3);
    results.forEach(item => palette.activate(item));
    assert.deepEqual(app.destinations, [["https://docs.google.com/spreadsheets/d/test/edit", "_blank", "noopener,noreferrer"]]);
    palette.query.value = "hop dong"; palette.scope.value = "process";
    assert.ok(palette.results.value.some(item => item.id === "stage-01"));
    palette.query.value = "hue"; palette.scope.value = "people";
    assert.equal(palette.results.value[0].id, "person-hue");
    palette.activate(palette.results.value[0]);
    assert.equal(app.navigation.at(-1)[1].id, "hue");
    palette.query.value = "andriani";
    assert.equal(palette.results.value.length, 0);
  } finally { app.stop(); }
});

test("Search keyboard skips disabled results, activates one eligible result and ignores keys outside its dialog", async () => {
  const app = runtime();
  try {
    app.state.links.value = [asset("blocked", "https://example.com", "Blocked"), asset("safe", "https://example.com")];
    const palette = app.setup("CommandPalette");
    const input = Vue.markRaw({ focus() {} });
    palette.dialog.value = Vue.markRaw({ contains: target => target === input, open: true, close() {} });
    palette.input.value = input;
    palette.query.value = "Asset"; palette.scope.value = "assets";
    await Vue.nextTick();
    palette.activeIndex.value = 0;
    app.state.paletteOpen.value = true;
    const event = keyEvent("ArrowDown", input);
    palette.keydown(event);
    assert.equal(palette.activeIndex.value, 1);
    assert.equal(event.defaultPrevented, true);
    palette.keydown(keyEvent("Enter", input));
    assert.equal(app.destinations.length, 1);
    app.state.paletteOpen.value = true;
    palette.activeIndex.value = 1;
    const outside = keyEvent("ArrowDown", {});
    palette.keydown(outside);
    assert.equal(outside.defaultPrevented, false);
    assert.equal(palette.activeIndex.value, 1);
  } finally { app.stop(); }
});

test("Universe planet keyboard navigation moves actual focus without navigating or moving the camera", () => {
  const app = runtime();
  try {
    const universe = app.setup("UniverseStage");
    const focusedPlanet = Vue.markRaw({ tagName: "BUTTON", matches: selector => selector === '.galaxy__planet' });
    const focused = [];
    const buttons = [focusedPlanet, ...galaxyModule.vaultPlanets.slice(1).map((_, index) => ({ focus: options => focused.push([index + 1, options]) }))];
    universe.stageRef.value = Vue.markRaw({ querySelectorAll: () => buttons });
    universe.onKeydown(keyEvent("ArrowRight", focusedPlanet));
    assert.equal(focused.at(-1)[0], 1);
    assert.equal(focused.at(-1)[1].preventScroll, true);
    const enter = keyEvent("Enter", focusedPlanet);
    universe.onKeydown(enter);
    assert.equal(enter.defaultPrevented, false, "Native button activation inspects the correctly focused planet once");
    assert.deepEqual(app.navigation, []);
  } finally { app.stop(); }
});

test("Universe depicts vaults as ten planets and all active people as ships, never a commander core", async () => {
  const app = runtime();
  try {
    for (const lang of ['en', 'vi']) {
      app.locale.value = lang;
      const html = await app.render('UniverseStage');
      assert.equal((html.match(/data-planet="/g) || []).length, 10);
      assert.equal((html.match(/data-protector-id="/g) || []).length, 17);
      assert.match(html, /Intrepid · Value Protection Core/);
      assert.doesNotMatch(html, /Commander|One commander|ALPHA-01|data-protector-id="andriani"|stage__commander/);
      assert.match(html, /<select/);
    }
  } finally { app.stop(); }
});

test("Selecting a planet or ship opens only its inspector; Escape closes without route or camera changes", async () => {
  const app = runtime();
  try {
    app.state.links.value = [{ ...asset('one', 'https://example.com/one'), isActive: true, sortOrder: 1 }];
    const universe = app.setup('UniverseStage');
    await universe.inspectPlanet(galaxyModule.vaultPlanets[0]);
    assert.equal(universe.selectedPlanet.value.id, 'claimback-trackers');
    assert.equal(universe.resources.value.length, 1);
    assert.equal(universe.selectedMember.value, null);
    assert.deepEqual(app.navigation, []);
    universe.inspectMember(crew.find(member => member.id === 'khai'));
    assert.equal(universe.selectedPlanet.value, null);
    assert.equal(universe.selectedMember.value.id, 'khai');
    const escape = keyEvent('Escape', {}, { stopPropagation() { this.stopped = true; } });
    universe.onKeydown(escape);
    assert.equal(escape.defaultPrevented, true);
    assert.equal(escape.stopped, true);
    assert.equal(universe.selectedMember.value, null);
    assert.deepEqual(app.navigation, []);
  } finally { app.stop(); }
});

test("Search source refresh repairs an invalid active result and locale switching keeps the query", async () => {
  const app = runtime();
  try {
    app.state.links.value = [asset("one", "https://example.com/one"), asset("two", "https://example.com/two")];
    const palette = app.setup("CommandPalette");
    palette.query.value = "Asset"; palette.scope.value = "assets";
    await Vue.nextTick();
    palette.activeIndex.value = 1;
    app.state.links.value = [asset("blocked", "https://example.com", "Blocked"), asset("safe", "https://example.com/safe")];
    await Vue.nextTick();
    assert.equal(palette.results.value[palette.activeIndex.value].disabled, false);
    app.state.links.value = [asset("single", "https://example.com/single")];
    await Vue.nextTick();
    assert.equal(palette.activeIndex.value, 0);
    app.locale.value = "vi";
    await Vue.nextTick();
    assert.equal(palette.query.value, "Asset");
    assert.equal(palette.results.value[0].id, "asset-single");
    app.state.links.value = [asset("disabled", "", "Blocked")];
    await Vue.nextTick();
    palette.activate(palette.results.value[0]);
    assert.equal(app.destinations.length, 0);
  } finally { app.stop(); }
});

test("Compact Home explorer offers every active protector as well as vaults without navigation or camera changes", async () => {
  const app = runtime();
  try {
    const universe = app.setup('UniverseStage');
    universe.chooseVault({ target: { value: 'crew:hue' } });
    assert.equal(universe.selectedMember.value.id, 'hue');
    assert.equal(universe.selectedPlanet.value, null);
    assert.deepEqual(app.navigation, []);
    universe.chooseVault({ target: { value: 'crew:andriani' } });
    assert.equal(universe.selectedMember.value.id, 'hue', 'Inactive or unknown identities do not select');
    universe.chooseVault({ target: { value: 'ar-collection' } });
    await Vue.nextTick();
    assert.equal(universe.selectedPlanet.value.id, 'ar-collection');
    assert.equal(universe.selectedMember.value, null);
    const html = await app.render('UniverseStage');
    assert.equal((html.match(/value="crew:/g) || []).length, 17);
  } finally { app.stop(); }
});

function focusable(name, options = {}) {
  const calls = [];
  return Vue.markRaw({ name, tagName: "BUTTON", disabled: false, tabIndex: 0, hasTabIndex: false,
    getClientRects: () => options.hidden ? [] : [{}],
    matches(selector) { return selector === ":disabled" && this.disabled; },
    focus(settings) { calls.push(settings); }, calls, ...options });
}
function nativeDialog(items, open = true) {
  const dialog = focusable("dialog", { open, close() {}, contains: target => target === dialog || items.includes(target) });
  // A disabled button with an explicit tabindex still matches the selector's [tabindex] branch.
  dialog.querySelectorAll = () => items.filter(item => !item.disabled || item.hasTabIndex);
  return dialog;
}

test("Dialog focus scope wraps Tab and Shift+Tab, preserving native movement between interior controls", () => {
  const first = focusable("first"), middle = focusable("middle"), last = focusable("last");
  const dialog = nativeDialog([first, middle, last]);
  const forward = keyEvent("Tab", last);
  focusScope.containDialogFocus(forward, dialog);
  assert.equal(forward.defaultPrevented, true);
  assert.equal(first.calls.at(-1).preventScroll, true);
  const backward = keyEvent("Tab", first, { shiftKey: true });
  focusScope.containDialogFocus(backward, dialog);
  assert.equal(backward.defaultPrevented, true);
  assert.equal(last.calls.at(-1).preventScroll, true);
  const interior = keyEvent("Tab", middle);
  focusScope.containDialogFocus(interior, dialog);
  assert.equal(interior.defaultPrevented, false);
  const dialogTarget = keyEvent("Tab", dialog);
  focusScope.containDialogFocus(dialogTarget, dialog);
  assert.equal(dialogTarget.defaultPrevented, true);
  assert.equal(first.calls.length, 2);
});

test("Dialog focus scope ignores disabled, hidden and negative-tabindex endpoints", () => {
  const disabled = focusable("disabled", { disabled: true, hasTabIndex: true });
  const inheritedDisabled = focusable("fieldset-disabled", { hasTabIndex: true, matches: selector => selector === ":disabled" });
  const hidden = focusable("hidden", { hidden: true });
  const negative = focusable("negative", { tabIndex: -1 });
  const first = focusable("first"), last = focusable("last");
  const dialog = nativeDialog([disabled, inheritedDisabled, hidden, negative, first, last, disabled]);
  const forward = keyEvent("Tab", last);
  focusScope.containDialogFocus(forward, dialog);
  assert.equal(forward.defaultPrevented, true);
  assert.equal(first.calls.length, 1);
  assert.equal(disabled.calls.length + inheritedDisabled.calls.length + hidden.calls.length + negative.calls.length, 0);
  const backward = keyEvent("Tab", first, { shiftKey: true });
  focusScope.containDialogFocus(backward, dialog);
  assert.equal(backward.defaultPrevented, true);
  assert.equal(last.calls.length, 1);
});

test("Dialog focus scope safely handles an empty or single-control dialog and ignores closed/non-Tab events", () => {
  const empty = nativeDialog([]);
  const emptyTab = keyEvent("Tab", empty, { shiftKey: true });
  focusScope.containDialogFocus(emptyTab, empty);
  assert.equal(emptyTab.defaultPrevented, true);
  assert.equal(empty.calls.at(-1).preventScroll, true);
  const unavailable = nativeDialog([focusable("hidden", { hidden: true }), focusable("disabled", { disabled: true })]);
  const unavailableTab = keyEvent("Tab", unavailable);
  focusScope.containDialogFocus(unavailableTab, unavailable);
  assert.equal(unavailableTab.defaultPrevented, true);
  assert.equal(unavailable.calls.length, 1);
  const only = focusable("only");
  const single = nativeDialog([only]);
  focusScope.containDialogFocus(keyEvent("Tab", only), single);
  focusScope.containDialogFocus(keyEvent("Tab", only, { shiftKey: true }), single);
  assert.equal(only.calls.length, 2);
  const closed = keyEvent("Tab", only);
  focusScope.containDialogFocus(closed, nativeDialog([only], false));
  assert.equal(closed.defaultPrevented, false);
  const enter = keyEvent("Enter", only);
  focusScope.containDialogFocus(enter, single);
  focusScope.containDialogFocus(keyEvent("Tab", only), null);
  assert.equal(enter.defaultPrevented, false);
  assert.equal(only.calls.length, 2);
});

test("Actual Palette keydown contains Shift+Tab from its input and Tab from its last available action", () => {
  const app = runtime();
  try {
    const palette = app.setup("CommandPalette");
    const input = focusable("input", { tagName: "INPUT" }), close = focusable("close"), last = focusable("last");
    const hidden = focusable("hidden", { hidden: true }), disabled = focusable("disabled", { disabled: true });
    const dialog = nativeDialog([input, close, hidden, last, disabled]);
    palette.dialog.value = dialog;
    palette.input.value = input;
    app.state.paletteOpen.value = true;
    const backward = keyEvent("Tab", input, { shiftKey: true });
    palette.keydown(backward);
    assert.equal(backward.defaultPrevented, true);
    assert.equal(last.calls.length, 1);
    const forward = keyEvent("Tab", last);
    palette.keydown(forward);
    assert.equal(forward.defaultPrevented, true);
    assert.equal(input.calls.length, 1);
    assert.equal(disabled.calls.length + hidden.calls.length, 0);
    assert.equal(app.state.paletteOpen.value, true);
    assert.equal(app.destinations.length, 0);
  } finally { app.stop(); }
});
