import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { isAllowedTwinfileRootEntry } from '../load/twinfile-allowlist.js';

const TREE_SKIP_ROOT = new Set(['Twinfile.lock']);

/** Relative paths (posix) of source files included in the OCI tree layer. */
export function collectTwinfileSourcePaths(unitRoot: string): string[] {
  const out: string[] = [];

  for (const name of readdirSync(unitRoot)) {
    if (name.startsWith('.')) continue;
    if (TREE_SKIP_ROOT.has(name)) continue;
    if (!isAllowedTwinfileRootEntry(name, unitRoot)) continue;

    const abs = join(unitRoot, name);
    if (statSync(abs).isFile()) {
      out.push(name);
      continue;
    }
    if (statSync(abs).isDirectory()) {
      walkDir(abs, unitRoot, out);
    }
  }

  out.sort();
  return out;
}

function walkDir(dir: string, unitRoot: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const abs = join(dir, name);
    const rel = relative(unitRoot, abs);
    if (statSync(abs).isFile()) {
      out.push(rel.split('\\').join('/'));
    } else if (statSync(abs).isDirectory()) {
      walkDir(abs, unitRoot, out);
    }
  }
}
