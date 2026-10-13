import type { WorldSessionEdge } from '../types/world-session.js';

/** Place-local label for a session timeline edge (display only). */
export function formatSessionEdge(edge: WorldSessionEdge): string {
  switch (edge.kind) {
    case 'phase.enter':
      return `phase ${edge.phase} @ ${edge.t}s`;
    case 'schedule.start':
      return `schedule ${edge.scheduleId} start`;
    case 'schedule.end':
      return `schedule ${edge.scheduleId} end`;
    default: {
      const _exhaustive: never = edge;
      return String(_exhaustive);
    }
  }
}
