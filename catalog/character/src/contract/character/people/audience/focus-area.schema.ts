import { z } from 'zod';
import { FocusAreaDefinitionSchema } from '../customer/profile/customer.js';

export const FocusAreaCatalogSchema = z
  .object({
    specVersion: z.literal('1.0').default('1.0'),
    methodId: z.string().min(1).optional(),
    focusAreas: z.array(FocusAreaDefinitionSchema).min(1),
  })
  .describe('Canonical customer focus areas — attention lenses for mental-model slices.');

export type FocusAreaCatalog = z.infer<typeof FocusAreaCatalogSchema>;
