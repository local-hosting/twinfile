import { createClock, resolveScrubT, type ClockSpec, type TimelineSample } from '@doppler-group/twinfile-simulator';
import { placeTimezoneFromBuild, twinfilePlayerSessionMove } from '@doppler-group/twinfile-simulator/host';
import {
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';

export type { TwinfilePlayerMoveResult as ViewerSessionMoveResult } from '@doppler-group/twinfile-simulator/host';

export { twinfilePlayerSessionMove as viewerSessionMove } from '@doppler-group/twinfile-simulator/host';

export type ViewerTimeMeta = {
  clock: ClockSpec;
  timezone: string;
  durationS: number;
  stepS: number;
  tickCount: number;
  endsAt: string;
};

export type ViewerTimeSample = {
  t: number;
  at: string;
  localAt: string;
  sample: TimelineSample;
};

export function viewerTimeMetaFromBuild(result: BuildTwinfileResult): ViewerTimeMeta | undefined {
  const clock = result.loaded.twinfile.clock as ClockSpec | undefined;
  if (!clock) return undefined;
  const timezone = placeTimezoneFromBuild(result);
  const created = createClock(clock);
  const lastT = Math.floor(created.durationS / created.stepS) * created.stepS;
  return {
    clock,
    timezone,
    durationS: created.durationS,
    stepS: created.stepS,
    tickCount: Math.floor(created.durationS / created.stepS) + 1,
    endsAt: created.isoAt(lastT),
  };
}

export function viewerSampleAt(
  result: BuildTwinfileResult,
  query: { t?: number; at?: string; localAt?: string },
  seed: number,
): ViewerTimeSample {
  const clock = result.loaded.twinfile.clock as ClockSpec | undefined;
  if (!clock) {
    throw new Error('Twinfile has no scenario clock');
  }
  const timezone = placeTimezoneFromBuild(result);
  const t = resolveScrubT(clock, query, timezone);
  const moved = twinfilePlayerSessionMove(result, { fromT: t, toT: t }, seed);
  return {
    t: moved.playheadT,
    at: moved.at,
    localAt: moved.localAt,
    sample: moved.sample,
  };
}
