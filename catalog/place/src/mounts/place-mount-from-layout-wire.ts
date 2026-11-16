import type { TwinfilePlaceMount } from '@doppler-group/twinfile-core';

import type { PlaceLayoutWire } from '../types/place-layout-wire.js';

/** Map a parsed place layout wire back to a portable place mount. */
export function placeMountFromPlaceLayout(wire: PlaceLayoutWire): TwinfilePlaceMount {
  const spaceIds = (wire.spaces ?? []).map((row) => row.id).filter(Boolean);
  const defaultSpaceId = spaceIds[0];
  const visitMomentIds = wire.moments?.map((row) => row.id).filter(Boolean);
  return {
    placeRef: wire.placeRef,
    title: wire.title,
    spaceIds,
    ...(defaultSpaceId ? { defaultSpaceId } : {}),
    ...(wire.geo ? { geo: wire.geo } : {}),
    ...(wire.spaces?.length
      ? {
          layoutSpaces: wire.spaces.map((row) => ({
            id: row.id,
            ...(row.label ? { label: row.label } : {}),
            ...(row.order != null ? { order: row.order } : {}),
          })),
        }
      : {}),
    ...(wire.levels?.length
      ? {
          layoutLevels: wire.levels.map((row) => ({
            id: row.id,
            ...(row.label ? { label: row.label } : {}),
            ...(row.order != null ? { order: row.order } : {}),
          })),
        }
      : {}),
    ...(wire.pathways?.length ? { layoutPathways: wire.pathways.map((row) => ({ id: row.id })) } : {}),
    ...(visitMomentIds?.length
      ? {
          visitMomentIds,
          defaultVisitMomentId: visitMomentIds[0],
        }
      : {}),
  };
}
