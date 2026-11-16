import type { TwinfileRef } from './twinfile-ref.js';

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

/** Built or resolved Twinfile place — SAM/AXM place mount wire. */
export type TwinfilePlaceMount = {
  /** Unit ref the mount was resolved from; match mounts with `samePlaceRef` (kind + name, tag ignored). */
  placeRef: TwinfileRef;
  title: string;
  /** Resolved slug from manifest `geotype.primary`. */
  geotypePrimary?: string;
  /** Schema.org `@type` from geotypes crosswalk, when mapped. */
  schemaOrgType?: string;
  spaceIds: readonly string[];
  defaultSpaceId?: string;
  geo?: { lat: number; lon: number };
  /** Visit moment ids from `visits[]`, sorted by `order` (optional layout TOC). */
  visitMomentIds?: readonly string[];
  /** First visit moment by `order`. */
  defaultVisitMomentId?: string;
  /** From `place/levels.yaml`. */
  layoutLevels?: readonly PlaceMountLayoutLevel[];
  /** From `place/spaces.yaml` (labels and visit order). */
  layoutSpaces?: readonly PlaceMountLayoutSpace[];
  /** From `place/routes.yaml`. */
  layoutPathways?: readonly PlaceMountLayoutPathway[];
};

/** Ergonomic alias — same as {@link TwinfilePlaceMount}. */
export type PlaceMount = TwinfilePlaceMount;

export type ResolvePlaceMountOptions = {
  /**
   * Where place units are listed — `file:///path/to/examples` or `oci://ghcr.io/twinfile`.
   * Defaults to the monorepo place catalog.
   */
  placesCatalogUri?: string;
  /** Directory for OCI pull cache (default: os temp). */
  pullCacheDir?: string;
  /** OCI registry host override for `oci://` catalogs. */
  registry?: string;
};
