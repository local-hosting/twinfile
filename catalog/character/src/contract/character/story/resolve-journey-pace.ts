import { segmentIdFromPersonaSegment } from '../persona/segment-id-from-persona.js';
import type { Persona } from '../types/strategy/persona.js';
import { JOURNEY_PACE_IDS, type JourneyPaceId } from '../types/story/journey-pace.js';

export function normalizeJourneyPaceId(value?: string): JourneyPaceId | undefined {
  const pace = value?.trim().toLowerCase();
  if (!pace) {
    return undefined;
  }
  return (JOURNEY_PACE_IDS as readonly string[]).includes(pace) ? (pace as JourneyPaceId) : undefined;
}

export function resolvePersonaJourneyPace(
  persona?: Pick<Persona, 'journeyPace'>,
): JourneyPaceId | undefined {
  return normalizeJourneyPaceId(persona?.journeyPace);
}

/** AXM / story-planning segment profile (projected from Character or org packs). */
export type PlanningSegmentJourneyPaceSource = {
  journeyPace?: string;
  overview?: { journeyPace?: string };
};

export function resolvePlanningSegmentJourneyPace(
  segment?: PlanningSegmentJourneyPaceSource,
): JourneyPaceId | undefined {
  return normalizeJourneyPaceId(segment?.journeyPace ?? segment?.overview?.journeyPace);
}

export function resolveSegmentJourneyPaceFromPersonas(
  personas: readonly Pick<Persona, 'segment' | 'journeyPace'>[],
  segmentId: string,
): JourneyPaceId | undefined {
  const target = segmentId.trim();
  if (!target) {
    return undefined;
  }
  for (const persona of personas) {
    if (segmentIdFromPersonaSegment(persona.segment) !== target) {
      continue;
    }
    const pace = resolvePersonaJourneyPace(persona);
    if (pace) {
      return pace;
    }
  }
  return undefined;
}
