import type { PCM } from '../types/pcm.js';
import type { PcmInstanceCharacteristics, PcmStoryInstance } from '../types/story/pcm-story-instance.js';
import {
  DEFAULT_PCM_INSTANCE_TRAIT_PICK_COUNT,
  DEFAULT_PCM_INSTANCE_VARIATION,
  type PcmInstanceVariationPolicy,
} from '../types/story/pcm-instance-variation.js';
import { adjustDailyRhythmForInstance } from '../persona/adjust-daily-rhythm-for-instance.js';
import { pickPersonaDailyRhythmTemplate } from '../persona/pick-persona-daily-rhythm-template.js';
import { samplePersonaDailyRhythm } from '../persona/sample-persona-daily-rhythm.js';
import { samplePcmDemographicBands } from './sample-pcm-demographic-bands.js';
import { resolvePcmInstanceRandom } from './pcm-instance-rng.js';

export { DEFAULT_PCM_INSTANCE_TRAIT_PICK_COUNT } from '../types/story/pcm-instance-variation.js';
export type { PcmInstanceVariationPolicy } from '../types/story/pcm-instance-variation.js';
export {
  demographicPlaneFromPcmSignals,
  resolvePcmDemographicPlane,
  sampleDemographicBandsFromPlane,
  samplePcmDemographicBands,
} from './sample-pcm-demographic-bands.js';

function resolveInstanceVariation(
  pcm: PCM,
  override?: PcmInstanceVariationPolicy,
): PcmInstanceVariationPolicy {
  return {
    ...DEFAULT_PCM_INSTANCE_VARIATION,
    ...pcm.instanceVariation,
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

export function pickPcmInstanceCharacteristics(
  pcm: PCM,
  random: () => number = Math.random,
  traitPickCount?: number,
  variationOverride?: PcmInstanceVariationPolicy,
): PcmInstanceCharacteristics {
  const variation = resolveInstanceVariation(pcm, variationOverride);
  const pickCount = Math.min(
    traitPickCount ?? variation.traitPickCount ?? DEFAULT_PCM_INSTANCE_TRAIT_PICK_COUNT,
    (pcm.persona.traits ?? []).length,
  );
  const traitPool = (pcm.persona.traits ?? []).map((row) => row.trim()).filter(Boolean);
  const traits = shuffleSample(traitPool, pickCount, random);
  const mindset =
    variation.includeMindset !== false ? pcm.persona.mindset?.trim() : undefined;
  const voiceLine =
    variation.includeVoiceLine !== false ? pcm.persona.quote?.trim() : undefined;
  const demographics =
    variation.includeDemographics !== false ? samplePcmDemographicBands(pcm, random) : {};
  let dailyRhythm;
  if (variation.includeDailyRhythm !== false) {
    const picked = pickPersonaDailyRhythmTemplate(
      pcm,
      random,
      variation.rhythmVariantPick ?? 'weighted',
    );
    const adjusted = adjustDailyRhythmForInstance(picked.template, {
      persona: pcm.persona,
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
    ...(Object.keys(demographics).length ? { demographics } : {}),
    ...(dailyRhythm ? { dailyRhythm } : {}),
  };
}

export type MaterializePcmStoryInstanceInput = {
  pcm: PCM;
  pcmId: string;
  segmentId: string;
  displayName: string;
  instanceId?: string;
  /** Reproducible sampling (traits, demographics, rhythm) — e.g. project `characterId`. */
  seed?: string | number;
  /** Injectable PRNG; takes precedence over {@link seed}. */
  random?: () => number;
  traitPickCount?: number;
};

/** Materialize a project story instance from org PCM (display name + sampled characteristics). */
export function materializePcmStoryInstance(input: MaterializePcmStoryInstanceInput): PcmStoryInstance {
  const random = resolvePcmInstanceRandom({
    seed: input.seed,
    random: input.random,
  });
  const characteristics = pickPcmInstanceCharacteristics(input.pcm, random, input.traitPickCount);

  return {
    specVersion: '1.0',
    ...(input.instanceId?.trim() ? { instanceId: input.instanceId.trim() } : {}),
    pcmId: input.pcmId,
    segmentId: input.segmentId,
    displayName: input.displayName.trim(),
    characteristics,
    createdAt: new Date().toISOString(),
  };
}
