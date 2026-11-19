import type { TwinfileRef } from '@local-hosting/twinfile';

/** Portable place layout wire (levels, spaces, pathways) keyed by the place unit ref. */
export type PlaceLayoutWire = {
  version?: number;
  placeRef: TwinfileRef;
  title: string;
  revision?: number;
  geo?: { lat: number; lon: number };
  levels?: ReadonlyArray<{ id: string; label?: string; order?: number }>;
  spaces?: ReadonlyArray<{ id: string; label?: string; order?: number }>;
  pathways?: ReadonlyArray<{ id: string }>;
  moments?: ReadonlyArray<{ id: string }>;
  fixtures?: ReadonlyArray<{ id: string }>;
};

export type PlaceLayoutAxmContribution = {
  placeRef: TwinfileRef;
  levels: NonNullable<PlaceLayoutWire['levels']>;
  spaces: NonNullable<PlaceLayoutWire['spaces']>;
  pathways: NonNullable<PlaceLayoutWire['pathways']>;
  moments?: PlaceLayoutWire['moments'];
  fixtures?: PlaceLayoutWire['fixtures'];
};
