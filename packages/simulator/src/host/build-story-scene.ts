import {
  buildTwinfile,
  type BuildTwinfileOptions,
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';
import { ok, type Result } from '@doppler-group/twinfile-core';

import {
  resolveStorySceneAddress,
  type ResolveStorySceneAddressOptions,
} from './resolve-story-scene-address.js';

export type BuildStorySceneOptions = ResolveStorySceneAddressOptions & BuildTwinfileOptions;

export type BuildStorySceneResult = {
  build: BuildTwinfileResult;
  sceneAddress: string;
  sceneId: string;
  storyRoot: string;
};

/** Build one scene run via `@doppler-group/twinfile-place` (compose stays out of playback). */
export async function buildStoryScene(
  storyRoot: string,
  options?: BuildStorySceneOptions,
): Promise<Result<BuildStorySceneResult>> {
  const resolved = resolveStorySceneAddress(storyRoot, options);
  if (!resolved.ok) return resolved;
  const built = await buildTwinfile(resolved.value.address, {
    examplesRoot: options?.examplesRoot,
    writeLock: options?.writeLock,
    noCache: options?.noCache,
    frozen: options?.frozen,
  });
  if (!built.ok) return built;
  return ok({
    build: built.value,
    sceneAddress: resolved.value.address,
    sceneId: resolved.value.sceneId,
    storyRoot: resolved.value.storyRoot,
  });
}