import type { Journey } from '@local-hosting/twinfile-character/character';
import {
  journeyHeartSeries,
  journeyHeartTrends,
  phaseObstacleEncounters,
} from '@local-hosting/twinfile-character/character';

import type { StoryJourney, StoryJourneyContext, StoryJourneyTouchpoint } from '../../types/story-narrative-journey.js';
import type { Story } from '../../types/story-narrative.js';
import { resolveJourneyForStory } from './resolve-journey-for-story.js';

function touchpointLabel(
  touchpointId: string,
  touchpoints: Map<string, StoryJourneyTouchpoint>,
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
  touchpoints: Map<string, StoryJourneyTouchpoint>,
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

/** Build a journey view when the Character journey row and episode identity are already known. */
export function buildJourneyFromBinding(
  journey: Journey,
  context: StoryJourneyContext,
  episode: { storyId: string; storyTitle: string },
): StoryJourney {
  const touchpoints = new Map((context.touchpoints ?? []).map((tp) => [tp.id, tp] as const));
  const obstacles = [...(context.obstacles ?? [])];
  const obstacleText = new Map(obstacles.map((o) => [o.id, o.text]));
  const jobs = context.jobs ?? [];
  const heartByPhase = new Map(journeyHeartSeries(journey, obstacles).map((p) => [p.phaseId, p.values]));

  return {
    storyId: episode.storyId,
    storyTitle: episode.storyTitle,
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

export function buildJourney(story: Story, context: StoryJourneyContext): StoryJourney {
  const journey = resolveJourneyForStory(story, context.journeys);
  return buildJourneyFromBinding(journey, context, { storyId: story.id, storyTitle: story.title });
}
