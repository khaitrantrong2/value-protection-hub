import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

async function load(path) {
  const compiled = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
  return import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
}
const { matchesVaultQuickView, filterVaultQuickView } = await load("../src/services/vaultFilters.ts");
const { parseHubHash, serializeHubHash } = await load("../src/composables/hubRoute.ts");
const asset = (category, tags = []) => ({ id: category, category, tags });

test("Review operations and development workspaces are distinct, never implicitly analytics", () => {
  const review = asset("review-cockpits"), project = asset("project-workspace");
  assert.equal(matchesVaultQuickView(review, "review-cockpits"), true);
  assert.equal(matchesVaultQuickView(project, "review-cockpits"), false);
  assert.equal(matchesVaultQuickView(project, "project-workspace"), true);
  assert.equal(matchesVaultQuickView(review, "project-workspace"), false);
  for (const link of [review, project]) assert.equal(matchesVaultQuickView(link, "analytics-automation"), false);
});

test("Analytics requires explicit exact approved tag aliases; a title or incidental substring cannot qualify", () => {
  for (const tag of ["Analytics", " AUTOMATION ", "Data analytics", "Analytics & Automation", "Tự động hóa"]) {
    assert.equal(matchesVaultQuickView(asset("project-workspace", [tag]), "analytics-automation"), true, tag);
  }
  for (const tag of ["automation candidate", "not analytics", "analytics-review", "project"]) {
    assert.equal(matchesVaultQuickView({ ...asset("review-cockpits", [tag]), title: "Analytics automation" }, "analytics-automation"), false, tag);
  }
});

test("AR view uses AR category or exact AR tags and does not relabel all claimback trackers", () => {
  assert.equal(matchesVaultQuickView(asset("claimback-trackers"), "ar-trackers"), false);
  assert.equal(matchesVaultQuickView(asset("ar-collection"), "ar-trackers"), true);
  assert.equal(matchesVaultQuickView(asset("claimback-trackers", ["AR tracker"]), "ar-trackers"), true);
  assert.equal(matchesVaultQuickView(asset("claimback-trackers", ["chargeback"]), "ar-trackers"), false);
  assert.equal(matchesVaultQuickView(asset("netsuite-saved-searches"), "netsuite-links"), true);
  assert.equal(matchesVaultQuickView(asset("sop-policy-training"), "process-documents"), true);
});

test("Quick filtering preserves records and source array; categories remain independent constraints", () => {
  const links = [asset("review-cockpits", ["Analytics"]), asset("project-workspace", ["Analytics"]), asset("ar-collection")];
  const results = filterVaultQuickView(links, "analytics-automation");
  assert.equal(results.length, 2); assert.equal(links.length, 3); assert.equal(results[0], links[0]);
  assert.deepEqual(results.filter((link) => link.category === "project-workspace"), [links[1]]);
});

test("Directory defaults to table, retains legacy compact, and shares explicit cards plus allowlisted quick view", () => {
  for (const hash of ["#directory", "#directory?mode=compact", "#directory?mode=invalid"]) assert.equal(parseHubHash(hash).viewMode, "compact");
  const route = parseHubHash("#directory?type=review-cockpits&country=TH&mode=cards&q=invoice");
  assert.equal(route.quickView, "review-cockpits"); assert.equal(route.viewMode, "cards");
  assert.equal(serializeHubHash(route), "#directory?country=TH&q=invoice&mode=cards&type=review-cockpits");
  assert.equal(parseHubHash("#directory?type=private-source-value").quickView, "all");
  assert.equal(serializeHubHash(parseHubHash("#directory?mode=compact")), "#directory");
  assert.doesNotMatch(serializeHubHash({ ...route, quickView: "private-source-value" }), /private-source-value/);
});
