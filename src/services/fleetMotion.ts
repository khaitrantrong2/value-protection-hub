/** Patrol positions are visual only: no rank, workload or ownership is encoded. */
export interface FleetPoint { x: number; y: number }
export type FleetVariant = 'home' | 'crew';
export type FleetHull = 'scout' | 'interceptor' | 'cruiser' | 'shuttle' | 'lancer' | 'twinwing' | 'nova' | 'falcon' | 'aegis';
export interface OrbitalPoint extends FleetPoint { depth: number; scale: number; heading: number; bank: number }

/** Three physical orbit planes: ascending node, inclination and orbital radius. */
export const FLEET_ORBITS = [
  { node: -.32, inclination: .38, radius: .98 },
  { node: .54, inclination: .92, radius: .9 },
  { node: -.86, inclination: 1.16, radius: .8 },
] as const;

export function projectedOrbit(track: number, angle: number, width: number, height: number): OrbitalPoint {
  const orbit = FLEET_ORBITS[track % FLEET_ORBITS.length];
  const project = (theta: number) => {
    const u = Math.cos(theta), v = Math.sin(theta) * Math.cos(orbit.inclination), z = Math.sin(theta) * Math.sin(orbit.inclination);
    const perspective = 1 / (1 - z * .13);
    return {
      x: width / 2 + (u * Math.cos(orbit.node) - v * Math.sin(orbit.node)) * Math.max(0, width / 2 - 58) * orbit.radius * perspective,
      y: height / 2 + (u * Math.sin(orbit.node) + v * Math.cos(orbit.node)) * Math.max(0, height / 2 - 68) * orbit.radius * perspective,
      depth: z,
    };
  };
  const point = project(angle), next = project(angle + .001);
  return { ...point, scale: .86 + point.depth * .17, heading: Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI + 90, bank: Math.sin(angle) * 17 };
}

export function fleetOrbitalState(index: number, total: number, width: number, height: number, phase: number): OrbitalPoint {
  const track = index % FLEET_ORBITS.length, count = Math.ceil((total - track) / FLEET_ORBITS.length);
  const angle = Math.floor(index / FLEET_ORBITS.length) / Math.max(count, 1) * Math.PI * 2 + track * .63 + phase;
  return projectedOrbit(track, angle, width, height);
}

/** Front/back traces use the same projected coordinates as the moving hulls. */
export function fleetOrbitTrace(track: number, width: number, height: number, front: boolean): string {
  return Array.from({ length: 49 }, (_, index) => {
    const point = projectedOrbit(track, (front ? 0 : Math.PI) + index / 48 * Math.PI, width, height);
    return `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
  }).join(' ');
}

export function fleetMetrics(total: number, width: number, height: number, variant: FleetVariant) {
  const narrow = width < 600;
  const columns = narrow ? 4 : width < 960 ? 5 : 6;
  const rows = Math.max(1, Math.ceil(total / columns));
  const buttonWidth = variant === 'home' ? narrow ? 44 : 52 : narrow ? 64 : 88;
  const buttonHeight = variant === 'home' ? buttonWidth : narrow ? 44 : 78;
  return { columns, rows, buttonWidth, buttonHeight, picker: variant === 'crew' && (height / rows < buttonHeight || width / columns < buttonWidth) };
}

export function fleetSeed(id: string): number {
  return [...id].reduce((hash, letter) => (Math.imul(hash, 31) + letter.charCodeAt(0)) >>> 0, 17);
}

export function fleetHullFor(id: string): FleetHull {
  const designs: FleetHull[] = ['scout', 'interceptor', 'cruiser', 'shuttle', 'lancer', 'twinwing', 'nova', 'falcon'];
  return id === 'khai' ? 'aegis' : designs[fleetSeed(id) % designs.length];
}

export function advancePatrol(phase: number, elapsedSeconds: number, held: boolean): number {
  if (held || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return phase;
  return (phase + elapsedSeconds * .05) % (Math.PI * 2);
}

/** Hull-only depth keeps every Crew name upright and its collision-safe target unchanged. */
export function crewHullState(index: number, phase: number) {
  const angle = phase * (1 + index % 3) + index * 1.7;
  const depth = Math.sin(angle);
  return {
    depth,
    scale: .94 + depth * .075,
    heading: Math.sin(angle + .55) * 8,
    bank: Math.cos(angle) * 20,
    pitch: Math.sin(angle * 2) * 9,
  };
}

/** Roster-relative slots stay fixed when filters, language or the inspector change. */
export function fleetPoint(index: number, total: number, width: number, height: number, phase: number, variant: FleetVariant): FleetPoint {
  const safeWidth = Math.max(width, 1), safeHeight = Math.max(height, 1);
  if (variant === 'home') {
    const { x, y } = fleetOrbitalState(index, total, safeWidth, safeHeight, phase);
    return { x, y };
  }
  const { columns, rows, buttonWidth, buttonHeight } = fleetMetrics(total, safeWidth, safeHeight, variant);
  const row = Math.floor(index / columns), column = index % columns;
  const countInRow = Math.min(columns, total - row * columns);
  if (safeWidth < 600) {
    const cellWidth = safeWidth / columns, cellHeight = safeHeight / rows;
    const travelX = Math.max(0, Math.min(3, (cellWidth - buttonWidth) / 2 - 2));
    const travelY = Math.max(0, Math.min(4, (cellHeight - buttonHeight) / 2 - 2));
    return {
      x: (column + .5 + (columns - countInRow) / 2) * cellWidth + Math.sin(phase + index * 1.7) * travelX,
      y: (row + .5) * cellHeight + Math.cos(phase + index * 1.7) * travelY,
    };
  }
  // The drift and arc must fit inside each slot, including short desktop windows.
  const x = (column + .5 + (columns - countInRow) / 2) / columns;
  const verticalGap = safeHeight / rows - buttonHeight;
  const driftX = Math.max(0, Math.min(10, (safeWidth / columns - buttonWidth) / 2 - 4));
  const driftY = Math.max(0, Math.min(13, verticalGap / 2 - 4));
  const curve = Math.sin(x * Math.PI) * Math.max(0, Math.min(15, verticalGap / 2 - driftY - 2));
  return {
    x: Math.max(36, Math.min(safeWidth - 36, x * safeWidth + Math.sin(phase + index * 1.7) * driftX)),
    y: ((row + .5) / rows) * safeHeight + curve + Math.cos(phase + index * 1.7) * driftY,
  };
}
