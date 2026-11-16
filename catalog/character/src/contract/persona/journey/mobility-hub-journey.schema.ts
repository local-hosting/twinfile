import { z } from 'zod';
import { ArchetypePresetIdSchema } from '../people/audience/archetype-preset.schema.js';

export const MobilityHubVisitPhaseIdSchema = z.enum(['pre_visit', 'on_site', 'post_visit']);

export const MobilityHubJourneyStageSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  visitPhaseId: MobilityHubVisitPhaseIdSchema,
  visitorJourneyStageIds: z.array(z.string().min(1)).default([]),
  empathyPhaseIds: z.array(z.string().min(1)).default([]),
});

export const MobilityHubJourneyZoneSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  stageId: z.string().min(1),
  subModeId: z.string().min(1),
  description: z.string().min(1).optional(),
  focusAreaIds: z.array(z.string().min(1)).default([]),
});

export const MobilityHubJourneyCatalogSchema = z.object({
  specVersion: z.literal('1.0').default('1.0'),
  methodId: z.string().min(1),
  presetId: ArchetypePresetIdSchema,
  stages: z.array(MobilityHubJourneyStageSchema).min(1),
  zones: z.array(MobilityHubJourneyZoneSchema).min(1),
});

export type MobilityHubVisitPhaseId = z.infer<typeof MobilityHubVisitPhaseIdSchema>;
export type MobilityHubJourneyStage = z.infer<typeof MobilityHubJourneyStageSchema>;
export type MobilityHubJourneyZone = z.infer<typeof MobilityHubJourneyZoneSchema>;
export type MobilityHubJourneyCatalog = z.infer<typeof MobilityHubJourneyCatalogSchema>;
