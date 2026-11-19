import {
  psychologyFromCharacterStoryInstance,
  type CharacterStoryInstance,
  type CharacterStoryPsychology,
} from '@local-hosting/twinfile/character';
import { assembleCharacterStoryRun } from './assemble-story-run.js';
import { resolveStoryBeatSceneJobIds } from './resolve-beat-scene-job-ids.js';
import type { StoryInstanceDocument } from './story-instance-document.js';
import type { StoryBeatSnapshot } from './resolve-story-beat.js';
import type { CharacterStoryRunState } from '../types/story-run.js';

export type CharacterStoryRun = {
  characterId: string;
  instance: CharacterStoryInstance;
  psychology: CharacterStoryPsychology;
  run: CharacterStoryRunState;
  beat: StoryBeatSnapshot;
  jobIds: string[];
};

export type BuildCharacterStoryRunInput = {
  /** Matches the Character instance by `instanceId` or `characterId`. */
  characterId: string;
  instance: CharacterStoryInstance;
  story: StoryInstanceDocument;
};

/** Character sheet + Story clock, or undefined when the character does not match the instance. */
export function buildCharacterStoryRun(input: BuildCharacterStoryRunInput): CharacterStoryRun | undefined {
  const characterId = input.characterId.trim();
  if (!characterId) return undefined;

  const { instance, story } = input;
  const instanceId = instance.instanceId?.trim();
  const instanceCharacterId = instance.characterId?.trim();
  const matchesCharacter =
    characterId === instanceId ||
    (Boolean(instanceCharacterId) && characterId === instanceCharacterId);
  if (!matchesCharacter) return undefined;

  const storyArc = story.episodeArc;
  if (!storyArc) return undefined;

  const { run, beat } = assembleCharacterStoryRun({
    storyArc,
    cursor: story.clockCursor(),
    timeline: story.characteristics.timeline,
  });

  return {
    characterId,
    instance,
    psychology: psychologyFromCharacterStoryInstance(instance),
    run,
    beat,
    jobIds: resolveStoryBeatSceneJobIds({ beat, scenes: story.story.scenes, arc: storyArc }),
  };
}
