import type { Journey, PCM } from '@doppler-group/twinfile-character/pcm';
import type { PlaceMount } from '../types/place-mount.js';

import { deriveEpisodeTimingFromJobs } from '../episode/derive-episode-timing-from-jobs.js';
import {
  resolveEpisodeTimingVariation,
  resolvePlanningHorizonDays,
  resolveVisitDayIndex,
  type EpisodeTimingVariation,
} from '../episode/planning-horizon.js';
import { projectStoryDimensionsFromSam } from '../project/project-story-dimensions-from-sam.js';
import { compileSAM } from '../contract/compile-sam.js';
import type { SAMCharacterContext } from '../types/sam-character-context.js';
import type { EpisodeArcV1 } from '../types/episode-arc.js';
import type { SAM } from '../types/sam.js';
import type { SamStoryDimensionsV1 } from '../types/story-dimensions.js';
import type { SAMTouchpointCatalog } from '../types/touchpoint-catalog.js';

export type CompileStoryEpisodeFromMountsInput = {
  sam: SAM;
  storyJourney: Journey;
  focalPcm: PCM;
  pcms: readonly PCM[];
  placeMounts: readonly PlaceMount[];
  pcmById: Readonly<Record<string, PCM>>;
  touchpointCatalog?: SAMTouchpointCatalog;
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
  samEpisodeId: string;
  sam: SAM;
  dimensions: SamStoryDimensionsV1;
};

function samWithEpisodeBindingOverrides(
  sam: SAM,
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
): SAM {
  const variation = resolveEpisodeTimingVariation(sam.binding.timingVariation, input.timingVariation);
  const derived = deriveEpisodeTimingFromJobs({
    journey: input.storyJourney,
    journeyPace: input.journeyPace,
  });
  const explicitHorizon = input.planningHorizonDays ?? sam.binding.planningHorizonDays;
  const sessionEpisode = derived.session;
  const planningHorizonDays = sessionEpisode
    ? 1
    : resolvePlanningHorizonDays(explicitHorizon ?? derived.planningHorizonDays);
  const visitDayIndex = sessionEpisode
    ? 0
    : input.visitDayOffset ??
      sam.binding.visitDayIndex ??
      resolveVisitDayIndex({
        visitDayIndex: derived.visitDayIndex,
        journeyPace: input.journeyPace,
        planningHorizonDays,
        random: input.random,
        variation,
      });

  return {
    ...sam,
    binding: {
      ...sam.binding,
      simulationEpochStart: input.simulationEpochStart,
      planningHorizonDays,
      visitDayIndex,
    },
  };
}

function episodeArcWireFromCompiled(sam: SAM): EpisodeArcV1 {
  const episodeArc = sam.episodeArc;
  if (!episodeArc) {
    throw new Error('compileSAM succeeded but episodeArc is missing');
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
 * Compile a portable story episode from mounted place + PCM + SAM documents.
 */
export function compileStoryEpisodeFromMounts(
  input: CompileStoryEpisodeFromMountsInput,
): CompileStoryEpisodeFromMountsResult {
  const samForCompile = samWithEpisodeBindingOverrides(input.sam, input);

  const characterContext: SAMCharacterContext = {
    focalPcmId: input.focalPcm.persona.id,
    journeyId: input.storyJourney.id,
    journey: input.storyJourney,
    pcmById: input.pcmById,
    journeyPace: input.journeyPace,
  };

  const compiled = compileSAM({
    sam: samForCompile,
    journey: input.storyJourney,
    touchpointCatalog: input.touchpointCatalog,
    characterContext,
    placeMounts: input.placeMounts,
    knownPcmIds: input.pcms.map((row) => row.persona.id),
    knownPlaceRefs: input.placeMounts.map((row) => row.placeRef),
    subjectId: input.subjectId,
    journeyPace: input.journeyPace,
    random: input.random,
    force: true,
  });

  if (!compiled.ok) {
    throw new Error(`compileSAM failed: ${compiled.issues.join('; ')}`);
  }

  const storyArc = episodeArcWireFromCompiled(compiled.sam);
  const dimensions = projectStoryDimensionsFromSam({
    sam: compiled.sam,
    journeyPace: input.journeyPace,
    random: input.random,
  });

  return {
    storyArc,
    touchpointSequence: [...storyArc.objectiveTouchpointIds],
    samEpisodeId: input.sam.id,
    sam: compiled.sam,
    dimensions,
  };
}
