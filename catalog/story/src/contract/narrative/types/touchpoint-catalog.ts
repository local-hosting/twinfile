/**
 * SAM-owned touchpoint catalog slice — absorbs doppler `TouchpointGraphSpec` nodes for
 * phase classification and activity labels without a runtime dependency on @local-hosting/frameworks.
 */
export type SAMTouchpointLocus = 'physical' | 'digital' | 'blended';

export type SAMTouchpointDefinition = {
  id: string;
  label?: string;
  /** Authoring hint — e.g. `pre-visit`, `on-site` (doppler `journeyPhase`). */
  journeyPhase?: string;
  locus?: SAMTouchpointLocus;
  /**
   * Default venue for `physical` / `blended` touchpoints (`venue:*` / place mount key).
   * Scene-level or per-scene-touchpoint refs override at compile time.
   */
  venueKey?: string;
  spaceId?: string;
};

export type SAMTouchpointLink = {
  fromTouchpointId: string;
  toTouchpointId: string;
  label?: string;
};

export type SAMTouchpointCatalog = {
  hubTouchpointId?: string;
  touchpoints: readonly SAMTouchpointDefinition[];
  links?: readonly SAMTouchpointLink[];
};

/** Structural wire subset for adapters. */
export type TouchpointGraphWire = {
  hubTouchpointId?: string;
  touchpoints?: readonly {
    id: string;
    label?: string;
    journeyPhase?: string;
    locus?: SAMTouchpointLocus;
    venueKey?: string;
    spaceId?: string;
  }[];
  links?: readonly {
    fromTouchpointId: string;
    toTouchpointId: string;
    label?: string;
  }[];
};
