import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { transform } from 'esbuild';

const compiled = await transform(readFileSync(new URL('../src/services/fleetMotion.ts', import.meta.url), 'utf8'), { loader: 'ts', format: 'cjs' });
const context = vm.createContext({ module: { exports: {} }, Math, Number });
vm.runInContext(compiled.code, context);
const { advancePatrol, crewHullState, fleetPoint, fleetSeed, fleetMetrics, fleetOrbitalState, fleetOrbitTrace, projectedOrbit, FLEET_ORBITS } = context.module.exports;

test('Fleet travel is elapsed-time based, not dependent on monitor frame rate', () => {
  let sixty = 0, highRefresh = 0;
  for (let frame = 0; frame < 600; frame++) sixty = advancePatrol(sixty, 1 / 60, false);
  for (let frame = 0; frame < 1440; frame++) highRefresh = advancePatrol(highRefresh, 1 / 144, false);
  assert.ok(Math.abs(sixty - highRefresh) < 1e-10);
  assert.equal(advancePatrol(1, NaN, false), 1);
});

test('Holding one ship freezes only that ship and release resumes without a phase jump', () => {
  const held = advancePatrol(1, 3, true), other = advancePatrol(1, 3, false);
  assert.equal(held, 1);
  assert.ok(other > held);
  assert.equal(advancePatrol(held, .1, false), advancePatrol(1, .1, false));
});

test('Crew hulls dip through independent depth cycles without transforming their stable hitboxes', () => {
  for (let index = 0; index < 17; index++) for (const phase of [0, 1, 3, 5, Math.PI * 2]) {
    const pose = crewHullState(index, phase);
    assert.ok(pose.depth >= -1 && pose.depth <= 1);
    assert.ok(pose.scale >= .865 && pose.scale <= 1.015);
    assert.ok(Math.abs(pose.heading) <= 8 && Math.abs(pose.bank) <= 20 && Math.abs(pose.pitch) <= 9);
    assert.ok(!('x' in pose) && !('y' in pose));
  }
  const poses = Array.from({ length: 17 }, (_, index) => crewHullState(index, .5));
  assert.ok(new Set(poses.map(pose => pose.depth)).size > 12);
  for (let index = 0; index < 3; index++) {
    const initial = crewHullState(index, 0), wrapped = crewHullState(index, Math.PI * 2);
    for (const field of ['depth', 'scale', 'heading', 'bank', 'pitch']) assert.ok(Math.abs(initial[field] - wrapped[field]) < 1e-12);
  }
});

test('Patrol layout stays inside its fixed camera at mobile and desktop sizes', () => {
  for (const [width, height] of [[288, 300], [720, 450], [1360, 520]]) {
    for (let index = 0; index < 17; index++) for (const phase of [0, 1, 3, 5]) {
      const point = fleetPoint(index, 17, width, height, phase, 'crew');
      const dimensions = fleetMetrics(17, width, height, 'crew');
      assert.ok(point.x >= dimensions.buttonWidth / 2 && point.x <= width - dimensions.buttonWidth / 2);
      assert.ok(point.y >= dimensions.buttonHeight / 2 && point.y <= height - dimensions.buttonHeight / 2);
    }
  }
});

test('Fleet targets stay at least44px, never overlap or clip in narrow and short desktop maps', () => {
  for (const [width, height] of [[288, 250], [288, 276], [288, 300], [720, 350], [1200, 250], [1200, 276]]) for (const phase of [0, 1, 3, 5]) {
    const dimensions = fleetMetrics(17, width, height, 'crew');
    assert.equal(dimensions.picker, false);
    assert.ok(dimensions.buttonHeight >= 44 && dimensions.buttonWidth >= 44);
    const rectangles = Array.from({ length: 17 }, (_, index) => {
      const point = fleetPoint(index, 17, width, height, phase, 'crew');
      return { left: point.x - dimensions.buttonWidth / 2, right: point.x + dimensions.buttonWidth / 2, top: point.y - dimensions.buttonHeight / 2, bottom: point.y + dimensions.buttonHeight / 2 };
    });
    for (const [index, rect] of rectangles.entries()) {
      assert.ok(rect.left >= 0 && rect.right <= width && rect.top >= 0 && rect.bottom <= height);
      for (const other of rectangles.slice(index + 1)) assert.ok(rect.right <= other.left || rect.left >= other.right || rect.bottom <= other.top || rect.top >= other.bottom);
    }
  }
});

test('Too-short fleet workspaces use an internally scrollable static picker rather than clipping targets', () => {
  assert.equal(fleetMetrics(17, 288, 219, 'crew').picker, true);
  assert.equal(fleetMetrics(17, 288, 220, 'crew').picker, false);
});

test('Home patrols use three different inclined3D planes with visible depth and fixed camera bounds', () => {
  assert.equal(new Set(FLEET_ORBITS.map(orbit => orbit.inclination)).size, 3);
  for (const [width, height] of [[1240, 528], [760, 650], [288, 330]]) for (const phase of [0, 1, 3, 5]) for (let index = 0; index < 17; index++) {
    const point = fleetOrbitalState(index, 17, width, height, phase);
    assert.ok(point.x >= 26 && point.x <= width - 26);
    assert.ok(point.y >= 26 && point.y <= height - 26);
    assert.ok(point.scale >= .69 && point.scale <= 1.03);
    assert.ok(Number.isFinite(point.heading) && Number.isFinite(point.bank));
  }
  const front = projectedOrbit(2, Math.PI / 2, 1200, 600), back = projectedOrbit(2, Math.PI * 1.5, 1200, 600);
  assert.ok(front.depth > 0 && back.depth < 0);
  assert.ok(front.scale > back.scale);
  const traces = FLEET_ORBITS.map((_, index) => fleetOrbitTrace(index, 1200, 600, true));
  assert.equal(new Set(traces).size, 3);
  assert.ok(traces.every(trace => trace.startsWith('M') && (trace.match(/L/g) || []).length === 48));
  assert.equal(fleetSeed('khai'), fleetSeed('khai'));
  assert.notEqual(fleetSeed('khai'), fleetSeed('ice'));
});
