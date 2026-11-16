import type { PsychographicSegmentProfile } from '../people/customer/profile/customer.js';

type SegmentFacet<K extends keyof PsychographicSegmentProfile> = NonNullable<PsychographicSegmentProfile[K]>;

/** Acquisition / retention playbook plus scenario titles (`strategy.yml`). */
export type CharacterSegmentStrategy = NonNullable<SegmentFacet<'strategy'>['strategy']> & {
  scenarios?: SegmentFacet<'strategy'>['scenarios'];
};

/**
 * Psychographic segment research carried by one Character twin.
 * Single-file slots live beside `character.yml`; `mentalModelScope` and `objectives`
 * are compact rows inside `mental-models/` and `journeys/`.
 */
export type CharacterSegmentFacets = {
  overview?: SegmentFacet<'overview'>;
  visitFrequency?: SegmentFacet<'visitFrequency'>;
  emotions?: SegmentFacet<'emotions'>['emotions'];
  behavior?: SegmentFacet<'behavior'>['behavior'];
  services?: SegmentFacet<'services'>['services'];
  strategy?: CharacterSegmentStrategy;
  /** Thinking-style scopes by focus, level, and objective (`mental-models/scope.yml`). */
  mentalModelScope?: SegmentFacet<'mentalModel'>['mentalModel'];
  /** Intent objectives with touchpoint sequences (`journeys/objectives.yml`). */
  objectives?: PsychographicSegmentProfile['objectives'];
};
