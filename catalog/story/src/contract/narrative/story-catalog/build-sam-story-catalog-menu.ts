import type { PCM } from '@doppler-group/twinfile-character/pcm';
import type { PlaceMount } from '../types/place-mount.js';

import type { SAM } from '../types/sam.js';
import type { SamStoryCatalogMenuV1 } from '../types/story-catalog-menu.js';

/** Build user catalog menu from PCM + SAM only (no place mounts). */
export function buildSamUserCatalogMenu(input: {
  pcms: readonly PCM[];
  sams: readonly SAM[];
}): SamStoryCatalogMenuV1 {
  return {
    characters: input.pcms.map((pcm) => ({
      pcmId: pcm.persona.id,
      label: pcm.persona.label?.trim() || pcm.title?.trim() || pcm.persona.id,
      journeyIds: (pcm.journeys ?? []).map((row) => row.id),
    })),
    episodes: input.sams.map((sam) => ({
      id: sam.id,
      title: sam.title?.trim() || sam.id,
      focalPcmId: sam.binding.pcmId,
      journeyId: sam.binding.journeyId,
    })),
  };
}

/** Build full catalog menu including optional place mounts (admin / touchpoint tooling). */
export function buildSamStoryCatalogMenu(input: {
  pcms: readonly PCM[];
  placeMounts?: readonly PlaceMount[];
  sams: readonly SAM[];
}): SamStoryCatalogMenuV1 {
  const userMenu = buildSamUserCatalogMenu({ pcms: input.pcms, sams: input.sams });
  const placeMounts = input.placeMounts ?? [];
  if (placeMounts.length === 0) {
    return userMenu;
  }
  return {
    ...userMenu,
    placeVenues: placeMounts.map((mount) => ({
      venueKey: mount.venueKey,
      title: mount.title?.trim() || mount.venueKey,
    })),
  };
}

export function samStoryCatalogMenuHasEpisodes(menu: SamStoryCatalogMenuV1): boolean {
  return menu.episodes.length > 0 && menu.characters.length > 0;
}
