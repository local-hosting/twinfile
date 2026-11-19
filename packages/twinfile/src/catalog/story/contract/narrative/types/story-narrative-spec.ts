import type { Story } from './story-narrative.js';

/** Portable story narrative spec version implemented by this package. */
export const STORY_NARRATIVE_SPEC_VERSION = 1;

export type StoryNarrativeSpecVersion = typeof STORY_NARRATIVE_SPEC_VERSION;

export function storyNarrativeSpecVersion(story: Story): StoryNarrativeSpecVersion {
  return story.version;
}

const SUPPORTED_STORY_NARRATIVE_SPECS = [STORY_NARRATIVE_SPEC_VERSION] as const;

export function assertSupportedStoryNarrativeSpec(version: number): void {
  if (!(SUPPORTED_STORY_NARRATIVE_SPECS as readonly number[]).includes(version)) {
    throw new Error(
      `Unsupported story narrative spec ${version} (supported: ${SUPPORTED_STORY_NARRATIVE_SPECS.join(', ')})`,
    );
  }
}
