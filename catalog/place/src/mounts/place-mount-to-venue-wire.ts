import type { TwinfilePlaceMount } from '@doppler-group/twinfile-core';

import type { VenueLayoutMountWire } from '../types/venue-layout-mount-wire.js';

/** Minimal venue layout wire from a place mount. */
export function placeMountToVenueLayoutWire(mount: TwinfilePlaceMount): VenueLayoutMountWire {
  return {
    version: 1,
    id: mount.venueKey,
    title: mount.title,
    revision: 0,
    levels: [],
    spaces: mount.spaceIds.map((id) => ({ id, label: id })),
    pathways: [],
    ...(mount.geo ? { geo: mount.geo } : {}),
  };
}
