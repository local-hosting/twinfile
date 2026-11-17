import type { StrategyEntityLifecycle } from '../strategy/strategy.js';

export const RESEARCH_SIGNAL_CATEGORIES = [
  'attitude',
  'psychographic',
  'emotional-benefit',
  'switching-trigger',
  'switching-barrier',
  'switching-likelihood',
  'purchase-factor',
  'question',
  'reach',
  'demographic',
  'service-adoption',
] as const;

export type ResearchSignalCategory = (typeof RESEARCH_SIGNAL_CATEGORIES)[number];

/** `percent` is 0…100 share of respondents; `ratio` is a 0…1 position between two poles. */
export type ResearchSignalUnit = 'percent' | 'ratio';

/** Measured research value about one persona (survey share, attitude slider, adoption). */
export type ResearchSignal = {
  id: string;
  personaId: string;
  category: ResearchSignalCategory;
  label: string;
  value: number;
  unit: ResearchSignalUnit;
  /** Sub-axis within the category, e.g. `age`, `income`, `telecom`. */
  group?: string;
  /** Statement at ratio 0 — attitude sliders. */
  lowLabel?: string;
  /** Statement at ratio 1 — attitude sliders. */
  highLabel?: string;
  source?: string;
  recordedAt?: string;
  lifecycle?: StrategyEntityLifecycle;
};
