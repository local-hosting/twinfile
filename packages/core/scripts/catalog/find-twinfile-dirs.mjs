import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** `parts/` (and legacy `buildings/`) and `floors/` hold nested stages; never published (RFC 0009). */
const SKIP = new Set(['node_modules', '.git', 'runs', '.twin', 'dist', 'parts', 'buildings', 'floors', 'scenes', 'events']);

const TWINFILE_NAMES = [
  'Place.yaml',
  'place.yaml',
  'Twinfile.yaml',
  'twinfile.yaml',
  'Resource.yaml',
  'resource.yaml',
  'Character.yaml',
  'character.yaml',
  'Story.yaml',
  'story.yaml',
  'run.yaml',
  'Run.yaml',
  'Event.yaml',
  'event.yaml',
  'preset.yaml',
  'Preset.yaml',
];

function dirHasTwinfile(dir) {
  return TWINFILE_NAMES.some((name) => statSync(join(dir, name), { throwIfNoEntry: false })?.isFile());
}

/** Every publishable directory under `root` with a Twinfile.yaml (recursive). */
export function findTwinfileDirs(root, acc = []) {
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) return acc;
  for (const name of readdirSync(root)) {
    if (SKIP.has(name)) continue;
    const child = join(root, name);
    if (!statSync(child).isDirectory()) continue;
    if (dirHasTwinfile(child)) acc.push(child);
    findTwinfileDirs(child, acc);
  }
  return acc;
}
