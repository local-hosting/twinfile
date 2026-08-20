/** Character character mounted on this story run (see `@local-hosting/twinfile-character/persona`). */
export type StoryCharacterRef = {
  characterId: string;
  /** Cast label for multi-character episodes (e.g. driver, rider). */
  role?: string;
  /** Focal character when several Characters are associated; one should be true. */
  primary?: boolean;
};

/** Place mounted on this story run (scene `placeRef` matches {@link StoryPlaceRef.placeRef}). */
export type StoryPlaceRef = {
  placeRef: string;
  /** Human label — fleet slug, map name, etc. (host-specific). */
  label?: string;
  /** Scene role — primary visit site, transfer hub, home zone. */
  role?: string;
};
