import { z } from 'zod';

import { coercePlainStringList } from '../coerce-plain-string-list.js';
import { coalesceJobIdsFields } from '../coalesce-job-ids.js';
import { normalizeJourneyPhase } from '../../domain/journey/normalize.js';
import { normalizeTouchpointInput } from '../../axm/normalize-identity-input.js';
import { AXMEncounterChannelSchema, AXMEncounterSchema } from '../identity/encounter.schema.js';
import { HeartBaselineSchema } from '../story/heart.schema.js';
import { JourneyObstacleEncounterSchema } from '../story/obstacle.schema.js';
import { AXMHostContextSchema } from '../identity/context.schema.js';
import type { Journey } from '../../types/story/journey.js';

const withCoalescedJobIds = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (raw) =>
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? coalesceJobIdsFields(raw as Record<string, unknown>)
        : raw,
    schema,
  );

export const JourneyEmotionBandSchema = z.enum(['low', 'mid', 'high']);

export const JourneyEmotionValenceSchema = z.enum(['negative', 'neutral', 'positive']);

export const JourneyEmotionsSchema = z.object({
  band: JourneyEmotionBandSchema.optional(),
  valence: JourneyEmotionValenceSchema.optional(),
  feelings: z.preprocess(coercePlainStringList, z.array(z.string().min(1))).optional(),
  curve: z.number().min(-1).max(1).optional(),
});

const JourneyTouchpointRefCoreSchema = z.object({
  pageId: z.string().min(1).optional(),
  flowId: z.string().min(1).optional(),
  channel: z.union([AXMEncounterChannelSchema, z.string().min(1)]).optional(),
  label: z.string().min(1).optional(),
  encounter: AXMEncounterSchema.optional(),
});

/** Legacy inline touchpoint (mental-model matrix cells only). */
export const JourneyTouchpointRefSchema = z.preprocess((input) => {
  if (typeof input !== 'object' || input === null) {
    return input;
  }
  return normalizeTouchpointInput(input as Record<string, unknown>);
}, JourneyTouchpointRefCoreSchema);

export const JourneyTouchpointRefInputSchema = JourneyTouchpointRefCoreSchema.extend({
  host: AXMHostContextSchema.optional(),
});

export const JourneyMomentSchema = withCoalescedJobIds(
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    order: z.number().int().nonnegative(),
    period: z.string().min(1).optional(),
    narrativeBeat: z.string().min(1).optional(),
    context: z.string().min(1).optional(),
    /** @deprecated Prefer `context`. */
    situation: z.string().min(1).optional(),
    jobIds: z.array(z.string().min(1)).optional(),
    touchpointIds: z.array(z.string().min(1)).default([]),
    emotions: JourneyEmotionsSchema.optional(),
    pain: z.string().min(1).optional(),
    gain: z.string().min(1).optional(),
    obstacles: z.array(JourneyObstacleEncounterSchema).optional(),
  }),
).transform((row) => {
  const context = row.context ?? row.situation;
  const { situation: _situation, ...rest } = row;
  return { ...rest, ...(context ? { context } : {}) };
});

const JourneyPhaseInputSchema = withCoalescedJobIds(
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    order: z.number().int().nonnegative(),
    goal: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    context: z.string().min(1).optional(),
    /** @deprecated Prefer `context`. */
    situation: z.string().min(1).optional(),
    narrativeBeat: z.string().min(1).optional(),
    jobIds: z.array(z.string().min(1)).default([]),
    touchpointIds: z.array(z.string().min(1)).default([]),
    emotions: JourneyEmotionsSchema.optional(),
    emotion: JourneyEmotionBandSchema.optional(),
    pain: z.string().min(1).optional(),
    gain: z.string().min(1).optional(),
    obstacles: z.array(JourneyObstacleEncounterSchema).optional(),
    moments: z.array(JourneyMomentSchema).optional(),
  }),
);

export const JourneyPhaseSchema = JourneyPhaseInputSchema.transform((phase) => {
  const context = phase.context ?? phase.situation;
  const { situation: _situation, ...rest } = phase;
  return normalizeJourneyPhase({
    ...rest,
    ...(context ? { context } : {}),
  } as Parameters<typeof normalizeJourneyPhase>[0]);
});

export const JourneyNarrativeArcBeatSchema = z.object({
  phaseId: z.string().min(1).optional(),
  momentId: z.string().min(1).optional(),
  beat: z.string().min(1),
  order: z.number().int().nonnegative(),
  valence: JourneyEmotionValenceSchema.optional(),
});

export const JourneyNarrativeArcSchema = z.object({
  summary: z.string().min(1).optional(),
  beats: z.array(JourneyNarrativeArcBeatSchema).optional(),
});

export const JourneySchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    personaId: z.string().min(1),
    thinkingStyleId: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    journeyGoal: z.string().min(1).optional(),
    seriesId: z.string().min(1).optional(),
    seriesOrder: z.number().int().nonnegative().optional(),
    phases: z.array(JourneyPhaseSchema).min(2),
    narrativeArc: JourneyNarrativeArcSchema.optional(),
    heartBaseline: HeartBaselineSchema.optional(),
  })
  .superRefine((journey, ctx) => {
    const phaseIds = new Set<string>();
    const momentIds = new Set<string>();

    for (const phase of journey.phases) {
      if (phaseIds.has(phase.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate journey phase id "${phase.id}"`,
          path: ['phases'],
        });
      }
      phaseIds.add(phase.id);

      const phaseHasJobs =
        phase.jobIds.length > 0 ||
        (phase.moments?.some((m) => (m.jobIds?.length ?? 0) > 0) ?? false);

      if (!phaseHasJobs) {
        ctx.addIssue({
          code: 'custom',
          message: `phase "${phase.id}" needs ≥1 jobIds, or a moment with jobIds`,
          path: ['phases'],
        });
      }

      const phaseTouchpoints =
        phase.touchpointIds.length > 0 ||
        (phase.moments?.some((m) => (m.touchpointIds?.length ?? 0) > 0) ?? false);

      if (!phaseTouchpoints) {
        ctx.addIssue({
          code: 'custom',
          message: `phase "${phase.id}" needs touchpointIds on the phase or a moment`,
          path: ['phases'],
        });
      }

      for (const moment of phase.moments ?? []) {
        if (momentIds.has(moment.id)) {
          ctx.addIssue({
            code: 'custom',
            message: `duplicate journey moment id "${moment.id}"`,
            path: ['phases'],
          });
        }
        momentIds.add(moment.id);
      }
    }
  });

export function parseJourney(input: unknown): Journey {
  return JourneySchema.parse(input);
}
