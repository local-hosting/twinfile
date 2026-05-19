/** PCM character mounted on this story run (see `@local-hosting/twinfile-character/pcm`). */
export type SAMCharacterRef = {
  pcmId: string;
  /** Cast label for multi-character episodes (e.g. driver, rider). */
  role?: string;
  /** Focal character when several PCMs are associated; one should be true. */
  primary?: boolean;
};

/** Venue mounted on this story run (scene `venueKey` matches {@link SAMVenueRef.venueKey}). */
export type SAMVenueRef = {
  venueKey: string;
  /** Human label — fleet slug, map name, etc. (host-specific). */
  label?: string;
  /** Scene role — primary visit site, transfer hub, home zone. */
  role?: string;
};
