import { z } from 'zod';

import { RESEARCH_SIGNAL_CATEGORIES } from '../../types/story/research-signal.js';
import { StrategyEntityLifecycleSchema } from '../strategy/strategy.schema.js';

export const SignalDimensionSchema = z.object({
  id: z.string().min(1),
  category: z.enum(RESEARCH_SIGNAL_CATEGORIES),
  label: z.string().min(1),
  unit: z.enum(['percent', 'ratio']),
  group: z.string().min(1).optional(),
  lowLabel: z.string().min(1).optional(),
  highLabel: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  recordedAt: z.string().min(1).optional(),
  lifecycle: StrategyEntityLifecycleSchema.optional(),
});
