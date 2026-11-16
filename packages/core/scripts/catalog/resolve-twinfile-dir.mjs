/** Resolve the head of a unit directory: `<dir>.twin.yaml` or a scene `run.yaml`. */
import { statSync } from 'node:fs';
import { basename, join } from 'node:path';

import { findTwinfileYamlPath, RUN_PRESET_NAMES } from '../../dist/index.js';

export function resolveTwinfileHeadPath(twinfileDir) {
  const head = findTwinfileYamlPath(twinfileDir);
  if (head) return head;
  return RUN_PRESET_NAMES.map((name) => join(twinfileDir, name)).find(
    (path) => statSync(path, { throwIfNoEntry: false })?.isFile(),
  );
}

export function isRunHeadPath(headPath) {
  return RUN_PRESET_NAMES.includes(basename(headPath));
}
