import type { CustomerCatalog } from '../customer/profile/customer.js';
import type { InterestTypeCatalog } from '../audience/interest-type.schema.js';
import type { PersonaCatalog, PersonaProfile } from '../audience/persona.schema.js';
import type { PersonaRelationshipGraph } from '../customer/graph/customer-relationships.js';
import { PersonaRelationshipGraphSchema } from '../customer/graph/customer-relationships.js';

export interface PersonaRelationshipIssue {
  code:
    | 'unknown_segment'
    | 'unknown_pain_point'
    | 'unknown_interest'
    | 'duplicate_persona_id';
  message: string;
  id?: string;
}

export function buildPersonaRelationshipGraph(persona: PersonaProfile): PersonaRelationshipGraph {
  const graph = {
    characterId: persona.id,
    edges: persona.segmentAffinities.map((affinity) => ({
      kind: 'persona_segment_affinity' as const,
      characterId: persona.id,
      segmentId: affinity.segmentId,
      weight: affinity.weight,
    })),
  };
  return PersonaRelationshipGraphSchema.parse(graph);
}

export function validatePersonaCatalogRelationships(
  catalog: PersonaCatalog,
  customerCatalog: CustomerCatalog,
  interestTypeCatalog?: InterestTypeCatalog,
): { valid: boolean; issues: PersonaRelationshipIssue[] } {
  const issues: PersonaRelationshipIssue[] = [];
  const segmentIds = new Set(customerCatalog.psychographicSegments.map((row) => row.id));
  const painPointIds = new Set(customerCatalog.painPoints.map((row) => row.id));
  const interestIds = interestTypeCatalog
    ? new Set(interestTypeCatalog.types.map((row) => row.id))
    : undefined;
  const seen = new Set<string>();

  for (const persona of catalog.personas) {
    if (seen.has(persona.id)) {
      issues.push({
        code: 'duplicate_persona_id',
        id: persona.id,
        message: `Duplicate persona id "${persona.id}"`,
      });
    }
    seen.add(persona.id);

    for (const affinity of persona.segmentAffinities) {
      if (!segmentIds.has(affinity.segmentId)) {
        issues.push({
          code: 'unknown_segment',
          id: affinity.segmentId,
          message: `Persona "${persona.id}" references unknown segment "${affinity.segmentId}"`,
        });
      }
    }

    for (const painPointId of persona.painPointIds) {
      if (!painPointIds.has(painPointId)) {
        issues.push({
          code: 'unknown_pain_point',
          id: painPointId,
          message: `Persona "${persona.id}" references unknown pain point "${painPointId}"`,
        });
      }
    }

    if (interestIds) {
      for (const interestId of persona.interestIds) {
        if (!interestIds.has(interestId)) {
          issues.push({
            code: 'unknown_interest',
            id: interestId,
            message: `Persona "${persona.id}" references unknown interest "${interestId}"`,
          });
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
