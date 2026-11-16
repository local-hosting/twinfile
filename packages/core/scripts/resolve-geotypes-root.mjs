#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';

/** CI checks out `twinfile/geotypes` to `./geotypes`; local dev clones it beside the monorepo. */
export function resolveGeotypesRoot(packageRoot = process.cwd()) {
  const fromEnv = process.env.TF_GEOTYPES_ROOT?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  let dir = path.resolve(packageRoot);
  for (let i = 0; i < 6; i += 1) {
    const candidate = path.join(dir, 'geotypes');
    if (existsSync(path.join(candidate, 'package.json'))) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
