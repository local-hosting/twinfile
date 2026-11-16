import {
  psychologyFromPcmStoryInstance,
  type PcmStoryInstance,
  type PcmStoryPsychology,
} from '@local-hosting/twinfile-character/pcm';
import { assembleSamStoryRun } from './assemble-story-run.js';
import { resolveStoryBeatSceneJobIds } from './resolve-beat-scene-job-ids.js';
import type { SamStoryInstanceDocument } from './sam-story-instance-document.js';
import type { StoryBeatSnapshot } from './resolve-story-beat.js';
import type { SamStoryRunState } from '../types/story-run.js';

export type PcmSamStoryRun = {
  personaId: string;
  instance: PcmStoryInstance;
  psychology: PcmStoryPsychology;
  run: SamStoryRunState;
  beat: StoryBeatSnapshot;
  jobIds: string[];
};

export type BuildPcmSamStoryRunInput = {
  /** Matches the PCM instance by `instanceId` or `pcmId`. */
  personaId: string;
  instance: PcmStoryInstance;
  story: SamStoryInstanceDocument;
};

/** PCM persona plus SAM story clock, or undefined when the persona does not match the instance. */
export function buildPcmSamStoryRun(input: BuildPcmSamStoryRunInput): PcmSamStoryRun | undefined {
  const personaId = input.personaId.trim();
  if (!personaId) return undefined;

  const { instance, story } = input;
  const instanceId = instance.instanceId?.trim();
  const pcmId = instance.pcmId?.trim();
  const matchesPersona = personaId === instanceId || (Boolean(pcmId) && personaId === pcmId);
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
    psychology: psychologyFromPcmStoryInstance(instance),
    run,
    beat,
    jobIds: resolveStoryBeatSceneJobIds({ beat, scenes: story.sam.scenes, arc: storyArc }),
  };
}
