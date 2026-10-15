import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { build } from "esbuild";
import { compileScript, parse } from "@vue/compiler-sfc";

const require = createRequire(import.meta.url);
const Vue = require("vue");
const viewPath = fileURLToPath(new URL("../src/components/atlas/AtlasView.vue", import.meta.url));
const { descriptor } = parse(readFileSync(viewPath, "utf8"), { filename: viewPath });
const compiled = compileScript(descriptor, { id: "atlas-workspace-runtime-test", inlineTemplate: true });
const bundled = await build({
  stdin: { contents: compiled.content, loader: "ts", resolveDir: fileURLToPath(new URL("../src/components/atlas/", import.meta.url)) },
  bundle: true, write: false, format: "cjs", platform: "node", logLevel: "silent", external: ["vue"],
  plugins: [{ name: "workspace-child-stubs", setup(plugin) { plugin.onResolve({ filter: /\.vue$/ }, ({ path }) => ({ path, external: true })); } }],
});

const payload = () => ({
  schemaVersion: 1,
  meta: { contentVersion: "test-business-understanding", processStatus: "Draft · no OE conclusion", updatedAt: "2026-10-15", effectiveFrom: "" },
  stages: [...Array.from({ length: 8 }, (_, index) => ({ id: `0${index + 1}`, kind: "chapter", order: index + 1, shortTitle: `Stage ${index + 1}`, referenceIds: index === 3 ? ["DOC-01"] : [], supports: [] })),
    { id: "A", kind: "supporting", order: 9, shortTitle: "Data pipeline", referenceIds: [], supports: ["02", "03", "04"] }],
  controls: [{ id: "C04", stageId: "04" }, { id: "C05", stageId: "05" }],
  references: [{ id: "DOC-01", stageId: "", group: "document-step", title: "Document 1" }],
});

