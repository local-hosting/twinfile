const formatters = new Map<string, Intl.DateTimeFormat>();

export type LocalParts = {
  year: number;
  month: number;
  day: number;
  /** Seconds since local midnight. */
  secondOfDay: number;
};

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, fmt);
  }
  return fmt;
}

export function localParts(ms: number, timeZone: string): LocalParts {
  const parts: Record<string, number> = {};
  for (const p of formatterFor(timeZone).formatToParts(new Date(ms))) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year!,
    month: parts.month!,
    day: parts.day!,
    secondOfDay: parts.hour! * 3600 + parts.minute! * 60 + parts.second!,
  };
}

/** Monday = 0 … Sunday = 6 for a calendar date. */
export function weekdayOf(year: number, month: number, day: number): number {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/** Calendar date `offsetDays` away, independent of timezone. */
export function shiftDate(year: number, month: number, day: number, offsetDays: number): [number, number, number] {
  const d = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
}

function offsetMs(ms: number, timeZone: string): number {
  const p = localParts(ms, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day) + p.secondOfDay * 1000;
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** UTC instant for a local wall-clock time; second pass settles DST transitions. */
export function zonedToUtc(year: number, month: number, day: number, secondOfDay: number, timeZone: string): number {
  const wall = Date.UTC(year, month - 1, day) + secondOfDay * 1000;
  const first = wall - offsetMs(wall, timeZone);
  return wall - offsetMs(first, timeZone);
}
