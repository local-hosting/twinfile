import { z } from 'zod';
import type {
  DemographicCatalog,
  DemographicProfile,
} from '../../demographic/demographic.schema.js';
import type { PersonaCatalog } from '../audience/persona.schema.js';
import { findPersonaProfile } from '../audience/persona.js';
import {
  UserAspectIdSchema,
  UserAspectRefsSchema,
  type ArchetypeAspectRef,
  type DemographicAspectRef,
  type FocusInterestAspectRef,
  type GeographicAspectRef,
  type PersonaAspectRef,
  type RelationshipAspectRef,
  type UserAspectId,
  type UserAspectRefs,
} from '../audience/method-aspect-refs.js';
import type { PsychographicSegmentSummary } from '../customer/profile/customer.js';
import {
  segmentSummaryFromProfile,
  type CustomerCatalog,
  type PsychographicSegmentCatalog,
  type PsychographicSegmentProfile,
} from '../customer/customer.js';
import type { EngagementLevelId } from '../customer/profile/engagement-ids.js';

export const UserSchema = z.object({
  aspectRefs: UserAspectRefsSchema.optional(),
});

export type User = z.infer<typeof UserSchema>;

export interface UserAspectContext {
  customerCatalog: CustomerCatalog;
  segmentCatalog: PsychographicSegmentCatalog;
  demographicCatalog: DemographicCatalog;
  personaCatalog?: PersonaCatalog;
}

export interface UserAspectIssue {
  aspectId: UserAspectId;
  code: string;
  message: string;
}

/** Resolved aspect payloads keyed by aspect id — built-in aspects are typed; the rest stay open. */
export interface WovenUserAspects
  extends Partial<Record<UserAspectId, Record<string, unknown>>> {
  relationship?: RelationshipAspectRef & { kind: string };
  archetype?: ArchetypeAspectRef & {
    summary: PsychographicSegmentSummary;
    segmentProfile: PsychographicSegmentProfile;
  };
  persona?: {
    characterId: string;
    profile: PersonaCatalog['personas'][number];
    source: NonNullable<PersonaAspectRef['source']>;
  };
  demographic?: {
    profileId: string;
    profile?: DemographicProfile;
    source: NonNullable<DemographicAspectRef['source']>;
  };
  geographic?: GeographicAspectRef;
  focusInterest?: FocusInterestAspectRef & { focusAreas: CustomerCatalog['focusAreas'] };
}

export interface WovenUser {
  user: User;
  aspects: WovenUserAspects;
  issues: UserAspectIssue[];
}

export interface ClassifyUserInput {
  engagementLevelId: EngagementLevelId;
  intentIds?: string[];
  archetypeId?: string;
  aspectRefs?: UserAspectRefs;
  lifecycleStageId?: CustomerCatalog['lifecycleStages'][number]['id'];
  opportunityIds?: CustomerCatalog['opportunities'][number]['id'][];
}

export interface UserAspect {
  id: UserAspectId;
  resolve(
    user: User,
    context: UserAspectContext,
    aspects: WovenUserAspects,
    issues: UserAspectIssue[],
  ): void;
}

function segmentProfileForArchetype(
  context: UserAspectContext,
  archetypeId: string | undefined,
): PsychographicSegmentProfile | undefined {
  if (!archetypeId) return undefined;
  return context.segmentCatalog.segments.find((row) => row.id === archetypeId);
}

function relationshipKindForEngagement(
  catalog: CustomerCatalog,
  engagementLevelId: EngagementLevelId,
): string {
  const level = catalog.engagementLevels.find((row) => row.id === engagementLevelId);
  return level?.userKind ?? 'customer';
}

const relationshipAspect: UserAspect = {
  id: 'relationship',
  resolve(user, context, aspects, issues) {
    const relationship = user.aspectRefs?.relationship;
    if (!relationship?.engagementLevelId) {
      issues.push({
        aspectId: 'relationship',
        code: 'missing_engagement_level',
        message: 'User has no relationship engagement level',
      });
      return;
    }
    aspects.relationship = {
      ...relationship,
      kind: relationshipKindForEngagement(context.customerCatalog, relationship.engagementLevelId),
    };
  },
};

