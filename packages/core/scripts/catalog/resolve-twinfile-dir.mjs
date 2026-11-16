/** Resolve `Twinfile.yaml` in a Twinfile directory (one recipe tree). */
import { statSync } from 'node:fs';
import { join } from 'node:path';

const HEAD_NAMES = [
  'Place.yaml',
  'place.yaml',
  'Twinfile.yaml',
  'twinfile.yaml',
  'Story.yaml',
  'story.yaml',
  'run.yaml',
  'Run.yaml',
  'Event.yaml',
  'event.yaml',
  'preset.yaml',
  'Preset.yaml',
];

export function resolveTwinfileDirPath(twinfileDir) {
  for (const name of HEAD_NAMES) {
    const path = join(twinfileDir, name);
    if (statSync(path, { throwIfNoEntry: false })?.isFile()) return path;
  }
  return undefined;
}

export const resolveTwinfileHeadPath = resolveTwinfileDirPath;

export function isRunHeadPath(headPath) {
  const base = headPath.split('/').pop() ?? '';
  return /^(run|Run|Event|event|preset|Preset)\.yaml$/.test(base);
}
