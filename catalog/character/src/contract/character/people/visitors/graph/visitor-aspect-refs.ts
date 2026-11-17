import { z } from 'zod';
import {
  BehavioralAspectRefSchema,
  DemographicAspectRefSchema,
  GeographicAspectRefSchema,
} from '../../audience/method-aspect-refs.js';
import {
  PopulationKindSchema,
  VisitAccessModalitySchema,
  VisitIntentIdSchema,
  VisitPhaseIdSchema,
  VisitPresenceLocusSchema,
  VisitVenueArchetypeIdSchema,
  VisitorJourneyStageIdSchema,
} from '../profile/visit-ids.js';

/** Visit position, population kind, presence, and active intents at a place. */
export const VisitAspectRefSchema = z.object({
  populationKind: PopulationKindSchema,
  journeyStageId: VisitorJourneyStageIdSchema,
  visitPhaseId: VisitPhaseIdSchema.optional(),
  visitLocus: VisitPresenceLocusSchema,
  accessModalities: z.array(VisitAccessModalitySchema).default([]),
  venueArchetypeId: VisitVenueArchetypeIdSchema.optional(),
  intentIds: z.array(VisitIntentIdSchema).default([]),
  source: z.enum(['declared', 'inferred', 'modeled', 'classified']).optional(),
});

export const VisitorAspectRefsSchema = z.object({
  visit: VisitAspectRefSchema.optional(),
  geographic: GeographicAspectRefSchema.optional(),
  demographic: DemographicAspectRefSchema.optional(),
  behavioral: BehavioralAspectRefSchema.optional(),
});

export const VisitorAspectIdSchema = z.enum([
  'visit',
  'geographic',
  'demographic',
  'behavioral',
]);

export type VisitAspectRef = z.infer<typeof VisitAspectRefSchema>;
export type VisitorAspectRefs = z.infer<typeof VisitorAspectRefsSchema>;
export type VisitorAspectId = z.infer<typeof VisitorAspectIdSchema>;
