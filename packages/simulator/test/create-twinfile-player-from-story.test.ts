import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { parseSceneAddress } from '@local-hosting/twinfile-core';
import {
  buildStoryScene,
  createTwinfilePlayerFromStory,
  resolveStorySceneAddress,
} from '@local-hosting/twinfile-simulator/host';

import { goldenSceneRun, testCatalogRoots } from '../../core/test/catalog-test-roots.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const { examplesRoot } = testCatalogRoots(testDir);

describe('createTwinfilePlayerFromStory', () => {
  const sceneRun = goldenSceneRun(testDir, 'storm-at-halftime');
  const storyRoot = parseSceneAddress(sceneRun)!.storyRoot;
  const sceneId = parseSceneAddress(sceneRun)!.sceneId;

  it('resolves the golden scene by id', () => {
    const resolved = resolveStorySceneAddress(storyRoot, { sceneId });
    expect(resolved.ok, resolved.ok ? '' : JSON.stringify(resolved.errors)).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.value.address).toBe(sceneRun);
  });

  it('builds the scene run through place', async () => {
    const built = await buildStoryScene(storyRoot, { sceneId, examplesRoot, writeLock: false });
    expect(built.ok, built.ok ? '' : JSON.stringify(built.errors)).toBe(true);
    if (!built.ok) return;
    expect(built.value.sceneAddress).toBe(sceneRun);
    expect(built.value.build.loaded?.scene?.id).toBe(sceneId);
  });

  it('starts a player for the built scene', async () => {
    const started = await createTwinfilePlayerFromStory(storyRoot, {
      sceneId,
      examplesRoot,
      writeLock: false,
      publishOnAdvance: false,
    });
    expect(started.ok, started.ok ? '' : JSON.stringify(started.errors)).toBe(true);
    if (!started.ok) return;
    expect(started.value.player.session).toBeDefined();
    started.value.player.detach();
  });
});