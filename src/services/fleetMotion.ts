/** Patrol positions are visual only: no rank, workload or ownership is encoded. */
export interface FleetPoint { x: number; y: number }
export type FleetVariant = 'home' | 'crew';

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

export function advancePatrol(phase: number, elapsedSeconds: number, held: boolean): number {
  if (held || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return phase;
  return (phase + elapsedSeconds * .05) % (Math.PI * 2);
}

/** Roster-relative slots stay fixed when filters, language or the inspector change. */
export function fleetPoint(index: number, total: number, width: number, height: number, phase: number, variant: FleetVariant): FleetPoint {
  const safeWidth = Math.max(width, 1), safeHeight = Math.max(height, 1);
  if (variant === 'home') {
    const angle = index / Math.max(total, 1) * Math.PI * 2 + phase;
    return {
      x: safeWidth / 2 + Math.cos(angle) * Math.max(0, safeWidth / 2 - 48),
      y: safeHeight / 2 + Math.sin(angle) * Math.max(0, safeHeight / 2 - 56),
    };
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
