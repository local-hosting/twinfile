import { resolve } from 'node:path';

import { isRunComposeHead, isRunPresetPath } from '../load/twinfile-unit-role.js';
import { loadTwinfileAtPath, resolveRelativeTwinfilePath } from '../ref/twinfile-resolver.js';

export type ResolveTwinfileAnchorInput = {
  from?: string;
  twinfilePath?: string;
} & Record<string, unknown>;

/** Place directory for a Twinfile or the parent place for a run preset. */
export function resolveTwinfileAnchor(unitDir: string, twinfile: ResolveTwinfileAnchorInput): string {
  const root = resolve(unitDir);
  const fromPreset = twinfile.twinfilePath ? isRunPresetPath(twinfile.twinfilePath) : false;
  const fromHead = isRunComposeHead(twinfile);
  if (!fromPreset && !fromHead) {
    return root;
  }

  if (typeof twinfile.from === 'string') {
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
