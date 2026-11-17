import { parseTwinfileRef } from '@doppler-group/twinfile-core/ref';

import type { StoryCatalogMenuV1 } from '../types/story-catalog-menu.js';

export type StoryCatalogTextMatchV1 = {
  characterId?: string;
  storyId?: string;
  placeRef?: string;
  storeSlug?: string;
};

export type StoryCatalogFleetPlaceRef = {
  slug: string;
  name?: string;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeText(value).split(' ').filter((token) => token.length > 1));
}

export function scoreCatalogTextMatch(scenario: string, candidate: string): number {
  const scenarioTokens = tokenSet(scenario);
  const candidateTokens = [...tokenSet(candidate)].filter((token) => token.length > 1);
  if (candidateTokens.length === 0) return 0;
  let hits = 0;
  for (const token of candidateTokens) {
    if (scenarioTokens.has(token)) hits += 1;
  }
  return hits / candidateTokens.length;
}

function bestIdFromCandidates(
  scenario: string,
  candidates: { id: string; labels: string[] }[],
  minScore = 0.2,
): string | undefined {
  let bestId: string | undefined;
  let bestScore = minScore;
  for (const candidate of candidates) {
    for (const label of candidate.labels) {
      const score = scoreCatalogTextMatch(scenario, label);
      if (score > bestScore) {
        bestScore = score;
        bestId = candidate.id;
      }
    }
  }
  return bestId;
}

export function placeSlugFromPlaceRef(placeRef: string): string {
  const trimmed = placeRef.trim();
  const fromRef = parseTwinfileRef(trimmed)?.name?.trim();
  if (fromRef) {
    return fromRef;
  }
  // Legacy mount ids (`venue:demo-airport`) — not Twinfile refs.
  const colon = trimmed.indexOf(':');
  if (colon > 0 && !trimmed.includes('/')) {
    const slug = trimmed.slice(colon + 1).trim();
    if (slug) {
      return slug;
    }
  }
  return trimmed;
}

/** Keyword match user catalog menu (+ optional fleet slugs) against natural language. */
export function matchStoryCatalogIdsFromText(input: {
  text: string;
  menu: StoryCatalogMenuV1;
  fleetPlaces?: readonly StoryCatalogFleetPlaceRef[];
  focalCharacterId?: string;
  /** When false (default), do not infer placeRef from place mount titles — places are not user content. */
  includePlaces?: boolean;
}): StoryCatalogTextMatchV1 {
  const scenario = input.text.trim();
  if (!scenario) {
    return {};
  }

  const characterId = bestIdFromCandidates(
    scenario,
    input.menu.characters.map((row) => ({
      id: row.characterId,
      labels: [row.characterId, row.label, row.characterId.replace(/^persona:/, '')],
    })),
  );

  const focalCharacterId = input.focalCharacterId?.trim() || characterId;
  const storyPool = focalCharacterId
    ? input.menu.stories.filter((row) => row.focalCharacterId === focalCharacterId)
    : input.menu.stories;
  const storyId = bestIdFromCandidates(
    scenario,
    storyPool.map((row) => ({
      id: row.id,
      labels: [row.id, row.title, row.id.replace(/^story:/, '')],
    })),
    0.15,
  );

  const includePlaces = input.includePlaces === true;
  const placeRef =
    includePlaces && input.menu.places?.length
      ? bestIdFromCandidates(
          scenario,
          input.menu.places.map((row) => ({
            id: row.placeRef,
            labels: [row.placeRef, row.title, placeSlugFromPlaceRef(row.placeRef)],
          })),
          0.2,
        )
      : undefined;

  const storeSlug = input.fleetPlaces
    ? bestIdFromCandidates(
        scenario,
        input.fleetPlaces.map((row) => ({
          id: row.slug,
          labels: [row.slug, row.name ?? ''],
        })),
        0.25,
      )
    : undefined;

  return {
    ...(characterId ? { characterId } : {}),
    ...(storyId ? { storyId } : {}),
    ...(placeRef ? { placeRef } : {}),
    ...(storeSlug ? { storeSlug } : {}),
  };
}
