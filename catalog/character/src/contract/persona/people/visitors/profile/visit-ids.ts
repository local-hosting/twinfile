import { z } from 'zod';

/** Trade-area population — residents live nearby; visitors and pass-by are transient. */
export const PopulationKindSchema = z.enum(['visitor', 'resident', 'pass_by']);

/**
 * Whether the visit is experienced in the physical world, virtually, or both.
 * Blended covers hybrid journeys such as in-store + virtual try-on or stadium + stream.
 */
export const VisitPresenceLocusSchema = z.enum(['physical', 'virtual', 'blended']);

/**
 * Channel or surface used to access the visit — a blended visitor may activate several.
 * Aligns with journey touchpoint modalities without importing that domain.
 */
export const VisitAccessModalitySchema = z.enum([
  'physical_space',
  'web',
  'mobile',
  'vr',
  'ar',
  'stream',
  'kiosk',
  'broadcast',
]);

/**
 * Venue context for visitor classification — store, stadium, hospital, virtual expo, etc.
 * Consumer presets may extend with additional archetype ids in catalog overlays.
 */
export const VisitVenueArchetypeIdSchema = z.enum([
  'retail',
  'mall',
  'hospital',
  'sports_stadium',
  'virtual_expo',
  'mobility_hub',
  'venue_owner',
]);

/** High-level visit arc — before, during, and after the on-site experience. */
export const VisitPhaseIdSchema = z.enum(['pre_visit', 'on_site', 'post_visit']);

/**
 * Venue journey stage — where the person is in the on-site experience.
 * Presets may extend with venue-specific stages beyond this core set.
 */
export const VisitorJourneyStageIdSchema = z.enum([
  'pre_visit',
  'arrival',
  'navigation',
  'on_site',
  'concessions',
  'live_experience',
  'egress',
  'post_visit',
]);

/** Self-directed intent during a visit — aligns with touchpoint visitor intents. */
export const VisitIntentIdSchema = z.enum([
  'learn',
  'purchase',
  'upgrade',
  'setup',
  'fix',
  'switch',
  'rejoin',
  'downgrade',
  'cancel',
]);

export type PopulationKind = z.infer<typeof PopulationKindSchema>;
export type VisitPresenceLocus = z.infer<typeof VisitPresenceLocusSchema>;
export type VisitAccessModality = z.infer<typeof VisitAccessModalitySchema>;
export type VisitVenueArchetypeId = z.infer<typeof VisitVenueArchetypeIdSchema>;
export type VisitPhaseId = z.infer<typeof VisitPhaseIdSchema>;
export type VisitorJourneyStageId = z.infer<typeof VisitorJourneyStageIdSchema>;
export type VisitIntentId = z.infer<typeof VisitIntentIdSchema>;
