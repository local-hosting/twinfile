import type { StrategyEntityLifecycle } from '../strategy/strategy.js';

/**
 * Demographics-free approach to one purpose (Indi Young). Layered onto mental model
 * windows via `MentalModelWindow.thinkingStyleIds`; worn per context by journeys/audiences.
 */
export type ThinkingStyle = {
  id: string;
  label: string;
  /** Mental model whose purpose scopes this style. */
  mentalModelId?: string;
  /** First-person statements describing the approach. */
  summary: string[];
  lifecycle?: StrategyEntityLifecycle;
};
