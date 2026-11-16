import { parseJobSituationModel } from '../schemas/job-situation-model.schema.js';
import type { JobSituationModel } from '../types/job-situation-model.js';

/** Storage-neutral JSON export. */
export function jsmToJSON(jsm: JobSituationModel): Record<string, unknown> {
  const parsed = parseJobSituationModel(jsm);
  return {
    id: parsed.id,
    label: parsed.label,
    situation: parsed.situation,
    ...(parsed.revision !== undefined ? { revision: parsed.revision } : {}),
    jobs: parsed.jobs,
  };
}

export function jsmFromJSON(json: unknown): JobSituationModel {
  return parseJobSituationModel(json);
}
