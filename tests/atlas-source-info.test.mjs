import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { transform } from "esbuild";
import { compileScript, parse } from "@vue/compiler-sfc";
import * as Vue from "vue";
import { renderToString } from "@vue/server-renderer";

const source = readFileSync(new URL("../src/components/atlas/AtlasSourceInfo.vue", import.meta.url), "utf8");
const descriptor = parse(source).descriptor;
const compile = async inlineTemplate => (await transform(compileScript(descriptor, { id: "atlas-source-info-test", inlineTemplate }).content,
  { loader: "ts", format: "cjs", target: "es2022" })).code;
const script = await compile(false), inline = await compile(true);
const icon = { render: () => null };

class Element {
  focusCalls = [];
  focus(options) { this.focusCalls.push(options); }
}

function runtime(props, render = false) {
  const mounted = [], unmounted = [], events = [], refs = [], listeners = new Map(), removed = [];
  const scrollCalls = [], focus = new Element();
  const context = vm.createContext({
    module: { exports: {} },
    window: {
      addEventListener(name, callback) { listeners.set(name, callback); },
      removeEventListener(name, callback) { removed.push([name, callback]); if (listeners.get(name) === callback) listeners.delete(name); },
      scrollTo: (...args) => scrollCalls.push(args),
    },
    document: { activeElement: focus },
    require(name) {
      if (name === "vue") return {
        ...Vue,
        defineComponent: component => component,
        ref(value) { const ref = { value }; refs.push(ref); return ref; },
        computed: get => ({ get value() { return get(); } }),
        onMounted: callback => mounted.push(callback),
        onBeforeUnmount: callback => unmounted.push(callback),
      };
      if (name.endsWith("Icon.vue")) return icon;
      throw new Error(`Unexpected Source Info dependency: ${name}`);
    },
  });
  vm.runInContext(render ? inline : script, context);
  const state = context.module.exports.default.setup(props, { expose() {}, emit: (...event) => events.push(event) });
  const summary = new Element(), inside = new Element(), outside = new Element();
  const details = { open: true, contains: target => target === inside || target === summary };
  refs[0].value = details;
  refs[1].value = summary;
  return { state, events, refs, listeners, removed, scrollCalls, focus, details, summary, inside, outside,
    mount() { mounted.forEach(callback => callback()); }, unmount() { unmounted.forEach(callback => callback()); },
  };
}

const props = overrides => ({ source: "live", isLoading: false, meta: { processStatus: "Business-understanding draft", contentVersion: "v3" }, ...overrides });

function descendants(node) {
  if (!node || typeof node !== "object") return [];
  return [node, ...(Array.isArray(node.children) ? node.children.flatMap(descendants) : [])];
}

test("Source Info labels distinguish live, retained, demo, unavailable and initial loading", () => {
  for (const [values, expected] of [
    [{}, "Google Sheets · live source"],
    [{ error: "Refresh failed" }, "Google Sheets · retained copy"],
    [{ source: "demo" }, "Bundled demo · not live source"],
    [{ source: "demo", isLoading: true }, "Bundled demo · not live source"],
    [{ source: "unavailable" }, "Source unavailable"],
    [{ source: "unavailable", isLoading: true }, "Loading source"],
  ]) assert.equal(runtime(props(values)).state.label.value, expected);
});

test("Opening and closing Source Info never triggers an implicit refresh", () => {
  const view = runtime(props());
  view.mount();
  assert.equal(view.listeners.has("pointerdown"), true);
  view.details.open = true;
  view.state.outside({ target: view.inside });
  assert.equal(view.details.open, true);
  view.state.close();
  assert.equal(view.details.open, false);
  assert.deepEqual(view.events, []);
  assert.deepEqual(view.scrollCalls, []);
});

test("Outside pointer closes only the popover without stealing map focus or scrolling", () => {
  const view = runtime(props());
  view.mount();
  view.listeners.get("pointerdown")({ target: view.outside });
  assert.equal(view.details.open, false);
  assert.equal(view.summary.focusCalls.length, 0);
  assert.equal(view.focus.focusCalls.length, 0);
  assert.equal(view.scrollCalls.length, 0);
  assert.equal(view.events.length, 0);
});

