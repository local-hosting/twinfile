import type { CustomerCatalog, PsychographicSegmentProfile } from '../customer/profile/customer.js';
import type { PersonaCatalog } from '../audience/persona.schema.js';
import { findPersonaProfile } from '../audience/persona.js';
import type {
  CatalogRelationshipEdge,
  CatalogRelationshipGraph,
  SegmentEngagementLevelSource,
  SegmentFacetKind,
  SegmentRelationshipEdge,
  SegmentRelationshipGraph,
} from '../customer/graph/customer-relationships.js';
import {
  CatalogRelationshipGraphSchema,
  REQUIRED_SEGMENT_FACET_KINDS,
  SegmentFacetKindSchema,
  SegmentRelationshipGraphSchema,
  VISIT_OPPORTUNITY_BY_SCENARIO_KEY,
} from '../customer/graph/customer-relationships.js';
import { mentalModelScopeFromFacet } from '../../empathy/think/mental-model.schema.js';
import type { EngagementLevelId } from './profile/engagement-ids.js';
import type { UserKind } from './profile/user-type-definition.js';
import { HeartDimensionIdSchema } from '../../shared/heart-dimension-id.schema.js';
import { EngagementLevelIdSchema, LifecycleStageIdSchema } from './profile/engagement-ids.js';

export interface SegmentRelationshipIssue {
  code:
    | 'unknown_intent'
    | 'unknown_focus_area'
    | 'unknown_engagement_level'
    | 'unknown_scenario_key'
    | 'unknown_pain_point'
    | 'missing_required_facet'
    | 'unbound_mental_model_level'
    | 'missing_user_kind_binding'
    | 'objective_level_not_in_catalog'
    | 'unknown_touchpoint'
    | 'unknown_touchpoint_level'
    | 'unknown_persona';
  message: string;
  id?: string;
}

const FACET_FIELDS: Record<SegmentFacetKind, keyof PsychographicSegmentProfile> = {
  overview: 'overview',
  attitudes: 'attitudes',
  behavior: 'behavior',
  emotions: 'emotions',
  empathy: 'empathy',
  mental_model: 'mentalModel',
  services: 'services',
  strategy: 'strategy',
};

export function segmentFacetKinds(profile: PsychographicSegmentProfile): SegmentFacetKind[] {
  return (Object.entries(FACET_FIELDS) as [SegmentFacetKind, keyof PsychographicSegmentProfile][])
    .filter(([, field]) => profile[field] != null)
    .map(([facetKind]) => SegmentFacetKindSchema.parse(facetKind));
}

export function segmentEngagementLevelBindings(
  profile: PsychographicSegmentProfile,
): Map<EngagementLevelId, Set<SegmentEngagementLevelSource>> {
  const bindings = new Map<EngagementLevelId, Set<SegmentEngagementLevelSource>>();

  const add = (levelId: string, source: SegmentEngagementLevelSource) => {
    const engagementLevelId = EngagementLevelIdSchema.parse(levelId);
    const bucket = bindings.get(engagementLevelId) ?? new Set<SegmentEngagementLevelSource>();
    bucket.add(source);
    bindings.set(engagementLevelId, bucket);
  };

  for (const objective of profile.objectives) {
    for (const levelId of objective.validLevelIds) add(levelId, 'objective');
  }

  for (const levelId of Object.keys(profile.visitFrequency ?? {})) {
    add(levelId, 'visit_frequency');
  }

  const scope = mentalModelScopeFromFacet(profile.mentalModel);
  for (const levelId of Object.keys(scope?.byLevel ?? {})) {
    add(levelId, 'mental_model_level');
  }

  return bindings;
}

function resolveLevelUserKind(
  engagementLevelId: EngagementLevelId,
  catalog: CustomerCatalog,
): UserKind | undefined {
  return (
    catalog.links?.levelUserKind?.[engagementLevelId] ??
    catalog.engagementLevels.find((row) => row.id === engagementLevelId)?.userKind
  );
}

export function segmentUserKindBindings(
  profile: PsychographicSegmentProfile,
  catalog: CustomerCatalog,
): Map<UserKind, EngagementLevelId[]> {
  const grouped = new Map<UserKind, EngagementLevelId[]>();

  for (const [engagementLevelId] of segmentEngagementLevelBindings(profile)) {
    const userKind = resolveLevelUserKind(engagementLevelId, catalog);
    if (!userKind) continue;
    const existing = grouped.get(userKind) ?? [];
    existing.push(engagementLevelId);
    grouped.set(userKind, existing);
  }

  return grouped;
}

