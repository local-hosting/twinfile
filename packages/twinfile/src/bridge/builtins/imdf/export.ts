import { twinId, asExportRecord, extRecord, type FeedRow } from '../../authoring.js';

type Row = Record<string, unknown>;
const asRecord = asExportRecord;

export function exportPlace(place: Row): Record<string, string> {
  const site = asRecord(place.place ?? {}, 'bundle place');
  const features: Row[] = [
    {
      type: 'Feature',
      id: twinId(String(site.name ?? 'venue')),
      feature_type: 'venue',
      properties: { name: site.name, category: site.kind, timezone: site.timezone, ...extRecord(site) },
    },
  ];
  for (const level of (place.levels as Row[] | undefined) ?? []) {
    features.push({
      type: 'Feature',
      id: level.id,
      feature_type: 'level',
      properties: { ordinal: level.ordinal, name: level.name, ...extRecord(level) },
    });
  }
  for (const space of (place.spaces as Row[] | undefined) ?? []) {
    features.push({
      type: 'Feature',
      id: space.id,
      feature_type: 'unit',
      properties: { name: space.name, category: space.kind, level_id: space.level, ...extRecord(space) },
    });
  }
  for (const opening of (place.openings as Row[] | undefined) ?? []) {
    features.push({
      type: 'Feature',
      id: opening.id,
      feature_type: 'opening',
      properties: { category: opening.kind, unit_ids: opening.connects, width: opening.width_m, ...extRecord(opening) },
    });
  }
  return { 'venue.json': `${JSON.stringify({ type: 'FeatureCollection', features }, null, 2)}\n` };
}
