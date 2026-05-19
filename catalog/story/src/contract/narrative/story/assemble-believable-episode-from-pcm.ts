import type { Journey, PCM } from '@local-hosting/twinfile-character/pcm';
import type { JobSituationModel } from '@local-hosting/twinfile-character/jsm';
import { rankJobsForPersona } from '@local-hosting/twinfile-character/jsm';
import type { PlaceMount } from '../types/place-mount.js';

import type { EpisodeTimingVariation } from '../types/episode-timing-variation.js';
import { resolvePersonaJourneyPace } from '../story-plan/journey-pace.js';
import { resolveSamEpisodeForPcm } from '../story-catalog/resolve-sam-episode-for-pcm.js';
import { resolveJourneyForSam } from '../journey/build/resolve-journey-for-sam.js';
import { resolveStoryPlanStoreForPlan } from '../story-plan/resolve-story-plan-store.js';
import type { SamStoryPlanFleetVenueSnapshotV1 } from '../types/story-plan-catalog.js';
import type { SAM } from '../types/sam.js';
import type { SAMTouchpointCatalog } from '../types/touchpoint-catalog.js';
import {
  rankPlaceMountsNearAnchor,
  type GeoAnchorV1,
} from '../venue/rank-venues-near-anchor.js';
import {
  compileStoryEpisodeFromMounts,
  type CompileStoryEpisodeFromMountsResult,
} from './compile-story-episode-from-mounts.js';

export type AssembleBelievableEpisodeFromPcmInput = {
  focalPcm: PCM;
  pcms: readonly PCM[];
  placeMounts: readonly PlaceMount[];
  sams: readonly SAM[];
  jsm?: JobSituationModel;
  touchpointCatalog?: SAMTouchpointCatalog;
  samEpisodeId?: string;
  simulationEpochStart: string;
  planningHorizonDays?: number;
  visitDayOffset?: number;
  journeyPace?: string;
  subjectId?: string;
  anchor?: GeoAnchorV1;
  fleetVenues?: readonly SamStoryPlanFleetVenueSnapshotV1[];
  scenario?: string;
  random?: () => number;
  timingVariation?: Partial<EpisodeTimingVariation>;
};

export type BelievableEpisodeAssemblyV1 = {
  samEpisodeId: string;
  journeyId: string;
  rankedJobIds: string[];
  rankedVenueKeys: string[];
  storeSlug?: string;
  preferredVenueKey?: string;
};

export type AssembleBelievableEpisodeFromPcmResult = CompileStoryEpisodeFromMountsResult & {
  assembly: BelievableEpisodeAssemblyV1;
};

function pcmByIdMap(pcms: readonly PCM[]): Record<string, PCM> {
  const map: Record<string, PCM> = {};
  for (const pcm of pcms) {
    map[pcm.id] = pcm;
    map[pcm.persona.id] = pcm;
  }
  return map;
}

function pickSamMount(input: AssembleBelievableEpisodeFromPcmInput): SAM {
  const episodeId = input.samEpisodeId?.trim();
  if (episodeId) {
    const direct = input.sams.find((row) => row.id === episodeId);
    if (!direct) {
      throw new Error(`SAM episode "${episodeId}" is not in mounted catalog`);
    }
    return direct;
  }
  const rankedJobs =
    input.jsm != null
      ? rankJobsForPersona(input.focalPcm, input.jsm).map((row) => row.job.id)
      : [];
  return resolveSamEpisodeForPcm({
    sams: input.sams,
    pcmId: input.focalPcm.persona.id,
    scenario: input.scenario,
    rankedJobIds: rankedJobs,
  });
}

function pickPreferredVenueKey(
  placeMounts: readonly PlaceMount[],
  anchor?: GeoAnchorV1,
): { rankedVenueKeys: string[]; preferredVenueKey?: string } {
  if (placeMounts.length === 0) {
    return { rankedVenueKeys: [] };
  }
  if (anchor) {
    const ranked = rankPlaceMountsNearAnchor(placeMounts, anchor);
    return {
      rankedVenueKeys: ranked.map((row) => row.mount.venueKey),
      preferredVenueKey: ranked[0]?.mount.venueKey,
    };
  }
  return {
    rankedVenueKeys: placeMounts.map((row) => row.venueKey),
    preferredVenueKey: placeMounts[0]?.venueKey,
  };
}

function pickStoreSlug(input: {
  scenario?: string;
  fleetVenues?: readonly SamStoryPlanFleetVenueSnapshotV1[];
  random?: () => number;
}): string | undefined {
  const venues = input.fleetVenues ?? [];
  if (venues.length === 0) {
    return undefined;
  }
  return resolveStoryPlanStoreForPlan({
    fleetVenues: venues,
    scenario: input.scenario,
    random: input.random,
  });
}

export function assembleBelievableEpisodeFromPcm(
  input: AssembleBelievableEpisodeFromPcmInput,
): AssembleBelievableEpisodeFromPcmResult {
  const sam = pickSamMount(input);
  const pcmById = pcmByIdMap(input.pcms);
  const focalPcm = pcmById[sam.binding.pcmId] ?? input.focalPcm;
  const storyJourney: Journey = resolveJourneyForSam(sam, focalPcm.journeys ?? []);

  const rankedJobs =
    input.jsm != null
      ? rankJobsForPersona(focalPcm, input.jsm).map((row) => row.job.id)
      : [];

  const journeyPace =
    input.journeyPace?.trim() ||
    resolvePersonaJourneyPace(focalPcm.persona) ||
    undefined;

  const { rankedVenueKeys, preferredVenueKey } = pickPreferredVenueKey(
    input.placeMounts,
    input.anchor,
  );
  const storeSlug = pickStoreSlug({
    scenario: input.scenario,
    fleetVenues: input.fleetVenues,
    random: input.random,
  });

  const compiled = compileStoryEpisodeFromMounts({
    sam,
    storyJourney,
    focalPcm,
    pcms: input.pcms,
    placeMounts: input.placeMounts,
    pcmById,
    touchpointCatalog: input.touchpointCatalog,
    simulationEpochStart: input.simulationEpochStart,
    planningHorizonDays: input.planningHorizonDays,
    visitDayOffset: input.visitDayOffset,
    journeyPace,
    subjectId: input.subjectId,
    random: input.random,
    timingVariation: input.timingVariation,
  });

  return {
    ...compiled,
    assembly: {
      samEpisodeId: sam.id,
      journeyId: storyJourney.id,
      rankedJobIds: rankedJobs,
      rankedVenueKeys,
      storeSlug,
      preferredVenueKey,
    },
  };
}
