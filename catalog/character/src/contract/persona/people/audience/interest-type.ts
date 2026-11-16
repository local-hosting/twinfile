import type { VisitationGoal, VisitationSubGoal } from '../../journey/touchpoints.schema.js';
import {
  InterestTypeCatalogSchema,
  type InterestRootCategory,
  type InterestTypeCatalog,
  type InterestTypeDefinition,
} from './interest-type.schema.js';

export interface InterestTypeCatalogIssue {
  code:
    | 'duplicate_type'
    | 'unknown_parent'
    | 'unknown_redirect'
    | 'unknown_sibling'
    | 'redirect_cycle'
    | 'unresolved_root';
  message: string;
  typeId?: string;
}

export interface InterestTypeCatalogReport {
  valid: boolean;
  issues: InterestTypeCatalogIssue[];
}

export interface InterestVisitationMapping {
  rootCategory: InterestRootCategory;
  visitationGoal: VisitationGoal;
  visitationSubGoal: VisitationSubGoal;
}

export interface SamplePersonaInterestsOptions {
  count?: number;
  /** Limit sampling to specific root families. */
  roots?: readonly InterestRootCategory[];
  /** Prefer featured leaves when building believable exemplar personas. */
  preferFeatured?: boolean;
  /** When set, only sample leaves whose `themes` include this tag (e.g. `focus:internet`). */
  themeIncludes?: string;
  /** Guaranteed interest ids merged first (must exist in catalog). */
  seedIds?: readonly string[];
  /** Seeded PRNG — shuffles roots and picks within each family when provided. */
  random?: () => number;
}

/** Default MdVVP routing for each root interest family. */
export const INTEREST_ROOT_VISITATION: Record<
  InterestRootCategory,
  InterestVisitationMapping
> = {
  arts_culture: {
    rootCategory: 'arts_culture',
    visitationGoal: 'consume',
    visitationSubGoal: 'watch',
  },
  design_built_environment: {
    rootCategory: 'design_built_environment',
    visitationGoal: 'consume',
    visitationSubGoal: 'learn',
  },
  science_technology: {
    rootCategory: 'science_technology',
    visitationGoal: 'consume',
    visitationSubGoal: 'learn',
  },
  nature_environment: {
    rootCategory: 'nature_environment',
    visitationGoal: 'consume',
    visitationSubGoal: 'learn',
  },
  society_civics: {
    rootCategory: 'society_civics',
    visitationGoal: 'connect',
    visitationSubGoal: 'friends',
  },
  economy_work: {
    rootCategory: 'economy_work',
    visitationGoal: 'converge',
    visitationSubGoal: 'visit',
  },
  food_lifestyle: {
    rootCategory: 'food_lifestyle',
    visitationGoal: 'converge',
    visitationSubGoal: 'visit',
  },
  knowledge_media: {
    rootCategory: 'knowledge_media',
    visitationGoal: 'consume',
    visitationSubGoal: 'learn',
  },
};

function typeById(catalog: InterestTypeCatalog): Map<string, InterestTypeDefinition> {
  return new Map(catalog.types.map((row) => [row.id, row]));
}

function isRootRow(row: InterestTypeDefinition): boolean {
  return Boolean(row.rootCategory) && !row.parentId;
}