export function buildCatalogRelationshipGraph(catalog: CustomerCatalog): CatalogRelationshipGraph {
  const edges: CatalogRelationshipEdge[] = [];

  for (const intent of catalog.intents) {
    edges.push({
      kind: 'catalog_intent_opportunity',
      intentId: intent.id,
      opportunityId: intent.opportunityId,
    });
  }

  for (const userType of catalog.userTypes) {
    for (const engagementLevelId of userType.engagementLevelIds) {
      edges.push({
        kind: 'catalog_user_type_engagement',
        userTypeId: userType.id,
        engagementLevelId,
      });
    }
  }

  const seenLevels = new Set<EngagementLevelId>();
  for (const level of catalog.engagementLevels) {
    if (seenLevels.has(level.id)) continue;
    seenLevels.add(level.id);
    const userKind = resolveLevelUserKind(level.id, catalog);
    if (!userKind) continue;
    edges.push({
      kind: 'catalog_engagement_user_kind',
      engagementLevelId: level.id,
      userKind,
    });

    const lifecycleStageId =
      catalog.links?.levelLifecycleStage?.[level.id] ?? level.lifecycleStageId;
    if (lifecycleStageId) {
      edges.push({
        kind: 'catalog_level_lifecycle_stage',
        engagementLevelId: level.id,
        lifecycleStageId: LifecycleStageIdSchema.parse(lifecycleStageId),
      });
    }
  }

  for (const [levelId, mapping] of Object.entries(catalog.links?.levelShoppingMethods ?? {})) {
    const engagementLevelId = EngagementLevelIdSchema.parse(levelId);
    edges.push({
      kind: 'catalog_level_shopping_method',
      engagementLevelId,
      shoppingMethodId: mapping.primaryMethodId,
      role: 'primary',
    });
    for (const shoppingMethodId of mapping.secondaryMethodIds) {
      edges.push({
        kind: 'catalog_level_shopping_method',
        engagementLevelId,
        shoppingMethodId,
        role: 'secondary',
      });
    }
  }

  for (const focusArea of catalog.focusAreas) {
    for (const driverCategoryId of focusArea.driverCategoryIds) {
      edges.push({
        kind: 'catalog_focus_driver_category',
        focusAreaId: focusArea.id,
        driverCategoryId,
      });
    }
  }

  for (const stage of catalog.lifecycleStages) {
    for (const painPointId of stage.customerNeeds?.painPointIds ?? []) {
      edges.push({
        kind: 'catalog_lifecycle_pain_point',
        lifecycleStageId: stage.id,
        painPointId,
      });
    }
  }

  for (const [stageId, heartDimensionId] of Object.entries(
    catalog.links?.heartDimensionByLifecycleStage ?? {},
  )) {
    edges.push({
      kind: 'catalog_lifecycle_heart_dimension',
      lifecycleStageId: LifecycleStageIdSchema.parse(stageId),
      heartDimensionId: HeartDimensionIdSchema.parse(heartDimensionId),
    });
  }

  return CatalogRelationshipGraphSchema.parse({ edges });
}

