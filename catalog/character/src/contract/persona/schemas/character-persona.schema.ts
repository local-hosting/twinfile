import { z } from 'zod';

import { coalesceJobIdsFields } from './coalesce-job-ids.js';
import { CharacterAudiencePlaneSchema } from './audience/character-audience-plane.schema.js';
import { PersonaEmpathyMapSchema, PersonaExemplarSchema, PersonaFieldsSchema } from './strategy/persona.schema.js';
import { SegmentEmpathyFacetSchema } from '../empathy/feel/empathy.schema.js';
import { PersonaProfileSchema } from '../people/audience/persona.schema.js';

/** Exemplar person plus the catalog fields that publish it as a persona profile. */
const CharacterExemplarSchema = PersonaExemplarSchema.extend({
  id: z.string().min(1).optional(),
  quote: z.string().min(1).optional(),
}).merge(
  PersonaProfileSchema.pick({
    painPointIds: true,
    interestIds: true,
    preferences: true,
    attitude: true,
  }).partial(),
);

/** Exemplar think/feel/say/do plus segment-level feelings and journey-phase voice. */
const CharacterEmpathySchema = PersonaEmpathyMapSchema.merge(
  SegmentEmpathyFacetSchema.shape.empathy.omit({ segment: true }),
);

export const CharacterPersonalityDeliverySchema = z.object({
  patterns: z.array(z.string().min(1)).optional(),
  lines: z.array(z.string().min(1)).optional(),
});

/** Dramaturgy sheet — wants/fears/flaw plus delivery, movement, temperament, moods. */
export const CharacterPersonalitySchema = z.object({
  wants: z.string().min(1).optional(),
  fears: z.string().min(1).optional(),
  flaw: z.string().min(1).optional(),
  delivery: CharacterPersonalityDeliverySchema.optional(),
  movement: z.array(z.string().min(1)).optional(),
  temperament: z.array(z.string().min(1)).optional(),
  moods: z.array(z.string().min(1)).optional(),
  signatureMoves: z.array(z.string().min(1)).optional(),
});

/**
 * One character — no fields that only make sense when multiple personas share a product AXM.
 * Cohort membership, population share, and “primary” persona live on AXM / org base cohorts.
 */
const CharacterPersonaFieldsSchema = PersonaFieldsSchema.omit({
  primary: true,
  share: true,
}).extend({
  /** Optional research archetype label for this character alone — not an AXM cohort id. */
  segment: z.string().min(1).optional(),
  exemplar: CharacterExemplarSchema.optional(),
  empathy: CharacterEmpathySchema.optional(),
  personality: CharacterPersonalitySchema.optional(),
  demographic: CharacterAudiencePlaneSchema.optional(),
  psychographic: CharacterAudiencePlaneSchema.optional(),
});

export const CharacterPersonaSchema = z.preprocess(
  (raw) =>
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? coalesceJobIdsFields(raw as Record<string, unknown>)
      : raw,
  CharacterPersonaFieldsSchema,
);

/** Cohort-only fields — strip before Character parse; persona attributes stay on the twin. */
export const CHARACTER_GROUP_FIELD_KEYS = ['primary', 'share'] as const;