function runtime({ hash = "#atlas", compact = false, ...initialProps } = {}) {
  const children = { canvas: [], detail: [], story: [], library: [] }, emitted = { refresh: 0, preview: 0 };
  const counters = { canvasMounted: 0, canvasUnmounted: 0, fit: 0 };
  const listeners = new Map(), mediaListeners = new Set(), historyEntries = [hash];
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
    matchMedia() { return { matches: compact, addEventListener(_type, callback) { mediaListeners.add(callback); }, removeEventListener(_type, callback) { mediaListeners.delete(callback); } }; },
  };
  const document = { activeElement: null };
  function node(type, text = "") {
    const element = {
      type, text, children: [], parent: null, props: {}, style: {}, tabIndex: 0, scrollTop: 0,
      get isConnected() { return !!this.parent || this.type === "root"; },
      getClientRects() { return this.isConnected ? [{}] : []; },
      focus(options) { document.activeElement = this; this.focusOptions = options; },
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
      name: `Test${kind}`, props: propNames, emits: ["select", "fit", "close", "tab", "reference", "chapter", "detail", "group", "stage", "select-stage"],
      setup(props, { emit, expose }) {
        const record = { props, emit, mounted: false };
        children[kind].push(record);
        if (kind === "canvas") expose({ fit: () => counters.fit++ });
        Vue.onMounted(() => { record.mounted = true; if (kind === "canvas") counters.canvasMounted++; });
        Vue.onBeforeUnmount(() => { record.mounted = false; if (kind === "canvas") counters.canvasUnmounted++; });
        return () => Vue.h("div", { class: rootClass }, kind === "detail" ? [Vue.h("button", {}, "Inspector button")] : []);
      },
    });
  }
  const stubs = {
    "./AtlasCanvas.vue": stub("canvas", ["stages", "references", "selectedId", "selectionKey"], "test-canvas"),
    "./AtlasStageDetail.vue": stub("detail", ["stage", "controls", "references", "activeTab"], "atlas-detail"),
    "./AtlasStory.vue": stub("story", ["stage", "chapters", "references"], "test-story"),
    "./AtlasReferenceLibrary.vue": stub("library", ["references", "stages", "group", "stageId", "referenceId", "sourceLabel", "sourceWarning", "version"], "test-library"),
    "../Icon.vue": Vue.defineComponent({ setup: () => () => Vue.h("i") }),
  };
  const context = vm.createContext({
    module: { exports: {} }, window, document, URLSearchParams,
    require(name) { if (name === "vue") return Vue; if (stubs[name]) return stubs[name]; throw new Error(`Unexpected module ${name}`); },
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
  async function openLibrary() {
    const launcher = find((element) => element.type === "button" && text(element).startsWith("Reference Library"));
    assert.ok(launcher, "Missing Reference Library launcher");
    launcher.props.onClick(); await Vue.nextTick();
  }
  function key(key, target = find((element) => element.type === "section")) {
    const event = { key, target, prevented: 0, stopped: 0, preventDefault() { this.prevented++; }, stopPropagation() { this.stopped++; } };
    find((element) => element.type === "section").props.onKeydown(event); return event;
  }
  return {
    root, props, children, counters, location, history, emitted, find, button, click, openLibrary, key, text,
    latest: (kind) => children[kind].at(-1), flush: () => Vue.nextTick(),
    unmount: () => app.unmount(),
    setCompact(value) { for (const callback of mediaListeners) callback({ matches: value }); },
  };
}

test("Real workspace preserves one Canvas instance across inspector, library and mode changes; only manual Fit calls fit", async () => {
  const view = runtime();
  try {
    const canvas = view.latest("canvas");
    assert.equal(view.counters.canvasMounted, 1);
    canvas.emit("select", "04", "04-main"); await view.flush();
    assert.equal(view.latest("detail").props.stage.id, "04");
    assert.equal(view.latest("detail").props.controls.length, 1);
    view.latest("detail").emit("tab", "controls"); await view.flush();
    assert.equal(view.latest("detail").props.activeTab, "controls");
    view.latest("detail").emit("reference", view.props.data.references[0]); await view.flush();
    assert.equal(view.latest("library").props.stageId, "04");
    assert.equal(view.latest("library").props.referenceId, "DOC-01");
    view.latest("library").emit("close"); await view.flush();
    assert.equal(view.latest("detail").props.stage.id, "04"); assert.equal(view.latest("detail").props.activeTab, "controls");
    view.latest("detail").emit("close"); await view.flush();
    assert.equal(view.latest("detail").mounted, false);
    await view.click("Walkthrough"); await view.click("Explore");
    await view.openLibrary(); view.latest("library").emit("close"); await view.flush();
    assert.equal(view.latest("canvas"), canvas); assert.equal(view.counters.canvasMounted, 1); assert.equal(view.counters.canvasUnmounted, 0);
    assert.equal(view.counters.fit, 0);
    canvas.emit("fit"); await view.flush(); assert.equal(view.counters.fit, 1);
  } finally { view.unmount(); }
});

test("Inspector Escape closes details without Fit, including focus inside the inspector", async () => {
  const view = runtime({ hash: "#atlas?stage=04&tab=controls" });
  try {
    const inspectorButton = view.find((element) => element.type === "button" && view.text(element) === "Inspector button");
    const event = view.key("Escape", inspectorButton); await view.flush();
    assert.equal(event.prevented, 1); assert.equal(view.latest("detail").mounted, false);
    assert.equal(view.latest("canvas").props.selectedId, null); assert.equal(view.counters.fit, 0);
  } finally { view.unmount(); }
});

test("Back and Forward restore stage, inspector tab and library without remounting Canvas", async () => {
  const view = runtime();
  try {
    const canvas = view.latest("canvas");
    canvas.emit("select", "04"); await view.flush();
    view.latest("detail").emit("tab", "controls"); await view.flush();
    canvas.emit("select", "05"); await view.flush();
    view.history.back(); await view.flush();
    assert.equal(view.latest("detail").props.stage.id, "04"); assert.equal(view.latest("detail").props.activeTab, "controls");
    view.history.forward(); await view.flush(); assert.equal(view.latest("detail").props.stage.id, "05");
    await view.openLibrary();
    view.history.back(); await view.flush(); assert.equal(view.latest("library").mounted, false); assert.equal(view.latest("detail").props.stage.id, "05");
    view.history.forward(); await view.flush(); assert.equal(view.latest("library").mounted, true);
    assert.equal(view.latest("canvas"), canvas); assert.equal(view.counters.fit, 0);
  } finally { view.unmount(); }
});

test("Stale source warnings and version pass into L3, and Refresh stays an explicit action", async () => {
  const warning = "Retained copy: latest source refresh failed.";
  const view = runtime({ error: warning });
  try {
    assert.equal(view.find((element) => element.props["data-source"] === "stale")?.props.role, "status");
    assert.ok(view.find((element) => element.props.role === "alert" && view.text(element) === warning));
    await view.openLibrary();
    assert.equal(view.latest("library").props.sourceWarning, warning);
    assert.equal(view.latest("library").props.sourceLabel, "Google Sheets source");
    assert.equal(view.latest("library").props.version, "test-business-understanding");
    view.latest("library").emit("close"); await view.flush();
    await view.click("Refresh source"); assert.equal(view.emitted.refresh, 1); assert.equal(view.emitted.preview, 0);
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

test("Responsive mode changes retain Canvas instance without Fit, and keep source labels honest", async () => {
  const view = runtime({ source: "demo", error: "Bundled preview · not live" });
  try {
    const canvas = view.latest("canvas");
    view.setCompact(true); await view.flush();
    assert.equal(view.button("Explore").props.disabled, true);
    view.setCompact(false); await view.flush();
    await view.openLibrary();
    assert.equal(view.latest("library").props.sourceLabel, "Demo content · not live source");
    assert.equal(view.latest("library").props.sourceWarning, "Bundled preview · not live");
    assert.equal(view.latest("canvas"), canvas);
    assert.equal(view.counters.canvasMounted, 1); assert.equal(view.counters.fit, 0);
  } finally { view.unmount(); }
});
