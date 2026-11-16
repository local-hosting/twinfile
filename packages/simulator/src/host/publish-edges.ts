import { sessionClockEdgesFromRecords } from '../timeline/session-clock-bus.js';
import type { SessionClockBusRecord } from '../types/session-clock-bus.js';
import type { WorldSessionEdge } from '../types/world-session.js';

import { applyPlayerContextPulse, traceWireSummary } from './apply-context-pulse.js';
import { worldSessionEdgesToPlayerSlice } from './edges-to-pulse.js';
import type { PlayerPatchPublishResult } from './types/player-context.js';
import {
  type BuildTwinfileResult,
} from '@local-hosting/twinfile-place';

export function publishSessionEdgesToPatch(
  result: BuildTwinfileResult,
  edges: readonly WorldSessionEdge[],
): PlayerPatchPublishResult | undefined {
  if (!edges.length) return undefined;
  const slice = worldSessionEdgesToPlayerSlice(result, [...edges]);
  const hasSlice =
    (slice.pulses?.length ?? 0) > 0 ||
    (slice.signals && Object.keys(slice.signals).length > 0) ||
    (slice.feeds?.length ?? 0) > 0 ||
    (slice.events?.length ?? 0) > 0;
  if (!hasSlice) return undefined;
  const applied = applyPlayerContextPulse(result, slice);
  if (applied.ok) {
    return {
      ok: true,
      messageCount: applied.trace.entries.length,
      wires: traceWireSummary(applied.trace),
    };
  }
  return { ok: false, error: applied.error };
}

export function publishSessionClockRecordsToPatch(
  result: BuildTwinfileResult,
  records: readonly SessionClockBusRecord[],
): PlayerPatchPublishResult | undefined {
  return publishSessionEdgesToPatch(result, sessionClockEdgesFromRecords(records));
}
