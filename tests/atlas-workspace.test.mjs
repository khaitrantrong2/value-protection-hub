import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { build } from "esbuild";
import { compileScript, parse } from "@vue/compiler-sfc";
import { createLocaleHarness } from './localeHarness.mjs';

const require = createRequire(import.meta.url);
const Vue = require("vue");
const viewPath = fileURLToPath(new URL("../src/components/atlas/AtlasView.vue", import.meta.url));
const { descriptor } = parse(readFileSync(viewPath, "utf8"), { filename: viewPath });
const compiled = compileScript(descriptor, { id: "atlas-workspace-runtime-test", inlineTemplate: true });
const bundled = await build({
  stdin: { contents: compiled.content, loader: "ts", resolveDir: fileURLToPath(new URL("../src/components/atlas/", import.meta.url)) },
  bundle: true, write: false, format: "cjs", platform: "node", logLevel: "silent", external: ["vue"],
  plugins: [{ name: "workspace-child-stubs", setup(plugin) { plugin.onResolve({ filter: /\.vue$/ }, ({ path }) => ({ path, external: true })); plugin.onResolve({ filter: /\/i18n$/ }, ({ path }) => ({ path, external: true })); } }],
});

const payload = () => ({
  schemaVersion: 1,
  meta: { contentVersion: "test-business-understanding", processStatus: "Draft · no OE conclusion", updatedAt: "2026-10-15", effectiveFrom: "" },
  stages: [...Array.from({ length: 8 }, (_, index) => ({ id: `0${index + 1}`, kind: "chapter", order: index + 1, shortTitle: `Stage ${index + 1}`, referenceIds: index === 3 ? ["DOC-01"] : [], supports: [] })),
    { id: "A", kind: "supporting", order: 9, shortTitle: "Data pipeline", referenceIds: [], supports: ["02", "03", "04"] }],
  controls: [{ id: "C04", stageId: "04" }, { id: "C05", stageId: "05" }],
  references: [{ id: "DOC-01", stageId: "", group: "document-step", title: "Document 1" }],
});

