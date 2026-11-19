import type { SegmentInterestV1 } from './segment-interests.schema.js';
import type { SegmentMindsetV1 } from './segment-mindset.schema.js';
import type { SegmentMotivationV1 } from './segment-motivation.schema.js';

/** Weighted segment member mix used to blend community-level psychographic facets. */
export type SegmentAffinityMember = {
  segmentId: string;
  affinityShare: number;
  mindset?: SegmentMindsetV1;
  interests?: SegmentInterestV1[];
  motivation?: SegmentMotivationV1;
};
