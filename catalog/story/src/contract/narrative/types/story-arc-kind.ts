/**
 * Six primary narrative arc shapes (Reagan et al. / Vonnegut; summarized by
 * [The Write Practice — story arcs](https://thewritepractice.com/story-arcs/)).
 */
export const STORY_ARC_KINDS = [
  /** Continuous rise (happy ending). */
  'rags_to_riches',
  /** Continuous fall (tragedy / decline). */
  'riches_to_rags',
  /** Fall then rise (“man in a hole”). */
  'man_in_a_hole',
  /** Rise then fall (Icarus / Freytag tragedy). */
  'icarus',
  /** Rise, fall, then rise (Cinderella / many hero journeys). */
  'cinderella',
  /** Fall, rise, then fall (Oedipus). */
  'oedipus',
] as const;

export type StoryArcKind = (typeof STORY_ARC_KINDS)[number];
