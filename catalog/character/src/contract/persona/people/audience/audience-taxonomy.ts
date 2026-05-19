import type { PsychographicSegmentCatalog } from '../customer/profile/customer.js';
import {
  AUDIENCE_CONCEPT_MAP,
  TouchpointSegmentPreferencesSchema,
  type AudienceConceptKind,
  type AudienceConceptMapEntry,
  type SegmentTouchpointAffinities,
  type TouchpointSegmentPreference,
  type TouchpointSegmentPreferences,
} from '../audience/audience-taxonomy.schema.js';
import type { UserAspectId } from './method-aspect-refs.js';

export interface AudienceTaxonomyIssue {
  code:
    | 'unknown_segment'
    | 'invalid_touchpoint_segment_preference'
    | 'cohort_preferences_deprecated';
  message: string;
  segmentId?: string;
}

export interface TouchpointAudiencePreferenceSource {
  /** Preferred — keys are psychographic segment ids. */
  segmentPreferences?: TouchpointSegmentPreferences;
  /**
   * Deprecated alias for `segmentPreferences`.
   * Keys must still be psychographic segment ids, not demographic cohort ids.
   */
  cohortPreferences?: TouchpointSegmentPreferences;
}

export function audienceConcept(
  kind: AudienceConceptKind,
): AudienceConceptMapEntry {
  return AUDIENCE_CONCEPT_MAP[kind];
}

export function audienceConceptForUserAspect(
  aspectId: UserAspectId,
): AudienceConceptMapEntry | undefined {
  return Object.values(AUDIENCE_CONCEPT_MAP).find((entry) => entry.userAspectRef === aspectId);
}

export function touchpointSegmentPreferences(
  source: TouchpointAudiencePreferenceSource,
): TouchpointSegmentPreferences | undefined {
  return source.segmentPreferences ?? source.cohortPreferences;
}

export function parseTouchpointSegmentPreferences(
  input: unknown,
): TouchpointSegmentPreferences {
  return TouchpointSegmentPreferencesSchema.parse(input);
}

export function validateTouchpointSegmentPreferences(
  preferences: TouchpointSegmentPreferences | undefined,
  segmentCatalog?: PsychographicSegmentCatalog,
): AudienceTaxonomyIssue[] {
  if (!preferences) return [];

  const issues: AudienceTaxonomyIssue[] = [];
  const knownSegmentIds = segmentCatalog
    ? new Set(segmentCatalog.segments.map((segment) => segment.id))
    : undefined;

  for (const [segmentId, preference] of Object.entries(preferences)) {
    const parsed = TouchpointSegmentPreferencesSchema.safeParse({ [segmentId]: preference });
    if (!parsed.success) {
      issues.push({
        code: 'invalid_touchpoint_segment_preference',
        segmentId,
        message: `Touchpoint segment preference for "${segmentId}" is invalid`,
      });
      continue;
    }

    if (knownSegmentIds && !knownSegmentIds.has(segmentId)) {
      issues.push({
        code: 'unknown_segment',
        segmentId,
        message: `Touchpoint preference references unknown psychographic segment "${segmentId}"`,
      });
    }
  }

  return issues;
}

export function touchpointAudiencePreferenceIssues(
  source: TouchpointAudiencePreferenceSource,
  segmentCatalog?: PsychographicSegmentCatalog,
): AudienceTaxonomyIssue[] {
  const issues = validateTouchpointSegmentPreferences(
    touchpointSegmentPreferences(source),
    segmentCatalog,
  );

  if (source.cohortPreferences && !source.segmentPreferences) {
    issues.push({
      code: 'cohort_preferences_deprecated',
      message:
        'cohortPreferences is a deprecated alias for segmentPreferences — keys are psychographic segment ids',
    });
  }

  return issues;
}

/** Legacy touchpoint YAML sometimes pluralizes segment ids — map to catalog ids. */
const TOUCHPOINT_PREFERENCE_SEGMENT_ID_ALIASES: Record<string, string> = {
  'spirited-strivers': 'spirited-striver',
  'tech-titans': 'tech-titan',
  'self-servers': 'self-server',
};

export function normalizeTouchpointPreferenceSegmentId(segmentId: string): string {
  const trimmed = segmentId.trim();
  return TOUCHPOINT_PREFERENCE_SEGMENT_ID_ALIASES[trimmed] ?? trimmed;
}

export function invertTouchpointPreferencesBySegment(
  touchpoints: readonly ({ id: string } & TouchpointAudiencePreferenceSource)[],
): Map<string, SegmentTouchpointAffinities> {
  const bySegment = new Map<string, SegmentTouchpointAffinities>();

  for (const touchpoint of touchpoints) {
    const prefs = touchpointSegmentPreferences(touchpoint);
    if (!prefs) continue;

    for (const [rawSegmentId, preference] of Object.entries(prefs)) {
      if (!preference) continue;
      const segmentId = normalizeTouchpointPreferenceSegmentId(rawSegmentId);
      const bucket = bySegment.get(segmentId) ?? {};
      bucket[touchpoint.id] = preference;
      bySegment.set(segmentId, bucket);
    }
  }

  return bySegment;
}

export function mergeTouchpointAffinitiesIntoSegmentCatalog(
  catalog: PsychographicSegmentCatalog,
  touchpoints: readonly ({ id: string } & TouchpointAudiencePreferenceSource)[],
): PsychographicSegmentCatalog {
  const bySegment = invertTouchpointPreferencesBySegment(touchpoints);

  return {
    ...catalog,
    segments: catalog.segments.map((segment) => {
      const inverted = bySegment.get(segment.id);
      if (!inverted || Object.keys(inverted).length === 0) {
        return segment;
      }
      return {
        ...segment,
        touchpointAffinities: {
          ...(segment.touchpointAffinities ?? {}),
          ...inverted,
        },
      };
    }),
  };
}

export {
  AUDIENCE_CONCEPT_MAP,
  TouchpointSegmentPreferenceLevelSchema,
  TouchpointSegmentPreferenceSchema,
  TouchpointSegmentPreferencesSchema,
  AudienceConceptKindSchema,
} from '../audience/audience-taxonomy.schema.js';
export type {
  AudienceConceptKind,
  AudienceConceptMapEntry,
  TouchpointSegmentPreferenceLevel,
  TouchpointSegmentPreference,
  TouchpointSegmentPreferences,
} from '../audience/audience-taxonomy.schema.js';
