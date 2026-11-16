import { z } from 'zod';
import { VisitOpportunityIdSchema } from '../people/customer/profile/engagement-ids.js';
import { PlaceRefSchema } from './place.schema.js';

export const ActivityKindSchema = z.enum([
  'sleeping',
  'at_home_morning',
  'at_home_evening',
  'commute',
  'lunch_break',
  'dwell',
  'transaction',
  'service',
  'rest',
]);

export const ActivityBlockSchema = z.object({
  id: z.string().min(1),
  kind: ActivityKindSchema,
  startTime: z.number().min(0).max(24),
  endTime: z.number().min(0).max(24),
  startPlace: PlaceRefSchema.optional(),
  endPlace: PlaceRefSchema.optional(),
  opportunityId: VisitOpportunityIdSchema.optional(),
  /** Place catalog id for habit scoring — not the JTBD visit-opportunity enum. */
  placeOpportunityId: z.string().min(1).optional(),
  touchpointId: z.string().min(1).optional(),
  journeyPhaseId: z.string().min(1).optional(),
  jobId: z.string().min(1).optional(),
  /** Geotypes slug for the place visited during this block. */
  geotypeSlug: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
});

export const DailyActivityScheduleSchema = z.object({
  subjectId: z.string().min(1),
  dayIndex: z.number().int().min(0).default(0),
  activities: z.array(ActivityBlockSchema).default([]),
});

export const ActivityScheduleCatalogSchema = z.object({
  specVersion: z.literal('1.0').default('1.0'),
  methodId: z.string().min(1).optional(),
  schedules: z.array(DailyActivityScheduleSchema).default([]),
});

export type ActivityKind = z.infer<typeof ActivityKindSchema>;
export type ActivityBlock = z.infer<typeof ActivityBlockSchema>;
export type DailyActivitySchedule = z.infer<typeof DailyActivityScheduleSchema>;
export type ActivityScheduleCatalog = z.infer<typeof ActivityScheduleCatalogSchema>;
