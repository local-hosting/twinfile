import { createClock, parseInstant, type Clock } from './clock.js';
import { zonedToUtc } from './zone.js';
import type { ClockSpec } from '../types/twinfile-time.js';

/** Clamp and snap `t` to the scenario clock grid (same ticks as `clock.ticks()`). */
export function snapTToClock(t: number, clock: Clock): number {
  const clamped = Math.max(0, Math.min(clock.durationS, t));
  const maxIndex = Math.floor(clock.durationS / clock.stepS);
  const index = Math.min(maxIndex, Math.round(clamped / clock.stepS));
  return index * clock.stepS;
}

export function tFromInstant(instant: string, spec: ClockSpec): number {
  const startMs = parseInstant(spec.starts_at, 'clock.starts_at');
  const ms = parseInstant(instant, 'at');
  return (ms - startMs) / 1000;
}

/** Wall time in `timeZone` as `YYYY-MM-DDTHH:mm` for `<input type="datetime-local">`. */
export function formatLocalDateTime(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(ms));
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${pick('year')}-${pick('month')}-${pick('day')}T${pick('hour')}:${pick('minute')}`;
}

/** Parse `datetime-local` value as wall time in `timeZone`; returns epoch ms. */
export function parseLocalDateTime(value: string, timeZone: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) {
    throw new Error(`local time "${value}" expected YYYY-MM-DDTHH:mm`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;
  const secondOfDay = hour * 3600 + minute * 60 + second;
  return zonedToUtc(year, month, day, secondOfDay, timeZone);
}

export function createClockMeta(spec: ClockSpec): {
  clock: ClockSpec;
  durationS: number;
  stepS: number;
  tickCount: number;
  endsAt: string;
} {
  const clock = createClock(spec);
  const lastT = snapTToClock(clock.durationS, clock);
  return {
    clock: spec,
    durationS: clock.durationS,
    stepS: clock.stepS,
    tickCount: Math.floor(clock.durationS / clock.stepS) + 1,
    endsAt: clock.isoAt(lastT),
  };
}

export function resolveScrubT(
  spec: ClockSpec,
  query: { t?: number; at?: string; localAt?: string },
  timeZone: string,
): number {
  const clock = createClock(spec);
  let raw: number;
  if (query.at !== undefined) {
    raw = tFromInstant(query.at, spec);
  } else if (query.localAt !== undefined) {
    const ms = parseLocalDateTime(query.localAt, timeZone);
    raw = (ms - clock.startMs) / 1000;
  } else {
    raw = query.t ?? 0;
  }
  return snapTToClock(raw, clock);
}
