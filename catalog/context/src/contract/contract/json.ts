import { parseJobContextModel } from '../schemas/job-context-model.schema.js';
import type { JobContextModel } from '../types/job-context-model.js';

export function contextToJSON(model: JobContextModel): Record<string, unknown> {
  const parsed = parseJobContextModel(model);
  return {
    id: parsed.id,
    label: parsed.label,
    context: parsed.context,
    ...(parsed.revision != null ? { revision: parsed.revision } : {}),
    jobs: parsed.jobs,
  };
}

export function contextFromJSON(json: unknown): JobContextModel {
  return parseJobContextModel(json);
}

/** @deprecated Prefer {@link contextToJSON}. */
export function situationsToJSON(situations: JobContextModel): Record<string, unknown> {
  return contextToJSON(situations);
}

/** @deprecated Prefer {@link contextFromJSON}. */
export function situationsFromJSON(json: unknown): JobContextModel {
  return contextFromJSON(json);
}
