import type { CulturalCompositionEntryV1 } from './segment-cultural-profile.schema.js';
import type { SegmentReachabilityV1 } from './segment-motivation.schema.js';

/** H3 cell community mindset derived from segment geo-audience facets. */
export type CellCommunityMindsetV1 = {
  think: string[];
  feel: {
    positive: string[];
    negative: string[];
  };
  beliefs: Array<{ statement: string; strength: number }>;
};

export type CellCommunityMotivationV1 = {
  visitDrivers: string[];
  purchaseDrivers: string[];
  switchingTriggers: string[];
  messagingHooks: string[];
  barriers: string[];
  reach?: SegmentReachabilityV1;
};

export type CellCommunityInterestV1 = {
  id: string;
  label: string;
  affinityShare: number;
  themes: string[];
};

export type CellCulturalIdentityV1 = {
  residentEthnicity: CulturalCompositionEntryV1[];
  language?: { label: string; sharePct?: number };
  generation?: { label: string; sharePct?: number };
  memberEthnicity?: CulturalCompositionEntryV1[];
  implications: string[];
};
