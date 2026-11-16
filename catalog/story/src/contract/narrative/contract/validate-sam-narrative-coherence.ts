import type { Journey } from '@doppler-group/twinfile-character/pcm';
import { samePlaceRef } from '@doppler-group/twinfile-core/ref';

import type { SAM } from '../types/sam.js';

export type ValidateSamNarrativeCoherenceResult = { ok: true } | { ok: false; issues: string[] };

function journeyNarrativeText(journey: Journey): string {
  return [journey.journeyGoal, journey.label, journey.id].filter(Boolean).join(' ');
}

function placeLabel(sam: SAM, placeRef: string): string {
  const row = sam.places?.find((v) => samePlaceRef(v.placeRef, placeRef));
  return row?.label?.trim() || placeRef;
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
      const label = placeLabel(sam, scene.placeRef);
      if (/airport/i.test(label)) {
        issues.push(
          `scene ${scene.id} uses place label "${label}" but journey ${journey.id} reads as commute — relabel mount or change placeRef`,
        );
      }
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
