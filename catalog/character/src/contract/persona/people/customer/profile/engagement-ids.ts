import { z } from 'zod';

/** Store-visit opportunity — what kind of need the visit serves. */
export const VisitOpportunityIdSchema = z.enum([
  'prospect',
  'fixer',
  'upgrader',
  'reclaimer',
  'retention',
]);

/** Lifecycle position along awareness → advocacy. */
export const LifecycleStageIdSchema = z.enum([
  'awareness',
  'evaluation',
  'activation',
  'adoption',
  'expansion',
  'advocacy',
]);

/** Relationship depth with the brand (stranger → champion). */
export const EngagementLevelIdSchema = z.enum([
  'stranger',
  'explorer',
  'beginner',
  'regular',
  'champion',
  'rejoiner',
]);

export type VisitOpportunityId = z.infer<typeof VisitOpportunityIdSchema>;
export type LifecycleStageId = z.infer<typeof LifecycleStageIdSchema>;
export type EngagementLevelId = z.infer<typeof EngagementLevelIdSchema>;
