import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { build, transform } from "esbuild";

const source = readFileSync(new URL("../src/composables/useAtlas.ts", import.meta.url), "utf8");
const compiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022", define: { "import.meta.env.VITE_LINKS_API_URL": "__apiUrl" } });
const serviceBuild = await build({ entryPoints: [fileURLToPath(new URL("../src/services/atlasService.ts", import.meta.url))], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
const service = await import(`data:text/javascript;base64,${Buffer.from(serviceBuild.outputFiles[0].text).toString("base64")}`);

const draft = { schemaVersion: 1, meta: { contentVersion: "generic-demo" }, stages: [], controls: [], references: [] };
const payload = (version) => ({ schemaVersion: 1, meta: { contentVersion: version }, stages: [], controls: [], references: [] });

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function runtime(apiUrl = "https://example.test/api", fetcher) {
  const calls = [];
  const context = vm.createContext({
    module: { exports: {} },
    Error, AbortController, Date,
    __apiUrl: apiUrl,
    require(name) {
      if (name === "vue") return { ref: (value) => ({ value }) };
      if (name === "../data/atlasDemo") return { atlasDemo: draft };
      if (name === "../services/atlasService") return {
        fetchAtlas: (url, signal) => {
          if (fetcher) return fetcher(url, signal);
          const pending = deferred();
          calls.push({ url, signal, ...pending });
          return pending.promise;
        },
      };
      throw new Error("Unexpected module in useAtlas test");
    },
  });
  vm.runInContext(compiled.code, context);
  return { atlas: context.module.exports.useAtlas(), useAtlas: context.module.exports.useAtlas, calls, context };
}

test("No configured API uses labelled demo without a fetch or freshness stamp", async () => {
  const noApi = runtime("   ");
  await noApi.atlas.refresh();
  assert.equal(noApi.atlas.data.value, draft);
  assert.equal(noApi.atlas.source.value, "demo");
  assert.equal(noApi.atlas.refreshedAt.value, undefined);
  assert.equal(noApi.atlas.isLoading.value, false);
  assert.equal(noApi.atlas.error.value, undefined);
  assert.equal(noApi.calls.length, 0);
});

test("Configured initial failure stays unavailable until manual preview", async () => {
  const { atlas, calls } = runtime();
  const pending = atlas.refresh();
  assert.equal(atlas.isLoading.value, true);
  calls[0].reject(new Error("API chưa hỗ trợ Atlas. Cần cập nhật Apps Script."));
  await pending;
  assert.equal(atlas.source.value, "unavailable");
  assert.equal(atlas.data.value, null);
  assert.equal(atlas.refreshedAt.value, undefined);
  assert.equal(atlas.isLoading.value, false);
  assert.match(atlas.error.value, /API chưa hỗ trợ Atlas/);
  atlas.previewDraft();
  assert.equal(atlas.source.value, "demo");
  assert.equal(atlas.data.value, draft);
  assert.match(atlas.error.value, /không phải nội dung Google Sheet mới nhất/);
});

test("Newest refresh wins even if an aborted older request later succeeds", async () => {
  const { atlas, calls } = runtime();
  const first = atlas.refresh();
  const second = atlas.refresh();
  assert.equal(calls[0].signal.aborted, true);
  assert.equal(calls[1].signal.aborted, false);
  calls[1].resolve(payload("new"));
  await second;
  const fetchedAt = atlas.refreshedAt.value;
  calls[0].resolve(payload("old"));
  await first;
  assert.equal(atlas.data.value.meta.contentVersion, "new");
  assert.equal(atlas.source.value, "live");
  assert.equal(atlas.error.value, undefined);
  assert.equal(atlas.refreshedAt.value, fetchedAt);
  assert.equal(atlas.isLoading.value, false);
});

test("Older failure/finally cannot clear the newer request's loading state", async () => {
  const { atlas, calls } = runtime();
  const first = atlas.refresh();
  const second = atlas.refresh();
  calls[0].reject(new Error("older request failed"));
  await first;
  assert.equal(atlas.isLoading.value, true);
  assert.equal(atlas.error.value, undefined);
  calls[1].resolve(payload("latest"));
  await second;
  assert.equal(atlas.isLoading.value, false);
  assert.equal(atlas.data.value.meta.contentVersion, "latest");
});

test("Failed refresh retains last-good live data and its original timestamp with an explicit stale warning", async () => {
  const { atlas, calls } = runtime();
  const first = atlas.refresh();
  calls[0].resolve(payload("last-good"));
  await first;
  const original = atlas.data.value, fetchedAt = atlas.refreshedAt.value;
  const second = atlas.refresh();
  assert.equal(atlas.data.value, original);
  assert.equal(atlas.isLoading.value, true);
  calls[1].reject(new Error("Không tải được Atlas. Kiểm tra kết nối rồi thử lại."));
  await second;
  assert.equal(atlas.data.value, original);
  assert.equal(atlas.source.value, "live");
  assert.equal(atlas.refreshedAt.value, fetchedAt);
  assert.match(atlas.error.value, /không phải dữ liệu mới/);
  assert.equal(atlas.isLoading.value, false);
});

test("Manual preview cancels pending live work and cannot be overwritten by its late result", async () => {
  const { atlas, calls } = runtime();
  const pending = atlas.refresh();
  atlas.previewDraft();
  assert.equal(calls[0].signal.aborted, true);
  assert.equal(atlas.source.value, "demo");
  assert.equal(atlas.isLoading.value, false);
  const warning = atlas.error.value;
  calls[0].resolve(payload("late-live"));
  await pending;
  assert.equal(atlas.data.value, draft);
  assert.equal(atlas.source.value, "demo");
  assert.equal(atlas.error.value, warning);
  assert.equal(atlas.refreshedAt.value, undefined);
});

test("Retry after manual preview reads live, and a retry failure does not automatically keep demo", async () => {
  const { atlas, calls } = runtime();
  atlas.previewDraft();
  const success = atlas.refresh();
  calls[0].resolve(payload("reconnected"));
  await success;
  assert.equal(atlas.source.value, "live");
  assert.equal(atlas.data.value.meta.contentVersion, "reconnected");
  assert.equal(atlas.error.value, undefined);
  atlas.previewDraft();
  const failure = atlas.refresh();
  calls[1].reject(new Error("Không tải được Atlas. Kiểm tra kết nối rồi thử lại."));
  await failure;
  assert.equal(atlas.source.value, "unavailable");
  assert.equal(atlas.data.value, null);
});

test("Multiple useAtlas consumers share state and request generations", async () => {
  const { atlas, useAtlas, calls } = runtime();
  const peer = useAtlas();
  assert.equal(peer.data, atlas.data);
  assert.equal(peer.source, atlas.source);
  const pending = atlas.refresh();
  peer.previewDraft();
  calls[0].reject(new Error("superseded request"));
  await pending;
  assert.equal(atlas.source.value, "demo");
  assert.equal(atlas.isLoading.value, false);
});

test("Real service-to-composable path never renders raw API or network error details", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ ok: false, error: { code: "ATLAS_UNAVAILABLE", message: "private-marker", stack: "private-marker" } })));
  const { atlas } = runtime("https://example.test/api", service.fetchAtlas);
  await atlas.refresh();
  assert.equal(atlas.source.value, "unavailable");
  assert.doesNotMatch(atlas.error.value, /private-marker/);
  fetchMock.mock.mockImplementation(async () => { throw new Error("private-marker endpoint or credentials"); });
  await atlas.refresh();
  assert.doesNotMatch(atlas.error.value, /private-marker/);
  assert.equal(atlas.isLoading.value, false);
});

