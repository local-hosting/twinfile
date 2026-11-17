import { err, ok, type Result } from '@local-hosting/twinfile-core';

import {
  buildStoryScene,
  type BuildStorySceneOptions,
  type BuildStorySceneResult,
} from './build-story-scene.js';
import {
  createTwinfilePlayer,
  type CreateTwinfilePlayerOptions,
  type TwinfilePlayer,
} from './create-twinfile-player.js';

export type CreateTwinfilePlayerFromStoryOptions = BuildStorySceneOptions &
  CreateTwinfilePlayerOptions;

export type CreateTwinfilePlayerFromStoryResult = BuildStorySceneResult & {
  player: TwinfilePlayer;
};

/**
 * Host entrypoint: resolve story scene → build place run → start player.
 * Compose/build delegates to core + place; simulator only orchestrates playback.
 */
export async function createTwinfilePlayerFromStory(
  storyRoot: string,
  options?: CreateTwinfilePlayerFromStoryOptions,
): Promise<Result<CreateTwinfilePlayerFromStoryResult>> {
  const built = await buildStoryScene(storyRoot, options);
  if (!built.ok) return built;
  const player = createTwinfilePlayer(built.value.build, options);
  if (!player) {
    return err([
      {
        code: 'E_BUILD',
        message: 'Player could not start for story scene build',
        file: built.value.sceneAddress,
      },
    ]);
  }
  return ok({ ...built.value, player });
}