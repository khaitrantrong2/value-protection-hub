import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import { compileScript, parse } from "@vue/compiler-sfc";
import { build, transform } from "esbuild";
import { createLocaleHarness } from "./localeHarness.mjs";

const require = createRequire(import.meta.url), Vue = require("vue");
const { renderToString } = require("vue/server-renderer");
const compiled = {};
for (const name of ["VaultTable", "VaultLinkActions", "VaultCard"]) {
  const { descriptor } = parse(readFileSync(new URL(`../src/components/${name}.vue`, import.meta.url), "utf8"), { filename: name + ".vue" });
  compiled[name] = (await transform(compileScript(descriptor, { id: name, inlineTemplate: true }).content, { loader: "ts", format: "cjs", target: "es2022" })).code;
}
const safetyBuild = await build({ entryPoints: [fileURLToPath(new URL("../src/services/linkSafety.ts", import.meta.url))], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
const safety = await import(`data:text/javascript;base64,${Buffer.from(safetyBuild.outputFiles[0].text).toString("base64")}`);
const link = (id, extra = {}) => ({ id, title: "Value protection SOP " + id, description: "Source description", category: "sop-policy-training", country: "TH", owner: "Team Owner", criticality: "High", status: "Active", url: "https://example.test/" + id, tags: ["SOP", "Finance"], accessNote: "Intrepid account required", ...extra });

function runtime(language = "en") {
  const locale = createLocaleHarness(language);
  const components = new Map();
  function component(name) {
    if (components.has(name)) return components.get(name);
    const context = vm.createContext({ module: { exports: {} }, setTimeout, clearTimeout, require(path) {
      if (path === "vue") return Vue;
      if (path === "../i18n") return { useLocale: () => locale };
      if (path === "../services/linkSafety") return safety;
      if (path === "./VaultLinkActions.vue") return component("VaultLinkActions");
      if (path === "./Icon.vue") return Vue.defineComponent({ setup: () => () => Vue.h("i", { "aria-hidden": true }) });
      throw new Error("Unexpected vault import " + path);
    } });
    vm.runInContext(compiled[name], context);
    components.set(name, context.module.exports.default);
    return context.module.exports.default;
  }
  return { locale, render: (name, props) => renderToString(Vue.createSSRApp(component(name), props)), setupRender: (name, props) => component(name).setup(props, { expose() {} }) };
}

test("Vault table uses aligned semantic columns and preserves owner, priority, source notes and status", async () => {
  const html = await runtime().render("VaultTable", { links: [link("sop")] });
  assert.equal((html.match(/scope="col"/g) ?? []).length, 6);
  for (const value of ["Title &amp; description", "Country", "Owner", "Priority", "Tags", "Quick actions", "Team Owner", "Intrepid account required", "Source description", "Active", "High"]) assert.ok(html.includes(value), value);
  assert.match(html, /href="https:\/\/example\.test\/sop"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /aria-expanded="false"/);
});

test("Missing, invalid and Blocked rows retain descriptions but expose neither unsafe hrefs nor Copy actions", async () => {
  const html = await runtime().render("VaultTable", { links: [link("missing", { url: "" }), link("invalid", { url: "javascript:alert(1)" }), link("blocked", { status: "Blocked", url: "https://example.test/private" })] });
  assert.equal((html.match(/data-resource=/g) ?? []).length, 3);
  assert.doesNotMatch(html, /href=|Copy link to|javascript:alert|example\.test\/private/);
  assert.match(html, /Link not provided/);
  assert.match(html, /Invalid or unsupported link/);
  assert.match(html, /Opening disabled: resource is blocked/);
  assert.match(html, /Source description/);
});

test("Source markup remains escaped, and Vietnamese labels do not translate source identities or URLs", async () => {
  const app = runtime("vi");
  const html = await app.render("VaultTable", { links: [link("unsafe-title", { title: "<script>alert(1)</script>", country: "Regional", tags: ["<img src=x onerror=bad>"] })] });
  assert.match(html, /Tên &amp; mô tả/); assert.match(html, /Khu vực/); assert.match(html, /Cao/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|<img src=x/);
  assert.match(html, /href="https:\/\/example\.test\/unsafe-title"/);
});

test("Cards share the same safe destination actions and keep meaningful unavailable feedback", async () => {
  const html = await runtime().render("VaultCard", { link: link("blocked", { status: "Blocked" }), accent: "#123456", icon: "folder" });
  assert.match(html, /vault__meta/); assert.match(html, /Opening disabled: resource is blocked/);
  assert.match(html, /Resource unavailable/); assert.doesNotMatch(html, /href=|Copy link to/);
});

test("Inline details toggles only its resource, exposes the full tags and retains an accessible action name", () => {
  const app = runtime();
  const render = app.setupRender("VaultTable", { links: [link("sop", { tags: ["one", "two", "three", "four"] }), link("other")] });
  function nodes(value) {
    if (Array.isArray(value)) return value.flatMap(nodes);
    return value && typeof value === "object" ? [value, ...nodes(value.children)] : [];
  }
  const current = () => nodes(render({}, []));
  const details = (id) => current().find(node => node.type === "button" && node.props?.["aria-label"]?.includes("Value protection SOP " + id));
  const firstRow = () => current().find(node => node.type === "tr" && node.props?.["data-resource"] === "sop");
  assert.equal(details("sop").props["aria-expanded"], false);
  assert.match(details("sop").props["aria-label"], /^Show details:/);
  details("sop").props.onClick();
  assert.equal(details("sop").props["aria-expanded"], true);
  assert.equal(details("other").props["aria-expanded"], false);
  assert.match(firstRow().props.class, /is-expanded/);
  assert.ok(nodes(firstRow()).some(node => node.type === "li" && node.children === "four"));
  assert.match(details("sop").props["aria-label"], /^Hide details:/);
  details("sop").props.onClick();
  assert.equal(details("sop").props["aria-expanded"], false);
  assert.equal(nodes(firstRow()).some(node => node.type === "li" && node.children === "four"), false);
});
