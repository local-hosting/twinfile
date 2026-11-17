import {
  GoalAccomplishmentFeelCatalogSchema,
  type GoalAccomplishmentFeelCatalog,
  type GoalAccomplishmentFeelEntry,
} from './goal-accomplishment-feel.schema.js';

export function parseGoalAccomplishmentFeelCatalog(
  input: unknown,
): GoalAccomplishmentFeelCatalog {
  return GoalAccomplishmentFeelCatalogSchema.parse(input);
}

export function accomplishmentFeelsForJobSegment(
  catalog: GoalAccomplishmentFeelCatalog,
  jobId: string,
  segmentId: string,
): string[] {
  const exact = catalog.mappings.filter(
    (row) => row.jobId === jobId && row.segmentId === segmentId,
  );
  if (exact.length > 0) {
    return exact.map((row) => row.feelLabel);
  }

  const jobWide = catalog.mappings.filter(
    (row) => row.jobId === jobId && !row.segmentId,
  );
  if (jobWide.length > 0) {
    return jobWide.map((row) => row.feelLabel);
  }

  const segmentDefault = catalog.segmentDefaults.find((row) => row.segmentId === segmentId);
  return segmentDefault ? [segmentDefault.feelLabel] : [];
}

export function accomplishmentFeelsForJobs(
  catalog: GoalAccomplishmentFeelCatalog | undefined,
  jobIds: readonly string[],
  segmentId: string,
): string[] {
  if (!catalog || jobIds.length === 0) return [];

  const feels = new Set<string>();
  for (const jobId of jobIds) {
    for (const feel of accomplishmentFeelsForJobSegment(catalog, jobId, segmentId)) {
      feels.add(feel);
    }
  }
  return [...feels];
}

export function mappingsForSegment(
  catalog: GoalAccomplishmentFeelCatalog,
  segmentId: string,
): GoalAccomplishmentFeelEntry[] {
  return catalog.mappings.filter((row) => !row.segmentId || row.segmentId === segmentId);
}
