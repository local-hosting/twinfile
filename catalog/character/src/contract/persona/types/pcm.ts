import type { MentalModel } from './strategy/mental-model.js';
import type { Obstacle } from './story/obstacle.js';
import type { PCMCharacter } from './pcm-character.js';
import type { ResearchSignal } from './story/research-signal.js';
import type { Job } from '../../situations/index.js';
import type { ThinkingStyle } from './strategy/thinking-style.js';
import type { Journey } from './story/journey.js';
import type { ResearchQuote } from './story/quote.js';
import type { PcmInstanceVariationPolicy } from './story/pcm-instance-variation.js';
import type { PcmSegmentFacets } from './pcm-segment-facets.js';

/** Document header (`pcm.yml`). */
export type PCMDocument = {
  /** PCMSpec contract version (alias on disk: `pcmSpec`). */
  version: 1;
  id: string;
  title: string;
  /** Content revision for this character instance. */
  revision: number;
  summary?: string;
};

/**
 * Persona Character Model — one portable character (persona + story spine).
 * JTBD jobs live on JSM mounts; optional `jobs` here are character-local only.
 * Product cohorts / audiences stay on AXM, not PCM.
 */
export type PCM = PCMDocument & PcmSegmentFacets & {
  persona: PCMCharacter;
  /** Optional character-local JTBD jobs (prefer org JSM mounts). */
  jobs?: Job[];
  journeys?: Journey[];
  quotes?: ResearchQuote[];
  /** Skyline / matrix cognition for this twin only (`mental-models/`). */
  mentalModels?: MentalModel[];
  /** Interior thinking patterns for this twin (`thinking-styles/`). */
  thinkingStyles?: ThinkingStyle[];
  obstacles?: Obstacle[];
  signals?: ResearchSignal[];
  /**
   * Compact scores keyed by AXM {@link SignalDimension} id.
   * Hydrated to {@link signals} via {@link hydratePcmSignalsFromDimensions}.
   */
  signalValues?: Readonly<Record<string, number>>;
  quoteTaxonomy?: unknown;
  /** Host sampling policy for `materializePcmStoryInstance` (trait count, optional fields). */
  instanceVariation?: PcmInstanceVariationPolicy;
};
