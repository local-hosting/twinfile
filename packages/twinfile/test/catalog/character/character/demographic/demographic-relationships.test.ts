import { describe, expect, it } from 'vitest';
import { validateDemographicCatalogRelationships } from '../../../../../src/catalog/character/contract/character/demographic/validate-demographic-catalog-relationships.js';

describe('validateDemographicCatalogRelationships', () => {
  it('flags unknown cohort profile references', () => {
    const report = validateDemographicCatalogRelationships({
      specVersion: '1.0',
      profiles: [{ id: 'profile-a' }],
      cohorts: [{ id: 'cohort-a', label: 'Cohort A', profileIds: ['missing-profile'] }],
    });

    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.code === 'unknown_profile')).toBe(true);
  });
});
