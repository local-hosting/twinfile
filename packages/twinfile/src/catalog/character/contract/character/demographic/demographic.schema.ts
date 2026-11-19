import { z } from 'zod';

/** How a demographic attachment was sourced — not raw PII. */
export const DemographicSourceSchema = z.enum(['declared', 'inferred', 'modeled']);

/** Catalog row describing a demographic band or profile (ontology, not a person). */
export const DemographicProfileSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  /** Optional link to a strategic psychographic segment this profile exemplifies. */
  segmentId: z.string().min(1).optional(),
  ageBandId: z.string().min(1).optional(),
  incomeBandId: z.string().min(1).optional(),
  householdSize: z.number().int().positive().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const DemographicCohortSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  profileIds: z.array(z.string().min(1)).default([]),
  description: z.string().min(1).optional(),
});

export const DemographicCatalogSchema = z.object({
  specVersion: z.literal('1.0').default('1.0'),
  methodId: z.string().min(1).optional(),
  profiles: z.array(DemographicProfileSchema).default([]),
  cohorts: z.array(DemographicCohortSchema).default([]),
});

export type DemographicSource = z.infer<typeof DemographicSourceSchema>;
export type DemographicProfile = z.infer<typeof DemographicProfileSchema>;
export type DemographicCohort = z.infer<typeof DemographicCohortSchema>;
export type DemographicCatalog = z.infer<typeof DemographicCatalogSchema>;
