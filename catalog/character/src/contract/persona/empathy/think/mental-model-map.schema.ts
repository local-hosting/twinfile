import { z } from 'zod';
import {
  VisitationGoalSchema,
  VisitationSubGoalSchema,
} from '../../journey/touchpoints.schema.js';

/** Column header in a needs matrix — reuses MdVVP Five C taxonomy. */
export const NeedBucketSchema = z.object({
  visitationGoal: VisitationGoalSchema,
  visitationSubGoal: VisitationSubGoalSchema,
  label: z.string().min(1).optional(),
});

/** One cell: a job story satisfied by a feature on a channel (touchpoint). */
export const NeedSatisfactionSchema = z.object({
  jobId: z.string().min(1).describe('Story-level job id from the JTBD catalog.'),
  touchpointId: z.string().min(1).describe('Channel or touchpoint row id.'),
  featureLabel: z
    .string()
    .min(1)
    .optional()
    .describe('Product feature label when it differs from the job label.'),
  goalEventIds: z
    .array(z.string().min(1))
    .optional()
    .describe('Instrumentation events that prove this satisfaction.'),
});

export const MentalModelMapCatalogSchema = z.object({
  specVersion: z.literal('1.0').default('1.0'),
  methodId: z.string().min(1).optional(),
  buckets: z
    .array(NeedBucketSchema)
    .optional()
    .describe('Optional column headers; derivable from story jobs when omitted.'),
  satisfactions: z
    .array(NeedSatisfactionSchema)
    .default([])
    .describe('Need × channel cells linking jobs to delivery surfaces.'),
});

export type NeedBucket = z.infer<typeof NeedBucketSchema>;
export type NeedSatisfaction = z.infer<typeof NeedSatisfactionSchema>;
export type MentalModelMapCatalog = z.infer<typeof MentalModelMapCatalogSchema>;