test("Escape uses the real compiled modifier handler, closes and restores summary focus without scrolling", () => {
  const view = runtime(props(), true);
  const vnode = view.state({}, []);
  const event = { key: "Escape", prevented: 0, stopped: 0,
    preventDefault() { this.prevented++; }, stopPropagation() { this.stopped++; } };
  vnode.props.onKeydown(event);
  assert.equal(view.details.open, false);
  assert.equal(event.prevented, 1);
  assert.equal(event.stopped, 1);
  assert.equal(view.summary.focusCalls.length, 1);
  assert.equal(view.summary.focusCalls[0].preventScroll, true);
  assert.equal(view.scrollCalls.length, 0);
  assert.deepEqual(view.events, []);
});

test("Source Info removes its exact outside-pointer listener on unmount", () => {
  const view = runtime(props());
  view.mount();
  const listener = view.listeners.get("pointerdown");
  view.unmount();
  assert.equal(view.listeners.size, 0);
  assert.equal(view.removed.length, 1);
  assert.equal(view.removed[0][0], "pointerdown");
  assert.equal(view.removed[0][1], listener);
});

test("Only an explicit Refresh source click emits refresh; loading renders a disabled button", () => {
  const view = runtime(props(), true);
  const button = descendants(view.state({}, [])).find(node => node.props?.class === "source-refresh");
  assert.ok(button);
  assert.deepEqual(view.events, []);
  button.props.onClick();
  assert.deepEqual(view.events, [["refresh"]]);
  const loading = runtime(props({ isLoading: true }), true);
  const disabled = descendants(loading.state({}, [])).find(node => node.props?.class === "source-refresh");
  assert.equal(disabled.props.disabled, true);
  assert.deepEqual(loading.events, []);
});

test("Real server rendering escapes hostile metadata/error strings and retains approval caveats", async () => {
  const marker = '<img src=x onerror="alert(1)">';
  const context = vm.createContext({ module: { exports: {} }, require(name) { if (name === "vue") return Vue; if (name.endsWith("Icon.vue")) return icon; throw new Error(name); } });
  vm.runInContext(inline, context);
  const html = await renderToString(Vue.createSSRApp(context.module.exports.default,
    props({ error: marker, refreshedAt: marker, meta: { processStatus: marker, contentVersion: marker, effectiveFrom: marker, updatedAt: marker } })));
  assert.equal(html.includes(marker), false);
  assert.match(html, /&lt;img src=x onerror=/);
  assert.match(html, /not tested operating effectiveness or an approved SOP/);
  assert.doesNotMatch(descriptor.template.content, /v-html|innerHTML/);
});

test("Data Pipeline visibility never conditionally remounts the map viewport", () => {
  const canvas = parse(readFileSync(new URL("../src/components/atlas/AtlasCanvas.vue", import.meta.url), "utf8")).descriptor;
  let found = false;
  function visit(node, ancestors = []) {
    if (!node || typeof node !== "object") return;
    if (node.type === 1 && node.props?.some(prop => prop.type === 6 && prop.name === "ref" && prop.value?.content === "viewport")) {
      found = true;
      for (const ancestor of [...ancestors, node]) assert.equal(ancestor.props?.some(prop => prop.type === 7 && ["if", "show"].includes(prop.name) && /showDataPipeline/.test(prop.exp?.content || "")) ?? false, false);
    }
    for (const child of node.children || []) visit(child, node.type === 1 ? [...ancestors, node] : ancestors);
  }
  visit(canvas.template.ast);
  assert.equal(found, true);
  const compiled = compileScript(canvas, { id: "canvas-static-test" });
  const setup = canvas.scriptSetup.content;
  function inspect(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "CallExpression" && node.callee?.name === "watch") {
      const watched = setup.slice(node.arguments[0].start, node.arguments[0].end);
      if (/props\.(?:active|showDataPipeline)/.test(watched)) {
        const callback = setup.slice(node.arguments[1].start, node.arguments[1].end);
        assert.doesNotMatch(callback, /\b(?:fit|fitCamera|focus)\s*\(/);
      }
    }
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(inspect); else if (value && typeof value === "object") inspect(value);
  }
  compiled.scriptSetupAst.forEach(inspect);
});
