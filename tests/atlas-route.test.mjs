import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { transform } from "esbuild";

const source = readFileSync(new URL("../src/composables/useAtlasRouteState.ts", import.meta.url), "utf8");
const compiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const linksCompiled = await transform(readFileSync(new URL("../src/composables/useLinks.ts", import.meta.url), "utf8"), { loader: "ts", format: "cjs", target: "es2022" });

function runtime(initialHash = "#atlas") {
  const mounted = [], unmounted = [], listeners = new Map(), calls = [];
  const entries = ["/hub?source=hub" + initialHash];
  let index = 0;
  const location = { pathname: "/hub", search: "?source=hub", hash: initialHash };
  const emit = (type) => { for (const callback of listeners.get(type) ?? []) callback(); };
  function setUrl(url) {
    const parsed = new URL(url, "https://example.test" + location.pathname + location.search + location.hash);
    location.pathname = parsed.pathname; location.search = parsed.search; location.hash = parsed.hash;
  }
  const history = {
    state: { preserved: true },
    pushState(state, _title, url) { calls.push(["push", url]); this.state = state; entries.splice(index + 1); entries.push(url); index++; setUrl(url); },
    replaceState(state, _title, url) { calls.push(["replace", url]); this.state = state; entries[index] = url; setUrl(url); },
    back() { if (index > 0) { index--; setUrl(entries[index]); emit("popstate"); emit("hashchange"); } },
    forward() { if (index < entries.length - 1) { index++; setUrl(entries[index]); emit("popstate"); emit("hashchange"); } },
  };
  const vue = {
    reactive: (value) => value, ref: (value) => ({ value }), computed: (get) => ({ get value() { return get(); } }),
    onMounted: (callback) => mounted.push(callback), onBeforeUnmount: (callback) => unmounted.push(callback),
  };
  const window = {
    location, history, scrollTo() {},
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback); },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
  };
  const context = vm.createContext({
    module: { exports: {} }, window, URLSearchParams,
    require(name) {
      if (name === "vue") return vue;
      if (name === "../types/atlas") return { ATLAS_STAGE_IDS: ["01", "02", "03", "04", "05", "06", "07", "08", "A", "B"] };
      throw new Error("Unexpected module " + name);
    },
  });
  vm.runInContext(compiled.code, context);
  const api = context.module.exports;
  const route = api.useAtlasRouteState();
  mounted.forEach((callback) => callback());
  return {
    ...api, route, calls, location, history, listeners,
    unmount: () => unmounted.forEach((callback) => callback()),
    navigate(hash) { location.hash = hash; emit("hashchange"); },
    loadLinks() {
      const linksContext = vm.createContext({
        module: { exports: {} }, window,
        require(name) {
          if (name === "vue") return vue;
          if (name === "./useAtlasRouteState") return api;
          if (name === "../services/linkService") return {
            loadLinks: async () => ({ links: [], categories: [], config: {}, source: "live", portfolio: [] }),
            readCachedLinks: () => null, sortLinks: (links) => links,
          };
          throw new Error("Unexpected module " + name);
        },
      });
      vm.runInContext(linksCompiled.code, linksContext);
      return linksContext.module.exports.useLinks();
    },
  };
}

test("Root and validated deep links round-trip without camera state", () => {
  const r = runtime();
  assert.equal(r.serializeAtlasHash(r.parseAtlasHash("#atlas")), "#atlas");
  const state = r.parseAtlasHash("#atlas?stage=04&tab=controls");
  assert.equal(state.stageId, "04"); assert.equal(state.chapterId, "04"); assert.equal(state.inspectorTab, "controls");
  assert.equal(state.mode, "guide");
  assert.equal(r.serializeAtlasHash(state), "#atlas?mode=guide&stage=04&tab=controls");
  const story = r.parseAtlasHash("#atlas?mode=story&chapter=04");
  assert.equal(story.mode, "guide"); assert.equal(story.chapterId, "04");
  assert.equal(r.serializeAtlasHash(story), "#atlas?mode=guide&chapter=04");
  const guide = r.parseAtlasHash("#atlas?mode=guide&chapter=04&tab=ownership");
  assert.equal(guide.inspectorTab, "ownership");
  assert.equal(r.serializeAtlasHash(guide), "#atlas?mode=guide&chapter=04&tab=ownership");
});

