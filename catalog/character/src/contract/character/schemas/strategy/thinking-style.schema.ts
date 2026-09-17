import { z } from 'zod';

import { StrategyEntityLifecycleSchema } from '../strategy/strategy.schema.js';

export const ThinkingStyleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  mentalModelId: z.string().min(1).optional(),
  summary: z.array(z.string().min(1)).min(1),
  lifecycle: StrategyEntityLifecycleSchema.optional(),
});
