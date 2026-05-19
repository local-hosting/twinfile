/** How an aspect binding was sourced — symmetric for demographic and psychographic planes. */
export type PcmAudienceAspectSource = 'declared' | 'inferred' | 'modeled' | 'sampled';

/**
 * One typed label from a framework catalog (Myers–Briggs, income band, ethnicity taxonomy, …).
 * `frameworkId` + `typeId` are open so hosts can add catalogs without a PCMSpec bump.
 */
export type PcmAudienceAspectRef = {
  frameworkId: string;
  typeId: string;
  label?: string;
  /** Relative weight when multiple aspects apply on the same plane (0…1). */
  weight?: number;
  source?: PcmAudienceAspectSource;
};
