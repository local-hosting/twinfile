import { resolve } from 'node:path';

import { isRunComposeHead } from '../load/twinfile-unit-role.js';
import { loadTwinfileAtPath, resolveRelativeTwinfilePath, resolveTwinfileByRef } from '../ref/twinfile-resolver.js';
import { isTwinfileRef } from '../types/twinfile-ref.js';

import { catalogResolveOptions } from './catalog-resolve-options.js';
import { resolveExamplesRoot } from './resolve-examples-root.js';

export type ResolveTwinfileAnchorInput = {
  from?: string;
  twinfilePath?: string;
} & Record<string, unknown>;

function placeRootFromRef(ref: string, root: string): string | undefined {
  if (!isTwinfileRef(ref)) return undefined;
  const examplesRoot = resolveExamplesRoot(root);
  if (!examplesRoot) return undefined;
  const resolved = resolveTwinfileByRef(ref, catalogResolveOptions(examplesRoot));
  return resolved.ok ? resolved.value.loaded.root : undefined;
}

/** Place directory for a Twinfile or the place a scene run composes onto. */
export function resolveTwinfileAnchor(unitDir: string, twinfile: ResolveTwinfileAnchorInput): string {
  const root = resolve(unitDir);
  if (!isRunComposeHead(twinfile)) return root;

  if (typeof twinfile.from === 'string') {
    const byRef = placeRootFromRef(twinfile.from, root);
    if (byRef) return byRef;
    const directPath = resolveRelativeTwinfilePath(twinfile.from, root);
    const direct = loadTwinfileAtPath(directPath);
    if (direct.ok && String(direct.value.twinfile.kind ?? 'place') === 'place') {
      return direct.value.root;
    }
  }

  let dir = root;
  for (let depth = 0; depth < 8; depth += 1) {
    dir = resolve(dir, '..');
    const candidate = loadTwinfileAtPath(dir);
    if (candidate.ok && String(candidate.value.twinfile.kind ?? 'place') === 'place') {
      return candidate.value.root;
    }
  }

  return root;
}
