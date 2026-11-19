import type { ZodTypeAny, output } from 'zod';
import { classifyTouchpointType } from './touchpoint-type.js';
import {
  JourneyTouchpointListFileSchema,
  JourneyTouchpointZoneCatalogFileSchema,
  PlaceFixtureFileSchema,
  PlaceZoneFileSchema,
  type JourneyTouchpointListFile,
  type JourneyTouchpointRecord,
  type JourneyTouchpointZoneCatalogFile,
  type PlaceFixtureFile,
  type PlaceZoneFile,
} from './journey-touchpoint-catalog.schema.js';
import type { KpiDefinition } from '@local-hosting/twinfile/context/types/kpi-definition-wire.js';

function parseWithSchema<S extends ZodTypeAny>(
  schema: S,
  input: unknown,
  label: string,
): output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const detail = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid ${label}: ${detail}`);
  }
  return result.data;
}

export function parseJourneyTouchpointListFile(input: unknown): JourneyTouchpointListFile {
  const file = parseWithSchema(JourneyTouchpointListFileSchema, input, 'journey touchpoint list file');
  return JourneyTouchpointListFileSchema.parse({
    touchpoints: file.touchpoints.map((record) => ({
      ...record,
      type: record.type ?? classifyTouchpointType(record),
    })),
  });
}

export function parseJourneyTouchpointZoneCatalogFile(
  input: unknown,
): JourneyTouchpointZoneCatalogFile {
  return parseWithSchema(
    JourneyTouchpointZoneCatalogFileSchema,
    input,
    'journey touchpoint zone catalog file',
  );
}

export function parsePlaceZoneFile(input: unknown): PlaceZoneFile {
  return parseWithSchema(PlaceZoneFileSchema, input, 'place zone file');
}

export function parsePlaceFixtureFile(input: unknown): PlaceFixtureFile {
  return parseWithSchema(PlaceFixtureFileSchema, input, 'place fixture file');
}

export interface JourneyTouchpointCatalogIssue {
  code: 'unknown_metric';
  message: string;
  touchpointId?: string;
  metricId?: string;
}

function metricIdsForTouchpoint(record: JourneyTouchpointRecord): string[] {
  const ids = new Set<string>();
  for (const metricId of record.directKpis ?? []) {
    ids.add(metricId);
  }
  for (const metricId of record.tags?.metrics ?? []) {
    ids.add(metricId);
  }
  return [...ids];
}

/** Validate journey touchpoint catalog metric references against a KPI registry. */
export function validateJourneyTouchpointListFile(
  file: JourneyTouchpointListFile,
  registry: readonly KpiDefinition[],
): { valid: boolean; issues: JourneyTouchpointCatalogIssue[] } {
  const parsed = parseJourneyTouchpointListFile(file);
  const registryIds = new Set(registry.map((row) => row.id));
  const issues: JourneyTouchpointCatalogIssue[] = [];

  for (const touchpoint of parsed.touchpoints) {
    for (const metricId of metricIdsForTouchpoint(touchpoint)) {
      if (!registryIds.has(metricId)) {
        issues.push({
          code: 'unknown_metric',
          touchpointId: touchpoint.id,
          metricId,
          message: `Touchpoint "${touchpoint.id}" references unknown metric "${metricId}"`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
