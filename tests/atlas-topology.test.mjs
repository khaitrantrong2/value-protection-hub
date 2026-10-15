import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { transform } from "esbuild";

async function load(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const context = vm.createContext({ module: { exports: {} } });
  vm.runInContext(compiled.code, context);
  return context.module.exports;
}
const topology = await load("../src/components/atlas/atlasTopology.ts");
const { atlasDemo } = await load("../src/data/atlasDemo.ts");
const nodes = topology.buildAtlasNodes(atlasDemo.stages, atlasDemo.references);
const support = topology.buildSupportCapabilities(atlasDemo.stages, nodes);

test("Only 01–08 form the business sequence; 05 remains two meaningful parallel branches", () => {
  assert.equal(nodes.length, 9);
  assert.equal(nodes.some(node => node.stage.kind !== "chapter"), false);
  assert.equal(nodes.find(node => node.key === "05A").short, "Accounting");
  assert.equal(nodes.find(node => node.key === "05B").short, "Brand confirmation");
  const edges = topology.ATLAS_SEQUENCE_EDGES.map(edge => edge.join("→"));
  for (const edge of ["04→05A", "04→05B", "05A→06", "05B→06"]) assert.ok(edges.includes(edge));
  assert.equal(edges.some(edge => /(?:^|→)[AB](?:→|$)/.test(edge)), false);
});

test("Supporting capability spans and links come from published Supports, not a duplicate hardcoded map", () => {
  const pipeline = support.find(item => item.key === "A"), master = support.find(item => item.key === "B");
  assert.deepEqual(Array.from(new Set(pipeline.consumers.map(node => node.stage.id))), ["02", "03", "04"]);
  assert.equal(pipeline.x, nodes.find(node => node.key === "02").x);
  assert.equal(pipeline.x + pipeline.width, nodes.find(node => node.key === "04").x + 300);
  assert.equal(new Set(master.consumers.map(node => node.stage.id)).size, 8);
  const altered = atlasDemo.stages.map(stage => stage.id === "A" ? { ...stage, supports: ["03"] } : stage);
  const changed = topology.buildSupportCapabilities(altered, nodes).find(item => item.key === "A");
  assert.equal(changed.width, 300);
  assert.deepEqual(Array.from(changed.consumers, node => node.key), ["03"]);
});

test("Support labels stay clear of business cards and one another at every supported zoom", () => {
  for (const scale of [0.15, 0.3, 0.5, 0.9, 1.6]) {
    const projection = topology.projectSupportCapabilities(support, { x: 0, y: 0, scale }, 300);
    assert.ok(projection.items[0].cy - 18 > 300);
    assert.ok(projection.items[1].cy - 18 > projection.items[0].cy + 18);
    assert.ok(projection.lane.top >= 310);
  }
});

test("A short desktop viewport fits readable overview cards at width-led zoom, not 19 percent", () => {
  const viewport = { width: 1230, height: 308 }, insets = { top: 16, right: 16, bottom: 16, left: 16 };
  const bounds = topology.atlasOverviewBounds(nodes, support, viewport, insets);
  const scale = Math.min((viewport.width - 32) / bounds.width, (viewport.height - 32) / bounds.height);
  assert.ok(scale >= 0.35, `Default overview should fill available width; got ${scale}`);
  const projected = topology.projectAtlasNodes(nodes, { x: 0, y: 0, scale });
  assert.ok(projected.every(node => node.screenWidth >= 100));
  const businessBottom = Math.max(...projected.map(node => node.cy + node.screenHeight / 2));
  const capabilities = topology.projectSupportCapabilities(support, { x: 0, y: 0, scale }, businessBottom);
  const top = Math.min(...projected.map(node => node.cy - node.screenHeight / 2));
  assert.ok(capabilities.lane.top + capabilities.lane.height - top <= viewport.height - 32 + 0.01);
});
