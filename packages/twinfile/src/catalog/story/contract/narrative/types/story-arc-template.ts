import type { DramaticBeatId } from './dramatic-beat.js';
import type { StoryArcKind } from './story-arc-kind.js';

export type StoryArcAct = {
  id: DramaticBeatId;
  label: string;
  order: number;
  summary?: string;
};

/**
 * Reusable narrative arc — {@link StoryArcKind} + dramatic beat rail for scenes.
 * @see https://thewritepractice.com/story-arcs/
 */
export type StoryArcTemplate = {
  id: string;
  label: string;
  /** One of the six primary arc shapes (Vonnegut / Reagan). */
  kind: StoryArcKind;
  description?: string;
  acts: StoryArcAct[];
};
