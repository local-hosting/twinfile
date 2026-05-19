/** On-disk venue layout wire (legacy host trees). */
export type VenueLayoutMountWire = {
  version?: number;
  id: string;
  title: string;
  revision?: number;
  geo?: { lat: number; lon: number };
  levels?: ReadonlyArray<{ id: string; label?: string; order?: number }>;
  spaces?: ReadonlyArray<{ id: string; label?: string; order?: number }>;
  pathways?: ReadonlyArray<{ id: string }>;
  moments?: ReadonlyArray<{ id: string }>;
  fixtures?: ReadonlyArray<{ id: string }>;
};

export type VenueLayoutAxmContribution = {
  venueKey: string;
  levels: NonNullable<VenueLayoutMountWire['levels']>;
  spaces: NonNullable<VenueLayoutMountWire['spaces']>;
  pathways: NonNullable<VenueLayoutMountWire['pathways']>;
  moments?: VenueLayoutMountWire['moments'];
  fixtures?: VenueLayoutMountWire['fixtures'];
};
