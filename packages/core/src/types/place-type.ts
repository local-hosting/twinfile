/** Serialized on `Place.meta.placeType` after `twin build` (place units). */
export type PlaceTypeV1 = {
  schema: 'twinfile.place-type.v1';
  /** Accepted sparse controls (host / workbench), not compose `kind: event` timetables. */
  controls: PlaceControlAcceptV1[];
  dataInlets: PlaceDataPortV1[];
  dataOutlets: PlaceDataPortV1[];
  /** Always emitted by `twin build` for hosts (`Place.meta.placeType` snapshot). */
  logicalOutputs: PlaceLogicalPortV1[];
};

export type PlaceLogicalPortV1 = {
  id: string;
  wire: string;
  detail: string;
};

export type PlaceControlAcceptV1 = {
  id: string;
  wire: string;
  phases?: string[];
  /** Processor module + port hosts should target (e.g. signal-hub `trigger`). */
  inlet?: { module: string; port: string };
};

export type PlaceDataPortV1 = {
  id: string;
  wire: string;
  module: string;
  port: string;
  direction: 'in' | 'out';
};
