import type { PcmAudiencePlane } from './audience/pcm-audience-plane.js';
import type { Persona, PersonaEmpathyMap, PersonaExemplar } from './strategy/persona.js';
import type { PersonaProfile } from '../people/audience/persona.schema.js';
import type { SegmentEmpathyFacet } from '../empathy/feel/empathy.schema.js';

/** Exemplar person plus the catalog fields that publish it as a persona profile. */
export type PCMExemplar = PersonaExemplar & {
  /** Persona catalog id (e.g. `aaron-chen`). */
  id?: string;
  /** Exemplar voice when it differs from the character quote. */
  quote?: string;
} & Partial<Pick<PersonaProfile, 'painPointIds' | 'interestIds' | 'preferences' | 'attitude'>>;

/** Exemplar think/feel/say/do plus segment-level feelings and journey-phase voice. */
export type PCMEmpathy = PersonaEmpathyMap & Omit<SegmentEmpathyFacet['empathy'], 'segment'>;

/** Character slice of {@link Persona} — no product-level grouping fields. */
export type PCMCharacter = Omit<Persona, 'primary' | 'share' | 'exemplar' | 'empathy'> & {
  segment?: string;
  exemplar?: PCMExemplar;
  empathy?: PCMEmpathy;
  /** Statistical / paper profile bindings (catalog ids + framework aspects). */
  demographic?: PcmAudiencePlane;
  /** Personality / attitude bindings — same plane shape as {@link PCMCharacter.demographic}. */
  psychographic?: PcmAudiencePlane;
};
