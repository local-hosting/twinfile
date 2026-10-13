import { z } from 'zod';
import { EmpathyJourneyPhaseIdSchema, PsychographicSegmentIdSchema } from '../../people/customer/profile/customer-ids.js';

/** What the customer notices in their immediate surroundings at a moment or phase. */
export const SituationalSeeSetSchema = z.object({
  environment: z.array(z.string().min(1)).default([]),
  othersObserved: z.array(z.string().min(1)).default([]),
  materials: z.array(z.string().min(1)).default([]),
});

export const SeePhaseMapSchema = z.partialRecord(EmpathyJourneyPhaseIdSchema, SituationalSeeSetSchema);

export const SegmentSeeFacetSchema = z.object({
  see: z.object({
    segment: PsychographicSegmentIdSchema.optional(),
    baseline: SituationalSeeSetSchema.optional(),
    phases: z
      .object({
        sales: SeePhaseMapSchema.optional(),
        service: SeePhaseMapSchema.optional(),
      })
      .optional(),
  }),
});

export type SituationalSeeSet = z.infer<typeof SituationalSeeSetSchema>;
export type SeePhaseMap = z.infer<typeof SeePhaseMapSchema>;
export type SegmentSeeFacet = z.infer<typeof SegmentSeeFacetSchema>;
