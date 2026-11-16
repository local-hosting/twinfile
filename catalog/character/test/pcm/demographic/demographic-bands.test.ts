import { describe, expect, it } from 'vitest';
import {
  ageBandIdFromMedianAge,
  buildInferredDemographicProfile,
  incomeBandIdFromMedianIncome,
  resolveH3DemographicBands,
  selectPrimaryH3DemographicBands,
} from '../../../src/contract/persona/demographic/demographic-bands.js';

describe('demographic bands', () => {
  it('maps median age and income to band ids', () => {
    expect(ageBandIdFromMedianAge(22)).toBe('age-18-24');
    expect(ageBandIdFromMedianAge(41)).toBe('age-35-44');
    expect(incomeBandIdFromMedianIncome(48_000)).toBe('income-35k-50k');
    expect(incomeBandIdFromMedianIncome(120_000)).toBe('income-100k-150k');
  });

  it('builds inferred profiles anchored to h3 cells', () => {
    const bands = resolveH3DemographicBands({
      h3CellId: '812a3',
      medianAge: 38,
      medianHouseholdIncome: 82_000,
      averageHouseholdSize: 2.4,
    });

    expect(bands.profileId).toContain('812a3');
    const profile = buildInferredDemographicProfile(bands);
    expect(profile.ageBandId).toBe('age-35-44');
    expect(profile.incomeBandId).toBe('income-75k-100k');
    expect(profile.attributes?.h3CellId).toBe('812a3');
  });

  it('prefers home demographics, then work, then family', () => {
    const home = resolveH3DemographicBands({
      h3CellId: 'home',
      medianAge: 30,
      medianHouseholdIncome: 60_000,
    });
    const work = resolveH3DemographicBands({
      h3CellId: 'work',
      medianAge: 40,
      medianHouseholdIncome: 110_000,
    });

    expect(selectPrimaryH3DemographicBands({ home, work })?.h3CellId).toBe('home');
    expect(selectPrimaryH3DemographicBands({ work, family: home })?.h3CellId).toBe('work');
  });
});
