import type { Journey, Character } from '@local-hosting/twinfile-character/character';
import type { PlaceMount } from '../types/place-mount.js';

import { deriveEpisodeTimingFromJobs } from '../episode/derive-episode-timing-from-jobs.js';
import {
  resolveEpisodeTimingVariation,
  resolvePlanningHorizonDays,
  resolveVisitDayIndex,
  type EpisodeTimingVariation,
} from '../episode/planning-horizon.js';
import { projectStoryDimensionsFromStory } from '../project/project-story-dimensions-from-story.js';
import { compileStory } from '../contract/compile-story-narrative.js';
import type { StoryCharacterContext } from '../types/story-character-context.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { Story } from '../types/story-narrative.js';
import type { StoryDimensionsV1 } from '../types/story-dimensions.js';
import type { StoryTouchpointCatalog } from '../types/touchpoint-catalog.js';

export type CompileStoryEpisodeFromMountsInput = {
  story: Story;
  storyJourney: Journey;
  focalCharacter: Character;
  characters: readonly Character[];
  placeMounts: readonly PlaceMount[];
  characterById: Readonly<Record<string, Character>>;
  touchpointCatalog?: StoryTouchpointCatalog;
  simulationEpochStart: string;
  planningHorizonDays?: number;
  visitDayOffset?: number;
  journeyPace?: string;
  subjectId?: string;
  random?: () => number;
  timingVariation?: Partial<EpisodeTimingVariation>;
};

export type CompileStoryEpisodeFromMountsResult = {
  storyArc: EpisodeArcV1;
  touchpointSequence: string[];
  storyId: string;
  story: Story;
  dimensions: StoryDimensionsV1;
};

function storyWithEpisodeBindingOverrides(
  story: Story,
  input: Pick<
    CompileStoryEpisodeFromMountsInput,
    | 'storyJourney'
    | 'simulationEpochStart'
    | 'planningHorizonDays'
    | 'visitDayOffset'
    | 'journeyPace'
    | 'random'
    | 'timingVariation'
  >,
): Story {
  const variation = resolveEpisodeTimingVariation(story.binding.timingVariation, input.timingVariation);
  const derived = deriveEpisodeTimingFromJobs({
    journey: input.storyJourney,
    journeyPace: input.journeyPace,
  });
  const explicitHorizon = input.planningHorizonDays ?? story.binding.planningHorizonDays;
  const sessionEpisode = derived.session;
  const planningHorizonDays = sessionEpisode
    ? 1
    : resolvePlanningHorizonDays(explicitHorizon ?? derived.planningHorizonDays);
  const visitDayIndex = sessionEpisode
    ? 0
    : input.visitDayOffset ??
      story.binding.visitDayIndex ??
      resolveVisitDayIndex({
        visitDayIndex: derived.visitDayIndex,
        journeyPace: input.journeyPace,
        planningHorizonDays,
        random: input.random,
        variation,
      });

  return {
    ...story,
    binding: {
      ...story.binding,
      simulationEpochStart: input.simulationEpochStart,
      planningHorizonDays,
      visitDayIndex,
    },
  };
}

function episodeArcWireFromCompiled(story: Story): EpisodeArcV1 {
  const episodeArc = story.episodeArc;
  if (!episodeArc) {
    throw new Error('compileStory succeeded but episodeArc is missing');
  }
  return {
    version: 1,
    simulationEpochStart: episodeArc.simulationEpochStart,
    planningHorizonDays: episodeArc.planningHorizonDays,
    visitDayIndex: episodeArc.visitDayIndex,
    objectiveTouchpointIds: [...episodeArc.objectiveTouchpointIds],
    phases: episodeArc.phases,
    touchpointSchedule: [...episodeArc.touchpointSchedule],
  };
}

/**
 * Compile a portable story episode from mounted place + Character + Story documents.
 */
export function compileStoryEpisodeFromMounts(
  input: CompileStoryEpisodeFromMountsInput,
): CompileStoryEpisodeFromMountsResult {
  const storyForCompile = storyWithEpisodeBindingOverrides(input.story, input);

  const characterContext: StoryCharacterContext = {
    focalCharacterId: input.focalCharacter.persona.id,
    journeyId: input.storyJourney.id,
    journey: input.storyJourney,
    characterById: input.characterById,
    journeyPace: input.journeyPace,
  };

  const compiled = compileStory({
    story: storyForCompile,
    journey: input.storyJourney,
    touchpointCatalog: input.touchpointCatalog,
    characterContext,
    placeMounts: input.placeMounts,
    knownCharacterIds: input.characters.map((row) => row.persona.id),
    knownPlaceRefs: input.placeMounts.map((row) => row.placeRef),
    subjectId: input.subjectId,
    journeyPace: input.journeyPace,
    random: input.random,
    force: true,
  });

  if (!compiled.ok) {
    throw new Error(`compileStory failed: ${compiled.issues.join('; ')}`);
  }

  const storyArc = episodeArcWireFromCompiled(compiled.story);
  const dimensions = projectStoryDimensionsFromStory({
    story: compiled.story,
    journeyPace: input.journeyPace,
    random: input.random,
  });

  return {
    storyArc,
    touchpointSequence: [...storyArc.objectiveTouchpointIds],
    storyId: input.story.id,
    story: compiled.story,
    dimensions,
  };
}
