import type { SamStoryCatalogMenuV1 } from '../types/story-catalog-menu.js';

export type SamStoryCatalogTextMatchV1 = {
  pcmId?: string;
  episodeId?: string;
  venueKey?: string;
  storeSlug?: string;
  journeyId?: string;
};

export type SamStoryCatalogFleetVenueRef = {
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

export function venueSlugFromVenueKey(venueKey: string): string {
  return venueKey.trim().replace(/^venue:/, '');
}

/** Keyword match user catalog menu (+ optional fleet slugs) against natural language. */
export function matchSamStoryCatalogIdsFromText(input: {
  text: string;
  menu: SamStoryCatalogMenuV1;
  fleetVenues?: readonly SamStoryCatalogFleetVenueRef[];
  focalPcmId?: string;
  /** When false (default), do not infer venueKey from place mount titles — places are not user content. */
  includePlaceVenues?: boolean;
}): SamStoryCatalogTextMatchV1 {
  const scenario = input.text.trim();
  if (!scenario) {
    return {};
  }

  const pcmId = bestIdFromCandidates(
    scenario,
    input.menu.characters.map((row) => ({
      id: row.pcmId,
      labels: [row.pcmId, row.label, row.pcmId.replace(/^persona:/, '')],
    })),
  );

  const focalPcmId = input.focalPcmId?.trim() || pcmId;
  const episodePool = focalPcmId
    ? input.menu.episodes.filter((row) => row.focalPcmId === focalPcmId)
    : input.menu.episodes;
  const episodeId = bestIdFromCandidates(
    scenario,
    episodePool.map((row) => ({
      id: row.id,
      labels: [row.id, row.title, row.id.replace(/^story:episode:/, ''), row.journeyId ?? ''],
    })),
    0.15,
  );

  const includePlaceVenues = input.includePlaceVenues === true;
  const venueKey =
    includePlaceVenues && input.menu.placeVenues?.length
      ? bestIdFromCandidates(
          scenario,
          input.menu.placeVenues.map((row) => ({
            id: row.venueKey,
            labels: [row.venueKey, row.title, row.venueKey.replace(/^venue:/, '')],
          })),
          0.2,
        )
      : undefined;

  const storeSlug = input.fleetVenues
    ? bestIdFromCandidates(
        scenario,
        input.fleetVenues.map((row) => ({
          id: row.slug,
          labels: [row.slug, row.name ?? ''],
        })),
        0.25,
      )
    : undefined;

  const journeyId = episodeId
    ? input.menu.episodes.find((row) => row.id === episodeId)?.journeyId
    : undefined;

  return {
    ...(pcmId ? { pcmId } : {}),
    ...(episodeId ? { episodeId } : {}),
    ...(venueKey ? { venueKey } : {}),
    ...(storeSlug ? { storeSlug } : {}),
    ...(journeyId ? { journeyId } : {}),
  };
}
