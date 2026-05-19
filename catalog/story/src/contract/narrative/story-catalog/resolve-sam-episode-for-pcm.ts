import type { SAM } from '../types/sam.js';
import { scoreCatalogTextMatch } from '../story-catalog/match-story-catalog-from-text.js';

/** Pick a SAM episode mount when `episodeId` is omitted but several match the focal PCM. */
export function resolveSamEpisodeForPcm(input: {
  sams: readonly SAM[];
  pcmId: string;
  scenario?: string;
  rankedJobIds?: readonly string[];
}): SAM {
  const pcmId = input.pcmId.trim();
  if (!pcmId) {
    throw new Error('pcmId is required to resolve a SAM episode');
  }

  const forPcm = input.sams.filter((row) => row.binding.pcmId.trim() === pcmId);
  const pool = forPcm.length > 0 ? forPcm : [...input.sams];
  if (pool.length === 0) {
    throw new Error('No SAM episodes in mounted catalog');
  }
  if (pool.length === 1) {
    return pool[0]!;
  }

  const scenario = input.scenario?.trim() ?? '';
  const jobIds = new Set((input.rankedJobIds ?? []).map((id) => id.trim()).filter(Boolean));

  let best = pool[0]!;
  let bestScore = -1;
  for (const sam of pool) {
    const corpus = [sam.id, sam.title, sam.binding.journeyId].filter(Boolean).join(' ');
    let score = scenario ? scoreCatalogTextMatch(scenario, corpus) : 0;
    if (jobIds.size > 0) {
      for (const scene of sam.scenes) {
        for (const jobId of scene.jobIds ?? []) {
          if (jobIds.has(jobId.trim())) {
            score += 0.15;
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = sam;
    }
  }
  return best;
}
