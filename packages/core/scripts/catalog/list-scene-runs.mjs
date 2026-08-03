/** Story scene runs (`<story-dir>#<scene-id>`) that pin `run.expected.digest`. */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { listSceneRunIds, loadRunUnit, sceneAddress } from '../../dist/index.js';

export function listPinnedSceneRuns(storyExamplesRoot) {
  if (!statSync(storyExamplesRoot, { throwIfNoEntry: false })?.isDirectory()) return [];
  return readdirSync(storyExamplesRoot)
    .sort()
    .flatMap((name) => {
      const storyRoot = join(storyExamplesRoot, name);
      return listSceneRunIds(storyRoot).map((id) => sceneAddress(storyRoot, id));
    })
    .filter((address) => {
      const loaded = loadRunUnit(address);
      return loaded.ok && Boolean(loaded.value.scene?.expected?.digest);
    });
}