export function buildSegmentRelationshipGraph(
  profile: PsychographicSegmentProfile,
  catalog?: CustomerCatalog,
  personaCatalog?: PersonaCatalog,
): SegmentRelationshipGraph {
  const scope = mentalModelScopeFromFacet(profile.mentalModel);
  const edges: SegmentRelationshipEdge[] = [];

  for (const facetKind of segmentFacetKinds(profile)) {
    edges.push({
      kind: 'segment_facet',
      segmentId: profile.id,
      facetKind,
    });
  }

  for (const [engagementLevelId, sources] of segmentEngagementLevelBindings(profile)) {
    edges.push({
      kind: 'segment_engagement_level',
      segmentId: profile.id,
      engagementLevelId,
      sources: [...sources],
    });
  }

  if (catalog) {
    for (const [userKind, engagementLevelIds] of segmentUserKindBindings(profile, catalog)) {
      edges.push({
        kind: 'segment_user_kind',
        segmentId: profile.id,
        userKind,
        engagementLevelIds,
      });
    }
  }

  if (profile.exemplarPersonaId) {
    edges.push({
      kind: 'segment_exemplar_persona',
      segmentId: profile.id,
      personaId: profile.exemplarPersonaId,
    });

    const exemplar = findPersonaProfile(personaCatalog, profile.exemplarPersonaId);
    for (const painPointId of exemplar?.painPointIds ?? []) {
      edges.push({
        kind: 'segment_pain_point',
        segmentId: profile.id,
        painPointId,
      });
    }
  }

  for (const [focusAreaId, bucket] of Object.entries(scope?.byFocus ?? {})) {
    if (!bucket) continue;
    edges.push({
      kind: 'segment_focus_mental_model',
      segmentId: profile.id,
      focusAreaId,
      thinkingStyleIds: bucket.mentalSpaces.map((style) => style.id),
    });
  }

  for (const [intentId, bucket] of Object.entries(scope?.byObjective ?? {})) {
    if (!bucket) continue;
    edges.push({
      kind: 'segment_intent_mental_model',
      segmentId: profile.id,
      intentId,
      thinkingStyleIds: bucket.mentalSpaces.map((style) => style.id),
    });
  }

  for (const [levelId, bucket] of Object.entries(scope?.byLevel ?? {})) {
    if (!bucket) continue;
    const engagementLevelId = EngagementLevelIdSchema.parse(levelId);
    edges.push({
      kind: 'segment_level_mental_model',
      segmentId: profile.id,
      engagementLevelId,
      thinkingStyleIds: bucket.mentalSpaces.map((style) => style.id),
    });
  }

  for (const objective of profile.objectives) {
    edges.push({
      kind: 'segment_objective',
      segmentId: profile.id,
      intentId: objective.intentId,
      engagementLevelIds: objective.validLevelIds,
    });
  }

  for (const scenarioKey of Object.keys(profile.strategy?.scenarios?.journeyTitles ?? {})) {
    if (scenarioKey !== 'Fixer' && scenarioKey !== 'Prospect' && scenarioKey !== 'Upgrader') continue;
    edges.push({
      kind: 'segment_scenario',
      segmentId: profile.id,
      scenarioKey,
      opportunityId: VISIT_OPPORTUNITY_BY_SCENARIO_KEY[scenarioKey],
    });
  }

  return SegmentRelationshipGraphSchema.parse({ segmentId: profile.id, edges });
}

