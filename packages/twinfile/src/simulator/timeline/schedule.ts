import { uniformUnitFromSha256Utf8 } from '../../core/build/digest.js';
import { requireDurationSeconds } from './clock.js';
import { localParts, shiftDate, weekdayOf, zonedToUtc } from './zone.js';
import type { ActiveSchedule, ScheduleDef } from '../types/twinfile-time.js';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

type WeeklyRule = {
  days: Set<number>;
  /** [start, end) in seconds since local midnight. */
  windows: Array<[number, number]>;
};

export type CompiledSchedule = {
  def: ScheduleDef;
  activeAt(ms: number): ActiveSchedule | undefined;
};

function dayIndex(token: string, when: string): number {
  const i = DAYS.indexOf(token);
  if (i < 0) throw new Error(`schedule when "${when}": unknown day "${token}"`);
  return i;
}

function parseDays(spec: string, when: string): Set<number> {
  const days = new Set<number>();
  for (const part of spec.split(',')) {
    const [from, to] = part.split('-');
    const a = dayIndex(from!, when);
    const b = to === undefined ? a : dayIndex(to, when);
    for (let d = a; ; d = (d + 1) % 7) {
      days.add(d);
      if (d === b) break;
    }
  }
  return days;
}

function parseClockTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h! * 3600 + m! * 60;
}

/** Opening-hours subset: `Mo,We,Fr 06:00-06:45; Sa 08:00-09:00`. Windows must end after they start. */
export function parseWeeklyHours(when: string): WeeklyRule[] {
  return when.split(';').map((raw) => {
    const rule = raw.trim();
    const space = rule.indexOf(' ');
    if (space < 0) throw new Error(`schedule when "${when}": expected "<days> <HH:MM-HH:MM>"`);
    const windows = rule
      .slice(space + 1)
      .split(',')
      .map((range): [number, number] => {
        const [from, to] = range.split('-');
        const start = parseClockTime(from!);
        const end = parseClockTime(to!);
        if (end <= start) throw new Error(`schedule when "${when}": ${range} must end after it starts`);
        return [start, end];
      });
    return { days: parseDays(rule.slice(0, space), when), windows };
  });
}

/** Deterministic lateness in [0, varianceS): first 4 bytes of sha256(seed:id:nominalStartIso). */
export function varianceOffsetSeconds(seed: number, id: string, nominalStartMs: number, varianceS: number): number {
  if (varianceS <= 0) return 0;
  const key = `${seed}:${id}:${new Date(nominalStartMs).toISOString()}`;
  return Math.floor(uniformUnitFromSha256Utf8(key) * varianceS);
}

export function compileSchedule(def: ScheduleDef, timeZone: string, seed: number): CompiledSchedule {
  const rules = parseWeeklyHours(def.when);
  const varianceS = def.variance ? requireDurationSeconds(def.variance.start, `schedule ${def.id} variance.start`) : 0;
  const lookbackDays = Math.ceil(varianceS / 86400) + 1;

  function activeAt(ms: number): ActiveSchedule | undefined {
    const today = localParts(ms, timeZone);
    for (let back = lookbackDays; back >= 0; back -= 1) {
      const [y, m, d] = shiftDate(today.year, today.month, today.day, -back);
      const weekday = weekdayOf(y, m, d);
      for (const rule of rules) {
        if (!rule.days.has(weekday)) continue;
        for (const [start, end] of rule.windows) {
          const nominalStart = zonedToUtc(y, m, d, start, timeZone);
          const shift = varianceOffsetSeconds(seed, def.id, nominalStart, varianceS) * 1000;
          const startMs = nominalStart + shift;
          const endMs = nominalStart + (end - start) * 1000 + shift;
          if (ms >= startMs && ms < endMs) {
            return {
              id: def.id,
              ...(def.uses ? { uses: def.uses } : {}),
              starts_at: new Date(startMs).toISOString(),
              ends_at: new Date(endMs).toISOString(),
            };
          }
        }
      }
    }
    return undefined;
  }

  return { def, activeAt };
}
