import type { Character } from '@doppler-group/twinfile-character/persona';
import { matchStoryCatalogIdsFromText } from '../story-catalog/match-story-catalog-from-text.js';
import type { StoryCatalogMenuV1 } from '../types/story-catalog-menu.js';

export type StoryMenuEpisodeWire = {
  id: string;
  title?: string;
  journeyId?: string;
  focalCharacterId?: string;
};

export function focalCharacterIdFromStoryMenuEpisode(
  episode: Pick<StoryMenuEpisodeWire, 'focalCharacterId'>,
): string | undefined {
  const id = episode.focalCharacterId?.trim();
  return id || undefined;
}

/** @deprecated Use {@link focalCharacterIdFromStoryMenuEpisode}. */
export const personaMountIdFromStoryMenuEpisode = focalCharacterIdFromStoryMenuEpisode;

export function focalCharacterFromStoryEpisodeMount(mount: { focalCharacter: Character }): Character {
  return mount.focalCharacter;
}

export type StoryPlanJourneyRowWire = {
  id: string;
  label?: string;
  focalCharacterId?: string;
  journeyId?: string;
};

export function storyPlanJourneyRowsFromMenuEpisodes(
  episodes: readonly StoryMenuEpisodeWire[],
): StoryPlanJourneyRowWire[] {
  return episodes.map((row) => ({
    id: row.id,
    label: row.title,
    focalCharacterId: focalCharacterIdFromStoryMenuEpisode(row),
    journeyId: row.journeyId,
  }));
}

export function matchStoryCatalogIdsFromTextForPlanning(input: {
  text: string;
  menu: StoryCatalogMenuV1;
  fleetPlaces?: Parameters<typeof matchStoryCatalogIdsFromText>[0]['fleetPlaces'];
  focalCharacterId?: string;
  personaMountId?: string;
  includePlaces?: boolean;
}) {
  const focalCharacterId = (input.focalCharacterId ?? input.personaMountId)?.trim();
  return matchStoryCatalogIdsFromText({
    text: input.text,
    menu: input.menu,
    fleetPlaces: input.fleetPlaces,
    includePlaces: input.includePlaces === true,
    ...(focalCharacterId ? { focalCharacterId } : {}),
  });
}

/** @deprecated Use {@link matchStoryCatalogIdsFromTextForPlanning}. */
export const matchStoryCatalogIdsFromTextForFieldwise = matchStoryCatalogIdsFromTextForPlanning;

export function storyWireFocalCharacterArg(character: Character): { focalCharacter: Character } {
  return { focalCharacter: character };
}

export function storyWireFocalCharacterField(
  character: Character | undefined,
): { focalCharacter: Character | undefined } {
  return { focalCharacter: character };
}

export function storyMenuEpisodeRefForTest(input: {
  id: string;
  title?: string;
  journeyId?: string;
  focalCharacterId?: string;
  personaMountId?: string;
}): StoryMenuEpisodeWire {
  const focalCharacterId = (input.focalCharacterId ?? input.personaMountId)?.trim();
  return {
    id: input.id,
    title: input.title,
    journeyId: input.journeyId,
    ...(focalCharacterId ? { focalCharacterId } : {}),
  };
}