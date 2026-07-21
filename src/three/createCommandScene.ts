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
  gradient.addColorStop(0.4, "rgba(160,220,255,0.6)");
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
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.2);
    gl_FragColor = vec4(uColor, fresnel * uOpacity);
  }
`;

const GRID_VERTEX = /* glsl */ `
  varying vec2 vWorldXZ;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldXZ = worldPosition.xz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const GRID_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uFade;
  varying vec2 vWorldXZ;

  void main() {
    vec2 cell = abs(fract(vWorldXZ * 0.12) - 0.5);
    float line = 1.0 - smoothstep(0.0, 0.035, min(cell.x, cell.y));
    float dist = length(vWorldXZ);
    float fade = smoothstep(uFade, 0.0, dist);
    gl_FragColor = vec4(uColor, line * fade * 0.5);
  }
`;

export function createCommandScene(options: CommandSceneOptions): CommandSceneHandle {
  const { canvas, container } = options;
  let reducedMotion = options.reducedMotion;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.1, 8.5);
  camera.lookAt(0, 0.2, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // --- Core: layered glowing icosahedron ---
  const coreGroup = new THREE.Group();

  const coreGeometry = new THREE.IcosahedronGeometry(1.3, 2);
  const coreMaterial = new THREE.ShaderMaterial({
    vertexShader: CORE_VERTEX,
    fragmentShader: CORE_FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color(0x34bfff) },
      uOpacity: { value: 0.9 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  coreGroup.add(core);

  const wireGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.34, 1));
  const wireMaterial = new THREE.LineBasicMaterial({ color: 0xe1f5ff, transparent: true, opacity: 0.35 });
  const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
  coreGroup.add(wireframe);

  scene.add(coreGroup);

  // --- Ring group: invisible anchors + small marker dots + data lines ---
  const ringGroup = new THREE.Group();
  scene.add(ringGroup);

  const anchors = CARD_LABELS.map((card) => {
    const anchor = new THREE.Object3D();
    anchor.position.set(Math.cos(card.angle) * card.radius, card.height, Math.sin(card.angle) * card.radius);
    ringGroup.add(anchor);

    const markerGeometry = new THREE.SphereGeometry(0.05, 12, 12);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff8400 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(anchor.position);
    ringGroup.add(marker);

    const linePoints = [new THREE.Vector3(0, 0, 0), anchor.position.clone()];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x34bfff, transparent: true, opacity: 0.25 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);

    return { card, anchor, lineMaterial };
  });

  // --- Particle field ---
  const particleCount = 260;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const radius = 2.5 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 5;
    particlePositions[i * 3] = Math.cos(theta) * radius;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = Math.sin(theta) * radius;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.05,
    map: makeSpriteTexture(),
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // --- Grid floor ---
  const gridGeometry = new THREE.PlaneGeometry(30, 30, 1, 1);
  const gridMaterial = new THREE.ShaderMaterial({
    vertexShader: GRID_VERTEX,
    fragmentShader: GRID_FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color(0x34bfff) },
      uFade: { value: 9 },
    },
    transparent: true,
    depthWrite: false,
  });
  const grid = new THREE.Mesh(gridGeometry, gridMaterial);
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = -1.8;
  scene.add(grid);

  const ambient = new THREE.AmbientLight(0x8ab6ff, 0.6);
  scene.add(ambient);

  const projected: ProjectedCard[] = CARD_LABELS.map((c) => ({ label: c.label, x: 0, y: 0, scale: 1, visible: false }));

  function updateSize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  const tmpVector = new THREE.Vector3();

  function projectAnchors() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    anchors.forEach(({ anchor }, index) => {
      anchor.getWorldPosition(tmpVector);
      tmpVector.project(camera);

      const isVisible = tmpVector.z < 1;
      projected[index].x = (tmpVector.x * 0.5 + 0.5) * width;
      projected[index].y = (1 - (tmpVector.y * 0.5 + 0.5)) * height;
      projected[index].scale = THREE.MathUtils.clamp(1.15 - tmpVector.z * 0.3, 0.75, 1.2);
      projected[index].visible = isVisible;
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
      coreGroup.rotation.x = Math.sin(elapsed * 0.15) * 0.05;
      wireframe.rotation.y = -elapsed * 0.08;
      ringGroup.rotation.y = elapsed * 0.06;
      particles.rotation.y = elapsed * 0.02;

      anchors.forEach(({ lineMaterial }, index) => {
        lineMaterial.opacity = 0.15 + Math.abs(Math.sin(elapsed * 0.6 + index)) * 0.25;
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
    particleGeometry.dispose();
    particleMaterial.dispose();
    gridGeometry.dispose();
    gridMaterial.dispose();
    anchors.forEach(({ lineMaterial }) => lineMaterial.dispose());
    renderer.dispose();
  }

  function setReducedMotion(value: boolean) {
    reducedMotion = value;
    if (!running) {
      renderFrame();
    }
  }

  return { start, stop, dispose, resize: updateSize, setReducedMotion };
}
