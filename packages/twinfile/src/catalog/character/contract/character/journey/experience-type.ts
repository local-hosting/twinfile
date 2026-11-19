import type { VisitPresenceLocus } from '../people/visitors/profile/visit-ids.js';
import type { VisitationGoal, VisitationSubGoal } from './touchpoints.schema.js';
import type {
  ExperienceRootCategory,
  ExperienceTypeCatalog,
  ExperienceTypeDefinition,
} from './experience-type.schema.js';

export interface ExperienceTypeCatalogIssue {
  code:
    | 'duplicate_type'
    | 'unknown_parent'
    | 'unknown_redirect'
    | 'redirect_cycle'
    | 'unresolved_root';
  message: string;
  typeId?: string;
}

export interface ExperienceTypeCatalogReport {
  valid: boolean;
  issues: ExperienceTypeCatalogIssue[];
}

export interface ExperienceVisitationMapping {
  rootCategory: ExperienceRootCategory;
  visitationGoal: VisitationGoal;
  visitationSubGoal: VisitationSubGoal;
}

/** Default MdVVP routing for each root experience family. */
export const EXPERIENCE_ROOT_VISITATION: Record<
  ExperienceRootCategory,
  ExperienceVisitationMapping
> = {
  performance: {
    rootCategory: 'performance',
    visitationGoal: 'consume',
    visitationSubGoal: 'watch',
  },
  presentation: {
    rootCategory: 'presentation',
    visitationGoal: 'consume',
    visitationSubGoal: 'learn',
  },
  programmed_experience: {
    rootCategory: 'programmed_experience',
    visitationGoal: 'converge',
    visitationSubGoal: 'explore',
  },
  dining: {
    rootCategory: 'dining',
    visitationGoal: 'converge',
    visitationSubGoal: 'visit',
  },
  broadcast: {
    rootCategory: 'broadcast',
    visitationGoal: 'consume',
    visitationSubGoal: 'watch',
  },
  visual_experience: {
    rootCategory: 'visual_experience',
    visitationGoal: 'consume',
    visitationSubGoal: 'learn',
  },
  commerce: {
    rootCategory: 'commerce',
    visitationGoal: 'converge',
    visitationSubGoal: 'visit',
  },
  gathering: {
    rootCategory: 'gathering',
    visitationGoal: 'converge',
    visitationSubGoal: 'visit',
  },
  wellness: {
    rootCategory: 'wellness',
    visitationGoal: 'consume',
    visitationSubGoal: 'learn',
  },
  sport: {
    rootCategory: 'sport',
    visitationGoal: 'consume',
    visitationSubGoal: 'watch',
  },
  learning: {
    rootCategory: 'learning',
    visitationGoal: 'consume',
    visitationSubGoal: 'learn',
  },
  exploration: {
    rootCategory: 'exploration',
    visitationGoal: 'converge',
    visitationSubGoal: 'explore',
  },
  civic_program: {
    rootCategory: 'civic_program',
    visitationGoal: 'connect',
    visitationSubGoal: 'friends',
  },
};

function typeById(
  catalog: ExperienceTypeCatalog,
): Map<string, ExperienceTypeDefinition> {
  return new Map(catalog.types.map((row) => [row.id, row]));
}

