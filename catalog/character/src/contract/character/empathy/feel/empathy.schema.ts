import { z } from 'zod';
import { EmpathyJourneyPhaseIdSchema } from '../../people/customer/profile/customer-ids.js';
import { PsychographicSegmentIdSchema } from '../../people/customer/profile/customer-ids.js';
import { SituationalThoughtSetSchema } from '../think/situational-thought.schema.js';

export const EmpathyChannelSchema = z.enum(['sales', 'service']);

export const EmpathyPhaseMapSchema = z.partialRecord(
  EmpathyJourneyPhaseIdSchema,
  SituationalThoughtSetSchema,
);

export const SegmentEmpathyFacetSchema = z.object({
  empathy: z.object({
    segment: PsychographicSegmentIdSchema.optional(),
    feelings: z
      .object({
        positive: z.array(z.string().min(1)).default([]),
        negative: z.array(z.string().min(1)).default([]),
      })
      .optional(),
    phases: z
      .object({
        sales: EmpathyPhaseMapSchema.optional(),
        service: EmpathyPhaseMapSchema.optional(),
      })
      .optional(),
  }),
});

export type EmpathyChannel = z.infer<typeof EmpathyChannelSchema>;
export type SegmentEmpathyFacet = z.infer<typeof SegmentEmpathyFacetSchema>;
