import { statSync } from 'node:fs';
import { join } from 'node:path';
import { findTwinfileYamlPath, twinHeadFileName, twinLockFileName } from './twinfile-locator.js';
export const ALLOWED_TWINFILE_ROOT_NAMES = new Set([
    'twin.local.yaml',
    'place',
    'bindings',
    'parts',
    'buildings',
    'floors',
    'instances',
    'programme',
    'sources',
    'events',
    'scenarios',
    'signs',
    'metrics',
    'docs',
    'README.md',
    'CHANGELOG.md',
    'ext',
    'patches',
    'expected',
    'runs',
]);
/** Allow named layout dirs or any child folder that is its own Twinfile unit. */
export function isAllowedTwinfileRootEntry(name, unitRoot) {
    if (ALLOWED_TWINFILE_ROOT_NAMES.has(name))
        return true;
    if (!unitRoot)
        return false;
    if (name === twinHeadFileName(unitRoot) || name === twinLockFileName(unitRoot))
        return true;
    const child = join(unitRoot, name);
    if (!statSync(child, { throwIfNoEntry: false })?.isDirectory())
        return false;
    return findTwinfileYamlPath(child) !== undefined;
}
