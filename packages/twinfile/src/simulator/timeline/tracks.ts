import { sampleCoverageGraphV0 } from './coverage/engine-graph-v0.js';
import { compileFeedSeries } from './feed.js';
import type { CompiledSchedule } from './schedule.js';
import { sunElevationDeg } from './solar.js';
import { localParts } from './zone.js';
import type { CoverageMetric, FeedRow, GeoLocation, TrackDef } from '../types/twinfile-time.js';

export type TrackReading = { value: number | null; known: number | null };

export type TrackSampler = (ms: number) => TrackReading;

export type TrackContext = {
  timezone: string;
  location?: GeoLocation;
  feeds: FeedRow[];
  schedules: Map<string, CompiledSchedule>;
  stepMs: number;
  mergedPlace: Record<string, unknown>;
};

const DAY_S = 86_400;

function curvePoints(track: TrackDef): Array<[number, number]> {
  return Object.entries(track.points ?? {})
    .map(([hhmm, value]): [number, number] => {
      const [h, m] = hhmm.split(':').map(Number);
      return [h! * 3600 + m! * 60, value];
    })
    .sort((a, b) => a[0] - b[0]);
}

/** Daily curve: wraps from the last point of one day to the first point of the next. */
function curveSampler(track: TrackDef, timezone: string): TrackSampler {
  const points = curvePoints(track);
  if (points.length === 0) throw new Error(`track ${track.id}: curve needs at least one point`);
  const interpolate = track.interpolate ?? 'linear';
  if (interpolate === 'none') throw new Error(`track ${track.id}: curve tracks support linear or step`);

  return (ms) => {
    const s = localParts(ms, timezone).secondOfDay;
    const nextIdx = points.findIndex(([sec]) => sec > s);
    const prevIdx = (nextIdx < 0 ? points.length : nextIdx) - 1;
    const prev = prevIdx >= 0 ? points[prevIdx]! : ([points.at(-1)![0] - DAY_S, points.at(-1)![1]] as const);
    let value = prev[1];
    if (interpolate === 'linear' && points.length > 1) {
      const next = nextIdx >= 0 ? points[nextIdx]! : ([points[0]![0] + DAY_S, points[0]![1]] as const);
      value = prev[1] + (next[1] - prev[1]) * ((s - prev[0]) / (next[0] - prev[0]));
    }
    return { value, known: value };
  };
}

function solarSampler(track: TrackDef, location: GeoLocation | undefined): TrackSampler {
  if (!location) throw new Error(`track ${track.id}: solar tracks need place.location (lat, lng)`);
  return (ms) => {
    const value = sunElevationDeg(ms, location.lat, location.lng);
    return { value, known: value };
  };
}

function feedSampler(track: TrackDef, ctx: TrackContext): TrackSampler {
  const series = compileFeedSeries(ctx.feeds, track.device!, track.property!);
  const interpolate = track.interpolate ?? 'linear';
  return (ms) => ({ value: series.valueAt(ms, interpolate, ctx.stepMs), known: series.knownAt(ms) });
}

function scheduleSampler(track: TrackDef, ctx: TrackContext): TrackSampler {
  const schedule = ctx.schedules.get(track.schedule!);
  if (!schedule) throw new Error(`track ${track.id}: unknown schedule "${track.schedule}"`);
  const on = track.value ?? 1;
  return (ms) => {
    const value = schedule.activeAt(ms) ? on : 0;
    return { value, known: value };
  };
}

function coverageMetric(track: TrackDef): CoverageMetric {
  const metric = track.metric ?? 'served';
  if (metric !== 'served' && metric !== 'rssi_dbm') {
    throw new Error(`track ${track.id}: coverage metric must be served or rssi_dbm`);
  }
  return metric;
}

function coverageSampler(track: TrackDef, ctx: TrackContext): TrackSampler {
  if (!track.radio) throw new Error(`track ${track.id}: coverage needs radio`);
  if (!track.space) throw new Error(`track ${track.id}: coverage needs space`);
  const metric = coverageMetric(track);
  const engine = track.engine ?? 'graph-v0';
  const value = sampleCoverageGraphV0({
    mergedPlace: ctx.mergedPlace,
    radioAssetId: track.radio,
    targetSpaceId: track.space,
    metric,
    thresholdDbm: track.threshold_dbm,
    profileId: track.profile,
    engineId: engine,
  });
  return () => ({ value, known: value });
}

export function createTrackSampler(track: TrackDef, ctx: TrackContext): TrackSampler {
  switch (track.source) {
    case 'curve':
      return curveSampler(track, ctx.timezone);
    case 'solar':
      return solarSampler(track, ctx.location);
    case 'feed':
      return feedSampler(track, ctx);
    case 'schedule':
      return scheduleSampler(track, ctx);
    case 'coverage':
      return coverageSampler(track, ctx);
    default: {
      const unhandled: never = track.source;
      throw new Error(`track ${track.id}: unknown source "${String(unhandled)}"`);
    }
  }
}
