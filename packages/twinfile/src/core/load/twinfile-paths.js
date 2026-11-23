import { twinfileStepItems } from './twinfile-compose.js';
function stringList(value) {
    return Array.isArray(value) ? value.filter((x) => typeof x === 'string') : [];
}
/** Parse one manifest `layers:` item (string path or `{ path, mode? }`). */
export function parseManifestLayerEntry(item) {
    if (typeof item === 'string' && item.trim()) {
        return { path: item.trim(), mode: 'patch' };
    }
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const row = item;
        const path = typeof row.path === 'string' ? row.path.trim() : '';
        if (!path)
            return undefined;
        const mode = row.mode === 'replace' ? 'replace' : 'patch';
        return { path, mode };
    }
    return undefined;
}
export function parseManifestLayerEntries(twinfile) {
    const raw = twinfile.layers;
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const item of raw) {
        const entry = parseManifestLayerEntry(item);
        if (entry)
            out.push(entry);
    }
    return out;
}
export function isBindingLayerPath(rel) {
    if (!rel.endsWith('.yaml') && !rel.endsWith('.yml'))
        return false;
    return rel.startsWith('bindings/');
}
/** Place graph layer files (excludes event binding files under `bindings/`). */
export function twinfilePlaceLayerPaths(twinfile) {
    return parseManifestLayerEntries(twinfile).filter((e) => !isBindingLayerPath(e.path));
}
/** Place layer paths only (patch mode entries as strings). */
export function twinfileLayerPaths(twinfile) {
    return twinfilePlaceLayerPaths(twinfile).map((e) => e.path);
}
/** Binding file paths: `bindings/*` entries in `layers:`. */
export function twinfileBindingPaths(twinfile) {
    return [...new Set(parseManifestLayerEntries(twinfile).filter((e) => isBindingLayerPath(e.path)).map((e) => e.path))];
}
/** Full authoring stack (place + binding paths) for editor and `twin fmt`. */
export function twinfileStackPaths(twinfile) {
    return parseManifestLayerEntries(twinfile).map((e) => e.path);
}
/** Scenario stack refs: v1 `include:`, or `steps[].copy` of published units (RFC 0009). */
export function manifestScenarioComposeRefs(twinfile) {
    const include = stringList(twinfile.include);
    if (include.length > 0)
        return include;
    if (twinfile.twinfile !== 2)
        return [];
    const steps = twinfileStepItems(twinfile);
    return steps.flatMap((item) => {
        if (!item || typeof item !== 'object')
            return [];
        const copy = item.copy;
        if (typeof copy !== 'string')
            return [];
        const trimmed = copy.trim();
        if (trimmed.startsWith('./') || trimmed.startsWith('.\\'))
            return [];
        return [trimmed];
    });
}
