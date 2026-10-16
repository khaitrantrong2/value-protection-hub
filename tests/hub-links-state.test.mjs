import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { build, transform } from "esbuild";
import * as vue from "vue";

const compiled = await transform(readFileSync(new URL("../src/composables/useLinks.ts", import.meta.url), "utf8"), { loader: "ts", format: "cjs", target: "es2022" });
async function load(path) {
  const output = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent", define: { "import.meta.env.VITE_LINKS_API_URL": '""' } });
  return import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
}
const hubRoute = await load("../src/composables/hubRoute.ts");
const service = await load("../src/services/linkService.ts");
const member = { id: "ice", name: "Ice", aliases: ["Ruchinan Narongphongphan"], role: "Value Protector", roleShort: "TH", rank: "guardian", active: true };
const inactive = { ...member, id: "inactive", active: false };
const link = (id) => ({ id, title: id, description: "Claimback process", url: "https://example.test/asset", owner: "Ice", category: "ar-collection", country: "TH", status: "Active", tags: [], accessNote: "", criticality: "High", sortOrder: 1, isActive: true, lastUpdated: "2026-10-16" });
const payload = (id = "live", refreshedAt = "2026-10-16T00:00:00.000Z") => ({ links: [link(id)], categories: [], config: { portalName: "Hub" }, portfolio: [{ member: "Ruchinan Narongphongphan", country: "TH", brand: id, class: "Retail", complexity: "Standard", platforms: ["Shopee"] }], source: "live", refreshedAt });
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
const settle = () => new Promise((resolve) => setImmediate(resolve));

function runtime(t, options = {}) {
  const requests = [], listeners = new Map(), historyCalls = [];
  const location = new URL(options.url ?? "https://hub.test/vph?lang=vi#home");
  const entries = [location.href]; let cursor = 0;
  const emit = (type) => { for (const callback of listeners.get(type) ?? []) callback(new Event(type)); };
  const setURL = (value) => { location.href = new URL(value, location.href).href; };
  const history = {
    state: { preserve: true },
    pushState(state, _title, value) { this.state = state; setURL(value); entries.splice(cursor + 1); entries.push(location.href); cursor++; historyCalls.push(["push", location.href]); },
    replaceState(state, _title, value) { this.state = state; setURL(value); entries[cursor] = location.href; historyCalls.push(["replace", location.href]); },
    back() { if (cursor) { cursor--; setURL(entries[cursor]); emit("popstate"); emit("hashchange"); } },
    forward() { if (cursor < entries.length - 1) { cursor++; setURL(entries[cursor]); emit("popstate"); emit("hashchange"); } },
  };
  const window = { location, history, addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback); }, dispatchEvent(event) { emit(event.type); }, scrollTo() {} };
  const context = vm.createContext({
    module: { exports: {} }, window, AbortController, Event, URLSearchParams,
    require(name) {
      if (name === "vue") return vue;
      if (name === "./useAtlasRouteState") return { isAtlasHash: (hash) => /^#atlas(?:\?|$)/.test(hash) };
      if (name === "./hubRoute") return hubRoute;
      if (name === "../data/crew") return { crew: [member, inactive] };
      if (name === "../services/linkService") return { ...service,
        readCachedLinks: () => options.cached ?? null,
        previewLinks: () => ({ ...payload("sample"), portfolio: [], source: "mock", refreshedAt: undefined }),
        loadLinks: ({ signal }) => { const request = { ...deferred(), signal }; requests.push(request); return request.promise; },
      };
      throw new Error("Unexpected useLinks test import: " + name);
    },
  });
  const effectScope = vue.effectScope(); let api;
  effectScope.run(() => { vm.runInContext(compiled.code, context); api = context.module.exports.useLinks(); });
  t.after(() => effectScope.stop());
  return { api, requests, history, location, historyCalls, emit, useLinks: context.module.exports.useLinks };
}

test("Initial source failure stays unavailable and never fabricates an empty live portfolio", async (t) => {
  const r = runtime(t);
  assert.equal(r.api.isLoading.value, true); assert.equal(r.requests.length, 1);
  r.requests[0].reject(new Error("source access failed with private details")); await settle();
  assert.equal(r.api.source.value, "unavailable"); assert.equal(r.api.error.value, "directory.unavailableWarning");
  assert.equal(r.api.refreshedAt.value, undefined); assert.equal(r.api.isLoading.value, false);
  assert.equal(r.api.links.value.length, 0); assert.equal(r.api.memberScope(member).length, 0);
});

test("Cached first paint is stale; a failed background refresh preserves portfolio and original timestamp", async (t) => {
  const cached = { ...payload("retained"), source: "stale" };
  const r = runtime(t, { cached });
  assert.equal(r.api.source.value, "stale"); assert.equal(r.api.links.value[0].id, "retained");
  assert.equal(r.api.isLoading.value, true);
  r.requests[0].reject(new Error("offline")); await settle();
  assert.equal(r.api.source.value, "stale"); assert.equal(r.api.error.value, "directory.staleWarning");
  assert.equal(r.api.refreshedAt.value, cached.refreshedAt);
  assert.equal(r.api.memberScope(member)[0].brand, "retained");
});

