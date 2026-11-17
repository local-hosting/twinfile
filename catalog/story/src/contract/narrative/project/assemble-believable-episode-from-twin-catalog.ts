import type { Character } from '@local-hosting/twinfile-character/persona';

import { storyWireFocalCharacterArg } from '../story-plan/story-catalog-menu-wire.js';
import {
  assembleBelievableEpisodeFromCharacter,
  type AssembleBelievableEpisodeFromCharacterInput,
  type AssembleBelievableEpisodeFromCharacterResult,
} from '../story/assemble-believable-episode-from-character.js';
import { buildTouchpointGraphFromStories } from '../touchpoint/build-touchpoint-graph-from-stories.js';
import { touchpointCatalogFromWire } from '../touchpoint/touchpoint-catalog.js';
import {
  touchpointGraphToStoryWire,
  type TouchpointGraphWireInput,
} from '../touchpoint/touchpoint-graph-to-wire.js';
import type { TouchpointGraphWire } from '../types/touchpoint-catalog.js';
import type { Story } from '../types/story-narrative.js';

export type AssembleBelievableEpisodeFromTwinCatalogInput = {
  characters: readonly Character[];
  stories: readonly Story[];
  characterId: string;
  storyId?: string;
  touchpointGraph?: TouchpointGraphWireInput | TouchpointGraphWire;
  touchpointGraphFromStories?: { storyId?: string };
} & Omit<
  AssembleBelievableEpisodeFromCharacterInput,
  'focalCharacter' | 'characters' | 'stories' | 'touchpointCatalog'
>;

function resolveFocalCharacter(characters: readonly Character[], characterId: string): Character {
  const id = characterId.trim();
  const found =
    characters.find((row) => row.persona.id === id || row.id === id) ?? characters[0];
  if (!found) {
    throw new Error('twin catalog has no characters');
  }
  return found;
}

/** Believable Story assembly from an in-memory project twin catalog (no locker). */
export function assembleBelievableEpisodeFromTwinCatalog(
  input: AssembleBelievableEpisodeFromTwinCatalogInput,
): AssembleBelievableEpisodeFromCharacterResult {
  const focalCharacter = resolveFocalCharacter(input.characters, input.characterId);

  const graphWire: TouchpointGraphWire =
    input.touchpointGraph != null
      ? touchpointGraphToStoryWire(input.touchpointGraph)
      : buildTouchpointGraphFromStories(input.stories, {
          storyId: input.storyId ?? input.touchpointGraphFromStories?.storyId,
          placeMounts: input.placeMounts,
        });

  const touchpointCatalog = touchpointCatalogFromWire(graphWire);

  return assembleBelievableEpisodeFromCharacter({
    ...storyWireFocalCharacterArg(focalCharacter),
    characters: input.characters,
    stories: input.stories,
    placeMounts: input.placeMounts ?? [],
    touchpointCatalog,
    storyId: input.storyId,
    context: input.context,
    simulationEpochStart: input.simulationEpochStart,
    planningHorizonDays: input.planningHorizonDays,
    visitDayOffset: input.visitDayOffset,
    journeyPace: input.journeyPace,
    subjectId: input.subjectId,
    anchor: input.anchor,
    fleetPlaces: input.fleetPlaces,
    scenario: input.scenario,
    random: input.random,
    timingVariation: input.timingVariation,
  });
}