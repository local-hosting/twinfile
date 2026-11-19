import { z } from 'zod';

import { JobSchema } from './job.schema.js';

/**
 * Mountable JTBD pack keyed by **context** (situation).
 * Accepts legacy `situation` and normalizes to `context`.
 */
export const JobContextModelSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    context: z.string().min(1).optional(),
    /** @deprecated Prefer `context` (situation). */
    situation: z.string().min(1).optional(),
    revision: z.number().int().nonnegative().optional(),
    jobs: z.array(JobSchema).min(1),
  })
  .transform((model) => {
    const context = model.context ?? model.situation;
    const { situation: _situation, ...rest } = model;
    return { ...rest, context };
  })
  .superRefine((model, ctx) => {
    if (!model.context?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JTBD pack context (situation) is required',
        path: ['context'],
      });
    }
  })
  .transform((model) => ({
    id: model.id,
    label: model.label,
    context: model.context!.trim(),
    revision: model.revision,
    jobs: model.jobs,
  }));

/** @deprecated Prefer {@link JobContextModelSchema}. */
export const JobSituationModelSchema = JobContextModelSchema;

export function parseJobContextModel(input: unknown) {
  return JobContextModelSchema.parse(input);
}

/** @deprecated Prefer {@link parseJobContextModel}. */
export function parseJobSituationModel(input: unknown) {
  return parseJobContextModel(input);
}
