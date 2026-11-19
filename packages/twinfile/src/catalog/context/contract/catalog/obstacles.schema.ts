import { z } from 'zod';
import { HeartDimensionIdSchema } from '../schemas/heart-dimension-id.schema.js';

/**
 * Friction that blocks progress on a JTBD job — the complement of the job's desired outcome.
 * Obstacles are removable by the organization; completing the job is what the customer wants.
 */
export const CustomerObstacleDefinitionSchema = z
  .object({
    id: z.string().min(1).describe('Stable obstacle identifier.'),
    label: z.string().min(1).describe('Short friction label.'),
    description: z.string().min(1).optional().describe('Optional detail on how this blocks progress.'),
    jobId: z
      .string()
      .min(1)
      .describe('Job whose progress this obstacle blocks.'),
    removable: z
      .boolean()
      .default(true)
      .describe('Whether the organization can design away this friction.'),
    heartDimensionId: HeartDimensionIdSchema.optional().describe(
      'HEART dimension this friction degrades most directly.',
    ),
  })
  .describe('Removable friction blocking a customer job-to-be-done.');

export const ObstacleCatalogSchema = z
  .object({
    specVersion: z.literal('1.0').default('1.0').describe('Obstacle catalog format version.'),
    methodId: z
      .string()
      .min(1)
      .optional()
      .describe('Method id when the catalog is method-scoped.'),
    obstacles: z
      .array(CustomerObstacleDefinitionSchema)
      .default([])
      .describe('Canonical obstacles linked to JTBD jobs.'),
  })
  .describe('Catalog of job-blocking obstacles separate from progress stories.');

export type CustomerObstacleDefinition = z.infer<typeof CustomerObstacleDefinitionSchema>;
export type ObstacleCatalog = z.infer<typeof ObstacleCatalogSchema>;
