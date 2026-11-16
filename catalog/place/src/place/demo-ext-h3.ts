import type { PlaceArchetype } from '@doppler-group/geotypes';

/**
 * Fictional mid-Atlantic catalog cells (resolution 9) for scaffold and golden bases.
 * Pair with `ext.lat` / `ext.lon` at 0 — layout checks only, not a real map site.
 */
export const PLACE_DEMO_EXT_H3: Record<PlaceArchetype, string> = {
  campus: '893a4484a2bffff',
  open_area: '893a4484a63ffff',
  linear: '893a4484a67ffff',
  single_level: '893a4484a6bffff',
  indoor_stack: '893a4484a6fffff',
};
