import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";

async function loadTypescript(path) {
  const result = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

const service = await loadTypescript("../src/services/atlasService.ts");
const { atlasDemo } = await loadTypescript("../src/data/atlasDemo.ts");
const clone = (value) => JSON.parse(JSON.stringify(value));
const envelope = () => ({ ok: true, atlas: clone(atlasDemo) });

test("Demo obeys the complete public Atlas response contract", () => {
  const parsed = service.parseAtlasResponse(envelope());
  const expected = clone(atlasDemo);
  expected.stages.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  expected.references.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  assert.deepEqual(parsed, expected);
  assert.notEqual(parsed.stages[0], atlasDemo.stages[0]);
  assert.notEqual(parsed.stages[0].raci, atlasDemo.stages[0].raci);
});

test("Legacy Links API produces a recognizable fixed error, not demo content", () => {
  assert.throws(() => service.parseAtlasResponse({ links: [], categories: [], config: [] }), { message: "API chưa hỗ trợ Atlas. Cần cập nhật Apps Script." });
});

test("Unknown response fields are dropped at every nesting level", () => {
  const raw = envelope();
  raw.secret = "secret-marker";
  raw.atlas.secret = "secret-marker";
  raw.atlas.meta.secret = "secret-marker";
  raw.atlas.stages[0].privateNotes = "secret-marker";
  raw.atlas.stages[0].sipoc.privateNotes = "secret-marker";
  raw.atlas.stages[0].raci.privateNotes = "secret-marker";
  raw.atlas.controls[0].privateNotes = "secret-marker";
  raw.atlas.references[0].privateNotes = "secret-marker";
  assert.doesNotMatch(JSON.stringify(service.parseAtlasResponse(raw)), /secret-marker|privateNotes|secret/);
});

test("Markup remains plain data rather than being executed or converted to HTML", () => {
  const raw = envelope();
  raw.atlas.stages[0].title = "<script>alert('sample')</script>";
  assert.equal(service.parseAtlasResponse(raw).stages[0].title, raw.atlas.stages[0].title);
});

test("Wrong scalar types and malformed required structures fail closed", () => {
  const changes = [
    (p) => { p.schemaVersion = "1"; },
    (p) => { p.stages = {}; },
    (p) => { p.stages[0].title = true; },
    (p) => { delete p.stages[0].sipoc; },
    (p) => { p.stages[0].raci.responsible = "VP"; },
    (p) => { p.stages[0].order = "1"; },
    (p) => { p.stages[0].kind = "supporting"; },
    (p) => { p.stages[0].practiceState = "verified"; },
    (p) => { p.controls[0].evidenceState = "verified"; },
    (p) => { p.meta.updatedAt = "2026-02-30"; },
    (p) => { p.stages[0].title = "x".repeat(241); },
    (p) => { p.references[0].group = "private"; },
  ];
  for (const change of changes) {
    const raw = envelope(); change(raw.atlas);
    assert.throws(() => service.parseAtlasResponse(raw), /Dữ liệu Atlas không hợp lệ/);
  }
  for (const value of [null, undefined, [], true, "private marker"]) assert.throws(() => service.parseAtlasResponse(value), /Dữ liệu Atlas không hợp lệ/);
});

test("Reference URLs match the server allowlist and reject private or lookalike destinations", () => {
  for (const url of ["http://docs.oracle.com/", "https://docs.google.com/document/d/example", "https://drive.google.com/example", "https://system.netsuite.com/app/example", "https://localhost/", "https://gsap.com.evil.test/", "https://user:pass@gsap.com/", "javascript:alert(1)", "https://gsap.com:443/"]) {
    const raw = envelope(); raw.atlas.references[0].url = url;
    assert.throws(() => service.parseAtlasResponse(raw), /Dữ liệu Atlas không hợp lệ/);
  }
  const raw = envelope(); raw.atlas.references[0].url = "https://docs.oracle.com/en/";
  assert.equal(service.parseAtlasResponse(raw).references.find((value) => value.id === raw.atlas.references[0].id).url, raw.atlas.references[0].url);
});

test("Evidence locations cannot carry private links or filesystem paths", () => {
  for (const evidence of ["https://internal.example.test/private", "C:\\private\\file.xlsx", "\\\\server\\private"]) {
    const raw = envelope(); raw.atlas.controls[0].evidenceLocation = evidence;
    assert.throws(() => service.parseAtlasResponse(raw), /Dữ liệu Atlas không hợp lệ/);
  }
});

test("Duplicate and dangling stage/control/reference links invalidate the whole payload", () => {
  const changes = [
    (p) => { p.stages.push(clone(p.stages[0])); },
    (p) => { p.controls.push(clone(p.controls[0])); },
    (p) => { p.references.push(clone(p.references[0])); },
    (p) => { p.stages[0].referenceIds = ["MISSING"]; },
    (p) => { p.controls[0].stageId = "unknown"; },
    (p) => { p.stages.pop(); },
  ];
  for (const change of changes) {
    const raw = envelope(); change(raw.atlas);
    assert.throws(() => service.parseAtlasResponse(raw), /Dữ liệu Atlas không hợp lệ/);
  }
});

test("Empty publications stay empty, and raw API errors never reach the user", () => {
  const raw = envelope(); raw.atlas.stages = []; raw.atlas.controls = []; raw.atlas.references = [];
  assert.deepEqual(service.parseAtlasResponse(raw).stages, []);
  for (const code of ["ATLAS_INVALID", "ATLAS_UNAVAILABLE", "private marker"]) {
    assert.throws(() => service.parseAtlasResponse({ ok: false, error: { code, message: "private marker", stack: "private marker" } }), (error) => !error.message.includes("private marker"));
  }
});

test("fetchAtlas sets action=atlas, disables cache and returns only parsed fields", async (t) => {
  let requestedURL, options;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requestedURL = url; options = init;
    return new Response(JSON.stringify(envelope()), { headers: { "content-type": "application/json" } });
  });
  const response = await service.fetchAtlas("https://script.google.com/macros/s/example/exec?existing=1&action=links");
  const url = new URL(requestedURL);
  assert.equal(url.searchParams.get("action"), "atlas");
  assert.equal(url.searchParams.get("existing"), "1");
  assert.equal(options.method, "GET");
  assert.equal(options.cache, "no-store");
  assert.equal(options.credentials, "omit");
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(response.stages.length, 10);
});

