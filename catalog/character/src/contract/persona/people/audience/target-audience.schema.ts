import { z } from 'zod';

/** Structured filter on a demographics / census attribute. */
export const TargetAudienceCriterionV1Schema = z.object({
  field: z.string().min(1),
  min: z.number().optional(),
  max: z.number().optional(),
  equals: z.union([z.string(), z.number(), z.boolean()]).optional(),
  contains: z.string().optional(),
  /** Relative weight when scoring (default 1). */
  weight: z.number().positive().optional(),
});

export type TargetAudienceCriterionV1 = z.infer<typeof TargetAudienceCriterionV1Schema>;

export const TargetAudienceProfileV1Schema = z.object({
  description: z.string().optional(),
  criteria: z.array(TargetAudienceCriterionV1Schema),
  /** Human-readable labels for criteria inferred from description. */
  inferredLabels: z.array(z.string().min(1)).optional(),
});

export type TargetAudienceProfileV1 = z.infer<typeof TargetAudienceProfileV1Schema>;

export const ScoredTargetAudienceCellV1Schema = z.object({
  h3Cell: z.string().min(1),
  score: z.number(),
  matchedCriteria: z.number().int().nonnegative(),
  totalCriteria: z.number().int().nonnegative(),
  highlights: z.record(z.string(), z.unknown()),
});

export type ScoredTargetAudienceCellV1 = z.infer<typeof ScoredTargetAudienceCellV1Schema>;
