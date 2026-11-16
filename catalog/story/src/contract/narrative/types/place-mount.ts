/** Place layout mount wire for SAM/AXM. */
import type { TwinfileRef } from '@local-hosting/twinfile-core/ref';

export type PlaceMountLayoutLevel = {
  id: string;
  label?: string;
  order?: number;
};

export type PlaceMountLayoutSpace = {
  id: string;
  label?: string;
  order?: number;
};

export type PlaceMountLayoutPathway = {
  id: string;
  label?: string;
};

/** Resolved place for scene binding (`placeRef`, spaces, optional geo). Hosts map external place twins at the boundary. */
export type PlaceMount = {
  placeRef: TwinfileRef;
  title: string;
  placeType?: string;
  geotypePrimary?: string;
  schemaOrgType?: string;
  spaceIds: readonly string[];
  defaultSpaceId?: string;
  geo?: { lat: number; lon: number };
  visitMomentIds?: readonly string[];
  defaultVisitMomentId?: string;
  layoutLevels?: readonly PlaceMountLayoutLevel[];
  layoutSpaces?: readonly PlaceMountLayoutSpace[];
  layoutPathways?: readonly PlaceMountLayoutPathway[];
};

/** @deprecated Use {@link PlaceMount}. */
export type TwinfilePlaceMount = PlaceMount;

/** @deprecated Use {@link PlaceMount}. */
export type SAMPlaceMount = PlaceMount;
