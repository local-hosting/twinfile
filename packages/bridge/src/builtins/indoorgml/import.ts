import {
  optionalCrosswalkValue,
  unmappedExt,
  geotypeSlugForMapping,
  asImportRecord,
  packPlaceUnit,
  readImportName,
  twinId,
  withImportExt,
  kindFromToken,
  type ImportResult,
} from '../../authoring.js';

type Row = Record<string, unknown>;

const asRecord = asImportRecord;
const readName = readImportName;
const withExt = withImportExt;
const packUnit = packPlaceUnit;

const INDOORGML_SCHEMA = 'twinfile.bridge.indoorgml.v1';

function cellRows(root: Row): Row[] {
  const list = root.cellSpaces ?? root.CellSpace ?? root.cells;
  if (!Array.isArray(list)) throw new Error('indoorgml: cellSpaces[] is required');
  return list.map((item, index) => asRecord(item, `indoorgml cellSpace ${index}`));
}

function transitionRows(root: Row): Row[] {
  const list = root.transitions ?? root.Transition;
  return Array.isArray(list) ? list.map((item, index) => asRecord(item, `indoorgml transition ${index}`)) : [];
}

function routeRows(root: Row): Row[] {
  const list = root.statePaths ?? root.routes ?? root.StateConnection;
  return Array.isArray(list) ? list.map((item, index) => asRecord(item, `indoorgml route ${index}`)) : [];
}

function levelRows(root: Row): Row[] {
  const list = root.levels ?? root.Level;
  if (!Array.isArray(list)) return [];
  return list.map((item, index) => asRecord(item, `indoorgml level ${index}`));
}

function spaceKind(row: Row): string {
  const className =
    typeof row.class === 'string'
      ? row.class
      : typeof row.cellClass === 'string'
        ? row.cellClass
        : typeof row.type === 'string'
          ? row.type
          : undefined;
  if (className) {
    const mapped = optionalCrosswalkValue('indoorgml', 'class', 'spaces', 'kind', className);
    if (mapped) return mapped;
    return kindFromToken(className, 'space').kind;
  }
  return 'space';
}

