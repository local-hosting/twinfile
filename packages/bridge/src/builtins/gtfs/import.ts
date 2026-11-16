import {
  crosswalkValue,
  optionalCrosswalkValue,
  unmappedExt,
  geotypeSlugForMapping,
  asImportRecord,
  packPlaceUnit,
  readImportName,
  twinId,
  withImportExt,
  kindFromToken,
  notedCategory,
  parseCsv,
  haversine,
  isStationStop,
  stepFreeKind,
  localType,
  localKey,
  normalizeKeys,
  type ImportResult,
} from '../../authoring.js';

type Row = Record<string, unknown>;
type FeedRow = Record<string, unknown>;

const asRecord = asImportRecord;
const readName = readImportName;
const withExt = withImportExt;
const packUnit = packPlaceUnit;

export type GtfsInput = { stops: string; shapes: string; pathways?: string };

export function importPlace(input: unknown): ImportResult {
  const gtfs = input as GtfsInput;
  const stops = parseCsv(gtfs.stops, 'gtfs stops');
  const shapeRows = parseCsv(gtfs.shapes, 'gtfs shapes');
  const pathways = gtfs.pathways ? parseCsv(gtfs.pathways, 'gtfs pathways') : [];
  if (stops.length < 2) throw new Error('gtfs: a line needs at least two stops');
  const shapeIds = new Set(shapeRows.map((row) => String(row.shape_id)));
  if (shapeIds.size !== 1) throw new Error('gtfs: expected a shape that is one line');
  const shapeId = [...shapeIds][0] ?? 'line';
  const stopById = new Map(stops.map((stop) => [String(stop.stop_id), stop]));
  const spaces = stops.map((stop, index) => {
    const id = twinId(String(stop.stop_id));
    return withExt(
      {
        id,
        kind: 'stop',
        name: String(stop.stop_name || id),
        visit_order: index,
      },
      unmappedExt('gtfs', 'spaces', stop, [
        'stop_id',
        'stop_name',
        'location_type',
        ...(isStationStop(stop) ? ['stop_lat', 'stop_lon'] : []),
      ]),
    );
  });
  const stations = stops.filter(isStationStop).map((stop) => {
    const id = twinId(String(stop.stop_id));
    const lat = Number(stop.stop_lat);
    const lng = Number(stop.stop_lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error(`gtfs station ${id}: stop_lat and stop_lon are required`);
    return withExt(
      { id, name: String(stop.stop_name || id), location: { lat, lng } },
      unmappedExt('gtfs', 'stations', stop, ['stop_id', 'stop_name', 'stop_lat', 'stop_lon', 'location_type']),
    );
  });
  const routes = pathways.map((pathway) => {
    const id = twinId(String(pathway.pathway_id || 'pathway'));
    const from = twinId(String(pathway.from_stop_id));
    const to = twinId(String(pathway.to_stop_id));
    const mode = String(pathway.pathway_mode ?? '');
    const kind = crosswalkValue('gtfs', 'pathway_mode', 'routes', 'kind', mode);
    const written = Number(pathway.length);
    const fromStop = stopById.get(String(pathway.from_stop_id));
    const toStop = stopById.get(String(pathway.to_stop_id));
    const length =
      Number.isFinite(written) && written > 0
        ? written
        : haversine(Number(fromStop?.stop_lat), Number(fromStop?.stop_lon), Number(toStop?.stop_lat), Number(toStop?.stop_lon));
    if (!Number.isFinite(length) || length <= 0) throw new Error(`gtfs pathway ${id}: length is required`);
    return withExt(
      { id, from, to, length_m: length, kind, step_free: stepFreeKind(kind) },
      unmappedExt('gtfs', 'routes', pathway, ['pathway_id', 'from_stop_id', 'to_stop_id', 'pathway_mode', 'length']),
    );
  });
  const first = stops[0]!;
  const site = {
    name: `Line ${shapeId}`,
    kind: 'transit',
    timezone: 'UTC',
    published: false,
    archetype: 'linear',
    authoring_scale: { linear_unit: 'm', space_granularity: 'zone' },
    location: { lat: Number(first.stop_lat), lng: Number(first.stop_lon) },
  };
  const docs: Row[] = [{ place: site }, { spaces }];
  if (routes.length > 0) docs.push({ routes });
  if (stations.length > 0) docs.push({ stations });
  return packUnit(twinId(shapeId), geotypeSlugForMapping('gtfs', 'station') ?? 'train_station', docs);
}
// cast inside