const archetypeAspect: UserAspect = {
  id: 'archetype',
  resolve(user, context, aspects, issues) {
    const archetypeId = user.aspectRefs?.archetype?.archetypeId;
    if (!archetypeId) return;
    const segmentProfile = segmentProfileForArchetype(context, archetypeId);
    if (!segmentProfile) {
      issues.push({
        aspectId: 'archetype',
        code: 'unknown_archetype',
        message: `Unknown psychographic segment "${archetypeId}"`,
      });
      return;
    }
    aspects.archetype = {
      ...user.aspectRefs?.archetype,
      archetypeId,
      summary: segmentSummaryFromProfile(segmentProfile),
      segmentProfile,
    };
  },
};

const personaAspect: UserAspect = {
  id: 'persona',
  resolve(user, context, aspects, issues) {
    const declaredId = user.aspectRefs?.persona?.characterId;
    const archetypeId = user.aspectRefs?.archetype?.archetypeId;
    const segmentProfile = segmentProfileForArchetype(context, archetypeId);
    const characterId = declaredId ?? segmentProfile?.exemplarCharacterId;
    if (!characterId) return;
    const profile = findPersonaProfile(context.personaCatalog, characterId);
    if (!profile) {
      issues.push({
        aspectId: 'persona',
        code: 'unknown_persona',
        message: `Unknown persona "${characterId}"`,
      });
      return;
    }
    aspects.persona = {
      characterId,
      profile,
      source: user.aspectRefs?.persona?.source ?? (declaredId ? 'declared' : 'inferred'),
    };
  },
};

const demographicAspect: UserAspect = {
  id: 'demographic',
  resolve(user, context, aspects) {
    const declaredId = user.aspectRefs?.demographic?.profileId;
    const archetypeId = user.aspectRefs?.archetype?.archetypeId;
    const profileId = declaredId ?? archetypeId;
    if (!profileId) return;
    const profile =
      context.demographicCatalog.profiles.find((row) => row.id === profileId) ??
      context.demographicCatalog.profiles.find((row) => row.segmentId === profileId);
    aspects.demographic = {
      profileId,
      profile,
      source: user.aspectRefs?.demographic?.source ?? (declaredId ? 'declared' : 'inferred'),
    };
  },
};

const geographicAspect: UserAspect = {
  id: 'geographic',
  resolve(user, _context, aspects) {
    if (!user.aspectRefs?.geographic) return;
    aspects.geographic = { ...user.aspectRefs.geographic };
  },
};

const focusInterestAspect: UserAspect = {
  id: 'focusInterest',
  resolve(user, context, aspects) {
    const ref = user.aspectRefs?.focusInterest;
    if (!ref) return;
    const focusAreas = context.customerCatalog.focusAreas.filter((row) =>
      ref.focusAreaIds.includes(row.id),
    );
    aspects.focusInterest = {
      ...ref,
      focusAreas,
    };
  },
};

export const defaultUserAspects: readonly UserAspect[] = [
  relationshipAspect,
  archetypeAspect,
  personaAspect,
  demographicAspect,
  geographicAspect,
  focusInterestAspect,
];

export const identityAspects: readonly UserAspect[] = [
  archetypeAspect,
  personaAspect,
  demographicAspect,
];

export function classifyUser(input: ClassifyUserInput, _customerCatalog: CustomerCatalog): User {
  const archetypeId = input.archetypeId ?? input.aspectRefs?.archetype?.archetypeId;
  const aspectRefs: UserAspectRefs = {
    ...input.aspectRefs,
    archetype: archetypeId
      ? { ...input.aspectRefs?.archetype, archetypeId }
      : input.aspectRefs?.archetype,
    relationship: {
      engagementLevelId: input.engagementLevelId,
      intentIds: input.intentIds ?? input.aspectRefs?.relationship?.intentIds ?? [],
      lifecycleStageId: input.lifecycleStageId ?? input.aspectRefs?.relationship?.lifecycleStageId,
      opportunityIds: input.opportunityIds ?? input.aspectRefs?.relationship?.opportunityIds ?? [],
      source: input.aspectRefs?.relationship?.source ?? 'classified',
    },
  };
  return UserSchema.parse({ aspectRefs });
}

export function weaveUser(
  user: User,
  context: UserAspectContext,
  aspectsToRun: readonly UserAspect[] = defaultUserAspects,
): WovenUser {
  const aspects: WovenUserAspects = {};
  const issues: UserAspectIssue[] = [];
  for (const aspect of aspectsToRun) {
    aspect.resolve(user, context, aspects, issues);
  }
  return { user, aspects, issues };
}

export type { UserAspectRefs, UserAspectId, EngagementLevelId };
export { UserAspectIdSchema };
