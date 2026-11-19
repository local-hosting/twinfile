import {
  asImportRecord,
  packPlaceUnit,
  readImportName,
  twinId,
  unmappedExt,
  withImportExt,
  type ImportResult,
} from '../../authoring.js';

type Row = Record<string, unknown>;

export function importIfcProjection(input: unknown): ImportResult {
  const root = asImportRecord(input, 'ifc');
  const storeys = root.storeys;
  const ifcSpaces = root.spaces;
  if (!Array.isArray(storeys) || storeys.length === 0) throw new Error('ifc: storeys[] is required');
  if (!Array.isArray(ifcSpaces) || ifcSpaces.length === 0) throw new Error('ifc: spaces[] is required');

  const levels = storeys.map((item) => {
    const row = asImportRecord(item, 'ifc storey');
    const id = twinId(String(row.id ?? 'storey'));
    return withImportExt(
      { id, ordinal: Number(row.level ?? row.ordinal ?? 0), name: readImportName(row.name, id) },
      unmappedExt('ifc', 'levels', row, ['id', 'level', 'ordinal', 'name']),
    );
  });

  const spaces = ifcSpaces.map((item) => {
    const row = asImportRecord(item, 'ifc space');
    const id = twinId(String(row.id ?? 'space'));
    const level = typeof row.storey === 'string' ? twinId(row.storey) : undefined;
    const ifcType = typeof row.ifcType === 'string' ? row.ifcType : undefined;
    const kind = ifcType ? twinId(ifcType) : 'space';
    return withImportExt(
      {
        id,
        kind,
        name: readImportName(row.name, id),
        ...(level ? { level } : {}),
      },
      unmappedExt('ifc', 'spaces', row, ['id', 'name', 'storey', 'ifcType']),
    );
  });

  const placeName = readImportName(root.name, 'IFC building');
  const archetype = levels.length > 1 ? 'indoor_stack' : 'single_level';
  const ifcFile = typeof root.file === 'string' ? root.file : undefined;
  const site: Row = withImportExt(
    {
      name: placeName,
      kind: 'building',
      timezone: 'UTC',
      published: false,
      archetype,
    },
    {
      ...unmappedExt('ifc', 'place', root, ['name', 'storeys', 'spaces', 'file']),
      ...(ifcFile ? { ifc_file: ifcFile } : {}),
    },
  );

  return packPlaceUnit(twinId(placeName), 'museum', [{ place: site }, { levels }, { spaces }]);
}
