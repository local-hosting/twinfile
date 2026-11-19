import { asExportRecord, extRecord } from '../../authoring.js';
const asRecord = asExportRecord;
export function exportPlace(place) {
    const stations = place.stations ?? [];
    const stationById = new Map(stations.map((station) => [String(station.id), station]));
    const stopSpaces = (place.spaces ?? []).filter((space) => space.kind === 'stop' || space.visit_order !== undefined);
    const rows = stopSpaces.length > 0 ? stopSpaces : stations;
    const routes = place.routes ?? [];
    const site = asRecord(place.place ?? {}, 'bundle place');
    const location = asRecord(site.location ?? { lat: 0, lng: 0 }, 'location');
    const stopLines = ['stop_id,stop_name,stop_lat,stop_lon,zone_id,location_type'];
    rows.forEach((space, index) => {
        const station = stationById.get(String(space.id));
        const ext = extRecord(station ?? space);
        const spaceExt = extRecord(space);
        const loc = station?.location && typeof station.location === 'object' ? station.location : undefined;
        const lat = loc?.lat ?? spaceExt.stop_lat ?? ext.stop_lat ?? (index === 0 ? location.lat : '');
        const lon = loc?.lng ?? spaceExt.stop_lon ?? ext.stop_lon ?? (index === 0 ? location.lng : '');
        const zone = ext.zone_id ?? spaceExt.zone_id ?? '';
        stopLines.push([space.id, space.name ?? space.id, lat, lon, zone, station ? '1' : '0'].join(','));
    });
    const shapeLines = ['shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled'];
    let traveled = 0;
    rows.forEach((space, index) => {
        const station = stationById.get(String(space.id));
        const loc = station?.location && typeof station.location === 'object' ? station.location : undefined;
        const spaceExt = extRecord(space);
        if (index > 0)
            traveled += Number(routes[index - 1]?.length_m ?? 0);
        const lat = loc?.lat ?? spaceExt.stop_lat ?? location.lat;
        const lon = loc?.lng ?? spaceExt.stop_lon ?? location.lng;
        shapeLines.push(['line', lat, lon, index + 1, traveled].join(','));
    });
    return { 'stops.txt': `${stopLines.join('\n')}\n`, 'shapes.txt': `${shapeLines.join('\n')}\n` };
}