/** Validate hierarchical interest catalogs shipped by consumer presets. */
export function validateInterestTypeCatalog(
  catalog: InterestTypeCatalog,
): InterestTypeCatalogReport {
  const issues: InterestTypeCatalogIssue[] = [];
  const ids = new Set<string>();

  for (const type of catalog.types) {
    if (ids.has(type.id)) {
      issues.push({
        code: 'duplicate_type',
        message: `Duplicate interest type id "${type.id}"`,
        typeId: type.id,
      });
    }
    ids.add(type.id);
  }

  for (const type of catalog.types) {
    if (type.parentId && !ids.has(type.parentId)) {
      issues.push({
        code: 'unknown_parent',
        message: `Interest type "${type.id}" references unknown parent "${type.parentId}"`,
        typeId: type.id,
      });
    }
    if (type.redirectId && !ids.has(type.redirectId)) {
      issues.push({
        code: 'unknown_redirect',
        message: `Interest type "${type.id}" references unknown redirect "${type.redirectId}"`,
        typeId: type.id,
      });
    }
    for (const siblingId of type.siblingIds) {
      if (!ids.has(siblingId)) {
        issues.push({
          code: 'unknown_sibling',
          message: `Interest type "${type.id}" references unknown sibling "${siblingId}"`,
          typeId: type.id,
        });
      }
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
          message: `Redirect cycle detected for interest type "${type.id}"`,
          typeId: type.id,
        });
        break;
      }
      visited.add(cursor);
      cursor = catalog.types.find((row) => row.id === cursor)?.redirectId ?? '';
    }
  }

  for (const type of catalog.types) {
    if (resolveInterestRootCategory(catalog, type.id)) continue;
    issues.push({
      code: 'unresolved_root',
      message: `Interest type "${type.id}" has no resolvable root category`,
      typeId: type.id,
    });
  }

  return { valid: issues.length === 0, issues };
}

