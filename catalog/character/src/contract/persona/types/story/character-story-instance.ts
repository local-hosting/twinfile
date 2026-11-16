import type { CharacterPersonality } from '../character-persona.js';
import type { SampledPersonaDailyRhythm } from '../strategy/persona-daily-rhythm.js';

/** Scenario-specific slice of a Character persona. */
export type CharacterInstanceCharacteristics = {
  mindset?: string;
  traits?: readonly string[];
  voiceLine?: string;
  /** Dramaturgy sheet from `persona.personality` (not sampled). */
  personality?: CharacterPersonality;
  /** Jittered weekday home/work schedule for this instance. */
  dailyRhythm?: SampledPersonaDailyRhythm;
  /**
   * One sampled band per demographic framework (`age` → `55+`, `income` → …).
   * Drawn from `persona.demographic` or demographic research signals on this Character.
   */
  demographics?: Readonly<Record<string, string>>;
};

export type CharacterStoryInstance = {
  specVersion: '1.0';
  instanceId?: string;
  characterId: string;
  segmentId: string;
  displayName: string;
  characteristics: CharacterInstanceCharacteristics;
  createdAt: string;
};
