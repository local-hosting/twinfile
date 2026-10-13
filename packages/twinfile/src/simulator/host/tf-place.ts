import { timelineOptionsFromTFPlace, type TFPlaceTimelineOptions } from '../place/tf-place-timeline.js';
import { TFPlace } from '../types/tf-runtime.js';
import {
  type BuildTwinfileResult,
} from '@local-hosting/twinfile/place';

export function placeTimezoneFromBuild(result: BuildTwinfileResult): string {
  const placeMeta = (result.data as Record<string, unknown>).place as { timezone?: string } | undefined;
  if (!placeMeta?.timezone) {
    throw new Error('clock needs place.timezone on the merged place');
  }
  return placeMeta.timezone;
}

export function tfPlaceFromBuild(result: BuildTwinfileResult, seed: number) {
  return TFPlace.compose(result, { seed });
}

export function placeTimelineOptionsFromBuild(
  result: BuildTwinfileResult,
  seed: number,
): TFPlaceTimelineOptions | undefined {
  return timelineOptionsFromTFPlace(TFPlace.compose(result, { seed }));
}
