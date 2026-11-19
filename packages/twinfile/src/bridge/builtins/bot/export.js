import { asExportRecord, extRecord } from '../../authoring.js';
const asRecord = asExportRecord;
export function exportPlace(place) {
    const storeys = (place.levels ?? []).map((level) => ({
        id: level.id,
        name: level.name,
        level: level.ordinal,
        ...extRecord(level),
    }));
    const spaces = (place.spaces ?? []).map((space) => ({
        id: space.id,
        name: space.name,
        storey: space.level,
        ...extRecord(space),
    }));
    return { 'building.json': `${JSON.stringify({ storeys, spaces }, null, 2)}\n` };
}
