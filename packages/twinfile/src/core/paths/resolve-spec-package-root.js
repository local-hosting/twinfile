import { createRequire } from 'node:module';
import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
/** `packages/twinfile` (this npm package root). */
export function resolveTwinfilePackageRoot() {
    return join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
}
/** Bundled `spec/` beside `@local-hosting/twinfile`, or an installed `@local-hosting/twinfile` package. */
export function resolveSpecPackageRoot() {
    const bundled = join(resolveTwinfilePackageRoot(), 'spec');
    if (statSync(bundled, { throwIfNoEntry: false })?.isDirectory()) {
        return bundled;
    }
    return dirname(require.resolve('@local-hosting/twinfile/package.json'));
}
export function resolveSpecSchemasRoot() {
    return join(resolveSpecPackageRoot(), 'schemas', '1');
}
export function resolveSpecConfRoot() {
    return join(resolveSpecPackageRoot(), 'conf');
}
