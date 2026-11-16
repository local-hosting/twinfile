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

/**
 * Dramaturgy / performance sheet for scene play — distinct from JTBD `goals` /
 * `frustrations` and from empathy think/feel/say/do content.
 * Poster-rail tags stay on {@link CharacterPersona.traits}.
 */
export type CharacterPersonalityDelivery = {
  /** Cadence and speech habits (e.g. "Near a whisper", "No contractions"). */
  patterns?: string[];
  /** Sample dialogue snippets. */
  lines?: string[];
};

export type CharacterPersonality = {
  /** Core want (poster card) — not a JTBD goal list. */
  wants?: string;
  fears?: string;
  flaw?: string;
  delivery?: CharacterPersonalityDelivery;
  /** Physicality / body language cues. */
  movement?: string[];
  /** Internal nature tags (alongside {@link CharacterPersona.traits}). */
  temperament?: string[];
  moods?: string[];
  /** Recurring behavioral beats. */
  signatureMoves?: string[];
};

/** Character slice of {@link Persona} — no product-level grouping fields. */
export type CharacterPersona = Omit<Persona, 'primary' | 'share' | 'exemplar' | 'empathy'> & {
  segment?: string;
  exemplar?: CharacterExemplar;
  empathy?: CharacterEmpathy;
  /** Scene performance sheet (wants, fears, delivery, movement, moods, …). */
  personality?: CharacterPersonality;
  /** Statistical / paper profile bindings (catalog ids + framework aspects). */
  demographic?: CharacterAudiencePlane;
  /** Personality / attitude bindings — same plane shape as {@link CharacterPersona.demographic}. */
  psychographic?: CharacterAudiencePlane;
};
