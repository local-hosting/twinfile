/** Strategy facet ids (Peter Morville UX honeycomb). */

export const HONEYCOMB_FACET_IDS = [
  "useful",
  "usable",
  "desirable",
  "findable",
  "accessible",
  "credible",
  "valuable",
] as const;

export type HoneycombFacetId = (typeof HONEYCOMB_FACET_IDS)[number];

export type StrategyHoneycombFacets = HoneycombFacetId[];

/** Inferred when `UserNeed.facets` is omitted (Grade + graph). */
export const DEFAULT_NEED_HONEYCOMB_FACETS: readonly HoneycombFacetId[] = [
  "useful",
  "valuable",
];

/** Inferred when `ProductObjective.facets` is omitted. */
export const DEFAULT_OBJECTIVE_HONEYCOMB_FACETS: readonly HoneycombFacetId[] = [
  "valuable",
  "credible",
];

export type StrategyNeedFacetEdge = {
  kind: "strategy_need_facet";
  from: string;
  to: HoneycombFacetId;
};

export type StrategyObjectiveFacetEdge = {
  kind: "strategy_objective_facet";
  from: string;
  to: HoneycombFacetId;
};

export type StrategyFacetEdge = StrategyNeedFacetEdge | StrategyObjectiveFacetEdge;
