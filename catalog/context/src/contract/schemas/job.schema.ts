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

/**
 * First-class JTBD job.
 *
 * When [Context/Circumstance], I want to [Goal/Job], so I can [Outcome/Need]
 * without [Pain Point/Obstacle].
 * Legacy `when` / `want` / `so` keys normalize to context / goal / outcome.
 */
export const JobSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    shortText: z.string().min(1).optional(),
    context: z.string().min(1).optional(),
    goal: z.string().min(1).optional(),
    outcome: z.string().min(1).optional(),
    /** @deprecated Prefer `context` (situation). */
    when: z.string().min(1).optional(),
    /** @deprecated Prefer `goal` (job/progress). */
    want: z.string().min(1).optional(),
    /** @deprecated Prefer `outcome` (definition of success). */
    so: z.string().min(1).optional(),
    obstacles: z.array(JobObstacleSchema).optional(),
    lifecycle: StrategyEntityLifecycleSchema.optional(),
    revisedAt: z.string().min(1).optional(),
    facets: StrategyHoneycombFacetsSchema.optional(),
    persona: z.string().min(1).optional(),
    segment: z.string().min(1).optional(),
  })
  .transform((job) => {
    const context = job.context ?? job.when;
    const goal = job.goal ?? job.want;
    const outcome = job.outcome ?? job.so;
    const { when: _when, want: _want, so: _so, ...rest } = job;
    return { ...rest, context, goal, outcome };
  })
  .superRefine((job, ctx) => {
    if (!job.context?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JTBD context (situation) is required',
        path: ['context'],
      });
    }
    if (!job.goal?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JTBD goal (job/progress) is required',
        path: ['goal'],
      });
    }
    if (!job.outcome?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JTBD outcome (definition of success) is required',
        path: ['outcome'],
      });
    }
    if (!job.context?.trim() || !job.goal?.trim() || !job.outcome?.trim()) {
      return;
    }
    const normalized = {
      context: normalizeJtbdClause(job.context),
      goal: normalizeJtbdClause(job.goal),
      outcome: normalizeJtbdClause(job.outcome),
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
    id: job.id,
    text: job.text,
    shortText: job.shortText,
    context: normalizeJtbdClause(job.context!),
    goal: normalizeJtbdClause(job.goal!),
    outcome: normalizeJtbdClause(job.outcome!),
    obstacles: job.obstacles,
    lifecycle: job.lifecycle,
    revisedAt: job.revisedAt,
    facets: job.facets,
    persona: job.persona,
    segment: job.segment,
  }));

export function parseJob(input: unknown) {
  return JobSchema.parse(input);
}
