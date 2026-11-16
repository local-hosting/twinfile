import {
  resolveJourneyForPersona,
  type Journey,
  type Character,
} from '@doppler-group/twinfile-character/persona';

import type { StoryCharacterContext } from '../types/story-character-context.js';

export function resolveJourneyFromCharacterContext(
  context: StoryCharacterContext,
): Journey | undefined {
  if (context.journey) {
    return context.journey;
  }
  const journeyId = context.journeyId?.trim();
  if (!journeyId) {
    return undefined;
  }

  const focalCharacter = resolveCharacterForContext(context);
  if (focalCharacter) {
    return resolveJourneyForPersona(focalCharacter, journeyId, context.focalCharacterId);
  }

  return undefined;
}

export function resolveCharacterForContext(context: StoryCharacterContext): Character | undefined {
  const direct = context.characterById?.[context.focalCharacterId];
  if (direct) {
    return direct;
  }
  return Object.values(context.characterById ?? {}).find(
    (character) => character.persona.id === context.focalCharacterId || character.id === context.focalCharacterId,
  );
}
