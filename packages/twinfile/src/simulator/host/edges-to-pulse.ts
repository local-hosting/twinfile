import type { WorldSessionEdge } from '../types/world-session.js';

import type { PlayerContextPulse } from './types/player-context.js';
import { primaryEventRef } from './event-ref.js';
import {
  type BuildTwinfileResult,
} from '@local-hosting/twinfile/place';

export function worldSessionEdgesToPlayerSlice(
  result: BuildTwinfileResult,
  edges: WorldSessionEdge[],
): PlayerContextPulse {
  const ref = primaryEventRef(result);
  const pulses = edges
    .filter((edge): edge is Extract<WorldSessionEdge, { kind: 'phase.enter' }> => edge.kind === 'phase.enter')
    .map((edge) => ({
      ref,
      phase: edge.phase,
      edge: 'enter' as const,
      pulse: 'fast' as const,
    }));

  const signals: Record<string, unknown> = {};
  for (const edge of edges) {
    switch (edge.kind) {
      case 'schedule.start':
        signals[`schedule.${edge.scheduleId}`] = 'start';
        break;
      case 'schedule.end':
        signals[`schedule.${edge.scheduleId}`] = 'end';
        break;
      default:
        break;
    }
  }

  const hasSignals = Object.keys(signals).length > 0;
  if (!pulses.length && !hasSignals) return {};
  return {
    ...(pulses.length ? { pulses } : {}),
    ...(hasSignals ? { signals } : {}),
  };
}
