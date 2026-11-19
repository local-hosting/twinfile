export type SegmentDimension = {
  id: string;
  label: string;
  values: string[];
};

export type Audience = {
  id: string;
  label?: string;
  characterId: string;
  /** Thinking style this audience wears for the campaign context. */
  thinkingStyleId?: string;
  dimensions: Record<string, string | string[]>;
  campaign?: string;
};
