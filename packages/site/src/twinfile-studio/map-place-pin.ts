import { PLACE_DEMO_EXT_H3 } from '@doppler-group/twinfile-place/place/demo-ext-h3';

import type { TwinfileFeature } from './types/map-draft.js';

const DEMO_H3_CELLS = new Set(Object.values(PLACE_DEMO_EXT_H3).map((index) => index.toLowerCase()));

/** Mapbox isochrones need a routable lat/lon — skip golden demo cells and synthesized H3-only pins. */
export function placePinSupportsIsochrone(feature: TwinfileFeature): boolean {
  if (feature.geometry.type !== 'Point') return false;
  if (feature.properties.anchorH3) return false;
  const h3 = feature.properties.h3?.trim().toLowerCase();
  if (h3 && DEMO_H3_CELLS.has(h3)) return false;
  return true;
}
