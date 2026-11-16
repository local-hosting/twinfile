import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLANNING_HORIZON_DAYS,
  MIN_PLANNING_HORIZON_DAYS,
} from '../../src/contract/narrative/types/episode-arc.js';
import {
  resolvePlanningHorizonDays,
  resolveRandomPlanningHorizonDays,
} from '../../src/contract/narrative/episode/planning-horizon.js';

describe('resolvePlanningHorizonDays', () => {
  it('defaults to retail horizon', () => {
    expect(resolvePlanningHorizonDays()).toBe(DEFAULT_PLANNING_HORIZON_DAYS);
    expect(DEFAULT_PLANNING_HORIZON_DAYS).toBe(56);
    expect(MIN_PLANNING_HORIZON_DAYS).toBe(42);
  });

  it('samples horizon within contract bounds', () => {
    expect(resolveRandomPlanningHorizonDays(() => 0)).toBe(MIN_PLANNING_HORIZON_DAYS);
    expect(resolveRandomPlanningHorizonDays(() => 0.999)).toBe(DEFAULT_PLANNING_HORIZON_DAYS);
  });

  it('clamps and rounds finite requests', () => {
    expect(resolvePlanningHorizonDays(7)).toBe(42);
    expect(resolvePlanningHorizonDays(42)).toBe(42);
    expect(resolvePlanningHorizonDays(49)).toBe(49);
    expect(resolvePlanningHorizonDays(90)).toBe(56);
  });
});
