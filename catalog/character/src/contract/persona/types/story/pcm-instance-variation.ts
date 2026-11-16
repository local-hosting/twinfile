/** How hosts may sample a one-off story instance from a focal PCM. */
export type PcmInstanceVariationPolicy = {
  specVersion: '1.0';
  /** Traits drawn from `persona.traits` without replacement (default 3). */
  traitPickCount?: number;
  /** Include `persona.mindset` on the instance when present (default true). */
  includeMindset?: boolean;
  /** Include `persona.quote` as `voiceLine` when present (default true). */
  includeVoiceLine?: boolean;
  /**
   * Sample demographic bands from `persona.demographic` or demographic signals
   * (default true). Exemplar demographics stay locked on the catalog PCM.
   */
  includeDemographics?: boolean;
  /** Sample `persona.dailyRhythm` (or role default) onto the instance (default true). */
  includeDailyRhythm?: boolean;
  /** Override template jitter (minutes); else template / variant / default 25. */
  rhythmJitterMinutes?: number;
  /** When persona has `dailyRhythmVariants`, pick by weight (default) or first. */
  rhythmVariantPick?: 'weighted' | 'first';
};

export const DEFAULT_PCM_INSTANCE_TRAIT_PICK_COUNT = 3;

export const DEFAULT_PCM_INSTANCE_VARIATION: PcmInstanceVariationPolicy = {
  specVersion: '1.0',
  traitPickCount: DEFAULT_PCM_INSTANCE_TRAIT_PICK_COUNT,
  includeMindset: true,
  includeVoiceLine: true,
  includeDemographics: true,
  includeDailyRhythm: true,
};
