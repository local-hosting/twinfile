import { twinId, asExportRecord, extRecord, type FeedRow } from '../../authoring.js';

type Row = Record<string, unknown>;
const asRecord = asExportRecord;

export function exportPlace(place: Row): Record<string, string> {
  const storeys = ((place.levels as Row[] | undefined) ?? []).map((level) => ({
    id: level.id,
    name: level.name,
    level: level.ordinal,
    ...extRecord(level),
  }));
  const spaces = ((place.spaces as Row[] | undefined) ?? []).map((space) => ({
    id: space.id,
    name: space.name,
    storey: space.level,
    ...extRecord(space),
  }));
  return { 'building.json': `${JSON.stringify({ storeys, spaces }, null, 2)}\n` };
}
