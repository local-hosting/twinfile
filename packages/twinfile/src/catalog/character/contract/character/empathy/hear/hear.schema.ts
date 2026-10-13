import { z } from 'zod';
import { EmpathyJourneyPhaseIdSchema, PsychographicSegmentIdSchema } from '../../people/customer/profile/customer-ids.js';

/** Social and second-hand signals the customer picks up at a moment or phase. */
export const SituationalHearSetSchema = z.object({
  others: z.array(z.string().min(1)).default([]),
  friends: z.array(z.string().min(1)).default([]),
  colleagues: z.array(z.string().min(1)).default([]),
  secondHand: z.array(z.string().min(1)).default([]),
});

export const HearPhaseMapSchema = z.partialRecord(EmpathyJourneyPhaseIdSchema, SituationalHearSetSchema);

export const SegmentHearFacetSchema = z.object({
  hear: z.object({
    segment: PsychographicSegmentIdSchema.optional(),
    baseline: SituationalHearSetSchema.optional(),
    phases: z
      .object({
        sales: HearPhaseMapSchema.optional(),
        service: HearPhaseMapSchema.optional(),
      })
      .optional(),
  }),
});

export type SituationalHearSet = z.infer<typeof SituationalHearSetSchema>;
export type HearPhaseMap = z.infer<typeof HearPhaseMapSchema>;
export type SegmentHearFacet = z.infer<typeof SegmentHearFacetSchema>;
