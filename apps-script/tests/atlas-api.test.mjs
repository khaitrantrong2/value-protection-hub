import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const source = readFileSync(new URL("../Code.gs", import.meta.url), "utf8");
const contract = readFileSync(new URL("../../src/types/atlas.ts", import.meta.url), "utf8");

function runtime(initial = {}, options = {}) {
  const tables = { ...initial };
  const cache = new Map();
  const properties = options.properties ?? {};
  const calls = { active: 0, openById: [] };
  const sheets = Object.entries(tables).map(([name, values]) => ({
    getName: () => name,
    getLastRow: () => values.length,
    getLastColumn: () => Math.max(0, ...values.map((row) => row.length)),
    getDataRange: () => ({ getValues: () => values }),
    getRange: () => ({ getValues: () => values }),
  }));
  const spreadsheet = {
    getSheetByName: (name) => sheets.find((sheet) => sheet.getName() === name) ?? null,
    getSheets: () => sheets,
  };
  const context = vm.createContext({
    Date,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => {
        calls.active++;
        if (options.active === "throw") throw new Error("private active-context details");
        return options.active === undefined ? spreadsheet : options.active;
      },
      openById: (id) => {
        calls.openById.push(id);
        if (options.openError) throw new Error("private source/access details");
        return options.openResult === undefined ? spreadsheet : options.openResult;
      },
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties[key] ?? null }) },
    CacheService: { getScriptCache: () => ({ get: (key) => cache.get(key), put: (key, value) => cache.set(key, value) }) },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (body) => ({ setMimeType: () => ({ body }) }),
    },
    Session: { getScriptTimeZone: () => "UTC" },
    Utilities: {
      formatDate: (date) => date.toISOString().slice(0, 10),
      DigestAlgorithm: { SHA_256: "SHA-256" }, Charset: { UTF_8: "UTF-8" },
      computeDigest(algorithm, value, encoding) {
        assert.equal(algorithm, "SHA-256"); assert.equal(encoding, "UTF-8");
        return Array.from(createHash("sha256").update(value, "utf8").digest(), byte => byte > 127 ? byte - 256 : byte);
      },
    },
  });
  vm.runInContext(source, context);
  return { context, cache, spreadsheet, properties, calls };
}

function table(columns, rows) {
  return [columns, ...rows.map((row) => columns.map((column) => row[column] ?? ""))];
}

const publication = { Publication: "Published", Visibility: "Public" };

function fixture(overrides = {}) {
  const { context } = runtime();
  const rows = {
    AtlasStages: [
      { ID: "01", Kind: "chapter", Order: 1, ShortTitle: "Start", Title: "Public process", Responsible: "VP|KAM", Pipeline: "Source\nReview", Supports: "A", ReferenceIDs: "R01", Fork: "none", PracticeState: "reported", ...publication },
      { ID: "A", Kind: "supporting", Order: 9, ShortTitle: "Support", Title: "Supporting process", Supports: "01", Fork: "none", PracticeState: "develop", ...publication },
    ],
    AtlasControls: [{ ID: "C01", StageID: "01", Title: "Owner review", Assertions: "Accuracy|Completeness", Nature: "detective", PracticeState: "reported", EvidenceLocation: "Team evidence register", EvidenceState: "to-locate", ...publication }],
    AtlasReferences: [{ ID: "R01", StageID: "01", Order: 1, Group: "record", Title: "Public reference label", PracticeState: "reported", ...publication }],
    AtlasConfig: [
      { Key: "ContentVersion", Value: "2.0", ...publication },
      { Key: "ProcessStatus", Value: "Owner-confirmed practice; testing pending", ...publication },
      { Key: "UpdatedAt", Value: "2026-10-15", ...publication },
    ],
    ...overrides,
  };
  return Object.fromEntries(Object.entries(rows).map(([name, data]) => [name, table(Array.from(context.ATLAS_COLUMNS[name]), data)]));
}

function atlasResponse(context) {
  return JSON.parse(context.doGet({ parameter: { action: "atlas" } }).body);
}

