import { samePlaceRef } from '@doppler-group/twinfile-core/ref';

import { matchSamStoryCatalogIdsFromText } from '../story-catalog/match-story-catalog-from-text.js';
import type { StoryCatalogMenuV1 } from '../types/story-catalog-menu.js';
import type { SamStoryPlanCatalogSnapshotV1 } from '../types/story-plan-catalog.js';
import { resolveStoryPlanRandom } from './rng.js';

export type SamStoryPlanAxmMenuSelectionV1 = {
  characterId: string;
  episodeId: string;
  placeRef?: string;
  storeSlug?: string;
  rationale: string;
};

export type SamStoryPlanAxmMenuPlanInputV1 = {
  characterId?: string;
  episodeId?: string;
  placeRef?: string;
  storeSlug?: string;
};

export function planStoryCreateAxmMenuHeuristic(input: {
  scenario: string;
  menu: StoryCatalogMenuV1;
  catalog: Pick<SamStoryPlanCatalogSnapshotV1, 'fleetPlaces'>;
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
    fleetPlaces: input.catalog.fleetPlaces,
    focalCharacterId: plan.characterId?.trim(),
  });

  const characterId =
    plan.characterId?.trim() ||
    matched.characterId ||
    input.menu.characters[0]?.characterId;
  if (!characterId || !input.menu.characters.some((row) => row.characterId === characterId)) {
    throw new Error('Org user catalog menu has no characters');
  }

  const episodesForPcm = input.menu.episodes.filter((row) => row.focalCharacterId === characterId);
  const episodePool = episodesForPcm.length > 0 ? episodesForPcm : input.menu.episodes;

  let episodeId = plan.episodeId?.trim() || matched.episodeId;
  if (!episodeId || !episodePool.some((row) => row.id === episodeId)) {
    const index = Math.floor(random() * episodePool.length);
    episodeId = episodePool[index]?.id;
  }
  if (!episodeId) {
    throw new Error('Org user catalog menu has no Story episodes');
  }

  const episode = input.menu.episodes.find((row) => row.id === episodeId);
  const placeRef = plan.placeRef?.trim();
  const storeSlug = plan.storeSlug?.trim() || matched.storeSlug;

  const character = input.menu.characters.find((row) => row.characterId === characterId);
  const menuPlace =
    placeRef && input.menu.places?.length
      ? input.menu.places.find((row) => samePlaceRef(row.placeRef, placeRef))
      : undefined;
  return {
    characterId,
    episodeId,
    placeRef,
    storeSlug,
    rationale: `User catalog: character ${character?.label ?? characterId}, episode ${episode?.title ?? episodeId}${menuPlace ? `, place ${menuPlace.title}` : ''}${storeSlug ? `, store ${storeSlug}` : ''}`,
  };
}

export function validateStoryPlanAxmSelection(input: {
  menu: StoryCatalogMenuV1;
  selection: SamStoryPlanAxmMenuSelectionV1;
}): SamStoryPlanAxmMenuSelectionV1 {
  if (!input.menu.characters.some((row) => row.characterId === input.selection.characterId)) {
    throw new Error(`Invalid characterId "${input.selection.characterId}" — not in org user catalog`);
  }
  if (!input.menu.episodes.some((row) => row.id === input.selection.episodeId)) {
    throw new Error(`Invalid episodeId "${input.selection.episodeId}" — not in org user catalog`);
  }
  return input.selection;
}
