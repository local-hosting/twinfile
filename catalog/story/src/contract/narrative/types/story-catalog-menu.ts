/**
 * Org-published **user** catalog menu — Character + Story mounted on the org catalog.
 * Place mounts are optional (`places`) and are not part of user-specific planning menus.
 */
export type SamCatalogCharacterRef = {
  characterId: string;
  label: string;
  journeyIds: readonly string[];
};

export type SamCatalogEpisodeRef = {
  id: string;
  title: string;
  focalCharacterId: string;
  journeyId?: string;
};

export type SamCatalogPlaceRef = {
  placeRef: string;
  title: string;
};

export type StoryCatalogMenuV1 = {
  characters: readonly SamCatalogCharacterRef[];
  episodes: readonly SamCatalogEpisodeRef[];
  /** Host-only place plane — omit for story.plan / user NL extraction. */
  places?: readonly SamCatalogPlaceRef[];
};

/** Resolved ids for one story run (before compile). Character spine is on the episode binding. */
export type SamStorySelectionV1 = {
  characterId: string;
  episodeId: string;
  placeRef?: string;
};
