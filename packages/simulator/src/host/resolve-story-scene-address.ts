import {
  err,
  listSceneRunIds,
  loadStoryUnit,
  ok,
  sceneAddress,
  type Result,
} from '@doppler-group/twinfile-core';

export type ResolveStorySceneAddressOptions = {
  sceneId?: string;
};

export type ResolvedStoryScene = {
  storyRoot: string;
  sceneId: string;
  address: string;
};

/** Pick a story scene run address (`<story-dir>#<scene-id>`) without building. */
export function resolveStorySceneAddress(
  storyRoot: string,
  options?: ResolveStorySceneAddressOptions,
): Result<ResolvedStoryScene> {
  const loaded = loadStoryUnit(storyRoot);
  if (!loaded.ok) return loaded;
  const ids = listSceneRunIds(loaded.value.root);
  if (ids.length === 0) {
    return err([
      {
        code: 'E_SCHEMA',
        message: 'Story has no scenes with inline run:',
        file: loaded.value.twinfilePath,
      },
    ]);
  }
  const sceneId = options?.sceneId ?? ids[0]!;
  if (!ids.includes(sceneId)) {
    return err([
      {
        code: 'E_SCHEMA',
        message: `Unknown scene ${sceneId} (runs: ${ids.join(', ')})`,
        file: loaded.value.twinfilePath,
      },
    ]);
  }
  return ok({
    storyRoot: loaded.value.root,
    sceneId,
    address: sceneAddress(loaded.value.root, sceneId),
  });
}