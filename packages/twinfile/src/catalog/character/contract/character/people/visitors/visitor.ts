import {
  VisitorCatalogSchema,
  type VisitorCatalog,
} from './profile/visitor-catalog.js';
import {
  PopulationKindSchema,
  VisitPresenceLocusSchema,
  VisitorJourneyStageIdSchema,
  type PopulationKind,
  type VisitAccessModality,
  type VisitIntentId,
  type VisitPhaseId,
  type VisitPresenceLocus,
  type VisitVenueArchetypeId,
  type VisitorJourneyStageId,
} from './profile/visit-ids.js';
import {
  VisitorSchema,
  type Visitor,
} from './profile/visitor.js';
import type { VisitAspectRef, VisitorAspectRefs } from './graph/visitor-aspect-refs.js';
import { DEFAULT_VISITOR_CATALOG } from './defaults/visitor-catalog.js';

export class VisitorJourneyTransitionError extends Error {
  constructor(
    public readonly code: 'at_ceiling' | 'at_floor' | 'no_advance_path' | 'no_retreat_path',
    message: string,
  ) {
    super(message);
    this.name = 'VisitorJourneyTransitionError';
  }
}

export function parseVisitor(input: unknown): Visitor {
  return VisitorSchema.parse(input);
}

export function parseVisitorCatalog(input: unknown): VisitorCatalog {
  return VisitorCatalogSchema.parse(input);
}

export function getDefaultVisitorCatalog(): VisitorCatalog {
  return VisitorCatalogSchema.parse(DEFAULT_VISITOR_CATALOG);
}

export function visitAspectRefFromVisitor(visitor: Visitor): VisitAspectRef | undefined {
  return visitor.aspectRefs?.visit;
}

export function journeyStageIdFromVisitor(visitor: Visitor): VisitorJourneyStageId | undefined {
  return visitAspectRefFromVisitor(visitor)?.journeyStageId;
}

export function visitIntentIdsFromVisitor(visitor: Visitor): string[] {
  return visitAspectRefFromVisitor(visitor)?.intentIds ?? [];
}

export function populationKindFromVisitor(visitor: Visitor): PopulationKind | undefined {
  return visitAspectRefFromVisitor(visitor)?.populationKind;
}

export function visitPhaseIdFromVisitor(visitor: Visitor): VisitPhaseId | undefined {
  return visitAspectRefFromVisitor(visitor)?.visitPhaseId;
}

export function visitLocusFromVisitor(visitor: Visitor): VisitPresenceLocus | undefined {
  return visitAspectRefFromVisitor(visitor)?.visitLocus;
}

export function accessModalitiesFromVisitor(visitor: Visitor): VisitAccessModality[] {
  return visitAspectRefFromVisitor(visitor)?.accessModalities ?? [];
}

export function venueArchetypeIdFromVisitor(visitor: Visitor): VisitVenueArchetypeId | undefined {
  return visitAspectRefFromVisitor(visitor)?.venueArchetypeId;
}

export function visitPhaseIdForJourneyStage(
  stageId: VisitorJourneyStageId,
  catalog: VisitorCatalog = DEFAULT_VISITOR_CATALOG,
): VisitPhaseId | undefined {
  const mapped = catalog.links?.stageVisitPhase?.[stageId];
  if (mapped) return mapped;
  return catalog.journeyStages.find((row) => row.id === stageId)?.visitPhaseId;
}

export function defaultJourneyStageForPopulation(
  populationKind: PopulationKind,
  catalog: VisitorCatalog = DEFAULT_VISITOR_CATALOG,
  venueArchetypeId?: VisitVenueArchetypeId,
): VisitorJourneyStageId | undefined {
  if (venueArchetypeId) {
    const venueStage = catalog.links?.venueDefaultJourneyStage?.[venueArchetypeId];
    if (venueStage) return venueStage;
    const archetype = catalog.venueArchetypes.find((row) => row.id === venueArchetypeId);
    if (archetype?.defaultJourneyStageId) return archetype.defaultJourneyStageId;
  }

  const mapped = catalog.links?.populationDefaultStage?.[populationKind];
  if (mapped) return mapped;
  if (populationKind === 'visitor') return 'arrival';
  if (populationKind === 'resident') return 'on_site';
  return 'navigation';
}

