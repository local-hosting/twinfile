import type { Character } from '../types/character.js';
import type { CharacterInstanceCharacteristics, CharacterStoryInstance } from '../types/story/character-story-instance.js';
import {
  DEFAULT_CHARACTER_INSTANCE_TRAIT_PICK_COUNT,
  DEFAULT_CHARACTER_INSTANCE_VARIATION,
  type CharacterInstanceVariationPolicy,
} from '../types/story/character-instance-variation.js';
import { adjustDailyRhythmForInstance } from '../persona/adjust-daily-rhythm-for-instance.js';
import { pickPersonaDailyRhythmTemplate } from '../persona/pick-persona-daily-rhythm-template.js';
import { samplePersonaDailyRhythm } from '../persona/sample-persona-daily-rhythm.js';
import { sampleCharacterDemographicBands } from './sample-character-demographic-bands.js';
import { resolveCharacterInstanceRandom } from './character-instance-rng.js';

export { DEFAULT_CHARACTER_INSTANCE_TRAIT_PICK_COUNT } from '../types/story/character-instance-variation.js';
export type { CharacterInstanceVariationPolicy } from '../types/story/character-instance-variation.js';
export {
  demographicPlaneFromCharacterSignals,
  resolveCharacterDemographicPlane,
  sampleDemographicBandsFromPlane,
  sampleCharacterDemographicBands,
} from './sample-character-demographic-bands.js';

function resolveInstanceVariation(
  character: Character,
  override?: CharacterInstanceVariationPolicy,
): CharacterInstanceVariationPolicy {
  return {
    ...DEFAULT_CHARACTER_INSTANCE_VARIATION,
    ...character.instanceVariation,
    ...override,
  };
}

function shuffleSample<T>(items: readonly T[], count: number, random: () => number): T[] {
  if (items.length === 0 || count <= 0) return [];
  const pool = [...items];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    picked.push(pool.splice(index, 1)[0]!);
  }
  return picked;
}

export function pickCharacterInstanceCharacteristics(
  character: Character,
  random: () => number = Math.random,
  traitPickCount?: number,
  variationOverride?: CharacterInstanceVariationPolicy,
): CharacterInstanceCharacteristics {
  const variation = resolveInstanceVariation(character, variationOverride);
  const pickCount = Math.min(
    traitPickCount ?? variation.traitPickCount ?? DEFAULT_CHARACTER_INSTANCE_TRAIT_PICK_COUNT,
    (character.persona.traits ?? []).length,
  );
  const traitPool = (character.persona.traits ?? []).map((row) => row.trim()).filter(Boolean);
  const traits = shuffleSample(traitPool, pickCount, random);
  const mindset =
    variation.includeMindset !== false ? character.persona.mindset?.trim() : undefined;
  const voiceLine =
    variation.includeVoiceLine !== false ? character.persona.quote?.trim() : undefined;
  const personality =
    variation.includePersonality !== false ? character.persona.personality : undefined;
  const demographics =
    variation.includeDemographics !== false ? sampleCharacterDemographicBands(character, random) : {};
  let dailyRhythm;
  if (variation.includeDailyRhythm !== false) {
    const picked = pickPersonaDailyRhythmTemplate(
      character,
      random,
      variation.rhythmVariantPick ?? 'weighted',
    );
    const adjusted = adjustDailyRhythmForInstance(picked.template, {
      persona: character.persona,
      demographics: Object.keys(demographics).length ? demographics : undefined,
    });
    dailyRhythm = samplePersonaDailyRhythm(adjusted, random, {
      jitterMinutes: variation.rhythmJitterMinutes ?? adjusted.jitterMinutes,
      sourceVariantId: picked.variantId,
    });
  }

  return {
    ...(mindset ? { mindset } : {}),
    ...(traits.length ? { traits } : {}),
    ...(voiceLine ? { voiceLine } : {}),
    ...(personality ? { personality } : {}),
    ...(Object.keys(demographics).length ? { demographics } : {}),
    ...(dailyRhythm ? { dailyRhythm } : {}),
  };
}

export type MaterializeCharacterStoryInstanceInput = {
  character: Character;
  characterId: string;
  segmentId: string;
  displayName: string;
  instanceId?: string;
  /** Reproducible sampling (traits, demographics, rhythm) — e.g. project `characterId`. */
  seed?: string | number;
  /** Injectable PRNG; takes precedence over {@link seed}. */
  random?: () => number;
  traitPickCount?: number;
};

/** Materialize a project story instance from org Character (display name + sampled characteristics). */
export function materializeCharacterStoryInstance(input: MaterializeCharacterStoryInstanceInput): CharacterStoryInstance {
  const random = resolveCharacterInstanceRandom({
    seed: input.seed,
    random: input.random,
  });
  const characteristics = pickCharacterInstanceCharacteristics(input.character, random, input.traitPickCount);

  return {
    specVersion: '1.0',
    ...(input.instanceId?.trim() ? { instanceId: input.instanceId.trim() } : {}),
    characterId: input.characterId,
    segmentId: input.segmentId,
    displayName: input.displayName.trim(),
    characteristics,
    createdAt: new Date().toISOString(),
  };
}
