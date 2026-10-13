import { basename, join, resolve } from 'node:path';
import { statSync } from 'node:fs';

import { TWIN_HEAD_SUFFIX } from '../types/twin-kind.js';
import { TWIN_LOCK_SUFFIX } from '../types/twinfile-lock.js';

/** Head file name for a unit folder: `river` → `river.twin.yaml`. */
export function twinHeadFileName(unitDir: string): string {
  return `${basename(resolve(unitDir))}${TWIN_HEAD_SUFFIX}`;
}

/** Head path for a unit folder, whether or not it exists. */
export function twinHeadPath(unitDir: string): string {
  return join(unitDir, twinHeadFileName(unitDir));
}

/** Lock file name for a unit folder: `river` → `river.twin.lock`. */
export function twinLockFileName(unitDir: string): string {
  return `${basename(resolve(unitDir))}${TWIN_LOCK_SUFFIX}`;
}

/** Lock path for a unit folder, whether or not it exists. */
export function twinLockPath(unitDir: string): string {
  return join(unitDir, twinLockFileName(unitDir));
}

/** Resolve the unit head in `root`, if present. */
export function findTwinfileYamlPath(root: string): string | undefined {
  const path = twinHeadPath(root);
  return statSync(path, { throwIfNoEntry: false })?.isFile() ? path : undefined;
}
