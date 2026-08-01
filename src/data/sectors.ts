import type { CategoryId } from "../types/links";

export type ShipArch = "scout" | "interceptor" | "cruiser" | "shuttle";

export interface Sector {
  slug: string;
  name: string;
  code: string;
  accent: string;
  ring: 0 | 1 | 2;
  /** initial angle (radians) */
  ang: number;
  /** angular speed per frame (sign = direction) */
  spd: number;
  arch: ShipArch;
  archLabel: string;
  tip: string;
  /** maps a sector to the existing link category so a click filters the workspace */
  categoryId: CategoryId;
}

const ARCH_LABEL: Record<ShipArch, string> = {
  scout: "SCOUT CRAFT",
  interceptor: "DATA INTERCEPTOR",
  cruiser: "GUARDIAN CRUISER",
  shuttle: "COMMAND SHUTTLE",
};

const RAW: Omit<Sector, "archLabel">[] = [
  {
    slug: "sops",
    name: "SOPs",
    code: "A1",
    accent: "#B794F6",
    ring: 0,
    ang: 0.2,
    spd: 0.006,
    arch: "scout",
    tip: "Standard operating procedures and control playbooks that keep the mission consistent.",
    categoryId: "sop-policy-training",
  },
  {
    slug: "netsuite",
    name: "NetSuite",
    code: "A2",
    accent: "#7C8BFF",
    ring: 0,
    ang: 2.3,
    spd: 0.006,
    arch: "interceptor",
    tip: "ERP dashboards, saved searches, and reconciliation views inside NetSuite.",
    categoryId: "netsuite-saved-searches",
  },
  {
    slug: "country-files",
    name: "Country Files",
    code: "A3",
    accent: "#5FB0C4",
    ring: 0,
    ang: 4.4,
    spd: 0.006,
    arch: "cruiser",
    tip: "Per-market working files across all six SEA markets.",
    categoryId: "country-working-files",
  },
  {
    slug: "templates",
    name: "Templates",
    code: "B1",
    accent: "#FF9D1E",
    ring: 1,
    ang: 1.0,
    spd: -0.0046,
    arch: "scout",
    tip: "Upload templates, invoice support files, and standardized working papers.",
    categoryId: "templates-upload-files",
  },
  {
    slug: "review-cockpit",
    name: "Review Cockpit",
    code: "B2",
    accent: "#8EDAB2",
    ring: 1,
    ang: 3.1,
    spd: -0.0046,
    arch: "interceptor",
    tip: "The pilot seat for reviewing, approving, and signing off claims.",
    categoryId: "review-cockpits",
  },
  {
    slug: "admin",
    name: "Admin / Access",
    code: "B3",
    accent: "#ED2C70",
    ring: 1,
    ang: 5.2,
    spd: -0.0046,
    arch: "shuttle",
    tip: "Access control, roles, and permissions for the command center.",
    categoryId: "admin-access",
  },
  {
    slug: "ar-monitoring",
    name: "AR Monitoring",
    code: "C1",
    accent: "#FEBC10",
    ring: 2,
    ang: 0.7,
    spd: 0.0032,
    arch: "cruiser",
    tip: "Live accounts-receivable trackers, ageing radars, and recovery status.",
    categoryId: "ar-collection",
  },
  {
    slug: "project-workspace",
    name: "Project Workspace",
    code: "C2",
    accent: "#F9882E",
    ring: 2,
    ang: 3.6,
    spd: 0.0032,
    arch: "shuttle",
    tip: "Active projects, initiatives, and mission workspaces.",
    categoryId: "project-workspace",
  },
];

export const sectors: Sector[] = RAW.map((s) => ({ ...s, archLabel: ARCH_LABEL[s.arch] }));

/** Ellipse radii per orbital ring, as a fraction of the stage size (kept ≤0.5 so the fleet never overflows). */
export const RING_GEOMETRY = [
  { rx: 0.3, ry: 0.13 },
  { rx: 0.4, ry: 0.17 },
  { rx: 0.5, ry: 0.21 },
];
