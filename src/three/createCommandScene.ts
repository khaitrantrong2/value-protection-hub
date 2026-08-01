import * as THREE from "three";
import { CARD_LABELS } from "./cardAnchors";

export interface ProjectedCard {
  label: string;
  x: number;
  y: number;
  scale: number;
  visible: boolean;
}

export interface CommandSceneHandle {
  start: () => void;
  stop: () => void;
  dispose: () => void;
  resize: () => void;
  setReducedMotion: (reduced: boolean) => void;
}

export interface CommandSceneOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  reducedMotion: boolean;
  onFrame: (cards: ProjectedCard[]) => void;
}

function makeSpriteTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(160,220,255,0.55)");
  gradient.addColorStop(1, "rgba(160,220,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const CORE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const CORE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.4);
    gl_FragColor = vec4(uColor, fresnel * uOpacity);
  }
`;

export function createCommandScene(options: CommandSceneOptions): CommandSceneHandle {
  const { canvas, container } = options;
  let reducedMotion = options.reducedMotion;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.0, 8.6);
  camera.lookAt(0, 0.1, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Root group — offset to the right so the network never sits under the hero copy/search.
  const root = new THREE.Group();
  scene.add(root);

  // --- Core: glowing control hub ---
  const coreGroup = new THREE.Group();
  const coreGeometry = new THREE.IcosahedronGeometry(1.15, 2);
  const coreMaterial = new THREE.ShaderMaterial({
    vertexShader: CORE_VERTEX,
    fragmentShader: CORE_FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color(0xb794f6) },
      uOpacity: { value: 0.85 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  coreGroup.add(new THREE.Mesh(coreGeometry, coreMaterial));

  const wireGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.2, 1));
  const wireMaterial = new THREE.LineBasicMaterial({ color: 0xe1f5ff, transparent: true, opacity: 0.3 });
  const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
  coreGroup.add(wireframe);
  root.add(coreGroup);

  // --- Static orbit ring (the "control network" band) ---
  const orbitRadius = 3.3;
  const orbitGeometry = new THREE.RingGeometry(orbitRadius - 0.012, orbitRadius + 0.012, 96);
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: 0xb794f6,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
  });
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2.35;
  root.add(orbit);

  // --- Nodes: markers + spokes from the core ---
  const nodeGroup = new THREE.Group();
  root.add(nodeGroup);

  const markerGeometry = new THREE.SphereGeometry(0.055, 14, 14);

  const anchors = CARD_LABELS.map((card) => {
    const pos = new THREE.Vector3(
      Math.cos(card.angle) * card.radius,
      card.height * 0.7,
      Math.sin(card.angle) * card.radius,
    );

    const anchor = new THREE.Object3D();
    anchor.position.copy(pos);
    nodeGroup.add(anchor);

    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xf5b342 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(pos);
    nodeGroup.add(marker);

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos.clone()]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xb794f6, transparent: true, opacity: 0.2 });
    nodeGroup.add(new THREE.Line(lineGeometry, lineMaterial));

    return { card, anchor, marker, markerMaterial, lineGeometry, lineMaterial };
  });

  // --- Sparse particle dust ---
  const particleCount = 64;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const radius = 3 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    particlePositions[i * 3] = Math.cos(theta) * radius;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 4.5;
    particlePositions[i * 3 + 2] = Math.sin(theta) * radius;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particleTexture = makeSpriteTexture();
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.035,
    map: particleTexture,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  root.add(particles);

  scene.add(new THREE.AmbientLight(0x8ab6ff, 0.6));

  const projected: ProjectedCard[] = CARD_LABELS.map((c) => ({ label: c.label, x: 0, y: 0, scale: 1, visible: false }));

  let isWide = true;

  function updateSize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);

    isWide = width / height > 1.1;
    // Push the network toward the right on wide screens; keep it centred on narrow ones.
    root.position.x = isWide ? 2.4 : 0;
    root.position.y = isWide ? 0 : 1.1;
  }

  const tmpVector = new THREE.Vector3();

  function projectAnchors() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const minX = isWide ? width * 0.36 : 0;

    anchors.forEach(({ anchor }, index) => {
      anchor.getWorldPosition(tmpVector);
      tmpVector.project(camera);

      const x = (tmpVector.x * 0.5 + 0.5) * width;
      const y = (1 - (tmpVector.y * 0.5 + 0.5)) * height;
      projected[index].x = x;
      projected[index].y = y;
      projected[index].scale = THREE.MathUtils.clamp(1.12 - tmpVector.z * 0.3, 0.78, 1.15);
      projected[index].visible = tmpVector.z < 1 && x >= minX && x <= width * 0.99;
    });

    options.onFrame(projected);
  }

  let frameId = 0;
  let running = false;
  const clock = new THREE.Clock();

  function renderFrame() {
    const elapsed = clock.getElapsedTime();

    if (!reducedMotion) {
      coreGroup.rotation.y = elapsed * 0.12;
      coreGroup.rotation.x = Math.sin(elapsed * 0.15) * 0.04;
      wireframe.rotation.y = -elapsed * 0.08;
      nodeGroup.rotation.y = elapsed * 0.05;
      particles.rotation.y = elapsed * 0.015;

      anchors.forEach(({ markerMaterial, lineMaterial }, index) => {
        const pulse = 0.5 + Math.abs(Math.sin(elapsed * 0.6 + index)) * 0.5;
        markerMaterial.opacity = 0.55 + pulse * 0.45;
        lineMaterial.opacity = 0.12 + pulse * 0.22;
      });
    }

    renderer.render(scene, camera);
    projectAnchors();
  }

  function loop() {
    if (!running) return;
    renderFrame();
    frameId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    updateSize();
    loop();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frameId);
  }

  function dispose() {
    stop();
    coreGeometry.dispose();
    coreMaterial.dispose();
    wireGeometry.dispose();
    wireMaterial.dispose();
    orbitGeometry.dispose();
    orbitMaterial.dispose();
    markerGeometry.dispose();
    particleGeometry.dispose();
    particleMaterial.dispose();
    particleTexture.dispose();
    anchors.forEach(({ markerMaterial, lineGeometry, lineMaterial }) => {
      markerMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    });
    renderer.dispose();
  }

  function setReducedMotion(value: boolean) {
    reducedMotion = value;
    if (!running) renderFrame();
  }

  return { start, stop, dispose, resize: updateSize, setReducedMotion };
}
