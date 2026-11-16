import { z } from 'zod';
import { HeartDimensionIdSchema } from '../../shared/heart-dimension-id.schema.js';

/** Default accomplishment feeling for a psychographic segment when no job override exists. */
export const GoalAccomplishmentSegmentDefaultSchema = z.object({
  segmentId: z.string().min(1),
  feelLabel: z.string().min(1),
});

/** Job-scoped (and optionally segment-scoped) feeling when a JTBD goal is accomplished. */
export const GoalAccomplishmentFeelEntrySchema = z.object({
  jobId: z.string().min(1),
  segmentId: z.string().min(1).optional(),
  feelLabel: z.string().min(1),
  heartDimensionId: HeartDimensionIdSchema.optional(),
});

export const GoalAccomplishmentFeelCatalogSchema = z.object({
  specVersion: z.literal('1.0').default('1.0'),
  methodId: z.string().min(1).optional(),
  segmentDefaults: z.array(GoalAccomplishmentSegmentDefaultSchema).default([]),
  mappings: z.array(GoalAccomplishmentFeelEntrySchema).default([]),
});

export type GoalAccomplishmentSegmentDefault = z.infer<typeof GoalAccomplishmentSegmentDefaultSchema>;
export type GoalAccomplishmentFeelEntry = z.infer<typeof GoalAccomplishmentFeelEntrySchema>;
export type GoalAccomplishmentFeelCatalog = z.infer<typeof GoalAccomplishmentFeelCatalogSchema>;
