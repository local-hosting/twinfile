import { parseDurationToSeconds } from '@local-hosting/twinfile';
import type { ClockSpec } from '../types/twinfile-time.js';

const MAX_TICKS = 20_000;
const OFFSET_SUFFIX = /(?:Z|[+-]\d{2}:\d{2})$/;

export type Clock = {
  startMs: number;
  durationS: number;
  stepS: number;
  ticks(): Generator<number>;
  msAt(t: number): number;
  isoAt(t: number): string;
};

/** Parse an RFC 3339 instant; the offset is required so runs never depend on the host timezone. */
export function parseInstant(value: string, label: string): number {
  if (!OFFSET_SUFFIX.test(value)) {
    throw new Error(`${label} "${value}" needs an explicit UTC offset, e.g. 2026-06-12T09:00:00-04:00`);
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) throw new Error(`${label} "${value}" is not a valid RFC 3339 time`);
  return ms;
}

export function requireDurationSeconds(value: string, label: string): number {
  const seconds = parseDurationToSeconds(value);
  if (seconds === undefined || seconds <= 0) {
    throw new Error(`${label} "${value}" must be a positive ISO 8601 duration`);
  }
  return seconds;
}

export function createClock(spec: ClockSpec): Clock {
  const startMs = parseInstant(spec.starts_at, 'clock.starts_at');
  const durationS = requireDurationSeconds(spec.duration, 'clock.duration');
  const stepS = requireDurationSeconds(spec.step, 'clock.step');
  if (stepS > durationS) {
    throw new Error(`clock.step (${spec.step}) is longer than clock.duration (${spec.duration})`);
  }
  const tickCount = Math.floor(durationS / stepS) + 1;
  if (tickCount > MAX_TICKS) {
    throw new Error(`clock has ${tickCount} steps (max ${MAX_TICKS}); use a larger clock.step`);
  }

  return {
    startMs,
    durationS,
    stepS,
    *ticks() {
      for (let i = 0; i < tickCount; i += 1) yield i * stepS;
    },
    msAt: (t) => startMs + t * 1000,
    isoAt: (t) => new Date(startMs + t * 1000).toISOString(),
  };
}
