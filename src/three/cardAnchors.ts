export interface CardAnchor {
  label: string;
  angle: number;
  radius: number;
  height: number;
}

const RADIUS = 3.3;
const TWO_PI = Math.PI * 2;

/**
 * Finance-control network nodes around the central hub. The first five follow the
 * claimback-to-cash workflow (Claimback → Review → Booking → Invoice → AR) laid out
 * sequentially around the ring; the last three are the supporting systems/assets.
 */
const ORDER = [
  "Claimback",
  "Review Cockpit",
  "Booking",
  "Invoice / VRA",
  "AR Monitoring",
  "NetSuite",
  "Templates",
  "SOPs",
];

const HEIGHTS = [0.25, -0.15, 0.3, -0.2, 0.2, -0.28, 0.22, -0.12];

export const CARD_LABELS: CardAnchor[] = ORDER.map((label, index) => ({
  label,
  // Start near the front-left and sweep so the workflow reads around the ring.
  angle: Math.PI * 0.85 - (index / ORDER.length) * TWO_PI,
  radius: RADIUS,
  height: HEIGHTS[index] ?? 0,
}));
