import { z } from 'zod';

import { RESEARCH_SIGNAL_CATEGORIES } from '../../types/story/research-signal.js';
import { StrategyEntityLifecycleSchema } from '../strategy/strategy.schema.js';

const UNIT_MAX = { percent: 100, ratio: 1 } as const;

export const ResearchSignalSchema = z
  .object({
    id: z.string().min(1),
    characterId: z.string().min(1),
    category: z.enum(RESEARCH_SIGNAL_CATEGORIES),
    label: z.string().min(1),
    value: z.number().min(0),
    unit: z.enum(['percent', 'ratio']),
    group: z.string().min(1).optional(),
    lowLabel: z.string().min(1).optional(),
    highLabel: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
    recordedAt: z.string().min(1).optional(),
    lifecycle: StrategyEntityLifecycleSchema.optional(),
  })
  .superRefine((signal, ctx) => {
    if (signal.value > UNIT_MAX[signal.unit]) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: `${signal.unit} value must be ≤ ${UNIT_MAX[signal.unit]}`,
      });
    }
  });
