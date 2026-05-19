/** Venue layout mount wire for SAM/AXM. */

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

/** Resolved venue for scene binding (`venueKey`, spaces, optional geo). Hosts map external place twins at the boundary. */
export type PlaceMount = {
  venueKey: string;
  title: string;
  venueType?: string;
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
