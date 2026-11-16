import type { Character } from '@local-hosting/twinfile-character/persona';
import type { PlaceMount } from '../types/place-mount.js';

import { compileStory } from '../contract/compile-story-narrative.js';
import type { Story } from '../types/story-narrative.js';
import type { StoryCharacterContext } from '../types/story-character-context.js';
import { resolveJourneyForStory } from '../journey/build/resolve-journey-for-story.js';

function characterForBinding(characters: readonly Character[], characterId: string): Character {
  const row = characters.find(
    (character) => character.id === characterId || character.persona.id === characterId,
  );
  if (!row) {
    throw new Error(`Story binding characterId "${characterId}" is not in mounted character catalog`);
  }
  return row;
}

export function compileStoriesForCatalog(input: {
  characters: readonly Character[];
  placeMounts: readonly PlaceMount[];
  stories: readonly Story[];
}): Story[] {
  const knownCharacterIds = input.characters.map((row) => row.persona.id);
  const knownPlaceRefs = input.placeMounts.map((row) => row.placeRef);
  const characterById: Record<string, Character> = {};
  for (const character of input.characters) {
    characterById[character.id] = character;
    characterById[character.persona.id] = character;
  }

  return input.stories.map((story) => {
    const focalCharacter = characterForBinding(input.characters, story.binding.characterId);
    const journey = resolveJourneyForStory(story, focalCharacter.journeys ?? []);
    const characterContext: StoryCharacterContext = {
      focalCharacterId: focalCharacter.persona.id,
      journeyId: journey.id,
      journey,
      characterById,
    };

    const compiled = compileStory({
      story,
      journey,
      placeMounts: input.placeMounts,
      characterContext,
      knownCharacterIds,
      knownPlaceRefs,
      force: true,
    });

    if (!compiled.ok) {
      throw new Error(`compileStory failed for ${story.id}: ${compiled.issues.join('; ')}`);
    }
    if (!compiled.story.episodeArc) {
      throw new Error(`compileStory succeeded for ${story.id} but episodeArc is missing`);
    }

    return compiled.story;
  });
}