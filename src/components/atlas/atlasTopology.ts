import type { AtlasReference, AtlasStage } from "../../types/atlas";

export const ATLAS_MAP_BOUNDS = { x: 32, y: 0, width: 3136, height: 480 };
export const ATLAS_SUPPORT_LANE = { x: 32, y: 400, width: 3136, height: 220 };

export interface AtlasMapNode {
  key: string;
  stage: AtlasStage;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  body: string;
  role: string;
  short: string;
  branch: string;
}

const shortLabels: Record<string, string> = {
  "01": "Contract", "02": "Inputs", "03": "Engine", "04": "VP review",
  "06": "Billing", "07": "Settle", "08": "Completion",
};

export function buildAtlasNodes(stages: AtlasStage[], references: AtlasReference[]): AtlasMapNode[] {
  return stages.filter(stage => stage.kind === "chapter").flatMap(stage => {
    const x = 64 + (Number(stage.id) - 1) * 380;
    if (stage.id === "05") return ["A", "B"].map((suffix, index) => {
      const reference = references.find(item => item.id === `BRANCH-05${suffix}` && item.stageId === "05");
      return { key: `05${suffix}`, stage, x, y: index === 0 ? 0 : 200, width: 300, height: 160,
        title: reference?.title || stage.shortTitle, body: reference?.body || stage.businessQuestion,
        role: reference?.applicability || stage.roleTag, short: index === 0 ? "Accounting" : "Brand confirmation", branch: `05 ${suffix}` };
    });
    return [{ key: stage.id, stage, x, y: 100, width: 300, height: 160, title: stage.shortTitle,
      body: stage.businessQuestion, role: stage.roleTag, short: shortLabels[stage.id] ?? stage.shortTitle, branch: stage.id }];
  });
}

/** These are dependency relationships, never additional business-sequence stages. */
export function buildSupportCapabilities(stages: AtlasStage[], nodes: AtlasMapNode[]) {
  return stages.filter(stage => stage.kind === "supporting").sort((a, b) => a.order - b.order).flatMap((stage, index) => {
    const consumers = nodes.filter(node => stage.supports.includes(node.stage.id));
    if (!consumers.length) return [];
    const x = Math.min(...consumers.map(node => node.x));
    const right = Math.max(...consumers.map(node => node.x + node.width));
    return [{ key: stage.id, stage, consumers, x, y: 440 + index * 112, width: right - x, height: 64 }];
  });
}

export function projectAtlasNodes(nodes: AtlasMapNode[], camera: { x: number; y: number; scale: number }) {
  return nodes.map(node => ({ ...node,
    cx: camera.x + (node.x + node.width / 2) * camera.scale,
    cy: camera.y + (node.y + node.height / 2) * camera.scale,
    screenWidth: Math.max(52, Math.min(320, node.width * camera.scale)),
    screenHeight: camera.scale < 0.52 ? 64 : Math.max(128, Math.min(224, node.height * camera.scale)),
  }));
}

/** Readable support bars retain one lane without colliding at the 15% zoom floor. */
export function projectSupportCapabilities(capabilities: ReturnType<typeof buildSupportCapabilities>, camera: { x: number; y: number; scale: number }, businessBottom: number) {
  const top = Math.max(camera.y + ATLAS_SUPPORT_LANE.y * camera.scale, businessBottom + 10);
  const rowGap = Math.max(44, 112 * camera.scale);
  const items = capabilities.map((item, index) => ({ ...item,
    cx: camera.x + (item.x + item.width / 2) * camera.scale,
    cy: top + 40 + index * rowGap,
    screenWidth: Math.max(120, item.width * camera.scale), screenHeight: 36,
  }));
  return { items, lane: { left: camera.x + ATLAS_SUPPORT_LANE.x * camera.scale, top,
    width: ATLAS_SUPPORT_LANE.width * camera.scale, height: 70 + Math.max(0, items.length - 1) * rowGap } };
}

/** Fit the rendered projection, including readable labels, rather than an inflated world rectangle. */
export function atlasOverviewBounds(nodes: AtlasMapNode[], capabilities: ReturnType<typeof buildSupportCapabilities>, viewport: { width: number; height: number }, insets: { top: number; right: number; bottom: number; left: number }) {
  const availableWidth = Math.max(1, viewport.width - insets.left - insets.right);
  const availableHeight = Math.max(1, viewport.height - insets.top - insets.bottom);
  function extent(scale: number) {
    const projected = projectAtlasNodes(nodes, { x: 0, y: 0, scale });
    const top = Math.min(...projected.map(node => node.cy - node.screenHeight / 2));
    const businessBottom = Math.max(...projected.map(node => node.cy + node.screenHeight / 2));
    const support = projectSupportCapabilities(capabilities, { x: 0, y: 0, scale }, businessBottom);
    const bottom = capabilities.length ? support.lane.top + support.lane.height : businessBottom;
    return { top, height: bottom - top };
  }
  let scale = Math.max(0.15, Math.min(1.25, availableWidth / ATLAS_MAP_BOUNDS.width));
  if (extent(scale).height > availableHeight) {
    let low = 0.15, high = scale;
    for (let index = 0; index < 16; index++) {
      const middle = (low + high) / 2;
      if (extent(middle).height <= availableHeight) low = middle;
      else high = middle;
    }
    scale = low;
  }
  const projection = extent(scale);
  return { x: ATLAS_MAP_BOUNDS.x, y: projection.top / scale, width: ATLAS_MAP_BOUNDS.width, height: projection.height / scale };
}

export const ATLAS_SEQUENCE_EDGES = [
  ["01", "02"], ["02", "03"], ["03", "04"], ["04", "05A"], ["04", "05B"],
  ["05A", "06"], ["05B", "06"], ["06", "07"], ["07", "08"],
] as const;
