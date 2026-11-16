import type { Journey } from '@doppler-group/twinfile-character/pcm';

import type { SAM } from '../types/sam.js';

export type ValidateSamNarrativeCoherenceResult = { ok: true } | { ok: false; issues: string[] };

function journeyNarrativeText(journey: Journey): string {
  return [journey.journeyGoal, journey.label, journey.id].filter(Boolean).join(' ');
}

function venueLabel(sam: SAM, venueKey: string): string {
  const row = sam.venues?.find((v) => v.venueKey?.trim() === venueKey.trim());
  return row?.label?.trim() || venueKey;
}

/**
 * Semantic checks for human-readable story copy (not structural SAM validity).
 */
export function validateSamNarrativeCoherence(
  sam: SAM,
  journey?: Journey,
): ValidateSamNarrativeCoherenceResult {
  const issues: string[] = [];
  if (!journey || !sam.scenes?.length) {
    return { ok: true };
  }

  const journeyText = journeyNarrativeText(journey);
  const commuteLike = /commute|work on time|to work|morning ride/i.test(journeyText);
  const airportInJourney = /airport|flight|terminal/i.test(journeyText);

  if (commuteLike && !airportInJourney) {
    for (const scene of sam.scenes) {
      const label = venueLabel(sam, scene.venueKey);
      if (/airport/i.test(label)) {
        issues.push(
          `scene ${scene.id} uses venue label "${label}" but journey ${journey.id} reads as commute — relabel mount or change venueKey`,
        );
      }
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
