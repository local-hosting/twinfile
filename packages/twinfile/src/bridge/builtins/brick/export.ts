import { twinId, asExportRecord, extRecord, type FeedRow } from '../../authoring.js';

type Row = Record<string, unknown>;
const asRecord = asExportRecord;

export function exportPlace(place: Row): Record<string, string> {
  const points = [
    ...((place.sensors as Row[] | undefined) ?? []).map((sensor) => ({
      id: sensor.id,
      type: sensor.brick ?? 'Sensor',
      name: sensor.name,
      space: sensor.space,
      ...extRecord(sensor),
    })),
    ...((place.assets as Row[] | undefined) ?? []).map((asset) => ({
      id: asset.id,
      type: asset.brick ?? asset.kind,
      name: asset.name,
      space: asset.space,
      ...extRecord(asset),
    })),
  ];
  return { 'points.json': `${JSON.stringify({ points }, null, 2)}\n` };
}
