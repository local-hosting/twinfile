/** Resolve `Twinfile.yaml` in a Twinfile directory (one recipe tree). */
import { statSync } from 'node:fs';
import { join } from 'node:path';

import { DISCOVER_TWIN_HEAD_YAML_NAMES } from '../../dist/index.js';

export function resolveTwinfileHeadPath(twinfileDir) {
  for (const name of DISCOVER_TWIN_HEAD_YAML_NAMES) {
    const path = join(twinfileDir, name);
    if (statSync(path, { throwIfNoEntry: false })?.isFile()) return path;
  }
  return undefined;
}


export function isRunHeadPath(headPath) {
  const base = headPath.split('/').pop() ?? '';
  return /^(run|Run|Event|event|preset|Preset)\.yaml$/.test(base);
}