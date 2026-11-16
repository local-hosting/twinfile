/**
 * Dramatic structure beats for scene placement
 * ([The Write Practice — story arcs](https://thewritepractice.com/story-arcs/)).
 */
export const DRAMATIC_BEAT_IDS = [
  'exposition',
  'inciting_incident',
  'rising_action',
  'dilemma',
  'climax',
  'denouement',
] as const;

export type DramaticBeatId = (typeof DRAMATIC_BEAT_IDS)[number];
