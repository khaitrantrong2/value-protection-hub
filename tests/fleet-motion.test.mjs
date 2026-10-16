import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { transform } from 'esbuild';

const compiled = await transform(readFileSync(new URL('../src/services/fleetMotion.ts', import.meta.url), 'utf8'), { loader: 'ts', format: 'cjs' });
const context = vm.createContext({ module: { exports: {} }, Math, Number });
vm.runInContext(compiled.code, context);
const { advancePatrol, fleetPoint, fleetSeed, fleetMetrics } = context.module.exports;

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

test('Home patrols form a spaced outer ellipse, keeping the central planet system clear', () => {
  for (const phase of [0, 1, 3, 5]) for (let index = 0; index < 17; index++) {
    const point = fleetPoint(index, 17, 1240, 528, phase, 'home');
    const radius = ((point.x - 620) / 572) ** 2 + ((point.y - 264) / 208) ** 2;
    assert.ok(Math.abs(radius - 1) < 1e-10);
    assert.ok(point.x >= 48 && point.x <= 1192);
    assert.ok(point.y >= 56 && point.y <= 472);
  }
  assert.equal(fleetSeed('khai'), fleetSeed('khai'));
  assert.notEqual(fleetSeed('khai'), fleetSeed('ice'));
});
