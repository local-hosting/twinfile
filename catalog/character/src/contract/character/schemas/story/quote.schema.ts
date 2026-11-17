import { z } from 'zod';

import { coercePlainStringList } from '../coerce-plain-string-list.js';
import { coalesceJobIdsFields } from '../coalesce-job-ids.js';
import { StrategyEntityLifecycleSchema } from '../strategy/strategy.schema.js';

const TagListSchema = z.preprocess(coercePlainStringList, z.array(z.string().min(1)));

export const ResearchQuoteSchema = z.preprocess(
  (raw) =>
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? coalesceJobIdsFields(raw as Record<string, unknown>)
      : raw,
  z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    personaId: z.string().min(1),
    jobIds: TagListSchema.optional(),
    journeyId: z.string().min(1).optional(),
    phaseId: z.string().min(1).optional(),
    momentId: z.string().min(1).optional(),
    context: TagListSchema.optional(),
    emotion: TagListSchema.optional(),
    painpoint: z.string().min(1).optional(),
    aspiration: z.string().min(1).optional(),
    goal: z.string().min(1).optional(),
    situation: z.string().min(1).optional(),
    jtbdContext: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
    lifecycle: StrategyEntityLifecycleSchema.optional(),
  }),
);

export function parseResearchQuote(input: unknown) {
  return ResearchQuoteSchema.parse(input);
}