test("fetchAtlas rejects unsafe API URLs before a request is made", async (t) => {
  let called = false;
  t.mock.method(globalThis, "fetch", async () => { called = true; throw new Error("private marker"); });
  for (const url of ["", "http://example.test/api", "https://localhost/api", "https://127.0.0.1/api", "https://[::1]/api", "https://user:pass@example.test/api", "https://example.test/api#private"]) {
    await assert.rejects(service.fetchAtlas(url), { message: "Địa chỉ API Atlas không hợp lệ." });
  }
  assert.equal(called, false);
});

test("fetchAtlas recognizes an old API and hides HTTP/network/JSON error details", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ links: [] })));
  await assert.rejects(service.fetchAtlas("https://example.test/api"), /API chưa hỗ trợ Atlas/);
  fetchMock.mock.mockImplementation(async () => new Response("private marker", { status: 500 }));
  await assert.rejects(service.fetchAtlas("https://example.test/api"), { message: "Không tải được Atlas. Kiểm tra kết nối rồi thử lại." });
  fetchMock.mock.mockImplementation(async () => { throw new Error("private marker in URL and credentials"); });
  await assert.rejects(service.fetchAtlas("https://example.test/api"), { message: "Không tải được Atlas. Kiểm tra kết nối rồi thử lại." });
  fetchMock.mock.mockImplementation(async () => new Response("private marker is not JSON"));
  await assert.rejects(service.fetchAtlas("https://example.test/api"), /Dữ liệu Atlas không hợp lệ/);
});

test("fetchAtlas bounds announced and streamed response bodies", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response("{}", { headers: { "content-length": "2000001" } }));
  await assert.rejects(service.fetchAtlas("https://example.test/api"), /Dữ liệu Atlas không hợp lệ/);
  fetchMock.mock.mockImplementation(async () => new Response(" ".repeat(500_101)));
  await assert.rejects(service.fetchAtlas("https://example.test/api"), /Dữ liệu Atlas không hợp lệ/);
  const oversized = new Uint8Array(2_000_001);
  fetchMock.mock.mockImplementation(async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(oversized); controller.close(); } })));
  await assert.rejects(service.fetchAtlas("https://example.test/api"), /Dữ liệu Atlas không hợp lệ/);
});

test("fetchAtlas cancellation aborts the request with a fixed AbortError", async (t) => {
  let requestedSignal;
  const fetchMock = t.mock.method(globalThis, "fetch", (_url, options) => {
    requestedSignal = options.signal;
    return new Promise(() => {});
  });
  const controller = new AbortController();
  const pending = service.fetchAtlas("https://example.test/api", controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError", message: "Đã hủy yêu cầu tải Atlas." });
  assert.equal(requestedSignal.aborted, true);
  const previousCount = fetchMock.mock.callCount();
  await assert.rejects(service.fetchAtlas("https://example.test/api", controller.signal), { name: "AbortError" });
  assert.equal(fetchMock.mock.callCount(), previousCount);
});

test("fetchAtlas has a 20-second deadline even if a request never resolves", async (t) => {
  let requestedSignal;
  t.mock.method(globalThis, "fetch", (_url, options) => { requestedSignal = options.signal; return new Promise(() => {}); });
  t.mock.method(globalThis, "setTimeout", (callback, delay) => {
    assert.equal(delay, 20_000);
    setImmediate(callback);
    return 0;
  });
  await assert.rejects(service.fetchAtlas("https://example.test/api"), { message: "Yêu cầu tải Atlas hết thời gian. Thử refresh lại." });
  assert.equal(requestedSignal.aborted, true);
});
