/** Golden place bases published under ghcr.io/doppler-group/twinfile/* (see examples base-*). */

import type { PlaceArchetype } from '@doppler-group/geotypes';

export { isPlaceArchetype, type PlaceArchetype } from '@doppler-group/geotypes';

export const DEFAULT_PLACE_BASE_REFS: Record<PlaceArchetype, string> = {
  single_level: 'twinfile/base-single-level:0.1.0',
  indoor_stack: 'twinfile/base-indoor-stack:0.1.0',
  campus: 'twinfile/base-campus:0.1.0',
  open_area: 'twinfile/base-open-area:0.1.0',
  linear: 'twinfile/base-linear:0.1.0',
};

export function placeBaseRefForArchetype(archetype: PlaceArchetype): string {
  return DEFAULT_PLACE_BASE_REFS[archetype];
}

/** Golden mixin for an event or decoration layer kit (see examples mixin-*). */
export function placeMixinRef(name: string): string {
  return `twinfile/mixin-${name}:0.1.0`;
}
