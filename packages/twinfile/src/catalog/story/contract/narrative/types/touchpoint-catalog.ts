/**
 * Story-owned touchpoint catalog slice — absorbs doppler `TouchpointGraphSpec` nodes for
 * phase classification and activity labels without a runtime dependency on @local-hosting/frameworks.
 */
export type StoryTouchpointLocus = 'physical' | 'digital' | 'blended';

export type StoryTouchpointDefinition = {
  id: string;
  label?: string;
  /** Authoring hint — e.g. `pre-visit`, `on-site` (doppler `journeyPhase`). */
  journeyPhase?: string;
  locus?: StoryTouchpointLocus;
  /**
   * Default place for `physical` / `blended` touchpoints (`place:*` / place mount key).
   * Scene-level or per-scene-touchpoint refs override at compile time.
   */
  placeRef?: string;
  spaceId?: string;
};

export type StoryTouchpointLink = {
  fromTouchpointId: string;
  toTouchpointId: string;
  label?: string;
};

export type StoryTouchpointCatalog = {
  hubTouchpointId?: string;
  touchpoints: readonly StoryTouchpointDefinition[];
  links?: readonly StoryTouchpointLink[];
};

/** Structural wire subset for adapters. */
export type TouchpointGraphWire = {
  hubTouchpointId?: string;
  touchpoints?: readonly {
    id: string;
    label?: string;
    journeyPhase?: string;
    locus?: StoryTouchpointLocus;
    placeRef?: string;
    spaceId?: string;
  }[];
  links?: readonly {
    fromTouchpointId: string;
    toTouchpointId: string;
    label?: string;
  }[];
};
