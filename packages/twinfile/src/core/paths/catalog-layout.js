import { existsSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Monorepo folder for the **twin types** (place, resource, character, context, story, event).
 * The **simulator** package is not under this hub — it plays these catalogs at runtime.
 *
 * Every catalog path derives from the monorepo root; `TF_TWINFILE_ROOT` is the only override.
 */
/** Legacy repo folder name; published package uses `src/catalog/<type>`. */
export const TWIN_CATALOG_HUB = 'catalog';
export const TWIN_CATALOG_TYPES = [
    'place',
    'resource',
    'character',
    'context',
    'story',
    'event',
];
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export function catalogHubDir(twinfileRoot) {
    return join(resolve(twinfileRoot), TWIN_CATALOG_HUB);
}
export function catalogTypeDir(twinfileRoot, type) {
    const unified = join(twinfileRoot, 'src', 'catalog', type);
    if (existsSync(unified))
        return unified;
    return join(catalogHubDir(twinfileRoot), type);
}
export function catalogTypeExamplesDir(twinfileRoot, type) {
    return join(catalogTypeDir(twinfileRoot, type), 'examples');
}
/** Character/situations YAML libraries (`libs/audience|journey|psychology/`) — not twin heads. */
export function catalogCharacterLibsDir(twinfileRoot) {
    return join(catalogTypeDir(twinfileRoot, 'character'), 'libs');
}
export function isTwinfileMonorepoRoot(dir) {
    const root = resolve(dir);
    if (existsSync(join(root, 'packages', 'twinfile', 'package.json')))
        return true;
    if (existsSync(join(root, 'src', 'catalog', 'place')))
        return true;
    if (existsSync(join(root, 'packages', 'core')))
        return true;
    return TWIN_CATALOG_TYPES.every((d) => existsSync(join(root, TWIN_CATALOG_HUB, d)));
}
function tryRealpath(dir) {
    try {
        return realpathSync(dir);
    }
    catch {
        return resolve(dir);
    }
}
function findTwinfileRootAbove(start) {
    // Portal / nested node_modules symlinks must be realpath’d first — walking the
    // logical path never reaches `local-hosting/twinfile`.
    let dir = tryRealpath(start);
    for (let i = 0; i < 12; i += 1) {
        if (isTwinfileMonorepoRoot(dir))
            return dir;
        const parent = resolve(dir, '..');
        if (parent === dir)
            return undefined;
        dir = parent;
    }
    return undefined;
}
/** Monorepo root: `TF_TWINFILE_ROOT`, else walk up from `seed`, else from this package. */
export function resolveTwinfileRoot(seed = process.cwd()) {
    const fromEnv = process.env.TF_TWINFILE_ROOT?.trim();
    if (fromEnv && existsSync(fromEnv))
        return resolve(fromEnv);
    return findTwinfileRootAbove(seed) ?? findTwinfileRootAbove(MODULE_DIR) ?? resolve(seed);
}
/** Golden twin units for a kind (`catalog/<type>/examples`). */
export function resolveTypeExamplesRoot(type, root) {
    return catalogTypeExamplesDir(root ?? resolveTwinfileRoot(), type);
}
/** Place golden catalog (`catalog/place/examples`). */
export function resolvePlaceExamplesCatalogRoot(root) {
    return resolveTypeExamplesRoot('place', root);
}
/** Character Character/situations YAML under `catalog/character/libs/`. */
export function resolveCharacterCatalogRoot(seed) {
    return catalogCharacterLibsDir(resolveTwinfileRoot(seed));
}
