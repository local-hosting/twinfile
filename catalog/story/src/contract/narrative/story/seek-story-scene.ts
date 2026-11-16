import type { PcmStoryInstance } from '@doppler-group/twinfile-character/pcm';
import { storyClockCursorToWire } from '../clock/story-clock-cursor.js';
import {
  seekStoryEpisodeSceneOnArc,
  storySceneSeekRowsFromSam,
  type StorySceneSeekDirection,
} from './seek-story-episode-scene.js';
import { buildPcmSamStoryRun } from './pcm-sam-story-run.js';
import type {
  SamStoryInstanceDocument,
  StoryCharacteristics,
} from './sam-story-instance-document.js';

export type { StorySceneSeekDirection };

export type SeekStorySceneInput = {
  personaId: string;
  story: SamStoryInstanceDocument;
  /** When it matches `personaId`, the seek starts from the story's current clock. */
  instance?: PcmStoryInstance;
  direction: StorySceneSeekDirection;
  sceneId?: string;
  order?: number;
  hourOfDay?: number;
};

export type SeekStorySceneResult = {
  dayIndex: number;
  isoDate: string;
  sceneId: string;
  sceneLabel: string;
  sceneOrder: number;
  actId?: string;
  jobIds: string[];
  direction: StorySceneSeekDirection;
  /** Updated clock + timeline for the caller to save. */
  characteristics: StoryCharacteristics;
};

export function seekStoryScene(input: SeekStorySceneInput): SeekStorySceneResult {
  const personaId = input.personaId.trim();
  if (!personaId) {
    throw new Error('personaId is required');
  }

  const arc = input.story.episodeArc;
  if (!arc) {
    throw new Error('SAM story has no episodeArc — cannot seek scene');
  }

  const existing = input.instance
    ? buildPcmSamStoryRun({ personaId, instance: input.instance, story: input.story })
    : undefined;

  const core = seekStoryEpisodeSceneOnArc({
    arc,
    scenes: storySceneSeekRowsFromSam(input.story.sam.scenes),
    currentDayIndex: existing?.run.cursor.dayIndex ?? 0,
    direction: input.direction,
    sceneId: input.sceneId,
    order: input.order,
    hourOfDay: input.hourOfDay,
    existingCursor: existing?.run.cursor,
  });

  return {
    dayIndex: core.dayIndex,
    isoDate: core.isoDate,
    sceneId: core.sceneId,
    sceneLabel: core.sceneLabel,
    sceneOrder: core.sceneOrder,
    actId: core.actId,
    jobIds: core.jobIds,
    direction: core.direction,
    characteristics: { ...input.story.characteristics, clock: storyClockCursorToWire(core.cursor) },
  };
}
