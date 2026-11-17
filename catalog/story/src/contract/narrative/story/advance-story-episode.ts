import type { CharacterStoryInstance } from '@local-hosting/twinfile-character/character';
import { resolveStoryClockPosition, type StoryClockAdvanceTarget } from '../clock/story-clock.js';
import { storyClockCursorToWire } from '../clock/story-clock-cursor.js';
import { advanceStoryClockForArc } from './advance-story-clock.js';
import { buildCharacterStoryRun } from './character-story-run.js';
import type {
  StoryInstanceDocument,
  StoryCharacteristics,
} from './story-instance-document.js';

export type AdvanceStoryEpisodeTarget = StoryClockAdvanceTarget;

export type AdvanceStoryEpisodeInput = {
  characterId: string;
  story: StoryInstanceDocument;
  /** When it matches `characterId`, the advance continues from the story's current clock. */
  instance?: CharacterStoryInstance;
  target: StoryClockAdvanceTarget;
  hourOfDay?: number;
};

export type AdvanceStoryEpisodeResult = {
  dayIndex: number;
  isoDate: string;
  target: StoryClockAdvanceTarget;
  visitDayIndex: number;
  /** Updated clock + timeline for the caller to save. */
  characteristics: StoryCharacteristics;
};

export function advanceStoryEpisode(input: AdvanceStoryEpisodeInput): AdvanceStoryEpisodeResult {
  const characterId = input.characterId.trim();
  if (!characterId) {
    throw new Error('characterId is required');
  }

  const arc = input.story.episodeArc;
  if (!arc) {
    throw new Error('Story story has no episodeArc — cannot advance episode');
  }

  const existing = input.instance
    ? buildCharacterStoryRun({ characterId, instance: input.instance, story: input.story })
    : undefined;
  const cursor = advanceStoryClockForArc(arc, {
    target: input.target,
    hourOfDay: input.hourOfDay,
    existing: existing?.run.cursor,
  });

  const position = resolveStoryClockPosition(arc, {
    target: input.target,
    hourOfDay: input.hourOfDay,
  });

  return {
    dayIndex: position.dayIndex,
    isoDate: position.isoDate,
    target: input.target,
    visitDayIndex: position.visitDayIndex,
    characteristics: { ...input.story.characteristics, clock: storyClockCursorToWire(cursor) },
  };
}
