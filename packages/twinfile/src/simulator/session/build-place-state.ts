
import { worldSessionEdgesToPlayerSlice } from '../host/edges-to-pulse.js';
import { publishSessionEdgesToPatch } from '../host/publish-edges.js';
import type { PlayerPatchPublishResult } from '../host/types/player-context.js';
import type { TFPlaceState, TFPlaceWeatherState } from '../types/tf-place-state.js';
import type { WorldSessionAdvance } from '../types/world-session.js';
import type { TimelineSample } from '../types/twinfile-time.js';
import type { Weather as TFWeather } from '../weather/weather.js';
import {
  type BuildTwinfileResult,
} from '@local-hosting/twinfile/place';

function weatherStates(weathers: readonly TFWeather[], t: number): TFPlaceWeatherState[] {
  return weathers.map((w) => ({
    id: w.id,
    ...(w.phaseAt(t) ? { phase: w.phaseAt(t) } : {}),
  }));
}

export function tfPlaceStateFromSample(
  weathers: readonly TFWeather[],
  t: number,
  sample: TimelineSample,
  edges: WorldSessionAdvance['edges'],
  result?: BuildTwinfileResult,
): TFPlaceState {
  const signals: Record<string, unknown> = result
    ? { ...(worldSessionEdgesToPlayerSlice(result, edges).signals ?? {}) }
    : {};
  return {
    t,
    at: sample.at,
    sample,
    weather: weatherStates(weathers, t),
    signals,
    activeScheduleIds: sample.active.map((row) => row.id),
    occupancy: sample.occupancy,
    edges,
  };
}

export function applyAdvanceToPlaceState(
  result: BuildTwinfileResult,
  weathers: readonly TFWeather[],
  advance: WorldSessionAdvance,
  publishPatch: boolean,
): { state: TFPlaceState; patch?: PlayerPatchPublishResult } {
  const state = tfPlaceStateFromSample(
    weathers,
    advance.playheadT,
    advance.sample,
    advance.edges,
    result,
  );
  if (!publishPatch || advance.edges.length === 0) {
    return { state };
  }
  const patch = publishSessionEdgesToPatch(result, advance.edges);
  return { ...(patch ? { patch } : {}), state };
}
