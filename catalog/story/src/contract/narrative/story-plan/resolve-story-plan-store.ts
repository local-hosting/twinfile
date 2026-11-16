import type { SamStoryPlanFleetPlaceSnapshotV1 } from '../types/story-plan-catalog.js';
import { normalizeScenarioText, scenarioTokenSet } from './scenario-scoring.js';
import { pickRandomStoryPlanStoreSlug } from './random.js';
import { resolveStoryPlanRandom } from './rng.js';

function scorePlaceHintMatch(haystack: string, place: SamStoryPlanFleetPlaceSnapshotV1): number {
  const text = normalizeScenarioText(haystack);
  if (!text) return 0;

  const slug = place.slug.toLowerCase();
  if (text.includes(slug)) return 1;

  const name = place.name ? normalizeScenarioText(place.name) : '';
  if (name && text.includes(name)) return 0.95;

  const slugTokens = scenarioTokenSet(place.slug);
  const nameTokens = name ? scenarioTokenSet(name) : new Set<string>();
  const queryTokens = scenarioTokenSet(haystack);
  if (queryTokens.size === 0) return 0;

  let hits = 0;
  for (const token of queryTokens) {
    if (slugTokens.has(token) || nameTokens.has(token)) hits += 1;
  }
  return hits / queryTokens.size;
}

/** Map a natural-language store/place hint to a fleet `storeSlug`. */
export function resolveStoryPlanStoreFromHints(input: {
  storeSlug?: string;
  storeName?: string;
  place?: string;
  scenario?: string;
  topic?: string;
  fleetPlaces: readonly SamStoryPlanFleetPlaceSnapshotV1[];
}): string | undefined {
  const explicit = input.storeSlug?.trim();
  if (explicit) {
    return input.fleetPlaces.some((row) => row.slug === explicit) ? explicit : undefined;
  }

  const hints = [
    input.storeName?.trim(),
    input.place?.trim(),
    input.topic?.trim(),
    input.scenario?.trim(),
  ].filter(Boolean) as string[];

  if (hints.length === 0 || input.fleetPlaces.length === 0) {
    return undefined;
  }

  let best: SamStoryPlanFleetPlaceSnapshotV1 | undefined;
  let bestScore = 0;

  for (const place of input.fleetPlaces) {
    for (const hint of hints) {
      const score = scorePlaceHintMatch(hint, place);
      if (score > bestScore) {
        bestScore = score;
        best = place;
      }
    }
  }

  if (!best || bestScore < 0.35) {
    return undefined;
  }

  return best.slug;
}

export function shouldRandomizeStoryPlanStore(input: {
  storeSlug?: string;
  storeName?: string;
  place?: string;
  resolvedFromHints?: string;
}): boolean {
  if (input.storeSlug?.trim()) {
    return false;
  }
  if (input.resolvedFromHints?.trim()) {
    return false;
  }
  if (input.storeName?.trim()) {
    return false;
  }
  if (input.place?.trim()) {
    return false;
  }
  return true;
}

export function resolveStoryPlanStoreForPlan(input: {
  fleetPlaces: readonly SamStoryPlanFleetPlaceSnapshotV1[];
  storeSlug?: string;
  storeName?: string;
  place?: string;
  scenario?: string;
  topic?: string;
  random?: () => number;
  seed?: string | number;
}): string | undefined {
  const explicit = input.storeSlug?.trim();
  if (explicit && input.fleetPlaces.some((row) => row.slug === explicit)) {
    return explicit;
  }

  const fromHints = resolveStoryPlanStoreFromHints({
    storeName: input.storeName,
    place: input.place,
    scenario: input.scenario,
    topic: input.topic,
    fleetPlaces: input.fleetPlaces,
  });
  if (fromHints) {
    return fromHints;
  }

  if (
    !shouldRandomizeStoryPlanStore({
      storeSlug: explicit,
      storeName: input.storeName,
      place: input.place,
      resolvedFromHints: fromHints,
    })
  ) {
    return undefined;
  }

  const random = resolveStoryPlanRandom({ random: input.random, seed: input.seed });
  return pickRandomStoryPlanStoreSlug(input.fleetPlaces, random);
}
