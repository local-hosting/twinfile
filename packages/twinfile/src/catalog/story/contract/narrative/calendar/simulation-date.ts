const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDateString(value: string): boolean {
  return ISO_DATE_PATTERN.test(value);
}

export function parseIsoDateUtc(isoDate: string): Date {
  if (!isIsoDateString(isoDate)) {
    throw new Error(`Invalid ISO date "${isoDate}" — expected YYYY-MM-DD`);
  }
  return new Date(`${isoDate}T12:00:00.000Z`);
}

/** ISO calendar date for simulation `dayIndex` relative to `simulationEpochStart` (day 0). */
export function simulationDateIso(dayIndex: number, simulationEpochStart: string): string {
  const start = parseIsoDateUtc(simulationEpochStart);
  start.setUTCDate(start.getUTCDate() + dayIndex);
  return start.toISOString().slice(0, 10);
}