export function importPlace(input: unknown): ImportResult {
  const root = asRecord(input, 'indoorgml');
  if (root.schema && root.schema !== INDOORGML_SCHEMA) {
    throw new Error(`indoorgml: unsupported schema ${String(root.schema)}`);
  }
  const levels = levelRows(root).map((row) => {
    const id = twinId(String(row.id ?? row['gml:id'] ?? 'level'));
    return withExt(
      {
        id,
        ordinal: Number(row.ordinal ?? row.z ?? 0),
        name: readName(row.name, id),
      },
      unmappedExt('indoorgml', 'levels', row, ['id', 'ordinal', 'z', 'name', 'gml:id']),
    );
  });
  const levelIds = new Set(levels.map((level) => String(level.id)));
  const spaces = cellRows(root).map((row) => {
    const id = twinId(String(row.id ?? row['gml:id'] ?? 'cell'));
    const level = typeof row.level === 'string' ? twinId(row.level) : undefined;
    const parent = typeof row.parent === 'string' ? twinId(row.parent) : undefined;
    const kind = spaceKind(row);
    const roles: string[] = [];
    if (kind === 'anchor' || row.anchor === true) roles.push('anchor');
    const className = typeof row.class === 'string' ? row.class : undefined;
    if (className === 'Anchor' && !roles.includes('anchor')) roles.push('anchor');
    const ext = unmappedExt('indoorgml', 'spaces', row, [
      'id',
      'gml:id',
      'name',
      'class',
      'cellClass',
      'type',
      'level',
      'parent',
      'anchor',
      'state',
      'stateId',
      'layer',
      'layerId',
    ]);
    if (typeof row.state === 'string' || typeof row.stateId === 'string') {
      ext.indoorgml = {
        ...(ext.indoorgml as Record<string, unknown> | undefined),
        state: row.state ?? row.stateId,
      };
    }
    if (typeof row.layer === 'string' || typeof row.layerId === 'string') {
      ext.indoorgml = {
        ...(ext.indoorgml as Record<string, unknown> | undefined),
        layer: row.layer ?? row.layerId,
      };
    }
    return withExt(
      {
        id,
        kind,
        name: readName(row.name, id),
        ...(level && levelIds.has(level) ? { level } : {}),
        ...(parent ? { parent } : {}),
        ...(roles.length ? { roles } : {}),
      },
      ext,
    );
  });
  const openings: Row[] = [];
  const routes: Row[] = [];
  for (const row of transitionRows(root)) {
    const id = twinId(String(row.id ?? row['gml:id'] ?? 'transition'));
    const connects = row.connects ?? row.adjacentCells;
    const from = typeof row.from === 'string' ? twinId(row.from) : undefined;
    const to = typeof row.to === 'string' ? twinId(row.to) : undefined;
    const length =
      typeof row.length_m === 'number' ? row.length_m : typeof row.length === 'number' ? row.length : undefined;
    const usage = typeof row.usage === 'string' ? row.usage.toLowerCase() : '';
    const asRoute = usage.includes('corridor') || usage.includes('path') || usage === 'route' || Boolean(length);
    if (from && to && (asRoute || length)) {
      const kind = optionalCrosswalkValue('indoorgml', 'usage', 'routes', 'kind', usage) ?? 'corridor';
      routes.push(
        withExt(
          {
            id,
            name: readName(row.name, id),
            from,
            to,
            length_m: length ?? 1,
            kind,
            step_free: row.step_free === true,
          },
          unmappedExt('indoorgml', 'routes', row, ['id', 'gml:id', 'name', 'from', 'to', 'length', 'length_m', 'usage', 'connects']),
        ),
      );
      continue;
    }
    if (!Array.isArray(connects) || connects.length !== 2) {
      throw new Error(`indoorgml transition ${id}: expected connects[2] or from/to with length`);
    }
    const kind = optionalCrosswalkValue('indoorgml', 'usage', 'openings', 'kind', usage) ?? kindFromToken(usage || 'door', 'door').kind;
    openings.push(
      withExt(
        {
          id,
          kind,
          connects: connects.map((item) => twinId(String(item))),
          width_m: typeof row.width_m === 'number' ? row.width_m : typeof row.width === 'number' ? row.width : 1,
          state: row.state === 'closed' ? 'closed' : 'open',
        },
        unmappedExt('indoorgml', 'openings', row, ['id', 'gml:id', 'usage', 'connects', 'adjacentCells', 'state', 'from', 'to']),
      ),
    );
  }
  for (const row of routeRows(root)) {
    const id = twinId(String(row.id ?? 'path'));
    const from = typeof row.from === 'string' ? twinId(row.from) : undefined;
    const to = typeof row.to === 'string' ? twinId(row.to) : undefined;
    if (!from || !to) throw new Error(`indoorgml statePath ${id}: from and to are required`);
    const usage = typeof row.usage === 'string' ? row.usage.toLowerCase() : '';
    routes.push(
      withExt(
        {
          id,
          name: readName(row.name, id),
          from,
          to,
          length_m: typeof row.length_m === 'number' ? row.length_m : Number(row.length ?? 1),
          kind: optionalCrosswalkValue('indoorgml', 'usage', 'routes', 'kind', usage) ?? 'corridor',
          step_free: row.step_free === true || usage.includes('wheelchair'),
        },
        unmappedExt('indoorgml', 'routes', row, ['id', 'name', 'from', 'to', 'length', 'length_m', 'usage', 'step_free']),
      ),
    );
  }
  const placeMeta = asRecord(root.place ?? {}, 'indoorgml place');
  const venueName = readName(placeMeta.name ?? root.name, 'IndoorGML place');
  const venueKind = typeof placeMeta.kind === 'string' ? placeMeta.kind : 'building';
  const archetype = levels.length > 1 ? 'indoor_stack' : 'single_level';
  const interLayer = root.interLayerConnections ?? root.InterLayerConnection;
  const layers = root.layers ?? root.MultiLayer;
  const siteExt = unmappedExt('indoorgml', 'place', { ...placeMeta, ...root }, [
    'schema',
    'name',
    'place',
    'cellSpaces',
    'transitions',
    'statePaths',
    'routes',
    'levels',
  ]);
  if (Array.isArray(interLayer)) siteExt.indoorgml = { ...(siteExt.indoorgml as object), interLayerConnections: interLayer };
  if (Array.isArray(layers)) siteExt.indoorgml = { ...(siteExt.indoorgml as object), layers };
  const geotype =
    typeof root.geotype === 'string'
      ? root.geotype
      : geotypeSlugForMapping('indoorgml', venueKind) ?? 'office';
  const site = withExt(
    {
      name: venueName,
      kind: venueKind,
      timezone: typeof placeMeta.timezone === 'string' ? placeMeta.timezone : 'UTC',
      published: false,
      archetype,
    },
    siteExt,
  );
  const docs: Row[] = [{ place: site }];
  if (levels.length) docs.push({ levels });
  if (spaces.length) docs.push({ spaces });
  if (openings.length) docs.push({ openings });
  if (routes.length) docs.push({ routes });
  return packUnit(twinId(venueName), geotype, docs);
}
