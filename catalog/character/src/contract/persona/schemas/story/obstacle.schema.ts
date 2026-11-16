import { z } from 'zod';

import { coalesceJobIdsFields } from '../coalesce-job-ids.js';
import { HeartDimensionSchema, HeartImpactSchema } from '../story/heart.schema.js';
import { StrategyEntityLifecycleSchema } from '../strategy/strategy.schema.js';

export const ObstacleSchema = z.preprocess(
  (raw) =>
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? coalesceJobIdsFields(raw as Record<string, unknown>)
      : raw,
  z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    jobIds: z.array(z.string().min(1)).optional(),
    removable: z.boolean().optional(),
    severity: z.enum(['mild', 'serious', 'severe', 'systemic']).optional(),
    heart: HeartDimensionSchema.optional(),
    lifecycle: StrategyEntityLifecycleSchema.optional(),
  }),
);

export const JourneyObstacleEncounterSchema = z.object({
  obstacleId: z.string().min(1),
  outcome: z.enum(['overcome', 'workaround', 'blocked', 'abandoned']),
  overcomeWith: z.array(z.string().min(1)).optional(),
  heartImpacts: z.array(HeartImpactSchema).optional(),
});
