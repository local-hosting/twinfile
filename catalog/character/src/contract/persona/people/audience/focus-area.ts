import {
  FocusAreaDefinitionSchema,
  type FocusAreaDefinition,
  type PsychographicSegmentProfile,
} from '../customer/profile/customer.js';
import type { FocusAreaCatalog } from './focus-area.schema.js';
import { FocusAreaCatalogSchema } from './focus-area.schema.js';
import {
  FocusAreaCatalogSourceSchema,
  type GroupedFocusAreas,
} from './focus-area-source.schema.js';

export interface FocusAreaCatalogIssue {
  code: 'duplicate_focus_area';
  message: string;
  id?: string;
}

export interface FocusAreaCatalogReport {
  valid: boolean;
  issues: FocusAreaCatalogIssue[];
}

export interface ResolvedFocusInterest {
  focusAreaIds: string[];
  primaryFocusAreaId: string;
}

const DEFAULT_PRIMARY_RANK = 50;
const SECONDARY_FOCUS_RANK = 90;
const UNKNOWN_FOCUS_RANK = 100;

export function parseFocusAreaCatalog(input: unknown): FocusAreaCatalog {
  return FocusAreaCatalogSchema.parse(input);
}

function flattenGroupedFocusAreas(grouped: GroupedFocusAreas): FocusAreaDefinition[] {
  const rows: FocusAreaDefinition[] = [];

  for (const entry of grouped.primary) {
    rows.push(
      FocusAreaDefinitionSchema.parse({
        ...entry,
        tier: entry.tier ?? 'primary',
      }),
    );
  }

  for (const entry of grouped.secondary) {
    rows.push(
      FocusAreaDefinitionSchema.parse({
        ...entry,
        tier: entry.tier ?? 'secondary',
      }),
    );
  }

  return rows;
}

/** Flatten tier-grouped YAML (or pass through legacy flat arrays) into a FocusAreaCatalog. */
export function normalizeFocusAreaCatalogSource(input: unknown): FocusAreaCatalog {
  const source = FocusAreaCatalogSourceSchema.parse(input);
  const focusAreas = Array.isArray(source.focusAreas)
    ? source.focusAreas
    : flattenGroupedFocusAreas(source.focusAreas);

  return FocusAreaCatalogSchema.parse({
    specVersion: source.specVersion,
    methodId: source.methodId,
    focusAreas,
  });
}

export function mergeFocusAreaCatalogs(
  base: FocusAreaCatalog,
  overlay: FocusAreaCatalog,
): FocusAreaCatalog {
  const byId = new Map(base.focusAreas.map((row) => [row.id, row]));
  for (const row of overlay.focusAreas) {
    byId.set(row.id, row);
  }

  const focusAreas = [...byId.values()].sort(
    (left, right) => primaryRankForDefinition(left) - primaryRankForDefinition(right),
  );

  return FocusAreaCatalogSchema.parse({
    specVersion: base.specVersion,
    methodId: overlay.methodId ?? base.methodId,
    focusAreas,
  });
}

function primaryRankForDefinition(row: FocusAreaDefinition): number {
  if (row.primaryRank != null) return row.primaryRank;
  return row.tier === 'secondary' ? SECONDARY_FOCUS_RANK : DEFAULT_PRIMARY_RANK;
}

export function extensionFocusAreasFromSource(
  source: unknown,
  archetypePresetId: string,
): FocusAreaDefinition[] {
  const parsed = FocusAreaCatalogSourceSchema.safeParse(source);
  if (!parsed.success) return [];

  const extension = parsed.data.extensions?.[archetypePresetId];
  if (!extension) return [];
  return flattenGroupedFocusAreas(extension);
}

export function validateFocusAreaCatalog(catalog: FocusAreaCatalog): FocusAreaCatalogReport {
  const issues: FocusAreaCatalogIssue[] = [];
  const seen = new Set<string>();

  for (const row of catalog.focusAreas) {
    if (seen.has(row.id)) {
      issues.push({
        code: 'duplicate_focus_area',
        id: row.id,
        message: `Duplicate focus area id "${row.id}"`,
      });
      continue;
    }
    seen.add(row.id);
  }

  return { valid: issues.length === 0, issues };
}

export function focusAreaIdsFromSegmentProfile(
  profile: PsychographicSegmentProfile,
): string[] {
  const byFocus = profile.mentalModel?.mentalModel?.byFocus;
  if (!byFocus || typeof byFocus !== 'object') return [];
  return Object.keys(byFocus);
}

function primaryRankForFocusArea(
  focusAreaId: string,
  catalogById: ReadonlyMap<string, FocusAreaDefinition>,
): number {
  const row = catalogById.get(focusAreaId);
  if (!row) return UNKNOWN_FOCUS_RANK;
  return primaryRankForDefinition(row);
}

/** Order segment focus keys by catalog rank; wifi and other secondary concerns stay deprioritized. */
export function resolvePrimaryFocusArea(
  segmentProfile: PsychographicSegmentProfile,
  focusAreas: readonly FocusAreaDefinition[],
): ResolvedFocusInterest | undefined {
  const segmentFocusIds = focusAreaIdsFromSegmentProfile(segmentProfile);
  if (segmentFocusIds.length === 0) return undefined;

  const catalogById = new Map(focusAreas.map((row) => [row.id, row]));
  const ordered = [...segmentFocusIds].sort(
    (left, right) =>
      primaryRankForFocusArea(left, catalogById) - primaryRankForFocusArea(right, catalogById),
  );

  return {
    focusAreaIds: ordered,
    primaryFocusAreaId: ordered[0]!,
  };
}