/** Validate hierarchical experience type catalogs shipped by consumer presets. */
export function validateExperienceTypeCatalog(
  catalog: ExperienceTypeCatalog,
): ExperienceTypeCatalogReport {
  const issues: ExperienceTypeCatalogIssue[] = [];
  const ids = new Set<string>();

  for (const type of catalog.types) {
    if (ids.has(type.id)) {
      issues.push({
        code: 'duplicate_type',
        message: `Duplicate experience type id "${type.id}"`,
        typeId: type.id,
      });
    }
    ids.add(type.id);
  }

  for (const type of catalog.types) {
    if (type.parentId && !ids.has(type.parentId)) {
      issues.push({
        code: 'unknown_parent',
        message: `Experience type "${type.id}" references unknown parent "${type.parentId}"`,
        typeId: type.id,
      });
    }
    if (type.redirectId && !ids.has(type.redirectId)) {
      issues.push({
        code: 'unknown_redirect',
        message: `Experience type "${type.id}" references unknown redirect "${type.redirectId}"`,
        typeId: type.id,
      });
    }
  }

  for (const type of catalog.types) {
    if (!type.redirectId) continue;
    const visited = new Set<string>([type.id]);
    let cursor = type.redirectId;
    while (cursor) {
      if (visited.has(cursor)) {
        issues.push({
          code: 'redirect_cycle',
          message: `Redirect cycle detected for experience type "${type.id}"`,
          typeId: type.id,
        });
        break;
      }
      visited.add(cursor);
      cursor = catalog.types.find((row) => row.id === cursor)?.redirectId ?? '';
    }
  }

  for (const type of catalog.types) {
    if (resolveExperienceRootCategory(catalog, type.id)) continue;
    issues.push({
      code: 'unresolved_root',
      message: `Experience type "${type.id}" has no resolvable root category`,
      typeId: type.id,
    });
  }

  return { valid: issues.length === 0, issues };
}

/** Follow redirect aliases to the canonical experience type id. */
export function resolveExperienceTypeId(
  catalog: ExperienceTypeCatalog,
  typeId: string,
): string {
  const lookup = typeById(catalog);
  const visited = new Set<string>();
  let cursor = typeId;

  while (cursor) {
    if (visited.has(cursor)) return typeId;
    visited.add(cursor);
    const row = lookup.get(cursor);
    if (!row?.redirectId) return cursor;
    cursor = row.redirectId;
  }

  return typeId;
}

/** Resolve the root category for a type by explicit field, root id, or parent walk. */
export function resolveExperienceRootCategory(
  catalog: ExperienceTypeCatalog,
  typeId: string,
): ExperienceRootCategory | undefined {
  const lookup = typeById(catalog);
  const canonicalId = resolveExperienceTypeId(catalog, typeId);
  const visited = new Set<string>();
  let cursor: string | undefined = canonicalId;

  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const row = lookup.get(cursor);
    if (!row) return undefined;
    if (row.rootCategory) return row.rootCategory;
    cursor = row.parentId;
  }

  return undefined;
}

/** Map an experience type to default MdVVP visitation intent. */
export function mapExperienceTypeToVisitation(
  catalog: ExperienceTypeCatalog,
  typeId: string,
): ExperienceVisitationMapping | undefined {
  const rootCategory = resolveExperienceRootCategory(catalog, typeId);
  if (!rootCategory) return undefined;
  return EXPERIENCE_ROOT_VISITATION[rootCategory];
}

/** Suggested presence locus from physical-only flags — consumers may override at observation time. */
export function experienceTypeLocusHint(
  catalog: ExperienceTypeCatalog,
  typeId: string,
): VisitPresenceLocus | 'any' {
  const lookup = typeById(catalog);
  const canonicalId = resolveExperienceTypeId(catalog, typeId);
  const row = lookup.get(canonicalId);
  if (row?.physicalOnly) return 'physical';
  return 'any';
}

/** Resolve a catalog slug to its canonical opaque experience type id. */
export function resolveExperienceIdBySlug(
  catalog: ExperienceTypeCatalog,
  slug: string,
): string | undefined {
  const row = catalog.types.find((candidate) => candidate.slug === slug);
  if (!row) return undefined;
  return resolveExperienceTypeId(catalog, row.id);
}

/** Value for the `content-type` visit attribute on goal and dwell events. */
export function contentTypeAttributeForExperience(
  catalog: ExperienceTypeCatalog,
  typeId: string,
): string {
  const canonicalId = resolveExperienceTypeId(catalog, typeId);
  const row = typeById(catalog).get(canonicalId);
  return row?.slug ?? canonicalId;
}
