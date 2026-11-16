import type { Story } from '../types/story-narrative.js';
import { scoreCatalogTextMatch } from '../story-catalog/match-story-catalog-from-text.js';

/** Pick a Story twin when `storyId` is omitted but several match the focal Character. */
export function resolveStoryEpisodeForCharacter(input: {
  stories: readonly Story[];
  characterId: string;
  scenario?: string;
  rankedJobIds?: readonly string[];
}): Story {
  const characterId = input.characterId.trim();
  if (!characterId) {
    throw new Error('characterId is required to resolve a Story episode');
  }

  const forCharacter = input.stories.filter((row) => row.binding.characterId.trim() === characterId);
  const pool = forCharacter.length > 0 ? forCharacter : [...input.stories];
  if (pool.length === 0) {
    throw new Error('No Story episodes in mounted catalog');
  }
  if (pool.length === 1) {
    return pool[0]!;
  }

  const scenario = input.scenario?.trim() ?? '';
  const jobIds = new Set((input.rankedJobIds ?? []).map((id) => id.trim()).filter(Boolean));

  let best = pool[0]!;
  let bestScore = -1;
  for (const story of pool) {
    const corpus = [story.id, story.title, story.binding.journeyId].filter(Boolean).join(' ');
    let score = scenario ? scoreCatalogTextMatch(scenario, corpus) : 0;
    if (jobIds.size > 0) {
      for (const scene of story.scenes) {
        for (const jobId of scene.jobIds ?? []) {
          if (jobIds.has(jobId.trim())) {
            score += 0.15;
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = story;
    }
  }
  return best;
}
