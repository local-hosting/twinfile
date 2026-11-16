import type { CharacterStoryInstance } from '../types/story/character-story-instance.js';

/** Cognition-facing slice of a materialized Character story instance (portable, no host contract). */
export type CharacterStoryPsychology = {
  characterId: string;
  segmentId: string;
  displayName: string;
  mindset?: string;
  traits?: readonly string[];
  voiceLine?: string;
  demographics?: Readonly<Record<string, string>>;
};

export function psychologyFromCharacterStoryInstance(instance: CharacterStoryInstance): CharacterStoryPsychology {
  const { characteristics } = instance;
  return {
    characterId: instance.characterId,
    segmentId: instance.segmentId,
    displayName: instance.displayName,
    ...(characteristics.mindset ? { mindset: characteristics.mindset } : {}),
    ...(characteristics.traits?.length ? { traits: [...characteristics.traits] } : {}),
    ...(characteristics.voiceLine ? { voiceLine: characteristics.voiceLine } : {}),
    ...(characteristics.demographics && Object.keys(characteristics.demographics).length
      ? { demographics: { ...characteristics.demographics } }
      : {}),
  };
}