export function defaultPresenceLocusForVenueArchetype(
  venueArchetypeId: VisitVenueArchetypeId,
  catalog: VisitorCatalog = DEFAULT_VISITOR_CATALOG,
): VisitPresenceLocus {
  const mapped = catalog.links?.venueDefaultPresenceLocus?.[venueArchetypeId];
  if (mapped) return mapped;
  const archetype = catalog.venueArchetypes.find((row) => row.id === venueArchetypeId);
  return archetype?.defaultPresenceLocus ?? 'physical';
}

export function defaultAccessModalitiesForLocus(
  visitLocus: VisitPresenceLocus,
  catalog: VisitorCatalog = DEFAULT_VISITOR_CATALOG,
): VisitAccessModality[] {
  const mapped = catalog.links?.locusDefaultAccessModalities?.[visitLocus];
  if (mapped?.length) return [...mapped];
  const locus = catalog.presenceLoci.find((row) => row.id === visitLocus);
  if (locus?.defaultAccessModalities.length) return [...locus.defaultAccessModalities];
  if (visitLocus === 'virtual') return ['web'];
  if (visitLocus === 'blended') return ['physical_space', 'web'];
  return ['physical_space'];
}

export function defaultAccessModalitiesForVenueArchetype(
  venueArchetypeId: VisitVenueArchetypeId,
  catalog: VisitorCatalog = DEFAULT_VISITOR_CATALOG,
): VisitAccessModality[] {
  const mapped = catalog.links?.venueDefaultAccessModalities?.[venueArchetypeId];
  if (mapped?.length) return [...mapped];
  const archetype = catalog.venueArchetypes.find((row) => row.id === venueArchetypeId);
  if (archetype?.defaultAccessModalities.length) return [...archetype.defaultAccessModalities];
  const locus = archetype?.defaultPresenceLocus ?? defaultPresenceLocusForVenueArchetype(venueArchetypeId, catalog);
  return defaultAccessModalitiesForLocus(locus, catalog);
}

export function resolveVisitPresence(
  input: {
    visitLocus?: VisitPresenceLocus;
    accessModalities?: VisitAccessModality[];
    venueArchetypeId?: VisitVenueArchetypeId;
  },
  catalog: VisitorCatalog = DEFAULT_VISITOR_CATALOG,
): { visitLocus: VisitPresenceLocus; accessModalities: VisitAccessModality[] } {
  const visitLocus =
    input.visitLocus ??
    (input.venueArchetypeId
      ? defaultPresenceLocusForVenueArchetype(input.venueArchetypeId, catalog)
      : 'physical');

  const accessModalities =
    input.accessModalities?.length
      ? [...input.accessModalities]
      : input.venueArchetypeId
        ? defaultAccessModalitiesForVenueArchetype(input.venueArchetypeId, catalog)
        : defaultAccessModalitiesForLocus(visitLocus, catalog);

  return { visitLocus, accessModalities };
}

export function normalizeVisitorAspectRefs(input: {
  aspectRefs?: VisitorAspectRefs;
}): VisitorAspectRefs | undefined {
  const refs: VisitorAspectRefs = { ...input.aspectRefs };
  const hasRef = (
    Object.values(refs) as Array<VisitorAspectRefs[keyof VisitorAspectRefs] | undefined>
  ).some((value) => value !== undefined);
  return hasRef ? refs : undefined;
}

export interface ClassifyVisitorInput {
  populationKind: PopulationKind;
  journeyStageId?: VisitorJourneyStageId;
  intentIds?: VisitIntentId[];
  visitPhaseId?: VisitPhaseId;
  visitLocus?: VisitPresenceLocus;
  accessModalities?: VisitAccessModality[];
  venueArchetypeId?: VisitVenueArchetypeId;
  aspectRefs?: VisitorAspectRefs;
}

