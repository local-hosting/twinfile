import type { Character } from '@local-hosting/twinfile-character/character';

import { resolveStoryEpisode } from '../story-catalog/resolve-story-episode.js';
import {
  compileStoryEpisodeFromMounts,
  type CompileStoryEpisodeFromMountsInput,
  type CompileStoryEpisodeFromMountsResult,
} from '../story/compile-story-episode-from-mounts.js';
import { buildTouchpointGraphFromStories } from '../touchpoint/build-touchpoint-graph-from-stories.js';
import {
  touchpointGraphToStoryWire,
  touchpointGraphWireToCatalog,
  type TouchpointGraphWireInput,
} from '../touchpoint/touchpoint-graph-to-wire.js';
import type { TouchpointGraphWire } from '../types/touchpoint-catalog.js';
import type { Story } from '../types/story-narrative.js';

export type CompileStoryEpisodeFromTwinCatalogInput = {
  characters: readonly Character[];
  stories: readonly Story[];
  storyId?: string;
  characterId?: string;
  touchpointGraph?: TouchpointGraphWireInput | TouchpointGraphWire;
  touchpointGraphFromStories?: { storyId?: string };
} & Pick<
  CompileStoryEpisodeFromMountsInput,
  | 'simulationEpochStart'
  | 'planningHorizonDays'
  | 'visitDayOffset'
  | 'journeyPace'
  | 'subjectId'
  | 'random'
  | 'timingVariation'
  | 'placeMounts'
>;

/** Compile a Story run from an in-memory project twin catalog (no locker). */
export function compileStoryEpisodeFromTwinCatalog(
  input: CompileStoryEpisodeFromTwinCatalogInput,
): CompileStoryEpisodeFromMountsResult {
  const mount = resolveStoryEpisode({
    stories: input.stories,
    characters: input.characters,
    selection: { storyId: input.storyId, characterId: input.characterId },
  });

  const touchpointWire: TouchpointGraphWire =
    input.touchpointGraph != null
      ? touchpointGraphToStoryWire(input.touchpointGraph)
      : buildTouchpointGraphFromStories(input.stories, input.touchpointGraphFromStories ?? {});
  const touchpointCatalog = touchpointGraphWireToCatalog(touchpointWire);

  return compileStoryEpisodeFromMounts({
    story: mount.story,
    storyJourney: mount.journey,
    focalCharacter: mount.focalCharacter,
    characters: input.characters,
    characterById: mount.characterById,
    placeMounts: input.placeMounts ?? [],
    touchpointCatalog,
    simulationEpochStart: input.simulationEpochStart,
    planningHorizonDays: input.planningHorizonDays,
    visitDayOffset: input.visitDayOffset,
    journeyPace: input.journeyPace,
    subjectId: input.subjectId,
    random: input.random,
    timingVariation: input.timingVariation,
  });
}