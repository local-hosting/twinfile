import type { Journey, Character } from '@doppler-group/twinfile-character/character';

import { resolveJourneyForStory } from '../journey/build/resolve-journey-for-story.js';
import type { Story } from '../types/story-narrative.js';

export type ResolveStorySelection = {
  storyId?: string;
  characterId?: string;
};

export type StoryMountV1 = {
  story: Story;
  focalCharacter: Character;
  journey: Journey;
  characterById: Record<string, Character>;
};

function characterByIdMap(characters: readonly Character[]): Record<string, Character> {
  const map: Record<string, Character> = {};
  for (const character of characters) {
    map[character.id] = character;
    map[character.persona.id] = character;
  }
  return map;
}

export function resolveStoryEpisode(input: {
  stories: readonly Story[];
  characters: readonly Character[];
  selection: ResolveStorySelection;
}): StoryMountV1 {
  const storyId = input.selection.storyId?.trim();
  if (storyId) {
    const direct = input.stories.find((row) => row.id === storyId);
    if (!direct) {
      throw new Error(`Story "${storyId}" is not in mounted catalog`);
    }
    return mountStory(direct, input.characters, input.selection.characterId);
  }

  if (input.stories.length === 1) {
    return mountStory(input.stories[0], input.characters, input.selection.characterId);
  }

  const characterId = input.selection.characterId?.trim();
  if (characterId) {
    const forCharacter = input.stories.filter((row) => row.binding.characterId === characterId);
    if (forCharacter.length === 1) {
      return mountStory(forCharacter[0], input.characters, characterId);
    }
    if (forCharacter.length > 1) {
      throw new Error(`Multiple Stories for Character "${characterId}" — pass storyId`);
    }
  }

  throw new Error('Could not resolve Story — pass storyId or characterId');
}

function mountStory(
  story: Story,
  characters: readonly Character[],
  characterIdOverride?: string,
): StoryMountV1 {
  const characterById = characterByIdMap(characters);
  const focalCharacterId = characterIdOverride?.trim() || story.binding.characterId;
  const focalCharacter = characterById[focalCharacterId];
  if (!focalCharacter) {
    throw new Error(`Character "${focalCharacterId}" is not in mounted catalog`);
  }

  const journey = resolveJourneyForStory(story, focalCharacter.journeys ?? []);
  return { story, focalCharacter, journey, characterById };
}