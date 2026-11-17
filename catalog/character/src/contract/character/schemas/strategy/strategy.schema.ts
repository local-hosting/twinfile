import { z } from 'zod';

import { StrategyHoneycombFacetsSchema } from '../strategy/honeycomb.schema.js';

export const StrategyEntityLifecycleSchema = z.enum(['proposed', 'validated', 'deprecated']);

export const ProductObjectiveKeyResultSchema = z.object({
  id: z.string().min(1).optional(),
  text: z.string().min(1),
  metricId: z.string().min(1).optional(),
  baseline: z.number().optional(),
  target: z.union([z.number(), z.string().min(1)]),
});

export const ProductObjectiveSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  lifecycle: StrategyEntityLifecycleSchema.optional(),
  revisedAt: z.string().min(1).optional(),
  facets: StrategyHoneycombFacetsSchema.optional(),
  period: z.string().min(1).optional(),
  keyResults: z.array(ProductObjectiveKeyResultSchema).optional(),
});

export function parseProductObjective(input: unknown) {
  return ProductObjectiveSchema.parse(input);
}
