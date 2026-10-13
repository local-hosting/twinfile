import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import yaml from 'yaml';
const require = createRequire(import.meta.url);
let cached;
function loadCatalog() {
    if (cached)
        return cached;
    const specRoot = dirname(require.resolve('@local-hosting/twinfile/package.json'));
    const raw = readFileSync(join(specRoot, 'conf', 'bridge-module-ports.yaml'), 'utf8');
    const doc = yaml.parse(raw);
    cached = doc.bridges ?? {};
    return cached;
}
/** Port metadata for a built-in bridge id (`gtfs`, `imdf`, …). */
export function describeBridgePorts(bridgeId) {
    return loadCatalog()[bridgeId]?.ports;
}
export function listBridgePortCatalogIds() {
    return Object.keys(loadCatalog()).sort();
}
