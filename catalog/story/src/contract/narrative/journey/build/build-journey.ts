import type { Journey } from '@local-hosting/twinfile-character/pcm';
import {
  journeyHeartSeries,
  journeyHeartTrends,
  phaseObstacleEncounters,
} from '@local-hosting/twinfile-character/pcm';

import type { SamJourney, SamJourneyContext, SamJourneyTouchpoint } from '../../types/sam-journey.js';
import type { SAM } from '../../types/sam.js';
import { resolveJourneyForSam } from './resolve-journey-for-sam.js';

function touchpointLabel(
  touchpointId: string,
  touchpoints: Map<string, SamJourneyTouchpoint>,
): string {
  const tp = touchpoints.get(touchpointId);
  if (!tp) {
    return touchpointId;
  }
  return tp.label ?? tp.pageId ?? tp.flowId ?? touchpointId;
}

function collectTouchpointLabels(
  phase: Journey['phases'][number],
  journey: Journey,
  touchpoints: Map<string, SamJourneyTouchpoint>,
): string[] {
  const labels: string[] = [];
  for (const id of phase.touchpointIds) {
    labels.push(touchpointLabel(id, touchpoints));
  }
  for (const moment of phase.moments ?? []) {
    for (const id of moment.touchpointIds) {
      labels.push(touchpointLabel(id, touchpoints));
    }
  }
  if (labels.length === 0 && journey.label) {
    labels.push(journey.label);
  }
  return labels;
}

/** Build a journey view when the PCM journey row and episode identity are already known. */
export function buildJourneyFromBinding(
  journey: Journey,
  context: SamJourneyContext,
  episode: { samId: string; samTitle: string },
): SamJourney {
  const touchpoints = new Map((context.touchpoints ?? []).map((tp) => [tp.id, tp] as const));
  const obstacles = [...(context.obstacles ?? [])];
  const obstacleText = new Map(obstacles.map((o) => [o.id, o.text]));
  const jobs = context.jobs ?? [];
  const heartByPhase = new Map(journeyHeartSeries(journey, obstacles).map((p) => [p.phaseId, p.values]));

  return {
    samId: episode.samId,
    samTitle: episode.samTitle,
    journeyId: journey.id,
    id: journey.id,
    label: journey.label,
    personaId: journey.personaId,
    phases: journey.phases.map((phase) => ({
      id: phase.id,
      label: phase.label,
      order: phase.order,
      touchpointLabels: collectTouchpointLabels(phase, journey, touchpoints),
      needLabels: phase.jobIds
        .map((id) => jobs.find((j) => j.id === id)?.text ?? id)
        .filter(Boolean),
      obstacles: phaseObstacleEncounters(phase).map((e) => ({
        text: obstacleText.get(e.obstacleId) ?? e.obstacleId,
        outcome: e.outcome,
      })),
      heart: heartByPhase.get(phase.id)!,
    })),
    heartTrends: journeyHeartTrends(journey, obstacles),
  };
}

export function buildJourney(sam: SAM, context: SamJourneyContext): SamJourney {
  const journey = resolveJourneyForSam(sam, context.journeys);
  return buildJourneyFromBinding(journey, context, { samId: sam.id, samTitle: sam.title });
}
