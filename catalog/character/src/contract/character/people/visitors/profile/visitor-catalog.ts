import { z } from 'zod';
import {
  PopulationKindSchema,
  VisitAccessModalitySchema,
  VisitIntentIdSchema,
  VisitPhaseIdSchema,
  VisitPresenceLocusSchema,
  VisitVenueArchetypeIdSchema,
  VisitorJourneyStageIdSchema,
} from './visit-ids.js';

export const PopulationKindDefinitionSchema = z.object({
  id: PopulationKindSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
});

export const VisitPresenceLocusDefinitionSchema = z.object({
  id: VisitPresenceLocusSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  defaultAccessModalities: z.array(VisitAccessModalitySchema).default([]),
});

export const VisitAccessModalityDefinitionSchema = z.object({
  id: VisitAccessModalitySchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  presenceLocus: VisitPresenceLocusSchema.optional(),
});

export const VisitVenueArchetypeDefinitionSchema = z.object({
  id: VisitVenueArchetypeIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  defaultPresenceLocus: VisitPresenceLocusSchema.optional(),
  defaultAccessModalities: z.array(VisitAccessModalitySchema).default([]),
  defaultJourneyStageId: VisitorJourneyStageIdSchema.optional(),
});

export const VisitPhaseDefinitionSchema = z.object({
  id: VisitPhaseIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  journeyStageIds: z.array(VisitorJourneyStageIdSchema).default([]),
});

export const VisitorJourneyStageDefinitionSchema = z.object({
  id: VisitorJourneyStageIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  visitPhaseId: VisitPhaseIdSchema.optional(),
  nextStageId: VisitorJourneyStageIdSchema.optional(),
  validIntentIds: z.array(VisitIntentIdSchema).default([]),
});

export const VisitIntentDefinitionSchema = z.object({
  id: VisitIntentIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
});

export const VisitorCatalogLinksSchema = z.object({
  stageVisitPhase: z
    .partialRecord(VisitorJourneyStageIdSchema, VisitPhaseIdSchema)
    .optional(),
  populationDefaultStage: z
    .partialRecord(PopulationKindSchema, VisitorJourneyStageIdSchema)
    .optional(),
  venueDefaultPresenceLocus: z
    .partialRecord(VisitVenueArchetypeIdSchema, VisitPresenceLocusSchema)
    .optional(),
  venueDefaultAccessModalities: z
    .partialRecord(VisitVenueArchetypeIdSchema, z.array(VisitAccessModalitySchema))
    .optional(),
  venueDefaultJourneyStage: z
    .partialRecord(VisitVenueArchetypeIdSchema, VisitorJourneyStageIdSchema)
    .optional(),
  locusDefaultAccessModalities: z
    .partialRecord(VisitPresenceLocusSchema, z.array(VisitAccessModalitySchema))
    .optional(),
});

export const VisitorCatalogSchema = z.object({
  specVersion: z.literal('1.0').default('1.0'),
  methodId: z.string().min(1).optional(),
  populationKinds: z.array(PopulationKindDefinitionSchema).min(1),
  presenceLoci: z.array(VisitPresenceLocusDefinitionSchema).default([]),
  accessModalities: z.array(VisitAccessModalityDefinitionSchema).default([]),
  venueArchetypes: z.array(VisitVenueArchetypeDefinitionSchema).default([]),
  visitPhases: z.array(VisitPhaseDefinitionSchema).default([]),
  journeyStages: z.array(VisitorJourneyStageDefinitionSchema).min(1),
  visitIntents: z.array(VisitIntentDefinitionSchema).default([]),
  links: VisitorCatalogLinksSchema.optional(),
});

export type PopulationKindDefinition = z.infer<typeof PopulationKindDefinitionSchema>;
export type VisitPresenceLocusDefinition = z.infer<typeof VisitPresenceLocusDefinitionSchema>;
export type VisitAccessModalityDefinition = z.infer<typeof VisitAccessModalityDefinitionSchema>;
export type VisitVenueArchetypeDefinition = z.infer<typeof VisitVenueArchetypeDefinitionSchema>;
export type VisitPhaseDefinition = z.infer<typeof VisitPhaseDefinitionSchema>;
export type VisitorJourneyStageDefinition = z.infer<typeof VisitorJourneyStageDefinitionSchema>;
export type VisitIntentDefinition = z.infer<typeof VisitIntentDefinitionSchema>;
export type VisitorCatalogLinks = z.infer<typeof VisitorCatalogLinksSchema>;
export type VisitorCatalog = z.infer<typeof VisitorCatalogSchema>;