function runtime({ hash = "#atlas", ...initialProps } = {}) {
  const localeHarness = createLocaleHarness();
  const children = { canvas: [], guide: [], sourceInfo: [] }, emitted = { refresh: 0, preview: 0 };
  const counters = { canvasMounted: 0, canvasUnmounted: 0, fit: 0 };
  const listeners = new Map(), historyEntries = [hash];
  let historyIndex = 0;
  const location = { hash };
  const history = {
    state: { preserved: true },
    pushState(_state, _title, value) { historyEntries.splice(historyIndex + 1); historyEntries.push(value); historyIndex++; location.hash = value; },
    replaceState(_state, _title, value) { historyEntries[historyIndex] = value; location.hash = value; },
    back() { if (historyIndex > 0) { location.hash = historyEntries[--historyIndex]; notify("popstate"); notify("hashchange"); } },
    forward() { if (historyIndex + 1 < historyEntries.length) { location.hash = historyEntries[++historyIndex]; notify("popstate"); notify("hashchange"); } },
  };
  function notify(type) { for (const callback of listeners.get(type) ?? []) callback(); }
  const window = {
    location, history,
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback); },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
  };
  const document = { activeElement: null };
  function node(type, text = "") {
    const element = {
      type, text, children: [], parent: null, props: {}, style: {}, tabIndex: 0, scrollTop: 0, listeners: new Map(),
      get isConnected() { return !!this.parent || this.type === "root"; },
      getClientRects() { return this.isConnected ? [{}] : []; },
      focus(options) { document.activeElement = this; this.focusOptions = options; },
      addEventListener(event, callback) { if (!this.listeners.has(event)) this.listeners.set(event, new Set()); this.listeners.get(event).add(callback); },
      removeEventListener(event, callback) { this.listeners.get(event)?.delete(callback); },
      matches(selector) { return selector.split(",").some((item) => item.trim() === this.type); },
      closest(selector) {
        const selectors = selector.split(",").map((item) => item.trim());
        for (let current = this; current; current = current.parent) {
          if (selectors.some((item) => item.startsWith(".") ? String(current.props.class ?? "").split(/\s+/).includes(item.slice(1)) : current.type === item)) return current;
        }
        return null;
      },
      querySelector() { return null; },
    };
    return element;
  }
  function stub(kind, propNames, rootClass) {
    return Vue.defineComponent({
      name: `Test${kind}`, props: propNames, emits: ["select", "fit", "reference", "references", "stage", "map", "refresh"],
      setup(props, { emit, expose }) {
        const record = { props, emit, mounted: false };
        children[kind].push(record);
        if (kind === "canvas") expose({ fit: () => counters.fit++ });
        Vue.onMounted(() => { record.mounted = true; if (kind === "canvas") counters.canvasMounted++; });
        Vue.onBeforeUnmount(() => { record.mounted = false; if (kind === "canvas") counters.canvasUnmounted++; });
        return () => Vue.h("div", { class: rootClass }, kind === "guide" ? [Vue.h("button", {}, "Guide button")] : []);
      },
    });
  }
  const stubs = {
    "./AtlasCanvas.vue": stub("canvas", ["stages", "references", "selectedId", "active", "showDataPipeline"], "test-canvas"),
    "./AtlasProcessGuide.vue": stub("guide", ["data", "stageId", "activeTab", "referenceGroup", "referenceId", "sourceLabel", "sourceWarning", "version"], "test-guide"),
    "./AtlasSourceInfo.vue": stub("sourceInfo", ["source", "meta", "error", "refreshedAt", "isLoading"], "test-source-info"),
    "../Icon.vue": Vue.defineComponent({ setup: () => () => Vue.h("i") }),
  };
  const context = vm.createContext({
    module: { exports: {} }, window, document, URLSearchParams,
    require(name) { if (name === "vue") return Vue; if (name.endsWith('/i18n')) return { useLocale: () => localeHarness }; if (stubs[name]) return stubs[name]; throw new Error(`Unexpected module ${name}`); },
  });
  vm.runInContext(bundled.outputFiles[0].text, context);
  const AtlasView = context.module.exports.default;
  const renderer = Vue.createRenderer({
    createElement: (type) => node(type), createText: (text) => node("#text", text), createComment: (text) => node("#comment", text),
    setText(element, text) { element.text = text; },
    setElementText(element, text) { element.text = text; element.children = []; },
    parentNode: (element) => element.parent,
    nextSibling: (element) => element.parent?.children[element.parent.children.indexOf(element) + 1] ?? null,
    insert(element, parent, anchor = null) {
      if (element.parent) element.parent.children.splice(element.parent.children.indexOf(element), 1);
      element.parent = parent;
      const at = anchor ? parent.children.indexOf(anchor) : -1;
      if (at < 0) parent.children.push(element); else parent.children.splice(at, 0, element);
    },
    remove(element) { if (element.parent) element.parent.children.splice(element.parent.children.indexOf(element), 1); element.parent = null; },
    patchProp(element, key, _previous, value) { element.props[key] = value; },
  });
  const props = Vue.reactive({ data: payload(), source: "live", isLoading: false, error: undefined, refreshedAt: "2026-10-15T12:00:00Z", ...initialProps });
  const root = node("root");
  const app = renderer.createApp({ setup: () => () => Vue.h(AtlasView, { ...props, onRefresh: () => emitted.refresh++, onPreview: () => emitted.preview++ }) });
  app.mount(root);
  function all(element = root) { return [element, ...element.children.flatMap(all)]; }
  function text(element) { return element.text + element.children.filter((child) => child.type !== "#comment").map(text).join(""); }
  function find(predicate) { return all().find(predicate); }
  function button(label) { const result = find((element) => element.type === "button" && text(element).trim() === label); assert.ok(result, `Missing button ${label}`); return result; }
  async function click(label) { button(label).props.onClick(); await Vue.nextTick(); }
  async function toggleDataPipeline(value) {
    const checkbox = find((element) => element.type === "input" && element.props.type === "checkbox");
    assert.ok(checkbox, "Missing Show Data Pipeline checkbox");
    checkbox.checked = value;
    for (const callback of checkbox.listeners.get("change") ?? []) callback();
    await Vue.nextTick();
  }
  function key(key, target = find((element) => element.type === "section"), options = {}) {
    const event = { key, target, prevented: 0, stopped: 0, preventDefault() { this.prevented++; }, stopPropagation() { this.stopped++; }, ...options };
    find((element) => element.type === "section").props.onKeydown(event); return event;
  }
  return {
    root, props, children, counters, location, history, emitted, find, button, click, toggleDataPipeline, key, text, localeHarness,
    latest: (kind) => children[kind].at(-1), flush: () => Vue.nextTick(),
    unmount: () => app.unmount(),
  };
}

