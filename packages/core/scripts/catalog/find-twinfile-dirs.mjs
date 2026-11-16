import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { isTwinUnitDir } from '../../dist/index.js';

/** `parts/` (and legacy `buildings/`) and `floors/` hold nested stages; never published (RFC 0009). */
const SKIP = new Set(['node_modules', '.git', 'runs', '.twin', 'dist', 'parts', 'buildings', 'floors', 'scenes', 'events']);

/** Every publishable directory under `root` with a twin head (recursive). */
export function findTwinfileDirs(root, acc = []) {
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) return acc;
  for (const name of readdirSync(root)) {
    if (SKIP.has(name)) continue;
    const child = join(root, name);
    if (!statSync(child).isDirectory()) continue;
    if (isTwinUnitDir(child)) acc.push(child);
    findTwinfileDirs(child, acc);
  }
  return acc;
}