test("Untrusted query fields are allowlisted and bounded", () => {
  const r = runtime();
  const state = r.parseAtlasHash("#atlas?stage=09&chapter=B&tab=html&mode=evil&library=guidance&scope=unknown&ref=https://secret.test&camera=10");
  assert.equal(state.stageId, null); assert.equal(state.chapterId, "01"); assert.equal(state.inspectorTab, "summary");
  assert.equal(state.mode, "guide"); assert.equal(state.libraryStage, ""); assert.equal(state.referenceId, null);
  assert.equal(r.parseAtlasHash("#atlas?library=all&ref=" + "X".repeat(81)).referenceId, null);
  assert.equal(r.parseAtlasHash("#atlas?stage=04&noise=" + "X".repeat(1200)).stageId, null);
  assert.equal(r.parseAtlasHash("#atlas?library=%3Cscript%3E&ref=DOC-01").libraryGroup, null);
  assert.equal(r.parseAtlasHash("#atlas?ref=DOC-01").referenceId, null);
  for (const hash of ["#atlasfoo", "#atlas/04", "#other?stage=04"]) assert.equal(r.isAtlasHash(hash), false);
});

test("Stage selection pushes history; tab changes replace and Back/Forward restore context", () => {
  const r = runtime();
  r.route.selectStage("04"); r.route.setInspectorTab("controls"); r.route.selectStage("05");
  assert.deepEqual(r.calls.map(([kind]) => kind), ["push", "replace", "push"]);
  r.history.back(); assert.equal(r.route.state.stageId, "04"); assert.equal(r.route.state.inspectorTab, "controls");
  r.history.forward(); assert.equal(r.route.state.stageId, "05"); assert.equal(r.route.state.chapterId, "05");
  assert.equal(r.history.state.preserved, true);
});

test("Guide stages support A/B without replacing the remembered numeric chapter; Explore clears reading state", () => {
  const r = runtime("#atlas?chapter=04");
  r.route.selectStage("A"); assert.equal(r.route.state.stageId, "A"); assert.equal(r.route.state.chapterId, "04");
  r.route.setGuideStage("B"); assert.equal(r.route.state.chapterId, "04"); assert.equal(r.route.state.stageId, "B");
  r.route.setChapter("06"); assert.equal(r.route.state.chapterId, "06"); assert.equal(r.route.state.stageId, "06");
  r.route.openLibrary({ group: "kpi", referenceId: "KPI-01" }); r.route.setMode("explore");
  assert.equal(r.route.state.stageId, null); assert.equal(r.route.state.chapterId, "06"); assert.equal(r.route.state.mode, "explore");
  assert.equal(r.route.state.libraryGroup, null); assert.equal(r.route.state.referenceId, null);
  assert.equal(r.location.hash, "#atlas?chapter=06");
  r.route.setMode("guide"); assert.equal(r.route.state.stageId, null); assert.equal(r.route.state.chapterId, "06");
  r.route.openGuide("A", "controls"); assert.equal(r.route.state.stageId, "A"); assert.equal(r.route.state.inspectorTab, "controls");
});

