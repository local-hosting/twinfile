import type { ClockSpec } from '../types/twinfile-time.js';
import {
  Weather,
  createWeathersFromPlace,
  mergeWeatherPhaseEnds,
  mergeWeatherPhaseStarts,
} from './weather.js';

/** Hazard programme on the session timeline (event phases vs clock). */
export { Weather as TFWeather };

export function createTFWeathersFromPlace(
  clock: ClockSpec,
  events: Record<string, unknown>[] | undefined,
  resolvedArgs: Record<string, unknown>,
): Weather[] {
  return createWeathersFromPlace(clock, events, resolvedArgs);
}

export { mergeWeatherPhaseEnds, mergeWeatherPhaseStarts };
