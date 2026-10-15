import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { transform } from "esbuild";

const source = readFileSync(new URL("../src/composables/useAtlasCamera.ts", import.meta.url), "utf8");
const compiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const world = { x: 32, y: 60, width: 3136, height: 1050 };
const padding = { top: 24, right: 24, bottom: 104, left: 24 };

function runtime({ width = 1440, height = 640, reduced = true, insets = () => padding, bounds = world } = {}) {
  const mounted = [], unmounted = [], watchers = [], frames = new Map(), cancelled = [], observers = [];
  let clock = 0, nextFrame = 1;
  const reducedMotion = { value: reduced }, captured = new Set();
  const element = {
    clientWidth: width, clientHeight: height,
    getBoundingClientRect: () => ({ left: 32, top: 80 }),
    setPointerCapture: (id) => captured.add(id), hasPointerCapture: (id) => captured.has(id),
    releasePointerCapture: (id) => captured.delete(id),
  };
  const context = vm.createContext({
    module: { exports: {} },
    require(name) {
      if (name === "vue") return {
        reactive: (value) => value, ref: (value) => ({ value }),
        computed: (get) => ({ get value() { return get(); } }),
        onMounted: (callback) => mounted.push(callback), onBeforeUnmount: (callback) => unmounted.push(callback),
        watch: (_value, callback) => watchers.push(callback),
      };
      if (name === "./useReducedMotion") return { useReducedMotion: () => ({ prefersReducedMotion: reducedMotion }) };
      throw new Error("Unexpected module in camera test");
    },
    performance: { now: () => clock },
    requestAnimationFrame: (callback) => { const id = nextFrame++; frames.set(id, callback); return id; },
    cancelAnimationFrame: (id) => { cancelled.push(id); frames.delete(id); },
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
      trigger() { if (!this.disconnected) this.callback(); }
    },
  });
  vm.runInContext(compiled.code, context);
  const camera = context.module.exports.useAtlasCamera({ value: element }, bounds, insets);
  mounted.forEach((callback) => callback());
  return {
    ...camera, element, frames, cancelled, observers, captured,
    step(ms) { clock += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback(clock)); },
    setReduced(value) { reducedMotion.value = value; watchers.forEach((callback) => callback(value)); },
    unmount() { unmounted.forEach((callback) => callback()); },
  };
}