test("Backend sheet columns match the frontend content contract", () => {
  const { context } = runtime();
  for (const [sheet, name] of [["AtlasStages", "ATLAS_STAGE_COLUMNS"], ["AtlasControls", "ATLAS_CONTROL_COLUMNS"], ["AtlasReferences", "ATLAS_REFERENCE_COLUMNS"], ["AtlasConfig", "ATLAS_CONFIG_COLUMNS"]]) {
    const match = contract.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const;`));
    assert.ok(match, `${name} is in the contract`);
    const columns = Array.from(match[1].matchAll(/"([^"]+)"/g), (item) => item[1]);
    assert.deepEqual(Array.from(context.ATLAS_COLUMNS[sheet]), columns, sheet);
  }
});

test("Atlas reads only exactly Public + Published and strips unknown columns", () => {
  const c = runtime().context;
  const cols = Array.from(c.ATLAS_COLUMNS.AtlasConfig).concat("PrivateNotes");
  const { context } = runtime({ AtlasConfig: table(cols, [
    { Key: "Subtitle", Value: "Visible", Publication: "Published", Visibility: "Public", PrivateNotes: "never expose" },
    { Key: "Subtitle", Value: "private marker", Publication: "Published", Visibility: "Private" },
    { Key: "Subtitle", Value: "draft marker", Publication: "Draft", Visibility: "Public" },
    { Key: "Subtitle", Value: "case marker", Publication: "published", Visibility: "Public" },
  ]) });
  const serialized = JSON.stringify(context.atlasPublishedRows_("AtlasConfig"));
  assert.match(serialized, /Visible/);
  assert.doesNotMatch(serialized, /never expose|PrivateNotes|private marker|draft marker|case marker/);
});

test("Atlas fails closed on missing or duplicated publication headers", () => {
  for (const headers of [["Key", "Value"], ["Key", "Value", "Publication", "Visibility", "Visibility"]]) {
    const { context } = runtime({ AtlasConfig: [headers] });
    assert.throws(() => context.atlasPublishedRows_("AtlasConfig"), /Invalid Atlas content/);
  }
});

test("Atlas public URL policy rejects private, credentialed, non-HTTPS and lookalike URLs", () => {
  const { context } = runtime();
  for (const url of ["http://gsap.com/docs", "https://docs.google.com/document/d/private", "https://system.netsuite.com/app/example", "https://localhost/", "https://gsap.com.evil.test/", "https://user:pass@gsap.com/", "https://gsap.com:443/", "javascript:alert(1)", "https://gsap.com/\nsecret"]) {
    assert.throws(() => context.atlasPublicURL_(url), /Invalid Atlas content/);
  }
  assert.equal(context.atlasPublicURL_("https://docs.oracle.com/en/"), "https://docs.oracle.com/en/");
  assert.equal(context.atlasPublicURL_(""), "");
});

test("Atlas evidence is a text location, and list/string limits are enforced", () => {
  const { context } = runtime();
  assert.equal(context.atlasEvidenceLabel_("Country AR tracker · monthly reconciliation tab"), "Country AR tracker · monthly reconciliation tab");
  for (const label of ["See https://internal.example.test/file", "C:\\private\\file.xlsx", "\\\\server\\private"]) {
    assert.throws(() => context.atlasEvidenceLabel_(label), /Invalid Atlas content/);
  }
  assert.throws(() => context.atlasText_("x".repeat(21), 20, false));
  assert.throws(() => context.atlasList_("VP|VP", "|", 40, 10));
  assert.throws(() => context.atlasList_("VP|KAM|AR", "|", 40, 2));
});

test("Atlas endpoint returns the contract with nested SIPOC/RACI and delimiter lists", () => {
  const { context } = runtime(fixture());
  const response = atlasResponse(context);
  assert.equal(response.ok, true);
  assert.equal(response.atlas.schemaVersion, 1);
  assert.equal(response.atlas.meta.contentVersion, "2.0");
  assert.equal(response.atlas.meta.updatedAt, "2026-10-15");
  assert.equal(response.atlas.stages.length, 2);
  assert.deepEqual(response.atlas.stages[0].raci.responsible, ["VP", "KAM"]);
  assert.deepEqual(response.atlas.stages[0].pipeline, ["Source", "Review"]);
  assert.deepEqual(response.atlas.stages[0].supports, ["A"]);
  assert.deepEqual(response.atlas.controls[0].assertions, ["Accuracy", "Completeness"]);
  assert.equal(response.atlas.controls[0].evidenceState, "to-locate");
  assert.equal(response.atlas.references[0].url, "");
  assert.doesNotMatch(JSON.stringify(response), /Publication|Visibility|StageID|PrivateNotes/);
});

test("No public published rows is a valid empty Atlas, not a mock fallback", () => {
  const { context } = runtime(fixture({ AtlasStages: [], AtlasControls: [], AtlasReferences: [], AtlasConfig: [] }));
  const response = atlasResponse(context);
  assert.equal(response.ok, true);
  assert.deepEqual(response.atlas.stages, []);
  assert.deepEqual(response.atlas.controls, []);
  assert.deepEqual(response.atlas.references, []);
  assert.equal(response.atlas.meta.contentVersion, "");
});

test("Malformed private and draft rows never serialize or invalidate a valid publication", () => {
  const tables = fixture();
  const stages = tables.AtlasStages;
  for (const [publicationValue, visibilityValue] of [["Draft", "Public"], ["Published", "Private"]]) {
    const row = stages[0].map((column) => ({ ID: "private invalid id", Title: "private marker", Publication: publicationValue, Visibility: visibilityValue })[column] ?? "");
    stages.push(row);
  }
  const configColumns = tables.AtlasConfig[0];
  tables.AtlasConfig.push(configColumns.map((column) => ({ Key: "PrivateSecret", Value: "secret marker", ...publication })[column] ?? ""));
  const response = atlasResponse(runtime(tables).context);
  assert.equal(response.ok, true);
  assert.doesNotMatch(JSON.stringify(response), /private marker|private invalid id|PrivateSecret|secret marker/);
});

test("Dangling controls, references, supports and reference IDs fail the complete Atlas", () => {
  const cases = [
    ["AtlasControls", "StageID", "02"],
    ["AtlasReferences", "StageID", "02"],
    ["AtlasStages", "Supports", "02"],
    ["AtlasStages", "ReferenceIDs", "MISSING"],
  ];
  for (const [name, column, value] of cases) {
    const tables = fixture();
    tables[name][1][tables[name][0].indexOf(column)] = value;
    const response = atlasResponse(runtime(tables).context);
    assert.equal(response.ok, false, `${name}.${column}`);
    assert.equal(response.error.code, "ATLAS_INVALID");
    assert.equal(response.atlas, undefined);
    assert.doesNotMatch(JSON.stringify(response), /Public process|Owner review|MISSING/);
  }
});

test("Duplicate IDs, incorrect stage kinds and unsupported states fail closed", () => {
  for (const [name, column, value] of [["AtlasStages", "Kind", "supporting"], ["AtlasStages", "PracticeState", "verified"], ["AtlasControls", "EvidenceState", "verified"], ["AtlasControls", "Nature", "automatic"]]) {
    const tables = fixture();
    tables[name][1][tables[name][0].indexOf(column)] = value;
    assert.equal(atlasResponse(runtime(tables).context).error.code, "ATLAS_INVALID");
  }
  for (const name of ["AtlasStages", "AtlasControls", "AtlasReferences"]) {
    const tables = fixture();
    tables[name].push([...tables[name][1]]);
    assert.equal(atlasResponse(runtime(tables).context).error.code, "ATLAS_INVALID");
  }
});

test("Atlas errors contain no private spreadsheet exception details", () => {
  const { context } = runtime(fixture());
  context.SpreadsheetApp.getActiveSpreadsheet = () => { throw new Error("private sheet identifier and secret marker"); };
  const response = atlasResponse(context);
  assert.deepEqual(response, { ok: false, error: { code: "ATLAS_UNAVAILABLE", message: "Atlas content could not be loaded." } });
});

test("Atlas bypasses the legacy cache and a refresh reads edited Sheet cells", () => {
  const tables = fixture();
  const { context, cache } = runtime(tables);
  cache.set("vph_payload_v1", JSON.stringify({ links: [{ ID: "legacy" }] }));
  assert.equal(atlasResponse(context).atlas.stages[0].title, "Public process");
  tables.AtlasStages[1][tables.AtlasStages[0].indexOf("Title")] = "Edited process";
  assert.equal(atlasResponse(context).atlas.stages[0].title, "Edited process");
  assert.equal(cache.size, 1);
  assert.match(cache.get("vph_payload_v1"), /legacy/);
  assert.deepEqual(JSON.parse(context.doGet({ parameter: {} }).body), { links: [{ ID: "legacy" }] });
});

test("Legacy Links/Categories/Config/Portfolio behavior remains unchanged", () => {
  const { context, cache } = runtime({
    Links: [["ID", "Title", "Status", "IsActive"], ["L01", "Visible", "Review", true], ["L02", "Hidden", "Active", false]],
    Categories: [["Category", "Description"], ["operations", "Public directory"]],
    Config: [["Key", "Value"], ["PortalName", "Hub"]],
    Portfolio: [["Member", "Country", "Brand", "Class", "Complexity", "Platforms"], ["Role", "Regional", "Sample", "Standard", "Low", "Platform"]],
  });
  const response = JSON.parse(context.doGet().body);
  assert.deepEqual(Object.keys(response), ["links", "categories", "config", "portfolio"]);
  assert.equal(response.links.length, 1);
  assert.equal(response.links[0].Status, "Review");
  assert.equal(response.portfolio[0].Member, "Role");
  assert.equal(cache.size, 1);
});

test("Dates and orders are valid bounded scalar values", () => {
  const { context } = runtime();
  for (const value of ["2026-02-30", "2026-13-01", "not-a-date"]) assert.throws(() => context.atlasDate_(value), /Invalid Atlas content/);
  assert.equal(context.atlasDate_("2024-02-29"), "2024-02-29");
  assert.equal(context.atlasDate_(new Date("2026-10-15T00:00:00Z")), "2026-10-15");
  for (const value of ["", 0, -1, true, [], {}, "1e2", 10000]) assert.throws(() => context.atlasOrder_(value));
});

const genericSourceID = "GENERIC_TEST_SOURCE_ID_000001";

test("Configured source opens by ID without any active spreadsheet context", () => {
  for (const active of [null, "throw"]) {
    const { context, calls } = runtime(fixture(), { active, properties: { VPH_SPREADSHEET_ID: genericSourceID } });
    assert.equal(atlasResponse(context).ok, true);
    assert.ok(calls.openById.length > 0);
    assert.ok(calls.openById.every((value) => value === genericSourceID));
    assert.equal(calls.active, 0);
  }
});

test("Configured source takes precedence over active context and request-supplied IDs", () => {
  const { context, calls } = runtime(fixture(), { active: { getSheetByName: () => { throw new Error("wrong active spreadsheet"); } }, properties: { VPH_SPREADSHEET_ID: genericSourceID } });
  const response = JSON.parse(context.doGet({ parameter: { action: "atlas", spreadsheetId: "IGNORED_REQUEST_SOURCE_000002" } }).body);
  assert.equal(response.ok, true);
  assert.equal(calls.active, 0);
  assert.ok(calls.openById.every((value) => value === genericSourceID));
});

test("Missing, invalid or inaccessible source configuration returns only generic Atlas errors", () => {
  const cases = [
    { active: null },
    { active: "throw" },
    { properties: { VPH_SPREADSHEET_ID: "short" } },
    { properties: { VPH_SPREADSHEET_ID: ` ${genericSourceID} ` } },
    { properties: { VPH_SPREADSHEET_ID: "https://example.test/private-source" } },
    { properties: { VPH_SPREADSHEET_ID: "x".repeat(151) } },
    { properties: { VPH_SPREADSHEET_ID: genericSourceID }, openError: true },
    { properties: { VPH_SPREADSHEET_ID: genericSourceID }, openResult: null },
  ];
  for (const options of cases) {
    const { context } = runtime(fixture(), options);
    assert.deepEqual(atlasResponse(context), { ok: false, error: { code: "ATLAS_UNAVAILABLE", message: "Atlas content could not be loaded." } });
  }
});

test("Legacy cache is source-specific after repointing and malformed config cannot reuse cached data", () => {
  const sourceA = runtime({ Links: [["ID", "Title", "IsActive"], ["A", "Source A", true]] });
  const sourceB = runtime({ Links: [["ID", "Title", "IsActive"], ["B", "Source B", true]] });
  const idA = "GENERIC_TEST_SOURCE_A_000001", idB = "GENERIC_TEST_SOURCE_B_000002";
  const { context, properties, cache } = runtime({}, { properties: { VPH_SPREADSHEET_ID: idA } });
  context.SpreadsheetApp.openById = (id) => id === idA ? sourceA.spreadsheet : sourceB.spreadsheet;
  assert.equal(JSON.parse(context.doGet().body).links[0].Title, "Source A");
  properties.VPH_SPREADSHEET_ID = idB;
  assert.equal(JSON.parse(context.doGet().body).links[0].Title, "Source B");
  assert.equal(cache.size, 2);
  properties.VPH_SPREADSHEET_ID = "invalid";
  cache.set("vph_payload_v1", JSON.stringify({ links: [{ Title: "Old source marker" }] }));
  assert.throws(() => context.doGet(), { message: "Source spreadsheet is not configured or accessible." });
});

test("Editor/legacy source fallback preserves the original cache key and returns a fixed source error if absent", () => {
  const { context, cache } = runtime({ Links: [["ID", "Title", "IsActive"], ["A", "Editor source", true]] });
  assert.equal(JSON.parse(context.doGet().body).links[0].Title, "Editor source");
  assert.equal(cache.has("vph_payload_v1"), true);
  const missing = runtime({}, { active: null });
  assert.throws(() => missing.context.getSourceSpreadsheet_(), { message: "Source spreadsheet is not configured or accessible." });
});

const translationBuild = await build({ entryPoints: [fileURLToPath(new URL("../../src/services/atlasTranslationService.ts", import.meta.url))], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
const translationApi = await import(`data:text/javascript;base64,${Buffer.from(translationBuild.outputFiles[0].text).toString("base64")}`);
const translationContract = readFileSync(new URL("../../src/types/atlasTranslations.ts", import.meta.url), "utf8");

function withTranslations(rows, headers) {
  const tables = fixture();
  const { context } = runtime(tables);
  tables.Translations = table(headers ?? Array.from(context.ATLAS_TRANSLATION_COLUMNS), rows);
  return runtime(tables);
}
function translationRow(context, overrides = {}) {
  const entity = atlasResponse(context).atlas.stages[0];
  return { EntityType: "stage", EntityID: entity.id, Field: "title", Locale: "vi", Text: "Quy trình công khai", SourceFingerprint: context.atlasSourceFingerprint_(entity), ReviewStatus: "Reviewed", ...publication, ...overrides };
}

test("Optional translation tab is backwards compatible, uncached and independently publication gated", () => {
  const initial = runtime(fixture());
  const base = atlasResponse(initial.context);
  assert.equal(base.ok, true); assert.equal("translations" in base.atlas, false);
  assert.deepEqual(JSON.parse(initial.context.doGet({ parameter: { action: "translations" } }).body), { ok: true, translations: [] });
  const row = translationRow(initial.context);
  const { context, cache } = withTranslations([
    row,
    { ...row, Text: "draft-private-marker", Publication: "Draft" },
    { ...row, Text: "internal-private-marker", Visibility: "Internal" },
    { ...row, Text: "unreviewed-private-marker", ReviewStatus: "Draft" },
    { ...row, Text: "case-private-marker", ReviewStatus: "reviewed" },
    { ...row, Text: "unknown-id-private-marker", EntityID: "UNKNOWN" },
    { ...row, Text: "unknown-field-private-marker", Field: "url" },
    { ...row, Text: "unknown-type-private-marker", EntityType: "__proto__" },
    { ...row, Text: "wrong-locale-private-marker", Locale: "fr" },
    { ...row, Text: "stale-private-marker", SourceFingerprint: `sha256:${"0".repeat(64)}` },
  ]);
  cache.set("vph_payload_v1", JSON.stringify({ links: [{ ID: "legacy" }] }));
  const response = atlasResponse(context);
  assert.equal(response.atlas.stages[0].title, base.atlas.stages[0].title);
  assert.equal(response.atlas.translations.length, 1);
  assert.equal(response.atlas.translations[0].text, row.Text);
  assert.doesNotMatch(JSON.stringify(response), /private-marker/);
  assert.deepEqual(JSON.parse(context.doGet({ parameter: { action: "translations" } }).body).translations, response.atlas.translations);
  assert.equal(cache.size, 1);
});

test("Frontend and Apps Script translation allowlists and SHA-256 fingerprints are identical", async () => {
  const { context } = runtime(fixture());
  const source = atlasResponse(context).atlas;
  const match = translationContract.match(/export const ATLAS_TRANSLATABLE_FIELDS = ([\s\S]*?) as const;/);
  assert.ok(match);
  const frontendFields = vm.runInNewContext(`(${match[1]})`);
  assert.deepEqual(JSON.parse(JSON.stringify(context.ATLAS_TRANSLATABLE_FIELDS)), JSON.parse(JSON.stringify(frontendFields)));
  const header = translationContract.match(/export const ATLAS_TRANSLATION_COLUMNS = (\[[^;]+\]) as const;/);
  assert.ok(header);
  assert.deepEqual(Array.from(context.ATLAS_TRANSLATION_COLUMNS), Array.from(vm.runInNewContext(header[1])));
  for (const entity of [...source.stages, ...source.controls, ...source.references]) {
    assert.equal(context.atlasCanonicalRecord_(entity), translationApi.canonicalAtlasRecord(entity));
    assert.equal(context.atlasSourceFingerprint_(entity), await translationApi.atlasSourceFingerprint(entity));
    const reordered = Object.fromEntries(Object.entries(entity).reverse());
    assert.equal(context.atlasSourceFingerprint_(entity), await translationApi.atlasSourceFingerprint(reordered));
  }
  const unicode = { ...source.stages[0], title: "Đối soát & xác nhận nghĩa vụ — VN / ไทย", narrative: "Unicode \"quoted\"\nnext line" };
  assert.equal(context.atlasSourceFingerprint_(unicode), await translationApi.atlasSourceFingerprint(unicode));
  for (const change of [{ contentVersion: "new" }, { practiceState: "proposed" }, { sourceBasis: "new source" }, { title: "new title" }]) assert.notEqual(context.atlasSourceFingerprint_(source.stages[0]), await translationApi.atlasSourceFingerprint({ ...source.stages[0], ...change }));
});

test("Malformed optional translation headers and text fail closed without invalidating the source Atlas", () => {
  const initial = runtime(fixture()), row = translationRow(initial.context);
  const normal = Array.from(initial.context.ATLAS_TRANSLATION_COLUMNS);
  for (const headers of [normal.filter(value => value !== "Visibility"), [...normal, "Publication"]]) {
    const response = atlasResponse(withTranslations([row], headers).context);
    assert.equal(response.ok, true); assert.equal(response.atlas.stages[0].title, "Public process");
    assert.equal("translations" in response.atlas, false);
  }
  for (const text of ["", "bad\u0000text", "x".repeat(12001)]) {
    const response = atlasResponse(withTranslations([{ ...row, Text: text }]).context);
    assert.equal(response.ok, true); assert.equal("translations" in response.atlas, false);
    assert.doesNotMatch(JSON.stringify(response), /bad\\u0000text/);
  }
});

test("Serialized complete overlays apply only as whole logical records; malformed arrays and duplicate fields retain source", async () => {
  const initial = runtime(fixture()), base = atlasResponse(initial.context).atlas;
  const sourceStage = base.stages[0], columns = Array.from(initial.context.ATLAS_TRANSLATABLE_FIELDS.stage);
  const rows = columns.flatMap(field => {
    const value = field.split(".").reduce((item, key) => item?.[key], sourceStage);
    if (!(typeof value === "string" ? value.trim() : value?.length)) return [];
    return [translationRow(initial.context, { Field: field, Text: Array.isArray(value) ? JSON.stringify(value.map((_, index) => `Vai trò ${index + 1}`)) : `Bản dịch ${field}` })];
  });
  for (const kind of ["complete", "array", "duplicate", "missing"]) {
    const candidate = structuredClone(rows);
    if (kind === "array") candidate.find(row => row.Field === "raci.responsible").Text = "not a JSON array";
    if (kind === "duplicate") candidate.push({ ...candidate[0] });
    if (kind === "missing") candidate.pop();
    const response = atlasResponse(withTranslations(candidate).context);
    assert.equal(response.ok, true);
    const localized = await translationApi.localizeAtlasPayload(response.atlas, "vi");
    if (kind === "complete") {
      assert.equal(localized.data.stages[0].title, "Bản dịch title");
      assert.equal(localized.translatedKeys.has("stage:01"), true);
    } else {
      assert.deepEqual(localized.data.stages[0], sourceStage, kind);
      assert.equal(localized.translatedKeys.has("stage:01"), false, kind);
    }
    assert.equal(localized.data.stages[0].practiceState, sourceStage.practiceState);
    assert.deepEqual(response.atlas.stages[0], sourceStage);
  }
});

test("A source edit invalidates the previous translation fingerprint immediately on the uncached route", () => {
  const tables = fixture(), initial = runtime(tables), row = translationRow(initial.context);
  tables.Translations = table(Array.from(initial.context.ATLAS_TRANSLATION_COLUMNS), [row]);
  const { context } = runtime(tables);
  assert.equal(atlasResponse(context).atlas.translations.length, 1);
  tables.AtlasStages[1][tables.AtlasStages[0].indexOf("ContentVersion")] = "next-source-version";
  const changed = atlasResponse(context);
  assert.equal(changed.ok, true);
  assert.equal(changed.atlas.stages[0].contentVersion, "next-source-version");
  assert.equal("translations" in changed.atlas, false);
  assert.deepEqual(JSON.parse(context.doGet({ parameter: { action: "translations" } }).body), { ok: true, translations: [] });
});
