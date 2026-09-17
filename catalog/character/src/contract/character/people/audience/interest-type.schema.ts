import { z } from 'zod';
import { OpaqueCatalogIdSchema } from '../../catalog/opaque-id.schema.js';

/**
 * Top-level interest families — venue-agnostic groupings for persona rollups and intent routing.
 * Consumer presets add leaf terms under these roots.
 */
export const InterestRootCategorySchema = z.enum([
  'arts_culture',
  'design_built_environment',
  'science_technology',
  'nature_environment',
  'society_civics',
  'economy_work',
  'food_lifestyle',
  'knowledge_media',
]);

export const InterestTypeDefinitionSchema = z.object({
  id: OpaqueCatalogIdSchema,
  label: z.string().min(1),
  /** Human-readable alias for content-keyword attributes and consumer lookups. */
  slug: z.string().min(1).optional(),
  parentId: OpaqueCatalogIdSchema.optional(),
  redirectId: OpaqueCatalogIdSchema.optional(),
  siblingIds: z.array(OpaqueCatalogIdSchema).default([]),
  rootCategory: InterestRootCategorySchema.optional(),
  /** Cross-cutting tags for persona clustering — not expo theme tracks. */
  themes: z.array(z.string().min(1)).default([]),
  /** Weight persona sampling toward commonly useful exemplar interests. */
  featured: z.boolean().optional(),
  description: z.string().min(1).optional(),
});

export const InterestTypeCatalogSchema = z
  .object({
    specVersion: z.literal('1.0').default('1.0'),
    methodId: z.string().min(1).optional(),
    types: z.array(InterestTypeDefinitionSchema).min(1),
  })
  .describe(
    'Hierarchical catalog of audience interests — consumer presets supply domain-specific leaves.',
  );

export type InterestRootCategory = z.infer<typeof InterestRootCategorySchema>;
export type InterestTypeDefinition = z.infer<typeof InterestTypeDefinitionSchema>;
export type InterestTypeCatalog = z.infer<typeof InterestTypeCatalogSchema>;
