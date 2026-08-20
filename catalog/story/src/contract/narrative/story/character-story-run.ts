import {
  psychologyFromCharacterStoryInstance,
  type CharacterStoryInstance,
  type CharacterStoryPsychology,
} from '@local-hosting/twinfile-character/persona';
import { assembleSamStoryRun } from './assemble-story-run.js';
import { resolveStoryBeatSceneJobIds } from './resolve-beat-scene-job-ids.js';
import type { StoryInstanceDocument } from './story-instance-document.js';
import type { StoryBeatSnapshot } from './resolve-story-beat.js';
import type { SamStoryRunState } from '../types/story-run.js';

export type CharacterStoryRun = {
  personaId: string;
  instance: CharacterStoryInstance;
  psychology: CharacterStoryPsychology;
  run: SamStoryRunState;
  beat: StoryBeatSnapshot;
  jobIds: string[];
};

export type BuildCharacterStoryRunInput = {
  /** Matches the Character instance by `instanceId` or `characterId`. */
  personaId: string;
  instance: CharacterStoryInstance;
  story: StoryInstanceDocument;
};

/** Character persona plus Story story clock, or undefined when the persona does not match the instance. */
export function buildCharacterStoryRun(input: BuildCharacterStoryRunInput): CharacterStoryRun | undefined {
  const personaId = input.personaId.trim();
  if (!personaId) return undefined;

  const { instance, story } = input;
  const instanceId = instance.instanceId?.trim();
  const characterId = instance.characterId?.trim();
  const matchesPersona = personaId === instanceId || (Boolean(characterId) && personaId === characterId);
  if (!matchesPersona) return undefined;

  const storyArc = story.episodeArc;
  if (!storyArc) return undefined;

  const { run, beat } = assembleSamStoryRun({
    storyArc,
    cursor: story.clockCursor(),
    timeline: story.characteristics.timeline,
  });

  return {
    personaId,
    instance,
    psychology: psychologyFromCharacterStoryInstance(instance),
    run,
    beat,
    jobIds: resolveStoryBeatSceneJobIds({ beat, scenes: story.story.scenes, arc: storyArc }),
  };
}
