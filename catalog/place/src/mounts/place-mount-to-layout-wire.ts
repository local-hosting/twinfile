import type { TwinfilePlaceMount } from '@local-hosting/twinfile-core';

import type { PlaceLayoutWire } from '../types/place-layout-wire.js';

/** Minimal place layout wire from a place mount. */
export function placeMountToPlaceLayout(mount: TwinfilePlaceMount): PlaceLayoutWire {
  return {
    version: 1,
    placeRef: mount.placeRef,
    title: mount.title,
    revision: 0,
    levels: [],
    spaces: mount.spaceIds.map((id) => ({ id, label: id })),
    pathways: [],
    ...(mount.geo ? { geo: mount.geo } : {}),
  };
}
