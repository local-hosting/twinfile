import type { Journey, JourneyPhase } from '@local-hosting/twinfile-character/character';

import type { StoryBinding } from '../types/story-narrative.js';
import type { StoryCharacterRef } from '../types/story-refs.js';
import type { StoryScene } from '../types/scene.js';
import type { StoryArcKind } from '../types/story-arc-kind.js';
import type { StoryArcTemplate } from '../types/story-arc-template.js';
import { defaultActsForStoryArcKind, WRITE_PRACTICE_ARC_PRESETS } from './write-practice-presets.js';

export type BuildStoryArcTemplateFromKindInput = {
  kind: StoryArcKind;
  id?: string;
  label?: string;
};

export function buildStoryArcTemplateFromKind(
  input: BuildStoryArcTemplateFromKindInput,
): StoryArcTemplate {
  const preset = WRITE_PRACTICE_ARC_PRESETS[input.kind];
  return {
    id: input.id ?? `arc:${input.kind}`,
    label: input.label ?? preset.label,
    kind: input.kind,
    description: preset.summary,
    acts: defaultActsForStoryArcKind(input.kind),
  };
}

function orderedPhases(journey: Journey): JourneyPhase[] {
  return [...journey.phases].sort((left, right) => left.order - right.order);
}

function touchpointIdsForPhase(phase: JourneyPhase): string[] {
  const ids: string[] = [...phase.touchpointIds];
  for (const moment of [...(phase.moments ?? [])].sort((a, b) => a.order - b.order)) {
    for (const touchpointId of moment.touchpointIds ?? []) {
      ids.push(touchpointId);
    }
  }
  return ids;
}

export type ScaffoldScenesFromJourneyArcInput = {
  kind: StoryArcKind;
  journey: Journey;
  /** Default place place key for every scene. */
  placeRef: string;
  characterIds?: string[];
};

/**
 * Map Character journey phases onto the dramatic beat rail for a Write Practice arc kind
 * (one storyboard scene per journey phase).
 */
export function scaffoldScenesFromJourneyArc(
  input: ScaffoldScenesFromJourneyArcInput,
): StoryScene[] {
  const beats = defaultActsForStoryArcKind(input.kind);
  const phases = orderedPhases(input.journey);
  const characterIds = input.characterIds ?? [input.journey.characterId];

  return phases.map((phase, index) => {
    const beatIndex =
      phases.length <= 1 ? 0 : Math.floor((index * beats.length) / phases.length);
    const beat = beats[Math.min(beatIndex, beats.length - 1)];

    return {
      id: `scene:${phase.id.replace(/^phase:/, '')}`,
      label: phase.label,
      order: index,
      actId: beat.id,
      characterIds,
      placeRef: input.placeRef,
      journeyPhaseId: phase.id,
      jobIds: phase.jobIds?.length ? [...phase.jobIds] : undefined,
      emotions: phase.emotions
        ? {
            band: phase.emotions.band,
            valence: phase.emotions.valence,
            feelings: phase.emotions.feelings,
          }
        : undefined,
      pain: phase.pain,
      gain: phase.gain,
      touchpointIds: touchpointIdsForPhase(phase),
    };
  });
}

export type GenerateStoryEpisodeFromArcInput = {
  kind: StoryArcKind;
  journey: Journey;
  storyId: string;
  title: string;
  revision: number;
  focalCharacterId: string;
  placeRef: string;
  simulationEpochStart: string;
  planningHorizonDays?: number;
  visitDayIndex?: number;
  /** Additional cast beyond the focal Character. */
  characters?: StoryCharacterRef[];
};

export type GeneratedStoryEpisodeDraft = {
  arcTemplate: StoryArcTemplate;
  scenes: StoryScene[];
  characters: StoryCharacterRef[];
  binding: StoryBinding;
};

/**
 * Draft a Story episode from a Write Practice arc kind + authored Character journey
 * (acts rail + scenes). Run {@link compileStory} / {@link generateEpisodeCalendar} next.
 */
export function generateStoryEpisodeFromArc(
  input: GenerateStoryEpisodeFromArcInput,
): GeneratedStoryEpisodeDraft {
  const arcTemplate = buildStoryArcTemplateFromKind({
    kind: input.kind,
    id: `arc:${input.storyId.replace(/^story:/, '')}`,
    label: input.title,
  });

  const scenes = scaffoldScenesFromJourneyArc({
    kind: input.kind,
    journey: input.journey,
    placeRef: input.placeRef,
    characterIds: [input.focalCharacterId],
  });

  const characters: StoryCharacterRef[] =
    input.characters?.length
      ? input.characters
      : [{ characterId: input.focalCharacterId, primary: true }];

  return {
    arcTemplate,
    scenes,
    characters,
    binding: {
      characterId: input.focalCharacterId,
      journeyId: input.journey.id,
      simulationEpochStart: input.simulationEpochStart,
      planningHorizonDays: input.planningHorizonDays,
      visitDayIndex: input.visitDayIndex,
    },
  };
}
