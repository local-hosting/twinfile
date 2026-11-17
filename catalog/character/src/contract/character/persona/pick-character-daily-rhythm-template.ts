import type { Character } from '../types/character.js';
import type {
  PersonaDailyRhythm,
  PersonaDailyRhythmVariant,
} from '../types/strategy/persona-daily-rhythm.js';
import { resolveCharacterDailyRhythm } from './resolve-character-daily-rhythm.js';

export type ResolvedPersonaDailyRhythmTemplate = {
  template: PersonaDailyRhythm;
  variantId?: string;
};

function pickWeightedVariant(
  variants: readonly PersonaDailyRhythmVariant[],
  random: () => number,
): PersonaDailyRhythmVariant {
  const weights = variants.map((row) => row.weight ?? 1);
  const total = weights.reduce((sum, value) => sum + value, 0);
  let needle = random() * total;
  for (let index = 0; index < variants.length; index += 1) {
    needle -= weights[index]!;
    if (needle <= 0) {
      return variants[index]!;
    }
  }
  return variants[variants.length - 1]!;
}

function variantToTemplate(variant: PersonaDailyRhythmVariant): PersonaDailyRhythm {
  return {
    specVersion: '1.0',
    label: variant.label?.trim() || variant.id,
    weekday: variant.weekday,
    ...(variant.weekend?.length ? { weekend: variant.weekend } : {}),
    ...(variant.jitterMinutes != null ? { jitterMinutes: variant.jitterMinutes } : {}),
  };
}

/** Pick authored rhythm, weighted variant, or role-based preset. */
export function pickCharacterDailyRhythmTemplate(
  character: Character,
  random: () => number,
  pickMode: 'weighted' | 'first' = 'weighted',
): ResolvedPersonaDailyRhythmTemplate {
  const authored = character.persona.dailyRhythm;
  if (authored?.weekday?.length) {
    return { template: authored };
  }

  const variants = character.persona.dailyRhythmVariants ?? [];
  if (variants.length > 0) {
    const picked = pickMode === 'first' ? variants[0]! : pickWeightedVariant(variants, random);
    return {
      template: variantToTemplate(picked),
      variantId: picked.id,
    };
  }

  return { template: resolveCharacterDailyRhythm(character) };
}
