import {
  resolveEpisodeTimingVariation,
  resolvePlanningHorizonDays,
  resolveVisitDayIndex,
} from '../episode/planning-horizon.js';
import type { Story } from '../types/story-narrative.js';
import type {
  StoryDimensionHowV1,
  StoryDimensionWhatV1,
  StoryDimensionWhenV1,
  StoryDimensionWhereV1,
  StoryDimensionWhoV1,
  StoryDimensionWhyV1,
  StoryDimensionsV1,
} from '../types/story-dimensions.js';
import type { DramaticBeatId } from '../types/dramatic-beat.js';

export type ProjectStoryDimensionsFromStoryInput = {
  story: Story;
  journeyPace?: string;
  random?: () => number;
};

function uniqueSorted(ids: Iterable<string>): string[] {
  return [...new Set([...ids].map((id) => id.trim()).filter(Boolean))].sort();
}

function collectWho(story: Story): StoryDimensionWhoV1 {
  const fromScenes = story.scenes.flatMap((scene) => scene.characterIds ?? []);
  const fromCast = story.scenes.flatMap((scene) => (scene.cast ?? []).map((row) => row.characterId));
  const characterIds = uniqueSorted([story.binding.characterId, ...fromScenes, ...fromCast]);
  return {
    characterId: story.binding.characterId,
    characterIds,
  };
}

function collectWhat(story: Story): StoryDimensionWhatV1 {
  return {
    episodeId: story.id,
    journeyId: story.binding.journeyId,
    ...(story.arcTemplate?.kind ? { arcKind: story.arcTemplate.kind } : {}),
  };
}

function collectWhere(story: Story): StoryDimensionWhereV1 {
  const placeRefs = uniqueSorted(story.scenes.map((scene) => scene.placeRef));
  const spaceIds = uniqueSorted(
    story.scenes.flatMap((scene) => (scene.spaceId ? [scene.spaceId] : [])),
  );
  return {
    placeRefs,
    ...(placeRefs[0] ? { primaryPlaceRef: placeRefs[0] } : {}),
    ...(spaceIds.length ? { spaceIds } : {}),
  };
}

function collectWhen(story: Story, input: ProjectStoryDimensionsFromStoryInput): StoryDimensionWhenV1 {
  const planningHorizonDays = resolvePlanningHorizonDays(story.binding.planningHorizonDays);
  const visitDayIndex = resolveVisitDayIndex({
    visitDayIndex: story.binding.visitDayIndex,
    journeyPace: input.journeyPace,
    planningHorizonDays,
    random: input.random,
    variation: resolveEpisodeTimingVariation(story.binding.timingVariation),
  });

  return {
    simulationEpochStart: story.binding.simulationEpochStart,
    planningHorizonDays,
    visitDayIndex,
    ...(story.episodeArc ? { storyArc: story.episodeArc } : {}),
  };
}

function collectWhy(story: Story): StoryDimensionWhyV1 | undefined {
  const jobIds = uniqueSorted(story.scenes.flatMap((scene) => scene.jobIds ?? []));
  const firstBeat = story.scenes.find((scene) => scene.narrativeBeat?.trim())?.narrativeBeat?.trim();
  const firstSituation = story.scenes.find((scene) => scene.situation?.trim())?.situation?.trim();

  if (!jobIds.length && !firstBeat && !firstSituation) {
    return undefined;
  }

  return {
    ...(jobIds.length ? { jobIds } : {}),
    ...(firstSituation ? { situation: firstSituation } : {}),
    ...(firstBeat ? { narrativeBeat: firstBeat } : {}),
  };
}

function collectHow(story: Story, journeyPace?: string): StoryDimensionHowV1 | undefined {
  const dramaticBeatIds = uniqueSorted(
    story.scenes.map((scene) => scene.actId),
  ) as DramaticBeatId[];
  if (!journeyPace?.trim() && dramaticBeatIds.length === 0) {
    return undefined;
  }
  return {
    ...(journeyPace?.trim() ? { journeyPace: journeyPace.trim() } : {}),
    ...(dramaticBeatIds.length ? { dramaticBeatIds } : {}),
  };
}

/**
 * Project compiled Story into the portable 5W+H contract.
 * Call after {@link compileStory} when `episodeArc` should populate `when.storyArc`.
 */
export function projectStoryDimensionsFromStory(
  input: ProjectStoryDimensionsFromStoryInput,
): StoryDimensionsV1 {
  const { story } = input;
  const why = collectWhy(story);
  const how = collectHow(story, input.journeyPace);

  return {
    specVersion: '1.0',
    who: collectWho(story),
    what: collectWhat(story),
    where: collectWhere(story),
    when: collectWhen(story, input),
    ...(why ? { why } : {}),
    ...(how ? { how } : {}),
  };
}
