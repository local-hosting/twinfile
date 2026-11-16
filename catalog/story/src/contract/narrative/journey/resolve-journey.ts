import type { Journey } from '@doppler-group/twinfile-character/pcm';

export function resolveJourneyById(
  journeys: readonly Journey[],
  journeyId: string,
): Journey | undefined {
  const id = journeyId.trim();
  return journeys.find((row) => row.id === id);
}

export function requireJourneyById(journeys: readonly Journey[], journeyId: string): Journey {
  const journey = resolveJourneyById(journeys, journeyId);
  if (!journey) {
    throw new Error(`Unknown journey "${journeyId}"`);
  }
  return journey;
}
