import type { DemographicCatalog } from './demographic.schema.js';

export type DemographicRelationshipIssue = {
  code: 'duplicate_profile_id' | 'duplicate_cohort_id' | 'unknown_profile' | 'unknown_segment';
  message: string;
  id?: string;
};

export function validateDemographicCatalogRelationships(
  catalog: DemographicCatalog,
  options: {
    knownSegmentIds?: readonly string[];
  } = {},
): { valid: boolean; issues: DemographicRelationshipIssue[] } {
  const issues: DemographicRelationshipIssue[] = [];
  const profileIds = new Set<string>();
  const cohortIds = new Set<string>();
  const segmentIds = new Set(options.knownSegmentIds ?? []);

  for (const profile of catalog.profiles) {
    if (profileIds.has(profile.id)) {
      issues.push({
        code: 'duplicate_profile_id',
        id: profile.id,
        message: `Duplicate demographic profile id "${profile.id}"`,
      });
    }
    profileIds.add(profile.id);

    if (profile.segmentId && segmentIds.size > 0 && !segmentIds.has(profile.segmentId)) {
      issues.push({
        code: 'unknown_segment',
        id: profile.segmentId,
        message: `Demographic profile "${profile.id}" references unknown segment "${profile.segmentId}"`,
      });
    }
  }

  for (const cohort of catalog.cohorts) {
    if (cohortIds.has(cohort.id)) {
      issues.push({
        code: 'duplicate_cohort_id',
        id: cohort.id,
        message: `Duplicate demographic cohort id "${cohort.id}"`,
      });
    }
    cohortIds.add(cohort.id);

    for (const profileId of cohort.profileIds) {
      if (!profileIds.has(profileId)) {
        issues.push({
          code: 'unknown_profile',
          id: profileId,
          message: `Demographic cohort "${cohort.id}" references unknown profile "${profileId}"`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
