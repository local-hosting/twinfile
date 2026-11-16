import { z } from 'zod';

import {
  collectJtbdJobIssues,
  normalizeJtbdClause,
} from '../jtbd/jtbd-job.js';
import {
  collectJobObstacleIssues,
  MAX_OBSTACLES_PER_JOB,
} from '../jtbd/jtbd-obstacle.js';
import { HEART_DIMENSIONS } from '../types/heart.js';
import { StrategyHoneycombFacetsSchema } from './honeycomb.schema.js';

export const StrategyEntityLifecycleSchema = z.enum(['proposed', 'validated', 'deprecated']);

const HeartDimensionSchema = z.enum(HEART_DIMENSIONS);

export const JobObstacleSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    jobIds: z.array(z.string().min(1)).optional(),
    removable: z.boolean().optional(),
    severity: z.enum(['mild', 'serious', 'severe', 'systemic']).optional(),
    heart: HeartDimensionSchema.optional(),
    lifecycle: StrategyEntityLifecycleSchema.optional(),
  })
  .superRefine((obstacle, ctx) => {
    for (const issue of collectJobObstacleIssues({
      id: obstacle.id,
      text: obstacle.text,
    })) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: [issue.path],
      });
    }
  })
  .transform((obstacle) => ({
    ...obstacle,
    id: obstacle.id.trim(),
    text: normalizeJtbdClause(obstacle.text),
  }));

/** First-class JTBD job (authoring unit on a JSM / strategy / PCM). */
export const JobSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    shortText: z.string().min(1).optional(),
    when: z.string().min(1),
    want: z.string().min(1),
    so: z.string().min(1),
    obstacles: z.array(JobObstacleSchema).optional(),
    lifecycle: StrategyEntityLifecycleSchema.optional(),
    revisedAt: z.string().min(1).optional(),
    facets: StrategyHoneycombFacetsSchema.optional(),
    persona: z.string().min(1).optional(),
    segment: z.string().min(1).optional(),
  })
  .superRefine((job, ctx) => {
    const normalized = {
      when: normalizeJtbdClause(job.when),
      want: normalizeJtbdClause(job.want),
      so: normalizeJtbdClause(job.so),
    };
    for (const issue of collectJtbdJobIssues(normalized)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: [issue.path],
      });
    }
    const obstacleCount = job.obstacles?.length ?? 0;
    if (obstacleCount > MAX_OBSTACLES_PER_JOB) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `job may list at most ${MAX_OBSTACLES_PER_JOB} obstacles (got ${obstacleCount})`,
        path: ['obstacles'],
      });
    }
  })
  .transform((job) => ({
    ...job,
    when: normalizeJtbdClause(job.when),
    want: normalizeJtbdClause(job.want),
    so: normalizeJtbdClause(job.so),
  }));

export function parseJob(input: unknown) {
  return JobSchema.parse(input);
}
