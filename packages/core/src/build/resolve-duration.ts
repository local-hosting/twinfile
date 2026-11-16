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

export function resolveTimeArg(
  value: unknown,
  eventsByName: Record<string, { twinfile: Record<string, unknown> }>,
): unknown {
  if (typeof value !== 'string') return value;
  if (!value.includes('.') && !value.startsWith('P') && !value.startsWith('-P')) return value;

  const timetableMatch = value.match(/^([a-z0-9-]+)\.([a-z0-9-]+)([+-].+)?$/);
  if (timetableMatch) {
    const [, eventName, mark, offset] = timetableMatch;
    const event = eventsByName[eventName ?? ''];
    const timetable = event?.twinfile.timetable;
    if (timetable && typeof timetable === 'object' && !Array.isArray(timetable)) {
      const markDur = (timetable as Record<string, unknown>)[mark ?? ''];
      if (typeof markDur === 'string') {
        let base = parseDurationToSeconds(markDur);
        if (base === undefined) return value;
        if (offset) {
          const offSec = parseDurationToSeconds(offset);
          if (offSec !== undefined) base += offSec;
        }
        return base;
      }
    }
  }

  const asDur = parseDurationToSeconds(value);
  if (asDur !== undefined) return asDur;
  return value;
}
