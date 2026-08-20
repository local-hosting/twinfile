import type { Story } from '../types/story-narrative.js';
import {
  StoryInstanceDocument,
  storyCharacteristicsFromJSON,
} from './story-instance-document.js';
import { planEpisodeCalendarFromArc } from './plan-episode-calendar.js';

export type ResolveStoryNarrativeInstanceInput = {
  /** Story template the story implements. */
  story: Story;
  /** Saved clock + timeline for this story, if any. */
  characteristics?: unknown;
  /** Calendar subject when the timeline has to be synthesized (e.g. Character instance id). */
  subjectId?: string;
};

export type ResolveStoryNarrativeInstanceResult = {
  document: StoryInstanceDocument;
  /** True when `characteristics` were missing or invalid and were rebuilt from `story.episodeArc`. */
  synthesized: boolean;
};

function synthesizeSamStoryInstance(story: Story, subjectId: string): StoryInstanceDocument {
  const arc = story.episodeArc;
  if (!arc) {
    throw new Error('StoryInstanceDocument requires episodeArc on the Story template');
  }
  const { timeline } = planEpisodeCalendarFromArc({ episodeArc: arc, subjectId });
  return StoryInstanceDocument.fromCompiled(story, { timeline });
}

/** Story instance from a Story template plus saved characteristics, synthesizing them when absent. */
export function resolveStoryNarrativeInstance(
  input: ResolveStoryNarrativeInstanceInput,
): ResolveStoryNarrativeInstanceResult {
  try {
    return {
      document: StoryInstanceDocument.compose(
        input.story,
        storyCharacteristicsFromJSON(input.characteristics),
      ),
      synthesized: false,
    };
  } catch {
    return {
      document: synthesizeSamStoryInstance(input.story, input.subjectId?.trim() || 'story'),
      synthesized: true,
    };
  }
}
