import { join } from 'node:path';
import { statSync } from 'node:fs';

import { parseStory } from '../schemas/story-narrative.schema.js';
import type { Story } from '../types/story-narrative.js';
import { loadEntityDir, readYamlFile } from './io.js';
import { mergeArcTemplateFromDisk } from './load-arc-template-from-disk.js';
import type { StoryScene } from '../types/scene.js';

export type LoadStoryResult = {
  story: Story;
};

/** Load a Story root from disk (`story.yml`). */
export function loadStory(root: string): LoadStoryResult {
  const storyYml = join(root, 'story.yml');
  const legacy = join(root, 'story-narrative.yml');
  const diskPath = statSync(storyYml, { throwIfNoEntry: false })?.isFile()
    ? storyYml
  : statSync(legacy, { throwIfNoEntry: false })?.isFile()
      ? legacy
      : undefined;
  if (!diskPath) {
    throw new Error(`Story root ${root} is missing story.yml`);
  }
  const raw = readYamlFile(diskPath) as Record<string, unknown>;
  const scenesDir = join(root, 'scenes');
  const diskScenes = loadEntityDir<StoryScene>(scenesDir);
  const arcTemplate = mergeArcTemplateFromDisk(raw, root);
  const story = parseStory({
    ...raw,
    ...(arcTemplate ? { arcTemplate } : {}),
    ...(diskScenes.length > 0 ? { scenes: diskScenes } : {}),
  });
  return { story };
}