test("Explore is a pure map; Guide and reference reading keep the same Canvas without implicit Fit", async () => {
  const view = runtime();
  try {
    const canvas = view.latest("canvas");
    assert.equal(view.counters.canvasMounted, 1);
    assert.equal(canvas.props.selectedId, null); assert.equal(canvas.props.active, true);
    assert.equal(view.find((element) => element.type === "select"), undefined);
    assert.equal(view.find((element) => element.type === "dialog"), undefined);
    assert.equal(view.find((element) => /atlas-inspector-slot|atlas-bottom-bar|atlas-library-launcher/.test(element.props.class ?? "")), undefined);
    canvas.emit("select", "04", "04-main"); await view.flush();
    assert.equal(view.latest("guide").props.stageId, "04");
    assert.equal(view.latest("guide").props.data, view.props.data);
    assert.equal(canvas.props.active, false); assert.equal(canvas.props.selectedId, null);
    view.latest("guide").emit("reference", view.props.data.references[0]); await view.flush();
    assert.equal(view.latest("guide").props.referenceGroup, "document-step");
    assert.equal(view.latest("guide").props.referenceId, "DOC-01");
    assert.equal(view.latest("guide").props.stageId, "04");
    view.latest("guide").emit("stage", "A"); await view.flush();
    assert.equal(view.latest("guide").props.stageId, "A"); assert.equal(view.latest("guide").props.referenceGroup, null);
    view.latest("guide").emit("map"); await view.flush();
    assert.equal(view.latest("guide").mounted, false); assert.equal(canvas.props.active, true);
    await view.click("Process Guide"); await view.click("Explore");
    assert.equal(view.latest("canvas"), canvas); assert.equal(view.counters.canvasMounted, 1); assert.equal(view.counters.canvasUnmounted, 0);
    assert.equal(view.counters.fit, 0);
    canvas.emit("fit"); await view.flush(); assert.equal(view.counters.fit, 1);
  } finally { view.unmount(); }
});

test('Changing EN/VI preserves the mounted Canvas, selected Guide chapter and route without implicit Fit', async () => {
  const view = runtime({ hash: '#atlas?mode=guide&stage=04' });
  try {
    const hash = view.location.hash;
    const canvas = view.latest('canvas');
    view.localeHarness.setLocale('vi');
    await view.flush();
    assert.equal(view.location.hash, hash);
    assert.equal(view.latest('guide').props.stageId, '04');
    assert.equal(view.latest('canvas'), canvas);
    assert.deepEqual(view.counters, { canvasMounted: 1, canvasUnmounted: 0, fit: 0 });
    await view.click('Khám phá');
    view.localeHarness.setLocale('en');
    await view.flush();
    assert.equal(view.latest('canvas'), canvas);
    assert.deepEqual(view.counters, { canvasMounted: 1, canvasUnmounted: 0, fit: 0 });
  } finally { view.unmount(); }
});

test("Guide Escape returns to Explore without Fit; handled source-popover keys do not navigate", async () => {
  const view = runtime({ hash: "#atlas?stage=04&tab=controls" });
  try {
    assert.equal(view.latest("guide").props.activeTab, "controls");
    const guideButton = view.find((element) => element.type === "button" && view.text(element) === "Guide button");
    view.key("Escape", guideButton, { defaultPrevented: true }); await view.flush();
    assert.equal(view.latest("guide").mounted, true);
    const event = view.key("Escape", guideButton); await view.flush();
    assert.equal(event.prevented, 1); assert.equal(view.latest("guide").mounted, false);
    assert.equal(view.latest("canvas").props.selectedId, null); assert.equal(view.counters.fit, 0);
  } finally { view.unmount(); }
});

