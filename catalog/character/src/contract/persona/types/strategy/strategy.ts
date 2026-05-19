import type { StrategyHoneycombFacets } from './honeycomb.js';

export type StrategyEntityLifecycle = 'proposed' | 'validated' | 'deprecated';

export type ProductObjectiveKeyResult = {
  id?: string;
  text: string;
  metricId?: string;
  baseline?: number;
  target: number | string;
};

export type ProductObjective = {
  id: string;
  text: string;
  lifecycle?: StrategyEntityLifecycle;
  revisedAt?: string;
  facets?: StrategyHoneycombFacets;
  period?: string;
  keyResults?: ProductObjectiveKeyResult[];
};