test("Failed refresh retains last-good live snapshot without stamping it fresh", async (t) => {
  const r = runtime(t); r.requests[0].resolve(payload("approved")); await settle();
  const stamp = r.api.refreshedAt.value;
  const refresh = r.api.refreshLinks(); r.requests[1].reject(new Error("offline")); await refresh;
  assert.equal(r.api.source.value, "stale"); assert.equal(r.api.links.value[0].id, "approved");
  assert.equal(r.api.refreshedAt.value, stamp); assert.equal(r.api.memberScope(member)[0].brand, "approved");
});

test("Newest refresh wins and an old failure cannot clear the current request loading state", async (t) => {
  const r = runtime(t);
  const second = r.api.refreshLinks(); assert.equal(r.requests[0].signal.aborted, true);
  r.requests[0].reject(new Error("old failure")); await settle();
  assert.equal(r.api.isLoading.value, true); assert.equal(r.api.error.value, undefined);
  r.requests[1].resolve(payload("newest")); await second;
  const third = r.api.refreshLinks(), fourth = r.api.refreshLinks();
  r.requests[3].resolve(payload("latest", "2026-10-16T01:00:00.000Z")); await fourth;
  r.requests[2].resolve(payload("older")); await third;
  assert.equal(r.api.links.value[0].id, "latest"); assert.equal(r.api.source.value, "live"); assert.equal(r.api.isLoading.value, false);
});

test("Explicit demo aborts live work, has no freshness stamp and a failed retry does not keep demo", async (t) => {
  const r = runtime(t); r.api.previewDirectory();
  assert.equal(r.requests[0].signal.aborted, true); assert.equal(r.api.source.value, "mock");
  assert.equal(r.api.refreshedAt.value, undefined); assert.equal(r.api.links.value[0].id, "sample");
  r.requests[0].resolve(payload("late")); await settle(); assert.equal(r.api.links.value[0].id, "sample");
  const retry = r.api.refreshLinks(); assert.equal(r.api.links.value.length, 0);
  r.requests[1].reject(new Error("unavailable")); await retry;
  assert.equal(r.api.source.value, "unavailable"); assert.equal(r.api.links.value.length, 0); assert.equal(r.api.refreshedAt.value, undefined);
});

test("All callers share one initial fetch; stable member navigation and Back/Forward preserve locale and Directory filters", async (t) => {
  const r = runtime(t, { url: "https://hub.test/vph?lang=vi&from=approved#directory?scope=ar-collection&country=TH&q=thu+tien&mode=compact" });
  assert.equal(r.api.view.value, "sector"); assert.equal(r.api.filters.query, "thu tien");
  assert.equal(r.api.scope.value, "ar-collection"); assert.equal(r.api.viewMode.value, "compact");
  assert.equal(r.useLinks().links, r.api.links); assert.equal(r.requests.length, 1);
  r.api.openCrew(); assert.equal(r.location.hash, "#crew");
  assert.equal(r.api.openMemberById("ice"), true); assert.equal(r.location.hash, "#member?id=ice");
  assert.equal(r.api.selectedMember.value.id, "ice"); assert.equal(r.api.openMemberById("inactive"), false);
  r.history.back(); assert.equal(r.api.view.value, "crew");
  r.history.back(); assert.equal(r.api.view.value, "sector"); assert.equal(r.api.filters.query, "thu tien"); assert.equal(r.api.filters.country, "TH");
  r.history.forward(); assert.equal(r.api.view.value, "crew");
  r.api.openStart(); assert.equal(r.location.hash, "#start");
  r.api.openAtlas("04"); assert.equal(r.location.hash, "#atlas?mode=guide&stage=04"); assert.equal(r.api.view.value, "atlas");
  assert.equal(r.location.search, "?lang=vi&from=approved"); assert.equal(r.history.state.preserve, true);
  r.requests[0].resolve(payload()); await settle();
});

test("Filter changes replace the Directory URL without adding keystrokes to history; root language changes retain context", async (t) => {
  const r = runtime(t, { url: "https://hub.test/vph?lang=en#directory" });
  r.api.filters.query = "công nợ"; r.api.filters.country = "TH"; r.api.filters.status = "Review";
  assert.equal(r.historyCalls.every(([kind]) => kind === "replace"), true);
  assert.match(r.location.hash, /country=TH/); assert.match(r.location.hash, /status=Review/);
  const before = r.location.hash;
  r.history.replaceState(r.history.state, "", "/vph?lang=vi" + before);
  r.emit("popstate"); assert.equal(r.api.filters.query, "công nợ"); assert.equal(r.api.filters.country, "TH");
  assert.equal(r.location.hash, before); assert.equal(r.location.search, "?lang=vi");
  r.api.clearFilters(); assert.equal(r.location.hash, "#directory"); assert.equal(r.api.hasActiveFilters.value, false);
  r.requests[0].resolve(payload()); await settle();
});
