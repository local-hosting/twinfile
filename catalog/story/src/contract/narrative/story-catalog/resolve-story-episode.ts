import type { Journey, Character } from '@doppler-group/twinfile-character/persona';

import { resolveJourneyForStory } from '../journey/build/resolve-journey-for-story.js';
import type { Story } from '../types/story-narrative.js';

export type ResolveStoryEpisodeSelection = {
  episodeId?: string;
  characterId?: string;
};

export type StoryEpisodeMountV1 = {
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
  selection: ResolveStoryEpisodeSelection;
}): StoryEpisodeMountV1 {
  const episodeId = input.selection.episodeId?.trim();
  if (episodeId) {
    const direct = input.stories.find((row) => row.id === episodeId);
    if (!direct) {
      throw new Error(`Story episode "${episodeId}" is not in mounted catalog`);
    }
    return mountStoryEpisode(direct, input.characters, input.selection.characterId);
  }

  if (input.stories.length === 1) {
    return mountStoryEpisode(input.stories[0], input.characters, input.selection.characterId);
  }

  const characterId = input.selection.characterId?.trim();
  if (characterId) {
    const forCharacter = input.stories.filter((row) => row.binding.characterId === characterId);
    if (forCharacter.length === 1) {
      return mountStoryEpisode(forCharacter[0], input.characters, characterId);
    }
    if (forCharacter.length > 1) {
      throw new Error(`Multiple Story episodes for Character "${characterId}" — pass episodeId`);
    }
  }

  throw new Error('Could not resolve Story episode — pass episodeId or characterId');
}

function mountStoryEpisode(
  story: Story,
  characters: readonly Character[],
  characterIdOverride?: string,
): StoryEpisodeMountV1 {
  const characterById = characterByIdMap(characters);
  const focalCharacterId = characterIdOverride?.trim() || story.binding.characterId;
  const focalCharacter = characterById[focalCharacterId];
  if (!focalCharacter) {
    throw new Error(`Character "${focalCharacterId}" is not in mounted catalog`);
  }

  const journey = resolveJourneyForStory(story, focalCharacter.journeys ?? []);
  return { story, focalCharacter, journey, characterById };
}