/** Strategy facet ids (Peter Morville UX honeycomb) — used on JSM user needs. */

export const HONEYCOMB_FACET_IDS = [
  'useful',
  'usable',
  'desirable',
  'findable',
  'accessible',
  'credible',
  'valuable',
] as const;

export type HoneycombFacetId = (typeof HONEYCOMB_FACET_IDS)[number];

export type StrategyHoneycombFacets = HoneycombFacetId[];

/** Inferred when `Job.facets` is omitted. */
export const DEFAULT_JOB_HONEYCOMB_FACETS: readonly HoneycombFacetId[] = [
  'useful',
  'valuable',
];

/** @deprecated Use {@link DEFAULT_JOB_HONEYCOMB_FACETS}. */
export const DEFAULT_NEED_HONEYCOMB_FACETS = DEFAULT_JOB_HONEYCOMB_FACETS;