function close(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${message}: ${actual} versus ${expected}`);
}

function screenRect(camera, rect) {
  return { left: camera.x + rect.x * camera.scale, top: camera.y + rect.y * camera.scale,
    right: camera.x + (rect.x + rect.width) * camera.scale, bottom: camera.y + (rect.y + rect.height) * camera.scale };
}

function inside(camera, rect, width, height, insets) {
  const screen = screenRect(camera, rect);
  assert.ok(screen.left >= insets.left - 1e-8);
  assert.ok(screen.top >= insets.top - 1e-8);
  assert.ok(screen.right <= width - insets.right + 1e-8);
  assert.ok(screen.bottom <= height - insets.bottom + 1e-8);
}

function wheel({ deltaX = 0, deltaY = 0, deltaMode = 0, ctrlKey = false, metaKey = false, clientX = 400, clientY = 300 } = {}) {
  const event = { deltaX, deltaY, deltaMode, ctrlKey, metaKey, clientX, clientY, prevented: 0, stopped: 0 };
  event.preventDefault = () => { event.prevented++; };
  event.stopPropagation = () => { event.stopped++; };
  return event;
}

test("Reduced-motion focus updates geometry immediately without scheduling RAF", () => {
  const view = runtime();
  view.focus({ x: 1000, y: 300, width: 428, height: 284 });
  assert.equal(view.frames.size, 0);
  close(view.camera.scale, 1.25, "focus upper scale");
  close(view.camera.x + 1214 * view.camera.scale, 720, "focused target center x");
  close(view.camera.y + 442 * view.camera.scale, 280, "focused target center y");
  assert.match(view.transform.value, /^translate\(.+\) scale\(1\.25\)$/);
});

test("Fit keeps the entire declared process world within camera insets", () => {
  for (const [width, height] of [[1440, 640], [1024, 640], [654, 460]]) {
    const view = runtime({ width, height });
    inside(view.camera, world, width, height, padding);
    assert.equal(view.viewportSize.width, width);
    assert.equal(view.viewportSize.height, height);
  }
});

test("Explicit framing utility respects insets at narrow inspector layout widths", () => {
  // Static geometry acceptance, not a browser measurement of CSS or rendered text.
  for (const [pageWidth, pagePadding, detailWidth] of [[1440, 64, 360], [1024, 48, 320]]) {
    const width = pageWidth - pagePadding - 2 - detailWidth, height = 640;
    const view = runtime({ width, height });
    const selected = { x: 1140, y: 358, width: 428, height: 284 };
    view.focus(selected);
    inside(view.camera, selected, width, height, padding);
    inside(view.camera, { x: 1204, y: 390, width: 300, height: 220 }, width, height, padding);
  }
});

test("Explicit framing can include both parallel branches when a caller deliberately requests it", () => {
  const selection = { x: 1520, y: 118, width: 428, height: 764 };
  const branches = [{ x: 1584, y: 150, width: 300, height: 220 }, { x: 1584, y: 630, width: 300, height: 220 }];
  for (const [width, height] of [[1014, 640], [654, 640], [654, 460]]) {
    const view = runtime({ width, height });
    view.focus(selection);
    inside(view.camera, selection, width, height, padding);
    branches.forEach((branch) => inside(view.camera, branch, width, height, padding));
  }
});

test("Asymmetric insets are respected by focus and minimap centering", () => {
  const insets = { top: 40, right: 360, bottom: 104, left: 32 };
  const view = runtime({ insets: () => insets });
  const target = { x: 800, y: 300, width: 428, height: 284 };
  view.focus(target);
  inside(view.camera, target, 1440, 640, insets);
  view.centerAt(1200, 500);
  close(view.camera.x + 1200 * view.camera.scale, (1440 + 32 - 360) / 2, "inset center x");
  close(view.camera.y + 500 * view.camera.scale, (640 + 40 - 104) / 2, "inset center y");
});

test("Zoom clamps to 15–160 percent and preserves the cursor's world point", () => {
  const view = runtime();
  Object.assign(view.camera, { x: -700, y: 125, scale: 0.8 });
  const cursor = { x: 444, y: 280 };
  const before = { x: (cursor.x - view.camera.x) / view.camera.scale, y: (cursor.y - view.camera.y) / view.camera.scale };
  for (const factor of [1.2, 100, 0.0001, 1.2]) {
    view.zoom(factor, cursor.x, cursor.y);
    assert.ok(view.camera.scale >= 0.15 && view.camera.scale <= 1.6);
    close((cursor.x - view.camera.x) / view.camera.scale, before.x, "world cursor x");
    close((cursor.y - view.camera.y) / view.camera.scale, before.y, "world cursor y");
  }
  view.zoom(100); close(view.camera.scale, 1.6, "maximum zoom");
  view.zoom(0.0001); close(view.camera.scale, 0.15, "minimum zoom");
});

test("Wheel pan normalizes pixel, line and page deltas and contains the event", () => {
  for (const [deltaMode, unit] of [[0, 1], [1, 16], [2, 640]]) {
    const view = runtime();
    Object.assign(view.camera, { x: 100, y: 200, scale: 0.8 });
    const event = wheel({ deltaMode, deltaX: 0.25, deltaY: 0.5 });
    view.wheel(event);
    close(view.camera.x, 100 - 0.25 * unit, "pan x");
    close(view.camera.y, 200 - 0.5 * unit, "pan y");
    close(view.camera.scale, 0.8, "pan does not zoom");
    assert.equal(event.prevented, 1); assert.equal(event.stopped, 1);
  }
});

test("Ctrl/Meta wheel normalizes modes and zooms about viewport-local cursor coordinates", () => {
  for (const modifier of ["ctrlKey", "metaKey"]) {
    for (const [deltaMode, deltaY] of [[0, 16], [1, 1], [2, 16 / 640]]) {
      const view = runtime();
      Object.assign(view.camera, { x: -200, y: 50, scale: 0.8 });
      const local = { x: 400 - 32, y: 300 - 80 };
      const worldPoint = { x: (local.x + 200) / 0.8, y: (local.y - 50) / 0.8 };
      const event = wheel({ deltaMode, deltaY, [modifier]: true });
      view.wheel(event);
      close(view.camera.scale, 0.8 * Math.exp(-16 * 0.003), "normalized wheel scale");
      close((local.x - view.camera.x) / view.camera.scale, worldPoint.x, "wheel anchor x");
      close((local.y - view.camera.y) / view.camera.scale, worldPoint.y, "wheel anchor y");
      assert.equal(event.prevented, 1); assert.equal(event.stopped, 1);
    }
  }
});

test("Opening and closing an inspector measures its viewport without reframing the camera", () => {
  const view = runtime({ width: 1374 });
  Object.assign(view.camera, { x: -320, y: 52, scale: 0.73 });
  const before = { ...view.camera };
  view.element.clientWidth = 1014;
  view.observers[0].trigger();
  assert.equal(view.viewportSize.width, 1014);
  assert.deepEqual({ ...view.camera }, before);
  view.element.clientWidth = 1374;
  view.observers[0].trigger();
  assert.deepEqual({ ...view.camera }, before);
});

test("Initial fit waits for the first nonzero viewport and never repeats on resize", () => {
  const view = runtime({ width: 0, height: 0 });
  assert.equal(view.camera.scale, 0.3);
  view.element.clientWidth = 1440;
  view.element.clientHeight = 640;
  view.observers[0].trigger();
  inside(view.camera, world, 1440, 640, padding);
  const initial = { ...view.camera };
  view.element.clientWidth = 1000;
  view.observers[0].trigger();
  assert.deepEqual({ ...view.camera }, initial);
});

test("Rendered fit bounds are recomputed only for initial or explicitly requested Fit", () => {
  const measured = [];
  const view = runtime({ bounds(size) { measured.push({ ...size }); return world; } });
  assert.equal(measured.length, 1);
  view.element.clientWidth = 1000;
  view.observers[0].trigger();
  assert.equal(measured.length, 1);
  view.fit(false);
  assert.equal(measured.length, 2);
  assert.equal(measured[1].width, 1000);
});

test("Selecting an already-visible card never moves or zooms the camera", () => {
  const view = runtime();
  Object.assign(view.camera, { x: 100, y: 100, scale: 0.7 });
  const before = { ...view.camera };
  view.ensureVisible({ x: 200, y: 100, width: 300, height: 220 });
  assert.deepEqual({ ...view.camera }, before);
  assert.equal(view.frames.size, 0);
});

test("Selecting a hidden card pans only the minimum distance and never changes scale", () => {
  const view = runtime();
  Object.assign(view.camera, { x: 0, y: 0, scale: 0.8 });
  const target = { x: 1700, y: 600, width: 300, height: 220 };
  view.ensureVisible(target);
  close(view.camera.x, 1440 - padding.right - 2000 * 0.8, "minimum horizontal pan");
  close(view.camera.y, 640 - padding.bottom - 820 * 0.8, "minimum vertical pan");
  close(view.camera.scale, 0.8, "selection preserves zoom");
  inside(view.camera, target, 1440, 640, padding);
  const beforeClose = { ...view.camera };
  view.element.clientWidth = 1800;
  view.observers[0].trigger();
  assert.deepEqual({ ...view.camera }, beforeClose);
});

test("Direct keyboard pan cancels stale animated selection or fit frames", () => {
  const view = runtime({ reduced: false });
  view.focus({ x: 1000, y: 300, width: 428, height: 284 });
  const staleFrame = [...view.frames.values()][0];
  const before = { ...view.camera };
  view.panBy(72, -72);
  const direct = { ...view.camera };
  close(direct.x, before.x + 72, "keyboard pan x");
  close(direct.y, before.y - 72, "keyboard pan y");
  assert.equal(view.frames.size, 0);
  staleFrame(360);
  assert.deepEqual({ ...view.camera }, direct);
});

test("Pointer drag ignores interactive targets and releases capture on end/cancel", () => {
  const view = runtime(), target = { closest: () => null };
  view.pointerDown({ button: 0, pointerId: 7, clientX: 100, clientY: 200, target: { closest: () => ({}) } });
  assert.equal(view.dragging.value, false);
  view.pointerDown({ button: 2, pointerId: 7, clientX: 100, clientY: 200, target });
  assert.equal(view.dragging.value, false);
  const before = { ...view.camera };
  view.pointerDown({ button: 0, pointerId: 7, clientX: 100, clientY: 200, target });
  assert.equal(view.dragging.value, true); assert.equal(view.captured.has(7), true);
  view.pointerMove({ pointerId: 8, clientX: 200, clientY: 250 });
  close(view.camera.x, before.x, "unrelated pointer ignored");
  view.pointerMove({ pointerId: 7, clientX: 200, clientY: 250 });
  close(view.camera.x, before.x + 100, "drag x"); close(view.camera.y, before.y + 50, "drag y");
  view.pointerUp({ pointerId: 8 }); assert.equal(view.dragging.value, true);
  view.pointerUp({ pointerId: 7 });
  assert.equal(view.dragging.value, false); assert.equal(view.captured.has(7), false);
});

test("Motion cancellation and unmount remove pending RAF and disconnect observer", () => {
  const view = runtime({ reduced: false });
  view.focus({ x: 1000, y: 300, width: 428, height: 284 });
  assert.equal(view.frames.size, 1);
  view.step(180); assert.equal(view.frames.size, 1);
  view.setReduced(true); assert.equal(view.frames.size, 0);
  view.focus({ x: 100, y: 300, width: 428, height: 284 }); assert.equal(view.frames.size, 0);
  view.setReduced(false);
  view.focus({ x: 800, y: 300, width: 428, height: 284 }); assert.equal(view.frames.size, 1);
  view.zoom(1.2); assert.equal(view.frames.size, 0);
  view.focus({ x: 1200, y: 300, width: 428, height: 284 }); assert.equal(view.frames.size, 1);
  view.unmount();
  assert.equal(view.frames.size, 0);
  assert.equal(view.observers[0].disconnected, true);
  assert.equal(view.observers[0].target, view.element);
});
