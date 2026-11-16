import type { CharacterAudienceAspectRef, CharacterAudienceAspectSource } from './audience-aspect-ref.js';

/**
 * One audience plane on a Character twin — **demographic** and **psychographic** use the same shape
 * so weighting, scale (multi-aspect), and catalog diversity stay symmetrical.
 */
export type CharacterAudiencePlane = {
  /** Row id in org demographic or psychographic catalog (not raw PII). */
  profileId?: string;
  /** Catalog row label when it differs from the character label. */
  label?: string;
  /** Optional cohort / bucket id in the same catalog. */
  cohortId?: string;
  /** Framework typings (MBTI, VALS, age band, income tier, …) — many per plane. */
  aspects: CharacterAudienceAspectRef[];
  /** Research attribute table as published on the catalog profile (shares, geo audience, …). */
  attributes?: Record<string, unknown>;
  /** Plane-level provenance when aspects omit their own `source`. */
  source?: CharacterAudienceAspectSource;
};
