import type { StrategyEntityLifecycle } from '../strategy/strategy.js';

/**
 * User-side research utterance — not product tone (`surface.brand.voice`).
 * Persona `quote` is a headline; the bank holds tagged evidence and stand-ins.
 */
export type ResearchQuote = {
  id: string;
  text: string;
  characterId: string;
  jobIds?: string[];
  journeyId?: string;
  phaseId?: string;
  momentId?: string;
  context?: string[];
  emotion?: string[];
  painpoint?: string;
  aspiration?: string;
  goal?: string;
  situation?: string;
  jtbdContext?: string;
  source?: string;
  lifecycle?: StrategyEntityLifecycle;
};

/** Canonical tag lists for quote tagging (`strategy/taxonomy.yml`). */
export type QuoteTaxonomy = {
  context?: string[];
  emotion?: string[];
  painpoint?: string[];
  aspiration?: string[];
};
