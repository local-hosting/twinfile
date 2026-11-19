import { z } from 'zod';
import {
  FocusAreaDefinitionSchema,
  FocusAreaTierSchema,
} from '../customer/profile/customer.js';

const FocusAreaEntrySchema = FocusAreaDefinitionSchema.omit({ tier: true }).extend({
  tier: FocusAreaTierSchema.optional(),
});

export const GroupedFocusAreasSchema = z.object({
  primary: z.array(FocusAreaEntrySchema).default([]),
  secondary: z.array(FocusAreaEntrySchema).default([]),
});

export const FocusAreaCatalogSourceSchema = z.object({
  specVersion: z.literal('1.0').default('1.0'),
  methodId: z.string().min(1).optional(),
  focusAreas: z.union([z.array(FocusAreaDefinitionSchema), GroupedFocusAreasSchema]),
  extensions: z
    .record(z.string(), GroupedFocusAreasSchema)
    .optional()
    .describe('Vertical focus-area leaves keyed by audience archetype preset id.'),
});

export type FocusAreaCatalogSource = z.infer<typeof FocusAreaCatalogSourceSchema>;
export type GroupedFocusAreas = z.infer<typeof GroupedFocusAreasSchema>;
