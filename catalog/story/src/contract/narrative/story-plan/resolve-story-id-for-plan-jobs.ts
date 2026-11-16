import type { Story } from '../types/story-narrative.js';
import { resolveStoryEpisodeForCharacter } from '../story-catalog/resolve-story-episode-for-character.js';

/** Pick a Story twin whose scenes reference the persona's priority jobs. */
export function resolveStoryIdForPlanJobs(input: {
  stories: readonly Story[];
  characterId: string;
  jobIds: readonly string[];
  scenario?: string;
  explicitStoryId?: string;
}): string | undefined {
  const explicit = input.explicitStoryId?.trim();
  if (explicit) {
    return explicit;
  }
  const characterId = input.characterId.trim();
  const jobIds = input.jobIds.map((id) => id.trim()).filter(Boolean);
  if (!characterId || jobIds.length === 0) {
    return undefined;
  }
  if (input.stories.length === 0) {
    return undefined;
  }
  const story = resolveStoryEpisodeForCharacter({
    stories: input.stories,
    characterId,
    scenario: input.scenario,
    rankedJobIds: jobIds,
  });
  return story.id?.trim() || undefined;
}