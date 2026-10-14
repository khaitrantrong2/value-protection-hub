import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, type Ref } from "vue";
import { useReducedMotion } from "./useReducedMotion";

export interface AtlasBounds { x: number; y: number; width: number; height: number }
export interface AtlasInsets { top: number; right: number; bottom: number; left: number }
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Camera moves geometry only. Node text is rendered separately in screen space. */
export function useAtlasCamera(viewport: Ref<HTMLElement | null>, bounds: AtlasBounds, insets: () => AtlasInsets) {
  const camera = reactive({ x: 0, y: 0, scale: 0.3 });
  const viewportSize = reactive({ width: 0, height: 0 });
  const dragging = ref(false);
  const { prefersReducedMotion } = useReducedMotion();
  const transform = computed(() => `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`);
  let animation = 0;
  let observer: ResizeObserver | undefined;
  let drag: { pointer: number; x: number; y: number; cameraX: number; cameraY: number } | undefined;
  let resized: (() => void) | undefined;

  function stop() { cancelAnimationFrame(animation); animation = 0; }
  function move(target: { x: number; y: number; scale: number }, animate = true) {
    stop();
    if (!animate || prefersReducedMotion.value) { Object.assign(camera, target); return; }
    const start = performance.now();
    const from = { ...camera };
    const frame = (now: number) => {
      const progress = Math.min(1, (now - start) / 360);
      const ease = 1 - Math.pow(1 - progress, 3);
      camera.x = from.x + (target.x - from.x) * ease;
      camera.y = from.y + (target.y - from.y) * ease;
      camera.scale = from.scale + (target.scale - from.scale) * ease;
      if (progress < 1) animation = requestAnimationFrame(frame);
    };
    animation = requestAnimationFrame(frame);
  }
  function focus(target: AtlasBounds, animate = true) {
    const padding = insets();
    const width = Math.max(1, viewportSize.width - padding.left - padding.right);
    const height = Math.max(1, viewportSize.height - padding.top - padding.bottom);
    const scale = clamp(Math.min(width / target.width, height / target.height), 0.15, 1.25);
    move({
      scale,
      x: padding.left + width / 2 - (target.x + target.width / 2) * scale,
      y: padding.top + height / 2 - (target.y + target.height / 2) * scale,
    }, animate);
  }
  function fit(animate = true) { focus(bounds, animate); }
  function zoom(factor: number, x = viewportSize.width / 2, y = viewportSize.height / 2) {
    const scale = clamp(camera.scale * factor, 0.15, 1.6);
    const ratio = scale / camera.scale;
    move({ scale, x: x - (x - camera.x) * ratio, y: y - (y - camera.y) * ratio }, false);
  }
  function wheel(event: WheelEvent) {
    event.preventDefault();
    event.stopPropagation();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportSize.height : 1;
    if (event.ctrlKey || event.metaKey) {
      const rect = viewport.value!.getBoundingClientRect();
      zoom(Math.exp(-event.deltaY * unit * 0.003), event.clientX - rect.left, event.clientY - rect.top);
    } else {
      stop();
      camera.x -= event.deltaX * unit;
      camera.y -= event.deltaY * unit;
    }
  }
  function pointerDown(event: PointerEvent) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button,a,summary")) return;
    stop();
    drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y };
    viewport.value?.setPointerCapture(event.pointerId);
    dragging.value = true;
  }
  function pointerMove(event: PointerEvent) {
    if (!drag || drag.pointer !== event.pointerId) return;
    camera.x = drag.cameraX + event.clientX - drag.x;
    camera.y = drag.cameraY + event.clientY - drag.y;
  }
  function pointerUp(event: PointerEvent) {
    if (!drag || drag.pointer !== event.pointerId) return;
    if (viewport.value?.hasPointerCapture(event.pointerId)) viewport.value.releasePointerCapture(event.pointerId);
    drag = undefined;
    dragging.value = false;
  }
  function centerAt(x: number, y: number) {
    const padding = insets();
    move({ scale: camera.scale,
      x: (viewportSize.width + padding.left - padding.right) / 2 - x * camera.scale,
      y: (viewportSize.height + padding.top - padding.bottom) / 2 - y * camera.scale,
    });
  }
  function onResize(callback: () => void) { resized = callback; }
  function measure() {
    viewportSize.width = viewport.value?.clientWidth ?? 0;
    viewportSize.height = viewport.value?.clientHeight ?? 0;
    if (viewportSize.width && viewportSize.height) resized ? resized() : fit(false);
  }
  onMounted(() => {
    observer = new ResizeObserver(measure);
    if (viewport.value) observer.observe(viewport.value);
    measure();
  });
  watch(prefersReducedMotion, value => { if (value) stop(); });
  onBeforeUnmount(() => { stop(); observer?.disconnect(); });
  return { camera, viewportSize, transform, dragging, focus, fit, zoom, wheel, pointerDown, pointerMove, pointerUp, centerAt, onResize };
}
