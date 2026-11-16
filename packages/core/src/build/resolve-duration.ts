import type { SceneSchedule } from '../types/place-run-preset.js';

/** Parse ISO-8601 duration (subset) or integer seconds to seconds. */
export function parseDurationToSeconds(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (!trimmed.startsWith('P') && !trimmed.startsWith('-P')) return undefined;

  const neg = trimmed.startsWith('-');
  const body = neg ? trimmed.slice(1) : trimmed;
  const timePart = body.includes('T') ? body.split('T')[1] : '';
  const datePart = body.includes('T') ? body.split('T')[0] : body;

  let seconds = 0;
  const dateMatch = datePart.match(/P(?:(\d+)D)?(?:(\d+)W)?/);
  if (dateMatch) {
    const days = Number(dateMatch[1] ?? 0) + Number(dateMatch[2] ?? 0) * 7;
    seconds += days * 86400;
  }
  const timeMatch = timePart.match(/(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (timeMatch) {
    seconds += Number(timeMatch[1] ?? 0) * 3600;
    seconds += Number(timeMatch[2] ?? 0) * 60;
    seconds += Number(timeMatch[3] ?? 0);
  }
  return neg ? -seconds : seconds;
}

/** Resolve `<event>.<phase>[±offset]` against the scene schedule, or an ISO duration, to seconds. */
export function resolveTimeArg(value: unknown, schedule: SceneSchedule): unknown {
  if (typeof value !== 'string') return value;
  if (!value.includes('.') && !value.startsWith('P') && !value.startsWith('-P')) return value;

  const phaseRef = value.match(/^([a-z0-9-]+)\.([a-z0-9-]+)([+-].+)?$/);
  const phaseDur = phaseRef ? schedule[phaseRef[1] ?? '']?.[phaseRef[2] ?? ''] : undefined;
  if (phaseRef && typeof phaseDur === 'string') {
    const base = parseDurationToSeconds(phaseDur);
    if (base === undefined) return value;
    const offset = phaseRef[3] ? parseDurationToSeconds(phaseRef[3]) : undefined;
    return base + (offset ?? 0);
  }

  return parseDurationToSeconds(value) ?? value;
}
