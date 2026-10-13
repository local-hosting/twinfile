import type { HeartDimension, HeartImpact } from '../story/heart.js';
import type { MentalModelHarmLevel } from '../strategy/mental-model.js';
import type { StrategyEntityLifecycle } from '../strategy/strategy.js';

/** Something that stands between a person and their JTBD job. */
export type Obstacle = {
  id: string;
  text: string;
  jobIds?: string[];
  /** False when the org cannot remove it (e.g. weather); defaults to true. */
  removable?: boolean;
  severity?: MentalModelHarmLevel;
  /** HEART dimension this obstacle mainly moves. */
  heart?: HeartDimension;
  lifecycle?: StrategyEntityLifecycle;
};

export type JourneyObstacleOutcome = 'overcome' | 'workaround' | 'blocked' | 'abandoned';

/** An obstacle met at a journey phase or moment, and how the person fared. */
export type JourneyObstacleEncounter = {
  obstacleId: string;
  outcome: JourneyObstacleOutcome;
  /** Scope features / content that helped the person past it. */
  overcomeWith?: string[];
  /** Overrides the default impact derived from `Obstacle.heart` + `outcome`. */
  heartImpacts?: HeartImpact[];
};
