import { createClock, type Clock } from '../timeline/clock.js';
import { formatLocalDateTime } from '../timeline/scrub.js';
import { createSessionClockBus, sessionClockEdgesFromRecords } from '../timeline/session-clock-bus.js';
import { createWorldSession } from '../timeline/world-session.js';
import type { SessionClockBusRecord } from '../types/session-clock-bus.js';
import type { TimelineSample } from '../types/twinfile-time.js';
import type { WorldSessionEdge } from '../types/world-session.js';

import { placeTimelineOptionsFromBuild, placeTimezoneFromBuild } from './tf-place.js';
import {
  type BuildTwinfileResult,
} from '@local-hosting/twinfile/place';

export type TwinfilePlayerMoveResult = {
  playheadT: number;
  at: string;
  localAt: string;
  sample: TimelineSample;
  edges: WorldSessionEdge[];
  clockEvents?: SessionClockBusRecord[];
};

export function twinfilePlayerSessionMove(
  result: BuildTwinfileResult,
  input: { fromT: number; toT: number },
  seed: number,
): TwinfilePlayerMoveResult {
  const options = placeTimelineOptionsFromBuild(result, seed);
  if (!options) throw new Error('unit has no scenario clock');
  const timezone = placeTimezoneFromBuild(result);
  const bus = createSessionClockBus({ record: true });
  const session = createWorldSession({ ...options, playheadT: input.fromT, bus });
  const moved = session.seek(input.toT);
  const scrubClock: Clock = createClock(options.clock);
  const ms = scrubClock.startMs + session.playheadT * 1000;
  const edges = sessionClockEdgesFromRecords(bus.records ?? []);
  return {
    playheadT: session.playheadT,
    at: moved.at,
    localAt: formatLocalDateTime(ms, timezone),
    sample: moved,
    edges,
    ...(bus.records?.length ? { clockEvents: [...bus.records] } : {}),
  };
}
