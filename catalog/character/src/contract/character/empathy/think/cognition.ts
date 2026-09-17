import type { EngagementLevelId } from '../../people/customer/profile/engagement-ids.js';
import type { CustomerCatalog, PsychographicSegmentProfile } from '../../people/customer/profile/customer.js';
import type {
  CognitionLayerKind,
  CustomerIntentId,
  EmpathyJourneyPhaseId,
  FocusAreaId,
  SegmentRelationshipGraph,
} from '../../people/customer/graph/customer-relationships.js';
import type { EmpathyChannel, SegmentEmpathyFacet } from '../feel/empathy.schema.js';
import type {
  MentalModelScope,
  Mindset,
  SegmentOverview,
  ThinkingStyle,
} from './mental-model.schema.js';
import { mentalModelScopeFromFacet } from './mental-model.schema.js';
import type { SituationalThoughtSet } from './situational-thought.schema.js';
import { JourneyPaceSchema, MindsetSchema } from './thinking-style.js';
import { buildSegmentRelationshipGraph } from '../../people/customer/customer-relationships.js';

export interface CognitionContext {
  focusAreaId?: FocusAreaId;
  engagementLevelId?: EngagementLevelId;
  intentId?: CustomerIntentId;
}

export interface SituationalContext extends CognitionContext {
  channel: EmpathyChannel;
  phaseId: EmpathyJourneyPhaseId;
}

export interface CognitionIdentityLayer {
  kind: 'identity';
  mindset?: Mindset;
}

export interface CognitionContextLayer extends CognitionContext {
  kind: 'context';
}

export interface CognitionCognitionLayer {
  kind: 'cognition';
  thinkingStyles: ThinkingStyle[];
  mentalModel?: MentalModelScope;
}

export interface CognitionSituationalLayer extends SituationalThoughtSet {
  kind: 'situational';
}

export interface CognitionMeasurementLayer {
  kind: 'measurement';
  linkedMetricIds: string[];
}

export type CognitionLayerByKind = {
  identity: CognitionIdentityLayer;
  context: CognitionContextLayer;
  cognition: CognitionCognitionLayer;
  situational: CognitionSituationalLayer;
  measurement: CognitionMeasurementLayer;
};

export interface UserCognitionGraph {
  segmentId: PsychographicSegmentProfile['id'];
  layers: {
    identity: CognitionIdentityLayer;
    context: CognitionContextLayer;
    cognition: CognitionCognitionLayer;
    situational?: CognitionSituationalLayer;
    measurement?: CognitionMeasurementLayer;
  };
  relationships: SegmentRelationshipGraph;
}

export function cognitionLayerKinds(graph: UserCognitionGraph): CognitionLayerKind[] {
  const kinds: CognitionLayerKind[] = ['identity', 'context', 'cognition'];
  if (graph.layers.situational) kinds.push('situational');
  if (graph.layers.measurement) kinds.push('measurement');
  return kinds;
}

export function mindsetFromOverview(overview: SegmentOverview | undefined): Mindset | undefined {
  if (!overview?.mindset) return undefined;

  const parsedPace = JourneyPaceSchema.safeParse(overview.journeyPace);

  return MindsetSchema.parse({
    summary: overview.mindset,
    journeyPace: parsedPace.success ? parsedPace.data : undefined,
  });
}

export function mentalModelScopeFromProfile(
  profile: Pick<PsychographicSegmentProfile, 'mentalModel'>,
): MentalModelScope | undefined {
  return mentalModelScopeFromFacet(profile.mentalModel);
}

export function dominantThinkingStyleIds(scope: MentalModelScope | undefined): string[] {
  if (!scope) return [];

  const ids = new Set<string>();
  const collect = (styles: ThinkingStyle[] | undefined) => {
    for (const style of styles ?? []) ids.add(style.id);
  };

  collect(scope.mentalSpaces);
  collect(scope.base?.mentalSpaces);
  for (const bucket of Object.values(scope.byFocus ?? {})) collect(bucket?.mentalSpaces);
  for (const bucket of Object.values(scope.byLevel ?? {})) collect(bucket?.mentalSpaces);
  for (const bucket of Object.values(scope.byObjective ?? {})) collect(bucket?.mentalSpaces);

  return [...ids];
}

export function mindsetFromProfile(
  profile: Pick<PsychographicSegmentProfile, 'overview' | 'mentalModel'>,
): Mindset | undefined {
  const mindset = mindsetFromOverview(profile.overview);
  if (!mindset) return undefined;

  const dominantStyleIds = dominantThinkingStyleIds(mentalModelScopeFromProfile(profile));

  return MindsetSchema.parse({
    ...mindset,
    dominantStyleIds: dominantStyleIds.length ? dominantStyleIds : undefined,
  });
}

export function resolveMentalModelSlice(
  profile: Pick<PsychographicSegmentProfile, 'mentalModel'>,
  context: CognitionContext = {},
): ThinkingStyle[] {
  const scope = mentalModelScopeFromProfile(profile);
  if (!scope) return [];

  const { focusAreaId, engagementLevelId, intentId } = context;

  if (intentId && scope.byObjective?.[intentId]?.mentalSpaces?.length) {
    return scope.byObjective[intentId].mentalSpaces;
  }

  if (engagementLevelId && scope.byLevel?.[engagementLevelId]?.mentalSpaces?.length) {
    return scope.byLevel[engagementLevelId].mentalSpaces;
  }

  if (focusAreaId && scope.byFocus?.[focusAreaId]?.mentalSpaces?.length) {
    return scope.byFocus[focusAreaId].mentalSpaces;
  }

  if (scope.mentalSpaces?.length) return scope.mentalSpaces;
  if (scope.base?.mentalSpaces?.length) return scope.base.mentalSpaces;

  return [];
}

export function resolveSituationalThoughts(
  profile: Pick<PsychographicSegmentProfile, 'empathy'>,
  context: SituationalContext,
): SituationalThoughtSet | undefined {
  const facet = profile.empathy as SegmentEmpathyFacet | undefined;
  return facet?.empathy?.phases?.[context.channel]?.[context.phaseId];
}

export function buildUserCognitionGraph(
  profile: PsychographicSegmentProfile,
  context: CognitionContext = {},
  situational?: SituationalContext,
  catalog?: CustomerCatalog,
  options: { linkedMetricIds?: readonly string[] } = {},
): UserCognitionGraph {
  const thinkingStyles = resolveMentalModelSlice(profile, context);
  const situationalThoughts = situational
    ? resolveSituationalThoughts(profile, situational)
    : undefined;
  const linkedMetricIds = options.linkedMetricIds?.filter(Boolean) ?? [];

  return {
    segmentId: profile.id,
    layers: {
      identity: { kind: 'identity', mindset: mindsetFromProfile(profile) },
      context: { kind: 'context', ...context },
      cognition: {
        kind: 'cognition',
        thinkingStyles,
        mentalModel: mentalModelScopeFromProfile(profile),
      },
      situational: situationalThoughts
        ? { kind: 'situational', ...situationalThoughts }
        : undefined,
      measurement: linkedMetricIds.length
        ? { kind: 'measurement', linkedMetricIds: [...linkedMetricIds] }
        : undefined,
    },
    relationships: buildSegmentRelationshipGraph(profile, catalog),
  };
}

export { thinkingStyleIdFromLabel, normalizeThinkingStyle } from './thinking-style.js';