export function classifyVisitor(
  input: ClassifyVisitorInput,
  catalog: VisitorCatalog = DEFAULT_VISITOR_CATALOG,
): Visitor {
  const venueArchetypeId =
    input.venueArchetypeId ?? input.aspectRefs?.visit?.venueArchetypeId;
  const journeyStageId =
    input.journeyStageId ??
    defaultJourneyStageForPopulation(input.populationKind, catalog, venueArchetypeId);
  if (!journeyStageId) {
    throw new Error(`Cannot classify visitor for population kind "${input.populationKind}"`);
  }

  const visitPhaseId =
    input.visitPhaseId ?? visitPhaseIdForJourneyStage(journeyStageId, catalog);
  const { visitLocus, accessModalities } = resolveVisitPresence(
    {
      visitLocus: input.visitLocus ?? input.aspectRefs?.visit?.visitLocus,
      accessModalities: input.accessModalities ?? input.aspectRefs?.visit?.accessModalities,
      venueArchetypeId,
    },
    catalog,
  );

  const aspectRefs = normalizeVisitorAspectRefs({
    aspectRefs: {
      ...input.aspectRefs,
      visit: {
        ...input.aspectRefs?.visit,
        populationKind: input.populationKind,
        journeyStageId,
        visitPhaseId,
        visitLocus,
        accessModalities,
        venueArchetypeId,
        intentIds: input.intentIds ?? input.aspectRefs?.visit?.intentIds ?? [],
        source: input.aspectRefs?.visit?.source ?? 'classified',
      },
    },
  });

  return parseVisitor({ aspectRefs });
}

export function isVisitorPopulation(visitor: Visitor): boolean {
  return populationKindFromVisitor(visitor) === 'visitor';
}

export function isResidentPopulation(visitor: Visitor): boolean {
  return populationKindFromVisitor(visitor) === 'resident';
}

export function isPassByPopulation(visitor: Visitor): boolean {
  return populationKindFromVisitor(visitor) === 'pass_by';
}

export function isPhysicalVisitor(visitor: Visitor): boolean {
  return visitLocusFromVisitor(visitor) === 'physical';
}

export function isVirtualVisitor(visitor: Visitor): boolean {
  return visitLocusFromVisitor(visitor) === 'virtual';
}

export function isBlendedVisitor(visitor: Visitor): boolean {
  return visitLocusFromVisitor(visitor) === 'blended';
}

export function assertPopulationKind(value: string): PopulationKind {
  return PopulationKindSchema.parse(value);
}

export function assertVisitorJourneyStageId(value: string): VisitorJourneyStageId {
  return VisitorJourneyStageIdSchema.parse(value);
}

export function assertVisitPresenceLocus(value: string): VisitPresenceLocus {
  return VisitPresenceLocusSchema.parse(value);
}

function journeyStageDefinition(
  stageId: VisitorJourneyStageId,
  catalog: VisitorCatalog,
): VisitorCatalog['journeyStages'][number] | undefined {
  return catalog.journeyStages.find((row) => row.id === stageId);
}

export function nextJourneyStageId(
  stageId: VisitorJourneyStageId,
  catalog: VisitorCatalog = DEFAULT_VISITOR_CATALOG,
): VisitorJourneyStageId | undefined {
  const nextStageId = journeyStageDefinition(stageId, catalog)?.nextStageId;
  if (!nextStageId) return undefined;
  return nextStageId;
}

function visitClassificationInput(visitor: Visitor): ClassifyVisitorInput {
  const visit = visitAspectRefFromVisitor(visitor);
  if (!visit) {
    throw new VisitorJourneyTransitionError(
      'no_advance_path',
      'Visitor has no visit aspect — cannot transition journey stage',
    );
  }

  return {
    populationKind: visit.populationKind,
    journeyStageId: visit.journeyStageId,
    intentIds: visit.intentIds,
    visitPhaseId: visit.visitPhaseId,
    visitLocus: visit.visitLocus,
    accessModalities: visit.accessModalities,
    venueArchetypeId: visit.venueArchetypeId,
    aspectRefs: visitor.aspectRefs,
  };
}

export function advanceVisitor(
  visitor: Visitor,
  catalog: VisitorCatalog = DEFAULT_VISITOR_CATALOG,
): Visitor {
  const currentStageId = journeyStageIdFromVisitor(visitor);
  if (!currentStageId) {
    throw new VisitorJourneyTransitionError(
      'no_advance_path',
      'Visitor has no visit aspect — cannot advance',
    );
  }

  const nextStageId = nextJourneyStageId(currentStageId, catalog);
  if (!nextStageId) {
    throw new VisitorJourneyTransitionError(
      currentStageId === 'post_visit' ? 'at_ceiling' : 'no_advance_path',
      `Cannot advance visitor at journey stage "${currentStageId}"`,
    );
  }

  return classifyVisitor(
    {
      ...visitClassificationInput(visitor),
      journeyStageId: nextStageId,
      visitPhaseId: visitPhaseIdForJourneyStage(nextStageId, catalog),
    },
    catalog,
  );
}

