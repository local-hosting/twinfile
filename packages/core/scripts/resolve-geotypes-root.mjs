#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';

/** `geotypes/` checkout beside the monorepo (CI clones it there too). */
export function resolveGeotypesRoot(packageRoot = process.cwd()) {
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
