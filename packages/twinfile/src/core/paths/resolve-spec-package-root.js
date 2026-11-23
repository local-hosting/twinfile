import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
/** `packages/twinfile` (this npm package root). */
export function resolveTwinfilePackageRoot() {
    return join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
}
/** Bundled `spec/` at the `@local-hosting/twinfile` package root (shipped in the npm tarball). */
export function resolveSpecPackageRoot() {
    const bundled = join(resolveTwinfilePackageRoot(), 'spec');
    if (statSync(bundled, { throwIfNoEntry: false })?.isDirectory()) {
        return bundled;
    }
    throw new Error('Missing twinfile spec/ beside @local-hosting/twinfile — reinstall or publish with spec in package files');
}
export function resolveSpecSchemasRoot() {
    return join(resolveSpecPackageRoot(), 'schemas', '1');
}
export function resolveSpecConfRoot() {
    return join(resolveSpecPackageRoot(), 'conf');
}
