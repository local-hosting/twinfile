import { samePlaceRef } from '@local-hosting/twinfile/ref';

import { matchStoryCatalogIdsFromText } from '../story-catalog/match-story-catalog-from-text.js';
import type { StoryCatalogMenuV1 } from '../types/story-catalog-menu.js';
import type { StoryPlanCatalogSnapshotV1 } from '../types/story-plan-catalog.js';
import { resolveStoryPlanRandom } from './rng.js';

export type StoryPlanCatalogMenuSelectionV1 = {
  characterId: string;
  storyId: string;
  placeRef?: string;
  storeSlug?: string;
  rationale: string;
};

export type StoryPlanCatalogMenuPlanInputV1 = {
  characterId?: string;
  storyId?: string;
  placeRef?: string;
  storeSlug?: string;
};

export function planStoryCreateCatalogMenuHeuristic(input: {
  scenario: string;
  menu: StoryCatalogMenuV1;
  catalog: Pick<StoryPlanCatalogSnapshotV1, 'fleetPlaces'>;
  plan?: StoryPlanCatalogMenuPlanInputV1;
  random?: () => number;
  seed?: string | number;
}): StoryPlanCatalogMenuSelectionV1 {
  const random = resolveStoryPlanRandom({ random: input.random, seed: input.seed });
  const scenario = input.scenario.trim();
  const plan = input.plan ?? {};

  const matched = matchStoryCatalogIdsFromText({
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
    throw new Error('Story catalog menu has no characters');
  }

  const storiesForCharacter = input.menu.stories.filter((row) => row.focalCharacterId === characterId);
  const storyPool = storiesForCharacter.length > 0 ? storiesForCharacter : input.menu.stories;

  let storyId = plan.storyId?.trim() || matched.storyId;
  if (!storyId || !storyPool.some((row) => row.id === storyId)) {
    const index = Math.floor(random() * storyPool.length);
    storyId = storyPool[index]?.id;
  }
  if (!storyId) {
    throw new Error('Story catalog menu has no Story twins');
  }

  const story = input.menu.stories.find((row) => row.id === storyId);
  const placeRef = plan.placeRef?.trim();
  const storeSlug = plan.storeSlug?.trim() || matched.storeSlug;

  const character = input.menu.characters.find((row) => row.characterId === characterId);
  const menuPlace =
    placeRef && input.menu.places?.length
      ? input.menu.places.find((row) => samePlaceRef(row.placeRef, placeRef))
      : undefined;
  return {
    characterId,
    storyId,
    placeRef,
    storeSlug,
    rationale: `User catalog: character ${character?.label ?? characterId}, story ${story?.title ?? storyId}${menuPlace ? `, place ${menuPlace.title}` : ''}${storeSlug ? `, store ${storeSlug}` : ''}`,
  };
}

export function validateStoryPlanCatalogMenuSelection(input: {
  menu: StoryCatalogMenuV1;
  selection: StoryPlanCatalogMenuSelectionV1;
}): StoryPlanCatalogMenuSelectionV1 {
  if (!input.menu.characters.some((row) => row.characterId === input.selection.characterId)) {
    throw new Error(`Invalid characterId "${input.selection.characterId}" — not in story catalog menu`);
  }
  if (!input.menu.stories.some((row) => row.id === input.selection.storyId)) {
    throw new Error(`Invalid storyId "${input.selection.storyId}" — not in story catalog menu`);
  }
  return input.selection;
}