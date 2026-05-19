import { z } from 'zod';

export const EpisodePhaseIdSchema = z.enum(['pre_visit', 'on_site', 'post_visit']);

export const EpisodeTouchpointScheduleEntrySchema = z.object({
  dayIndex: z.number().int().nonnegative(),
  hour: z.number().int().min(0).max(23),
  touchpointId: z.string().min(1),
  phase: EpisodePhaseIdSchema,
  sceneId: z.string().min(1).optional(),
  venueKey: z.string().min(1).optional(),
  spaceId: z.string().min(1).optional(),
  visitMomentId: z.string().min(1).optional(),
  characterIds: z.array(z.string().min(1)).optional(),
});

export const EpisodeArcV1Schema = z.object({
  version: z.literal(1),
  simulationEpochStart: z.string().min(1),
  planningHorizonDays: z.number().int().positive(),
  visitDayIndex: z.number().int().nonnegative(),
  objectiveTouchpointIds: z.array(z.string().min(1)),
  phases: z.object({
    pre_visit: z.object({
      startDayIndex: z.number().int().nonnegative(),
      endDayIndex: z.number().int().nonnegative(),
    }),
    on_site: z.object({ dayIndex: z.number().int().nonnegative() }),
    post_visit: z.object({
      startDayIndex: z.number().int().nonnegative(),
      endDayIndex: z.number().int().nonnegative(),
    }),
  }),
  touchpointSchedule: z.array(EpisodeTouchpointScheduleEntrySchema),
});
