import type { Journey, JourneyRelationshipEdge } from '../../types/story/journey.js';

/** Emit journey trace edges (phase/moment → touchpoint ids on structure). */
export function buildJourneyRelationshipEdges(journey: Journey): JourneyRelationshipEdge[] {
  const edges: JourneyRelationshipEdge[] = [
    { kind: 'journey_for_character', journeyId: journey.id, characterId: journey.characterId },
  ];

  for (const phase of journey.phases) {
    for (const jobId of phase.jobIds) {
      edges.push({
        kind: 'journey_phase_job',
        journeyId: journey.id,
        phaseId: phase.id,
        jobId,
      });
    }
    for (const touchpointId of phase.touchpointIds) {
      edges.push({
        kind: 'journey_phase_touchpoint',
        journeyId: journey.id,
        phaseId: phase.id,
        touchpointId,
      });
    }
    for (const { obstacleId } of phase.obstacles ?? []) {
      edges.push({ kind: 'journey_phase_obstacle', journeyId: journey.id, phaseId: phase.id, obstacleId });
    }

    for (const moment of phase.moments ?? []) {
      for (const jobId of moment.jobIds ?? []) {
        edges.push({
          kind: 'journey_moment_job',
          journeyId: journey.id,
          momentId: moment.id,
          jobId,
        });
      }
      for (const touchpointId of moment.touchpointIds) {
        edges.push({
          kind: 'journey_moment_touchpoint',
          journeyId: journey.id,
          momentId: moment.id,
          touchpointId,
        });
      }
      for (const { obstacleId } of moment.obstacles ?? []) {
        edges.push({
          kind: 'journey_moment_obstacle',
          journeyId: journey.id,
          momentId: moment.id,
          obstacleId,
        });
      }
    }
  }

  return edges;
}