test("Back and Forward restore Guide stage, legacy section anchor and reference appendix without remounting Canvas", async () => {
  const view = runtime({ hash: "#atlas?stage=04&tab=controls" });
  try {
    const canvas = view.latest("canvas");
    view.latest("guide").emit("stage", "05"); await view.flush();
    view.history.back(); await view.flush();
    assert.equal(view.latest("guide").props.stageId, "04"); assert.equal(view.latest("guide").props.activeTab, "controls");
    view.history.forward(); await view.flush(); assert.equal(view.latest("guide").props.stageId, "05");
    view.latest("guide").emit("references", "kpi"); await view.flush();
    assert.equal(view.latest("guide").props.referenceGroup, "kpi");
    view.history.back(); await view.flush(); assert.equal(view.latest("guide").props.referenceGroup, null); assert.equal(view.latest("guide").props.stageId, "05");
    view.history.forward(); await view.flush(); assert.equal(view.latest("guide").props.referenceGroup, "kpi");
    await view.click("Explore"); assert.equal(canvas.props.selectedId, null); assert.equal(canvas.props.active, true);
    view.history.back(); await view.flush(); assert.equal(view.latest("guide").props.referenceGroup, "kpi");
    assert.equal(view.latest("canvas"), canvas); assert.equal(view.counters.fit, 0);
  } finally { view.unmount(); }
});

test("Stale warnings reach Source Info and Guide while Refresh stays an explicit action", async () => {
  const warning = "Retained copy: latest source refresh failed.";
  const view = runtime({ error: warning });
  try {
    assert.ok(view.find((element) => element.props.role === "status" && view.text(element) === "Retained copy"));
    assert.ok(view.find((element) => element.props.role === "alert" && view.text(element).includes("last successful source copy")));
    assert.equal(view.latest("sourceInfo").props.error, warning);
    assert.equal(view.latest("sourceInfo").props.meta.contentVersion, "test-business-understanding");
    assert.equal(view.latest("sourceInfo").props.refreshedAt, "2026-10-15T12:00:00Z");
    await view.click("Process Guide");
    assert.equal(view.latest("guide").props.sourceWarning, "The last refresh did not complete. Check Source info and retry.");
    assert.equal(view.latest("guide").props.sourceLabel, "Google Sheets · retained copy");
    assert.equal(view.latest("guide").props.version, "test-business-understanding");
    view.latest("sourceInfo").emit("refresh"); await view.flush();
    assert.equal(view.emitted.refresh, 1); assert.equal(view.emitted.preview, 0);
  } finally { view.unmount(); }
});

test("Unavailable and loading sources never silently mount demo content", async () => {
  const view = runtime({ data: null, source: "unavailable", error: "Source failed" });
  try {
    assert.equal(view.counters.canvasMounted, 0);
    assert.ok(view.find((element) => element.type === "h2" && view.text(element) === "No process content available"));
    assert.equal(view.emitted.preview, 0);
    await view.click("Preview bundled draft · not live"); assert.equal(view.emitted.preview, 1);
    view.props.isLoading = true; await view.flush();
    assert.ok(view.find((element) => element.props["aria-busy"] === "true"));
    assert.equal(view.counters.canvasMounted, 0);
  } finally { view.unmount(); }
});

test("Data Pipeline checkbox changes only its Canvas prop and preserves visibility across Guide navigation", async () => {
  const view = runtime({ source: "demo", error: "Bundled preview · not live" });
  try {
    const canvas = view.latest("canvas");
    assert.equal(canvas.props.showDataPipeline, true);
    await view.toggleDataPipeline(false); assert.equal(canvas.props.showDataPipeline, false);
    await view.click("Process Guide");
    assert.equal(view.latest("guide").props.sourceLabel, "Bundled demo · not live source");
    assert.equal(view.latest("guide").props.sourceWarning, "The last refresh did not complete. Check Source info and retry.");
    await view.click("Explore"); assert.equal(canvas.props.showDataPipeline, false);
    await view.toggleDataPipeline(true); assert.equal(canvas.props.showDataPipeline, true);
    assert.equal(view.latest("canvas"), canvas);
    assert.equal(view.counters.canvasMounted, 1); assert.equal(view.counters.fit, 0);
  } finally { view.unmount(); }
});