export interface VisitorValidationIssue {
  code:
    | 'unknown_stage'
    | 'unknown_intent'
    | 'unknown_population'
    | 'unknown_presence_locus'
    | 'unknown_access_modality'
    | 'unknown_venue_archetype'
    | 'intent_not_valid_for_stage';
  message: string;
  id?: string;
}

export function validateVisitorCatalog(
  catalog: VisitorCatalog,
): { valid: boolean; issues: VisitorValidationIssue[] } {
  const issues: VisitorValidationIssue[] = [];
  const stageIds = new Set(catalog.journeyStages.map((row) => row.id));
  const intentIds = new Set(catalog.visitIntents.map((row) => row.id));
  const populationIds = new Set(catalog.populationKinds.map((row) => row.id));
  const locusIds = new Set(catalog.presenceLoci.map((row) => row.id));
  const modalityIds = new Set(catalog.accessModalities.map((row) => row.id));
  const venueArchetypeIds = new Set(catalog.venueArchetypes.map((row) => row.id));

  for (const stage of catalog.journeyStages) {
    if (stage.nextStageId && !stageIds.has(stage.nextStageId)) {
      issues.push({
        code: 'unknown_stage',
        id: stage.nextStageId,
        message: `Journey stage "${stage.id}" references unknown next stage "${stage.nextStageId}"`,
      });
    }

    for (const intentId of stage.validIntentIds) {
      if (!intentIds.has(intentId)) {
        issues.push({
          code: 'unknown_intent',
          id: intentId,
          message: `Journey stage "${stage.id}" references unknown intent "${intentId}"`,
        });
      }
    }
  }

  for (const archetype of catalog.venueArchetypes) {
    if (
      archetype.defaultJourneyStageId &&
      !stageIds.has(archetype.defaultJourneyStageId)
    ) {
      issues.push({
        code: 'unknown_stage',
        id: archetype.defaultJourneyStageId,
        message: `Venue archetype "${archetype.id}" references unknown default stage "${archetype.defaultJourneyStageId}"`,
      });
    }
    for (const modalityId of archetype.defaultAccessModalities) {
      if (!modalityIds.has(modalityId)) {
        issues.push({
          code: 'unknown_access_modality',
          id: modalityId,
          message: `Venue archetype "${archetype.id}" references unknown access modality "${modalityId}"`,
        });
      }
    }
  }

  const venueDefaultStages = catalog.links?.venueDefaultJourneyStage ?? {};
  for (const [venueArchetypeId, stageId] of Object.entries(venueDefaultStages)) {
    if (!venueArchetypeIds.has(venueArchetypeId as VisitVenueArchetypeId)) {
      issues.push({
        code: 'unknown_venue_archetype',
        id: venueArchetypeId,
        message: `Default stage mapping references unknown venue archetype "${venueArchetypeId}"`,
      });
    }
    if (!stageIds.has(stageId)) {
      issues.push({
        code: 'unknown_stage',
        id: stageId,
        message: `Venue archetype "${venueArchetypeId}" default stage "${stageId}" is undefined`,
      });
    }
  }

  const venueDefaultLoci = catalog.links?.venueDefaultPresenceLocus ?? {};
  for (const [venueArchetypeId, locusId] of Object.entries(venueDefaultLoci)) {
    if (!venueArchetypeIds.has(venueArchetypeId as VisitVenueArchetypeId)) {
      issues.push({
        code: 'unknown_venue_archetype',
        id: venueArchetypeId,
        message: `Default presence locus mapping references unknown venue archetype "${venueArchetypeId}"`,
      });
    }
    if (!locusIds.has(locusId)) {
      issues.push({
        code: 'unknown_presence_locus',
        id: locusId,
        message: `Venue archetype "${venueArchetypeId}" default presence locus "${locusId}" is undefined`,
      });
    }
  }

  const defaultStages = catalog.links?.populationDefaultStage ?? {};
  for (const [populationKind, stageId] of Object.entries(defaultStages)) {
    if (!populationIds.has(populationKind as PopulationKind)) {
      issues.push({
        code: 'unknown_population',
        id: populationKind,
        message: `Default stage mapping references unknown population kind "${populationKind}"`,
      });
    }
    if (!stageIds.has(stageId)) {
      issues.push({
        code: 'unknown_stage',
        id: stageId,
        message: `Population "${populationKind}" default stage "${stageId}" is undefined`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

export type { Visitor, VisitAspectRef };
