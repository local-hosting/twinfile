import { z } from 'zod';

import { HeartDimensionSchema } from '../story/heart.schema.js';

export const StrategyMetricSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1).optional(),
  direction: z.enum(['up', 'down']),
  source: z.string().min(1).optional(),
  heart: HeartDimensionSchema.optional(),
  goal: z.string().min(1).optional(),
  signal: z.string().min(1).optional(),
});
