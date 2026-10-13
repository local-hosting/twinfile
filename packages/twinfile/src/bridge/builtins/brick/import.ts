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

export function importPlace(input: unknown): ImportResult {
  const root = asRecord(input, 'brick');
  const points = root.points;
  if (!Array.isArray(points) || points.length === 0) throw new Error('brick: points[] is required');
  const sensors: Row[] = [];
  const assets: Row[] = [];
  for (const point of points) {
    const row = asRecord(point, 'brick point');
    const iri = typeof row.type === 'string' ? row.type : typeof row.brick === 'string' ? row.brick : '';
    const typeName = localType(iri || 'point');
    const kind = kindFromToken(typeName, 'point');
    const id = twinId(String(row.id ?? typeName));
    const space = typeof row.space === 'string' ? twinId(row.space) : undefined;
    const brick = iri ? { brick: iri } : {};
    if (/sensor/i.test(typeName)) {
      sensors.push(
        withExt(
          {
            id,
            name: readName(row.name, id),
            observes: space ?? 'point',
            ...(space ? { space } : {}),
            ...brick,
          },
          notedCategory(unmappedExt('brick', 'sensors', row, ['id', 'type', 'brick', 'name', 'space']), kind.sourceCategory),
        ),
      );
    } else {
      assets.push(
        withExt(
          { id, kind: kind.kind, name: readName(row.name, id), ...(space ? { space } : {}), ...brick },
          notedCategory(unmappedExt('brick', 'assets', row, ['id', 'type', 'brick', 'name', 'space']), kind.sourceCategory),
        ),
      );
    }
  }
  const name = readName(root.name, 'Brick points');
  const docs: Row[] = [
    {
      place: {
        name,
        kind: 'building',
        timezone: 'UTC',
        published: false,
        archetype: 'single_level',
      },
    },
  ];
  if (sensors.length > 0) docs.push({ sensors });
  if (assets.length > 0) docs.push({ assets });
  return packUnit(twinId(name), 'museum', docs);
}
