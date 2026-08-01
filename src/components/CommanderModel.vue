<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useReducedMotion } from "../composables/useReducedMotion";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const failed = ref(false);
const { prefersReducedMotion } = useReducedMotion();

// Kept loosely typed: three is imported dynamically so a load failure can never break the app.
let dispose: (() => void) | null = null;

async function init() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  try {
    const THREE = await import("three");
    // @ts-ignore — examples/jsm loader types are not always resolved; runtime is guarded by try/catch.
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const resize = () => {
      const w = canvas.clientWidth || 232;
      const h = canvas.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    scene.add(new THREE.AmbientLight(0x9fc4ff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 4, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4fd9ff, 1.2);
    rim.position.set(-3, 2, -2);
    scene.add(rim);

    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync("/models/crew/khai.glb");
    const model = gltf.scene;

    // Center on the ground, frame with the camera.
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;
    scene.add(model);

    const height = size.y || 1.6;
    camera.position.set(0, height * 0.58, height * 2.15);
    camera.lookAt(0, height * 0.5, 0);

    const clock = new THREE.Clock();
    let mixer: import("three").AnimationMixer | null = null;
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      mixer.clipAction(gltf.animations[0]).play();
    }

    let frameId = 0;
    let running = true;
    const reduce = prefersReducedMotion.value;

    const loop = () => {
      if (!running) return;
      const dt = clock.getDelta();
      if (mixer && !reduce) mixer.update(dt);
      if (!reduce) model.rotation.y = Math.sin(clock.getElapsedTime() * 0.25) * 0.22;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(loop);
    };
    renderer.render(scene, camera);
    if (!reduce) frameId = requestAnimationFrame(loop);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    dispose = () => {
      running = false;
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.dispose();
      scene.traverse((obj) => {
        const mesh = obj as import("three").Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as import("three").Material | import("three").Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
    };
  } catch {
    failed.value = true;
  }
}

onMounted(() => {
  const idle = "requestIdleCallback" in window ? window.requestIdleCallback : (cb: () => void) => setTimeout(cb, 200);
  idle(() => init());
});

onBeforeUnmount(() => dispose?.());
</script>

<template>
  <canvas v-show="!failed" ref="canvasRef" class="commander-canvas" aria-hidden="true"></canvas>
</template>

<style scoped>
.commander-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
