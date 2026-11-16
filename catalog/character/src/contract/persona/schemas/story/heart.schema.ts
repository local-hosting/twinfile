import { z } from 'zod';

import { HEART_DIMENSIONS } from '../../types/story/heart.js';

export const HeartDimensionSchema = z.enum(HEART_DIMENSIONS);

export const HeartImpactSchema = z.object({
  dimension: HeartDimensionSchema,
  delta: z.number().min(-1).max(1),
  metricId: z.string().min(1).optional(),
});

const heartValue = z.number().min(0).max(1).optional();

export const HeartBaselineSchema = z
  .object({
    happiness: heartValue,
    engagement: heartValue,
    adoption: heartValue,
    retention: heartValue,
    'task-success': heartValue,
  })
  .strict();
