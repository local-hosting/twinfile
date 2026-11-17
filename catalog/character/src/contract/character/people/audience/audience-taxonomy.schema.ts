import { z } from 'zod';
import { PsychographicSegmentIdSchema } from '../customer/profile/customer-ids.js';
import type { UserAspectId } from './method-aspect-refs.js';

/**
 * Canonical audience concepts — maps real-world marketing language to spec entities.
 *
 * Archetype is the primary strategic audience type (mindset, journey, persona).
 * Psychographic is stable personality typing (e.g. Myers-Briggs).
 * Demographic cohort groups statistical profiles; it is not interchangeable with segment.
 * Temporal cohort tracks groups that share a start event or time window (analytics).
 * Venue group is an org/fleet grouping — not a user audience concept in spec.
 */
export const AudienceConceptKindSchema = z.enum([
  'psychographic',
  'archetype',
  'demographic_profile',
  'demographic_cohort',
  'temporal_cohort',
  'venue_group',
]);

export type AudienceConceptKind = z.infer<typeof AudienceConceptKindSchema>;

export interface AudienceConceptMapEntry {
  kind: AudienceConceptKind;
  label: string;
  question: string;
  specTypes: readonly string[];
  userAspectRef?: UserAspectId;
  catalogFields?: readonly string[];
  colloquialAliases?: readonly string[];
  /** When true, the concept is documented here but owned outside @doppler-group/spec. */
  external?: boolean;
}

export const AUDIENCE_CONCEPT_MAP: Record<AudienceConceptKind, AudienceConceptMapEntry> = {
  psychographic: {
    kind: 'psychographic',
    label: 'Psychographic',
    question: 'How does this person think, feel, and react — stable personality typing?',
    specTypes: ['Psychographic', 'PsychographicAspectRef', 'MbtiTypeDefinition'],
    userAspectRef: 'psychographic',
    catalogFields: ['psychographic.typeId', 'user.aspectRefs.psychographic'],
    colloquialAliases: ['personality type', 'MBTI', 'Myers-Briggs', 'INTJ'],
  },
  archetype: {
    kind: 'archetype',
    label: 'Audience archetype',
    question: 'What kind of customer is this — mindset, needs, and journey behavior?',
    specTypes: ['PsychographicSegmentProfile', 'PsychographicSegmentSummary'],
    userAspectRef: 'archetype',
    catalogFields: ['customerCatalog.psychographicSegments', 'segmentCatalog.segments'],
    colloquialAliases: ['segment', 'customer segment', 'persona segment', 'audience archetype'],
  },
  demographic_profile: {
    kind: 'demographic_profile',
    label: 'Demographic profile',
    question: 'What do they look like on paper — age, income, household, ethnicity bands?',
    specTypes: ['DemographicProfile'],
    userAspectRef: 'demographic',
    catalogFields: ['demographicCatalog.profiles'],
    colloquialAliases: ['demographic band', 'statistical profile'],
  },
  demographic_cohort: {
    kind: 'demographic_cohort',
    label: 'Demographic cohort',
    question: 'Which demographic profiles belong to the same statistical bucket?',
    specTypes: ['DemographicCohort'],
    userAspectRef: 'demographic',
    catalogFields: ['demographicCatalog.cohorts'],
    colloquialAliases: ['demographic group', 'population band'],
  },
  temporal_cohort: {
    kind: 'temporal_cohort',
    label: 'Temporal cohort',
    question: 'Who entered the same lifecycle window or shared start event?',
    specTypes: ['RelationshipAspectRef', 'LifecycleStageId', 'EngagementLevelId'],
    userAspectRef: 'relationship',
    colloquialAliases: ['signup cohort', 'vintage cohort', 'retention cohort'],
  },
  venue_group: {
    kind: 'venue_group',
    label: 'Venue group',
    question: 'Which venues or stores are grouped for rollout or analysis?',
    specTypes: [],
    userAspectRef: 'geographic',
    catalogFields: [],
    colloquialAliases: ['store cohort', 'fleet cohort', 'org cohort'],
    external: true,
  },
};

/** How strongly a touchpoint applies to a psychographic segment. */
export const TouchpointSegmentPreferenceLevelSchema = z.enum(['primary', 'uses', 'conditional', 'avoids']);

export const TouchpointSegmentPreferenceSchema = z.object({
  level: TouchpointSegmentPreferenceLevelSchema,
  notes: z.string().min(1).optional(),
});

/** Touchpoint affinity keyed by psychographic segment id — not a demographic cohort. */
export const TouchpointSegmentPreferencesSchema = z.partialRecord(
  PsychographicSegmentIdSchema,
  TouchpointSegmentPreferenceSchema,
);

export type TouchpointSegmentPreferenceLevel = z.infer<
  typeof TouchpointSegmentPreferenceLevelSchema
>;
export type TouchpointSegmentPreference = z.infer<typeof TouchpointSegmentPreferenceSchema>;
export type TouchpointSegmentPreferences = z.infer<typeof TouchpointSegmentPreferencesSchema>;

/** Segment → touchpoint affinity (inverse of touchpoint.segmentPreferences). Keys are touchpoint ids. */
export const SegmentTouchpointAffinitiesSchema = z.record(
  z.string().min(1),
  TouchpointSegmentPreferenceSchema,
);

export type SegmentTouchpointAffinities = z.infer<typeof SegmentTouchpointAffinitiesSchema>;
