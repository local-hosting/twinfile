import {
  createWeathersFromPlace,
  mergeWeatherPhaseEnds,
  mergeWeatherPhaseStarts,
} from '../weather/weather.js';
import { snapTToClock } from './scrub.js';
import { openTimelineForPlace, type TFPlaceTimelineOptions, type Timeline } from './timeline.js';
import { publishSessionClockMove } from './session-clock-bus.js';
import { worldSessionEdgesBetween } from './world-session-edges.js';
import type { SessionClockBus } from '../types/session-clock-bus.js';
import type {
  WorldSessionAdvance,
  WorldSessionEdge,
} from '../types/world-session.js';
import type { PhaseEnds, PhaseStarts, TimelineSample } from '../types/twinfile-time.js';

export type WorldSessionOptions = TFPlaceTimelineOptions & {
  /** Seconds since `clock.starts_at`; default `0`. */
  playheadT?: number;
  /** Emits **note** / **edge** / **advance** on each grid move (in-process; not TwinMessage). */
  bus?: SessionClockBus;
};

export type WorldSession = {
  readonly timeline: Timeline;
  readonly phaseStarts: PhaseStarts;
  readonly phaseEnds: PhaseEnds;
  playheadT: number;
  sample(): TimelineSample;
  at(t: number): TimelineSample;
  seek(t: number): TimelineSample;
  /** Move playhead by Δseconds (snapped to clock grid); returns edges for host bus publish. */
  advance(deltaS: number): WorldSessionAdvance;
  stepForward(): WorldSessionAdvance;
  stepBack(): WorldSessionAdvance;
  edgesTo(nextT: number): WorldSessionEdge[];
};

/** Live **session** over a built place — shared clock with runners and scrub. */
export function createWorldSession(options: WorldSessionOptions): WorldSession {
  const resolvedArgs = options.resolvedArgs ?? {};
  const weathers = createWeathersFromPlace(options.clock, options.events, resolvedArgs);
  const phaseStarts = mergeWeatherPhaseStarts(weathers);
  const phaseEnds = mergeWeatherPhaseEnds(weathers);
  const timeline = openTimelineForPlace({ ...options, resolvedArgs });
  const clock = timeline.clock;
  const bus = options.bus;
  let playheadT = snapTToClock(options.playheadT ?? 0, clock);

  const sampleAt = (t: number): TimelineSample => timeline.at(t);

  if (bus) {
    const initial = sampleAt(playheadT);
    bus.emit('note', {
      t: playheadT,
      index: Math.round(playheadT / clock.stepS),
      sample: initial,
    });
  }

  const edgesTo = (nextT: number): WorldSessionEdge[] => {
    const snapped = snapTToClock(nextT, clock);
    if (snapped === playheadT) {
      return [];
    }
    const prev = sampleAt(playheadT);
    const next = sampleAt(snapped);
    return worldSessionEdgesBetween(playheadT, snapped, prev, next, phaseStarts, weathers);
  };

  const moveToPlayhead = (nextT: number): WorldSessionAdvance => {
    const fromT = playheadT;
    const snapped = snapTToClock(nextT, clock);
    const edges = edgesTo(snapped);
    playheadT = snapped;
    const body: WorldSessionAdvance = { playheadT, sample: sampleAt(playheadT), edges };
    if (fromT !== playheadT || edges.length > 0) {
      publishSessionClockMove({ bus, fromT, body, stepS: clock.stepS, sampleAt });
    }
    return body;
  };

  const seek = (t: number): TimelineSample => moveToPlayhead(t).sample;

  const advance = (deltaS: number): WorldSessionAdvance => moveToPlayhead(playheadT + deltaS);

  return {
    timeline,
    phaseStarts,
    phaseEnds,
    get playheadT() {
      return playheadT;
    },
    set playheadT(t: number) {
      moveToPlayhead(t);
    },
    sample: () => sampleAt(playheadT),
    at: sampleAt,
    seek,
    advance,
    stepForward: () => advance(clock.stepS),
    stepBack: () => advance(-clock.stepS),
    edgesTo,
  };
}
