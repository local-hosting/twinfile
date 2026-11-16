import type { DramaticBeatId } from '../types/dramatic-beat.js';
import type { StoryArcKind } from '../types/story-arc-kind.js';
import type { StoryArcAct } from '../types/story-arc-template.js';

export type WritePracticeArcPreset = {
  kind: StoryArcKind;
  label: string;
  summary: string;
  /** Default beat rail for `acts/*.yml` when authors start from a kind. */
  defaultActs: StoryArcAct[];
};

const act = (id: DramaticBeatId, label: string, order: number): StoryArcAct => ({
  id,
  label,
  order,
});

export const WRITE_PRACTICE_ARC_PRESETS: Record<StoryArcKind, WritePracticeArcPreset> = {
  rags_to_riches: {
    kind: 'rags_to_riches',
    label: 'Rags to Riches',
    summary: 'Steady rise in fortune or capability toward a happy ending.',
    defaultActs: [
      act('exposition', 'Setup', 0),
      act('inciting_incident', 'Spark', 1),
      act('rising_action', 'Ascent', 2),
      act('climax', 'Peak', 3),
      act('denouement', 'Resolution', 4),
    ],
  },
  riches_to_rags: {
    kind: 'riches_to_rags',
    label: 'Riches to Rags',
    summary: 'Steady decline from a high starting point.',
    defaultActs: [
      act('exposition', 'High point', 0),
      act('inciting_incident', 'First crack', 1),
      act('rising_action', 'Complications', 2),
      act('climax', 'Bottom', 3),
      act('denouement', 'Aftermath', 4),
    ],
  },
  man_in_a_hole: {
    kind: 'man_in_a_hole',
    label: 'Man in a Hole',
    summary: 'Fall into trouble, then climb out (common product journey arc).',
    defaultActs: [
      act('exposition', 'Normal', 0),
      act('inciting_incident', 'Problem', 1),
      act('dilemma', 'Hole', 2),
      act('rising_action', 'Climb', 3),
      act('climax', 'Turn', 4),
      act('denouement', 'New normal', 5),
    ],
  },
  icarus: {
    kind: 'icarus',
    label: 'Icarus',
    summary: 'Rise then fall (Freytag / cautionary arc).',
    defaultActs: [
      act('exposition', 'Setup', 0),
      act('inciting_incident', 'Opportunity', 1),
      act('rising_action', 'Rise', 2),
      act('climax', 'Hubris', 3),
      act('denouement', 'Fall', 4),
    ],
  },
  cinderella: {
    kind: 'cinderella',
    label: 'Cinderella',
    summary: 'Rise, setback, then final rise (hero / romance arc).',
    defaultActs: [
      act('exposition', 'Ordinary world', 0),
      act('inciting_incident', 'Invitation', 1),
      act('rising_action', 'Success', 2),
      act('dilemma', 'Setback', 3),
      act('climax', 'Final trial', 4),
      act('denouement', 'Happily ever after', 5),
    ],
  },
  oedipus: {
    kind: 'oedipus',
    label: 'Oedipus',
    summary: 'Fall, recovery, then final fall (tragic twist).',
    defaultActs: [
      act('exposition', 'Fortune', 0),
      act('inciting_incident', 'Crack', 1),
      act('dilemma', 'Fall', 2),
      act('rising_action', 'False hope', 3),
      act('climax', 'Reversal', 4),
      act('denouement', 'Ruin', 5),
    ],
  },
};

export function defaultActsForStoryArcKind(kind: StoryArcKind): StoryArcAct[] {
  return WRITE_PRACTICE_ARC_PRESETS[kind].defaultActs.map((row) => ({ ...row }));
}
