import {
  resolveEpisodeTimingVariation,
  resolvePlanningHorizonDays,
  resolveVisitDayIndex,
} from '../episode/planning-horizon.js';
import type { SAM } from '../types/sam.js';
import type {
  SamStoryDimensionHowV1,
  SamStoryDimensionWhatV1,
  SamStoryDimensionWhenV1,
  SamStoryDimensionWhereV1,
  SamStoryDimensionWhoV1,
  SamStoryDimensionWhyV1,
  SamStoryDimensionsV1,
} from '../types/story-dimensions.js';
import type { DramaticBeatId } from '../types/dramatic-beat.js';

export type ProjectStoryDimensionsFromSamInput = {
  sam: SAM;
  journeyPace?: string;
  random?: () => number;
};

function uniqueSorted(ids: Iterable<string>): string[] {
  return [...new Set([...ids].map((id) => id.trim()).filter(Boolean))].sort();
}

function collectWho(sam: SAM): SamStoryDimensionWhoV1 {
  const fromScenes = sam.scenes.flatMap((scene) => scene.characterIds ?? []);
  const fromCast = sam.scenes.flatMap((scene) => (scene.cast ?? []).map((row) => row.pcmId));
  const characterIds = uniqueSorted([sam.binding.pcmId, ...fromScenes, ...fromCast]);
  return {
    pcmId: sam.binding.pcmId,
    characterIds,
  };
}

function collectWhat(sam: SAM): SamStoryDimensionWhatV1 {
  return {
    samEpisodeId: sam.id,
    journeyId: sam.binding.journeyId,
    ...(sam.arcTemplate?.kind ? { arcKind: sam.arcTemplate.kind } : {}),
  };
}

function collectWhere(sam: SAM): SamStoryDimensionWhereV1 {
  const venueKeys = uniqueSorted(sam.scenes.map((scene) => scene.venueKey));
  const spaceIds = uniqueSorted(
    sam.scenes.flatMap((scene) => (scene.spaceId ? [scene.spaceId] : [])),
  );
  return {
    venueKeys,
    ...(venueKeys[0] ? { primaryVenueKey: venueKeys[0] } : {}),
    ...(spaceIds.length ? { spaceIds } : {}),
  };
}

function collectWhen(sam: SAM, input: ProjectStoryDimensionsFromSamInput): SamStoryDimensionWhenV1 {
  const planningHorizonDays = resolvePlanningHorizonDays(sam.binding.planningHorizonDays);
  const visitDayIndex = resolveVisitDayIndex({
    visitDayIndex: sam.binding.visitDayIndex,
    journeyPace: input.journeyPace,
    planningHorizonDays,
    random: input.random,
    variation: resolveEpisodeTimingVariation(sam.binding.timingVariation),
  });

  return {
    simulationEpochStart: sam.binding.simulationEpochStart,
    planningHorizonDays,
    visitDayIndex,
    ...(sam.episodeArc ? { storyArc: sam.episodeArc } : {}),
  };
}

function collectWhy(sam: SAM): SamStoryDimensionWhyV1 | undefined {
  const jobIds = uniqueSorted(sam.scenes.flatMap((scene) => scene.jobIds ?? []));
  const firstBeat = sam.scenes.find((scene) => scene.narrativeBeat?.trim())?.narrativeBeat?.trim();
  const firstSituation = sam.scenes.find((scene) => scene.situation?.trim())?.situation?.trim();

  if (!jobIds.length && !firstBeat && !firstSituation) {
    return undefined;
  }

  return {
    ...(jobIds.length ? { jobIds } : {}),
    ...(firstSituation ? { situation: firstSituation } : {}),
    ...(firstBeat ? { narrativeBeat: firstBeat } : {}),
  };
}

function collectHow(sam: SAM, journeyPace?: string): SamStoryDimensionHowV1 | undefined {
  const dramaticBeatIds = uniqueSorted(
    sam.scenes.map((scene) => scene.actId),
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
 * Project compiled SAM into the portable 5W+H contract.
 * Call after {@link compileSAM} when `episodeArc` should populate `when.storyArc`.
 */
export function projectStoryDimensionsFromSam(
  input: ProjectStoryDimensionsFromSamInput,
): SamStoryDimensionsV1 {
  const { sam } = input;
  const why = collectWhy(sam);
  const how = collectHow(sam, input.journeyPace);

  return {
    specVersion: '1.0',
    who: collectWho(sam),
    what: collectWhat(sam),
    where: collectWhere(sam),
    when: collectWhen(sam, input),
    ...(why ? { why } : {}),
    ...(how ? { how } : {}),
  };
}
