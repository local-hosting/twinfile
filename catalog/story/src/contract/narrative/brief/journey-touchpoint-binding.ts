import type { Journey, JourneyMoment, JourneyPhase } from '@doppler-group/twinfile-character/character';

export type JourneyTouchpointBindingV1 = {
  phase: JourneyPhase;
  moment?: JourneyMoment;
};

function orderedPhases(journey: Journey): JourneyPhase[] {
  return [...journey.phases].sort((left, right) => left.order - right.order);
}

/** Character journey row that owns a touchpoint (phase or nested moment). */
export function findJourneyTouchpointBinding(
  journey: Journey | undefined,
  touchpointId: string,
): JourneyTouchpointBindingV1 | undefined {
  const needle = touchpointId.trim();
  if (!needle || !journey?.phases?.length) {
    return undefined;
  }

  for (const phase of orderedPhases(journey)) {
    if (phase.touchpointIds?.some((id) => id.trim() === needle)) {
      return { phase };
    }
    const moments = [...(phase.moments ?? [])].sort((left, right) => left.order - right.order);
    for (const moment of moments) {
      if (moment.touchpointIds?.some((id) => id.trim() === needle)) {
        return { phase, moment };
      }
    }
  }

  return undefined;
}

export function collectJobIdsFromJourney(journey: Journey | undefined): string[] {
  if (!journey) {
    return [];
  }
  const ids = new Set<string>();
  for (const phase of journey.phases) {
    for (const jobId of phase.jobIds ?? []) {
      ids.add(jobId.trim());
    }
    for (const moment of phase.moments ?? []) {
      for (const jobId of moment.jobIds ?? []) {
        ids.add(jobId.trim());
      }
    }
  }
  return [...ids].filter(Boolean).sort();
}

export function journeyHasCalendarSpan(journey: Journey | undefined): boolean {
  if (!journey) {
    return false;
  }
  for (const phase of journey.phases) {
    for (const moment of phase.moments ?? []) {
      if (moment.period?.trim()) {
        return true;
      }
    }
  }
  return Boolean(journey.seriesId?.trim());
}
