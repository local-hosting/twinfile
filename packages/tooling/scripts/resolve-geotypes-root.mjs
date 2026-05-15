#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';

/** CI checks out `twinfile/geotypes` to `./geotypes`; monorepo uses `../geotypes`. */
export function resolveGeotypesRoot(packageRoot = process.cwd()) {
  const fromEnv = process.env.TF_GEOTYPES_ROOT?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  const root = path.resolve(packageRoot);
  for (const candidate of [path.join(root, 'geotypes'), path.join(root, '../geotypes')]) {
    if (existsSync(path.join(candidate, 'package.json'))) {
      return candidate;
    }
  }
  return null;
}
