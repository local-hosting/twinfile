import type { ResearchSignalCategory, ResearchSignalUnit } from './research-signal.js';
import type { StrategyEntityLifecycle } from '../strategy/strategy.js';

/**
 * Shared research instrument (labels / unit / source) — authored once on AXM.
 * Per-PCM scores live in `signalValues` and hydrate to {@link ResearchSignal}.
 */
export type SignalDimension = {
  id: string;
  category: ResearchSignalCategory;
  label: string;
  unit: ResearchSignalUnit;
  group?: string;
  lowLabel?: string;
  highLabel?: string;
  source?: string;
  recordedAt?: string;
  lifecycle?: StrategyEntityLifecycle;
};