export function validateSegmentProfileRelationships(
  profile: PsychographicSegmentProfile,
  catalog: CustomerCatalog,
  options: {
    personaCatalog?: PersonaCatalog;

    requireStrongEdges?: boolean;
    validateObjectiveCatalogLevels?: boolean;
    touchpointIds?: ReadonlySet<string>;
  } = {},
): { valid: boolean; issues: SegmentRelationshipIssue[] } {
  const requireStrongEdges = options.requireStrongEdges ?? true;
  const validateObjectiveCatalogLevels = options.validateObjectiveCatalogLevels ?? false;
  const touchpointIds = options.touchpointIds;
  const issues: SegmentRelationshipIssue[] = [];
  const intentIds = new Set(catalog.intents.map((row) => row.id));
  const focusAreaIds = new Set(catalog.focusAreas.map((row) => row.id));
  const levelIds = new Set(catalog.engagementLevels.map((row) => row.id));
  const painPointIds = new Set(catalog.painPoints.map((row) => row.id));
  const graph = buildSegmentRelationshipGraph(profile, catalog, options.personaCatalog);
  const engagementBindings = segmentEngagementLevelBindings(profile);
  if (profile.exemplarPersonaId) {
    const exemplar = findPersonaProfile(options.personaCatalog, profile.exemplarPersonaId);
    if (!exemplar) {
      issues.push({
        code: 'unknown_persona',
        id: profile.exemplarPersonaId,
        message: `Segment "${profile.id}" references unknown exemplar persona "${profile.exemplarPersonaId}"`,
      });
    }
  }

  const presentFacets = new Set(segmentFacetKinds(profile));

  if (requireStrongEdges) {
    for (const facetKind of REQUIRED_SEGMENT_FACET_KINDS) {
      if (!presentFacets.has(facetKind)) {
        issues.push({
          code: 'missing_required_facet',
          id: facetKind,
          message: `Segment "${profile.id}" is missing required facet "${facetKind}"`,
        });
      }
    }

    if (!graph.edges.some((edge) => edge.kind === 'segment_user_kind')) {
      issues.push({
        code: 'missing_user_kind_binding',
        message: `Segment "${profile.id}" has no user-kind bindings derived from engagement levels`,
      });
    }

    for (const levelId of Object.keys(mentalModelScopeFromFacet(profile.mentalModel)?.byLevel ?? {})) {
      const engagementLevelId = EngagementLevelIdSchema.parse(levelId);
      if (!engagementBindings.has(engagementLevelId)) {
        issues.push({
          code: 'unbound_mental_model_level',
          id: engagementLevelId,
          message: `Segment "${profile.id}" mental model level "${engagementLevelId}" is not bound by objectives or visit frequency`,
        });
      }
    }
  }

  if (touchpointIds) {
    for (const objective of profile.objectives) {
      for (const [levelId, sequence] of Object.entries(objective.touchpointSequences)) {
        const engagementLevelId = EngagementLevelIdSchema.safeParse(levelId);
        if (!engagementLevelId.success || !levelIds.has(engagementLevelId.data)) {
          issues.push({
            code: 'unknown_touchpoint_level',
            id: levelId,
            message: `Segment "${profile.id}" touchpoint sequence references unknown engagement level "${levelId}"`,
          });
        }
        for (const touchpointId of sequence) {
          if (!touchpointIds.has(touchpointId)) {
            issues.push({
              code: 'unknown_touchpoint',
              id: touchpointId,
              message: `Segment "${profile.id}" touchpoint sequence references unknown touchpoint "${touchpointId}"`,
            });
          }
        }
      }
    }
  }

  for (const edge of graph.edges) {
    switch (edge.kind) {
      case 'segment_focus_mental_model':
        if (!focusAreaIds.has(edge.focusAreaId)) {
          issues.push({
            code: 'unknown_focus_area',
            id: edge.focusAreaId,
            message: `Segment "${profile.id}" mental model references unknown focus area "${edge.focusAreaId}"`,
          });
        }
        break;
      case 'segment_intent_mental_model':
        if (!intentIds.has(edge.intentId)) {
          issues.push({
            code: 'unknown_intent',
            id: edge.intentId,
            message: `Segment "${profile.id}" references unknown intent "${edge.intentId}"`,
          });
        }
        break;
      case 'segment_objective':
        if (!intentIds.has(edge.intentId)) {
          issues.push({
            code: 'unknown_intent',
            id: edge.intentId,
            message: `Segment "${profile.id}" references unknown intent "${edge.intentId}"`,
          });
        }
        for (const levelId of edge.engagementLevelIds) {
          const engagementLevelId = EngagementLevelIdSchema.safeParse(levelId);
        if (!engagementLevelId.success || !levelIds.has(engagementLevelId.data)) {
            issues.push({
              code: 'unknown_engagement_level',
              id: levelId,
              message: `Segment "${profile.id}" objective references unknown engagement level "${levelId}"`,
            });
            continue;
          }
          if (validateObjectiveCatalogLevels) {
            const level = catalog.engagementLevels.find((row) => row.id === levelId);
            if (level && !level.validIntentIds.includes(edge.intentId)) {
              issues.push({
                code: 'objective_level_not_in_catalog',
                id: `${edge.intentId}@${levelId}`,
                message: `Segment "${profile.id}" objective intent "${edge.intentId}" is not valid at engagement level "${levelId}" in the catalog`,
              });
            }
          }
        }
        break;
      case 'segment_level_mental_model':
      case 'segment_engagement_level':
        if (!levelIds.has(edge.engagementLevelId)) {
          issues.push({
            code: 'unknown_engagement_level',
            id: edge.engagementLevelId,
            message: `Segment "${profile.id}" references unknown engagement level "${edge.engagementLevelId}"`,
          });
        }
        break;
      case 'segment_pain_point':
        if (!painPointIds.has(edge.painPointId)) {
          issues.push({
            code: 'unknown_pain_point',
            id: edge.painPointId,
            message: `Segment "${profile.id}" references unknown pain point "${edge.painPointId}"`,
          });
        }
        break;
      default:
        break;
    }
  }

  return { valid: issues.length === 0, issues };
}

export {
  REQUIRED_SEGMENT_FACET_KINDS,
  VISIT_OPPORTUNITY_BY_SCENARIO_KEY,
  SegmentRelationshipGraphSchema,
  CatalogRelationshipGraphSchema,
} from '../customer/graph/customer-relationships.js';