/** Follow redirect aliases to the canonical interest type id. */
export function resolveInterestTypeId(
  catalog: InterestTypeCatalog,
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

/** Resolve the root category for an interest by explicit field, root id, or parent walk. */
export function resolveInterestRootCategory(
  catalog: InterestTypeCatalog,
  typeId: string,
): InterestRootCategory | undefined {
  const lookup = typeById(catalog);
  const canonicalId = resolveInterestTypeId(catalog, typeId);
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

/** Map an interest to default MdVVP visitation intent. */
export function mapInterestToVisitation(
  catalog: InterestTypeCatalog,
  typeId: string,
): InterestVisitationMapping | undefined {
  const rootCategory = resolveInterestRootCategory(catalog, typeId);
  if (!rootCategory) return undefined;
  return INTEREST_ROOT_VISITATION[rootCategory];
}

/** Resolve a catalog slug to its canonical opaque interest id. */
export function resolveInterestIdBySlug(
  catalog: InterestTypeCatalog,
  slug: string,
): string | undefined {
  const row = catalog.types.find((candidate) => candidate.slug === slug);
  if (!row) return undefined;
  return resolveInterestTypeId(catalog, row.id);
}

/** Value for the `content-keyword` visit attribute when recording interest selections. */
export function contentKeywordForInterest(
  catalog: InterestTypeCatalog,
  typeId: string,
): string {
  const canonicalId = resolveInterestTypeId(catalog, typeId);
  const row = typeById(catalog).get(canonicalId);
  return row?.slug ?? canonicalId;
}

/** List sibling and themed related interests for persona expansion. */
export function relatedInterestIds(
  catalog: InterestTypeCatalog,
  typeId: string,
): string[] {
  const lookup = typeById(catalog);
  const canonicalId = resolveInterestTypeId(catalog, typeId);
  const row = lookup.get(canonicalId);
  if (!row) return [];

  const related = new Set<string>(row.siblingIds);
  if (row.themes.length > 0) {
    for (const candidate of catalog.types) {
      if (candidate.id === canonicalId || isRootRow(candidate)) continue;
      if (candidate.themes.some((theme) => row.themes.includes(theme))) {
        related.add(candidate.id);
      }
    }
  }

  related.delete(canonicalId);
  return [...related];
}

/** Sample distinct root-grounded interests for believable persona profiles. */
function interestMatchesThemeFilter(
  row: InterestTypeDefinition,
  themeIncludes: string | undefined,
): boolean {
  if (!themeIncludes) return true;
  return row.themes.includes(themeIncludes);
}

export function samplePersonaInterests(
  catalog: InterestTypeCatalog,
  options: SamplePersonaInterestsOptions = {},
): string[] {
  const count = options.count ?? 4;
  const preferFeatured = options.preferFeatured ?? true;
  const allowedRoots = options.roots ? new Set(options.roots) : undefined;
  const lookup = typeById(catalog);
  const picks: string[] = [];

  for (const seedId of options.seedIds ?? []) {
    const canonicalId = resolveInterestTypeId(catalog, seedId);
    if (!lookup.has(canonicalId)) continue;
    if (picks.includes(canonicalId)) continue;
    picks.push(canonicalId);
  }

  function collectByRoot(themeIncludes: string | undefined) {
    const grouped = new Map<InterestRootCategory, InterestTypeDefinition[]>();
    for (const row of catalog.types) {
      if (isRootRow(row)) continue;
      if (!interestMatchesThemeFilter(row, themeIncludes)) continue;
      const root = resolveInterestRootCategory(catalog, row.id);
      if (!root) continue;
      if (allowedRoots && !allowedRoots.has(root)) continue;
      const bucket = grouped.get(root) ?? [];
      bucket.push(row);
      grouped.set(root, bucket);
    }
    return grouped;
  }

  let byRoot = collectByRoot(options.themeIncludes);
  if (options.themeIncludes && byRoot.size === 0) {
    byRoot = collectByRoot(undefined);
  }

  const roots = [...byRoot.keys()];
  if (options.random) {
    for (let i = roots.length - 1; i > 0; i -= 1) {
      const j = Math.floor(options.random() * (i + 1));
      [roots[i], roots[j]] = [roots[j], roots[i]];
    }
  } else {
    roots.sort();
  }

  for (const root of roots) {
    if (picks.length >= count) break;
    const candidates = [...(byRoot.get(root) ?? [])].sort((a, b) => a.id.localeCompare(b.id));
    const featured = candidates.filter((row) => row.featured);
    const pool = preferFeatured && featured.length > 0 ? featured : candidates;
    if (pool.length === 0) continue;
    const index = options.random ? Math.floor(options.random() * pool.length) : 0;
    picks.push(resolveInterestTypeId(catalog, pool[index]!.id));
  }

  if (options.random && picks.length < count) {
    const remaining = catalog.types
      .filter((row) => !isRootRow(row))
      .map((row) => resolveInterestTypeId(catalog, row.id))
      .filter((id) => !picks.includes(id));
    while (picks.length < count && remaining.length > 0) {
      const index = Math.floor(options.random() * remaining.length);
      picks.push(remaining.splice(index, 1)[0]!);
    }
  }

  return picks.slice(0, count);
}

/** Merge a consumer overlay onto the general interest root catalog (overlay ids must be unique). */
export function mergeInterestTypeCatalogs(
  base: InterestTypeCatalog,
  overlay: InterestTypeCatalog,
): InterestTypeCatalog {
  const seen = new Set(base.types.map((row) => row.id));
  const merged = [...base.types];
  for (const row of overlay.types) {
    if (seen.has(row.id)) {
      throw new Error(`Interest overlay duplicates existing id "${row.id}"`);
    }
    merged.push(row);
    seen.add(row.id);
  }
  return InterestTypeCatalogSchema.parse({
    specVersion: '1.0',
    methodId: overlay.methodId ?? base.methodId,
    types: merged,
  });
}

/** Catalog of supported interest root families for documentation and UI pickers. */
export const INTEREST_ROOT_CATALOG: Readonly<
  Record<InterestRootCategory, { label: string; summary: string }>
> = {
  arts_culture: {
    label: 'Arts and culture',
    summary: 'Music, visual art, theatre, dance, and creative expression.',
  },
  design_built_environment: {
    label: 'Design and built environment',
    summary: 'Architecture, interiors, product design, and fashion.',
  },
  science_technology: {
    label: 'Science and technology',
    summary: 'Innovation, data, robotics, and emerging technology.',
  },
  nature_environment: {
    label: 'Nature and environment',
    summary: 'Climate, biodiversity, ecology, and natural systems.',
  },
  society_civics: {
    label: 'Society and civics',
    summary: 'Education, community, inclusion, health, and human rights.',
  },
  economy_work: {
    label: 'Economy and work',
    summary: 'Business, finance, entrepreneurship, and employment.',
  },
  food_lifestyle: {
    label: 'Food and lifestyle',
    summary: 'Food, travel, wellness, and daily life pursuits.',
  },
  knowledge_media: {
    label: 'Knowledge and media',
    summary: 'History, geography, books, news, and learning.',
  },
};
