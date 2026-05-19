import {
  resolveEpisodeTimingVariation,
  resolveRandomPlanningHorizonDays,
  resolveVisitDayIndex,
  type EpisodeTimingVariation,
} from '../episode/planning-horizon.js';
import type { SamStoryPlanSegmentObjectiveV1 } from '../types/story-plan-catalog.js';

export function pickRandomIndex(length: number, random: () => number): number {
  if (length <= 0) {
    return 0;
  }
  return Math.min(Math.floor(random() * length), length - 1);
}

export function pickRandomFrom<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  return items[pickRandomIndex(items.length, random)];
}

export function pickRandomPlanningHorizonDays(
  random: () => number = Math.random,
  variation?: Partial<EpisodeTimingVariation>,
): number {
  return resolveRandomPlanningHorizonDays(random, resolveEpisodeTimingVariation(variation));
}

export function pickRandomEngagementLevel(
  ids: readonly string[],
  random: () => number = Math.random,
): string {
  const picked = pickRandomFrom(ids, random);
  if (picked) {
    return picked;
  }
  throw new Error('Org customer catalog has no engagement levels');
}

export function pickRandomIntentId(input: {
  objectives?: readonly SamStoryPlanSegmentObjectiveV1[];
  catalogIntentIds: readonly string[];
  engagementLevelId: string;
  random?: () => number;
}): string {
  const random = input.random ?? Math.random;
  const eligible: string[] = [];
  for (const objective of input.objectives ?? []) {
    const intentId = objective.intentId?.trim();
    if (!intentId) {
      continue;
    }
    const levels = objective.validLevelIds ?? [];
    if (levels.length > 0 && !levels.includes(input.engagementLevelId)) {
      continue;
    }
    eligible.push(intentId);
  }
  const pool = eligible.length > 0 ? eligible : [...input.catalogIntentIds];
  const picked = pickRandomFrom(pool, random);
  if (!picked) {
    throw new Error('No intents available in org catalog');
  }
  return picked;
}

export function pickRandomJourneyId(
  journeys: readonly { id: string }[],
  random: () => number = Math.random,
): string {
  const picked = pickRandomFrom(journeys, random);
  if (picked?.id?.trim()) {
    return picked.id.trim();
  }
  throw new Error('Org journey catalog has no journeys');
}

export function pickRandomSegmentIdFromCatalog(
  segments: readonly { id: string }[],
  random: () => number = Math.random,
): string {
  const picked = pickRandomFrom(segments, random);
  const id = picked?.id?.trim();
  if (!id) {
    throw new Error('Org segment catalog has no segments');
  }
  return id;
}

export function pickRandomFocusAreaId(
  focusAreas: readonly { id: string }[],
  random: () => number = Math.random,
): string | undefined {
  const picked = pickRandomFrom(focusAreas, random);
  return picked?.id?.trim() || undefined;
}

export function pickRandomVisitDayIndex(input: {
  planningHorizonDays: number;
  journeyPace?: string;
  random?: () => number;
  variation?: Partial<EpisodeTimingVariation>;
}): number {
  return resolveVisitDayIndex({
    planningHorizonDays: input.planningHorizonDays,
    journeyPace: input.journeyPace,
    random: input.random,
    variation: input.variation,
  });
}

export function pickRandomStoryPlanStoreSlug(
  fleetVenues: readonly { slug: string }[],
  random: () => number = Math.random,
): string | undefined {
  if (fleetVenues.length === 0) {
    return undefined;
  }
  const index = Math.floor(random() * fleetVenues.length);
  const clamped = Math.min(Math.max(index, 0), fleetVenues.length - 1);
  return fleetVenues[clamped]!.slug;
}
