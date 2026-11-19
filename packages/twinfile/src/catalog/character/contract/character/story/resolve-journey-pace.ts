import { segmentIdFromCharacterSegment } from '../persona/segment-id-from-character.js';
import type { CharacterPersona } from '../types/character-persona.js';
import { JOURNEY_PACE_IDS, type JourneyPaceId } from '../types/story/journey-pace.js';

export function normalizeJourneyPaceId(value?: string): JourneyPaceId | undefined {
  const pace = value?.trim().toLowerCase();
  if (!pace) {
    return undefined;
  }
  return (JOURNEY_PACE_IDS as readonly string[]).includes(pace) ? (pace as JourneyPaceId) : undefined;
}

export function resolveCharacterJourneyPace(
  sheet?: Pick<CharacterPersona, 'journeyPace'>,
): JourneyPaceId | undefined {
  return normalizeJourneyPaceId(sheet?.journeyPace);
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

export function resolveSegmentJourneyPaceFromCharacters(
  sheets: readonly Pick<CharacterPersona, 'segment' | 'journeyPace'>[],
  segmentId: string,
): JourneyPaceId | undefined {
  const target = segmentId.trim();
  if (!target) {
    return undefined;
  }
  for (const sheet of sheets) {
    if (segmentIdFromCharacterSegment(sheet.segment) !== target) {
      continue;
    }
    const pace = resolveCharacterJourneyPace(sheet);
    if (pace) {
      return pace;
    }
  }
  return undefined;
}
