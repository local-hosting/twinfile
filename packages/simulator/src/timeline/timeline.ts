import { createClock, type Clock } from './clock.js';
import { resolveTrackFeeds } from './feed.js';
import { resolvePhaseEnds, resolvePhaseStarts, useModeAt } from './phase-starts.js';
import {
  createWeathersFromPlace,
  mergeWeatherPhaseEnds,
  mergeWeatherPhaseStarts,
} from '../weather/weather.js';
import { occupancyFromActive, visitBeatsFromActive } from './occupancy.js';
import { compileSchedule } from './schedule.js';
import { applyScheduleActiveWhen } from './schedule-gate.js';
import { createTrackSampler, type TrackSampler } from './tracks.js';
import type {
  ActiveSchedule,
  ClockSpec,
  FeedRow,
  GeoLocation,
  PhaseEnds,
  PhaseStarts,
  TimelinePayload,
  TimelineSample,
  PlaceTime,
  TrackDef,
} from '../types/twinfile-time.js';
import type { TwinfileUseMode } from '@doppler-group/twinfile-core';

export type TimelineOptions = {
  clock: ClockSpec;
  timezone: string;
  location?: GeoLocation;
  mergedPlace: PlaceTime;
  feeds?: FeedRow[];
  seed?: number;
  phaseStarts?: PhaseStarts;
  phaseEnds?: PhaseEnds;
  /** Scenario use mode; see {@link useModeAt}. */
  mode?: TwinfileUseMode;
};

export type Timeline = {
  clock: Clock;
  /** Random access: any `t` (seconds from `starts_at`), forward or back. */
  at(t: number): TimelineSample;
  samples(): TimelineSample[];
};

/** Built {@link TFPlace} timeline inputs — no Twinfile manifest. */
export type TFPlaceTimelineOptions = {
  clock: ClockSpec;
  place: Record<string, unknown>;
  placeRoot: string;
  seed: number;
  events?: Record<string, unknown>[];
  resolvedArgs?: Record<string, unknown>;
  mode?: TwinfileUseMode;
};


function round6(v: number | null): number | null {
  return v === null ? null : Math.round(v * 1e6) / 1e6;
}

function buildTimelineMaps(options: TimelineOptions, clock: Clock) {
  const seed = options.seed ?? 1;
  const scheduleDefs = options.mergedPlace.schedules ?? [];
  const trackDefs = options.mergedPlace.tracks ?? [];
  const mergedPlaceRecord = options.mergedPlace as Record<string, unknown>;
  const baseSchedules = new Map(
    scheduleDefs.map((def) => [def.id, compileSchedule(def, options.timezone, seed)]),
  );
  const gateSamplerTracks = trackDefs.filter((t) => t.source !== 'schedule');
  const gateCtx = {
    timezone: options.timezone,
    location: options.location,
    feeds: options.feeds ?? [],
    schedules: baseSchedules,
    stepMs: clock.stepS * 1000,
    mergedPlace: mergedPlaceRecord,
  };
  const gateSamplers = new Map<string, TrackSampler>(
    gateSamplerTracks.map((track) => [track.id, createTrackSampler(track, gateCtx)]),
  );
  const schedules = new Map<string, ReturnType<typeof compileSchedule>>();
  for (const def of scheduleDefs) {
    let compiled = baseSchedules.get(def.id)!;
    if (def.activeWhen) {
      compiled = applyScheduleActiveWhen(compiled, def.activeWhen, gateSamplers);
    }
    schedules.set(def.id, compiled);
  }
  const ctx = { ...gateCtx, schedules };
  const samplers = new Map<string, TrackSampler>(
    trackDefs.map((track) => [track.id, createTrackSampler(track, ctx)]),
  );
  return { schedules, samplers };
}

export function createTimeline(options: TimelineOptions): Timeline {
  const clock = createClock(options.clock);
  const { schedules, samplers } = buildTimelineMaps(options, clock);
  const visits = options.mergedPlace.visits;

  function at(t: number): TimelineSample {
    const ms = clock.msAt(t);
    const tracks: Record<string, number | null> = {};
    const known: Record<string, number | null> = {};
    for (const [id, sample] of samplers) {
      const reading = sample(ms);
      tracks[id] = round6(reading.value);
      known[id] = round6(reading.known);
    }
    const active: ActiveSchedule[] = [];
    for (const schedule of schedules.values()) {
      const hit = schedule.activeAt(ms);
      if (hit) active.push(hit);
    }
    active.sort((a, b) => a.id.localeCompare(b.id));
    return {
      t,
      at: clock.isoAt(t),
      mode: useModeAt(t, options.phaseStarts, options.mode, options.phaseEnds),
      tracks,
      known,
      active,
      occupancy: occupancyFromActive(active),
      visit_beats: visitBeatsFromActive(visits, active),
    };
  }

  return { clock, at, samples: () => [...clock.ticks()].map(at) };
}

/** Timeline over a built place; feed URLs resolve against `placeRoot`. */
export function openTimelineForPlace(options: TFPlaceTimelineOptions): Timeline {
  const mergedPlace = options.place as PlaceTime & Record<string, unknown>;
  const site = (mergedPlace.place ?? {}) as { timezone?: string; location?: GeoLocation };
  if (!site.timezone) throw new Error('clock needs place.timezone on the merged place');
  const resolvedArgs = options.resolvedArgs ?? {};
  const weathers = createWeathersFromPlace(options.clock, options.events, resolvedArgs);
  const phaseStarts =
    weathers.length > 0
      ? mergeWeatherPhaseStarts(weathers)
      : resolvePhaseStarts({ clock: options.clock, events: [], resolvedArgs });
  const phaseEnds =
    weathers.length > 0
      ? mergeWeatherPhaseEnds(weathers)
      : resolvePhaseEnds({ clock: options.clock, events: [], resolvedArgs });
  return createTimeline({
    clock: options.clock,
    timezone: site.timezone,
    location: site.location,
    mergedPlace,
    feeds: resolveTrackFeeds({
      mergedPlace,
      tracks: mergedPlace.tracks ?? [],
      placeRoot: options.placeRoot,
      clock: options.clock,
      seed: options.seed,
      phaseStarts,
    }),
    seed: options.seed,
    phaseStarts,
    phaseEnds,
    mode: options.mode,
  });
}

/** Precomputed samples at every clock step, for runners in any language. */
export function createPlaceTimelinePayload(options: TFPlaceTimelineOptions): TimelinePayload {
  const units: Record<string, string> = {};
  for (const track of (options.place.tracks ?? []) as TrackDef[]) {
    if (track.unit) units[track.id] = track.unit;
  }
  const resolvedArgs = options.resolvedArgs ?? {};
  const weathers = createWeathersFromPlace(options.clock, options.events, resolvedArgs);
  const phaseStarts =
    weathers.length > 0
      ? mergeWeatherPhaseStarts(weathers)
      : resolvePhaseStarts({ clock: options.clock, events: [], resolvedArgs });
  const phaseEnds =
    weathers.length > 0
      ? mergeWeatherPhaseEnds(weathers)
      : resolvePhaseEnds({ clock: options.clock, events: [], resolvedArgs });
  return {
    clock: options.clock,
    units,
    phaseStarts,
    phaseEnds,
    samples: openTimelineForPlace(options).samples(),
  };
}

