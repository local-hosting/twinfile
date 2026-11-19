import { asExportRecord, extRecord, type FeedRow } from '../../authoring.js';

type Row = Record<string, unknown>;
const asRecord = asExportRecord;

function cellClass(space: Row): string {
  if (space.kind === 'anchor' || (space.roles as string[] | undefined)?.includes('anchor')) return 'Anchor';
  const ext = extRecord(space);
  const ig = ext.indoorgml as { cellClass?: string } | undefined;
  if (typeof ig?.cellClass === 'string') return ig.cellClass;
  if (typeof space.kind === 'string' && space.kind !== 'space') {
    return space.kind.charAt(0).toUpperCase() + space.kind.slice(1);
  }
  return 'Space';
}

export function exportPlace(place: Row, _feed?: FeedRow): Record<string, string> {
  const site = asRecord(place.place ?? {}, 'bundle place');
  const siteExt = extRecord(site);
  const igSite = siteExt.indoorgml as Record<string, unknown> | undefined;
  const levels = (place.levels as Row[] | undefined) ?? [];
  const spaces = (place.spaces as Row[] | undefined) ?? [];
  const openings = (place.openings as Row[] | undefined) ?? [];
  const routes = (place.routes as Row[] | undefined) ?? [];
  const doc: Row = {
    schema: 'twinfile.bridge.indoorgml.v1',
    name: site.name,
    place: { name: site.name, kind: site.kind, timezone: site.timezone, ...siteExt },
    levels: levels.map((level) => ({
      id: level.id,
      ordinal: level.ordinal,
      name: level.name,
      ...extRecord(level),
    })),
    cellSpaces: spaces.map((space) => {
      const ext = extRecord(space);
      const ig = ext.indoorgml as { state?: string; layer?: string } | undefined;
      return {
        id: space.id,
        name: space.name,
        class: cellClass(space),
        ...(space.level ? { level: space.level } : {}),
        ...(space.parent ? { parent: space.parent } : {}),
        ...(ig?.state ? { state: ig.state } : {}),
        ...(ig?.layer ? { layer: ig.layer } : {}),
        ...ext,
      };
    }),
    transitions: openings.map((opening) => ({
      id: opening.id,
      usage: 'Door',
      connects: opening.connects,
      state: opening.state ?? 'open',
      kind: opening.kind,
      ...extRecord(opening),
    })),
    statePaths: routes.map((route) => ({
      id: route.id,
      name: route.name,
      from: route.from,
      to: route.to,
      length_m: route.length_m,
      usage: route.kind ?? 'Corridor',
      ...(route.step_free ? { step_free: true } : {}),
      ...extRecord(route),
    })),
    ...(igSite?.interLayerConnections ? { interLayerConnections: igSite.interLayerConnections } : {}),
    ...(igSite?.layers ? { layers: igSite.layers } : {}),
  };
  return { 'indoorgml.json': `${JSON.stringify(doc, null, 2)}\n` };
}
