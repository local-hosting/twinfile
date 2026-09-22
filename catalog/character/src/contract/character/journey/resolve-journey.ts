import type { Journey } from '../types/story/journey.js';
import type { Character } from '../types/character.js';

export function listJourneysForCharacter(character: Character, characterId: string): Journey[] {
  const journeys = character.journeys ?? [];
  return journeys.filter((row) => row.characterId === characterId);
}

export function resolveJourneyById(journeys: readonly Journey[], journeyId: string): Journey | undefined {
  return journeys.find((row) => row.id === journeyId);
}

export function requireJourneyById(journeys: readonly Journey[], journeyId: string): Journey {
  const journey = resolveJourneyById(journeys, journeyId);
  if (!journey) {
    throw new Error(`journey not found: ${journeyId}`);
  }
  return journey;
}

export function resolveJourneyForCharacter(
  character: Character,
  journeyId: string,
  characterId?: string,
): Journey | undefined {
  const journeys = character.journeys ?? [];
  const journey = resolveJourneyById(journeys, journeyId);
  if (!journey) {
    return undefined;
  }
  if (characterId && journey.characterId !== characterId) {
    return undefined;
  }
  return journey;
}
