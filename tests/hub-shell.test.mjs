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
    "../i18n": { useLocale: () => ({ locale, t, setLocale: value => locale.value = value }) },
    "../i18n/messages/crew": { messages: crewMessages }, "../i18n/messages/shell": { messages: shellMessages },
    "../data/crew": { crew }, "../data/sectors": sectorModule, "../services/search": search, "../services/linkSafety": safety,
    "../services/focusScope": focusScope,
    "../composables/useLinks": { useLinks: () => state }, "../composables/useReducedMotion": { useReducedMotion: () => ({ prefersReducedMotion: Vue.ref(true) }) },
    "../motion": { gsap: { context: () => ({ revert() {} }) }, VPH_EASE: "none" },
    "./Icon.vue": Vue.defineComponent({ setup: () => () => Vue.h("i") }), "./UniverseStage.vue": Vue.defineComponent({ setup: () => () => Vue.h("div", "universe") }), "./StarfighterIcon.vue": Vue.defineComponent({ setup: () => () => Vue.h("i") }),
  };
  function component(name, mode) {
    const context = vm.createContext({ module: { exports: {} }, URL, document, window: { open: (...args) => destinations.push(args) }, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, require(path) { assert.ok(stubs[path], `Unexpected import ${path}`); return stubs[path]; } });
    vm.runInContext(compiled[name][mode], context);
    return context.module.exports.default;
  }
  function setup(name) { return scope.run(() => component(name, "setup").setup({}, { expose() {} })); }
  async function render(name) { return renderToString(Vue.createSSRApp(component(name, "render"))); }
  return { locale, state, navigation, destinations, mounted, disposed, listeners, setup, render, stop: () => scope.stop() };
}
const asset = (id, url, status = "Active") => ({ id, url, status, title: `Asset ${id}`, description: "", owner: "VP", country: "VN", category: "claimback-trackers", tags: [], accessNote: "" });
const keyEvent = (key, target, extra = {}) => ({ key, target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra });

test("Header exposes all five destinations, language choice and current Team state for member pages", async () => {
  const app = runtime();
  try {
    app.state.view.value = "member";
    let html = await app.render("AppHeader");
    for (const href of ["#start", "#directory", "#crew", "#atlas"]) assert.ok(html.includes(`href="${href}"`));
    assert.match(html, /href="#crew" aria-current="page"/);
    assert.match(html, /lang="en" aria-label="English" aria-pressed="true"/);
    assert.match(html, /aria-controls="hub-mobile-menu"/);
    assert.match(html, /Skip to main content/);
    app.locale.value = "vi";
    html = await app.render("AppHeader");
    assert.match(html, /lang="vi" aria-label="Tiếng Việt" aria-pressed="true"/);
    assert.match(html, /Đến nội dung chính/);
  } finally { app.stop(); }
});

test("Start here preserves financial distinctions and routes auditor/onboarding/daily work appropriately", async () => {
  const app = runtime();
  try {
    const page = app.setup("StartHere");
    page.paths.value.forEach(path => path.action());
    assert.deepEqual(app.navigation, [["atlas", "01"], ["crew"], ["sector", "all"]]);
    for (const lang of ["en", "vi"]) {
      app.locale.value = lang;
      const html = await app.render("StartHere");
      assert.equal((html.match(/<h1>/g) || []).length, 1);
      assert.equal((html.match(/<dt>/g) || []).length, 4);
      assert.match(html, lang === "en" ? /Settled does not always mean cash collected/ : /Tất toán không mặc định là đã thu tiền/);
    }
  } finally { app.stop(); }
});

test("Home separates external Drive search from Hub navigation and labels demo/stale source honestly", async () => {
  const app = runtime();
  try {
    const home = app.setup("CommandHero");
    home.driveQuery.value = "  June + CN & AR  ";
    home.searchDrive();
    assert.deepEqual(app.destinations, [["https://drive.google.com/drive/search?q=June%20%2B%20CN%20%26%20AR", "_blank", "noopener"]]);
    home.scanVaults();
    assert.deepEqual(app.navigation, [["sector", "all"]]);
    app.state.source.value = "mock";
    assert.equal(home.sourceLabel.value, "Demo · not live");
    app.state.source.value = "stale";
    assert.equal(home.sourceLabel.value, "Retained source · refresh failed");
    app.locale.value = "vi";
    assert.equal(home.sourceLabel.value, "Dữ liệu giữ lại · làm mới thất bại");
    assert.doesNotMatch(await app.render("CommandHero"), /SYSTEM ONLINE/);
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

test("Universe handled Enter suppresses native button activation after arrow navigation", () => {
  const app = runtime();
  try {
    const universe = app.setup("UniverseStage");
    const focusedShip = Vue.markRaw({ tagName: "BUTTON" });
    const focused = [];
    universe.stageRef.value = Vue.markRaw({ contains: target => target === focusedShip, querySelectorAll: () => sectorModule.sectors.map((_, index) => ({ focus: options => focused.push([index, options]) })) });
    universe.hoveredIndex.value = 0;
    universe.onKeydown(keyEvent("ArrowRight", focusedShip));
    assert.equal(focused.at(-1)[0], 1);
    assert.equal(focused.at(-1)[1].preventScroll, true);
    const enter = keyEvent("Enter", focusedShip);
    universe.onKeydown(enter);
    assert.equal(enter.defaultPrevented, true, "Prevent native click on the originally focused ship");
    assert.deepEqual(app.navigation, [["sector", sectorModule.sectors[1].categoryId]]);
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
