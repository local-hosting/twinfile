import type { WorldSessionEdge } from '../types/world-session.js';
import type { PhaseStarts, TimelineSample } from '../types/twinfile-time.js';
import type { Weather } from '../weather/weather.js';

function activeIds(sample: TimelineSample): Set<string> {
  return new Set(sample.active.map((row) => row.id));
}

/** Edges when playhead moves from `prevT` to `nextT` (inclusive of phase boundaries between). */
export function worldSessionEdgesBetween(
  prevT: number,
  nextT: number,
  prev: TimelineSample,
  next: TimelineSample,
  phaseStarts: PhaseStarts,
  weathers: Weather[] = [],
): WorldSessionEdge[] {
  const edges: WorldSessionEdge[] = [];
  const prevActive = activeIds(prev);
  const nextActive = activeIds(next);
  for (const id of nextActive) {
    if (!prevActive.has(id)) {
      edges.push({ kind: 'schedule.start', scheduleId: id });
    }
  }
  for (const id of prevActive) {
    if (!nextActive.has(id)) {
      edges.push({ kind: 'schedule.end', scheduleId: id });
    }
  }
  if (weathers.length > 0) {
    for (const weather of weathers) {
      edges.push(...weather.edgesBetween(prevT, nextT));
    }
  } else {
    const lo = Math.min(prevT, nextT);
    const hi = Math.max(prevT, nextT);
    for (const [phase, startT] of Object.entries(phaseStarts)) {
      if (startT > lo && startT <= hi && startT !== prevT) {
        edges.push({ kind: 'phase.enter', phase, t: startT });
      }
    }
  }
  return edges;
}
