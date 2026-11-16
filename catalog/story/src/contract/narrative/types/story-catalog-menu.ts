/**
 * Project-published **user** catalog menu — Character + Story on the project locker.
 * Place mounts are optional (`places`) and are not part of user-specific planning menus.
 */
export type StoryCatalogCharacterRef = {
  characterId: string;
  label: string;
  journeyIds: readonly string[];
};

export type StoryCatalogEpisodeRef = {
  id: string;
  title: string;
  focalCharacterId: string;
  journeyId?: string;
};

export type StoryCatalogPlaceRef = {
  placeRef: string;
  title: string;
};

export type StoryCatalogMenuV1 = {
  characters: readonly StoryCatalogCharacterRef[];
  episodes: readonly StoryCatalogEpisodeRef[];
  /** Host-only place plane — omit for story.plan / user NL extraction. */
  places?: readonly StoryCatalogPlaceRef[];
};

/** Resolved ids for one story run (before compile). Character spine is on the episode binding. */
export type StorySelectionV1 = {
  characterId: string;
  episodeId: string;
  placeRef?: string;
};
