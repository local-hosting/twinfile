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
  const root = asRecord(input, 'gltf');
  const path = typeof root.path === 'string' ? root.path : typeof root.file === 'string' ? root.file : undefined;
  if (!path) throw new Error('gltf: path or file is required');
  const nodeId = typeof root.node === 'string' ? root.node : 'root';
  const placeName = typeof root.name === 'string' ? root.name : 'Imported scene';
  const spaceId = twinId(typeof root.space === 'string' ? root.space : 'scene');
  const docs: Row[] = [
    {
      place: {
        name: placeName,
        kind: 'venue',
        timezone: 'UTC',
        published: false,
        archetype: 'single_level',
      },
    },
    {
      spaces: [
        withExt(
          {
            id: spaceId,
            kind: 'scene',
            name: placeName,
            geometry: { ref: `${path}#${nodeId}` },
          },
          unmappedExt('gltf', 'spaces', root, ['path', 'file', 'node', 'name', 'space']),
        ),
      ],
    },
  ];
  return packUnit(twinId(placeName), 'museum', docs);
}
