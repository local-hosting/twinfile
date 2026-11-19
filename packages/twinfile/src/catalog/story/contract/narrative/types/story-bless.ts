/**
 * Story bless — assigns a JTBD **context** twin to a **character** for this episode.
 *
 * Character = who; context = When [Context], I want to [Goal], so I can [Outcome] without [Obstacle].
 */
export type StoryBlessBinding = {
  /** Character twin ref (`twinfile/character/<id>:<ver>` or bare id). */
  character: string;
  /** Context twin ref (`twinfile/context/<id>:<ver>` or bare id). */
  context: string;
};