test("Reference appendix opens in Guide, preserves stage context and closes without navigating to an unrelated page", () => {
  const r = runtime("#atlas?stage=04&tab=controls");
  r.route.openLibrary({ group: "document-step", stageId: "04", referenceId: "DOC-01" });
  assert.equal(r.route.state.stageId, "04"); assert.equal(r.route.state.inspectorTab, "controls");
  assert.equal(r.route.state.referenceId, "DOC-01"); assert.equal(r.calls.at(-1)[0], "push");
  r.route.setLibraryGroup("kpi"); assert.equal(r.calls.at(-1)[0], "replace"); assert.equal(r.route.state.referenceId, null);
  r.route.setLibraryStage("B"); assert.equal(r.route.state.libraryStage, "B");
  assert.equal(r.route.state.mode, "guide");
  r.route.closeLibrary(); assert.equal(r.location.hash, "#atlas?mode=guide&stage=04&tab=controls");
  assert.equal(r.calls.at(-1)[0], "replace");
  r.route.closeStage(); assert.equal(r.route.state.stageId, null); assert.equal(r.route.state.libraryGroup, null);
  assert.equal(r.location.hash, "#atlas?mode=guide&chapter=04");
});

test("Library filters round-trip on reload and history while invalid filters do not open the library", () => {
  const r = runtime("#atlas?stage=B&tab=ownership&library=pipeline-step&scope=A&ref=PIPE-01");
  assert.equal(r.route.state.stageId, "B"); assert.equal(r.route.state.libraryGroup, "pipeline-step");
  assert.equal(r.route.state.libraryStage, "A"); assert.equal(r.route.state.referenceId, "PIPE-01");
  r.route.closeLibrary(); r.history.back();
  r.route.openLibrary(); assert.equal(r.route.state.libraryGroup, "all"); assert.equal(r.route.state.libraryStage, "");
  r.history.back(); assert.equal(r.route.state.libraryGroup, null); assert.equal(r.route.state.stageId, "B");
  r.history.forward(); assert.equal(r.route.state.libraryGroup, "all");
  r.route.setGuideStage("A"); assert.equal(r.route.state.libraryGroup, null); assert.equal(r.route.state.stageId, "A");
});

test("Opening a stage from Explore changes reading context only; legacy contradictory stage URLs never select the map", () => {
  const r = runtime("#atlas?chapter=05");
  r.route.openLibrary(); assert.equal(r.route.state.mode, "guide"); assert.equal(r.route.state.chapterId, "05");
  r.route.openGuide(); assert.equal(r.route.state.stageId, "05"); assert.equal(r.route.state.libraryGroup, null);
  r.route.setMode("explore"); assert.equal(r.route.state.stageId, null);
  const state = r.parseAtlasHash("#atlas?mode=explore&stage=04&tab=controls");
  assert.equal(state.mode, "guide"); assert.equal(state.stageId, "04");
  r.route.setMode("guide"); r.route.setInspectorTab("ownership");
  assert.equal(r.route.state.inspectorTab, "ownership");
  assert.equal(r.serializeAtlasHash(r.route.state).includes("camera"), false);
});

test("Hash listeners clean up and do not react to later navigation", () => {
  const r = runtime(); r.unmount();
  assert.equal(r.listeners.get("hashchange").size, 0); assert.equal(r.listeners.get("popstate").size, 0);
  r.navigate("#atlas?stage=08"); assert.equal(r.route.state.stageId, null);
});

test("Hub navigation recognises Atlas suffixes, clears them on exit and follows browser history", () => {
  const r = runtime("#atlas?stage=04&tab=controls");
  const links = r.loadLinks();
  assert.equal(links.view.value, "atlas");
  links.openCrew(); assert.equal(links.view.value, "crew"); assert.equal(r.location.hash, "");
  links.openAtlas(); assert.equal(links.view.value, "atlas"); assert.equal(r.location.hash, "#atlas");
  r.history.back(); assert.equal(links.view.value, "home");
  r.history.forward(); assert.equal(links.view.value, "atlas");
  r.navigate("#atlas?mode=story&chapter=07"); assert.equal(links.view.value, "atlas");
  r.navigate("#unrelated"); assert.equal(links.view.value, "home");
});
