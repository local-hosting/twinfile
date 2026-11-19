import { asExportRecord, extRecord } from '../../authoring.js';
const asRecord = asExportRecord;
export function exportPlace(place) {
    const points = [
        ...(place.sensors ?? []).map((sensor) => ({
            id: sensor.id,
            type: sensor.brick ?? 'Sensor',
            name: sensor.name,
            space: sensor.space,
            ...extRecord(sensor),
        })),
        ...(place.assets ?? []).map((asset) => ({
            id: asset.id,
            type: asset.brick ?? asset.kind,
            name: asset.name,
            space: asset.space,
            ...extRecord(asset),
        })),
    ];
    return { 'points.json': `${JSON.stringify({ points }, null, 2)}\n` };
}
