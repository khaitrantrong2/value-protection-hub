import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { build, transform } from "esbuild";
import { compileScript, parse } from "@vue/compiler-sfc";

const componentNames = ["AtlasStageDetail", "AtlasReferenceLibrary"];
const compiled = new Map(await Promise.all(componentNames.map(async name => {
  const source = readFileSync(new URL(`../src/components/atlas/${name}.vue`, import.meta.url), "utf8");
  const script = compileScript(parse(source).descriptor, { id: name });
  const result = await transform(script.content, { loader: "ts", format: "cjs", target: "es2022" });
  return [name, result.code];
})));
const demoBuild = await build({ entryPoints: [fileURLToPath(new URL("../src/data/atlasDemo.ts", import.meta.url))], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
const { atlasDemo } = await import(`data:text/javascript;base64,${Buffer.from(demoBuild.outputFiles[0].text).toString("base64")}`);

class Element {
  isConnected = true;
  focusCalls = [];
  scrollCalls = [];
  focus(options) { this.focusCalls.push(options); }
  scrollIntoView(options) { this.scrollCalls.push(options); }
}
class DetailsElement extends Element { open = false; }

function runtime(name, props) {
  const mounted = [], unmounted = [], watchers = [], events = [];
  const trigger = new Element();
  const context = vm.createContext({
    module: { exports: {} }, URL, HTMLElement: Element, HTMLDetailsElement: DetailsElement,
    document: { activeElement: trigger },
    require(moduleName) {
      if (moduleName === "vue") return {
        defineComponent: component => component,
        ref: value => ({ value }),
        computed: get => ({ get value() { return get(); } }),
        nextTick: () => Promise.resolve(),
        onMounted: callback => mounted.push(callback),
        onBeforeUnmount: callback => unmounted.push(callback),
        watch: (source, callback) => watchers.push({ source, callback }),
      };
      if (moduleName.endsWith(".vue")) return {};
      throw new Error(`Unexpected component dependency: ${moduleName}`);
    },
  });
  vm.runInContext(compiled.get(name), context);
  const state = context.module.exports.default.setup(props, { expose() {}, emit: (...event) => events.push(event) });
  return { state, events, trigger, watchers, async mount() { for (const callback of mounted) await callback(); }, unmount() { unmounted.forEach(callback => callback()); } };
}

function libraryProps(overrides = {}) {
  return { references: atlasDemo.references, stages: atlasDemo.stages, group: "all", stageId: "", referenceId: null, sourceLabel: "Demo content · not live source", sourceWarning: "Not the latest Google Sheet content", version: atlasDemo.meta.contentVersion, ...overrides };
}
const ids = items => Array.from(items, item => item.id);

test("Library preserves every published reference and derives all group counts", () => {
  const { state } = runtime("AtlasReferenceLibrary", libraryProps());
  assert.equal(state.resultCount.value, atlasDemo.references.length);
  assert.equal(state.availableGroups.value.length, 8);
  assert.equal(state.availableGroups.value.reduce((count, group) => count + group.count, 0), atlasDemo.references.length);
  assert.deepEqual(new Set(state.groups.value.flatMap(group => ids(group.items))), new Set(ids(atlasDemo.references)));
});

test("Stage filtering includes explicit links to shared and other-stage references", () => {
  const stages = [{ id: "01", order: 1, referenceIds: ["SHARED", "CROSS"] }, { id: "05", order: 5, referenceIds: [] }];
  const references = [
    { id: "DIRECT", stageId: "01", group: "record", order: 1 },
    { id: "SHARED", stageId: "", group: "guidance", order: 2 },
    { id: "CROSS", stageId: "05", group: "document-step", order: 3 },
    { id: "OTHER", stageId: "05", group: "record", order: 4 },
  ];
  const { state } = runtime("AtlasReferenceLibrary", libraryProps({ stages, references, stageId: "01" }));
  assert.deepEqual(ids(state.searched.value), ["DIRECT", "SHARED", "CROSS"]);
  assert.deepEqual(ids(state.relatedStages(references[2])), ["01", "05"]);
});

test("Search and type filters combine without dropping underlying reference records", () => {
  const props = libraryProps({ group: "document-step" });
  const { state } = runtime("AtlasReferenceLibrary", props);
  state.search.value = "DOC-01";
  assert.equal(state.resultCount.value, 1);
  assert.equal(state.groups.value[0].items[0].id, "DOC-01");
  state.search.value = "no matching content 72349";
  assert.equal(state.resultCount.value, 0);
  state.search.value = "";
  props.group = "all";
  assert.equal(state.resultCount.value, atlasDemo.references.length);
});

test("Library search handles markup as ordinary text and renderer rejects unsafe link schemes", () => {
  const reference = { ...atlasDemo.references[0], id: "TEXT", title: "<script>alert(1)</script>", body: "literal definition" };
  const { state } = runtime("AtlasReferenceLibrary", libraryProps({ references: [reference] }));
  state.search.value = "<SCRIPT>";
  assert.equal(state.resultCount.value, 1);
  for (const link of ["javascript:alert(1)", "http://ifrs.org/", "https://user:password@ifrs.org/", "not a URL", ""]) assert.equal(state.publicLink(link), undefined);
  assert.equal(state.publicLink("https://ifrs.org/reference"), "https://ifrs.org/reference");
});

test("Library modal lifecycle preserves source trigger focus without scrolling", async () => {
  const view = runtime("AtlasReferenceLibrary", libraryProps());
  const dialog = { opened: 0, closed: 0, showModal() { this.opened++; }, close() { this.closed++; } };
  const input = new Element();
  view.state.dialog.value = dialog;
  view.state.searchInput.value = input;
  await view.mount();
  assert.equal(dialog.opened, 1);
  assert.equal(input.focusCalls.length, 1);
  assert.equal(input.focusCalls[0].preventScroll, true);
  const event = { prevented: 0, stopped: 0, preventDefault() { this.prevented++; }, stopPropagation() { this.stopped++; } };
  view.state.cancel(event);
  assert.deepEqual(view.events[0], ["close"]);
  assert.equal(event.prevented, 1);
  assert.equal(event.stopped, 1);
  view.unmount();
  assert.equal(dialog.closed, 1);
  assert.equal(view.trigger.focusCalls[0].preventScroll, true);
});

test("Deep references open and focus only their matching summary", async () => {
  const view = runtime("AtlasReferenceLibrary", libraryProps({ referenceId: "DOC-01" }));
  const summary = new Element(), item = new DetailsElement(), other = new DetailsElement();
  item.dataset = { referenceId: "DOC-01" };
  other.dataset = { referenceId: "DOC-02" };
  item.querySelector = selector => selector === "summary" ? summary : null;
  view.state.results.value = { querySelectorAll: () => [other, item] };
  await view.state.revealReference();
  assert.equal(item.open, true);
  assert.equal(other.open, false);
  assert.equal(item.scrollCalls[0].block, "nearest");
  assert.equal(item.scrollCalls[0].behavior, "instant");
  assert.equal(summary.focusCalls[0].preventScroll, true);
});

test("Modal unmount does not focus a stage chip already removed by navigation", async () => {
  const view = runtime("AtlasReferenceLibrary", libraryProps());
  await view.mount();
  view.trigger.isConnected = false;
  view.unmount();
  assert.equal(view.trigger.focusCalls.length, 0);
});

test("Inspector arrow and Home/End tab navigation emits controlled state and keeps focus stable", async () => {
  const stage = atlasDemo.stages[0];
  const view = runtime("AtlasStageDetail", { stage, controls: [], references: [], activeTab: "summary" });
  const buttons = [new Element(), new Element(), new Element()];
  view.state.tabs.value = { querySelectorAll: () => buttons };
  const event = key => ({ key, preventDefault() { this.prevented = true; } });
  await view.state.moveTab(event("ArrowRight"), 0);
  assert.deepEqual(view.events.at(-1), ["tab", "ownership"]);
  assert.equal(buttons[1].focusCalls[0].preventScroll, true);
  await view.state.moveTab(event("End"), 0);
  assert.deepEqual(view.events.at(-1), ["tab", "controls"]);
  await view.state.moveTab(event("ArrowRight"), 2);
  assert.deepEqual(view.events.at(-1), ["tab", "summary"]);
  await view.state.moveTab(event("Home"), 2);
  assert.deepEqual(view.events.at(-1), ["tab", "summary"]);
});

test("Inspector reused for another stage resets body and focuses its close button after nextTick", async () => {
  const view = runtime("AtlasStageDetail", { stage: atlasDemo.stages[0], controls: [], references: [], activeTab: "summary" });
  const close = new Element();
  view.state.closeButton.value = close;
  view.state.body.value = { scrollTop: 200 };
  for (const watcher of view.watchers) await watcher.callback();
  assert.equal(view.state.body.value.scrollTop, 0);
  assert.equal(close.focusCalls.at(-1).preventScroll, true);
});
