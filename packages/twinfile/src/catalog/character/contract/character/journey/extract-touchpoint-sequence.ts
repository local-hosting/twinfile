import type { Journey } from '../types/story/journey.js';

function orderedPhases(journey: Journey) {
  return [...journey.phases].sort((left, right) => left.order - right.order);
}

/** Walk journey phases (and nested moments) in narrative order; dedupe ids, keep first occurrence. */
export function extractJourneyTouchpointSequence(journey: Journey): string[] {
  const seen = new Set<string>();
  const sequence: string[] = [];

  const push = (touchpointId: string) => {
    const id = touchpointId.trim();
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    sequence.push(id);
  };

  for (const phase of orderedPhases(journey)) {
    for (const touchpointId of phase.touchpointIds) {
      push(touchpointId);
    }
    const moments = [...(phase.moments ?? [])].sort((left, right) => left.order - right.order);
    for (const moment of moments) {
      for (const touchpointId of moment.touchpointIds ?? []) {
        push(touchpointId);
      }
    }
  }

  return sequence;
}
