import type { Journey } from '@local-hosting/twinfile/character';
import { samePlaceRef } from '@local-hosting/twinfile/ref';

import type { Story } from '../types/story-narrative.js';

export type ValidateStoryNarrativeCoherenceResult = { ok: true } | { ok: false; issues: string[] };

function journeyNarrativeText(journey: Journey): string {
  return [journey.journeyGoal, journey.label, journey.id].filter(Boolean).join(' ');
}

function placeLabel(story: Story, placeRef: string): string {
  const row = story.places?.find((v) => samePlaceRef(v.placeRef, placeRef));
  return row?.label?.trim() || placeRef;
}

/**
 * Semantic checks for human-readable story copy (not structural Story validity).
 */
export function validateStoryNarrativeCoherence(
  story: Story,
  journey?: Journey,
): ValidateStoryNarrativeCoherenceResult {
  const issues: string[] = [];
  if (!journey || !story.scenes?.length) {
    return { ok: true };
  }

  const journeyText = journeyNarrativeText(journey);
  const commuteLike = /commute|work on time|to work|morning ride/i.test(journeyText);
  const airportInJourney = /airport|flight|terminal/i.test(journeyText);

  if (commuteLike && !airportInJourney) {
    for (const scene of story.scenes) {
      const label = placeLabel(story, scene.placeRef);
      if (/airport/i.test(label)) {
        issues.push(
          `scene ${scene.id} uses place label "${label}" but journey ${journey.id} reads as commute — relabel mount or change placeRef`,
        );
      }
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
