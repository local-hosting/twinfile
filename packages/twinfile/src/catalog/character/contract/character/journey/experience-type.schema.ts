import { z } from 'zod';
import { OpaqueCatalogIdSchema } from '../catalog/opaque-id.schema.js';

/**
 * Top-level experience families — venue-agnostic groupings for rollups and MdVVP routing.
 * Consumer presets add leaf terms (concerts, lectures, etc.) under these roots.
 */
export const ExperienceRootCategorySchema = z.enum([
  'performance',
  'presentation',
  'programmed_experience',
  'dining',
  'broadcast',
  'visual_experience',
  'commerce',
  'gathering',
  'wellness',
  'sport',
  'learning',
  'exploration',
  'civic_program',
]);

export const ExperienceTypeDefinitionSchema = z.object({
  id: OpaqueCatalogIdSchema,
  label: z.string().min(1),
  /** Human-readable alias for content-type attributes and consumer lookups. */
  slug: z.string().min(1).optional(),
  /** Parent term in the consumer taxonomy — not necessarily a root category id. */
  parentId: OpaqueCatalogIdSchema.optional(),
  /** Canonical id when this row is an alias (Redirect column in source taxonomies). */
  redirectId: OpaqueCatalogIdSchema.optional(),
  /** Explicit root when parent chain is absent or ambiguous. */
  rootCategory: ExperienceRootCategorySchema.optional(),
  /** When true, the experience is intended for on-site delivery only. */
  physicalOnly: z.boolean().optional(),
  description: z.string().min(1).optional(),
});

export const ExperienceTypeCatalogSchema = z
  .object({
    specVersion: z.literal('1.0').default('1.0'),
    methodId: z.string().min(1).optional(),
    types: z.array(ExperienceTypeDefinitionSchema).min(1),
  })
  .describe(
    'Hierarchical catalog of experience or programming types — consumer presets supply venue-specific leaves.',
  );

export type ExperienceRootCategory = z.infer<typeof ExperienceRootCategorySchema>;
export type ExperienceTypeDefinition = z.infer<typeof ExperienceTypeDefinitionSchema>;
export type ExperienceTypeCatalog = z.infer<typeof ExperienceTypeCatalogSchema>;
