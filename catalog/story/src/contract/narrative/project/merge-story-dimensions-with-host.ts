import { placeSlugFromPlaceRef } from '../story-catalog/match-story-catalog-from-text.js';
import type { StoryDimensionsV1 } from '../types/story-dimensions.js';
import type {
  HostStoryCreateDimensionsV1,
  HostStoryDimensionWhereV1,
  HostStoryDimensionWhoV1,
} from '../types/host-story-dimensions.js';

export type HostStoryWhereDimensionInput = HostStoryDimensionWhereV1;

export const HOST_STORY_WHERE_DIMENSION_ERROR =
  'where requires placeRef, storeSlug, lat/lon, h3Cell, zip, dma, place, or city+state (place mount, fleet, or geo)';

/** True when host `where` has a place mount, fleet store, or geo pin. */
export function hostStoryWhereDimensionIsComplete(data: HostStoryWhereDimensionInput): boolean {
  return (
    Boolean(data.placeRef?.trim()) ||
    Boolean(data.primaryPlaceRef?.trim()) ||
    Boolean(data.placeRefs?.some((id) => id.trim())) ||
    Boolean(data.storeSlug?.trim()) ||
    Boolean(data.venueSlug?.trim()) ||
    (typeof data.lat === 'number' && typeof data.lon === 'number') ||
    Boolean(data.h3Cell?.trim()) ||
    Boolean(data.zip?.trim()) ||
    Boolean(data.dma?.trim()) ||
    Boolean(data.place?.trim()) ||
    (Boolean(data.city?.trim()) && Boolean(data.state?.trim()))
  );
}

/** Fill `venueSlug` from `placeRef` when the host has not set a fleet slug. */
export function attachPlaceSlugFromPlaceRef(
  where: HostStoryDimensionWhereV1,
): HostStoryDimensionWhereV1 {
  const placeRef = where.placeRef?.trim() || where.primaryPlaceRef?.trim();
  if (!placeRef || where.venueSlug?.trim()) {
    return where.placeRef?.trim()
      ? where
      : placeRef
        ? { ...where, placeRef }
        : where;
  }
  return {
    ...where,
    placeRef,
    venueSlug: placeSlugFromPlaceRef(placeRef),
  };
}

/**
 * Merge {@link projectStoryDimensionsFromStory} with host create overlays.
 * Character display names, fleet `storeSlug`, geo, and engagement live in overrides — not on Story.
 */
export function mergeStoryDimensionsWithHost(
  storyDimensions: StoryDimensionsV1,
  overrides: Partial<HostStoryCreateDimensionsV1> = {},
): HostStoryCreateDimensionsV1 {
  const who: HostStoryDimensionWhoV1 = {
    characterId: overrides.who?.characterId ?? storyDimensions.who.characterId,
    ...(overrides.who?.displayName?.trim()
      ? { displayName: overrides.who.displayName.trim() }
      : {}),
    ...(overrides.who?.segmentId?.trim() ? { segmentId: overrides.who.segmentId.trim() } : {}),
    ...(overrides.who?.characterIds?.length
      ? { characterIds: [...overrides.who.characterIds] }
      : storyDimensions.who.characterIds.length
        ? { characterIds: [...storyDimensions.who.characterIds] }
        : {}),
  };

  const whereFromStory: HostStoryDimensionWhereV1 = {
    ...(storyDimensions.where.placeRefs.length
      ? { placeRefs: [...storyDimensions.where.placeRefs] }
      : {}),
    ...(storyDimensions.where.primaryPlaceRef
      ? {
          primaryPlaceRef: storyDimensions.where.primaryPlaceRef,
          placeRef: storyDimensions.where.primaryPlaceRef,
        }
      : {}),
    ...(storyDimensions.where.spaceIds?.length
      ? { spaceIds: [...storyDimensions.where.spaceIds] }
      : {}),
  };

  const how =
    overrides.how || storyDimensions.how
      ? {
          ...(storyDimensions.how ?? {}),
          ...(overrides.how ?? {}),
        }
      : undefined;

  return {
    who,
    what: {
      storyId:
        overrides.what?.storyId ??
        storyDimensions.what.storyId,
      ...(storyDimensions.what.arcKind || overrides.what?.arcKind
        ? { arcKind: overrides.what?.arcKind ?? storyDimensions.what.arcKind }
        : {}),
      ...(overrides.what?.startStoreVisitJourney != null
        ? { startStoreVisitJourney: overrides.what.startStoreVisitJourney }
        : {}),
    },
    where: { ...whereFromStory, ...overrides.where },
    when: {
      simulationEpochStart:
        overrides.when?.simulationEpochStart ?? storyDimensions.when.simulationEpochStart,
      planningHorizonDays:
        overrides.when?.planningHorizonDays ?? storyDimensions.when.planningHorizonDays,
      visitDayOffset: overrides.when?.visitDayOffset ?? storyDimensions.when.visitDayIndex,
      ...(storyDimensions.when.storyArc ? { storyArc: storyDimensions.when.storyArc } : {}),
      ...(overrides.when?.useFeedCalendar != null
        ? { useFeedCalendar: overrides.when.useFeedCalendar }
        : {}),
      ...(overrides.when?.alignToWallCalendar != null
        ? { alignToWallCalendar: overrides.when.alignToWallCalendar }
        : {}),
    },
    ...(overrides.why || storyDimensions.why
      ? {
          why: {
            ...(storyDimensions.why ?? {}),
            ...(overrides.why ?? {}),
          },
        }
      : {}),
    ...(how ? { how } : {}),
  };
}

