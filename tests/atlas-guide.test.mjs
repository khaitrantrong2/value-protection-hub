import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import * as Vue from "vue";
import { renderToString } from "@vue/server-renderer";
import { compileScript, parse } from "@vue/compiler-sfc";
import { build, transform } from "esbuild";

const guideNames = ["AtlasProcessGuide", "AtlasGuideStage", "AtlasGuideReferences"];
const sources = new Map(guideNames.map(name => [name, readFileSync(new URL(`../src/components/atlas/${name}.vue`, import.meta.url), "utf8")]));
const compiled = new Map(await Promise.all(guideNames.map(async name => {
  const script = compileScript(parse(sources.get(name)).descriptor, { id: name });
  const result = await transform(script.content, { loader: "ts", format: "cjs", target: "es2022" });
  return [name, result.code];
})));
const demoBuild = await build({ entryPoints: [fileURLToPath(new URL("../src/data/atlasDemo.ts", import.meta.url))], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
const { atlasDemo } = await import(`data:text/javascript;base64,${Buffer.from(demoBuild.outputFiles[0].text).toString("base64")}`);
const renderBuild = await build({
  entryPoints: [fileURLToPath(new URL("../src/components/atlas/AtlasProcessGuide.vue", import.meta.url))], bundle: true, write: false, format: "cjs", platform: "node", external: ["vue"], logLevel: "silent",
  plugins: [{ name: "compile-guide-templates", setup(builder) { builder.onLoad({ filter: /\.vue$/ }, args => ({ contents: compileScript(parse(readFileSync(args.path, "utf8")).descriptor, { id: args.path, inlineTemplate: true }).content, loader: "ts" })); } }],
});
const renderContext = vm.createContext({ module: { exports: {} }, require: name => { if (name === "vue") return Vue; throw new Error(`Unexpected template dependency: ${name}`); } });
vm.runInContext(renderBuild.outputFiles[0].text, renderContext);
const Guide = renderContext.module.exports.default;

function runtime(name, props) {
  const mounted = [], watchers = [], events = [];
  const context = vm.createContext({ module: { exports: {} }, URL,
    require(moduleName) {
      if (moduleName === "vue") return { defineComponent: component => component, ref: value => ({ value }), computed: get => ({ get value() { return get(); } }), nextTick: () => Promise.resolve(), onMounted: callback => mounted.push(callback), watch: (source, callback) => watchers.push({ source, callback }) };
      if (moduleName.endsWith(".vue")) return {};
      throw new Error(`Unexpected component dependency: ${moduleName}`);
    },
  });
  vm.runInContext(compiled.get(name), context);
  const state = context.module.exports.default.setup(props, { expose() {}, emit: (...event) => events.push(event) });
  return { state, watchers, events, async mount() { for (const callback of mounted) await callback(); } };
}
function guideProps(overrides = {}) { return { data: atlasDemo, stageId: "01", activeTab: "summary", referenceGroup: null, referenceId: null, sourceLabel: "Demo content · not live source", sourceWarning: "Not the latest Google Sheet content", version: atlasDemo.meta.contentVersion, ...overrides }; }
function escape(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
const ids = items => Array.from(items, item => item.id);
const renderGuide = props => renderToString(Vue.createSSRApp(Guide, props));

test("Guide navigation keeps eight business chapters separate from supporting A/B", () => {
  const props = guideProps({ stageId: "08" });
  const { state } = runtime("AtlasProcessGuide", props);
  assert.deepEqual(ids(state.chapters.value), ["01", "02", "03", "04", "05", "06", "07", "08"]);
  assert.deepEqual(ids(state.supporting.value), ["A", "B"]);
  assert.equal(state.next.value, undefined);
  assert.equal(state.previous.value.id, "07");
  props.stageId = "A";
  assert.equal(state.previous.value, undefined);
  assert.equal(state.next.value, undefined);
  assert.deepEqual(ids(state.supportedChapters.value), atlasDemo.stages.find(stage => stage.id === "A").supports);
});

test("Guide selects every control record and related reference through source IDs", () => {
  const props = guideProps();
  const { state } = runtime("AtlasProcessGuide", props);
  const controls = new Set();
  for (const stage of atlasDemo.stages) {
    props.stageId = stage.id;
    for (const item of state.controls.value) controls.add(item.id);
    assert.deepEqual(new Set(ids(state.references.value)), new Set(atlasDemo.references.filter(item => item.stageId === stage.id || stage.referenceIds.includes(item.id)).map(item => item.id)));
  }
  assert.deepEqual(controls, new Set(ids(atlasDemo.controls)));
  assert.equal(controls.size, 24);
});

test("A missing published stage does not silently substitute another chapter", () => {
  const data = { ...atlasDemo, stages: atlasDemo.stages.filter(stage => stage.id !== "05") };
  const { state } = runtime("AtlasProcessGuide", guideProps({ data, stageId: "05" }));
  assert.equal(state.selected.value, undefined);
  assert.equal(state.controls.value.length, 0);
});

test("Mobile contents routes chapter and appendix choices with stable IDs", () => {
  const props = guideProps();
  const view = runtime("AtlasProcessGuide", props);
  view.state.changeMobile({ target: { value: "stage:B" } });
  view.state.changeMobile({ target: { value: "references:document-step" } });
  assert.deepEqual(view.events, [["stage", "B"], ["references", "document-step"]]);
  props.referenceGroup = "kpi";
  assert.equal(view.state.mobileValue.value, "references:kpi");
});

test("Stage 05 parallel branches use the actual reference body and never become a serial gate", () => {
  const stage = atlasDemo.stages.find(item => item.id === "05");
  const view = runtime("AtlasGuideStage", { stage, controls: [], references: atlasDemo.references, supportStages: [] });
  assert.deepEqual(ids(view.state.branches.value), ["BRANCH-05A", "BRANCH-05B"]);
  assert.equal(view.state.branches.value[0], atlasDemo.references.find(item => item.id === "BRANCH-05A"));
});

test("Reference appendix includes all eight groups and all 46 source records", () => {
  const guide = runtime("AtlasProcessGuide", guideProps()).state;
  const props = { references: atlasDemo.references, stages: atlasDemo.stages, group: "all", groupNames: guide.groupNames, referenceId: null };
  const { state } = runtime("AtlasGuideReferences", props);
  assert.equal(state.count.value, 46);
  assert.equal(state.groups.value.length, 8);
  assert.deepEqual(new Set(state.groups.value.flatMap(group => ids(group.items))), new Set(ids(atlasDemo.references)));
  props.group = "document-step";
  assert.equal(state.count.value, 14);
  state.search.value = "DOC-01";
  assert.equal(state.count.value, 1);
  state.search.value = "not in the source 4237";
  assert.equal(state.count.value, 0);
});

test("Reference backlinks include explicit shared-record membership and HTTPS renderer guard", () => {
  const guide = runtime("AtlasProcessGuide", guideProps()).state;
  const reference = atlasDemo.references.find(item => item.id === "ROUTE-APCN");
  const { state } = runtime("AtlasGuideReferences", { references: atlasDemo.references, stages: atlasDemo.stages, group: "all", groupNames: guide.groupNames });
  assert.deepEqual(ids(state.relatedStages(reference)), atlasDemo.stages.filter(stage => stage.id === reference.stageId || stage.referenceIds.includes(reference.id)).map(stage => stage.id));
  for (const url of ["javascript:alert(1)", "http://ifrs.org/", "https://user:pass@ifrs.org/"]) assert.equal(state.publicLink(url), undefined);
  assert.equal(state.publicLink("https://ifrs.org/reference"), "https://ifrs.org/reference");
});

test("Guide initial section focus changes only document scroll and prevents focus-driven page scrolling", async () => {
  const props = guideProps({ activeTab: "controls" });
  const view = runtime("AtlasProcessGuide", props);
  const target = { getBoundingClientRect: () => ({ top: 420 }), focus(options) { this.focused = options; } };
  const pane = { scrollTop: 100, querySelector: selector => selector === "[data-guide-section=controls]" ? target : null, getBoundingClientRect: () => ({ top: 120 }) };
  view.state.documentPane.value = pane;
  await view.state.focusDocument();
  assert.equal(pane.scrollTop, 376);
  assert.equal(target.focused.preventScroll, true);
});

test("Actual Guide templates preserve each chapter narrative, SIPOC, RACI and all 24 control/evidence records", async () => {
  const seen = new Set();
  for (const stage of atlasDemo.stages) {
    const html = await renderGuide(guideProps({ stageId: stage.id }));
    for (const value of [stage.title, stage.narrative, stage.caution, stage.applicability, ...Object.values(stage.sipoc), stage.raci.accountable, ...stage.raci.responsible, ...stage.raci.consulted, ...stage.raci.informed, stage.sourceBasis, ...stage.pipeline]) if (value) assert.ok(html.includes(escape(value)), `${stage.id}: missing ${value.slice(0, 50)}`);
    for (const control of atlasDemo.controls.filter(item => item.stageId === stage.id)) {
      seen.add(control.id);
      for (const value of [control.id, control.title, control.wcgw, ...control.assertions, control.frequency, control.ownerRole, control.evidenceLocation, control.limitation, control.sourceBasis]) if (value) assert.ok(html.includes(escape(value)), `${control.id}: missing ${value.slice(0, 50)}`);
    }
    assert.match(html, /Not an approved SOP or an OE conclusion/);
    assert.match(html, /Pending approval/);
  }
  assert.equal(seen.size, 24);
});

test("Actual Stage 05 renders both parallel workstreams and appendix renders every reference body", async () => {
  const stageHtml = await renderGuide(guideProps({ stageId: "05" }));
  assert.match(stageHtml, /Parallel workstreams · not sequential gates/);
  for (const id of ["BRANCH-05A", "BRANCH-05B"]) assert.ok(stageHtml.includes(escape(atlasDemo.references.find(item => item.id === id).body)));
  const appendix = await renderGuide(guideProps({ referenceGroup: "all" }));
  for (const reference of atlasDemo.references) for (const value of [reference.id, reference.title, reference.body, reference.applicability]) if (value) assert.ok(appendix.includes(escape(value)), `${reference.id}: missing ${value.slice(0, 50)}`);
  assert.equal((appendix.match(/data-guide-reference=/g) ?? []).length, 46);
});

test("Guide templates escape source markup and keep source warnings visible", async () => {
  const stage = { ...atlasDemo.stages[0], narrative: '<script>alert("source")</script>' };
  const data = { ...atlasDemo, stages: [stage] };
  const html = await renderGuide(guideProps({ data, sourceWarning: "Live refresh failed; retained copy" }));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes('<script>alert("source")</script>'));
  assert.match(html, /Live refresh failed; retained copy/);
  assert.match(html, /role="status"/);
});
