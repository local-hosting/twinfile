import type { Journey, Character } from '@local-hosting/twinfile-character/persona';
import type { JobSituationModel } from '@local-hosting/twinfile-character/situations';
import { rankJobsForPersona } from '@local-hosting/twinfile-character/situations';
import type { PlaceMount } from '../types/place-mount.js';

import type { EpisodeTimingVariation } from '../types/episode-timing-variation.js';
import { resolvePersonaJourneyPace } from '../story-plan/journey-pace.js';
import { resolveStoryEpisodeForCharacter } from '../story-catalog/resolve-story-episode-for-character.js';
import { resolveJourneyForStory } from '../journey/build/resolve-journey-for-story.js';
import { resolveStoryPlanStoreForPlan } from '../story-plan/resolve-story-plan-store.js';
import type { SamStoryPlanFleetPlaceSnapshotV1 } from '../types/story-plan-catalog.js';
import type { Story } from '../types/story-narrative.js';
import type { StoryTouchpointCatalog } from '../types/touchpoint-catalog.js';
import {
  rankPlaceMountsNearAnchor,
  type GeoAnchorV1,
} from '../place/rank-places-near-anchor.js';
import {
  compileStoryEpisodeFromMounts,
  type CompileStoryEpisodeFromMountsResult,
} from './compile-story-episode-from-mounts.js';

export type AssembleBelievableEpisodeFromCharacterInput = {
  focalCharacter: Character;
  characters: readonly Character[];
  placeMounts: readonly PlaceMount[];
  stories: readonly Story[];
  situations?: JobSituationModel;
  touchpointCatalog?: StoryTouchpointCatalog;
  episodeId?: string;
  simulationEpochStart: string;
  planningHorizonDays?: number;
  visitDayOffset?: number;
  journeyPace?: string;
  subjectId?: string;
  anchor?: GeoAnchorV1;
  fleetPlaces?: readonly SamStoryPlanFleetPlaceSnapshotV1[];
  scenario?: string;
  random?: () => number;
  timingVariation?: Partial<EpisodeTimingVariation>;
};

export type BelievableEpisodeAssemblyV1 = {
  episodeId: string;
  journeyId: string;
  rankedJobIds: string[];
  rankedPlaceRefs: string[];
  storeSlug?: string;
  preferredPlaceRef?: string;
};

export type AssembleBelievableEpisodeFromCharacterResult = CompileStoryEpisodeFromMountsResult & {
  assembly: BelievableEpisodeAssemblyV1;
};

function characterByIdMap(characters: readonly Character[]): Record<string, Character> {
  const map: Record<string, Character> = {};
  for (const character of characters) {
    map[character.id] = character;
    map[character.persona.id] = character;
  }
  return map;
}

function pickStoryMount(input: AssembleBelievableEpisodeFromCharacterInput): Story {
  const episodeId = input.episodeId?.trim();
  if (episodeId) {
    const direct = input.stories.find((row) => row.id === episodeId);
    if (!direct) {
      throw new Error(`Story episode "${episodeId}" is not in mounted catalog`);
    }
    return direct;
  }
  const rankedJobs =
    input.situations != null
      ? rankJobsForPersona(input.focalCharacter, input.situations).map((row) => row.job.id)
      : [];
  return resolveStoryEpisodeForCharacter({
    stories: input.stories,
    characterId: input.focalCharacter.persona.id,
    scenario: input.scenario,
    rankedJobIds: rankedJobs,
  });
}

function pickPreferredPlaceRef(
  placeMounts: readonly PlaceMount[],
  anchor?: GeoAnchorV1,
): { rankedPlaceRefs: string[]; preferredPlaceRef?: string } {
  if (placeMounts.length === 0) {
    return { rankedPlaceRefs: [] };
  }
  if (anchor) {
    const ranked = rankPlaceMountsNearAnchor(placeMounts, anchor);
    return {
      rankedPlaceRefs: ranked.map((row) => row.mount.placeRef),
      preferredPlaceRef: ranked[0]?.mount.placeRef,
    };
  }
  return {
    rankedPlaceRefs: placeMounts.map((row) => row.placeRef),
    preferredPlaceRef: placeMounts[0]?.placeRef,
  };
}

function pickStoreSlug(input: {
  scenario?: string;
  fleetPlaces?: readonly SamStoryPlanFleetPlaceSnapshotV1[];
  random?: () => number;
}): string | undefined {
  const places = input.fleetPlaces ?? [];
  if (places.length === 0) {
    return undefined;
  }
  return resolveStoryPlanStoreForPlan({
    fleetPlaces: places,
    scenario: input.scenario,
    random: input.random,
  });
}

export function assembleBelievableEpisodeFromCharacter(
  input: AssembleBelievableEpisodeFromCharacterInput,
): AssembleBelievableEpisodeFromCharacterResult {
  const story = pickStoryMount(input);
  const characterById = characterByIdMap(input.characters);
  const focalCharacter = characterById[story.binding.characterId] ?? input.focalCharacter;
  const storyJourney: Journey = resolveJourneyForStory(story, focalCharacter.journeys ?? []);

  const rankedJobs =
    input.situations != null
      ? rankJobsForPersona(focalCharacter, input.situations).map((row) => row.job.id)
      : [];

  const journeyPace =
    input.journeyPace?.trim() ||
    resolvePersonaJourneyPace(focalCharacter.persona) ||
    undefined;

  const { rankedPlaceRefs, preferredPlaceRef } = pickPreferredPlaceRef(
    input.placeMounts,
    input.anchor,
  );
  const storeSlug = pickStoreSlug({
    scenario: input.scenario,
    fleetPlaces: input.fleetPlaces,
    random: input.random,
  });

  const compiled = compileStoryEpisodeFromMounts({
    story,
    storyJourney,
    focalCharacter,
    characters: input.characters,
    placeMounts: input.placeMounts,
    characterById,
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
      episodeId: story.id,
      journeyId: storyJourney.id,
      rankedJobIds: rankedJobs,
      rankedPlaceRefs,
      storeSlug,
      preferredPlaceRef,
    },
  };
}
