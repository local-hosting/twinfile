import type { Journey, JourneyMoment, JourneyPhase } from '@doppler-group/twinfile-character/pcm';

import type { SceneEmotions, StoryScene } from '../types/scene.js';

function toSceneEmotions(source: JourneyPhase['emotions'] | JourneyMoment['emotions']): SceneEmotions | undefined {
  if (!source) {
    return undefined;
  }
  return {
    band: source.band,
    valence: source.valence,
    feelings: source.feelings,
    curve: source.curve,
  };
}

function findMoment(phase: JourneyPhase, momentId: string): JourneyMoment | undefined {
  return phase.moments?.find((row) => row.id === momentId);
}

function findPhase(journey: Journey, phaseId: string): JourneyPhase | undefined {
  return journey.phases.find((row) => row.id === phaseId);
}

/** Fill scene JTBD / emotions from linked PCM journey phase or moment when not authored on the scene. */
export function hydrateSceneFromJourney(scene: StoryScene, journey: Journey): StoryScene {
  const phaseId = scene.journeyPhaseId?.trim();
  if (!phaseId) {
    return scene;
  }

  const phase = findPhase(journey, phaseId);
  if (!phase) {
    return scene;
  }

  const momentId = scene.journeyMomentId?.trim();
  const moment = momentId ? findMoment(phase, momentId) : undefined;
  const spine = moment ?? phase;

  return {
    ...scene,
    situation: scene.situation ?? spine.situation,
    narrativeBeat: scene.narrativeBeat ?? spine.narrativeBeat,
    jobIds: scene.jobIds ?? spine.jobIds,
    emotions: scene.emotions ?? toSceneEmotions(spine.emotions),
    pain: scene.pain ?? spine.pain,
    gain: scene.gain ?? spine.gain,
  };
}

export function hydrateScenesFromJourney(
  scenes: readonly StoryScene[],
  journey: Journey,
): StoryScene[] {
  return scenes.map((scene) => hydrateSceneFromJourney(scene, journey));
}
