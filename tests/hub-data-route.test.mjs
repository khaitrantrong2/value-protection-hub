import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

async function load(path) {
  const result = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent", define: { "import.meta.env.VITE_LINKS_API_URL": '""' } });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

const sample = { links: [{ ID: "asset-1", Category: "SOP & Policy", Title: "Claimback SOP", URL: "https://docs.google.com/document/d/example", IsActive: true, Status: "Active" }], portfolio: [] };
const response = (value) => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });
const store = () => { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k), entries: () => [...map.entries()] }; };

test("Configured Directory failure never silently returns mock or labels an invalid payload live", async () => {
  const service = await load("../src/services/linkService.ts");
  await assert.rejects(service.loadLinks({ apiUrl: "https://example.test/api", fetcher: async () => { throw new Error("private details"); } }), /unavailable/i);
  await assert.rejects(service.loadLinks({ apiUrl: "https://example.test/api", fetcher: async () => response({ ok: false }) }), /unavailable/i);
  await assert.rejects(service.loadLinks({ apiUrl: "https://example.test/api", fetcher: async () => response({ links: [{ IsActive: true, Title: "Missing identity" }] }) }), /unavailable/i);
  await assert.rejects(service.loadLinks({ apiUrl: "https://example.test/api", fetcher: async () => response({ links: [{ ID: "missing-title", IsActive: true }] }) }), /unavailable/i);
  const empty = await service.loadLinks({ apiUrl: "https://example.test/api", fetcher: async () => response({ links: [], portfolio: [] }), storage: null });
  assert.equal(empty.source, "live"); assert.equal(empty.links.length, 0);
  await assert.rejects(service.loadLinks({ apiUrl: "https://example.test/api", fetcher: async () => response({ ...sample, links: [sample.links[0], sample.links[0]] }) }), /unavailable/i);
});

test("Directory cache is source-specific, validated and truthfully stale with original fetch time", async () => {
  const service = await load("../src/services/linkService.ts");
  const storage = store();
  const live = await service.loadLinks({ apiUrl: "https://example.test/a", fetcher: async () => response(sample), storage });
  assert.equal(live.source, "live");
  const cached = service.readCachedLinks({ apiUrl: "https://example.test/a", storage });
  assert.equal(cached.source, "stale"); assert.equal(cached.refreshedAt, live.refreshedAt);
  assert.equal(service.readCachedLinks({ apiUrl: "https://example.test/b", storage }), null);
  assert.equal(service.previewLinks().source, "mock"); assert.equal(service.previewLinks().refreshedAt, undefined);
});

test("Malformed, expired and future-dated cached copies are never promoted into a Directory snapshot", async () => {
  const service = await load("../src/services/linkService.ts");
  const storage = store(), apiUrl = "https://example.test/a";
  await service.loadLinks({ apiUrl, fetcher: async () => response(sample), storage });
  const [key, original] = storage.entries()[0];
  for (const offset of [-11 * 60 * 1000, 60 * 1000]) {
    const record = JSON.parse(original); record.ts = Date.now() + offset; record.result.refreshedAt = new Date(record.ts).toISOString();
    storage.setItem(key, JSON.stringify(record)); assert.equal(service.readCachedLinks({ apiUrl, storage }), null);
  }
  const malformed = JSON.parse(original); malformed.result.links[0].url = [];
  storage.setItem(key, JSON.stringify(malformed)); assert.equal(service.readCachedLinks({ apiUrl, storage }), null);
  storage.setItem(key, "invalid json"); assert.equal(service.readCachedLinks({ apiUrl, storage }), null);
});

test("Oversized responses and private error messages remain generic source errors", async () => {
  const service = await load("../src/services/linkService.ts");
  const apiUrl = "https://example.test/api";
  for (const fetcher of [
    async () => new Response("{}", { headers: { "content-length": String(2 * 1024 * 1024 + 1) } }),
    async () => new Response("x".repeat(2 * 1024 * 1024 + 1)),
    async () => { throw new Error("private-source-id-and-stack"); },
  ]) await assert.rejects(service.loadLinks({ apiUrl, fetcher }), (error) => /unavailable/.test(error.message) && !error.message.includes("private-source"));
});

test("Untrusted destinations reject empty, credentials, private hosts and executable schemes without stripping meaningful query", async () => {
  const { inspectLink } = await load("../src/services/linkSafety.ts");
  for (const url of ["", "javascript:alert(1)", "data:text/html,hello", "https://user:pass@example.test", "https://localhost/a", "https://localhost./a", "https://127.0.0.1/a", "https://192.168.1.5/a", "https://example.internal/a", "https://example.internal./a", "https://foo.local/a"]) assert.equal(inspectLink(url).canOpen, false, url);
  const raw = "https://account.app.netsuite.com/app/common/search/searchresults.nl?searchid=123&script=9";
  assert.equal(inspectLink(raw).url, raw);
  assert.equal(inspectLink(raw, "Blocked").canOpen, false);
  assert.equal(inspectLink("https://example.test/?_csrf=placeholder").ephemeral, true);
});

test("Vietnamese folded search and curated synonyms find one asset without duplicating records", async () => {
  const { matchesSearch } = await load("../src/services/search.ts");
  assert.equal(matchesSearch("quy trinh", "Quy trình thu hồi công nợ"), true);
  assert.equal(matchesSearch("công nợ", "AR collection tracker"), true);
  assert.equal(matchesSearch("quy trình", "Claimback process"), true);
  assert.equal(matchesSearch("không tồn tại", "Khai Tran"), false);
});

test("Hub routes restore view, stable member and allowlisted Directory filters without leaking locale into hash", async () => {
  const { parseHubHash, serializeHubHash } = await load("../src/composables/hubRoute.ts");
  const route = parseHubHash("#directory?scope=ar-collection&country=TH&status=Review&q=thu%20ti%E1%BB%81n&mode=compact");
  assert.equal(route.view, "sector"); assert.equal(route.scope, "ar-collection"); assert.equal(route.country, "TH"); assert.equal(route.query, "thu tiền");
  assert.equal(parseHubHash("#member?id=ice").memberId, "ice");
  assert.equal(parseHubHash("#start").view, "start");
  assert.equal(parseHubHash("#crew").view, "crew");
  assert.equal(parseHubHash("#atlas?mode=guide&stage=02").view, "atlas");
  assert.equal(parseHubHash("#directory?country=evil&status=pass&scope=unknown").country, "all");
  assert.equal(parseHubHash("#member?id=%3Cscript%3E").memberId, "");
  assert.equal(serializeHubHash(route).includes("lang="), false);
});
