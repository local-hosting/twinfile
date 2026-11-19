import { z } from 'zod';
import {
  EngagementLevelIdSchema,
  LifecycleStageIdSchema,
  VisitOpportunityIdSchema,
} from './engagement-ids.js';

/** Abstract root and concrete audience relationship types. */
export const UserTypeIdSchema = z.enum(['user', 'lead', 'prospect', 'customer']);

export const UserKindSchema = z.enum(['lead', 'prospect', 'customer']);

/** Canonical audience type definition — ontology, not a person instance. */
export const UserTypeDefinitionSchema = z.object({
  id: UserTypeIdSchema,
  label: z.string().min(1),
  description: z.string().min(1).optional(),
  parentTypeId: UserTypeIdSchema.optional(),
  kind: UserKindSchema.optional(),
  engagementLevelIds: z.array(EngagementLevelIdSchema).default([]),
  opportunityIds: z.array(VisitOpportunityIdSchema).default([]),
  lifecycleStageIds: z.array(LifecycleStageIdSchema).default([]),
  defaultIntentIds: z.array(z.string().min(1)).default([]),
});

export type UserTypeId = z.infer<typeof UserTypeIdSchema>;
export type UserKind = z.infer<typeof UserKindSchema>;
export type UserTypeDefinition = z.infer<typeof UserTypeDefinitionSchema>;
