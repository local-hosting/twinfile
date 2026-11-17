import type { Character } from '@local-hosting/twinfile-character/character';
import type { PlaceMount } from '../types/place-mount.js';

import type { Story } from '../types/story-narrative.js';
import type { StoryCatalogMenuV1 } from '../types/story-catalog-menu.js';

/** Build user catalog menu from Character + Story only (no place mounts). */
export function buildUserStoryCatalogMenu(input: {
  characters: readonly Character[];
  stories: readonly Story[];
}): StoryCatalogMenuV1 {
  return {
    characters: input.characters.map((character) => ({
      characterId: character.persona.id,
      label: character.persona.label?.trim() || character.title?.trim() || character.persona.id,
      journeyIds: (character.journeys ?? []).map((row) => row.id),
    })),
    stories: input.stories.map((story) => ({
      id: story.id,
      title: story.title?.trim() || story.id,
      focalCharacterId: story.binding.characterId,
    })),
  };
}

/** Build full catalog menu including optional place mounts (admin / touchpoint tooling). */
export function buildStoryCatalogMenu(input: {
  characters: readonly Character[];
  placeMounts?: readonly PlaceMount[];
  stories: readonly Story[];
}): StoryCatalogMenuV1 {
  const userMenu = buildUserStoryCatalogMenu({
    characters: input.characters,
    stories: input.stories,
  });
  const placeMounts = input.placeMounts ?? [];
  if (placeMounts.length === 0) {
    return userMenu;
  }
  return {
    ...userMenu,
    places: placeMounts.map((mount) => ({
      placeRef: mount.placeRef,
      title: mount.title?.trim() || mount.placeRef,
    })),
  };
}

export function storyCatalogMenuHasStories(menu: StoryCatalogMenuV1): boolean {
  return menu.stories.length > 0 && menu.characters.length > 0;
}
