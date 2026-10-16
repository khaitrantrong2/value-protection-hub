import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { transform } from "esbuild";

// Execute the real App handlers without mounting the decorative UI or replacing their logic.
const source = readFileSync(new URL("../src/App.vue", import.meta.url), "utf8");
const start = source.indexOf("function isTyping");
const end = source.indexOf("onMounted(", start);
assert.ok(start >= 0 && end > start, "App keyboard handlers remain available to the execution harness");
const compiled = await transform(source.slice(start, end), { loader: "ts", format: "cjs", target: "es2022" });

function runtime(initialView = "crew") {
  const calls = [], view = { value: initialView }, paletteOpen = { value: false };
  const context = vm.createContext({ view, paletteOpen, sectors: Array.from({ length: 8 }, (_, index) => ({ categoryId: "sector-" + (index + 1) })), goHome() { calls.push("home"); view.value = "home"; }, openSector(id) { calls.push(id); view.value = "sector"; } });
  vm.runInContext(compiled.code, context);
  return {
    calls, view, paletteOpen,
    key(key, target = { tagName: "BUTTON", isContentEditable: false, closest: () => null }, extra = {}) {
      const event = { key, target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra };
      context.onKeydown(event); return event;
    },
  };
}

test("Escape and sector shortcuts inside an open native menu do not navigate or cancel native dismissal", () => {
  for (const key of ["Escape", "0", "1", "8"]) {
    const r = runtime();
    const event = r.key(key, { tagName: "BUTTON", isContentEditable: false, closest: (selector) => selector.includes("dialog[open]") ? { open: true } : null });
    assert.deepEqual(r.calls, [], key); assert.equal(r.view.value, "crew", key); assert.equal(event.defaultPrevented, false, key);
  }
});

test("Native selects, text inputs and editable content retain their own keyboard interactions", () => {
  for (const target of [
    ...["INPUT", "TEXTAREA", "SELECT"].map(tagName => ({ tagName, isContentEditable: false, closest: () => null })),
    { tagName: "DIV", isContentEditable: true, closest: () => null },
  ]) for (const key of ["Escape", "0", "1", "8"]) {
    const r = runtime(); const event = r.key(key, target);
    assert.deepEqual(r.calls, [], `${target.tagName}: ${key}`); assert.equal(event.defaultPrevented, false);
  }
});

test("Unmodified page shortcuts still work and retain existing Atlas, palette and modifier guards", () => {
  const sector = runtime(); assert.equal(sector.key("3").defaultPrevented, true); assert.deepEqual(sector.calls, ["sector-3"]);
  const home = runtime(); assert.equal(home.key("Escape").defaultPrevented, true); assert.deepEqual(home.calls, ["home"]);
  const alreadyHome = runtime("home"); assert.equal(alreadyHome.key("Escape").defaultPrevented, false); assert.deepEqual(alreadyHome.calls, []);
  for (const extra of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { defaultPrevented: true }]) {
    const r = runtime(); r.key("1", undefined, extra); assert.deepEqual(r.calls, []);
  }
  const atlas = runtime("atlas"); atlas.key("1"); assert.deepEqual(atlas.calls, []);
  const palette = runtime(); palette.paletteOpen.value = true; palette.key("1"); assert.deepEqual(palette.calls, []);
});
