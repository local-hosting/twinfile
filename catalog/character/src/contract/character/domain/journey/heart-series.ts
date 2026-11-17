import {
  HEART_DIMENSIONS,
  type HeartDimension,
  type HeartImpact,
  type JourneyHeartPoint,
  type JourneyHeartTrend,
} from '../../types/story/heart.js';
import type { Journey, JourneyPhase } from '../../types/story/journey.js';
import type { JourneyObstacleEncounter, JourneyObstacleOutcome, Obstacle } from '../../types/story/obstacle.js';

/** A dimension ending at or above this counts as "maintained high". */
export const HEART_MAINTAINED_HIGH = 0.8;

const DEFAULT_BASELINE = 0.5;
const DEFAULT_DIMENSION: HeartDimension = 'task-success';

const OUTCOME_DELTA: Record<JourneyObstacleOutcome, number> = {
  overcome: 0.1,
  workaround: -0.05,
  blocked: -0.2,
  abandoned: -0.3,
};

const clamp = (value: number): number => Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;

/** Explicit `heartImpacts`, else the obstacle's HEART dimension moved by the outcome. */
export function obstacleEncounterImpacts(
  encounter: JourneyObstacleEncounter,
  obstacleById: Map<string, Obstacle>,
): HeartImpact[] {
  if (encounter.heartImpacts?.length) {
    return encounter.heartImpacts;
  }
  const dimension = obstacleById.get(encounter.obstacleId)?.heart ?? DEFAULT_DIMENSION;
  return [{ dimension, delta: OUTCOME_DELTA[encounter.outcome] }];
}

/** Encounters on a phase and its moments, in moment order. */
export function phaseObstacleEncounters(phase: JourneyPhase): JourneyObstacleEncounter[] {
  const moments = [...(phase.moments ?? [])].sort((a, b) => a.order - b.order);
  return [...(phase.obstacles ?? []), ...moments.flatMap((m) => m.obstacles ?? [])];
}

function baselineValues(journey: Journey): Record<HeartDimension, number> {
  return Object.fromEntries(
    HEART_DIMENSIONS.map((d) => [d, journey.heartBaseline?.[d] ?? DEFAULT_BASELINE]),
  ) as Record<HeartDimension, number>;
}

/** HEART values (0…1) after each phase — obstacle outcomes accumulate over the journey. */
export function journeyHeartSeries(journey: Journey, obstacles: Obstacle[]): JourneyHeartPoint[] {
  const obstacleById = new Map(obstacles.map((o) => [o.id, o]));
  const values = baselineValues(journey);
  const phases = [...journey.phases].sort((a, b) => a.order - b.order);
  return phases.map((phase) => {
    for (const encounter of phaseObstacleEncounters(phase)) {
      for (const impact of obstacleEncounterImpacts(encounter, obstacleById)) {
        values[impact.dimension] = clamp(values[impact.dimension] + impact.delta);
      }
    }
    return { phaseId: phase.id, values: { ...values } };
  });
}

/** Start → end per HEART dimension the journey's obstacles move; healthy = up or held high. */
export function journeyHeartTrends(journey: Journey, obstacles: Obstacle[]): JourneyHeartTrend[] {
  const obstacleById = new Map(obstacles.map((o) => [o.id, o]));
  const moved = new Set(
    journey.phases.flatMap((phase) =>
      phaseObstacleEncounters(phase).flatMap((e) =>
        obstacleEncounterImpacts(e, obstacleById).map((i) => i.dimension),
      ),
    ),
  );
  const series = journeyHeartSeries(journey, obstacles);
  const start = baselineValues(journey);
  const end = series.at(-1)?.values ?? start;
  return HEART_DIMENSIONS.filter((d) => moved.has(d)).map((dimension) => ({
    dimension,
    start: start[dimension],
    end: end[dimension],
    healthy: end[dimension] >= start[dimension] || end[dimension] >= HEART_MAINTAINED_HIGH,
  }));
}
