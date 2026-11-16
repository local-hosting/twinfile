import { matchSamStoryCatalogIdsFromText } from '../story-catalog/match-story-catalog-from-text.js';
import type { SamStoryCatalogMenuV1 } from '../types/story-catalog-menu.js';
import type { SamStoryPlanCatalogSnapshotV1 } from '../types/story-plan-catalog.js';
import { resolveStoryPlanRandom } from './rng.js';

export type SamStoryPlanAxmMenuSelectionV1 = {
  pcmId: string;
  samEpisodeId: string;
  venueKey?: string;
  storeSlug?: string;
  rationale: string;
};

export type SamStoryPlanAxmMenuPlanInputV1 = {
  pcmId?: string;
  episodeId?: string;
  venueKey?: string;
  storeSlug?: string;
};

export function planStoryCreateAxmMenuHeuristic(input: {
  scenario: string;
  menu: SamStoryCatalogMenuV1;
  catalog: Pick<SamStoryPlanCatalogSnapshotV1, 'fleetVenues'>;
  plan?: SamStoryPlanAxmMenuPlanInputV1;
  random?: () => number;
  seed?: string | number;
}): SamStoryPlanAxmMenuSelectionV1 {
  const random = resolveStoryPlanRandom({ random: input.random, seed: input.seed });
  const scenario = input.scenario.trim();
  const plan = input.plan ?? {};

  const matched = matchSamStoryCatalogIdsFromText({
    text: scenario,
    menu: input.menu,
    fleetVenues: input.catalog.fleetVenues,
    focalPcmId: plan.pcmId?.trim(),
  });

  const pcmId =
    plan.pcmId?.trim() ||
    matched.pcmId ||
    input.menu.characters[0]?.pcmId;
  if (!pcmId || !input.menu.characters.some((row) => row.pcmId === pcmId)) {
    throw new Error('Org user catalog menu has no characters');
  }

  const episodesForPcm = input.menu.episodes.filter((row) => row.focalPcmId === pcmId);
  const episodePool = episodesForPcm.length > 0 ? episodesForPcm : input.menu.episodes;

  let samEpisodeId = plan.episodeId?.trim() || matched.episodeId;
  if (!samEpisodeId || !episodePool.some((row) => row.id === samEpisodeId)) {
    const index = Math.floor(random() * episodePool.length);
    samEpisodeId = episodePool[index]?.id;
  }
  if (!samEpisodeId) {
    throw new Error('Org user catalog menu has no SAM episodes');
  }

  const episode = input.menu.episodes.find((row) => row.id === samEpisodeId);
  const venueKey = plan.venueKey?.trim();
  const storeSlug = plan.storeSlug?.trim() || matched.storeSlug;

  const character = input.menu.characters.find((row) => row.pcmId === pcmId);
  const placeVenue =
    venueKey && input.menu.placeVenues?.length
      ? input.menu.placeVenues.find((row) => row.venueKey === venueKey)
      : undefined;
  return {
    pcmId,
    samEpisodeId,
    venueKey,
    storeSlug,
    rationale: `User catalog: character ${character?.label ?? pcmId}, episode ${episode?.title ?? samEpisodeId}${placeVenue ? `, place ${placeVenue.title}` : ''}${storeSlug ? `, store ${storeSlug}` : ''}`,
  };
}

export function validateStoryPlanAxmSelection(input: {
  menu: SamStoryCatalogMenuV1;
  selection: SamStoryPlanAxmMenuSelectionV1;
}): SamStoryPlanAxmMenuSelectionV1 {
  if (!input.menu.characters.some((row) => row.pcmId === input.selection.pcmId)) {
    throw new Error(`Invalid pcmId "${input.selection.pcmId}" — not in org user catalog`);
  }
  if (!input.menu.episodes.some((row) => row.id === input.selection.samEpisodeId)) {
    throw new Error(`Invalid episodeId "${input.selection.samEpisodeId}" — not in org user catalog`);
  }
  return input.selection;
}
