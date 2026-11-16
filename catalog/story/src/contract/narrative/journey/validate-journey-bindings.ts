import type { Journey } from '@local-hosting/twinfile-character/pcm';

import { extractJourneyTouchpointSequence } from './extract-touchpoint-sequence.js';
import type { TouchpointIndex } from '../types/touchpoint-index.js';
import { touchpointIndexMap } from '../types/touchpoint-index.js';

export type ValidateJourneyBindingsResult =
  | { ok: true }
  | { ok: false; issues: string[] };

export function validateJourneyBindings(
  journey: Journey,
  index?: TouchpointIndex,
): ValidateJourneyBindingsResult {
  const issues: string[] = [];

  if (journey.phases.length < 1) {
    issues.push(`journey ${journey.id} has no phases`);
  }

  if (!index) {
    return issues.length === 0 ? { ok: true } : { ok: false, issues };
  }

  const known = touchpointIndexMap(index);
  for (const touchpointId of extractJourneyTouchpointSequence(journey)) {
    if (!known.has(touchpointId)) {
      issues.push(
        `journey ${journey.id} references unknown touchpoint "${touchpointId}"`,
      );
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
