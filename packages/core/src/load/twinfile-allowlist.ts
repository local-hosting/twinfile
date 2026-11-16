import { statSync } from 'node:fs';
import { join } from 'node:path';

import { findTwinfileYamlPath } from './twinfile-locator.js';

export const ALLOWED_TWINFILE_ROOT_NAMES = new Set([
  'preset.yaml',
  'Preset.yaml',
  'twinfile.yaml',
  'Twinfile.yaml',
  'Twinfile.lock',
  'twin.local.yaml',
  'place',
  'bindings',
  'plans',
  'parts',
  'buildings',
  'floors',
  'instances',
  'programme',
  'sources',
  'events',
  'scenes',
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
export function isAllowedTwinfileRootEntry(name: string, unitRoot?: string): boolean {
  if (ALLOWED_TWINFILE_ROOT_NAMES.has(name)) return true;
  if (!unitRoot) return false;
  const child = join(unitRoot, name);
  if (!statSync(child, { throwIfNoEntry: false })?.isDirectory()) return false;
  return findTwinfileYamlPath(child) !== undefined;
}
