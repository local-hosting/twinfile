import { scenarioUseMode } from '../timeline/phase-starts.js';
import {
  createWorldSession,
  type WorldSession,
  type WorldSessionOptions,
} from '../timeline/world-session.js';
import {
  openTimelineForPlace,
  type TFPlaceTimelineOptions,
  type Timeline,
} from '../timeline/timeline.js';
import type { TFPlace } from '../types/tf-runtime.js';

export type { TFPlaceTimelineOptions };

export function timelineOptionsFromTFPlace(place: TFPlace): TFPlaceTimelineOptions | undefined {
  if (!place.clock) return undefined;
  return {
    clock: place.clock,
    place: place.data,
    placeRoot: place.unitRoot,
    seed: place.seed ?? 1,
    situations: place.situations,
    resolvedArgs: place.resolvedArgs,
    mode: place.mode ?? scenarioUseMode({}),
  };
}

export function openPlaceTimeline(place: TFPlace): Timeline {
  const options = timelineOptionsFromTFPlace(place);
  if (!options) {
    throw new Error('openPlaceTimeline: TFPlace.clock is required');
  }
  return openTimelineForPlace(options);
}

export function createWorldSessionForTFPlace(
  place: TFPlace,
  extra: Omit<WorldSessionOptions, keyof TFPlaceTimelineOptions> = {},
): WorldSession {
  const options = timelineOptionsFromTFPlace(place);
  if (!options) {
    throw new Error('createWorldSessionForTFPlace: TFPlace.clock is required');
  }
  return createWorldSession({ ...options, ...extra });
}
