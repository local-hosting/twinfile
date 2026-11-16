import { z } from 'zod';

import { coalesceJobIdsFields } from './coalesce-job-ids.js';
import { PcmAudiencePlaneSchema } from './audience/pcm-audience-plane.schema.js';
import { PersonaEmpathyMapSchema, PersonaExemplarSchema, PersonaFieldsSchema } from './strategy/persona.schema.js';
import { SegmentEmpathyFacetSchema } from '../empathy/feel/empathy.schema.js';
import { PersonaProfileSchema } from '../people/audience/persona.schema.js';

/** Exemplar person plus the catalog fields that publish it as a persona profile. */
const PCMExemplarSchema = PersonaExemplarSchema.extend({
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
const PCMEmpathySchema = PersonaEmpathyMapSchema.merge(
  SegmentEmpathyFacetSchema.shape.empathy.omit({ segment: true }),
);

/**
 * One character — no fields that only make sense when multiple personas share a product AXM.
 * Cohort membership, population share, and “primary” persona live on AXM / org base cohorts.
 */
const PCMCharacterFieldsSchema = PersonaFieldsSchema.omit({
  primary: true,
  share: true,
}).extend({
  /** Optional research archetype label for this character alone — not an AXM cohort id. */
  segment: z.string().min(1).optional(),
  exemplar: PCMExemplarSchema.optional(),
  empathy: PCMEmpathySchema.optional(),
  demographic: PcmAudiencePlaneSchema.optional(),
  psychographic: PcmAudiencePlaneSchema.optional(),
});

export const PCMCharacterSchema = z.preprocess(
  (raw) =>
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? coalesceJobIdsFields(raw as Record<string, unknown>)
      : raw,
  PCMCharacterFieldsSchema,
);

/** Cohort-only fields — strip before PCM parse; persona attributes stay on the twin. */
export const PCM_GROUP_FIELD_KEYS = ['primary', 'share'] as const;
