import { asExportRecord, extRecord } from '../../authoring.js';
const asRecord = asExportRecord;
function cellClass(space) {
    if (space.kind === 'anchor' || space.roles?.includes('anchor'))
        return 'Anchor';
    const ext = extRecord(space);
    const ig = ext.indoorgml;
    if (typeof ig?.cellClass === 'string')
        return ig.cellClass;
    if (typeof space.kind === 'string' && space.kind !== 'space') {
        return space.kind.charAt(0).toUpperCase() + space.kind.slice(1);
    }
    return 'Space';
}
export function exportPlace(place, _feed) {
    const site = asRecord(place.place ?? {}, 'bundle place');
    const siteExt = extRecord(site);
    const igSite = siteExt.indoorgml;
    const levels = place.levels ?? [];
    const spaces = place.spaces ?? [];
    const openings = place.openings ?? [];
    const routes = place.routes ?? [];
    const doc = {
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
            const ig = ext.indoorgml;
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
