import { statSync } from 'node:fs';
import { join } from 'node:path';

import { RUN_PRESET_NAMES } from '../types/twin-kind.js';

import { findTwinfileYamlPath, twinHeadFileName, twinLockFileName } from './twinfile-locator.js';

export const ALLOWED_TWINFILE_ROOT_NAMES = new Set<string>([
  ...RUN_PRESET_NAMES,
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
  if (name === twinHeadFileName(unitRoot) || name === twinLockFileName(unitRoot)) return true;
  const child = join(unitRoot, name);
  if (!statSync(child, { throwIfNoEntry: false })?.isDirectory()) return false;
  return findTwinfileYamlPath(child) !== undefined;
}
