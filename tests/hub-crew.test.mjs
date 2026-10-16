import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import { compileScript, parse } from "@vue/compiler-sfc";
import { transform } from "esbuild";

const require = createRequire(import.meta.url);
const Vue = require("vue");
const { renderToString } = require("vue/server-renderer");

async function load(path) {
  const compiled = await transform(readFileSync(new URL(path, import.meta.url), "utf8"), { loader: "ts", format: "cjs", target: "es2022" });
  const context = vm.createContext({ module: { exports: {} }, Intl });
  vm.runInContext(compiled.code, context);
  return context.module.exports;
}
const { crew } = await load("../src/data/crew.ts");
const helpers = await load("../src/data/crewDirectory.ts");
const fleetMotion = await load("../src/services/fleetMotion.ts");
const { messages } = await load("../src/i18n/messages/crew.ts");
const rows = [
  { member: "Huệ", country: "VN", brand: "Brand A", class: "Retail", complexity: "Standard", platforms: ["Tiktok", "SHOPEE"] },
  { member: "Huệ", country: "TH", brand: "brand a", class: "Retail", complexity: "Exceptional", platforms: ["TikTok Shop", "Shopee", "Lazada"] },
  { member: "Huệ", country: "VN", brand: "Brand B", class: "Agency", complexity: "Standard", platforms: ["tiktok shop", " "] },
];

test("Crew uses unique stable identities, keeps aliases and hides reassigned records without deleting them", () => {
  assert.equal(new Set(crew.map(member => member.id)).size, crew.length);
  assert.equal(crew.find(member => member.id === "khai").role, "Team Lead");
  assert.deepEqual(Array.from(crew.find(member => member.id === "hung").aliases), ["Hung Tran Vu", "Hung Vu Tran", "Hùng Vũ"]);
  assert.equal(crew.find(member => member.id === "andriani").active, false);
  assert.equal(helpers.matchesCrew(crew.find(member => member.id === "andriani"), "", "all", "all", []), false);
});

test("Scope metrics distinguish unique brands from published rows and deduplicate canonical platforms", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(helpers.portfolioSummary(rows))), { brands: 2, rows: 3, platforms: 3, unnamedRows: 0 });
  assert.deepEqual(Array.from(helpers.portfolioPlatforms(rows)), ["Lazada", "Shopee", "TikTok Shop"]);
  assert.equal(helpers.canonicalPlatform("TikTok-Shop"), "TikTok Shop");
});

test("Who-owns discovery combines explicit roles/aliases and published scope, accent-insensitively", () => {
  const hue = crew.find(member => member.id === "hue");
  assert.equal(helpers.matchesCrew(hue, "hue brand b", "VN", "claimback", rows), true);
  assert.equal(helpers.matchesCrew(hue, "doi soat", "VN", "claimback", rows, "đối soát"), true);
  assert.equal(helpers.matchesCrew(hue, "", "TH", "all", rows), false);
  assert.equal(helpers.matchesCrew(hue, "", "all", "ar", rows), false);
});

test("Portfolio filters use platform equivalence, preserve source rows and sort deterministically", () => {
  const filters = { query: "brand", country: "VN", platform: "TikTok Shop", complexity: "Standard", sort: "brand-desc" };
  const result = helpers.filterPortfolio(rows, filters, "vi");
  assert.equal(result.length, 2);
  assert.equal(result[0].brand, "Brand B");
  assert.equal(rows[0].brand, "Brand A");
  assert.equal(helpers.filterPortfolio(rows, { ...filters, query: "missing" }).length, 0);
  assert.equal(helpers.portfolioSummary([{ ...rows[0], brand: " " }]).brands, 0);
});

function translator(locale) {
  return (key, params = {}) => {
    const value = key.split(".").reduce((item, part) => item?.[part], messages[locale.value]);
    assert.equal(typeof value, "string", `Missing ${locale.value} copy: ${key}`);
    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ""));
  };
}

async function compileComponent(name) {
  const source = readFileSync(new URL(`../src/components/${name}.vue`, import.meta.url), "utf8");
  const { descriptor } = parse(source, { filename: `${name}.vue` });
  return (await transform(compileScript(descriptor, { id: `crew-${name}`, inlineTemplate: true }).content, { loader: "ts", format: "cjs", target: "es2022" })).code;
}
const components = Object.fromEntries(await Promise.all(["CrewView", "MemberView", "CrewSourceNotice", "MemberPortfolio"].map(async name => [name, await compileComponent(name)])));

