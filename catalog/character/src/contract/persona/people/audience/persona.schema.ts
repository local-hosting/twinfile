import { z } from 'zod';
import { PsychographicSegmentIdSchema } from '../customer/profile/customer-ids.js';
import {
  SegmentPersonaAttitudeSchema,
  SegmentPersonaPreferencesSchema,
} from '../customer/profile/segment-facets.js';
import { PersonaEmpathyMapSchema } from '../../empathy/think/situational-thought.schema.js';

/** Segment membership for a catalog persona — supports multi-segment affinity. */
export const PersonaSegmentAffinitySchema = z.object({
  segmentId: PsychographicSegmentIdSchema,
  weight: z.number().min(0).max(1).optional(),
});

/**
 * Catalog persona — an exemplar user instance for storytelling and validation.
 * Catalog identity for a User — attach relationship and other aspects when materializing scenarios.
 */
export const PersonaProfileSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  age: z.number().int().positive().optional(),
  occupation: z.string().min(1).optional(),
  householdSize: z.number().int().positive().optional(),
  location: z.string().min(1).optional(),
  background: z.string().min(1).optional(),
  quote: z.string().min(1).optional(),
  /** Persona-specific pain narratives. */
  painPoints: z.array(z.string().min(1)).default([]),
  /** Catalog pain point ids salient for this persona. */
  painPointIds: z.array(z.string().min(1)).default([]),
  /** Catalog obstacle ids blocking this persona's priority jobs. */
  obstacleIds: z.array(z.string().min(1)).default([]),
  preferences: SegmentPersonaPreferencesSchema.optional(),
  attitude: SegmentPersonaAttitudeSchema.optional(),
  segmentAffinities: z.array(PersonaSegmentAffinitySchema).default([]),
  priorityJobIds: z
    .array(z.string().min(1))
    .optional()
    .describe('JTBD job ids explicitly prioritized for this persona beyond segment affinity.'),
  interestIds: z
    .array(z.string().min(1))
    .default([])
    .describe('Canonical interest type ids from InterestTypeCatalog — drives personalization and content-keyword tags.'),
  /** THINK · FEEL · SAY · DO empathy map for this exemplar persona. */
  empathy: PersonaEmpathyMapSchema.optional(),
});

export const PersonaCatalogSchema = z.object({
  specVersion: z.literal('1.0').default('1.0'),
  methodId: z.string().min(1).optional(),
  personas: z.array(PersonaProfileSchema).default([]),
});

export type PersonaSegmentAffinity = z.infer<typeof PersonaSegmentAffinitySchema>;
export type PersonaProfile = z.infer<typeof PersonaProfileSchema>;
export type PersonaCatalog = z.infer<typeof PersonaCatalogSchema>;
