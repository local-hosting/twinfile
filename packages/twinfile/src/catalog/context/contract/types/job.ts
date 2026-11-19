import type { HeartDimension } from './heart.js';
import type { StrategyHoneycombFacets } from './honeycomb.js';

export type StrategyEntityLifecycle = 'proposed' | 'validated' | 'deprecated';

/** MdVVP Five C goal — keep in sync with VisitationGoalSchema. */
export type VisitationGoal =
  | 'converge'
  | 'consume'
  | 'contribute'
  | 'collect'
  | 'connect';

/** MdVVP sub-goal — keep in sync with VisitationSubGoalSchema. */
export type VisitationSubGoal =
  | 'visit'
  | 'explore'
  | 'watch'
  | 'learn'
  | 'ideas'
  | 'things'
  | 'personalize'
  | 'play'
  | 'business'
  | 'friends';

/** Pain point / obstacle nested on a JTBD — ownership is this job. */
export type JobObstacle = {
  id: string;
  text: string;
  jobIds?: string[];
  removable?: boolean;
  severity?: 'mild' | 'serious' | 'severe' | 'systemic';
  heart?: HeartDimension;
  lifecycle?: StrategyEntityLifecycle;
};

/**
 * JTBD job — unit of user need.
 *
 * Canonical statement:
 * When [Context/Circumstance], I want to [Goal/Job], so I can [Outcome/Need]
 * without [Pain Point/Obstacle].
 */
export type Job = {
  id: string;
  text: string;
  shortText?: string;
  /** Context / circumstance that triggers progress. */
  context: string;
  /** Goal / job — progress sought. */
  goal: string;
  /** Outcome / need — definition of success. */
  outcome: string;
  /** Pain points / obstacles to avoid or remove. */
  obstacles?: JobObstacle[];
  lifecycle?: StrategyEntityLifecycle;
  revisedAt?: string;
  facets?: StrategyHoneycombFacets;
  persona?: string;
  segment?: string;
  /** MdVVP Five C goal this job advances when completed. */
  visitationGoal?: VisitationGoal;
  /** MdVVP sub-goal within the Five C category. */
  visitationSubGoal?: VisitationSubGoal;
  /** Instrumentation goal events that indicate progress on this job. */
  goalEventIds?: string[];
};
