import type { Character } from '@doppler-group/twinfile-character/character';
import { matchStoryCatalogIdsFromText } from '../story-catalog/match-story-catalog-from-text.js';
import type { StoryCatalogMenuV1 } from '../types/story-catalog-menu.js';

export type StoryMenuStoryWire = {
  id: string;
  title?: string;
  focalCharacterId?: string;
};

export function focalCharacterIdFromStoryMenuStory(
  story: Pick<StoryMenuStoryWire, 'focalCharacterId'>,
): string | undefined {
  const id = story.focalCharacterId?.trim();
  return id || undefined;
}

export function focalCharacterFromStoryMount(mount: { focalCharacter: Character }): Character {
  return mount.focalCharacter;
}

export type StoryPlanJourneyRowWire = {
  id: string;
  label?: string;
  focalCharacterId?: string;
};

export function storyPlanJourneyRowsFromMenuStories(
  stories: readonly StoryMenuStoryWire[],
): StoryPlanJourneyRowWire[] {
  return stories.map((row) => ({
    id: row.id,
    label: row.title,
    focalCharacterId: focalCharacterIdFromStoryMenuStory(row),
  }));
}

export function matchStoryCatalogIdsFromTextForPlanning(input: {
  text: string;
  menu: StoryCatalogMenuV1;
  fleetPlaces?: Parameters<typeof matchStoryCatalogIdsFromText>[0]['fleetPlaces'];
  focalCharacterId?: string;
  includePlaces?: boolean;
}) {
  const focalCharacterId = input.focalCharacterId?.trim();
  return matchStoryCatalogIdsFromText({
    text: input.text,
    menu: input.menu,
    fleetPlaces: input.fleetPlaces,
    includePlaces: input.includePlaces === true,
    ...(focalCharacterId ? { focalCharacterId } : {}),
  });
}

export function storyWireFocalCharacterArg(character: Character): { focalCharacter: Character } {
  return { focalCharacter: character };
}

export function storyWireFocalCharacterField(
  character: Character | undefined,
): { focalCharacter: Character | undefined } {
  return { focalCharacter: character };
}

export function storyMenuStoryRefForTest(input: {
  id: string;
  title?: string;
  focalCharacterId?: string;
}): StoryMenuStoryWire {
  const focalCharacterId = input.focalCharacterId?.trim();
  return {
    id: input.id,
    title: input.title,
    ...(focalCharacterId ? { focalCharacterId } : {}),
  };
}