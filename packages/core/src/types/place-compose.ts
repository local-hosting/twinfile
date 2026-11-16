import type { PlaceArchetype, PlaceArchetypeAxes } from '@doppler-group/geotypes';

import type { ComposedBuildLayer } from './build-layer.js';
import type { PlaceData } from '../build/contract-checker.js';
import type { LoadedTwinfile } from '../load/load-twinfile.js';

/** Where a unit sits in a place compose stack (RFC 0004). */
export type PlaceComposeRole = 'from' | 'self';

export type PlaceComposeEntry = {
  loaded: LoadedTwinfile;
  role: PlaceComposeRole;
};

export type PlaceComposeLayer = ComposedBuildLayer;

export type ResolvedPlaceAxes = {
  axes: PlaceArchetypeAxes;
  archetype: PlaceArchetype;
};

export type ComposedPlace = {
  stack: PlaceComposeEntry[];
  layers: PlaceComposeLayer[];
  place: PlaceData;
  /** Set when any unit in the stack declares `axes:`. */
  axes?: ResolvedPlaceAxes;
};
