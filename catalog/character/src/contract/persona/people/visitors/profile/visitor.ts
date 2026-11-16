import { z } from 'zod';
import { VisitorAspectRefsSchema } from '../graph/visitor-aspect-refs.js';

export {
  PopulationKindSchema,
  VisitAccessModalitySchema,
  VisitPhaseIdSchema,
  VisitPresenceLocusSchema,
  VisitVenueArchetypeIdSchema,
  VisitorJourneyStageIdSchema,
  VisitIntentIdSchema,
} from './visit-ids.js';
export type {
  PopulationKind,
  VisitAccessModality,
  VisitPhaseId,
  VisitPresenceLocus,
  VisitVenueArchetypeId,
  VisitorJourneyStageId,
  VisitIntentId,
} from './visit-ids.js';

/** Abstract root and concrete population types at a place. */
export const VisitorTypeIdSchema = z.enum(['person', 'visitor', 'resident', 'pass_by']);

/**
 * Runtime visitor — identity and visit state live in aspect refs.
 * Journey position and population kind live in aspectRefs.visit.
 */
export const VisitorSchema = z.object({
  aspectRefs: VisitorAspectRefsSchema.optional(),
});

export type VisitorTypeId = z.infer<typeof VisitorTypeIdSchema>;
export type Visitor = z.infer<typeof VisitorSchema>;
