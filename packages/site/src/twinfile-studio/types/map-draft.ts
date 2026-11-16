export type LngLat = [number, number];

export type TwinfileGeometry =
  | { type: 'Point'; coordinates: LngLat }
  | { type: 'LineString'; coordinates: LngLat[] }
  | { type: 'Polygon'; coordinates: LngLat[][] };

export type TwinfileFeature = {
  type: 'Feature';
  geometry: TwinfileGeometry;
  properties: {
    id: string;
    file: string;
    name?: string;
    /** Chosen H3 cell for this place. */
    h3?: string;
    /** Pin synthesized from `ext.h3` only (golden bases) — not routable for Mapbox isochrones. */
    anchorH3?: boolean;
  };
};

export type MapCamera = {
  lat: number;
  lng: number;
  zoom: number;
};

/** Features and camera derived from the editor buffer. */
export type MapDraft = {
  features: TwinfileFeature[];
  camera: MapCamera;
  parseError?: string;
};

export type EditorSection = {
  path: string;
  body: string;
};
