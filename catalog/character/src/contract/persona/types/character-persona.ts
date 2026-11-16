import type { CharacterAudiencePlane } from './audience/character-audience-plane.js';
import type { Persona, PersonaEmpathyMap, PersonaExemplar } from './strategy/persona.js';
import type { PersonaProfile } from '../people/audience/persona.schema.js';
import type { SegmentEmpathyFacet } from '../empathy/feel/empathy.schema.js';

/** Exemplar person plus the catalog fields that publish it as a persona profile. */
export type CharacterExemplar = PersonaExemplar & {
  /** Persona catalog id (e.g. `aaron-chen`). */
  id?: string;
  /** Exemplar voice when it differs from the character quote. */
  quote?: string;
} & Partial<Pick<PersonaProfile, 'painPointIds' | 'interestIds' | 'preferences' | 'attitude'>>;

/** Exemplar think/feel/say/do plus segment-level feelings and journey-phase voice. */
export type CharacterEmpathy = PersonaEmpathyMap & Omit<SegmentEmpathyFacet['empathy'], 'segment'>;

/** Character slice of {@link Persona} — no product-level grouping fields. */
export type CharacterPersona = Omit<Persona, 'primary' | 'share' | 'exemplar' | 'empathy'> & {
  segment?: string;
  exemplar?: CharacterExemplar;
  empathy?: CharacterEmpathy;
  /** Statistical / paper profile bindings (catalog ids + framework aspects). */
  demographic?: CharacterAudiencePlane;
  /** Personality / attitude bindings — same plane shape as {@link CharacterPersona.demographic}. */
  psychographic?: CharacterAudiencePlane;
};
