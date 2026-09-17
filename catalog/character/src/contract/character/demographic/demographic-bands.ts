import type { DemographicProfile } from './demographic.schema.js';

export type AgeBandId =
  | 'age-under-18'
  | 'age-18-24'
  | 'age-25-34'
  | 'age-35-44'
  | 'age-45-54'
  | 'age-55-64'
  | 'age-65-plus';

export type IncomeBandId =
  | 'income-under-35k'
  | 'income-35k-50k'
  | 'income-50k-75k'
  | 'income-75k-100k'
  | 'income-100k-150k'
  | 'income-150k-plus';

export interface H3DemographicStats {
  h3CellId: string;
  medianAge?: number;
  medianHouseholdIncome?: number;
  averageHouseholdSize?: number;
  householdsWithChildrenPct?: number;
  totalPopulation?: number;
  topGeneration?: string;
  ownerOccupiedPct?: number;
  workedFromHomePct?: number;
}

export interface H3DemographicBands extends H3DemographicStats {
  ageBandId?: AgeBandId;
  incomeBandId?: IncomeBandId;
  profileId: string;
}

export function ageBandIdFromMedianAge(medianAge: number): AgeBandId {
  if (medianAge < 18) return 'age-under-18';
  if (medianAge < 25) return 'age-18-24';
  if (medianAge < 35) return 'age-25-34';
  if (medianAge < 45) return 'age-35-44';
  if (medianAge < 55) return 'age-45-54';
  if (medianAge < 65) return 'age-55-64';
  return 'age-65-plus';
}

export function incomeBandIdFromMedianIncome(medianIncome: number): IncomeBandId {
  if (medianIncome < 35_000) return 'income-under-35k';
  if (medianIncome < 50_000) return 'income-35k-50k';
  if (medianIncome < 75_000) return 'income-50k-75k';
  if (medianIncome < 100_000) return 'income-75k-100k';
  if (medianIncome < 150_000) return 'income-100k-150k';
  return 'income-150k-plus';
}

export function demographicProfileIdFromBands(
  ageBandId?: AgeBandId,
  incomeBandId?: IncomeBandId,
  h3CellId?: string,
): string {
  const age = ageBandId ?? 'age-unknown';
  const income = incomeBandId ?? 'income-unknown';
  const cell = h3CellId?.trim().toLowerCase() || 'unknown';
  return `demo:${age}:${income}:${cell}`;
}

export function resolveH3DemographicBands(stats: H3DemographicStats): H3DemographicBands {
  const ageBandId =
    stats.medianAge != null ? ageBandIdFromMedianAge(stats.medianAge) : undefined;
  const incomeBandId =
    stats.medianHouseholdIncome != null
      ? incomeBandIdFromMedianIncome(stats.medianHouseholdIncome)
      : undefined;

  return {
    ...stats,
    ageBandId,
    incomeBandId,
    profileId: demographicProfileIdFromBands(ageBandId, incomeBandId, stats.h3CellId),
  };
}

export function buildInferredDemographicProfile(bands: H3DemographicBands): DemographicProfile {
  const ageLabel = bands.ageBandId?.replace('age-', '').replace('-', ' to ') ?? 'unknown age';
  const incomeLabel =
    bands.incomeBandId?.replace('income-', '').replace('k', 'k ').replace('-', '–') ??
    'unknown income';

  return {
    id: bands.profileId,
    label: `${ageLabel}, ${incomeLabel} (H3 ${bands.h3CellId})`,
    ageBandId: bands.ageBandId,
    incomeBandId: bands.incomeBandId,
    ...(bands.averageHouseholdSize != null
      ? { householdSize: Math.max(1, Math.round(bands.averageHouseholdSize)) }
      : {}),
    attributes: {
      h3CellId: bands.h3CellId,
      medianAge: bands.medianAge,
      medianHouseholdIncome: bands.medianHouseholdIncome,
      averageHouseholdSize: bands.averageHouseholdSize,
      householdsWithChildrenPct: bands.householdsWithChildrenPct,
      totalPopulation: bands.totalPopulation,
      topGeneration: bands.topGeneration,
      ownerOccupiedPct: bands.ownerOccupiedPct,
      workedFromHomePct: bands.workedFromHomePct,
    },
  };
}

export function selectPrimaryH3DemographicBands(
  locations: {
    home?: H3DemographicBands;
    work?: H3DemographicBands;
    family?: H3DemographicBands;
  },
): H3DemographicBands | undefined {
  const candidates = [locations.home, locations.work, locations.family].filter(
    (row): row is H3DemographicBands =>
      Boolean(row && (row.medianAge != null || row.medianHouseholdIncome != null)),
  );
  return candidates[0];
}