function runtime(source = "live", scope = []) {
  const locale = Vue.ref("en");
  const filters = Vue.reactive({ query: "", market: "all", function: "all" });
  const portfolioFilters = Vue.reactive({ query: "", country: "all", platform: "all", complexity: "all", sort: "brand" });
  const state = { source: Vue.ref(source), isLoading: Vue.ref(false), refreshedAt: Vue.ref("2026-10-16T00:00:00Z"), selectedMember: Vue.ref(crew.find(member => member.id === "hue")), memberScope: () => scope, openMember() {}, openCrew() {}, refreshLinks() {} };
  const stubs = {
    vue: Vue,
    "../data/crew": { crew }, "../data/crewDirectory": helpers,
    "../services/fleetMotion": fleetMotion,
    "../i18n": { useLocale: () => ({ locale, t: translator(locale), text: (en, vi) => locale.value === 'vi' ? vi : en }) },
    "../i18n/messages/crew": { messages },
    "../composables/useLinks": { useLinks: () => state },
    "../composables/useCrewDirectory": { useCrewDirectory: () => filters, useMemberPortfolioFilters: () => portfolioFilters },
    "./Icon.vue": Vue.defineComponent({ setup: () => () => Vue.h("i") }),
    "./StarfighterIcon.vue": Vue.defineComponent({ setup: () => () => Vue.h('svg') }),
    "./CrewSourceNotice.vue": Vue.defineComponent({ setup: () => () => Vue.h("div", "source status") }),
    "./MemberPortfolio.vue": Vue.defineComponent({ props: ["rows"], setup: props => () => Vue.h("div", `${props.rows.length} published rows`) }),
    "./PortfolioColumnFilter.vue": Vue.defineComponent({ props: ["label"], setup: (props, { slots }) => () => Vue.h("details", [Vue.h("summary", props.label), slots.default?.()]) }),
    "./CrewMemberCard.vue": Vue.defineComponent({ props: ["member"], setup: props => () => Vue.h("button", { "data-crew-member": props.member.id }, props.member.name) }),
    "./ProtectorFleet.vue": Vue.defineComponent({ props: ["members"], setup: props => () => Vue.h("div", props.members.map(member => Vue.h("button", { "data-crew-member": member.id }, member.name))) }),
    "./MemberScopePanel.vue": Vue.defineComponent({ setup: () => () => Vue.h('aside') }),
  };
  function component(name) {
    const context = vm.createContext({ module: { exports: {} }, Intl, Date, require(path) { assert.ok(stubs[path], `Unexpected ${path}`); return stubs[path]; } });
    vm.runInContext(components[name], context);
    return context.module.exports.default;
  }
  return { locale, filters, portfolioFilters, state, render: (name, props = {}) => renderToString(Vue.createSSRApp(component(name), props)) };
}

test("Both language catalogs cover the same UI keys and every published role profile", () => {
  const keys = (item, prefix = "") => Object.entries(item).flatMap(([key, value]) => typeof value === "string" ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`));
  assert.deepEqual(keys(messages.en), keys(messages.vi));
  for (const member of crew) for (const lang of ["en", "vi"]) {
    assert.ok(messages[lang].crew.profiles[member.profileKey].role);
    assert.ok(messages[lang].crew.profiles[member.profileKey].summary);
  }
});

test("Team fleet always renders every active teammate without search or selection controls", async () => {
  const app = runtime();
  const html = await app.render("CrewView");
  assert.equal((html.match(/data-crew-member=/g) || []).length, 17);
  assert.match(html, /data-crew-member="khai"/);
  assert.doesNotMatch(html, /data-crew-member="andriani"|hero-card|crewpage__spine|ALPHA-01|COMMANDER/);
  assert.doesNotMatch(html, /type="search"|<select|data-hub-inspector/);
  app.filters.function = "automation";
  assert.equal(((await app.render("CrewView")).match(/data-crew-member=/g) || []).length, 17);
  app.filters.function = "all"; app.filters.query = "doi soat";
  assert.match(await app.render("CrewView"), /data-crew-member="lan"/);
});

test("Member empty states distinguish missing source, retained copy, loading and valid published-empty", async () => {
  const app = runtime("unavailable");
  assert.match(await app.render("MemberView"), /Published scope is not available/);
  app.state.source.value = "stale";
  assert.match(await app.render("MemberView"), /No rows in the retained copy/);
  app.state.source.value = "live";
  assert.match(await app.render("MemberView"), /No published portfolio rows/);
  app.state.isLoading.value = true;
  assert.match(await app.render("MemberView"), /Loading published scope/);
  app.locale.value = "vi"; app.state.isLoading.value = false;
  assert.match(await app.render("MemberView"), /Chưa có dòng danh mục công bố/);
});

test("Portfolio rendering exposes correct counts and changing locale keeps its active filters", async () => {
  const app = runtime("live", rows);
  let html = await app.render("MemberPortfolio", { rows, memberId: "hue" });
  assert.match(html, /Unique brand names<\/dt><dd>2/);
  assert.match(html, /Scope rows<\/dt><dd>3/);
  assert.match(html, /TikTok Shop/);
  app.portfolioFilters.query = "brand b";
  app.locale.value = "vi";
  html = await app.render("MemberPortfolio", { rows, memberId: "hue" });
  assert.match(html, /1 \/ 3 dòng nguồn/);
  assert.equal(app.portfolioFilters.query, "brand b");
  assert.match(html, /data-label="Brand">Brand B/);
});
