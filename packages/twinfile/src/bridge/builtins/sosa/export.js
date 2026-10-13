import { asExportRecord } from '../../authoring.js';
const asRecord = asExportRecord;
export function exportPlace(place, feed) {
    const row = feed ?? place.feed;
    if (!row)
        throw new Error('sosa export needs a feed row');
    const body = {
        type: 'Observation',
        featureOfInterest: row.device_id,
        observedProperty: row.observed_property,
        result: row.unit ? { numericValue: row.value, unit: row.unit } : row.value,
        phenomenonTime: row.observed_at,
        ...(row.available_at ? { resultTime: row.available_at } : {}),
        ...(row.ext ?? {}),
    };
    return { 'observation.json': `${JSON.stringify(body, null, 2)}\n` };
}
