import type { Character } from '../types/character.js';
import type { MentalModel } from '../types/strategy/mental-model.js';
import type { Persona } from '../types/strategy/persona.js';
import type { ThinkingStyle } from '../types/strategy/thinking-style.js';
import type { Journey } from '../types/story/journey.js';
import type { ResearchQuote } from '../types/story/quote.js';
import type { ResearchSignal } from '../types/story/research-signal.js';

/** Slice of AXM strategy/story planes contributed by one {@link Character}. */
export type CharacterAxmContribution = {
  characterId: string;
  persona: Persona;
  journeys?: Journey[];
  quotes?: ResearchQuote[];
  mentalModels?: MentalModel[];
  thinkingStyles?: ThinkingStyle[];
  signals?: ResearchSignal[];
};

export function characterToContribution(
  character: Character,
  options?: { persona?: Persona },
): CharacterAxmContribution {
  const ownerId = character.persona.id;
  const mentalModels = (character.mentalModels ?? []).map((model) =>
    model.characterIds?.length
      ? model
      : { ...model, characterIds: [ownerId] },
  );
  return {
    characterId: character.id,
    persona: options?.persona ?? (character.persona as Persona),
    ...(character.journeys?.length ? { journeys: character.journeys } : {}),
    ...(character.quotes?.length ? { quotes: character.quotes } : {}),
    ...(mentalModels.length ? { mentalModels } : {}),
    ...(character.thinkingStyles?.length ? { thinkingStyles: character.thinkingStyles } : {}),
    ...(character.signals?.length ? { signals: character.signals } : {}),
  };
}
