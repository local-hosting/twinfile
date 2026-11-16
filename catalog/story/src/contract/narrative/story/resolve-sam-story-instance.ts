import type { SAM } from '../types/sam.js';
import {
  SamStoryInstanceDocument,
  storyCharacteristicsFromJSON,
} from './sam-story-instance-document.js';
import { planEpisodeCalendarFromArc } from './plan-episode-calendar.js';

export type ResolveSamStoryInstanceInput = {
  /** SAM template the story implements. */
  sam: SAM;
  /** Saved clock + timeline for this story, if any. */
  characteristics?: unknown;
  /** Calendar subject when the timeline has to be synthesized (e.g. PCM instance id). */
  subjectId?: string;
};

export type ResolveSamStoryInstanceResult = {
  document: SamStoryInstanceDocument;
  /** True when `characteristics` were missing or invalid and were rebuilt from `sam.episodeArc`. */
  synthesized: boolean;
};

function synthesizeSamStoryInstance(sam: SAM, subjectId: string): SamStoryInstanceDocument {
  const arc = sam.episodeArc;
  if (!arc) {
    throw new Error('SamStoryInstanceDocument requires episodeArc on the SAM template');
  }
  const { timeline } = planEpisodeCalendarFromArc({ episodeArc: arc, subjectId });
  return SamStoryInstanceDocument.fromCompiled(sam, { timeline });
}

/** Story instance from a SAM template plus saved characteristics, synthesizing them when absent. */
export function resolveSamStoryInstance(
  input: ResolveSamStoryInstanceInput,
): ResolveSamStoryInstanceResult {
  try {
    return {
      document: SamStoryInstanceDocument.compose(
        input.sam,
        storyCharacteristicsFromJSON(input.characteristics),
      ),
      synthesized: false,
    };
  } catch {
    return {
      document: synthesizeSamStoryInstance(input.sam, input.subjectId?.trim() || 'story'),
      synthesized: true,
    };
  }
}