test("Manual preview aborts an in-progress response reader and releases its lock", async (t) => {
  let response, requestSignal;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requestSignal = options.signal;
    response = new Response(new ReadableStream({
      start(controller) {
        requestSignal.addEventListener("abort", () => controller.error(new Error("private-body-marker")), { once: true });
      },
    }));
    return response;
  });
  const { atlas } = runtime("https://example.test/api", service.fetchAtlas);
  const pending = atlas.refresh();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(response.body.locked, true);
  atlas.previewDraft();
  await pending;
  assert.equal(requestSignal.aborted, true);
  assert.equal(response.body.locked, false);
  assert.equal(atlas.source.value, "demo");
  assert.equal(atlas.isLoading.value, false);
  assert.doesNotMatch(atlas.error.value, /private-body-marker/);
});

test("Over-limit body releases the reader and aborts transport without showing draft", async (t) => {
  let response, requestSignal;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requestSignal = options.signal;
    response = new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(" ".repeat(500_101)));
        requestSignal.addEventListener("abort", () => controller.error(new Error("private-body-marker")), { once: true });
      },
    }));
    return response;
  });
  const { atlas } = runtime("https://example.test/api", service.fetchAtlas);
  await atlas.refresh();
  assert.equal(requestSignal.aborted, true);
  assert.equal(response.body.locked, false);
  assert.equal(atlas.source.value, "unavailable");
  assert.equal(atlas.data.value, null);
  assert.equal(atlas.isLoading.value, false);
  assert.match(atlas.error.value, /Dữ liệu Atlas không hợp lệ/);
  assert.doesNotMatch(atlas.error.value, /private-body-marker/);
});
