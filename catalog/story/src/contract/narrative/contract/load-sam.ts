import { join } from 'node:path';
import { statSync } from 'node:fs';

import { parseSAM } from '../schemas/sam.schema.js';
import type { SAM } from '../types/sam.js';
import { loadEntityDir, readYamlFile } from './io.js';
import { mergeArcTemplateFromDisk } from './load-arc-template-from-disk.js';
import type { StoryScene } from '../types/scene.js';

export type LoadSAMResult = {
  sam: SAM;
};

/** Load a SAM root from disk (`sam.yml`). */
export function loadSAM(root: string): LoadSAMResult {
  const samYml = join(root, 'sam.yml');
  if (!statSync(samYml, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`SAM root ${root} is missing sam.yml`);
  }
  const raw = readYamlFile(samYml) as Record<string, unknown>;
  const scenesDir = join(root, 'scenes');
  const diskScenes = loadEntityDir<StoryScene>(scenesDir);
  const arcTemplate = mergeArcTemplateFromDisk(raw, root);
  const sam = parseSAM({
    ...raw,
    ...(arcTemplate ? { arcTemplate } : {}),
    ...(diskScenes.length > 0 ? { scenes: diskScenes } : {}),
  });
  return { sam };
}
