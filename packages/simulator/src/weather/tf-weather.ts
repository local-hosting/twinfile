import type { ClockSpec } from '../types/twinfile-time.js';
import {
  Weather,
  createWeathersFromPlace,
  mergeWeatherPhaseEnds,
  mergeWeatherPhaseStarts,
} from './weather.js';

/** Hazard programme on the session timeline (situation phases vs clock). */
export { Weather as TFWeather };

export function createTFWeathersFromPlace(
  clock: ClockSpec,
  situations: Record<string, unknown>[] | undefined,
  resolvedArgs: Record<string, unknown>,
): Weather[] {
  return createWeathersFromPlace(clock, situations, resolvedArgs);
}

export { mergeWeatherPhaseEnds, mergeWeatherPhaseStarts };
