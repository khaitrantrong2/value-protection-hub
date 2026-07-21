export interface CardAnchor {
  label: string;
  angle: number;
  radius: number;
  height: number;
}

/** Floating data cards arranged in a ring around the 3D command core. */
export const CARD_LABELS: CardAnchor[] = [
  { label: "Claimback", angle: 0, radius: 3.4, height: 0.6 },
  { label: "AR Monitoring", angle: (2 * Math.PI) / 7, radius: 3.4, height: -0.4 },
  { label: "GL Review", angle: (4 * Math.PI) / 7, radius: 3.6, height: 0.9 },
  { label: "Templates", angle: (6 * Math.PI) / 7, radius: 3.3, height: -0.2 },
  { label: "SOPs", angle: (8 * Math.PI) / 7, radius: 3.5, height: 0.5 },
  { label: "NetSuite", angle: (10 * Math.PI) / 7, radius: 3.4, height: -0.6 },
  { label: "Projects", angle: (12 * Math.PI) / 7, radius: 3.3, height: 0.2 },
];
