/**
 * Org-published **user** catalog menu — PCM + SAM mounted on the org catalog.
 * Place mounts are optional (`placeVenues`) and are not part of user-specific planning menus.
 */
export type SamCatalogCharacterRef = {
  pcmId: string;
  label: string;
  journeyIds: readonly string[];
};

export type SamCatalogEpisodeRef = {
  id: string;
  title: string;
  focalPcmId: string;
  journeyId?: string;
};

export type SamCatalogVenueRef = {
  venueKey: string;
  title: string;
};

export type SamStoryCatalogMenuV1 = {
  characters: readonly SamCatalogCharacterRef[];
  episodes: readonly SamCatalogEpisodeRef[];
  /** Host-only place plane — omit for story.plan / user NL extraction. */
  placeVenues?: readonly SamCatalogVenueRef[];
};

/** Resolved ids for one story run (before compile). PCM spine is on the episode binding. */
export type SamStorySelectionV1 = {
  pcmId: string;
  episodeId: string;
  venueKey?: string;
};
